import { describe, it, expect } from 'vitest';
import { getTutorialPattern, isTutorialLevel, getTutorialCompleteMessage } from '../tutorialPatterns';
import { applyClick } from '../gridV2';

describe('Tutorial Patterns', () => {
  describe('getTutorialPattern', () => {
    it('should return correct pattern for level 1', () => {
      const pattern = getTutorialPattern(1);
      
      expect(pattern).toBeTruthy();
      expect(pattern!.level).toBe(1);
      expect(pattern!.solution).toHaveLength(1);
      expect(pattern!.solution[0]).toEqual({ row: 1, col: 1 }); // Center tile
      
      // Check initial grid pattern
      const grid = pattern!.initialGrid;
      expect(grid).toEqual([
        [0, 2, 0],
        [2, 2, 2],
        [0, 2, 0]
      ]);
    });
    
    it('should return correct pattern for level 2', () => {
      const pattern = getTutorialPattern(2);
      
      expect(pattern).toBeTruthy();
      expect(pattern!.level).toBe(2);
      expect(pattern!.solution).toHaveLength(2);
      expect(pattern!.solution[0]).toEqual({ row: 0, col: 0 });
      expect(pattern!.solution[1]).toEqual({ row: 1, col: 1 });
      
      // Check initial grid pattern
      const grid = pattern!.initialGrid;
      expect(grid).toEqual([
        [2, 1, 0],
        [1, 2, 2],
        [0, 2, 0]
      ]);
    });
    
    it('should return correct pattern for level 3', () => {
      const pattern = getTutorialPattern(3);
      
      expect(pattern).toBeTruthy();
      expect(pattern!.level).toBe(3);
      expect(pattern!.solution).toHaveLength(3);
      expect(pattern!.solution[0]).toEqual({ row: 0, col: 0 });
      expect(pattern!.solution[1]).toEqual({ row: 1, col: 1 });
      expect(pattern!.solution[2]).toEqual({ row: 2, col: 2 });
      
      // Check initial grid pattern
      const grid = pattern!.initialGrid;
      expect(grid).toEqual([
        [2, 1, 0],
        [1, 2, 1],
        [0, 1, 2]
      ]);
    });
    
    it('should return null for non-tutorial levels', () => {
      expect(getTutorialPattern(4)).toBeNull();
      expect(getTutorialPattern(10)).toBeNull();
      expect(getTutorialPattern(100)).toBeNull();
    });
    
    it('should have solvable patterns', () => {
      // All tutorial patterns should result in all zeros
      for (let level = 1; level <= 3; level++) {
        const pattern = getTutorialPattern(level);
        expect(pattern).toBeTruthy();
        
        const targetGrid = pattern!.targetGrid;
        for (const row of targetGrid) {
          for (const cell of row) {
            expect(cell).toBe(0);
          }
        }
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
    it('should return correct messages for tutorial levels', () => {
      expect(getTutorialCompleteMessage(1)).toBe('1/3');
      expect(getTutorialCompleteMessage(2)).toBe('2/3');
      expect(getTutorialCompleteMessage(3)).toBe('3/3');
    });
    
    it('should return empty string for non-tutorial levels', () => {
      expect(getTutorialCompleteMessage(4)).toBe('');
      expect(getTutorialCompleteMessage(10)).toBe('');
    });
  });
  
  describe('Solution Verification', () => {
    it('should solve level 1 with exactly 1 tap', () => {
      const pattern = getTutorialPattern(1)!;
      let grid = [...pattern.initialGrid.map(row => [...row])];
      
      // Apply the single tap
      grid = applyClick(grid, 1, 1, 3, false, new Map());
      
      expect(grid).toEqual(pattern.targetGrid);
    });
    
    it('should solve level 2 with exactly 2 taps', () => {
      const pattern = getTutorialPattern(2)!;
      let grid = [...pattern.initialGrid.map(row => [...row])];
      
      // Apply the two taps in order
      grid = applyClick(grid, 0, 0, 3, false, new Map());
      grid = applyClick(grid, 1, 1, 3, false, new Map());
      
      expect(grid).toEqual(pattern.targetGrid);
    });
    
    it('should solve level 3 with exactly 3 taps', () => {
      const pattern = getTutorialPattern(3)!;
      let grid = [...pattern.initialGrid.map(row => [...row])];
      
      // Apply the three taps in order
      grid = applyClick(grid, 0, 0, 3, false, new Map());
      grid = applyClick(grid, 1, 1, 3, false, new Map());
      grid = applyClick(grid, 2, 2, 3, false, new Map());
      
      expect(grid).toEqual(pattern.targetGrid);
    });
  });
});