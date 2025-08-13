/**
 * Mathematical solvability check for Color Me Same puzzles
 * Based on Gaussian elimination over finite fields
 */

import { log } from './logger';

type Vector = number[];
type Matrix = number[][];
type Grid = number[][];

// Cache for influence matrices by board size
const matrixCache = new Map<number, Matrix>();

/**
 * Convert 2D grid to 1D vector relative to target color
 */
function vectorize(grid: Grid, target: number, k: number): Vector {
  const flat = grid.flat();
  return flat.map(c => (c - target + k) % k);
}

/**
 * Check if click at (r,c) affects cell (i,j)
 * Normal tiles affect + pattern
 */
function affects(r: number, c: number, i: number, j: number): boolean {
  return (r === i && c === j) ||
         (r === i && Math.abs(c - j) === 1) ||
         (c === j && Math.abs(r - i) === 1);
}

/**
 * Check if power click at (r,c) affects cell (i,j)
 * Power tiles affect 3x3 area
 */
function affectsPower(r: number, c: number, i: number, j: number): boolean {
  return Math.abs(r - i) <= 1 && Math.abs(c - j) <= 1;
}

/**
 * Generate influence vector for one click
 */
function influenceVector(n: number, r: number, c: number, isPower: boolean = false): Vector {
  const vec: Vector = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const affected = isPower ? affectsPower(r, c, i, j) : affects(r, c, i, j);
      vec.push(affected ? 1 : 0);
    }
  }
  return vec;
}

/**
 * Build complete influence matrix
 * Cached for performance
 */
function getInfluenceMatrix(n: number, powerTiles: Set<string> = new Set()): Matrix {
  /* FIX: Cache key should include power tile layout (commented out as power tiles are disabled)
  // Create a deterministic key that includes power tile positions
  const powerKeys = Array.from(powerTiles).sort().join(',');
  const cacheKey = powerTiles.size === 0 ? n : `${n}:${powerKeys}`;
  
  if (matrixCache.has(cacheKey)) {
    return matrixCache.get(cacheKey)!;
  }
  */
  
  // Current implementation - cache by size only
  const cacheKey = n;
  if (!powerTiles.size && matrixCache.has(cacheKey)) {
    return matrixCache.get(cacheKey)!;
  }
  
  const mat: Matrix = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const isPower = powerTiles.has(`${r}-${c}`);
      mat.push(influenceVector(n, r, c, isPower));
    }
  }
  
  // Only cache if no power tiles (to avoid incorrect cache hits)
  if (!powerTiles.size) {
    matrixCache.set(cacheKey, mat);
  }
  
  return mat;
}

/**
 * FIX: Safe modular inverse that handles composite moduli
 * Returns inverse if it exists, throws error if not coprime
 */
function modInverse(a: number, k: number): number {
  a = ((a % k) + k) % k;
  if (a === 0) throw new Error('No inverse for 0');
  
  // Extended Euclidean algorithm
  let t = 0, newT = 1;
  let r = k, newR = a;
  
  while (newR !== 0) {
    const q = Math.floor(r / newR);
    [t, newT] = [newT, t - q * newT];
    [r, newR] = [newR, r - q * newR];
  }
  
  if (r !== 1) {
    throw new Error(`No inverse exists for ${a} mod ${k} (gcd=${r})`);
  }
  
  return ((t % k) + k) % k;
}

/**
 * Gaussian elimination modulo k
 * Returns solution vector or null if system is inconsistent
 */
function gaussianEliminationMod(A: Matrix, b: Vector, k: number): Vector | null {
  const n = A.length;
  const m = A[0].length;
  
  // Create augmented matrix [A|b]
  const aug = A.map((row, i) => [...row, b[i]]);
  
  // Forward elimination
  let rank = 0;
  for (let col = 0; col < m && rank < n; col++) {
    // FIX: Find pivot that is coprime with k
    let pivot = -1;
    for (let row = rank; row < n; row++) {
      const val = aug[row][col] % k;
      if (val !== 0) {
        // Check if coprime with k (gcd = 1)
        let gcd = val;
        let tempK = k;
        while (tempK !== 0) {
          const temp = gcd % tempK;
          gcd = tempK;
          tempK = temp;
        }
        if (gcd === 1) {
          pivot = row;
          break;
        }
      }
    }
    
    if (pivot === -1) continue;
    
    // Swap rows
    if (pivot !== rank) {
      [aug[rank], aug[pivot]] = [aug[pivot], aug[rank]];
    }
    
    // Scale pivot row
    const pivotVal = aug[rank][col];
    try {
      const pivotInv = modInverse(pivotVal, k);
      for (let j = 0; j <= m; j++) {
        aug[rank][j] = (aug[rank][j] * pivotInv) % k;
      }
    } catch {
      // Should not happen as we checked for coprimality
      continue;
    }
    
    // Eliminate column in other rows
    for (let row = 0; row < n; row++) {
      if (row === rank) continue;
      const factor = aug[row][col];
      if (factor === 0) continue;
      
      for (let j = 0; j <= m; j++) {
        aug[row][j] = ((aug[row][j] - factor * aug[rank][j]) % k + k) % k;
      }
    }
    
    rank++;
  }
  
  // Check for inconsistency
  for (let row = rank; row < n; row++) {
    let allZero = true;
    for (let col = 0; col < m; col++) {
      if (aug[row][col] !== 0) {
        allZero = false;
        break;
      }
    }
    if (allZero && aug[row][m] !== 0) {
      return null; // Inconsistent: 0 = non-zero
    }
  }
  
  // Back substitution (simplified - just return any valid solution)
  const solution = new Array(m).fill(0);
  for (let i = 0; i < Math.min(rank, m); i++) {
    // Find the leading column in row i
    let leadCol = -1;
    for (let j = 0; j < m; j++) {
      if (aug[i][j] !== 0) {
        leadCol = j;
        break;
      }
    }
    if (leadCol !== -1) {
      solution[leadCol] = aug[i][m];
    }
  }
  
  return solution;
}

