import { describe, it, expect } from 'vitest';
import {
  isWinningState,
  getNextColor,
  calculateMoveEffect,
  applyMove,
  generatePuzzle,
  solvePuzzle,
  calculateScore,
  getDailySeed
} from '../src/game-logic.js';

describe('Game Logic', () => {
  describe('isWinningState', () => {
    it('should return true for uniform grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      expect(isWinningState(grid)).toBe(true);
    });

    it('should return false for non-uniform grid', () => {
      const grid = [
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      expect(isWinningState(grid)).toBe(false);
    });

    it('should handle empty grid', () => {
      expect(isWinningState([])).toBe(false);
    });
  });

  describe('getNextColor', () => {
    it('should cycle colors correctly', () => {
      expect(getNextColor(0, 3)).toBe(1);
      expect(getNextColor(1, 3)).toBe(2);
      expect(getNextColor(2, 3)).toBe(0);
    });
  });

  describe('calculateMoveEffect', () => {
    it('should calculate cross pattern for normal tile', () => {
      const effect = calculateMoveEffect(1, 1, 3, false);
      
      // Check cross pattern
      expect(effect[1][1]).toBe(1); // Center
      expect(effect[0][1]).toBe(1); // Top
      expect(effect[2][1]).toBe(1); // Bottom
      expect(effect[1][0]).toBe(1); // Left
      expect(effect[1][2]).toBe(1); // Right
      
      // Check corners are not affected
      expect(effect[0][0]).toBe(0);
      expect(effect[0][2]).toBe(0);
      expect(effect[2][0]).toBe(0);
      expect(effect[2][2]).toBe(0);
    });

    it('should calculate 3x3 area for power tile', () => {
      const effect = calculateMoveEffect(1, 1, 3, true);
      
      // All tiles should be affected
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(effect[r][c]).toBe(1);
        }
      }
    });

    it('should handle edge tiles correctly', () => {
      const effect = calculateMoveEffect(0, 0, 3, false);
      
      expect(effect[0][0]).toBe(1); // Clicked tile
      expect(effect[0][1]).toBe(1); // Right
      expect(effect[1][0]).toBe(1); // Bottom
      expect(effect[1][1]).toBe(0); // Not affected
    });
  });

  describe('applyMove', () => {
    it('should apply move correctly', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      
      const result = applyMove(grid, 1, 1, new Set(), new Map(), 3);
      
      // Check cross pattern changed
      expect(result.grid[1][1]).toBe(1); // Center
      expect(result.grid[0][1]).toBe(1); // Top
      expect(result.grid[2][1]).toBe(1); // Bottom
      expect(result.grid[1][0]).toBe(1); // Left
      expect(result.grid[1][2]).toBe(1); // Right
      
      // Check corners unchanged
      expect(result.grid[0][0]).toBe(0);
    });

    it('should respect locked tiles', () => {
      const grid = [[0, 0], [0, 0]];
      const locked = new Map([['0-1', 2]]);
      
      const result = applyMove(grid, 0, 0, new Set(), locked, 2);
      
      expect(result.grid[0][0]).toBe(1); // Changed
      expect(result.grid[0][1]).toBe(0); // Locked, unchanged
      expect(result.grid[1][0]).toBe(1); // Changed
    });

    it('should handle power tiles', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      const power = new Set(['1-1']);
      
      const result = applyMove(grid, 1, 1, power, new Map(), 3);
      
      // All 9 tiles should change
      expect(result.changedTiles.length).toBe(9);
      expect(result.isPowerMove).toBe(true);
    });
  });

  describe('generatePuzzle', () => {
    it('should generate solvable puzzle', async () => {
      const puzzle = await generatePuzzle('easy');
      
      expect(puzzle.grid).toBeDefined();
      expect(puzzle.grid.length).toBe(3); // 3x3 for easy
      expect(puzzle.solution).toBeDefined();
      expect(puzzle.verified).toBe(true);
      expect(puzzle.powerTiles).toBeInstanceOf(Array);
      expect(puzzle.lockedTiles).toBeInstanceOf(Object);
    });

    it('should respect difficulty settings', async () => {
      const easyPuzzle = await generatePuzzle('easy');
      const hardPuzzle = await generatePuzzle('hard');
      
      expect(easyPuzzle.grid.length).toBe(3);
      expect(hardPuzzle.grid.length).toBe(5);
      expect(hardPuzzle.reverseMoves.length).toBeGreaterThan(easyPuzzle.reverseMoves.length);
    });
  });

  describe('solvePuzzle', () => {
    it('should solve simple puzzle', async () => {
      const grid = [
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];
      
      const result = await solvePuzzle(grid, new Set(), new Map(), 2);
      
      expect(result.solvable).toBe(true);
      expect(result.solution).toBeDefined();
      expect(result.solution.length).toBeGreaterThan(0);
    });

    it('should detect already solved puzzle', async () => {
      const grid = [
        [0, 0],
        [0, 0]
      ];
      
      const result = await solvePuzzle(grid, new Set(), new Map(), 2);
      
      expect(result.solvable).toBe(true);
      expect(result.solution.length).toBe(0);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score correctly', () => {
      const score = calculateScore(10, 8, 120, 300, 'medium');
      
      expect(score).toBeGreaterThan(1000); // Base score
      expect(score).toBeGreaterThan(1500); // Should include efficiency bonus
    });

    it('should apply difficulty multiplier', () => {
      const easyScore = calculateScore(10, 10, 60, 0, 'easy');
      const hardScore = calculateScore(10, 10, 60, 0, 'hard');
      
      expect(hardScore).toBeGreaterThan(easyScore);
    });
  });

  describe('getDailySeed', () => {
    it('should generate consistent seed for same day', () => {
      const seed1 = getDailySeed();
      const seed2 = getDailySeed();
      
      expect(seed1).toBe(seed2);
      expect(typeof seed1).toBe('number');
      expect(seed1).toBeGreaterThan(0);
    });
  });
});