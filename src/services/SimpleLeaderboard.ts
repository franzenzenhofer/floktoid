/**
 * KISS Leaderboard - Just submit the damn score!
 */

export class SimpleLeaderboard {
  static async submit(score: number, wave: number): Promise<boolean> {
    try {
      // Generate a simple username if needed
      const username = `Player${Math.floor(Math.random() * 10000)}`;
      const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`[LEADERBOARD] Submitting: ${username} - Score: ${score}, Wave: ${wave}`);
      
      const response = await fetch('/api/leaderboard/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score, wave, gameId })
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('[LEADERBOARD] ✅ Score submitted successfully!');
        // Show visual feedback
        const msg = document.createElement('div');
        msg.textContent = '✅ Score Submitted!';
        msg.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #00ff00;
          color: black;
          padding: 20px;
          font-size: 24px;
          font-weight: bold;
          border-radius: 10px;
          z-index: 99999;
          animation: fadeOut 3s forwards;
        `;
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 3000);
        
        return true;
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('[LEADERBOARD] ❌ Submission failed:', error);
      
      // Show error feedback
      const msg = document.createElement('div');
      msg.textContent = '❌ Score submission failed!';
      msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff0000;
        color: white;
        padding: 20px;
        font-size: 24px;
        font-weight: bold;
        border-radius: 10px;
        z-index: 99999;
      `;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
      
      return false;
    }
  }
}

// Add CSS animation
if (!document.getElementById('leaderboard-animations')) {
  const style = document.createElement('style');
  style.id = 'leaderboard-animations';
  style.textContent = `
    @keyframes fadeOut {
      0% { opacity: 1; }
      70% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}