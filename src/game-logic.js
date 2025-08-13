/**
 * Core game logic for Color Me Same
 * Pure functions that can run in both Worker and browser contexts
 */

// Game configuration
export const GAME_CONFIG = {
  COLOR_PALETTE: ['#FF4444', '#44DD44', '#4444FF', '#FFAA00', '#AA44FF', '#44DDDD'],
  COLOR_NAMES: ['Red', 'Green', 'Blue', 'Orange', 'Purple', 'Cyan'],
  
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
      description: 'Perfect for learning! No limits, full tutorial.',
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
      description: 'More complex puzzles with special tiles.',
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
      description: 'Advanced puzzles with time challenge.',
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
      description: 'For puzzle masters only!',
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
      description: 'Endless challenge mode.',
    }
  },
  
  WORLDS: {
    sandbox: { name: 'Sandbox', belt: 'white', unlockRequirement: null },
    world1: { name: 'Beginner\'s Garden', belt: 'yellow', unlockRequirement: { puzzles: 5, minStars: 1 } },
    world2: { name: 'Power Plaza', belt: 'orange', unlockRequirement: { puzzles: 3, minStars: 2 } },
    world3: { name: 'Reflection Ridge', belt: 'green', unlockRequirement: { goldStars: 1 } },
    world4: { name: 'Time Temple', belt: 'blue', unlockRequirement: { allSilver: true } },
    world5: { name: 'Master\'s Domain', belt: 'purple', unlockRequirement: { dailyStreak: 1 } }
  }
};

// Helper functions
export function deepClone(grid) {
  return grid.map(row => [...row]);
}

export function getNextColor(current, totalColors) {
  return (current + 1) % totalColors;
}

export function isWinningState(grid) {
  if (!grid || !grid.length) return false;
  const firstColor = grid[0][0];
  return grid.every(row => row.every(cell => cell === firstColor));
}

// Calculate effect matrix for a move
export function calculateMoveEffect(row, col, size, isPowerTile) {
  const effect = Array(size).fill(null).map(() => Array(size).fill(0));
  
  if (isPowerTile) {
    // Power tiles affect 3x3 area
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        effect[r][c] = 1;
      }
    }
  } else {
    // Normal tiles affect cross pattern
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

// Apply a move to the grid
export function applyMove(grid, row, col, powerTiles, lockedTiles, totalColors) {
  const newGrid = deepClone(grid);
  const size = grid.length;
  const tileKey = `${row}-${col}`;
  const isPowerTile = powerTiles.has(tileKey);
  
  const effect = calculateMoveEffect(row, col, size, isPowerTile);
  const changedTiles = [];
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const key = `${r}-${c}`;
      if (effect[r][c] && !lockedTiles.has(key)) {
        const oldColor = newGrid[r][c];
        newGrid[r][c] = getNextColor(oldColor, totalColors);
        changedTiles.push({
          row: r,
          col: c,
          oldColor,
          newColor: newGrid[r][c]
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

// BFS solver with memoization
export async function solvePuzzle(initialGrid, powerTiles, lockedTiles, totalColors) {
  const startTime = Date.now();
  const visited = new Set();
  const queue = [{ state: initialGrid, path: [] }];
  const gridToString = (g) => g.map(row => row.join('')).join('|');
  const MAX_STATES = 10000;
  const MAX_DEPTH = 30;
  
  let statesExplored = 0;
  
  while (queue.length > 0 && statesExplored < MAX_STATES) {
    const { state, path } = queue.shift();
    const stateKey = gridToString(state);
    
    if (visited.has(stateKey)) continue;
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
    
    if (path.length >= MAX_DEPTH) continue;
    
    // Try all possible moves
    const size = state.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r}-${c}`;
        if (!lockedTiles.has(key)) {
          const result = applyMove(state, r, c, powerTiles, lockedTiles, totalColors);
          const newStateKey = gridToString(result.grid);
          
          if (!visited.has(newStateKey)) {
            queue.push({
              state: result.grid,
              path: [...path, { row: r, col: c }]
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

// Generate a puzzle by reverse moves
export async function generatePuzzle(difficulty = 'easy') {
  const config = GAME_CONFIG.DIFFICULTIES[difficulty];
  const { size, reverseSteps, maxLockedTiles, powerTileChance, colors } = config;
  
  // Start with solved grid (all zeros)
  const solvedGrid = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Generate special tiles
  const powerTiles = new Set();
  const lockedTiles = new Map();
  
  // Add power tiles
  if (powerTileChance > 0) {
    const numPowerTiles = Math.min(3, Math.floor(size * size * powerTileChance));
    while (powerTiles.size < numPowerTiles) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      powerTiles.add(`${r}-${c}`);
    }
  }
  
  // Add locked tiles
  while (lockedTiles.size < maxLockedTiles) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    const key = `${r}-${c}`;
    if (!powerTiles.has(key)) {
      lockedTiles.set(key, Math.floor(Math.random() * 3) + 2); // 2-4 moves to unlock
    }
  }
  
  // Apply reverse moves to create puzzle
  let currentGrid = deepClone(solvedGrid);
  const reverseMoves = [];
  
  for (let i = 0; i < reverseSteps; i++) {
    // Find all valid moves
    const validMoves = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!lockedTiles.has(`${r}-${c}`)) {
          validMoves.push({ row: r, col: c });
        }
      }
    }
    
    // Pick random move
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    const result = applyMove(currentGrid, move.row, move.col, powerTiles, new Map(), colors);
    currentGrid = result.grid;
    reverseMoves.push(move);
  }
  
  // Verify puzzle is solvable
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

// Calculate score
export function calculateScore(moves, optimalMoves, timeSeconds, timeLimit, difficulty) {
  const baseScore = 1000;
  const efficiencyBonus = optimalMoves ? Math.round((optimalMoves / moves) * 100) * 10 : 0;
  const timeBonus = timeLimit ? Math.max(0, (timeLimit - timeSeconds) * 5) : 500;
  
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
    expert: 3,
    infinite: 4
  }[difficulty] || 1;
  
  return Math.round((baseScore + efficiencyBonus + timeBonus) * difficultyMultiplier);
}

// Daily puzzle seed generation
export function getDailySeed() {
  const today = new Date();
  const dateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  
  // Simple hash function for consistent daily seeds
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
}