/**
 * Cloudflare Worker with KV Leaderboard
 */

export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);
    
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // API Routes
    if (url.pathname === '/api/leaderboard/submit' && request.method === 'POST') {
      return handleScoreSubmit(request, env, corsHeaders);
    }
    
    if (url.pathname === '/api/leaderboard/top' && request.method === 'GET') {
      return handleGetLeaderboard(env, corsHeaders);
    }
    
    // Handle leaderboard route
    if (url.pathname === '/leaderboard' || url.pathname === '/leaderboard/') {
      // Serve the leaderboard.html file
      const leaderboardRequest = new Request(new URL('/leaderboard.html', request.url), request);
      return env.ASSETS.fetch(leaderboardRequest);
    }
    
    // Serve static assets from the dist directory
    return env.ASSETS.fetch(request);
  },
};

async function handleScoreSubmit(request, env, corsHeaders) {
  try {
    const { username, score, wave, gameId } = await request.json();
    
    if (!username || typeof score !== 'number') {
      return new Response(JSON.stringify({ error: 'Invalid data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Skip if no KV binding
    if (!env.LEADERBOARD) {
      return new Response(JSON.stringify({ error: 'Leaderboard not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    const timestamp = Date.now();
    
    // CRITICAL FIX: Use gameId to prevent duplicate entries from same game!
    // If no gameId provided, generate one (for backwards compatibility)
    const uniqueGameId = gameId || `game_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if this game already has an entry
    if (gameId) {
      // List all scores for this user to find existing game entry
      const userScores = await env.LEADERBOARD.list({ prefix: `score:${username}:` });
      
      for (const key of userScores.keys) {
        const existingData = await env.LEADERBOARD.get(key.name);
        if (existingData) {
          const parsed = JSON.parse(existingData);
          if (parsed.gameId === gameId) {
            // Found existing entry for this game
            if (score <= parsed.score) {
              // New score is not higher, ignore it
              console.log(`Ignoring lower score ${score} for game ${gameId}, keeping ${parsed.score}`);
              return new Response(JSON.stringify({ success: true, message: 'Score not improved' }), {
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
            } else {
              // Delete the old lower score
              console.log(`Replacing score ${parsed.score} with higher ${score} for game ${gameId}`);
              await env.LEADERBOARD.delete(key.name);
            }
          }
        }
      }
    }
    
    // Store new score with username in the key for efficient lookup
    const key = `score:${username}:${timestamp}`;
    
    await env.LEADERBOARD.put(key, JSON.stringify({
      username,
      score,
      wave: wave || null,
      timestamp,
      gameId: uniqueGameId  // Store gameId to track unique games
    }), {
      expirationTtl: 86400 * 30 // 30 days
    });
    
    // Update all-time high if needed
    const allTimeKey = `alltime:${username}`;
    const existing = await env.LEADERBOARD.get(allTimeKey);
    const existingScore = existing ? JSON.parse(existing).score : 0;
    
    if (score > existingScore) {
      await env.LEADERBOARD.put(allTimeKey, JSON.stringify({
        username,
        score,
        wave: wave || null,
        timestamp,
        gameId: uniqueGameId
      }));
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Score submit error:', error);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

async function handleGetLeaderboard(env, corsHeaders) {
  try {
    // Return empty if no KV binding
    if (!env.LEADERBOARD) {
      return new Response(JSON.stringify({
        allTime: [],
        last24h: [],
        topPlayer: null
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Get all-time scores
    const list = await env.LEADERBOARD.list({ prefix: 'alltime:', limit: 100 });
    
    const scores = await Promise.all(
      list.keys.map(async (key) => {
        const data = await env.LEADERBOARD.get(key.name);
        return data ? JSON.parse(data) : null;
      })
    );
    
    // Filter null and sort by score descending
    const validScores = scores.filter(s => s !== null);
    validScores.sort((a, b) => b.score - a.score);
    
    // Get top 10 all-time
    const allTime = validScores.slice(0, 10);
    
    // Get recent scores (last 24h)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentList = await env.LEADERBOARD.list({ prefix: 'score:', limit: 1000 });
    
    // Map to track highest score per gameId (to prevent duplicates from same game)
    const gameHighScores = new Map();
    
    for (const key of recentList.keys) {
      const parts = key.name.split(':');
      // Format is now: score:username:timestamp
      if (parts.length >= 3) {
        // FIX: timestamp in key is Unix seconds, but stored data has milliseconds
        // Just get the data and check its timestamp instead
        const data = await env.LEADERBOARD.get(key.name);
        if (data) {
          const scoreData = JSON.parse(data);
          
          // Check if score is within last 24 hours using actual timestamp from data
          if (scoreData.timestamp && scoreData.timestamp > dayAgo) {
            // Only keep highest score per gameId
            if (scoreData.gameId) {
              const existing = gameHighScores.get(scoreData.gameId);
              if (!existing || scoreData.score > existing.score) {
                gameHighScores.set(scoreData.gameId, scoreData);
              }
            } else {
              // No gameId means old entry, include it
              gameHighScores.set(`legacy_${key.name}`, scoreData);
            }
          }
        }
      }
    }
    
    // Convert map to array and sort
    const recentScores = Array.from(gameHighScores.values());
    recentScores.sort((a, b) => b.score - a.score);
    const last24h = recentScores.slice(0, 10);
    
    // Calculate stats
    const uniquePlayersAll = new Set(validScores.map(s => s.username));
    const uniquePlayers24h = new Set(recentScores.map(s => s.username));
    
    return new Response(JSON.stringify({
      allTime,
      last24h,
      topPlayer: last24h[0] || null, // Changed to 24h top leader
      totalPlayers: uniquePlayersAll.size,
      playersLast24h: uniquePlayers24h.size
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return new Response(JSON.stringify({ 
      allTime: [],
      last24h: [],
      topPlayer: null,
      error: 'Server error' 
    }), {
      status: 200, // Return 200 to not break the app
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}