import { describe, it } from 'vitest';
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

describe('Verify ALL How to Play Examples', () => {
  it('should verify the Checkerboard example', () => {
    // Checkerboard pattern - claims 5 clicks
    const initial = [
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0]
    ];
    
    console.log('\n=== CHECKERBOARD EXAMPLE ===');
    console.log('Initial:', initial);
    console.log('Claims: 5 clicks (4 corners + center)');
    
    const solution = findSolution(initial, 2);
    console.log('ACTUAL optimal solution:', solution);
    console.log(`ACTUAL moves needed: ${solution?.length}`);
    
    // Show the actual solution path
    if (solution) {
      let state = initial.map(row => [...row]);
      console.log('\nStep-by-step solution:');
      for (let i = 0; i < solution.length; i++) {
        const move = solution[i];
        state = applyClick(state, move.row, move.col, 2, false, new Map());
        console.log(`Step ${i+1}: Click (${move.row},${move.col})`);
        console.log(state);
      }
      console.log(solution.length === 5 ? '✓ CORRECT - needs 5 moves!' : '✗ INCORRECT claim!');
    }
  });
  
  it('should verify the Lines (row) example', () => {
    // Middle row different
    const initial = [
      [1, 1, 1],
      [0, 0, 0],
      [1, 1, 1]
    ];
    
    console.log('\n=== LINES (ROW) EXAMPLE ===');
    console.log('Initial:', initial);
    console.log('Claims: 1-3 clicks, suggests clicking center of bad line');
    
    const solution = findSolution(initial, 2);
    console.log('ACTUAL optimal solution:', solution);
    console.log(`ACTUAL moves needed: ${solution?.length}`);
    
    // Test the suggested approach
    console.log('\nTesting suggested approach (click center of middle row):');
    let state = initial.map(row => [...row]);
    state = applyClick(state, 1, 1, 3, false, new Map());
    console.log('After clicking (1,1):', state);
    console.log('Is it solved?', isWinningState(state));
    
    // Show actual solution
    if (solution) {
      console.log('\nActual optimal solution path:');
      state = initial.map(row => [...row]);
      for (let i = 0; i < solution.length; i++) {
        const move = solution[i];
        state = applyClick(state, move.row, move.col, 2, false, new Map());
        console.log(`Step ${i+1}: Click (${move.row},${move.col}) ->`, state);
      }
    }
  });
  
  it('should verify the L-Shape example', () => {
    // L-shape as shown
    const initial = [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 0]
    ];
    
    console.log('\n=== L-SHAPE EXAMPLE ===');
    console.log('Initial:', initial);
    console.log('Claims: 2 clicks - elbow then opposite arm');
    console.log('Suggested clicks: (1,1) then (2,2)');
    
    const solution = findSolution(initial, 2);
    console.log('ACTUAL optimal solution:', solution);
    console.log(`ACTUAL moves needed: ${solution?.length}`);
    
    // Test the suggested approach
    console.log('\nTesting suggested approach:');
    let state = initial.map(row => [...row]);
    state = applyClick(state, 1, 1, 3, false, new Map());
    console.log('After clicking (1,1):', state);
    state = applyClick(state, 2, 2, 3, false, new Map());
    console.log('After clicking (2,2):', state);
    console.log('Is it solved?', isWinningState(state));
    
    // Show actual solution
    if (solution && solution.length <= 3) {
      console.log('\nActual optimal solution path:');
      state = initial.map(row => [...row]);
      for (let i = 0; i < solution.length; i++) {
        const move = solution[i];
        state = applyClick(state, move.row, move.col, 2, false, new Map());
        console.log(`Step ${i+1}: Click (${move.row},${move.col}) ->`, state);
      }
    }
  });
  it('should verify the Basic Click example', () => {
    // Green center with red around
    const initial = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];
    
    console.log('\n=== Basic Click Example ===');
    console.log('Initial:', initial);
    console.log('Claims: Click center changes cross pattern');
    
    // Apply the click
    const after = applyClick(initial, 1, 1, 2, false, new Map());
    console.log('After clicking center:', after);
    console.log('✓ This example is correct - shows how click affects cross pattern');
  });
  
  it('should verify the One Click Win example', () => {
    // Blue corners, green cross
    const initial = [
      [2, 1, 2],
      [1, 1, 1],
      [2, 1, 2]
    ];
    
    console.log('\n=== One Click Win Example ===');
    console.log('Initial:', initial);
    console.log('Claims: Click center → all blue');
    
    const solution = findSolution(initial, 2);
    console.log('Actual solution:', solution);
    
    // Verify the claim
    const after = applyClick(initial, 1, 1, 2, false, new Map());
    console.log('After click center:', after);
    console.log('All same?', isWinningState(after));
    console.log(solution?.length === 1 ? '✓ CORRECT!' : '✗ INCORRECT!');
  });
  
  it('should verify the Two Clicks Win example', () => {
    // Red corners, green cross
    const initial = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ];
    
    console.log('\n=== Two Clicks Win Example ===');
    console.log('Initial:', initial);
    console.log('Claims: Click center twice → all red');
    
    const solution = findSolution(initial, 2);
    console.log('Actual solution:', solution);
    
    // Verify the claim
    let state = initial;
    state = applyClick(state, 1, 1, 2, false, new Map());
    state = applyClick(state, 1, 1, 2, false, new Map());
    console.log('After clicking center twice:', state);
    console.log('All same?', isWinningState(state));
    console.log(solution?.length === 2 && solution[0].row === 1 && solution[0].col === 1 ? '✓ CORRECT!' : '✗ INCORRECT!');
  });
  
  it('should verify the Corner Pattern example', () => {
    // The example with corners in different color
    const initial = [
      [1, 0, 1],
      [0, 0, 0], 
      [1, 0, 1]
    ];
    
    console.log('\n=== Corner Pattern Example ===');
    console.log('Initial:', initial);
    console.log('Need to check what the How to Play claims...');
    
    const solution = findSolution(initial, 2);
    console.log('Optimal solution:', solution);
    console.log(`Minimum moves needed: ${solution?.length || 'No solution'}`);
  });
  
  it('should verify the L-shape example', () => {
    // L-shape pattern
    const initial = [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0]
    ];
    
    console.log('\n=== L-Shape Example ===');
    console.log('Initial:', initial);
    console.log('Need to check what the How to Play claims...');
    
    const solution = findSolution(initial, 2);
    console.log('Optimal solution:', solution);
    console.log(`Minimum moves needed: ${solution?.length || 'No solution'}`);
    
    // Show what happens with the suggested moves
    if (solution && solution.length <= 3) {
      let state = initial.map(row => [...row]);
      for (const move of solution) {
        state = applyClick(state, move.row, move.col, 2, false, new Map());
        console.log(`After click (${move.row},${move.col}):`, state);
      }
    }
  });
  
  it('should find ACTUAL patterns for different move counts', () => {
    console.log('\n=== Finding REAL examples for different move counts ===');
    
    // Generate various patterns and find their solutions
    const testPatterns = [
      // Patterns likely to be 1 move
      [[2,1,2], [1,1,1], [2,1,2]], // We know this is 1
      [[1,0,1], [0,0,0], [1,0,1]], // Similar pattern
      
      // Patterns likely to be 2 moves
      [[0,1,0], [1,1,1], [0,1,0]], // We know this is 2
      [[1,2,1], [2,2,2], [1,2,1]], // Similar
      
      // Patterns likely to be 3+ moves
      [[0,0,0], [1,1,1], [0,0,0]], // Stripes
      [[0,1,0], [1,0,1], [0,1,0]], // Checkerboard
      [[0,0,0], [0,1,0], [0,0,0]], // Single center
      [[1,1,1], [1,0,1], [1,1,1]], // Single center different
    ];
    
    const results: {moves: number, pattern: number[][], solution: Move[]}[] = [];
    
    for (const pattern of testPatterns) {
      const solution = findSolution(pattern, 2, 5);
      if (solution) {
        results.push({
          moves: solution.length,
          pattern,
          solution
        });
      }
    }
    
    // Group by move count
    for (let moves = 1; moves <= 5; moves++) {
      const examples = results.filter(r => r.moves === moves);
      if (examples.length > 0) {
        console.log(`\n${moves} MOVE EXAMPLES:`);
        for (const ex of examples.slice(0, 2)) { // Show max 2 examples per move count
          console.log('Pattern:', ex.pattern);
          console.log('Solution:', ex.solution);
        }
      }
    }
  });
});