import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SolvabilityGuarantee } from '../SolvabilityGuarantee';
import { GenerationResult } from '../../hooks/useGenerator';
import * as solvabilityUtils from '../../utils/solvability';

// Mock the solvability utility
vi.mock('../../utils/solvability', () => ({
  isSolvable: vi.fn()
}));

describe('SolvabilityGuarantee', () => {
  let solvabilityGuarantee: SolvabilityGuarantee;
  
  beforeEach(() => {
    // Reset singleton instance
    // @ts-expect-error - accessing private for testing
    SolvabilityGuarantee.instance = undefined;
    solvabilityGuarantee = SolvabilityGuarantee.getInstance();
    
    // Reset mocks
    vi.clearAllMocks();
  });
  
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SolvabilityGuarantee.getInstance();
      const instance2 = SolvabilityGuarantee.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('preValidateGeneration', () => {
    it('should validate valid generation parameters', async () => {
      const result = await solvabilityGuarantee.preValidateGeneration(5, 3, 10);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });
    
    it('should reject invalid grid size', async () => {
      const resultTooSmall = await solvabilityGuarantee.preValidateGeneration(2, 3, 10);
      expect(resultTooSmall.valid).toBe(false);
      expect(resultTooSmall.reason).toContain('Grid size');
      
      const resultTooLarge = await solvabilityGuarantee.preValidateGeneration(21, 3, 10);
      expect(resultTooLarge.valid).toBe(false);
      expect(resultTooLarge.reason).toContain('Grid size');
    });
    
    it('should reject invalid colors', async () => {
      const resultTooFew = await solvabilityGuarantee.preValidateGeneration(5, 1, 10);
      expect(resultTooFew.valid).toBe(false);
      expect(resultTooFew.reason).toContain('Colors');
      
      const resultTooMany = await solvabilityGuarantee.preValidateGeneration(5, 8, 10);
      expect(resultTooMany.valid).toBe(false);
      expect(resultTooMany.reason).toContain('Colors');
    });
    
    it('should reject excessive required moves', async () => {
      const result = await solvabilityGuarantee.preValidateGeneration(3, 3, 200);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Required moves must be between 1 and 100');
    });
  });
  
  describe('verifyGeneration', () => {
    const mockGenerationResult: GenerationResult = {
      grid: [[0, 1], [1, 0]],
      solved: [[0, 0], [0, 0]],
      power: new Set<string>(),
      locked: new Map<string, number>(),
      solution: [{ row: 0, col: 0 }],
      reverse: [{ row: 0, col: 0 }],
      optimalPath: [{ row: 0, col: 0 }],
      playerMoves: []
    };
    
    it('should verify via reverse-path when available', async () => {
      const result = await solvabilityGuarantee.verifyGeneration(mockGenerationResult);
      
      expect(result.isSolvable).toBe(true);
      expect(result.method).toBe('reverse-path');
      expect(result.confidence).toBe(1.0);
      expect(result.details?.requiredMoves).toBe(1);
    });
    
    it('should fall back to mathematical verification', async () => {
      vi.mocked(solvabilityUtils.isSolvable).mockReturnValue(true);
      
      const resultNoPath = { ...mockGenerationResult, optimalPath: [] };
      const result = await solvabilityGuarantee.verifyGeneration(resultNoPath);
      
      expect(result.isSolvable).toBe(true);
      expect(result.method).toBe('mathematical');
      expect(result.confidence).toBe(0.95);
    });
    
    it('should cache results', async () => {
      const result1 = await solvabilityGuarantee.verifyGeneration(mockGenerationResult);
      const result2 = await solvabilityGuarantee.verifyGeneration(mockGenerationResult);
      
      // Should return same result from cache
      expect(result1).toEqual(result2);
      expect(result2.checkTime).toBeLessThan(0.1); // Cache hit should be instant
    });
  });
  
  describe('checkRuntimeSolvability', () => {
    it('should check solvability during gameplay', async () => {
      vi.mocked(solvabilityUtils.isSolvable).mockReturnValue(true);
      
      const grid = [[0, 1], [1, 0]];
      const result = await solvabilityGuarantee.checkRuntimeSolvability(
        grid,
        2,
        new Set<string>(),
        new Map<string, number>()
      );
      
      expect(result.isSolvable).toBe(true);
      expect(result.method).toBe('mathematical');
      expect(solvabilityUtils.isSolvable).toHaveBeenCalledWith(
        grid,
        2,
        new Set<string>(),
        new Map<string, number>()
      );
    });
    
    it('should handle check failures gracefully', async () => {
      vi.mocked(solvabilityUtils.isSolvable).mockImplementation(() => {
        throw new Error('Check failed');
      });
      
      const grid = [[0, 1], [1, 0]];
      const result = await solvabilityGuarantee.checkRuntimeSolvability(
        grid,
        2,
        new Set<string>(),
        new Map<string, number>()
      );
      
      expect(result.isSolvable).toBe(true); // Assumes solvable on error
      expect(result.confidence).toBe(0.5);
    });
  });
  
  describe('getRecoveryStrategies', () => {
    it('should provide recovery strategies for unsolvable states', () => {
      const currentGrid = [[1, 1], [1, 1]];
      const originalGrid = [[0, 1], [1, 0]];
      const playerMoves = [{ row: 0, col: 0 }];
      
      const strategies = solvabilityGuarantee.getRecoveryStrategies(
        currentGrid,
        originalGrid,
        playerMoves
      );
      
      expect(strategies).toHaveLength(3);
      expect(strategies.map(s => s.type)).toEqual(['revert', 'regenerate', 'hint']);
    });
    
    it('should not include revert strategy when no moves made', () => {
      const currentGrid = [[1, 1], [1, 1]];
      const originalGrid = [[0, 1], [1, 0]];
      const playerMoves: { row: number; col: number }[] = [];
      
      const strategies = solvabilityGuarantee.getRecoveryStrategies(
        currentGrid,
        originalGrid,
        playerMoves
      );
      
      expect(strategies).toHaveLength(2);
      expect(strategies.map(s => s.type)).toEqual(['regenerate', 'hint']);
    });
  });
  
  describe('getPerformanceReport', () => {
    it('should track performance metrics', async () => {
      vi.mocked(solvabilityUtils.isSolvable).mockReturnValue(true);
      
      // Perform some checks
      const grid = [[0, 1], [1, 0]];
      await solvabilityGuarantee.checkRuntimeSolvability(grid, 2, new Set(), new Map());
      
      const report = solvabilityGuarantee.getPerformanceReport();
      
      expect(report.totalChecks).toBe(1);
      expect(report.failedChecks).toBe(0);
      expect(report.failureRate).toBe(0);
      expect(report.averageCheckTime).toBeGreaterThan(0);
    });
    
    it('should calculate failure rate correctly', async () => {
      vi.mocked(solvabilityUtils.isSolvable)
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      
      const grid = [[0, 1], [1, 0]];
      
      // Clear cache between calls by modifying grid slightly
      await solvabilityGuarantee.checkRuntimeSolvability(grid, 2, new Set(), new Map());
      await solvabilityGuarantee.checkRuntimeSolvability([[0, 2], [1, 0]], 3, new Set(), new Map());
      await solvabilityGuarantee.checkRuntimeSolvability([[1, 1], [1, 0]], 2, new Set(), new Map());
      
      const report = solvabilityGuarantee.getPerformanceReport();
      
      expect(report.totalChecks).toBe(3);
      expect(report.failedChecks).toBe(1);
      expect(report.failureRate).toBeCloseTo(1/3, 5);
    });
  });
  
  describe('reset', () => {
    it('should clear caches and reset metrics', async () => {
      vi.mocked(solvabilityUtils.isSolvable).mockReturnValue(true);
      
      // Perform a check
      const grid = [[0, 1], [1, 0]];
      await solvabilityGuarantee.checkRuntimeSolvability(grid, 2, new Set(), new Map());
      
      // Reset
      solvabilityGuarantee.reset();
      
      const report = solvabilityGuarantee.getPerformanceReport();
      expect(report.totalChecks).toBe(0);
      expect(report.failedChecks).toBe(0);
      expect(report.checkTimes).toHaveLength(0);
    });
  });
});