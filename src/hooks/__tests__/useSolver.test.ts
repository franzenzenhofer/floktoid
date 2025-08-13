import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { bfsSolve, useSolution } from '../useSolver';

describe('useSolver', () => {
  describe('bfsSolve', () => {
    it('should solve a simple puzzle', async () => {
      const grid = [
        [0, 0],
        [0, 1]
      ];
      const power = new Set<string>();
      const locked = new Map<string, number>();
      
      const result = await bfsSolve(grid, power, locked, 2);
      
      expect(result.solution).toBeDefined();
      expect(result.solution.length).toBeGreaterThan(0);
      expect(result.statesExplored).toBeGreaterThan(0);
    });

    it('should solve with power tiles', async () => {
      const grid = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0]
      ];
      const power = new Set(['1-1']); // Center is power tile
      const locked = new Map<string, number>();
      
      const result = await bfsSolve(grid, power, locked, 2);
      
      expect(result.solution).toBeDefined();
      // Solution should exist (power tiles still work in solver, just not generated)
      expect(result.solution.length).toBeGreaterThan(0);
    });

    it('should handle locked tiles', async () => {
      const grid = [
        [0, 0],
        [0, 1]
      ];
      const power = new Set<string>();
      const locked = new Map([['1-1', 2]]); // Bottom-right locked
      
      const result = await bfsSolve(grid, power, locked, 2);
      
      expect(result.solution).toBeDefined();
      // Should find solution without using locked tile
      expect(result.solution.every(move => !(move.row === 1 && move.col === 1))).toBe(true);
    });

    it('should return empty solution for already solved puzzle', async () => {
      const grid = [
        [1, 1],
        [1, 1]
      ];
      const result = await bfsSolve(grid, new Set(), new Map(), 2);
      
      expect(result.solution).toEqual([]);
      expect(result.statesExplored).toBe(0);
    });

    it('should handle unsolvable puzzles', async () => {
      // All tiles locked except one
      const grid = [
        [0, 1],
        [1, 0]
      ];
      const locked = new Map([
        ['0-1', 1],
        ['1-0', 1],
        ['1-1', 1]
      ]);
      
      const result = await bfsSolve(grid, new Set(), locked, 2);
      
      expect(result.solution).toEqual([]);
      expect(result.statesExplored).toBeGreaterThan(0);
    });
  });

  describe('useSolution', () => {
    it('should track solution progress', () => {
      const solution = [
        { row: 0, col: 0 },
        { row: 1, col: 1 },
        { row: 2, col: 2 }
      ];
      
      const { result } = renderHook(() => useSolution(solution));
      
      expect(result.current.step).toBe(0);
      expect(result.current.current).toEqual({ row: 0, col: 0 });
      expect(result.current.atEnd).toBe(false);
    });

    it('should advance through solution', () => {
      const solution = [
        { row: 0, col: 0 },
        { row: 1, col: 1 }
      ];
      
      const { result } = renderHook(() => useSolution(solution));
      
      act(() => {
        result.current.next();
      });
      
      expect(result.current.step).toBe(1);
      expect(result.current.current).toEqual({ row: 1, col: 1 });
      
      act(() => {
        result.current.next();
      });
      
      expect(result.current.step).toBe(2);
      expect(result.current.atEnd).toBe(true);
    });

    it('should not advance past end', () => {
      const solution = [{ row: 0, col: 0 }];
      const { result } = renderHook(() => useSolution(solution));
      
      act(() => {
        result.current.next();
      });
      
      expect(result.current.step).toBe(1);
      expect(result.current.atEnd).toBe(true);
      
      // Try to advance again - should stay at end
      act(() => {
        result.current.next();
      });
      
      expect(result.current.step).toBe(1);
      expect(result.current.atEnd).toBe(true);
    });

    it('should reset to beginning', () => {
      const solution = [
        { row: 0, col: 0 },
        { row: 1, col: 1 }
      ];
      
      const { result } = renderHook(() => useSolution(solution));
      
      act(() => {
        result.current.next();
        result.current.next();
      });
      
      expect(result.current.step).toBe(2);
      
      act(() => {
        result.current.reset();
      });
      
      expect(result.current.step).toBe(0);
      expect(result.current.current).toEqual({ row: 0, col: 0 });
      expect(result.current.atEnd).toBe(false);
    });

    it('should handle empty solution', () => {
      const { result } = renderHook(() => useSolution([]));
      
      expect(result.current.step).toBe(0);
      expect(result.current.current).toBeUndefined();
      expect(result.current.atEnd).toBe(true);
    });
  });
});