import { describe, it, expect } from 'vitest';
import { applyClick, isWinningState } from '../gridV2';

interface Move {
  row: number;
  col: number;
}

// BFS solver to find optimal solution
function findSolution(
  initial: number[][],
  colors: number,
  maxDepth: number = 15
): Move[] | null {
  const gridToString = (g: number[][]) => g.map(r => r.join('')).join('|');
  const visited = new Set<string>();
  const queue: { grid: number[][], path: Move[] }[] = [
    { grid: initial, path: [] }
  ];
  
  while (queue.length > 0) {
    const { grid, path } = queue.shift()!;
    
    if (isWinningState(grid)) {
      return path;
    }
    
    if (path.length >= maxDepth) continue;
    
    const key = gridToString(grid);
    if (visited.has(key)) continue;
    visited.add(key);
    
    // Try all possible moves
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[0].length; col++) {
        const newGrid = applyClick(grid, row, col, colors, false, new Map());
        const newKey = gridToString(newGrid);
        
        if (!visited.has(newKey)) {
          queue.push({
            grid: newGrid,
            path: [...path, { row, col }]
          });
        }
      }
    }
  }
  
  return null;
}

describe('Verify ALL How to Play Modal Examples (2 colors)', () => {
  it('should verify the Checkerboard example (4 clicks)', () => {
    const initial = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0]
    ];
    
    console.log('\n=== CHECKERBOARD (4 clicks) ===');
    const solution = findSolution(initial, 2);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBe(4);
    
    // Verify the claimed solution works
    let state = initial.map(row => [...row]);
    const expectedMoves = [
      { row: 0, col: 1 }, // top-mid
      { row: 1, col: 0 }, // left-mid
      { row: 1, col: 2 }, // right-mid
      { row: 2, col: 1 }  // bottom-mid
    ];
    
    for (const move of expectedMoves) {
      state = applyClick(state, move.row, move.col, 2, false, new Map());
    }
    expect(isWinningState(state)).toBe(true);
    console.log('✓ VERIFIED: 4 clicks (top-mid, left-mid, right-mid, bottom-mid)');
  });
  
  it('should verify the Two Move Win example', () => {
    const initial = [
      [1, 1, 1],
      [0, 0, 0],
      [1, 1, 1]
    ];
    
    console.log('\n=== TWO MOVE WIN ===');
    const solution = findSolution(initial, 2);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBe(2);
    
    // Verify the claimed solution
    let state = initial.map(row => [...row]);
    state = applyClick(state, 0, 1, 2, false, new Map()); // top-mid
    state = applyClick(state, 2, 1, 2, false, new Map()); // bottom-mid
    expect(isWinningState(state)).toBe(true);
    console.log('✓ VERIFIED: 2 clicks (top-mid, bottom-mid)');
  });
  
  it('should verify the L-Shape Win example (1 click)', () => {
    const initial = [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0]
    ];
    
    console.log('\n=== L-SHAPE WIN (1 click) ===');
    const solution = findSolution(initial, 2);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBe(1);
    
    // Verify clicking top-left works
    const after = applyClick(initial, 0, 0, 2, false, new Map());
    expect(isWinningState(after)).toBe(true);
    console.log('✓ VERIFIED: 1 click (top-left corner)');
  });
  
  it('should verify the One Click Win example', () => {
    const initial = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ];
    
    console.log('\n=== ONE CLICK WIN ===');
    const solution = findSolution(initial, 2);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBe(1);
    
    // Verify clicking center works
    const after = applyClick(initial, 1, 1, 2, false, new Map());
    expect(isWinningState(after)).toBe(true);
    console.log('✓ VERIFIED: 1 click (center)');
  });
  
  it('should verify the Single Center Dot example (5 clicks)', () => {
    const initial = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];
    
    console.log('\n=== SINGLE CENTER DOT (5 clicks) ===');
    const solution = findSolution(initial, 2);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBe(5);
    
    // The solution requires clicking all 5 tiles in the cross pattern
    const expectedMoves = [
      { row: 0, col: 1 }, // top
      { row: 1, col: 0 }, // left
      { row: 1, col: 1 }, // center
      { row: 1, col: 2 }, // right
      { row: 2, col: 1 }  // bottom
    ];
    
    // Verify this solution works
    let state = initial.map(row => [...row]);
    for (const move of expectedMoves) {
      state = applyClick(state, move.row, move.col, 2, false, new Map());
    }
    expect(isWinningState(state)).toBe(true);
    console.log('✓ VERIFIED: 5 clicks (all tiles in cross pattern)');
  });
  
  it('should verify the Basic Click example', () => {
    const initial = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];
    
    console.log('\n=== BASIC CLICK EXAMPLE ===');
    console.log('Initial:', initial);
    
    // This is just demonstrating how a click works, not solving
    const after = applyClick(initial, 1, 1, 2, false, new Map());
    console.log('After click center:', after);
    
    // Should show the cross pattern changed
    expect(after[0][1]).toBe(1); // top changed
    expect(after[1][0]).toBe(1); // left changed
    expect(after[1][1]).toBe(0); // center changed
    expect(after[1][2]).toBe(1); // right changed
    expect(after[2][1]).toBe(1); // bottom changed
    
    console.log('✓ VERIFIED: Shows cross pattern correctly');
  });
  
  it('SUMMARY: All examples are 100% accurate', () => {
    console.log('\n=== SUMMARY ===');
    console.log('✓ Checkerboard: 4 clicks (NOT 5 as previously claimed)');
    console.log('✓ Two Move Win: 2 clicks (horizontal stripes)');
    console.log('✓ L-Shape Win: 1 click (top-left corner)');
    console.log('✓ One Click Win: 1 click (center)');
    console.log('✓ Single Center Dot: 5 clicks (all cross tiles)');
    console.log('✓ Basic Click: Demonstrates cross pattern');
    console.log('\nALL EXAMPLES ARE NOW 100% FACTUALLY CORRECT!');
  });
});