/**
 * Check if a grid can be solved to any uniform color
 */
export function isSolvable(
  grid: Grid, 
  k: number, 
  powerTiles: Set<string> = new Set(),
  lockedTiles: Map<string, number> = new Map()
): boolean {
  const n = grid.length;
  
  // Special cases
  if (n === 0 || k === 0) return false;
  if (n === 1) return true; // 1x1 always solvable
  
  // Get influence matrix (considering power tiles)
  const A = getInfluenceMatrix(n, powerTiles);
  
  // Remove columns for locked tiles (they can't be clicked)
  const activeColumns: number[] = [];
  const activeA: Matrix = [];
  
  let idx = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = `${r}-${c}`;
      if (!lockedTiles.has(key) || lockedTiles.get(key) === 0) {
        activeColumns.push(idx);
      }
      idx++;
    }
  }
  
  // Build matrix with only active columns
  // We need to transpose: original A has clicks as rows, we need clicks as columns
  const transposedA: Matrix = [];
  for (let i = 0; i < n * n; i++) {
    transposedA[i] = [];
    for (let j = 0; j < n * n; j++) {
      transposedA[i][j] = A[j][i];
    }
  }
  
  /* FIX: Remove locked cell rows (commented out as locked tiles are disabled)
  // Identify which rows (cells) should be removed
  const activeRows: number[] = [];
  idx = 0;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const key = `${r}-${c}`;
      const isLocked = lockedTiles.has(key) && lockedTiles.get(key)! > 0;
      // Only keep rows for cells that aren't locked or are already at target color
      if (!isLocked || grid[r][c] === target) {
        activeRows.push(idx);
      }
      idx++;
    }
  }
  
  // Extract only active rows and columns
  for (const rowIdx of activeRows) {
    const row: number[] = [];
    for (const col of activeColumns) {
      row.push(transposedA[rowIdx][col]);
    }
    activeA.push(row);
  }
  */
  
  // Current implementation (no row removal)
  for (let i = 0; i < n * n; i++) {
    const row: number[] = [];
    for (const col of activeColumns) {
      row.push(transposedA[i][col]);
    }
    activeA.push(row);
  }
  
  // Try each possible target color
  for (let target = 0; target < k; target++) {
    const b = vectorize(grid, target, k);
    
    /* FIX: Extract only active rows from b vector (commented out)
    const activeB: number[] = [];
    for (const rowIdx of activeRows) {
      activeB.push(b[rowIdx]);
    }
    const solution = gaussianEliminationMod(activeA, activeB, k);
    */
    
    // Current implementation (use full b vector)
    const solution = gaussianEliminationMod(activeA, b, k);
    
    if (solution !== null) {
      log('debug', `Grid is solvable to color ${target}`, {
        gridSize: n,
        colors: k,
        powerTiles: powerTiles.size,
        lockedTiles: lockedTiles.size,
        targetColor: target
      });
      return true;
    }
  }
  
  log('warn', 'Grid is not solvable to any color', {
    gridSize: n,
    colors: k,
    powerTiles: powerTiles.size,
    lockedTiles: lockedTiles.size
  });
  
  return false;
}

/**
 * Quick check if a board size always has solvable grids
 * Based on known rank-deficient sizes
 */
export function isAlwaysSolvableSize(n: number, k: number = 2): boolean {
  if (k !== 2) return true; // Only have data for k=2, assume solvable for others
  
  const problematicSizes = [4, 5, 9, 11, 13, 14, 16, 17, 19, 20, 21, 22, 23];
  return !problematicSizes.includes(n);
}

/**
 * Get the rank of the influence matrix for a given board size
 * Useful for analysis
 */
export function getMatrixRank(n: number, k: number): number {
  const A = getInfluenceMatrix(n);
  const m = A.length;
  const aug = A.map(row => [...row]); // Copy matrix
  
  let rank = 0;
  for (let col = 0; col < m && rank < m; col++) {
    // Find pivot
    let pivot = -1;
    for (let row = rank; row < m; row++) {
      if (aug[row][col] % k !== 0) {
        pivot = row;
        break;
      }
    }
    
    if (pivot === -1) continue;
    
    // Swap rows
    if (pivot !== rank) {
      [aug[rank], aug[pivot]] = [aug[pivot], aug[rank]];
    }
    
    rank++;
  }
  
  return rank;
}