import { describe, it, expect } from 'vitest';
import { computeScore, getDifficultyBonus } from '../score';

describe('Score Utilities', () => {
  describe('computeScore', () => {
    it('should calculate score with perfect efficiency', () => {
      const score = computeScore(10, 10, 60, 0, 100);
      // Base: 1000 + Efficiency: 100% = 1000 + Time bonus: 1000 + Difficulty: 100
      expect(score).toBe(1000 + 1000 + 1000 + 100);
    });

    it('should calculate score with time limit', () => {
      const score = computeScore(15, 10, 120, 600, 200);
      // Base: 1000 + Efficiency: 67% = 670 + Time bonus: (600-120)*5 = 2400 + Difficulty: 200
      expect(score).toBe(1000 + 670 + 2400 + 200);
    });

    it('should handle no time limit', () => {
      const score = computeScore(20, 15, 300, 0, 100);
      // Base: 1000 + Efficiency: 75% = 750 + Time bonus: 1000 (default) + Difficulty: 100
      expect(score).toBe(1000 + 750 + 1000 + 100);
    });

    it('should handle zero optimal moves', () => {
      const score = computeScore(20, 0, 100, 0, 100);
      // Base: 1000 + Efficiency: 100% (default) = 1000 + Time bonus: 1000 + Difficulty: 100
      expect(score).toBe(1000 + 1000 + 1000 + 100);
    });

    it('should handle time over limit', () => {
      const score = computeScore(10, 10, 700, 600, 100);
      // Base: 1000 + Efficiency: 100% = 1000 + Time bonus: 0 (negative clamped) + Difficulty: 100
      expect(score).toBe(1000 + 1000 + 0 + 100);
    });
  });

  describe('getDifficultyBonus', () => {
    it('should return correct bonus for each difficulty', () => {
      expect(getDifficultyBonus('easy')).toBe(100);
      expect(getDifficultyBonus('medium')).toBe(200);
      expect(getDifficultyBonus('hard')).toBe(300);
    });

    it('should return 0 for unknown difficulty', () => {
      expect(getDifficultyBonus('unknown')).toBe(0);
      expect(getDifficultyBonus('')).toBe(0);
    });
  });
});