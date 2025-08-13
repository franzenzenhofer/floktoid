import { renderHook } from '@testing-library/react';
import { useGenerator } from '../useGenerator';
import { DIFFICULTIES } from '../../constants/gameConfig';
import { applyClick, isWinningState } from '../../utils/gridV2';

describe('useGenerator - Complete Test Suite', () => {
  describe('Guaranteed Solvability', () => {
    it('should generate 100% solvable puzzles using reverse-move method', async () => {
      const { result } = renderHook(() => useGenerator());
      
      // Test 50 puzzles for each difficulty
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        for (let i = 0; i < 50; i++) {
          const conf = DIFFICULTIES[difficulty];
          const puzzleData = await result.current.generate(conf, 1);
          
          // Verify structure
          expect(puzzleData.grid).toHaveLength(conf.size);
          expect(puzzleData.optimalPath).toHaveLength(puzzleData.reverse.length);
          expect(puzzleData.solution).toEqual(puzzleData.optimalPath);
          
          // Verify that applying the optimal path solves the puzzle
          let testGrid = puzzleData.grid.map(row => [...row]);
          
          // When testing, we need to simulate locked tiles decrementing
          const testLocked = new Map<string, number>();
          for (const [key, value] of puzzleData.locked) {
            testLocked.set(key, value);
          }
          
          for (const move of puzzleData.optimalPath) {
            const isPower = puzzleData.power.has(`${move.row}-${move.col}`);
            testGrid = applyClick(testGrid, move.row, move.col, conf.colors, isPower, testLocked);
            
            // Decrement locked tiles after each move
            for (const [key, value] of testLocked) {
              if (value > 1) {
                testLocked.set(key, value - 1);
              } else {
                testLocked.delete(key);
              }
            }
          }
          
          // Should be solved (all same color)
          expect(isWinningState(testGrid)).toBe(true);
        }
      }
    });
    
    it('should ensure optimal path is exactly reverse of generation', async () => {
      const { result } = renderHook(() => useGenerator());
      const conf = DIFFICULTIES.easy;
      
      const puzzleData = await result.current.generate(conf, 1);
      
      // Optimal path should be reverse of generation history
      const reversedGeneration = [...puzzleData.reverse].reverse();
      expect(puzzleData.optimalPath).toEqual(reversedGeneration);
      
      // Solution should equal optimal path
      expect(puzzleData.solution).toEqual(puzzleData.optimalPath);
    });
  });
  
  describe('Level Progression', () => {
    it('should increase move count with level progression', async () => {
      const { result } = renderHook(() => useGenerator());
      const conf = DIFFICULTIES.easy;
      
      const moveCounts: number[] = [];
      
      for (let level = 1; level <= 10; level++) {
        const puzzleData = await result.current.generate(conf, level);
        moveCounts.push(puzzleData.optimalPath.length);
      }
      
      // Moves should generally increase (allow some variation due to randomness)
      expect(moveCounts[0]).toBe(3); // Level 1 should have base moves
      expect(moveCounts[9]).toBeGreaterThan(moveCounts[0]); // Level 10 should have more
      expect(moveCounts[9]).toBeLessThanOrEqual(8); // But not exceed max for easy
    });
    
    it('should scale difficulty appropriately for each mode', async () => {
      const { result } = renderHook(() => useGenerator());
      
      // Test level 5 for each difficulty
      const easyLevel5 = await result.current.generate(DIFFICULTIES.easy, 5);
      const mediumLevel5 = await result.current.generate(DIFFICULTIES.medium, 5);
      const hardLevel5 = await result.current.generate(DIFFICULTIES.hard, 5);
      
      // Base moves: easy=3, medium=5, hard=7
      // At level 5, they should have scaled up
      expect(easyLevel5.optimalPath.length).toBeGreaterThan(3);
      expect(easyLevel5.optimalPath.length).toBeLessThanOrEqual(8);
      
      expect(mediumLevel5.optimalPath.length).toBeGreaterThan(5);
      expect(mediumLevel5.optimalPath.length).toBeLessThanOrEqual(10);
      
      expect(hardLevel5.optimalPath.length).toBeGreaterThan(7);
      expect(hardLevel5.optimalPath.length).toBeLessThanOrEqual(14);
    });
  });
  
  describe('Special Tiles', () => {
    it('should place locked tiles outside optimal path', async () => {
      const { result } = renderHook(() => useGenerator());
      const conf = DIFFICULTIES.medium;
      
      // Generate multiple puzzles to ensure consistency
      for (let i = 0; i < 20; i++) {
        const puzzleData = await result.current.generate(conf, 2);
        
        if (puzzleData.locked.size > 0) {
          // Create set of optimal path positions
          const optimalPathSet = new Set(
            puzzleData.optimalPath.map(m => `${m.row}-${m.col}`)
          );
          
          // No locked tile should be on optimal path
          for (const [key] of puzzleData.locked) {
            expect(optimalPathSet.has(key)).toBe(false);
          }
        }
      }
    });
    
    it('should not place locked tiles on power tiles', async () => {
      const { result } = renderHook(() => useGenerator());
      const conf = DIFFICULTIES.hard;
      
      const puzzleData = await result.current.generate(conf, 3);
      
      // Locked tiles and power tiles should not overlap
      for (const [key] of puzzleData.locked) {
        expect(puzzleData.power.has(key)).toBe(false);
      }
    });
    
    it('should respect power tile limits', async () => {
      const { result } = renderHook(() => useGenerator());
      const conf = DIFFICULTIES.hard;
      
      const puzzleData = await result.current.generate(conf, 1);
      
      // Should have at most 3 power tiles
      expect(puzzleData.power.size).toBeLessThanOrEqual(3);
      
      if (conf.powerTileChance > 0) {
        // Should have at least 1 power tile (with high probability)
        expect(puzzleData.power.size).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Click Mechanics', () => {
    it('should apply normal click in + pattern', async () => {
      const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const result = applyClick(grid, 1, 1, 3, false, new Map());
      
      // Center and 4 neighbors should be affected
      expect(result[1][1]).toBe(1); // Center
      expect(result[0][1]).toBe(1); // Top
      expect(result[2][1]).toBe(1); // Bottom
      expect(result[1][0]).toBe(1); // Left
      expect(result[1][2]).toBe(1); // Right
      
      // Corners should not be affected
      expect(result[0][0]).toBe(0);
      expect(result[0][2]).toBe(0);
      expect(result[2][0]).toBe(0);
      expect(result[2][2]).toBe(0);
    });
    
    it('should apply power click in 3x3 pattern', async () => {
      const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const result = applyClick(grid, 1, 1, 3, true, new Map());
      
      // All 9 cells should be affected
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          expect(result[r][c]).toBe(1);
        }
      }
    });
    
    it('should respect locked tiles', async () => {
      const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const locked = new Map([['0-1', 2]]); // Top-center is locked
      
      const result = applyClick(grid, 1, 1, 3, false, locked);
      
      // Locked tile should not change
      expect(result[0][1]).toBe(0);
      
      // Other tiles in pattern should change
      expect(result[1][1]).toBe(1);
      expect(result[2][1]).toBe(1);
      expect(result[1][0]).toBe(1);
      expect(result[1][2]).toBe(1);
    });
    
    it('should wrap colors correctly', async () => {
      const grid = [[2, 2, 2], [2, 2, 2], [2, 2, 2]];
      const result = applyClick(grid, 1, 1, 3, false, new Map());
      
      // Should wrap from 2 to 0 (with 3 colors: 0, 1, 2)
      expect(result[1][1]).toBe(0);
      expect(result[0][1]).toBe(0);
      expect(result[2][1]).toBe(0);
      expect(result[1][0]).toBe(0);
      expect(result[1][2]).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle corner clicks correctly', async () => {
      const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const result = applyClick(grid, 0, 0, 3, false, new Map());
      
      // Only 3 tiles affected (corner + 2 neighbors)
      expect(result[0][0]).toBe(1); // Corner
      expect(result[0][1]).toBe(1); // Right
      expect(result[1][0]).toBe(1); // Down
      
      // Rest unchanged
      expect(result[1][1]).toBe(0);
      expect(result[2][2]).toBe(0);
    });
    
    it('should handle power tiles at edges', async () => {
      const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const result = applyClick(grid, 0, 0, 3, true, new Map());
      
      // 3x3 pattern from corner affects only valid cells
      expect(result[0][0]).toBe(1);
      expect(result[0][1]).toBe(1);
      expect(result[1][0]).toBe(1);
      expect(result[1][1]).toBe(1);
      
      // Out of bounds cells are ignored
      expect(result[2][2]).toBe(0);
    });
  });
  
  describe('Performance', () => {
    it('should generate puzzles quickly', async () => {
      const { result } = renderHook(() => useGenerator());
      
      const startTime = Date.now();
      const promises = [];
      
      // Generate 100 puzzles in parallel
      for (let i = 0; i < 100; i++) {
        promises.push(result.current.generate(DIFFICULTIES.medium, 1));
      }
      
      await Promise.all(promises);
      const endTime = Date.now();
      
      // Should complete in reasonable time (< 1 second for 100 puzzles)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});