var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/itty-router/index.mjs
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: t = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: (o3, s2, r, n) => "handle" == s2 ? r.fetch : (o4, ...a) => t.push([s2.toUpperCase?.(), RegExp(`^${(n = (e2 + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), a, n]) && r }), routes: t, ...o2, async fetch(e3, ...o3) {
  let s2, r, n = new URL(e3.url), a = e3.query = { __proto__: null };
  for (let [e4, t2] of n.searchParams)
    a[e4] = a[e4] ? [].concat(a[e4], t2) : t2;
  for (let [a2, c2, i2, l2] of t)
    if ((a2 == e3.method || "ALL" == a2) && (r = n.pathname.match(c2))) {
      e3.params = r.groups || {}, e3.route = l2;
      for (let t2 of i2)
        if (null != (s2 = await t2(e3.proxy ?? e3, ...o3)))
          return s2;
    }
} }), "e");
var o = /* @__PURE__ */ __name((e2 = "text/plain; charset=utf-8", t) => (o2, { headers: s2 = {}, ...r } = {}) => void 0 === o2 || "Response" === o2?.constructor.name ? o2 : new Response(t ? t(o2) : o2, { headers: { "content-type": e2, ...s2.entries ? Object.fromEntries(s2) : s2 }, ...r }), "o");
var s = o("application/json; charset=utf-8", JSON.stringify);
var c = o("text/plain; charset=utf-8", String);
var i = o("text/html");
var l = o("image/jpeg");
var p = o("image/png");
var d = o("image/webp");

// src/game-logic.js
var GAME_CONFIG = {
  COLOR_PALETTE: ["#FF4444", "#44DD44", "#4444FF", "#FFAA00", "#AA44FF", "#44DDDD"],
  COLOR_NAMES: ["Red", "Green", "Blue", "Orange", "Purple", "Cyan"],
  DIFFICULTIES: {
    easy: {
      size: 3,
      colors: 3,
      reverseSteps: 3,
      maxMoves: 0,
      maxLockedTiles: 0,
      powerTileChance: 0,
      timeLimit: 0,
      tutorialEnabled: true,
      description: "Perfect for learning! No limits, full tutorial."
    },
    medium: {
      size: 4,
      colors: 4,
      reverseSteps: 5,
      maxMoves: 25,
      maxLockedTiles: 1,
      powerTileChance: 0.1,
      timeLimit: 0,
      tutorialEnabled: false,
      description: "More complex puzzles with special tiles."
    },
    hard: {
      size: 5,
      colors: 4,
      reverseSteps: 7,
      maxMoves: 35,
      maxLockedTiles: 2,
      powerTileChance: 0.15,
      timeLimit: 600,
      tutorialEnabled: false,
      description: "Advanced puzzles with time challenge."
    },
    expert: {
      size: 6,
      colors: 5,
      reverseSteps: 10,
      maxMoves: 50,
      maxLockedTiles: 3,
      powerTileChance: 0.2,
      timeLimit: 480,
      tutorialEnabled: false,
      description: "For puzzle masters only!"
    },
    infinite: {
      size: 5,
      colors: 6,
      reverseSteps: 15,
      maxMoves: 0,
      maxLockedTiles: 4,
      powerTileChance: 0.25,
      timeLimit: 0,
      tutorialEnabled: false,
      description: "Endless challenge mode."
    }
  },
  WORLDS: {
    sandbox: { name: "Sandbox", belt: "white", unlockRequirement: null },
    world1: { name: "Beginner's Garden", belt: "yellow", unlockRequirement: { puzzles: 5, minStars: 1 } },
    world2: { name: "Power Plaza", belt: "orange", unlockRequirement: { puzzles: 3, minStars: 2 } },
    world3: { name: "Reflection Ridge", belt: "green", unlockRequirement: { goldStars: 1 } },
    world4: { name: "Time Temple", belt: "blue", unlockRequirement: { allSilver: true } },
    world5: { name: "Master's Domain", belt: "purple", unlockRequirement: { dailyStreak: 1 } }
  }
};
function deepClone(grid) {
  return grid.map((row) => [...row]);
}
__name(deepClone, "deepClone");
function getNextColor(current, totalColors) {
  return (current + 1) % totalColors;
}
__name(getNextColor, "getNextColor");
function isWinningState(grid) {
  if (!grid || !grid.length)
    return false;
  const firstColor = grid[0][0];
  return grid.every((row) => row.every((cell) => cell === firstColor));
}
__name(isWinningState, "isWinningState");
function calculateMoveEffect(row, col, size, isPowerTile) {
  const effect = Array(size).fill(null).map(() => Array(size).fill(0));
  if (isPowerTile) {
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c2 = Math.max(0, col - 1); c2 <= Math.min(size - 1, col + 1); c2++) {
        effect[r][c2] = 1;
      }
    }
  } else {
    effect[row][col] = 1;
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    directions.forEach(([dr, dc]) => {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
        effect[newRow][newCol] = 1;
      }
    });
  }
  return effect;
}
__name(calculateMoveEffect, "calculateMoveEffect");
function applyMove(grid, row, col, powerTiles, lockedTiles, totalColors) {
  const newGrid = deepClone(grid);
  const size = grid.length;
  const tileKey = `${row}-${col}`;
  const isPowerTile = powerTiles.has(tileKey);
  const effect = calculateMoveEffect(row, col, size, isPowerTile);
  const changedTiles = [];
  for (let r = 0; r < size; r++) {
    for (let c2 = 0; c2 < size; c2++) {
      const key = `${r}-${c2}`;
      if (effect[r][c2] && !lockedTiles.has(key)) {
        const oldColor = newGrid[r][c2];
        newGrid[r][c2] = getNextColor(oldColor, totalColors);
        changedTiles.push({
          row: r,
          col: c2,
          oldColor,
          newColor: newGrid[r][c2]
        });
      }
    }
  }
  return {
    grid: newGrid,
    changedTiles,
    isPowerMove: isPowerTile
  };
}
__name(applyMove, "applyMove");
async function solvePuzzle(initialGrid, powerTiles, lockedTiles, totalColors) {
  const startTime = Date.now();
  const visited = /* @__PURE__ */ new Set();
  const queue = [{ state: initialGrid, path: [] }];
  const gridToString = /* @__PURE__ */ __name((g) => g.map((row) => row.join("")).join("|"), "gridToString");
  const MAX_STATES = 1e4;
  const MAX_DEPTH = 30;
  let statesExplored = 0;
  while (queue.length > 0 && statesExplored < MAX_STATES) {
    const { state, path } = queue.shift();
    const stateKey = gridToString(state);
    if (visited.has(stateKey))
      continue;
    visited.add(stateKey);
    statesExplored++;
    if (isWinningState(state)) {
      return {
        solution: path,
        solvable: true,
        statesExplored,
        timeMs: Date.now() - startTime
      };
    }
    if (path.length >= MAX_DEPTH)
      continue;
    const size = state.length;
    for (let r = 0; r < size; r++) {
      for (let c2 = 0; c2 < size; c2++) {
        const key = `${r}-${c2}`;
        if (!lockedTiles.has(key)) {
          const result = applyMove(state, r, c2, powerTiles, lockedTiles, totalColors);
          const newStateKey = gridToString(result.grid);
          if (!visited.has(newStateKey)) {
            queue.push({
              state: result.grid,
              path: [...path, { row: r, col: c2 }]
            });
          }
        }
      }
    }
  }
  return {
    solution: [],
    solvable: false,
    statesExplored,
    timeMs: Date.now() - startTime
  };
}
__name(solvePuzzle, "solvePuzzle");
async function generatePuzzle(difficulty = "easy") {
  const config = GAME_CONFIG.DIFFICULTIES[difficulty];
  const { size, reverseSteps, maxLockedTiles, powerTileChance, colors } = config;
  const solvedGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  const powerTiles = /* @__PURE__ */ new Set();
  const lockedTiles = /* @__PURE__ */ new Map();
  if (powerTileChance > 0) {
    const numPowerTiles = Math.min(3, Math.floor(size * size * powerTileChance));
    while (powerTiles.size < numPowerTiles) {
      const r = Math.floor(Math.random() * size);
      const c2 = Math.floor(Math.random() * size);
      powerTiles.add(`${r}-${c2}`);
    }
  }
  while (lockedTiles.size < maxLockedTiles) {
    const r = Math.floor(Math.random() * size);
    const c2 = Math.floor(Math.random() * size);
    const key = `${r}-${c2}`;
    if (!powerTiles.has(key)) {
      lockedTiles.set(key, Math.floor(Math.random() * 3) + 2);
    }
  }
  let currentGrid = deepClone(solvedGrid);
  const reverseMoves = [];
  for (let i2 = 0; i2 < reverseSteps; i2++) {
    const validMoves = [];
    for (let r = 0; r < size; r++) {
      for (let c2 = 0; c2 < size; c2++) {
        if (!lockedTiles.has(`${r}-${c2}`)) {
          validMoves.push({ row: r, col: c2 });
        }
      }
    }
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    const result = applyMove(currentGrid, move.row, move.col, powerTiles, /* @__PURE__ */ new Map(), colors);
    currentGrid = result.grid;
    reverseMoves.push(move);
  }
  const solution = await solvePuzzle(currentGrid, powerTiles, lockedTiles, colors);
  return {
    grid: currentGrid,
    solvedGrid,
    powerTiles: Array.from(powerTiles),
    lockedTiles: Object.fromEntries(lockedTiles),
    solution: solution.solution,
    reverseMoves,
    verified: solution.solvable,
    statesExplored: solution.statesExplored,
    difficulty,
    config
  };
}
__name(generatePuzzle, "generatePuzzle");

// src/templates.js
var html = `<!DOCTYPE html>
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
      content: '\u26A1';
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.875rem;
    }
    
    .tile.locked::after {
      content: '\u{1F512}';
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
          <div class="power-up-icon">\u{1F3B2}</div>
          <div>Wildcard</div>
        </button>
        <button class="power-up" id="freeze" onclick="usePowerUp('freeze')">
          <div class="power-up-icon">\u2744\uFE0F</div>
          <div>Freeze</div>
        </button>
        <button class="power-up" id="reset" onclick="usePowerUp('reset')">
          <div class="power-up-icon">\u21A9\uFE0F</div>
          <div>Reset</div>
        </button>
      </div>
      
      <div class="controls">
        <button onclick="showHint()">\u{1F4A1} Hint</button>
        <button onclick="showSolution()">\u{1F3AF} Solution</button>
        <button onclick="newGame()">\u{1F504} New Game</button>
        <button onclick="backToMenu()">\u{1F3E0} Menu</button>
      </div>
    </div>
    
    <div id="loading" class="loading" style="display: none;">
      <div class="spinner"></div>
      <p>Generating puzzle...</p>
    </div>
  </div>
  
  <div id="victoryModal" class="modal">
    <div class="modal-content">
      <div class="victory-emoji">\u{1F389}</div>
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
  <\/script>
</body>
</html>`;

// src/worker.js
var router = e();
router.get("/", () => {
  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
});
router.post("/api/generate", async (request) => {
  const { difficulty = "easy" } = await request.json();
  const puzzle = await generatePuzzle(difficulty);
  return new Response(JSON.stringify(puzzle), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/solve", async (request) => {
  const { grid, power, locked, colors } = await request.json();
  const solution = await solvePuzzle(grid, power, locked, colors);
  return new Response(JSON.stringify(solution), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/move", async (request) => {
  const { grid, row, col, power, locked, colors } = await request.json();
  const result = applyMove(grid, row, col, power, locked, colors);
  const won = isWinningState(result.grid);
  return new Response(JSON.stringify({ ...result, won }), {
    headers: { "Content-Type": "application/json" }
  });
});
router.get("/api/leaderboard/:difficulty", async (request, env) => {
  const { difficulty } = request.params;
  const leaderboard = await env.GAME_STATE.get(`leaderboard:${difficulty}`, { type: "json" });
  return new Response(JSON.stringify(leaderboard || []), {
    headers: { "Content-Type": "application/json" }
  });
});
router.post("/api/score", async (request, env) => {
  const { name, score, moves, time, difficulty } = await request.json();
  const key = `leaderboard:${difficulty}`;
  const leaderboard = await env.GAME_STATE.get(key, { type: "json" }) || [];
  leaderboard.push({
    name,
    score,
    moves,
    time,
    timestamp: Date.now()
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.splice(100);
  await env.GAME_STATE.put(key, JSON.stringify(leaderboard));
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
router.get("/assets/*", async (request, env, ctx) => {
  const url = new URL(request.url);
  const path = url.pathname.replace("/assets/", "");
  const asset = await env.GAME_STATE.get(`asset:${path}`);
  if (asset) {
    return new Response(asset, {
      headers: {
        "Content-Type": getMimeType(path),
        "Cache-Control": "public, max-age=31536000"
      }
    });
  }
  return new Response("Not found", { status: 404 });
});
router.all("*", () => new Response("Not Found", { status: 404 }));
function getMimeType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const types = {
    "js": "application/javascript",
    "css": "text/css",
    "html": "text/html",
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "svg": "image/svg+xml",
    "json": "application/json"
  };
  return types[ext] || "text/plain";
}
__name(getMimeType, "getMimeType");
var GameSession = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/websocket") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected Upgrade: websocket", { status: 426 });
      }
      const [client, server] = Object.values(new WebSocketPair());
      await this.handleSession(server);
      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }
    return new Response("Not found", { status: 404 });
  }
  async handleSession(websocket) {
    websocket.accept();
    this.sessions.push(websocket);
    websocket.addEventListener("message", async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === "move") {
        for (const session of this.sessions) {
          if (session !== websocket && session.readyState === WebSocket.OPEN) {
            session.send(JSON.stringify(data));
          }
        }
      }
    });
    websocket.addEventListener("close", () => {
      this.sessions = this.sessions.filter((s2) => s2 !== websocket);
    });
  }
};
__name(GameSession, "GameSession");
var worker_default = {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};
export {
  GameSession,
  worker_default as default
};
//# sourceMappingURL=worker.js.map
