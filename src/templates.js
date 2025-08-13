/**
 * HTML template for the game
 */

export const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Color Me Same - Puzzle Game</title>
  <meta name="description" content="A challenging puzzle game where you make all tiles the same color">
  <link rel="manifest" href="/manifest.json">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      color: white;
    }
    
    .game-container {
      max-width: 600px;
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 20px;
      padding: 2rem;
      backdrop-filter: blur(10px);
    }
    
    h1 {
      text-align: center;
      margin-bottom: 1rem;
      font-size: 2.5rem;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .dashboard {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 10px;
    }
    
    .stat {
      text-align: center;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .stat-label {
      font-size: 0.875rem;
      opacity: 0.8;
    }
    
    .game-board {
      display: grid;
      gap: 0.5rem;
      margin-bottom: 2rem;
      background: rgba(0, 0, 0, 0.3);
      padding: 1rem;
      border-radius: 10px;
    }
    
    .tile {
      aspect-ratio: 1;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .tile:hover {
      transform: scale(1.05);
    }
    
    .tile:active {
      transform: scale(0.95);
    }
    
    .tile.locked {
      cursor: not-allowed;
      opacity: 0.6;
    }
    
    .tile.power::after {
      content: '⚡';
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.875rem;
    }
    
    .tile.locked::after {
      content: '🔒';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.5rem;
    }
    
    .power-ups {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .power-up {
      background: rgba(0, 0, 0, 0.3);
      border: 2px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 1rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
    }
    
    .power-up:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }
    
    .power-up:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .power-up-icon {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }
    
    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    
    button {
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    button:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-2px);
    }
    
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .modal.active {
      display: flex;
    }
    
    .modal-content {
      background: white;
      color: #333;
      padding: 2rem;
      border-radius: 20px;
      max-width: 400px;
      width: 90%;
      text-align: center;
    }
    
    .victory-emoji {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .loading {
      text-align: center;
      padding: 2rem;
    }
    
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 3px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .tile-change {
      animation: tileFlip 0.3s ease;
    }
    
    @keyframes tileFlip {
      0% { transform: rotateY(0deg); }
      50% { transform: rotateY(90deg); }
      100% { transform: rotateY(0deg); }
    }
    
    @media (max-width: 480px) {
      .game-container {
        padding: 1rem;
      }
      
      h1 {
        font-size: 1.75rem;
      }
      
      .dashboard {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }
    
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <h1>Color Me Same</h1>
    
    <div id="menu" class="menu">
      <h2>Choose Difficulty</h2>
      <div class="difficulty-buttons">
        <button onclick="startGame('easy')">Easy (3x3)</button>
        <button onclick="startGame('medium')">Medium (4x4)</button>
        <button onclick="startGame('hard')">Hard (5x5)</button>
        <button onclick="startGame('expert')">Expert (6x6)</button>
      </div>
    </div>
    
    <div id="game" style="display: none;">
      <div class="dashboard">
        <div class="stat">
          <div class="stat-value" id="moves">0</div>
          <div class="stat-label">Moves</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="time">0:00</div>
          <div class="stat-label">Time</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="score">0</div>
          <div class="stat-label">Score</div>
        </div>
        <div class="stat">
          <div class="stat-value" id="difficulty">Easy</div>
          <div class="stat-label">Level</div>
        </div>
      </div>
      
      <div class="game-board" id="board"></div>
      
      <div class="power-ups">
        <button class="power-up" id="wildcard" onclick="usePowerUp('wildcard')">
          <div class="power-up-icon">🎲</div>
          <div>Wildcard</div>
        </button>
        <button class="power-up" id="freeze" onclick="usePowerUp('freeze')">
          <div class="power-up-icon">❄️</div>
          <div>Freeze</div>
        </button>
        <button class="power-up" id="reset" onclick="usePowerUp('reset')">
          <div class="power-up-icon">↩️</div>
          <div>Reset</div>
        </button>
      </div>
      
      <div class="controls">
        <button onclick="showHint()">💡 Hint</button>
        <button onclick="showSolution()">🎯 Solution</button>
        <button onclick="newGame()">🔄 New Game</button>
        <button onclick="backToMenu()">🏠 Menu</button>
      </div>
    </div>
    
    <div id="loading" class="loading" style="display: none;">
      <div class="spinner"></div>
      <p>Generating puzzle...</p>
    </div>
  </div>
  
  <div id="victoryModal" class="modal">
    <div class="modal-content">
      <div class="victory-emoji">🎉</div>
      <h2>Puzzle Solved!</h2>
      <p id="victoryStats"></p>
      <button onclick="newGame()">New Puzzle</button>
      <button onclick="backToMenu()">Back to Menu</button>
    </div>
  </div>
  
  <script>
    // Game state
    let gameState = {
      grid: [],
      moves: 0,
      time: 0,
      score: 0,
      difficulty: 'easy',
      powerTiles: [],
      lockedTiles: {},
      solution: [],
      config: {},
      gameActive: false,
      timer: null
    };
    
    // Initialize game
    async function startGame(difficulty) {
      document.getElementById('menu').style.display = 'none';
      document.getElementById('loading').style.display = 'block';
      
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ difficulty })
        });
        
        const puzzle = await response.json();
        
        gameState = {
          ...gameState,
          grid: puzzle.grid,
          difficulty: difficulty,
          powerTiles: puzzle.powerTiles,
          lockedTiles: puzzle.lockedTiles,
          solution: puzzle.solution,
          config: puzzle.config,
          moves: 0,
          time: 0,
          score: 0,
          gameActive: true
        };
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('game').style.display = 'block';
        document.getElementById('difficulty').textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
        renderBoard();
        startTimer();
      } catch (error) {
        console.error('Failed to generate puzzle:', error);
        document.getElementById('loading').style.display = 'none';
        document.getElementById('menu').style.display = 'block';
      }
    }
    
    // Render game board
    function renderBoard() {
      const board = document.getElementById('board');
      const size = gameState.grid.length;
      board.style.gridTemplateColumns = \`repeat(\${size}, 1fr)\`;
      board.innerHTML = '';
      
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const tile = document.createElement('button');
          tile.className = 'tile';
          tile.style.backgroundColor = getColorForValue(gameState.grid[r][c]);
          
          const key = \`\${r}-\${c}\`;
          if (gameState.powerTiles.includes(key)) {
            tile.classList.add('power');
          }
          if (gameState.lockedTiles[key]) {
            tile.classList.add('locked');
          }
          
          tile.onclick = () => handleTileClick(r, c);
          board.appendChild(tile);
        }
      }
    }
    
    // Handle tile click
    async function handleTileClick(row, col) {
      if (!gameState.gameActive) return;
      
      const key = \`\${row}-\${col}\`;
      if (gameState.lockedTiles[key]) return;
      
      try {
        const response = await fetch('/api/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grid: gameState.grid,
            row,
            col,
            power: new Set(gameState.powerTiles),
            locked: new Map(Object.entries(gameState.lockedTiles)),
            colors: gameState.config.colors
          })
        });
        
        const result = await response.json();
        
        gameState.grid = result.grid;
        gameState.moves++;
        document.getElementById('moves').textContent = gameState.moves;
        
        // Animate changed tiles
        animateTileChanges(result.changedTiles);
        
        // Update locked tiles
        for (const [k, v] of Object.entries(gameState.lockedTiles)) {
          if (v > 1) {
            gameState.lockedTiles[k] = v - 1;
          } else {
            delete gameState.lockedTiles[k];
          }
        }
        
        renderBoard();
        
        if (result.won) {
          endGame();
        }
      } catch (error) {
        console.error('Failed to apply move:', error);
      }
    }
    
    // Animate tile changes
    function animateTileChanges(changedTiles) {
      changedTiles.forEach(({ row, col }) => {
        const index = row * gameState.grid.length + col;
        const tiles = document.querySelectorAll('.tile');
        if (tiles[index]) {
          tiles[index].classList.add('tile-change');
          setTimeout(() => tiles[index].classList.remove('tile-change'), 300);
        }
      });
    }
    
    // Timer
    function startTimer() {
      gameState.timer = setInterval(() => {
        gameState.time++;
        const minutes = Math.floor(gameState.time / 60);
        const seconds = gameState.time % 60;
        document.getElementById('time').textContent = \`\${minutes}:\${seconds.toString().padStart(2, '0')}\`;
        
        // Check time limit
        if (gameState.config.timeLimit && gameState.time >= gameState.config.timeLimit) {
          endGame();
        }
      }, 1000);
    }
    
    // End game
    async function endGame() {
      gameState.gameActive = false;
      clearInterval(gameState.timer);
      
      // Calculate score
      const score = calculateScore();
      gameState.score = score;
      document.getElementById('score').textContent = score;
      
      // Show victory modal
      const stats = \`
        Moves: \${gameState.moves}<br>
        Optimal: \${gameState.solution.length}<br>
        Time: \${Math.floor(gameState.time / 60)}:\${(gameState.time % 60).toString().padStart(2, '0')}<br>
        Score: \${score}
      \`;
      document.getElementById('victoryStats').innerHTML = stats;
      document.getElementById('victoryModal').classList.add('active');
      
      // Submit score to leaderboard
      try {
        await fetch('/api/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Player',
            score,
            moves: gameState.moves,
            time: gameState.time,
            difficulty: gameState.difficulty
          })
        });
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
    
    // Calculate score
    function calculateScore() {
      const baseScore = 1000;
      const efficiencyBonus = gameState.solution.length 
        ? Math.round((gameState.solution.length / gameState.moves) * 100) * 10 
        : 0;
      const timeBonus = gameState.config.timeLimit 
        ? Math.max(0, (gameState.config.timeLimit - gameState.time) * 5)
        : 500;
      
      const difficultyMultiplier = {
        easy: 1,
        medium: 1.5,
        hard: 2,
        expert: 3
      }[gameState.difficulty] || 1;
      
      return Math.round((baseScore + efficiencyBonus + timeBonus) * difficultyMultiplier);
    }
    
    // Power-ups
    function usePowerUp(type) {
      // Implement power-up logic
      console.log('Power-up:', type);
    }
    
    // Show hint
    function showHint() {
      if (gameState.solution.length > 0) {
        const nextMove = gameState.solution[0];
        const index = nextMove.row * gameState.grid.length + nextMove.col;
        const tiles = document.querySelectorAll('.tile');
        if (tiles[index]) {
          tiles[index].style.boxShadow = '0 0 20px yellow';
          setTimeout(() => tiles[index].style.boxShadow = '', 2000);
        }
      }
    }
    
    // Show solution
    function showSolution() {
      console.log('Solution:', gameState.solution);
    }
    
    // New game
    function newGame() {
      document.getElementById('victoryModal').classList.remove('active');
      startGame(gameState.difficulty);
    }
    
    // Back to menu
    function backToMenu() {
      clearInterval(gameState.timer);
      gameState.gameActive = false;
      document.getElementById('game').style.display = 'none';
      document.getElementById('victoryModal').classList.remove('active');
      document.getElementById('menu').style.display = 'block';
    }
    
    // Helper: Get color for value
    function getColorForValue(value) {
      const colors = ['#FF4444', '#44DD44', '#4444FF', '#FFAA00', '#AA44FF', '#44DDDD'];
      return colors[value] || '#000000';
    }
  </script>
</body>
</html>`;

export const manifest = {
  "name": "Color Me Same",
  "short_name": "ColorMeSame",
  "description": "A challenging puzzle game where you make all tiles the same color",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#667eea",
  "theme_color": "#667eea",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
};