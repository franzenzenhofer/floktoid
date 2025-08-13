import { describe, it, expect } from 'vitest';
import {
  getBasePoints,
  calculateMoveBonus,
  calculateTimeBonus,
  calculatePerfectBonus,
  calculatePowerTileBonus,
  applyPenalties,
  calculateLevelScore,
  formatPoints
} from '../scoring';

describe('Scoring System', () => {
  describe('getBasePoints', () => {
    it('should return 50 points for tutorial levels (1-3)', () => {
      expect(getBasePoints(1)).toBe(50);
      expect(getBasePoints(2)).toBe(50);
      expect(getBasePoints(3)).toBe(50);
    });

    it('should return 100 points for levels 4-20', () => {
      expect(getBasePoints(4)).toBe(100);
      expect(getBasePoints(10)).toBe(100);
      expect(getBasePoints(20)).toBe(100);
    });

    it('should return 100 points for levels 21-50', () => {
      expect(getBasePoints(21)).toBe(100);
      expect(getBasePoints(35)).toBe(100);
      expect(getBasePoints(50)).toBe(100);
    });

    it('should increase by 100 every 50 levels', () => {
      expect(getBasePoints(51)).toBe(200);
      expect(getBasePoints(100)).toBe(200);
      expect(getBasePoints(101)).toBe(300);
      expect(getBasePoints(150)).toBe(300);
    });
  });

  describe('calculateMoveBonus', () => {
    it('should give 50% bonus for perfect play', () => {
      expect(calculateMoveBonus(5, 5, 100)).toBe(50);
      expect(calculateMoveBonus(10, 10, 200)).toBe(100);
    });

    it('should give super bonus for beating optimal path', () => {
      // 1 move saved: 50% + 20% = 70%
      expect(calculateMoveBonus(4, 5, 100)).toBe(70);
      // 2 moves saved: 50% + 40% = 90%
      expect(calculateMoveBonus(3, 5, 100)).toBe(90);
    });

    it('should reduce bonus by 10% per extra move', () => {
      // 1 extra move: 50% * 0.9 = 45%
      expect(calculateMoveBonus(6, 5, 100)).toBe(45);
      // 2 extra moves: 50% * 0.8 = 40%
      expect(calculateMoveBonus(7, 5, 100)).toBe(40);
    });

    it('should never go below 0', () => {
      expect(calculateMoveBonus(20, 5, 100)).toBe(0);
    });
  });

  describe('calculateTimeBonus', () => {
    it('should give 20% bonus for under 30 seconds', () => {
      expect(calculateTimeBonus(15, 100)).toBe(20);
      expect(calculateTimeBonus(29, 100)).toBe(20);
    });

    it('should give 10% bonus for 30-59 seconds', () => {
      expect(calculateTimeBonus(30, 100)).toBe(10);
      expect(calculateTimeBonus(59, 100)).toBe(10);
    });

    it('should give no bonus for 60+ seconds', () => {
      expect(calculateTimeBonus(60, 100)).toBe(0);
      expect(calculateTimeBonus(120, 100)).toBe(0);
    });
  });

  describe('calculatePerfectBonus', () => {
    it('should give 100% bonus when no hints used', () => {
      expect(calculatePerfectBonus(false, 100)).toBe(100);
    });

    it('should give no bonus when hints used', () => {
      expect(calculatePerfectBonus(true, 100)).toBe(0);
    });
  });

  describe('calculatePowerTileBonus', () => {
    it('should give 10% per power tile used optimally', () => {
      expect(calculatePowerTileBonus(1, 100)).toBe(10);
      expect(calculatePowerTileBonus(2, 100)).toBe(20);
      expect(calculatePowerTileBonus(3, 100)).toBe(30);
    });

    it('should give no bonus for zero power tiles', () => {
      expect(calculatePowerTileBonus(0, 100)).toBe(0);
    });
  });

  describe('applyPenalties', () => {
    it('should apply 25% penalty for undo usage', () => {
      expect(applyPenalties(100, true)).toBe(75);
      expect(applyPenalties(200, true)).toBe(150);
    });

    it('should not apply penalty when undo not used', () => {
      expect(applyPenalties(100, false)).toBe(100);
    });
  });

  describe('calculateLevelScore', () => {
    it('should return 0 points when hints are used', () => {
      const score = calculateLevelScore({
        level: 10,
        moves: 5,
        optimalMoves: 5,
        time: 20,
        hintsUsed: true,
        undoUsed: false,
        powerTilesUsedOptimally: 0
      });

      expect(score.totalPoints).toBe(0);
      expect(score.basePoints).toBe(0);
      expect(score.moveBonus).toBe(0);
      expect(score.timeBonus).toBe(0);
      expect(score.perfectBonus).toBe(0);
    });

    it('should calculate correct score for perfect play', () => {
      const score = calculateLevelScore({
        level: 10,
        moves: 10,
        optimalMoves: 10,
        time: 25,
        hintsUsed: false,
        undoUsed: false,
        powerTilesUsedOptimally: 0
      });

      // Base: 100, Move: 50, Time: 20, Perfect: 100 = 270
      expect(score.basePoints).toBe(100);
      expect(score.moveBonus).toBe(50);
      expect(score.timeBonus).toBe(20);
      expect(score.perfectBonus).toBe(100);
      expect(score.totalPoints).toBe(270);
    });

    it('should apply undo penalty correctly', () => {
      const score = calculateLevelScore({
        level: 10,
        moves: 10,
        optimalMoves: 10,
        time: 25,
        hintsUsed: false,
        undoUsed: true,
        powerTilesUsedOptimally: 0
      });

      // Base: 100, Move: 50, Time: 20, Perfect: 100 = 270
      // With undo penalty: 270 * 0.75 = 202.5 → 203
      expect(score.totalPoints).toBe(203);
    });

    it('should handle super efficiency correctly', () => {
      const score = calculateLevelScore({
        level: 10,
        moves: 8,
        optimalMoves: 10,
        time: 25,
        hintsUsed: false,
        undoUsed: false,
        powerTilesUsedOptimally: 0
      });

      // Base: 100, Move: 90 (super!), Time: 20, Perfect: 100 = 310
      expect(score.moveBonus).toBe(90);
      expect(score.totalPoints).toBe(310);
    });
  });

  describe('formatPoints', () => {
    it('should format numbers under 1000 as-is', () => {
      expect(formatPoints(0)).toBe('0');
      expect(formatPoints(123)).toBe('123');
      expect(formatPoints(999)).toBe('999');
    });

    it('should format 1000-9999 with one decimal', () => {
      expect(formatPoints(1000)).toBe('1.0k');
      expect(formatPoints(1234)).toBe('1.2k');
      expect(formatPoints(9999)).toBe('10.0k');
    });

    it('should format 10k-999k without decimals', () => {
      expect(formatPoints(10000)).toBe('10k');
      expect(formatPoints(12345)).toBe('12k');
      expect(formatPoints(999999)).toBe('1000k');
    });

    it('should format millions with M', () => {
      expect(formatPoints(1000000)).toBe('1.0M');
      expect(formatPoints(1234567)).toBe('1.2M');
      expect(formatPoints(9999999)).toBe('10.0M');
      expect(formatPoints(10000000)).toBe('10M');
      expect(formatPoints(123456789)).toBe('123M');
    });
  });
});