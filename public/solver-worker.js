/**
 * Web Worker for BFS Solver
 * Offloads heavy computation from main thread for better performance
 */

// Import game logic functions
self.importScripts('/game-logic-worker.js');

// Message handler
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data;
  
  try {
    switch (type) {
      case 'SOLVE_PUZZLE':
        const solution = await solvePuzzleWorker(payload);
        self.postMessage({
          type: 'SOLVE_RESULT',
          id,
          payload: solution
        });
        break;
        
      case 'GENERATE_PUZZLE':
        const puzzle = await generatePuzzleWorker(payload);
        self.postMessage({
          type: 'GENERATE_RESULT',
          id,
          payload: puzzle
        });
        break;
        
      case 'FIND_HINT':
        const hint = await findNextBestMove(payload);
        self.postMessage({
          type: 'HINT_RESULT',
          id,
          payload: hint
        });
        break;
        
      case 'ANALYZE_POSITION':
        const analysis = await analyzePosition(payload);
        self.postMessage({
          type: 'ANALYSIS_RESULT',
          id,
          payload: analysis
        });
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      id,
      error: error.message
    });
  }
});

// Enhanced BFS solver with progress updates
async function solvePuzzleWorker({ grid, powerTiles, lockedTiles, totalColors }) {
  const startTime = Date.now();
  const visited = new Set();
  const queue = [{ state: grid, path: [] }];
  const gridToString = (g) => g.map(row => row.join('')).join('|');
  const MAX_STATES = 50000;
  const MAX_DEPTH = 50;
  
  let statesExplored = 0;
  let lastProgress = 0;
  
  // Convert array/object to Set/Map if needed
  const power = new Set(powerTiles);
  const locked = new Map(Object.entries(lockedTiles || {}));
  
  while (queue.length > 0 && statesExplored < MAX_STATES) {
    const { state, path } = queue.shift();
    const stateKey = gridToString(state);
    
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);
    statesExplored++;
    
    // Send progress update every 1000 states
    if (statesExplored % 1000 === 0) {
      const progress = Math.min((statesExplored / MAX_STATES) * 100, 99);
      if (progress > lastProgress + 5) {
        lastProgress = progress;
        self.postMessage({
          type: 'PROGRESS',
          payload: { progress, statesExplored }
        });
      }
    }
    
    if (isWinningState(state)) {
      return {
        solution: path,
        solvable: true,
        statesExplored,
        timeMs: Date.now() - startTime,
        difficulty: calculateDifficulty(path, statesExplored)
      };
    }
    
    if (path.length >= MAX_DEPTH) continue;
    
    // Try all possible moves
    const size = state.length;
    const moves = [];
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const key = `${r}-${c}`;
        if (!locked.has(key)) {
          const result = applyMove(state, r, c, power, locked, totalColors);
          const newStateKey = gridToString(result.grid);
          
          if (!visited.has(newStateKey)) {
            const priority = estimateDistance(result.grid, totalColors);
            moves.push({
              state: result.grid,
              path: [...path, { row: r, col: c }],
              priority
            });
          }
        }
      }
    }
    
    // Sort by heuristic (A* optimization)
    moves.sort((a, b) => a.priority - b.priority);
    queue.push(...moves);
  }
  
  return {
    solution: [],
    solvable: false,
    statesExplored,
    timeMs: Date.now() - startTime
  };
}

// Find the next best move for hint system
async function findNextBestMove({ grid, powerTiles, lockedTiles, totalColors }) {
  const solution = await solvePuzzleWorker({ grid, powerTiles, lockedTiles, totalColors });
  
  if (solution.solvable && solution.solution.length > 0) {
    const nextMove = solution.solution[0];
    const alternativeMoves = await findAlternativeMoves(grid, nextMove, powerTiles, lockedTiles, totalColors);
    
    return {
      bestMove: nextMove,
      alternatives: alternativeMoves,
      optimalPath: solution.solution,
      estimatedMoves: solution.solution.length
    };
  }
  
  return null;
}

// Analyze current position
async function analyzePosition({ grid, moves, optimalMoves }) {
  const uniformity = calculateUniformity(grid);
  const clusters = findColorClusters(grid);
  const efficiency = optimalMoves ? (optimalMoves / moves) * 100 : 0;
  
  return {
    uniformity,
    clusters,
    efficiency,
    rating: calculatePositionRating(uniformity, clusters, efficiency),
    suggestions: generateSuggestions(grid, clusters)
  };
}

// Helper functions
function isWinningState(grid) {
  if (!grid || !grid.length) return false;
  const firstColor = grid[0][0];
  return grid.every(row => row.every(cell => cell === firstColor));
}

