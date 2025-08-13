import { describe, it, expect } from 'vitest';
import { getTutorialPattern, isTutorialLevel, getTutorialCompleteMessage } from '../../src/utils/tutorialPatterns';

// Function to apply a click with 2 colors
function applyClick(grid: number[][], row: number, col: number): number[][] {
  const newGrid = grid.map(r => [...r]);
  const size = grid.length;
  
  // Click the tile itself
  newGrid[row][col] = (newGrid[row][col] + 1) % 2;
  
  // Click adjacent tiles (cross pattern)
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < size && newCol >= 0 && newCol < size) {
      newGrid[newRow][newCol] = (newGrid[newRow][newCol] + 1) % 2;
    }
  }
  
  return newGrid;
}

describe('Tutorial Patterns', () => {
  describe('getTutorialPattern', () => {
    it('should return patterns for levels 1-3', () => {
      expect(getTutorialPattern(1)).toBeDefined();
      expect(getTutorialPattern(2)).toBeDefined();
      expect(getTutorialPattern(3)).toBeDefined();
    });
    
    it('should return null for non-tutorial levels', () => {
      expect(getTutorialPattern(0)).toBeNull();
      expect(getTutorialPattern(4)).toBeNull();
      expect(getTutorialPattern(10)).toBeNull();
    });
    
    it('should have valid 3x3 grids for all tutorial levels', () => {
      for (let level = 1; level <= 3; level++) {
        const pattern = getTutorialPattern(level);
        expect(pattern).toBeDefined();
        if (pattern) {
          expect(pattern.initialGrid).toHaveLength(3);
          expect(pattern.targetGrid).toHaveLength(3);
          pattern.initialGrid.forEach(row => {
            expect(row).toHaveLength(3);
            row.forEach(cell => {
              expect(cell).toBeGreaterThanOrEqual(0);
              expect(cell).toBeLessThan(2); // Only 2 colors (0,1)
            });
          });
        }
      }
    });
    
    it('should have all zeros as target for all tutorial levels', () => {
      for (let level = 1; level <= 3; level++) {
        const pattern = getTutorialPattern(level);
        expect(pattern).toBeDefined();
        if (pattern) {
          pattern.targetGrid.forEach(row => {
            row.forEach(cell => {
              expect(cell).toBe(0);
            });
          });
        }
      }
    });
    
    it('should have correct number of moves in solution', () => {
      const expectedMoves = [1, 2, 3];
      for (let level = 1; level <= 3; level++) {
        const pattern = getTutorialPattern(level);
        expect(pattern).toBeDefined();
        if (pattern) {
          expect(pattern.solution).toHaveLength(expectedMoves[level - 1]);
        }
      }
    });
    
    it('should have solvable patterns with given solutions', () => {
      for (let level = 1; level <= 3; level++) {
        const pattern = getTutorialPattern(level);
        expect(pattern).toBeDefined();
        if (pattern) {
          let currentGrid = pattern.initialGrid.map(row => [...row]);
          
          // Apply all moves in the solution
          for (const move of pattern.solution) {
            currentGrid = applyClick(currentGrid, move.row, move.col);
          }
          
          // Check if solved
          const solved = currentGrid.every((row, r) => 
            row.every((cell, c) => cell === pattern.targetGrid[r][c])
          );
          
          expect(solved).toBe(true);
        }
      }
    });
    
    it('should have unique patterns for each level', () => {
      const pattern1 = getTutorialPattern(1);
      const pattern2 = getTutorialPattern(2);
      const pattern3 = getTutorialPattern(3);
      
      expect(pattern1).toBeDefined();
      expect(pattern2).toBeDefined();
      expect(pattern3).toBeDefined();
      
      if (pattern1 && pattern2 && pattern3) {
        // Check that initial grids are different
        expect(JSON.stringify(pattern1.initialGrid)).not.toBe(JSON.stringify(pattern2.initialGrid));
        expect(JSON.stringify(pattern2.initialGrid)).not.toBe(JSON.stringify(pattern3.initialGrid));
        expect(JSON.stringify(pattern1.initialGrid)).not.toBe(JSON.stringify(pattern3.initialGrid));
      }
    });
    
    it('level 3 should have L-shape pattern with 5 tiles to flip', () => {
      const pattern = getTutorialPattern(3);
      expect(pattern).toBeDefined();
      if (pattern) {
        let onesCount = 0;
        for (const row of pattern.initialGrid) {
          for (const cell of row) {
            if (cell === 1) onesCount++;
          }
        }
        expect(onesCount).toBe(5);
        
        // Check L-shape: corners should have 1s
        expect(pattern.initialGrid[0][0]).toBe(1); // top-left
        expect(pattern.initialGrid[0][2]).toBe(1); // top-right
        expect(pattern.initialGrid[2][0]).toBe(1); // bottom-left
      }
    });
  });
  
  describe('isTutorialLevel', () => {
    it('should return true for levels 1-3', () => {
      expect(isTutorialLevel(1)).toBe(true);
      expect(isTutorialLevel(2)).toBe(true);
      expect(isTutorialLevel(3)).toBe(true);
    });
    
    it('should return false for non-tutorial levels', () => {
      expect(isTutorialLevel(0)).toBe(false);
      expect(isTutorialLevel(4)).toBe(false);
      expect(isTutorialLevel(10)).toBe(false);
      expect(isTutorialLevel(100)).toBe(false);
    });
  });
  
  describe('getTutorialCompleteMessage', () => {
    it('should return correct progress messages', () => {
      expect(getTutorialCompleteMessage(1)).toBe('1/3');
      expect(getTutorialCompleteMessage(2)).toBe('2/3');
      expect(getTutorialCompleteMessage(3)).toBe('3/3');
    });
    
    it('should return empty string for non-tutorial levels', () => {
      expect(getTutorialCompleteMessage(0)).toBe('');
      expect(getTutorialCompleteMessage(4)).toBe('');
      expect(getTutorialCompleteMessage(10)).toBe('');
    });
  });
});