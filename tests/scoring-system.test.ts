import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringSystem, ScoringEvent, POINT_VALUES } from '../src/engine/ScoringSystem';

describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;
  
  beforeEach(() => {
    scoringSystem = new ScoringSystem();
    scoringSystem.reset();
  });
  
  describe('Basic Scoring', () => {
    it('should never allow negative scores', () => {
      // Try to go negative with asteroid launches
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -200 points
      expect(scoringSystem.getScore()).toBe(0); // Should be 0, not negative
      
      // Add some points
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      const score = scoringSystem.getScore();
      expect(score).toBeGreaterThan(0);
      
      // Try to go negative again
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -200 points
      expect(scoringSystem.getScore()).toBe(0); // Should be 0, not negative
    });
    
    it('should calculate asteroid costs correctly', () => {
      // Test minimum cost (size 10)
      const minCost = scoringSystem.calculateAsteroidCost(10);
      expect(minCost).toBe(10);
      
      // Test maximum cost (size 60)
      const maxCost = scoringSystem.calculateAsteroidCost(60);
      expect(maxCost).toBe(200);
      
      // Test medium cost (size 35)
      const mediumCost = scoringSystem.calculateAsteroidCost(35);
      expect(mediumCost).toBeGreaterThan(10);
      expect(mediumCost).toBeLessThan(200);
      expect(mediumCost).toBeCloseTo(105, 0); // Roughly in the middle
    });
    
    it('should award points for bird hits', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.BIRD_HIT);
    });
    
    it('should award bonus points for hitting birds with energy', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.BIRD_WITH_ENERGY_HIT);
    });
    
    it('should award points for reclaiming energy dots', () => {
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_RECLAIMED);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.ENERGY_DOT_RECLAIMED);
    });
    
    it('should award points for catching falling dots', () => {
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_CAUGHT_FALLING);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.ENERGY_DOT_CAUGHT_FALLING);
    });
  });
  
  describe('Combo System', () => {
    it('should build combos correctly', () => {
      // First hit - no combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      let combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(1);
      expect(combo.multiplier).toBe(1);
      
      // Second hit - 2x combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(2);
      expect(combo.multiplier).toBe(POINT_VALUES.COMBOS.COMBO_2X);
      
      // Third hit - 3x combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(3);
      expect(combo.multiplier).toBe(POINT_VALUES.COMBOS.COMBO_3X);
      
      // Fifth hit - 5x combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(5);
      expect(combo.multiplier).toBe(POINT_VALUES.COMBOS.COMBO_5X);
    });
    
    it('should reset combo on energy dot loss', () => {
      // Build a combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      let combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(3);
      
      // Lose a dot - combo should reset
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_LOST);
      combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(0);
      expect(combo.multiplier).toBe(1);
    });
    
    it('should apply combo multiplier to points', () => {
      // Build a 3x combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const basePoints = POINT_VALUES.REWARDS.BIRD_HIT;
      const expectedScore = basePoints + basePoints * 2 + basePoints * 3; // 1x + 2x + 3x
      
      expect(scoringSystem.getScore()).toBe(expectedScore);
    });
    
    it('should timeout combo after window expires', () => {
      // Build a combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      let combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(2);
      
      // Simulate time passing (2.1 seconds)
      scoringSystem.updateComboTimer(2100);
      
      combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(0);
      expect(combo.multiplier).toBe(1);
    });
  });
  
  describe('Special Events', () => {
    it('should award multi-kill bonuses', () => {
      scoringSystem.addEvent(ScoringEvent.MULTI_KILL, { count: 3 });
      const expectedPoints = POINT_VALUES.SPECIAL.MULTI_KILL * 3;
      expect(scoringSystem.getScore()).toBe(expectedPoints);
    });
    
    it('should award boss defeated points', () => {
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.BOSS_DEFEATED);
    });
    
    it('should award perfect wave bonus', () => {
      scoringSystem.addEvent(ScoringEvent.PERFECT_WAVE);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.REWARDS.PERFECT_WAVE);
    });
    
    it('should award ricochet kill bonus', () => {
      scoringSystem.addEvent(ScoringEvent.RICOCHET_KILL);
      expect(scoringSystem.getScore()).toBe(POINT_VALUES.SPECIAL.RICOCHET_KILL);
    });
  });
  
  describe('Statistics Tracking', () => {
    it('should track total birds hit', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const stats = scoringSystem.getStatistics();
      expect(stats.totalBirdsHit).toBe(3);
    });
    
    it('should track asteroids launched', () => {
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 20 });
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 40 });
      
      const stats = scoringSystem.getStatistics();
      expect(stats.totalAsteroidsLaunched).toBe(2);
    });
    
    it('should track highest combo', () => {
      // Build a combo of 5
      for (let i = 0; i < 5; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      // Reset combo
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_LOST);
      
      // Build a combo of 3
      for (let i = 0; i < 3; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      const stats = scoringSystem.getStatistics();
      expect(stats.highestCombo).toBe(5);
    });
    
    it('should track accuracy', () => {
      scoringSystem.updateAccuracy(8, 2); // 8 hits, 2 misses
      const stats = scoringSystem.getStatistics();
      expect(stats.accuracy).toBe(80); // 80% accuracy
    });
  });
  
  describe('Score Breakdown', () => {
    it('should provide complete score breakdown', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const breakdown = scoringSystem.getScoreBreakdown();
      
      expect(breakdown.score).toBeGreaterThan(0);
      expect(breakdown.combo).toBe(2);
      expect(breakdown.multiplier).toBe(POINT_VALUES.COMBOS.COMBO_2X);
      expect(breakdown.comboTimeRemaining).toBeGreaterThanOrEqual(0);
      expect(breakdown.statistics).toBeDefined();
    });
  });
  
  describe('Reset Functionality', () => {
    it('should reset all values', () => {
      // Add some events
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      
      // Reset
      scoringSystem.reset();
      
      expect(scoringSystem.getScore()).toBe(0);
      
      const combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(0);
      expect(combo.multiplier).toBe(1);
      
      const stats = scoringSystem.getStatistics();
      expect(stats.totalBirdsHit).toBe(0);
      expect(stats.highestCombo).toBe(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle rapid-fire events', () => {
      // Simulate rapid hits
      for (let i = 0; i < 100; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      expect(scoringSystem.getScore()).toBeGreaterThan(0);
      const combo = scoringSystem.getComboInfo();
      expect(combo.count).toBe(100);
      expect(combo.multiplier).toBe(POINT_VALUES.COMBOS.COMBO_EPIC);
    });
    
    it('should handle mixed positive and negative events', () => {
      // Start with some points
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED); // +1000
      const scoreAfterBoss = scoringSystem.getScore();
      expect(scoreAfterBoss).toBe(1000);
      
      // Launch small asteroid
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 10 }); // -10
      expect(scoringSystem.getScore()).toBe(990);
      
      // Launch large asteroid
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -200
      expect(scoringSystem.getScore()).toBe(790);
      
      // Try to go negative with many launches
      for (let i = 0; i < 10; i++) {
        scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -200 each
      }
      
      // Should never go below 0
      expect(scoringSystem.getScore()).toBe(0);
    });
  });
});