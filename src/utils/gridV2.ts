/**
 * @fileoverview Pure Functional Grid Manipulation Utilities
 * 
 * This module contains the core mathematical operations for the Color Me Same puzzle game.
 * All functions are pure (no side effects) and operate on immutable data structures.
 * 
 * The mathematical foundation:
 * - Colors are represented as integers in Z_n (integers modulo n)
 * - Click operations are additions in this finite field
 * - For n=2: Each operation is self-inverse (clicking twice returns to original)
 * - For n>2: Clicking n times returns to original (cyclic group property)
 * - This property ensures mathematical solvability
 * 
 * Key principles:
 * - Immutability: All functions return new grids, never modify inputs
 * - Functional purity: Same inputs always produce same outputs
 * - Mathematical rigor: Operations based on modular arithmetic
 * 
 * @module gridV2
 */

/**
 * Apply a click operation to the grid
 * 
 * This implements the core game mechanic where clicking a tile changes its color
 * and the colors of adjacent tiles. The operation works in modular arithmetic,
 * ensuring colors cycle through the available palette.
 * 
 * Pattern types:
 * - Normal tiles: Cross/Plus pattern (5 tiles affected)
 * - Power tiles: 3x3 square pattern (9 tiles affected)
 * 
 * Mathematical operation:
 * For each affected tile at position (i,j):
 * newColor[i,j] = (oldColor[i,j] + 1) mod numColors
 * 
 * @param {number[][]} grid - The current game grid
 * @param {number} row - Row index of clicked tile (0-based)
 * @param {number} col - Column index of clicked tile (0-based)
 * @param {number} colors - Number of colors in the game (modulus)
 * @param {boolean} isPowerTile - Whether this is a power tile (3x3 vs cross)
 * @param {Map<string, number>} lockedTiles - Map of locked positions to unlock countdown
 * @returns {number[][]} New grid with click applied (original unchanged)
 * 
 * @example
 * const grid = [[0,1,2], [1,2,0], [2,0,1]];
 * const newGrid = applyClick(grid, 1, 1, 3, false, new Map());
 * // Center and adjacent tiles incremented by 1 (mod 3)
 */
export function applyClick(
  grid: number[][],
  row: number,
  col: number,
  colors: number,
  isPowerTile: boolean,
  lockedTiles: Map<string, number>
): number[][] {
  const n = grid.length;
  const newGrid = grid.map(row => [...row]); // Deep copy
  
  // Define affected cells based on tile type
  const deltas = isPowerTile
    ? [[-1,-1], [-1,0], [-1,1], [0,-1], [0,0], [0,1], [1,-1], [1,0], [1,1]] // 3x3
    : [[0,0], [-1,0], [1,0], [0,-1], [0,1]]; // + pattern
  
  for (const [dr, dc] of deltas) {
    const nr = row + dr;
    const nc = col + dc;
    
    // Check bounds
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
      const key = `${nr}-${nc}`;
      // Check if tile is locked
      const lockCount = lockedTiles.get(key) || 0;
      if (lockCount === 0) {
        newGrid[nr][nc] = (newGrid[nr][nc] + 1) % colors;
      }
    }
  }
  
  return newGrid;
}

/**
 * Apply a reverse click operation (inverse of normal click)
 * 
 * This function is crucial for puzzle generation. By applying reverse clicks
 * to a solved state, we create a scrambled puzzle that we KNOW can be solved
 * by applying normal clicks in the reverse order.
 * 
 * Mathematical operation:
 * For each affected tile at position (i,j):
 * newColor[i,j] = (oldColor[i,j] - 1 + numColors) mod numColors
 * 
 * The addition of numColors before modulo ensures positive results.
 * 
 * Proof of reversibility:
 * Let f(x) = (x + 1) mod n be the forward operation
 * Let g(x) = (x - 1 + n) mod n be the reverse operation
 * Then f(g(x)) = ((x - 1 + n) + 1) mod n = x mod n = x
 * And g(f(x)) = ((x + 1) - 1 + n) mod n = x mod n = x
 * Therefore, f and g are inverses.
 * 
 * @param {number[][]} grid - The current game grid
 * @param {number} row - Row index of clicked tile
 * @param {number} col - Column index of clicked tile
 * @param {number} colors - Number of colors (modulus)
 * @param {boolean} isPowerTile - Whether this is a power tile
 * @param {Map<string, number>} lockedTiles - Locked positions map
 * @returns {number[][]} New grid with reverse click applied
 */
export function applyReverseClick(
  grid: number[][],
  row: number,
  col: number,
  colors: number,
  isPowerTile: boolean,
  lockedTiles: Map<string, number>
): number[][] {
  const n = grid.length;
  const newGrid = grid.map(row => [...row]); // Deep copy
  
  // Define affected cells based on tile type
  const deltas = isPowerTile
    ? [[-1,-1], [-1,0], [-1,1], [0,-1], [0,0], [0,1], [1,-1], [1,0], [1,1]] // 3x3
    : [[0,0], [-1,0], [1,0], [0,-1], [0,1]]; // + pattern
  
  for (const [dr, dc] of deltas) {
    const nr = row + dr;
    const nc = col + dc;
    
    // Check bounds
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
      const key = `${nr}-${nc}`;
      // Check if tile is locked
      const lockCount = lockedTiles.get(key) || 0;
      if (lockCount === 0) {
        // Subtract 1 (mod colors) - this is the inverse operation
        newGrid[nr][nc] = (newGrid[nr][nc] - 1 + colors) % colors;
      }
    }
  }
  
  return newGrid;
}

/**
 * Check if the grid is in a winning state (all tiles same color)
 */
export function isWinningState(grid: number[][]): boolean {
  if (!grid.length || !grid[0].length) return false;
  const targetColor = grid[0][0];
  return grid.every(row => row.every(cell => cell === targetColor));
}

/**
 * Create a deep copy of the grid
 */
export function cloneGrid(grid: number[][]): number[][] {
  return grid.map(row => [...row]);
}

/**
 * Convert grid position to string key
 */
export function posToKey(row: number, col: number): string {
  return `${row}-${col}`;
}

/**
 * Convert string key to grid position
 */
export function keyToPos(key: string): { row: number; col: number } {
  const [row, col] = key.split('-').map(Number);
  return { row, col };
}

/**
 * Get all valid positions in a grid
 */
export function getAllPositions(size: number): { row: number; col: number }[] {
  const positions: { row: number; col: number }[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      positions.push({ row, col });
    }
  }
  return positions;
}

/**
 * Shuffle an array in-place using Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}