/**
 * Tests for updated scoring system with double/triple points
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringSystem, ScoringEvent, POINT_VALUES } from '../ScoringSystem';

describe('Updated Scoring System - Special Bird Types', () => {
  let scoringSystem: ScoringSystem;

  beforeEach(() => {
    scoringSystem = new ScoringSystem();
    scoringSystem.reset();
  });

  describe('Point Values', () => {
    it('should have correct base values', () => {
      expect(POINT_VALUES.REWARDS.BIRD_HIT).toBe(40);
      expect(POINT_VALUES.REWARDS.SHOOTER_HIT).toBe(80);
      expect(POINT_VALUES.REWARDS.SUPER_NAVIGATOR_HIT).toBe(80);
      expect(POINT_VALUES.REWARDS.BIRD_WITH_ENERGY_HIT).toBe(120);
    });

    it('should give double points for shooters', () => {
      const initialScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      const newScore = scoringSystem.getScore();
      
      expect(newScore - initialScore).toBe(80); // Double the base 40 points
    });

    it('should give double points for super navigators', () => {
      const initialScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      const newScore = scoringSystem.getScore();
      
      expect(newScore - initialScore).toBe(80); // Double the base 40 points
    });

    it('should give triple points for birds with energy dots', () => {
      const initialScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      const newScore = scoringSystem.getScore();
      
      expect(newScore - initialScore).toBe(120); // Triple the base 40 points
    });
  });

  describe('Combo System with Special Birds', () => {
    it('should apply combo multiplier to shooter points', () => {
      // Build up a combo first
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      // Now hit a shooter with 2x combo (1.2 multiplier)
      const scoreBeforeShooter = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      const scoreAfterShooter = scoringSystem.getScore();
      
      // 80 points * 1.3 multiplier (3x combo) = 104 points
      expect(scoreAfterShooter - scoreBeforeShooter).toBe(104);
    });

    it('should apply combo multiplier to super navigator points', () => {
      // Build up a combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const scoreBeforeNav = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      const scoreAfterNav = scoringSystem.getScore();
      
      // 80 points * 1.3 multiplier (3x combo) = 104 points
      expect(scoreAfterNav - scoreBeforeNav).toBe(104);
    });

    it('should apply combo multiplier to bird with energy dot points', () => {
      // Build up a combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const scoreBeforeDot = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      const scoreAfterDot = scoringSystem.getScore();
      
      // 120 points * 1.3 multiplier (3x combo) = 156 points
      expect(scoreAfterDot - scoreBeforeDot).toBe(156);
    });
  });

  describe('Statistics Tracking', () => {
    it('should count special birds as bird hits', () => {
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const stats = scoringSystem.getStatistics();
      expect(stats.totalBirdsHit).toBe(4); // All count as bird hits
    });

    it('should maintain combos with special birds', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      
      const comboInfo = scoringSystem.getComboInfo();
      expect(comboInfo.count).toBe(4); // All maintain combo
      expect(comboInfo.multiplier).toBe(1.3); // 3x combo multiplier
    });
  });

  describe('Mixed Scoring Scenarios', () => {
    it('should handle a realistic wave with mixed bird types', () => {
      const initialScore = scoringSystem.getScore();
      
      // Simulate a wave: 2 normal, 1 shooter, 1 super nav, 1 with dot
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);         // 40 points
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);         // 40 * 1.2 = 48 points
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);      // 80 * 1.3 = 104 points
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT); // 80 * 1.3 = 104 points
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT); // 120 * 1.5 = 180 points
      
      const finalScore = scoringSystem.getScore();
      const totalPoints = finalScore - initialScore;
      
      // Total: 40 + 48 + 104 + 104 + 180 = 476 points
      expect(totalPoints).toBe(476);
      
      const stats = scoringSystem.getStatistics();
      expect(stats.totalBirdsHit).toBe(5);
      expect(stats.highestCombo).toBe(5);
    });

    it('should prioritize bird with dot over special type', () => {
      // If a shooter has an energy dot, it should give triple points (not double)
      const initialScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      const newScore = scoringSystem.getScore();
      
      // Should give 120 points (triple), not 80 (double)
      expect(newScore - initialScore).toBe(120);
    });
  });

  describe('Score Display Values', () => {
    it('should provide correct breakdown for UI', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      
      const breakdown = scoringSystem.getScoreBreakdown();
      
      expect(breakdown.score).toBeGreaterThan(1000); // Started at 1000
      expect(breakdown.combo).toBe(4);
      expect(breakdown.multiplier).toBeGreaterThan(1);
      expect(breakdown.statistics.totalBirdsHit).toBe(4);
    });
  });
});