# Mathematical Analysis of Puzzle Solvability

## Summary

Not every colored grid is guaranteed to be solvable. Whether a grid can be driven to a uniform color depends on the linear-algebraic properties of the "Lights-Out" matrix. Some board sizes have full-rank matrices (all configurations solvable), while others are rank-deficient (some configurations unsolvable).

## 1. Mathematical Foundation

### The Linear Model

- Current board state: N-vector **b** over ring ℤₖ (k = number of colors)
- Click influence matrix: **A** (N × N) where columns are influence patterns
- Any click sequence **x** produces: **b′ = A x (mod k)**
- Position **b** is solvable ⇔ **A x = b** has a solution ⇔ **b ∈ Im(A)**

### Rank Analysis for Common Board Sizes

| Board Size | Rank over ℤ₂ | Nullity | All Boards Solvable? |
|------------|---------------|---------|---------------------|
| 1×1 to 3×3 | Full (1,4,9)  | 0       | **YES** ✓          |
| **4×4**    | 12            | **4**   | **NO** ✗           |
| **5×5**    | 23            | **2**   | **NO** ✗           |
| 6×6 to 8×8 | Full          | 0       | **YES** ✓          |
| **9×9**    | 73            | **8**   | **NO** ✗           |
| 10×10      | 100           | 0       | **YES** ✓          |

### Quiet Patterns

For rank-deficient sizes, there exist "quiet patterns" in ker(**A**) that never change under any clicks. Example for 5×5:

```
 1 -1  0  1 -1
 0  0  0  0  0
-1  1  0 -1  1
 0  0  0  0  0
 1 -1  0  1 -1
```

Adding this pattern to any solvable board creates an unsolvable one.

## 2. Practical Solvability Check

```python
def is_solvable(board, k):
    b = vectorize(board)               # length N
    A = precomputed_influence_matrix   # N × N
    # Gaussian elimination mod k
    ok, _ = gauss_jordan(A, b, mod=k)
    return ok
```

If elimination detects inconsistency (e.g., `0 = 1 (mod k)`), the board is unsolvable.

## 3. Why Reverse-Generation is Safe

When starting from a solved grid and applying any sequence of clicks:
- Result is **by construction** in column-space of **A**
- It literally equals **A x** for some click sequence **x**
- Therefore **100% guaranteed solvable**

This works even on problematic sizes (4×4, 5×5) where arbitrary grids may be unsolvable.

## 4. Pure Functional Implementation

### Type Definitions
```typescript
type Color = number;           // 0 to k-1
type Vector = number[];        // length n²
type Matrix = number[][];      // n² × n²
type Grid = number[][];        // n × n
```

### Core Functions

```typescript
// Convert 2D grid to 1D vector relative to target color
function vectorize(grid: Grid, target: Color, k: number): Vector {
  const flat = grid.flat();
  return flat.map(c => (c - target + k) % k);
}

// Check if click at (r,c) affects cell (i,j)
function affects(n: number, r: number, c: number, i: number, j: number): boolean {
  return (r === i && c === j) ||
         (r === i && Math.abs(c - j) === 1) ||
         (c === j && Math.abs(r - i) === 1);
}

// Generate influence vector for one click
function influenceVector(n: number, r: number, c: number): Vector {
  const vec: Vector = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      vec.push(affects(n, r, c, i, j) ? 1 : 0);
    }
  }
  return vec;
}

// Build complete influence matrix
function influenceMatrix(n: number): Matrix {
  const mat: Matrix = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      mat.push(influenceVector(n, r, c));
    }
  }
  return mat;
}
```

### Modular Gaussian Elimination

```typescript
function gaussianEliminationMod(A: Matrix, b: Vector, k: number): Vector | null {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);
  
  // Forward elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let pivot = -1;
    for (let row = col; row < n; row++) {
      if (aug[row][col] % k !== 0) {
        pivot = row;
        break;
      }
    }
    
    if (pivot === -1) continue;
    
    // Swap rows
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    
    // Eliminate column
    const pivotVal = aug[col][col];
    const pivotInv = modInverse(pivotVal, k);
    
    // Scale pivot row
    for (let j = 0; j <= n; j++) {
      aug[col][j] = (aug[col][j] * pivotInv) % k;
    }
    
    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j <= n; j++) {
        aug[row][j] = (aug[row][j] - factor * aug[col][j] + k * k) % k;
      }
    }
  }
  
  // Check consistency
  for (let row = 0; row < n; row++) {
    let allZero = true;
    for (let col = 0; col < n; col++) {
      if (aug[row][col] !== 0) {
        allZero = false;
        break;
      }
    }
    if (allZero && aug[row][n] !== 0) {
      return null; // Inconsistent system
    }
  }
  
  // Back substitution
  const solution = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = aug[i][n];
  }
  
  return solution;
}

// Modular inverse for prime k
function modInverse(a: number, k: number): number {
  a = ((a % k) + k) % k;
  for (let x = 1; x < k; x++) {
    if ((a * x) % k === 1) {
      return x;
    }
  }
  throw new Error(`No modular inverse for ${a} mod ${k}`);
}
```

### Complete Solvability Check

```typescript
function isSolvable(grid: Grid, k: number): boolean {
  const n = grid.length;
  const A = influenceMatrix(n);
  
  // Try each possible target color
  for (let target = 0; target < k; target++) {
    const b = vectorize(grid, target, k);
    const solution = gaussianEliminationMod(A, b, k);
    if (solution !== null) {
      return true;
    }
  }
  
  return false;
}
```

## 5. Integration with Game

### When to Check Solvability

1. **After each player move** - Ensure game remains solvable
2. **Level editor** - Validate user-created levels
3. **Random level generation** - Verify if not using reverse-generation
4. **Hint system** - Detect unsolvable states early

### Performance Considerations

- Pre-compute and cache influence matrices per board size
- For n ≤ 10, matrices up to 100×100 run in milliseconds
- Testing all k target colors is still O(k·n⁶), negligible for small boards

## 6. Key Takeaways

1. **Not every grid is solvable** - Depends on matrix rank
2. **Reverse-generation guarantees solvability** - By construction
3. **Simple test exists** - Gaussian elimination mod k
4. **Some sizes always solvable** - 3×3, 6×6, 7×7, 8×8, 10×10
5. **Some sizes have unsolvable grids** - 4×4, 5×5, 9×9

## References

- [Lights Out Mathematics - Jaap Scherphuis](https://www.jaapsch.net/puzzles/lomath.htm)
- [Stack Overflow - Lights Out Algorithm](https://stackoverflow.com/questions/19795973/lights-out-game-algorithm)