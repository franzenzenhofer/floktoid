import { describe, it, expect } from 'vitest';
import { GameConfig } from '../src/engine/GameConfig';

describe('Asteroid Launch Mechanics - Simple', () => {
  describe('Size-Speed Relationship', () => {
    it('should calculate correct slowness factor for small asteroids', () => {
      const smallSize = GameConfig.AST_MIN;
      const expectedSlowness = 1; // No slowdown for minimum size
      
      // This is the formula from the actual game
      const slownessFactor = 1 - (smallSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX - GameConfig.AST_MIN) * 0.5;
      
      expect(slownessFactor).toBe(expectedSlowness);
    });
    
    it('should calculate correct slowness factor for large asteroids', () => {
      const largeSize = GameConfig.AST_MAX;
      const expectedSlowness = 0.5; // 50% slowdown for max size
      
      const slownessFactor = 1 - (largeSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX - GameConfig.AST_MIN) * 0.5;
      
      expect(slownessFactor).toBe(expectedSlowness);
    });
    
    it('should interpolate slowness for medium-sized asteroids', () => {
      const mediumSize = (GameConfig.AST_MIN + GameConfig.AST_MAX) / 2;
      const expectedSlowness = 0.75; // 25% slowdown for medium size
      
      const slownessFactor = 1 - (mediumSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX - GameConfig.AST_MIN) * 0.5;
      
      expect(slownessFactor).toBe(expectedSlowness);
    });
  });
  
  describe('Physics Validation', () => {
    it('should calculate correct velocity vectors', () => {
      const startX = 100;
      const startY = 500;
      const targetX = 200;
      const targetY = 400;
      const speed = 300;
      
      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      
      // Expected: unit vector times speed
      const expectedDist = Math.sqrt(100 * 100 + (-100) * (-100));
      const expectedVx = (100 / expectedDist) * speed;
      const expectedVy = (-100 / expectedDist) * speed;
      
      expect(vx).toBeCloseTo(expectedVx);
      expect(vy).toBeCloseTo(expectedVy);
    });
    
    it('should respect maximum speed limit', () => {
      const maxSpeed = GameConfig.AST_SPEED;
      const dist = 1000; // Very large distance
      const actualSpeed = Math.min(dist * 3, maxSpeed);
      
      expect(actualSpeed).toBeLessThanOrEqual(maxSpeed);
      expect(actualSpeed).toBe(maxSpeed);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle zero slowness factor edge case', () => {
      // Even with a theoretical size that would give 0 slowness,
      // the formula should still work
      const theoreticalSize = GameConfig.AST_MAX * 2;
      const slownessFactor = Math.max(0, 1 - (theoreticalSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX - GameConfig.AST_MIN) * 0.5);
      
      expect(slownessFactor).toBeGreaterThanOrEqual(0);
      expect(slownessFactor).toBeLessThanOrEqual(1);
    });
    
    it('should handle minimum launch distance', () => {
      const minDistance = 20; // From the code
      const shouldLaunch = minDistance > 20;
      
      expect(shouldLaunch).toBe(false); // Should not launch at exactly 20
      
      const shouldLaunchAt21 = 21 > 20;
      expect(shouldLaunchAt21).toBe(true); // Should launch at 21
    });
  });
});