function applyMove(grid, row, col, powerTiles, lockedTiles, totalColors) {
  const newGrid = grid.map(row => [...row]);
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
        newGrid[r][c] = (oldColor + 1) % totalColors;
        changedTiles.push({ row: r, col: c, oldColor, newColor: newGrid[r][c] });
      }
    }
  }
  
  return { grid: newGrid, changedTiles };
}

function calculateMoveEffect(row, col, size, isPowerTile) {
  const effect = Array(size).fill(null).map(() => Array(size).fill(0));
  
  if (isPowerTile) {
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        effect[r][c] = 1;
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

// Heuristic function for A* optimization
function estimateDistance(grid, totalColors) {
  const colorCounts = new Array(totalColors).fill(0);
  grid.forEach(row => row.forEach(cell => colorCounts[cell]++));
  
  const maxCount = Math.max(...colorCounts);
  const totalCells = grid.length * grid.length;
  
  return totalCells - maxCount;
}

// Calculate uniformity percentage
function calculateUniformity(grid) {
  const flat = grid.flat();
  const colorCounts = {};
  flat.forEach(color => {
    colorCounts[color] = (colorCounts[color] || 0) + 1;
  });
  
  const maxCount = Math.max(...Object.values(colorCounts));
  return (maxCount / flat.length) * 100;
}

// Find connected color clusters
function findColorClusters(grid) {
  const size = grid.length;
  const visited = Array(size).fill(null).map(() => Array(size).fill(false));
  const clusters = [];
  
  function dfs(r, c, color, cluster) {
    if (r < 0 || r >= size || c < 0 || c >= size || visited[r][c] || grid[r][c] !== color) {
      return;
    }
    
    visited[r][c] = true;
    cluster.push({ row: r, col: c });
    
    dfs(r - 1, c, color, cluster);
    dfs(r + 1, c, color, cluster);
    dfs(r, c - 1, color, cluster);
    dfs(r, c + 1, color, cluster);
  }
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!visited[r][c]) {
        const cluster = [];
        dfs(r, c, grid[r][c], cluster);
        if (cluster.length > 1) {
          clusters.push({
            color: grid[r][c],
            size: cluster.length,
            tiles: cluster
          });
        }
      }
    }
  }
  
  return clusters.sort((a, b) => b.size - a.size);
}

// Calculate position rating
function calculatePositionRating(uniformity, clusters, efficiency) {
  const uniformityScore = uniformity / 100;
  const clusterScore = clusters.length > 0 ? clusters[0].size / (clusters.reduce((sum, c) => sum + c.size, 0)) : 0;
  const efficiencyScore = efficiency / 100;
  
  return Math.round((uniformityScore * 0.5 + clusterScore * 0.3 + efficiencyScore * 0.2) * 5);
}

// Generate suggestions based on position
function generateSuggestions(grid, clusters) {
  const suggestions = [];
  
  if (clusters.length > 0) {
    const largestCluster = clusters[0];
    suggestions.push(`Focus on expanding the ${largestCluster.size}-tile cluster`);
  }
  
  const uniformity = calculateUniformity(grid);
  if (uniformity > 70) {
    suggestions.push('You\'re close! Look for moves that convert minority colors');
  } else if (uniformity < 40) {
    suggestions.push('Try to build larger color groups before converting');
  }
  
  return suggestions;
}

// Find alternative moves
async function findAlternativeMoves(grid, optimalMove, powerTiles, lockedTiles, totalColors) {
  const alternatives = [];
  const size = grid.length;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r === optimalMove.row && c === optimalMove.col) continue;
      
      const key = `${r}-${c}`;
      if (!lockedTiles.has(key)) {
        const result = applyMove(grid, r, c, powerTiles, lockedTiles, totalColors);
        const distance = estimateDistance(result.grid, totalColors);
        
        alternatives.push({
          row: r,
          col: c,
          estimatedDistance: distance,
          isPowerTile: powerTiles.has(key)
        });
      }
    }
  }
  
  return alternatives.sort((a, b) => a.estimatedDistance - b.estimatedDistance).slice(0, 3);
}

// Calculate puzzle difficulty
function calculateDifficulty(solution, statesExplored) {
  const moveScore = solution.length < 5 ? 1 : solution.length < 10 ? 2 : solution.length < 15 ? 3 : 4;
  const stateScore = statesExplored < 100 ? 1 : statesExplored < 1000 ? 2 : statesExplored < 5000 ? 3 : 4;
  
  return {
    overall: Math.round((moveScore + stateScore) / 2),
    moves: moveScore,
    complexity: stateScore
  };
}