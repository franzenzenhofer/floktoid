export const clone = <T,>(g: T[][]): T[][] => g.map(r => [...r]);

export const nextColor = (c: number, total: number) => (c + 1) % total;

export const isWinningState = (grid: number[][]): boolean => {
  if (!grid.length) return false;
  const first = grid[0][0];
  return grid.every(row => row.every(col => col === first));
};

/** Build an effect matrix (1 = tile changes) */
export function effectMatrix(
  row: number,
  col: number,
  size: number,
  isPower: boolean,
): number[][] {
  const m = Array(size).fill(null).map(() => Array(size).fill(0));
  
  if (isPower) {
    // 3x3 area for power tiles
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        m[r][c] = 1;
      }
    }
  } else {
    // Cross pattern for normal tiles
    m[row][col] = 1;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    dirs.forEach(([dr, dc]) => {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        m[nr][nc] = 1;
      }
    });
  }
  
  return m;
}

export function applyEffect(
  grid: number[][],
  effectMatrix: number[][],
  locked: Map<string, number>,
  colors: number
): number[][] {
  const result = clone(grid);
  const size = grid.length;
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (effectMatrix[r][c] && !locked.has(`${r}-${c}`)) {
        result[r][c] = nextColor(result[r][c], colors);
      }
    }
  }
  
  return result;
}