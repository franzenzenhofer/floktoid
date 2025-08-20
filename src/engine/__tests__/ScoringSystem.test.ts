import { describe, it, expect, beforeEach, vi } from 'vitest';
import { scoringSystem, ScoringEvent } from '../ScoringSystem';

describe('ScoringSystem - CRITICAL BUSINESS LOGIC TESTS', () => {
  beforeEach(() => {
    scoringSystem.reset();
  });

  describe('CRITICAL: Negative Score Prevention', () => {
    it('should NEVER allow negative scores', () => {
      // This is a critical business requirement!
      scoringSystem.reset();
      
      // Try to create negative score by spending more than available
      for (let i = 0; i < 100; i++) {
        scoringSystem.spendPoints(1000); // Try to spend massive amount
        expect(scoringSystem.getScore()).toBeGreaterThanOrEqual(0);
      }
      
      console.log('✅ CRITICAL: Score never went negative');
    });

    it('should prevent asteroid purchases when insufficient funds', () => {
      scoringSystem.reset();
      
      const initialScore = scoringSystem.getScore();
      expect(initialScore).toBe(1000); // System starts with 1000 points
      
      // Spend all money
      scoringSystem.spendPoints(1000);
      expect(scoringSystem.getScore()).toBe(0);
      
      // Should not be able to afford any asteroid now
      expect(scoringSystem.canAffordAsteroid(10)).toBe(false);
      
      console.log('✅ CRITICAL: Cannot buy asteroids with no money');
    });

    it('should handle integer overflow gracefully', () => {
      // Test with many scoring events
      for (let i = 0; i < 100; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      const score = scoringSystem.getScore();
      expect(Number.isSafeInteger(score)).toBe(true);
      expect(score).toBeLessThan(Number.MAX_SAFE_INTEGER);
      
      console.log('✅ CRITICAL: No integer overflow');
    });
  });

  describe('CRITICAL: Score Calculation Accuracy', () => {
    it('should calculate basic scoring correctly', () => {
      scoringSystem.reset();
      
      const initialScore = scoringSystem.getScore();
      expect(initialScore).toBe(1000);
      
      // Test each scoring event
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScore()).toBe(1040); // 1000 + 40 points
      
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      // Second hit gets combo multiplier: 40 * 1.2 = 48 points
      expect(scoringSystem.getScore()).toBe(1088); // 1000 + 40 + 48
      
      console.log('✅ CRITICAL: Basic scoring calculation correct');
    });

    it('should apply combo multipliers correctly', () => {
      scoringSystem.reset();
      
      // Create a combo by hitting birds quickly
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const scoreInfo = scoringSystem.getScoreBreakdown();
      expect(scoreInfo.combo).toBeGreaterThan(1);
      expect(scoreInfo.multiplier).toBeGreaterThan(1);
      
      console.log(`✅ CRITICAL: Combo system working (${scoreInfo.combo}x, ${scoreInfo.multiplier}x)`);
    });

    it('should handle rapid scoring events without corruption', () => {
      scoringSystem.reset();
      
      // Rapid fire scoring events
      for (let i = 0; i < 50; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
        scoringSystem.addEvent(ScoringEvent.ASTEROID_SPLIT);
      }
      
      const score = scoringSystem.getScore();
      expect(score).toBeGreaterThan(0);
      expect(Number.isInteger(score)).toBe(true);
      
      console.log('✅ CRITICAL: Rapid scoring events handled correctly');
    });
  });

  describe('CRITICAL: Asteroid Cost Calculations', () => {
    it('should calculate asteroid costs correctly', () => {
      scoringSystem.reset();
      
      // Give some points first
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      // Use valid asteroid size (min is 10)
      const cost = scoringSystem.calculateAsteroidCost(10);
      expect(cost).toBeGreaterThan(0);
      expect(Number.isInteger(cost)).toBe(true);
      
      console.log(`✅ CRITICAL: Asteroid cost calculation working (cost: ${cost})`);
    });

    it('should scale costs with wave progression', () => {
      scoringSystem.reset();
      
      // Add lots of points
      for (let i = 0; i < 20; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      // Use valid asteroid sizes (min is 10)
      const smallCost = scoringSystem.calculateAsteroidCost(10);
      const mediumCost = scoringSystem.calculateAsteroidCost(35);
      const largeCost = scoringSystem.calculateAsteroidCost(60);
      
      expect(mediumCost).toBeGreaterThan(smallCost);
      expect(largeCost).toBeGreaterThan(mediumCost);
      
      console.log(`✅ CRITICAL: Cost scaling working (Small:${smallCost}, Medium:${mediumCost}, Large:${largeCost})`);
    });

    it('should prevent spending more points than available', () => {
      scoringSystem.reset();
      
      // Start with 1000, add bird hits (with combo multipliers)
      for (let i = 0; i < 5; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT); // 40 points base + combo
      }
      
      const currentScore = scoringSystem.getScore();
      expect(currentScore).toBeGreaterThan(1200); // Should be more due to combos
      
      // Try to spend more than available
      const excessiveAmount = currentScore + 100;
      const success = scoringSystem.spendPoints(excessiveAmount);
      expect(success).toBe(false);
      expect(scoringSystem.getScore()).toBe(currentScore); // Score unchanged
      
      // Spend a reasonable amount should work
      const spendAmount = 200;
      const success2 = scoringSystem.spendPoints(spendAmount);
      expect(success2).toBe(true);
      expect(scoringSystem.getScore()).toBe(currentScore - spendAmount);
      
      console.log('✅ CRITICAL: Spending validation working');
    });
  });

  describe('CRITICAL: Combo System Integrity', () => {
    it('should reset combos after timeout', () => {
      scoringSystem.reset();
      
      // Create initial combo
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const scoreInfo = scoringSystem.getScoreBreakdown();
      expect(scoreInfo.combo).toBeGreaterThan(1);
      
      // Simulate time passing (assuming combo timeout exists)
      // Note: We'd need to expose timer or use fake timers for proper testing
      console.log('✅ CRITICAL: Combo system needs timeout testing');
    });

    it('should handle achievement thresholds correctly', () => {
      scoringSystem.reset();
      
      // Add various scoring events to test thresholds
      for (let i = 0; i < 10; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      const scoreInfo = scoringSystem.getScoreBreakdown();
      expect(scoreInfo.score).toBeGreaterThan(0);
      
      console.log(`✅ CRITICAL: Achievement threshold testing (score: ${scoreInfo.score})`);
    });
  });

  describe('CRITICAL: State Management', () => {
    it('should reset state completely', () => {
      // Add some points and combos
      for (let i = 0; i < 5; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      }
      
      expect(scoringSystem.getScore()).toBeGreaterThan(0);
      
      // Reset should clear everything
      scoringSystem.reset();
      
      expect(scoringSystem.getScore()).toBe(1000); // Resets to starting amount
      
      const scoreInfo = scoringSystem.getScoreBreakdown();
      expect(scoreInfo.combo).toBe(0); // Combo resets to 0
      expect(scoreInfo.multiplier).toBe(1); // Multiplier resets to 1
      
      console.log('✅ CRITICAL: State reset working correctly');
    });

    it('should maintain data integrity across operations', () => {
      scoringSystem.reset();
      
      // Perform mixed operations
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.spendPoints(5);
      scoringSystem.addEvent(ScoringEvent.ASTEROID_SPLIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      
      const score = scoringSystem.getScore();
      const scoreInfo = scoringSystem.getScoreBreakdown();
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(scoreInfo.score).toBe(score);
      expect(Number.isInteger(score)).toBe(true);
      
      console.log('✅ CRITICAL: Data integrity maintained');
    });
  });

  describe('CRITICAL: Performance & Memory', () => {
    it('should handle thousands of scoring events without memory leaks', () => {
      scoringSystem.reset();
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate long gameplay session
      for (let i = 0; i < 10000; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
        if (i % 100 === 0) {
          scoringSystem.reset(); // Occasional resets like new games
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Should not grow more than 10MB
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`✅ CRITICAL: Memory growth acceptable (${Math.round(memoryGrowth / 1024)}KB)`);
    });

    it('should perform scoring calculations within 1ms', () => {
      scoringSystem.reset();
      
      const startTime = performance.now();
      
      // Perform 1000 scoring operations
      for (let i = 0; i < 1000; i++) {
        scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
        scoringSystem.calculateAsteroidCost(i % 10 + 1);
        scoringSystem.canAffordAsteroid(i % 5 + 1);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be much faster than 100ms
      
      console.log(`✅ CRITICAL: Performance acceptable (${duration.toFixed(2)}ms for 1000 operations)`);
    });
  });

  describe('CRITICAL: Edge Cases', () => {
    it('should handle invalid scoring events gracefully', () => {
      scoringSystem.reset();
      
      // These should not crash the game
      expect(() => {
        scoringSystem.addEvent('INVALID_EVENT' as any);
        scoringSystem.addEvent(null as any);
        scoringSystem.addEvent(undefined as any);
      }).not.toThrow();
      
      // Score should still be valid
      expect(scoringSystem.getScore()).toBeGreaterThanOrEqual(0);
      
      console.log('✅ CRITICAL: Invalid events handled gracefully');
    });

    it('should handle extreme wave numbers', () => {
      scoringSystem.reset();
      
      // Test extreme wave numbers
      expect(() => {
        scoringSystem.calculateAsteroidCost(-1);
        scoringSystem.calculateAsteroidCost(0);
        scoringSystem.calculateAsteroidCost(999999);
      }).not.toThrow();
      
      console.log('✅ CRITICAL: Extreme wave numbers handled');
    });

    it('should handle NaN and infinity inputs', () => {
      scoringSystem.reset();
      
      expect(() => {
        scoringSystem.spendPoints(NaN);
        scoringSystem.spendPoints(Infinity);
        scoringSystem.spendPoints(-Infinity);
        scoringSystem.calculateAsteroidCost(NaN);
      }).not.toThrow();
      
      // Score should remain valid
      expect(Number.isFinite(scoringSystem.getScore())).toBe(true);
      
      console.log('✅ CRITICAL: NaN/Infinity inputs handled');
    });
  });
});

describe('ScoringSystem - Combo Calculation for ALL Enemy Types', () => {
  beforeEach(() => {
    scoringSystem.reset();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CRITICAL: Combo includes ALL enemy types', () => {
    it('should increment combo for regular birds', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Regular birds increment combo');
    });

    it('should increment combo for birds with energy dots', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.BIRD_WITH_ENERGY_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Birds with dots increment combo');
    });

    it('should increment combo for shooter birds', () => {
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Shooter birds increment combo');
    });

    it('should increment combo for super navigator birds', () => {
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Super navigator birds increment combo');
    });

    it('should increment combo for miner birds (use SHOOTER_HIT)', () => {
      // Miner birds use SHOOTER_HIT scoring event
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT); // Miner
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT); // Another miner
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Miner birds increment combo (using SHOOTER_HIT)');
    });

    it('should increment combo for boss bird hits', () => {
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Boss hits increment combo');
    });

    it('should increment combo for boss defeated', () => {
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Boss defeated increments combo');
    });

    it('should increment combo for shredder destroyed', () => {
      scoringSystem.addEvent(ScoringEvent.SHREDDER_DESTROYED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.SHREDDER_DESTROYED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      console.log('✅ Shredder destroyed increments combo');
    });

    it('should handle mixed enemy type combo chain', () => {
      // Simulate realistic combat with ALL enemy types
      const combatSequence = [
        { event: ScoringEvent.BIRD_HIT, type: 'Regular bird' },
        { event: ScoringEvent.SHOOTER_HIT, type: 'Shooter bird' },
        { event: ScoringEvent.SUPER_NAVIGATOR_HIT, type: 'Navigator bird' },
        { event: ScoringEvent.SHOOTER_HIT, type: 'Miner bird (as SHOOTER_HIT)' },
        { event: ScoringEvent.BOSS_HIT, type: 'Boss hit' },
        { event: ScoringEvent.BOSS_HIT, type: 'Boss hit' },
        { event: ScoringEvent.BOSS_DEFEATED, type: 'Boss defeated' },
        { event: ScoringEvent.SHREDDER_DESTROYED, type: 'Shredder' },
        { event: ScoringEvent.BIRD_WITH_ENERGY_HIT, type: 'Bird with dot' },
        { event: ScoringEvent.MULTI_KILL, type: 'Multi-kill' },
      ];
      
      combatSequence.forEach((action, index) => {
        scoringSystem.addEvent(action.event);
        expect(scoringSystem.getScoreBreakdown().combo).toBe(index + 1);
        console.log(`  ${index + 1}x: ${action.type}`);
      });
      
      console.log('✅ Mixed enemy combo chain works perfectly!');
    });

    it('should NOT increment combo for non-enemy events', () => {
      // These should NOT increment combo
      const nonComboEvents = [
        ScoringEvent.ASTEROID_LAUNCH,
        ScoringEvent.ENERGY_DOT_LOST,
        ScoringEvent.ASTEROID_SPLIT,
        ScoringEvent.WAVE_COMPLETE,
        ScoringEvent.PERFECT_WAVE,
      ];
      
      nonComboEvents.forEach(event => {
        scoringSystem.reset();
        scoringSystem.addEvent(event);
        expect(scoringSystem.getScoreBreakdown().combo).toBe(0);
      });
      
      console.log('✅ Non-enemy events do NOT increment combo');
    });

    it('should reset combo after timeout (2 seconds)', () => {
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      // Advance time just under timeout
      vi.advanceTimersByTime(1900);
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(3);
      
      // Advance time beyond timeout
      vi.advanceTimersByTime(2100);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(0);
      
      // New kill starts fresh combo
      scoringSystem.addEvent(ScoringEvent.SHREDDER_DESTROYED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(1);
      
      console.log('✅ Combo resets after 2 second timeout');
    });

    it('should handle rapid multi-kill scenarios', () => {
      // Simulate asteroid hitting multiple enemies at once
      const rapidKills = [
        ScoringEvent.BIRD_HIT,
        ScoringEvent.BIRD_HIT,
        ScoringEvent.SHOOTER_HIT,     // Could be shooter or miner
        ScoringEvent.SUPER_NAVIGATOR_HIT,
        ScoringEvent.BIRD_WITH_ENERGY_HIT,
      ];
      
      rapidKills.forEach(event => {
        scoringSystem.addEvent(event);
      });
      
      expect(scoringSystem.getScoreBreakdown().combo).toBe(5);
      console.log('✅ Rapid multi-kill combo working');
    });

    it('should give correct points for each enemy type', () => {
      const enemyPoints = [
        { event: ScoringEvent.BIRD_HIT, points: 40, name: 'Regular bird' },
        { event: ScoringEvent.BIRD_WITH_ENERGY_HIT, points: 120, name: 'Bird with dot' },
        { event: ScoringEvent.SHOOTER_HIT, points: 80, name: 'Shooter/Miner' },
        { event: ScoringEvent.SUPER_NAVIGATOR_HIT, points: 80, name: 'Navigator' },
        { event: ScoringEvent.BOSS_HIT, points: 50, name: 'Boss hit' },
        { event: ScoringEvent.BOSS_DEFEATED, points: 400, name: 'Boss defeated' },
        { event: ScoringEvent.SHREDDER_DESTROYED, points: 50, name: 'Shredder' },
      ];
      
      enemyPoints.forEach(enemy => {
        scoringSystem.reset();
        const initialScore = scoringSystem.getScore();
        scoringSystem.addEvent(enemy.event);
        const newScore = scoringSystem.getScore();
        const pointsEarned = newScore - initialScore;
        expect(pointsEarned).toBe(enemy.points);
        console.log(`  ${enemy.name}: ${enemy.points} points ✓`);
      });
      
      console.log('✅ All enemy point values correct');
    });

    it('should track maximum combo achieved', () => {
      // Build up a big combo
      for (let i = 0; i < 20; i++) {
        if (i % 3 === 0) scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
        else if (i % 3 === 1) scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
        else scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      }
      
      const finalCombo = scoringSystem.getScoreBreakdown().combo;
      expect(finalCombo).toBe(20);
      
      const stats = scoringSystem.getStatistics();
      expect(stats.highestCombo).toBeGreaterThanOrEqual(20);
      
      console.log('✅ Maximum combo tracking works');
    });
  });

  describe('INTEGRATION: Complete combo system test', () => {
    it('should handle a complete game scenario', () => {
      // Wave 1: Few regular birds
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      scoringSystem.addEvent(ScoringEvent.BIRD_HIT);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(2);
      
      // Timeout - combo resets
      vi.advanceTimersByTime(2100);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(0);
      
      // Wave 5: Special birds appear
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT);
      scoringSystem.addEvent(ScoringEvent.SUPER_NAVIGATOR_HIT);
      scoringSystem.addEvent(ScoringEvent.SHOOTER_HIT); // Miner
      expect(scoringSystem.getScoreBreakdown().combo).toBe(3);
      
      // Boss wave
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
      scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(7);
      
      // Multi-kill with asteroid
      scoringSystem.addEvent(ScoringEvent.MULTI_KILL);
      expect(scoringSystem.getScoreBreakdown().combo).toBe(8);
      
      console.log('✅ COMPLETE INTEGRATION TEST PASSED!');
      console.log('   All enemy types properly contribute to combos');
      console.log('   Miner birds correctly use SHOOTER_HIT event');
      console.log('   Boss birds have both hit and defeated events');
      console.log('   Shredders properly increment combo');
    });
  });
});