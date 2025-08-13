import { describe, it, expect } from 'vitest';
import { clone, nextColor, isWinningState, effectMatrix, applyEffect } from '../grid';

describe('Grid Utilities', () => {
  describe('clone', () => {
    it('should deep clone a 2D array', () => {
      const original = [[1, 2], [3, 4]];
      const cloned = clone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
      
      // Modify clone and verify original is unchanged
      cloned[0][0] = 99;
      expect(original[0][0]).toBe(1);
    });

    it('should handle empty arrays', () => {
      expect(clone([])).toEqual([]);
    });
  });

  describe('nextColor', () => {
    it('should cycle through colors', () => {
      expect(nextColor(0, 3)).toBe(1);
      expect(nextColor(1, 3)).toBe(2);
      expect(nextColor(2, 3)).toBe(0); // Wrap around
    });

    it('should handle single color', () => {
      expect(nextColor(0, 1)).toBe(0);
    });
  });

  describe('isWinningState', () => {
    it('should return true for uniform grid', () => {
      const grid = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ];
      expect(isWinningState(grid)).toBe(true);
    });

    it('should return false for non-uniform grid', () => {
      const grid = [
        [1, 1, 1],
        [1, 2, 1],
        [1, 1, 1]
      ];
      expect(isWinningState(grid)).toBe(false);
    });

    it('should handle empty grid', () => {
      expect(isWinningState([])).toBe(false);
    });

    it('should handle single cell', () => {
      expect(isWinningState([[5]])).toBe(true);
    });
  });

  describe('effectMatrix', () => {
    it('should create cross pattern for normal tile', () => {
      const matrix = effectMatrix(1, 1, 3, false);
      expect(matrix).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ]);
    });

    it('should create 3x3 pattern for power tile', () => {
      const matrix = effectMatrix(1, 1, 3, true);
      expect(matrix).toEqual([
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ]);
    });

    it('should handle edge cases', () => {
      // Top-left corner
      const cornerMatrix = effectMatrix(0, 0, 3, false);
      expect(cornerMatrix).toEqual([
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 0]
      ]);

      // Bottom-right corner power tile
      const powerCorner = effectMatrix(2, 2, 3, true);
      expect(powerCorner).toEqual([
        [0, 0, 0],
        [0, 1, 1],
        [0, 1, 1]
      ]);
    });
  });

  describe('applyEffect', () => {
    it('should apply effect matrix to grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      const effect = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ];
      
      const result = applyEffect(grid, effect, new Map(), 3);
      
      expect(result).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ]);
    });

    it('should respect locked tiles', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      const effect = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1]
      ];
      const locked = new Map([['1-1', 1]]);
      
      const result = applyEffect(grid, effect, locked, 3);
      
      expect(result[1][1]).toBe(0); // Center tile stays unchanged
      expect(result[0][0]).toBe(1); // Other tiles change
    });

    it('should cycle colors correctly', () => {
      const grid = [[2]];
      const effect = [[1]];
      
      const result = applyEffect(grid, effect, new Map(), 3);
      expect(result[0][0]).toBe(0); // 2 + 1 = 3, wraps to 0
    });
  });
});