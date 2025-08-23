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

    // Handle generic leaderboard API endpoint
    if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
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
    console.log('handleGetLeaderboard called');
    
    // Return empty if no KV binding
    if (!env.LEADERBOARD) {
      console.error('No LEADERBOARD KV binding found');
      return new Response(JSON.stringify({
        allTime: [],
        last24h: [],
        topPlayer: null,
        error: 'No KV binding'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    console.log('KV binding exists, fetching list...');
    
    // Get all-time scores - limit to 20 to avoid API limits
    const list = await env.LEADERBOARD.list({ prefix: 'alltime:', limit: 20 });
    console.log('Found alltime entries:', list.keys.length);
    
    // Batch fetch using limited concurrent requests
    const batchSize = 5;
    const scores = [];
    
    for (let i = 0; i < list.keys.length; i += batchSize) {
      const batch = list.keys.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (key) => {
          try {
            const data = await env.LEADERBOARD.get(key.name);
            return data ? JSON.parse(data) : null;
          } catch (err) {
            console.error(`Error fetching ${key.name}:`, err);
            return null;
          }
        })
      );
      scores.push(...batchResults.filter(s => s !== null));
    }
    
    // Filter null and sort by score descending
    const validScores = scores.filter(s => s !== null);
    validScores.sort((a, b) => b.score - a.score);
    
    // Get top 10 all-time
    const allTime = validScores.slice(0, 10);
    
    // Get recent scores (last 24h) - use a smarter approach
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    // Fetch ALL score keys (just keys, not values) to find recent ones
    const allScoreKeys = [];
    let cursor = undefined;
    
    // Fetch keys in batches to avoid timeout
    for (let i = 0; i < 5; i++) {
      const batch = await env.LEADERBOARD.list({ 
        prefix: 'score:', 
        limit: 1000,
        cursor 
      });
      allScoreKeys.push(...batch.keys);
      cursor = batch.cursor;
      if (!cursor || batch.keys.length < 1000) break;
    }
    
    console.log(`Found ${allScoreKeys.length} total score keys`);
    
    // Filter to recent scores based on timestamp in key name
    // Keys are in format: score:username:timestamp
    const recentKeys = allScoreKeys.filter(key => {
      const parts = key.name.split(':');
      if (parts.length >= 3) {
        const timestamp = parseInt(parts[2]);
        return !isNaN(timestamp) && timestamp > dayAgo;
      }
      return false;
    });
    
    console.log(`Found ${recentKeys.length} recent score keys`);
    
    // Limit to 50 most recent to avoid API limits
    const recentList = {
      keys: recentKeys.slice(-50)
    };
    
    // Map to track highest score per gameId (to prevent duplicates from same game)
    const gameHighScores = new Map();
    
    // Batch fetch recent scores
    for (let i = 0; i < recentList.keys.length; i += batchSize) {
      const batch = recentList.keys.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (key) => {
          try {
            const parts = key.name.split(':');
            // Format is now: score:username:timestamp
            if (parts.length >= 3) {
              const data = await env.LEADERBOARD.get(key.name);
              if (data) {
                const scoreData = JSON.parse(data);
                
                // Check if score is within last 24 hours using actual timestamp from data
                if (scoreData.timestamp && scoreData.timestamp > dayAgo) {
                  return scoreData;
                }
              }
            }
            return null;
          } catch (err) {
            console.error(`Error fetching recent ${key.name}:`, err);
            return null;
          }
        })
      );
      
      // Process batch results
      for (const scoreData of batchResults) {
        if (scoreData) {
          // Only keep highest score per gameId
          if (scoreData.gameId) {
            const existing = gameHighScores.get(scoreData.gameId);
            if (!existing || scoreData.score > existing.score) {
              gameHighScores.set(scoreData.gameId, scoreData);
            }
          } else {
            // No gameId means old entry, include it
            gameHighScores.set(`legacy_${Math.random()}`, scoreData);
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
      error: error.message || 'Server error',
      errorStack: error.stack
    }), {
      status: 200, // Return 200 to not break the app
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}