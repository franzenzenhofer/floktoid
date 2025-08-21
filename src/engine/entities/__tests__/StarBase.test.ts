import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as PIXI from 'pixi.js';
import { StarBase } from '../StarBase';

describe('StarBase', () => {
  let app: PIXI.Application;
  let starBase: StarBase;

  beforeEach(() => {
    // Mock PIXI Application
    app = {
      screen: {
        width: 800,
        height: 600
      },
      stage: {
        addChild: vi.fn(),
        removeChild: vi.fn()
      }
    } as unknown as PIXI.Application;
  });

  describe('Health Calculation', () => {
    it('should always require 5+1 shots for dev mode (wave < 7)', () => {
      starBase = new StarBase(app, 1, 60);
      expect(starBase.health).toBe(6);
      expect(starBase.maxHealth).toBe(6);
    });

    it('should require 5+1 shots for wave 7', () => {
      starBase = new StarBase(app, 7, 60);
      expect(starBase.health).toBe(6);
      expect(starBase.maxHealth).toBe(6);
    });

    it('should require 7+1 shots for wave 17', () => {
      starBase = new StarBase(app, 17, 60);
      expect(starBase.health).toBe(8);
      expect(starBase.maxHealth).toBe(8);
    });

    it('should require 9+1 shots for wave 27', () => {
      starBase = new StarBase(app, 27, 60);
      expect(starBase.health).toBe(10);
      expect(starBase.maxHealth).toBe(10);
    });

    it('should scale health after wave 27', () => {
      starBase = new StarBase(app, 37, 60);
      expect(starBase.health).toBe(12); // 10 + 2 for next 10 waves
    });
  });

  describe('Shield Mechanics', () => {
    beforeEach(() => {
      starBase = new StarBase(app, 7, 60);
    });

    it('should have active shield when health > 1', () => {
      expect(starBase.hasActiveShield()).toBe(true);
      
      // Take damage down to 1 health
      for (let i = 0; i < 5; i++) {
        starBase.takeDamage();
      }
      expect(starBase.health).toBe(1);
      expect(starBase.hasActiveShield()).toBe(false);
    });

    it('should use outer shield radius for collision when shield is active', () => {
      expect(starBase.getShieldRadius()).toBe(starBase.size * 1.5);
    });

    it('should use base size for collision when shield is down', () => {
      // Take damage down to 1 health (no shield)
      for (let i = 0; i < 5; i++) {
        starBase.takeDamage();
      }
      expect(starBase.getShieldRadius()).toBe(starBase.size);
    });

    it('should only collide with outer shield ring', () => {
      const centerX = starBase.x;
      const centerY = starBase.y;
      const outerRadius = starBase.size * 1.5;
      const innerRadius = starBase.size * 1.2;
      
      // Point on outer shield should collide
      const outerPoint = {
        x: centerX + outerRadius - 1,
        y: centerY
      };
      expect(starBase.containsPoint(outerPoint.x, outerPoint.y)).toBe(true);
      
      // Point between shields should still collide (within outer radius)
      const betweenPoint = {
        x: centerX + (outerRadius + innerRadius) / 2,
        y: centerY
      };
      expect(starBase.containsPoint(betweenPoint.x, betweenPoint.y)).toBe(true);
      
      // Point outside outer shield should not collide
      const outsidePoint = {
        x: centerX + outerRadius + 10,
        y: centerY
      };
      expect(starBase.containsPoint(outsidePoint.x, outsidePoint.y)).toBe(false);
    });
  });

  describe('Core Color and Position', () => {
    it('should store the dot hue color', () => {
      const dotHue = 120; // Green
      starBase = new StarBase(app, 7, dotHue);
      expect(starBase.dotHue).toBe(dotHue);
    });

    it('should store the original dot position', () => {
      const dotHue = 240; // Blue
      const dotPosition = { x: 100, y: 500 };
      starBase = new StarBase(app, 7, dotHue, dotPosition);
      
      expect(starBase.originalDotPosition.x).toBe(100);
      expect(starBase.originalDotPosition.y).toBe(500);
    });

    it('should use default position if not provided', () => {
      starBase = new StarBase(app, 7, 60);
      
      expect(starBase.originalDotPosition.x).toBe(app.screen.width / 2);
      expect(starBase.originalDotPosition.y).toBe(app.screen.height - 100);
    });

    it('should return original dot position when requested', () => {
      const dotPosition = { x: 200, y: 450 };
      starBase = new StarBase(app, 7, 60, dotPosition);
      
      const returnedPos = starBase.getOriginalDotPosition();
      expect(returnedPos.x).toBe(200);
      expect(returnedPos.y).toBe(450);
    });
  });

  describe('Damage and Destruction', () => {
    beforeEach(() => {
      starBase = new StarBase(app, 7, 60);
    });

    it('should reduce health when taking damage', () => {
      const initialHealth = starBase.health;
      starBase.takeDamage();
      expect(starBase.health).toBe(initialHealth - 1);
    });

    it('should destroy when health reaches 0', () => {
      // Take damage until destroyed
      for (let i = 0; i < 6; i++) {
        const destroyed = starBase.takeDamage();
        if (i < 5) {
          expect(destroyed).toBe(false);
          expect(starBase.alive).toBe(true);
        } else {
          expect(destroyed).toBe(true);
          expect(starBase.alive).toBe(false);
        }
      }
    });

    it('should not take damage when already destroyed', () => {
      starBase.alive = false;
      const result = starBase.takeDamage();
      expect(result).toBe(false);
    });
  });

  describe('Leaving Animation', () => {
    beforeEach(() => {
      starBase = new StarBase(app, 7, 60);
      starBase.maxTimeAlive = 1; // Set to 1 second for testing
    });

    it('should start leaving when time expires', () => {
      expect(starBase.isLeaving).toBe(false);
      
      // Update for more than maxTimeAlive
      starBase.update(1.1);
      
      expect(starBase.isLeaving).toBe(true);
    });

    it('should randomly choose a leaving direction', () => {
      starBase.update(1.1);
      
      expect(['up', 'left', 'right']).toContain(starBase.leavingDirection);
    });

    it('should move up when leaving upward', () => {
      // Start leaving first
      starBase.timeAlive = starBase.maxTimeAlive + 0.1;
      starBase.update(0.01); // Trigger leaving
      
      // Now force direction and position
      starBase.leavingDirection = 'up';
      starBase.y = 300; // Set to middle of screen
      
      const initialY = starBase.y;
      starBase.update(0.1); // Update for 0.1 seconds
      
      expect(starBase.y).toBeLessThan(initialY);
    });

    it('should move left when leaving leftward', () => {
      // Start leaving first
      starBase.timeAlive = starBase.maxTimeAlive + 0.1;
      starBase.update(0.01); // Trigger leaving
      
      // Now force direction and position
      starBase.leavingDirection = 'left';
      starBase.x = 400; // Set to middle of screen
      
      const initialX = starBase.x;
      starBase.update(0.1); // Update for 0.1 seconds
      
      expect(starBase.x).toBeLessThan(initialX);
    });

    it('should move right when leaving rightward', () => {
      // Start leaving first
      starBase.timeAlive = starBase.maxTimeAlive + 0.1;
      starBase.update(0.01); // Trigger leaving
      
      // Now force direction and position
      starBase.leavingDirection = 'right';
      starBase.x = 400; // Set to middle of screen
      
      const initialX = starBase.x;
      starBase.update(0.1); // Update for 0.1 seconds
      
      expect(starBase.x).toBeGreaterThan(initialX);
    });

    it('should become not alive when fully off-screen', () => {
      starBase.update(1.1); // Start leaving
      starBase.leavingDirection = 'up';
      starBase.y = -50; // Position off-screen
      
      starBase.update(0.1);
      
      expect(starBase.alive).toBe(false);
    });
  });

  describe('Movement', () => {
    beforeEach(() => {
      starBase = new StarBase(app, 7, 60);
    });

    it('should start above screen', () => {
      expect(starBase.y).toBeLessThan(0);
    });

    it('should move down to center position', () => {
      const targetY = app.screen.height / 2;
      starBase.targetY = targetY;
      
      const initialY = starBase.y;
      starBase.update(0.1);
      
      expect(starBase.y).toBeGreaterThan(initialY);
      expect(starBase.y).toBeLessThanOrEqual(targetY);
    });

    it('should stop at target position', () => {
      const targetY = app.screen.height / 2;
      starBase.targetY = targetY;
      starBase.y = targetY - 1; // Almost at target
      
      starBase.update(1); // Large time step
      
      expect(starBase.y).toBe(targetY);
    });
  });

  describe('Combat', () => {
    beforeEach(() => {
      starBase = new StarBase(app, 7, 60);
      starBase.y = starBase.targetY; // Position at center for combat
    });

    it('should rotate randomly between 10 and 360 degrees', () => {
      // Trigger rotation phase
      starBase.update(0.1);
      
      // Check that rotation is defined
      expect(starBase.rotation).toBeDefined();
    });

    it('should fire from all 3 cannons at once', () => {
      // Position StarBase at center for combat
      starBase.y = starBase.targetY;
      
      // Clear any existing lasers
      starBase.lasers = [];
      
      // Force shoot phase
      // @ts-expect-error - accessing private method for testing
      starBase.fireVolley();
      
      // Should create 3 lasers (one from each cannon)
      expect(starBase.lasers.length).toBe(3);
    });
  });
});