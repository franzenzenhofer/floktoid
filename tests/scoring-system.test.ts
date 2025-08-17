import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringSystem, ScoringEvent, POINT_VALUES } from '../src/engine/ScoringSystem';
import CentralConfig from '../src/engine/CentralConfig';

const { SIZES } = CentralConfig;

describe('ScoringSystem', () => {
  let scoringSystem: ScoringSystem;
  
  beforeEach(() => {
    scoringSystem = new ScoringSystem();
    scoringSystem.reset();
  });
  
  describe('Basic Scoring', () => {
    it('should start with 1000 points', () => {
      expect(scoringSystem.getScore()).toBe(1000);
    });
    
    it('should never allow negative scores', () => {
      scoringSystem.reset();
      // Spend all starting points
      for (let i = 0; i < 10; i++) {
        scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -200 points each
      }
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
      // Starting with 1000 points
      // Test minimum cost (size 10)
      const minSize = SIZES.ASTEROID.MIN;
      const minCost = scoringSystem.calculateAsteroidCost(minSize);
      expect(minCost).toBe(10); // Minimum is 10 points
      
      // Test maximum cost (size 75 - actual max)
      const maxSize = SIZES.ASTEROID.MAX_CHARGE_SIZE;
      const maxCost = scoringSystem.calculateAsteroidCost(maxSize);
      expect(maxCost).toBe(200); // Minimum for max size is 200
      
      // Test size 60 (which is not max anymore)
      const cost60 = scoringSystem.calculateAsteroidCost(60);
      // sizeFactor = (60-10)/(75-10) = 50/65 = 0.769
      // minCost = 10 + 190 * 0.769 = 10 + 146 = 156
      // percentageCost = 1000 * (0.01 + 0.09*0.769) = 1000 * 0.079 = 79
      // max(156, 79) = 156
      expect(cost60).toBe(156);
      
      // Test with higher score to see percentage-based cost
      // Reset combo first to avoid combo multipliers
      scoringSystem.reset();
      // Add lots of points
      for (let i = 0; i < 5; i++) {
        scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED); // +400 each (may combo)
      }
      const highScore = scoringSystem.getScore();
      // For size 75 (max): should be 10% of score (but at least 200)
      const maxCostHighScore = scoringSystem.calculateAsteroidCost(maxSize);
      const expectedCost = Math.max(Math.round(highScore * 0.1), 200);
      expect(maxCostHighScore).toBe(expectedCost); // Should be 10% of current score
      
      // Test medium cost (size 35) at original 1000 points
      scoringSystem.reset();
      const mediumCost = scoringSystem.calculateAsteroidCost(35);
      expect(mediumCost).toBeGreaterThan(10);
      expect(mediumCost).toBeLessThan(200);
    });
    
    it('should award points for bird hits', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.BIRD_HIT);
    });
    
    it('should award bonus points for hitting birds with energy', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.BIRD_WITH_ENERGY_HIT);
    });
    
    it('should award points for reclaiming energy dots', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_RECLAIMED);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.ENERGY_DOT_RECLAIMED);
    });
    
    it('should award points for catching falling dots', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_CAUGHT_FALLING);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.ENERGY_DOT_CAUGHT_FALLING);
    });
    
    it('should check if player can afford asteroid', () => {
      scoringSystem.reset(); // Start with 1000 points
      
      // Can afford small asteroid
      expect(scoringSystem.canAffordAsteroid(10)).toBe(true);
      
      // Can afford large asteroid
      expect(scoringSystem.canAffordAsteroid(60)).toBe(true);
      
      // Spend most points
      // First launch: costs 200 (minimum for size 60)
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 });
      // Second launch: costs 200
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 });
      // Third launch: costs 156 (because score is now 600, 10% = 60, but min is higher)
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 });
      
      // Check remaining score - it's not exactly 200 due to percentage-based calculation
      const remainingScore = scoringSystem.getScore();
      expect(remainingScore).toBeGreaterThan(0);
      
      // Check if can still afford large asteroid
      const canAfford = scoringSystem.canAffordAsteroid(60);
      
      // Keep launching until we can't afford any more
      while (scoringSystem.canAffordAsteroid(60)) {
        scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 });
      }
      
      // Should now have very few points left
      const finalScore = scoringSystem.getScore();
      expect(finalScore).toBeLessThan(200);
      
      // If score is above 10, can still afford smallest asteroid
      // If score is exactly 0, can't afford anything
      if (finalScore === 0) {
        expect(scoringSystem.canAffordAsteroid(10)).toBe(false);
        expect(scoringSystem.canAffordAsteroid(60)).toBe(false);
      } else if (finalScore >= 10) {
        expect(scoringSystem.canAffordAsteroid(10)).toBe(true); // Can afford min size
        expect(scoringSystem.canAffordAsteroid(60)).toBe(finalScore >= 156); // Need 156 for size 60
      }
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
      const startScore = scoringSystem.getScore();
      // Build a 3x combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT); // 1x = 40
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT); // 1.2x = 48
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT); // 1.3x = 52
      
      const basePoints = POINT_VALUES.REWARDS.BIRD_HIT;
      // First hit: 40, Second hit: 40 * 1.2 = 48, Third hit: 40 * 1.3 = 52
      const expectedScore = startScore + basePoints + (basePoints * 1.2) + (basePoints * 1.3);
      
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
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.MULTI_KILL, { count: 3 });
      const expectedPoints = POINT_VALUES.SPECIAL.MULTI_KILL * 3;
      expect(scoringSystem.getScore()).toBe(startScore + expectedPoints);
    });
    
    it('should award boss defeated points', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.BOSS_DEFEATED);
    });
    
    it('should award perfect wave bonus', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.PERFECT_WAVE);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.REWARDS.PERFECT_WAVE);
    });
    
    it('should award ricochet kill bonus', () => {
      const startScore = scoringSystem.getScore();
      scoringSystem.addEvent(ScoringEvent.RICOCHET_KILL);
      expect(scoringSystem.getScore()).toBe(startScore + POINT_VALUES.SPECIAL.RICOCHET_KILL);
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
      
      expect(scoringSystem.getScore()).toBe(1000); // Should reset to starting score
      
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
      // Start with 1000 points, add boss defeat
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED); // +400
      const scoreAfterBoss = scoringSystem.getScore();
      expect(scoreAfterBoss).toBe(1400); // 1000 starting + 400 boss
      
      // Launch small asteroid (at 1400, 1% = 14)
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 10 }); // -14
      expect(scoringSystem.getScore()).toBe(1386);
      
      // Launch size 60 asteroid (not max anymore)
      // At 1386, sizeFactor = 50/65 = 0.769
      // percentage = 0.01 + 0.09*0.769 = 0.079
      // cost = max(1386 * 0.079, 156) = max(110, 156) = 156
      scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 }); // -156
      expect(scoringSystem.getScore()).toBe(1230);
      
      // Try to go negative with many launches
      // But costs change as score decreases
      let expectedScore = 1230;
      for (let i = 0; i < 10; i++) {
        const cost = scoringSystem.calculateAsteroidCost(60);
        if (expectedScore >= cost) {
          scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size: 60 });
          expectedScore -= cost;
        }
      }
      
      // Should never go below 0
      expect(scoringSystem.getScore()).toBeGreaterThanOrEqual(0);
    });
  });
});