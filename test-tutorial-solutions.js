// Test tutorial pattern solutions manually
const { applyClick } = require('./dist/assets/index-C0QPZAq2.js');

// Helper to apply click
function simulateClick(grid, row, col, colors = 3) {
  const n = grid.length;
  const newGrid = grid.map(row => [...row]);
  
  // + pattern
  const deltas = [[0,0], [-1,0], [1,0], [0,-1], [0,1]];
  
  for (const [dr, dc] of deltas) {
    const nr = row + dr;
    const nc = col + dc;
    
    if (nr >= 0 && nr < n && nc >= 0 && nc < n) {
      newGrid[nr][nc] = (newGrid[nr][nc] + 1) % colors;
    }
  }
  
  return newGrid;
}

// Test Level 2
console.log("Testing Level 2 pattern...");
let grid2 = [
  [1, 2, 1],
  [1, 2, 1],
  [0, 1, 0]
];

console.log("Initial:", grid2);

// Apply first click: top center (0,1)
grid2 = simulateClick(grid2, 0, 1);
console.log("After click (0,1):", grid2);

// Apply second click: center (1,1) 
grid2 = simulateClick(grid2, 1, 1);
console.log("After click (1,1):", grid2);

// Test Level 3
console.log("\nTesting Level 3 pattern...");
let grid3 = [
  [1, 1, 1],
  [1, 1, 1],
  [1, 1, 1]
];

console.log("Initial:", grid3);

// Apply clicks as per solution
grid3 = simulateClick(grid3, 0, 0); // top-left
console.log("After click (0,0):", grid3);

grid3 = simulateClick(grid3, 0, 2); // top-right
console.log("After click (0,2):", grid3);

grid3 = simulateClick(grid3, 2, 1); // bottom-center
console.log("After click (2,1):", grid3);