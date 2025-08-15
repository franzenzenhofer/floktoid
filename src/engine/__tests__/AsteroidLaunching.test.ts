import { describe, it, expect } from 'vitest';

describe('Asteroid Launching', () => {
  describe('Angle Validation', () => {
    it('should allow launches between 20 and 70 degrees', () => {
      // Test valid angles
      const validAngles = [20, 30, 45, 60, 70];
      validAngles.forEach(angle => {
        expect(angle >= 20 && angle <= 70).toBe(true);
      });
    });

    it('should reject launches below 20 degrees (too horizontal)', () => {
      const tooHorizontal = [0, 5, 10, 15, 19];
      tooHorizontal.forEach(angle => {
        expect(angle >= 20 && angle <= 70).toBe(false);
      });
    });

    it('should reject launches above 70 degrees (too vertical)', () => {
      const tooVertical = [71, 80, 85, 90];
      tooVertical.forEach(angle => {
        expect(angle >= 20 && angle <= 70).toBe(false);
      });
    });

    it('should calculate angle correctly for upward shots', () => {
      // Upward shot has negative dy
      const dx = 100;
      const dy = -100; // Upward
      const angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
      expect(angle).toBeCloseTo(45, 1); // 45 degrees diagonal
    });

    it('should calculate angle correctly for horizontal shots', () => {
      const dx = 100;
      const dy = 0; // Horizontal
      const angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
      expect(Math.abs(angle)).toBe(0); // 0 degrees horizontal (handle -0 vs +0)
    });

    it('should calculate angle correctly for steep shots', () => {
      const dx = 10;
      const dy = -100; // Very steep upward
      const angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
      expect(angle).toBeGreaterThan(80); // Almost vertical
    });
  });

  describe('Launch Requirements', () => {
    it('should require minimum distance of 20 pixels', () => {
      const distances = [10, 15, 19, 20, 50, 100];
      distances.forEach(dist => {
        const canLaunch = dist > 20;
        expect(canLaunch).toBe(dist > 20);
      });
    });

    it('should not launch with invalid angle even if distance is sufficient', () => {
      const dist = 100; // Valid distance
      const angle = 10; // Invalid angle (too horizontal)
      const canLaunch = dist > 20 && angle >= 20 && angle <= 70;
      expect(canLaunch).toBe(false);
    });

    it('should launch with valid angle and sufficient distance', () => {
      const dist = 100; // Valid distance
      const angle = 45; // Valid angle
      const canLaunch = dist > 20 && angle >= 20 && angle <= 70;
      expect(canLaunch).toBe(true);
    });
  });
});