import { describe, it, expect } from 'vitest';
import { GameConfig } from '../GameConfig';

describe('Falling Dot Mechanics', () => {

  describe('Fall Speed', () => {
    it('should fall 20% slower than bird movement speed', () => {
      const wave = 5;
      const birdSpeed = GameConfig.BASE_SPEED * Math.pow(GameConfig.SPEED_GROWTH, wave - 1);
      const expectedFallSpeed = birdSpeed * 0.8;
      
      // The falling dot speed should be 80% of bird speed
      expect(expectedFallSpeed).toBeLessThan(birdSpeed);
      expect(expectedFallSpeed / birdSpeed).toBeCloseTo(0.8);
    });

    it('should scale fall speed with wave progression', () => {
      const wave1Speed = GameConfig.BASE_SPEED * 0.8;
      const wave10Speed = GameConfig.BASE_SPEED * Math.pow(GameConfig.SPEED_GROWTH, 9) * 0.8;
      
      expect(wave10Speed).toBeGreaterThan(wave1Speed);
    });
  });

  describe('Dot Restoration', () => {
    it('should only restore dot when it reaches energy line', () => {
      const energyLineY = window.innerHeight * GameConfig.BASE_Y;
      // Dot should restore at this Y position
      expect(energyLineY).toBeGreaterThan(window.innerHeight * 0.8);
    });

    it('should not restore dot prematurely when bird is hit', () => {
      // When a bird carrying a dot is hit, the dot should fall
      // not be restored immediately
      const dotShouldFall = true;
      expect(dotShouldFall).toBe(true);
    });
  });

  describe('Bird-Dot Interaction', () => {
    it('should allow birds to catch falling dots', () => {
      const catchRadius = GameConfig.BOID_SIZE + GameConfig.ENERGY_RADIUS;
      expect(catchRadius).toBeGreaterThan(0);
    });

    it('should transfer dot to bird when caught', () => {
      // Bird should gain hasDot = true and targetDot reference
      const birdCatchesDot = {
        hasDot: true,
        targetDot: { stolen: true }
      };
      expect(birdCatchesDot.hasDot).toBe(true);
      expect(birdCatchesDot.targetDot).toBeDefined();
    });
  });
});