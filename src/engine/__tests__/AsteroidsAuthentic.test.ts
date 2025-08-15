/**
 * AsteroidsAuthentic.test.ts - Tests for EXACT original Asteroids (1979) splitting mechanics
 * Based on authentic Atari arcade behavior and physics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Application } from 'pixi.js';
import { AsteroidSplitter } from '../systems/AsteroidSplitter';
import { Asteroid } from '../entities/Asteroid';

describe('AUTHENTIC ASTEROIDS SPLITTING MECHANICS', () => {
  let app: Application;
  let splitter: AsteroidSplitter;

  beforeEach(() => {
    app = new Application();
    // Mock screen property for tests (use defineProperty for readonly properties)
    Object.defineProperty(app, 'screen', {
      value: { width: 800, height: 600 },
      writable: false,
      configurable: true
    });
    splitter = new AsteroidSplitter(app);
  });

  describe('CRITICAL: Original Asteroids Size Categories', () => {
    it('should categorize asteroids by size correctly', () => {
      // Valid vertex data for asteroid shapes
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      
      const largeAsteroid = new Asteroid(app, 100, 100, 50, 50, 40, shapeData, 180); // Large (40)
      const mediumAsteroid = new Asteroid(app, 100, 100, 30, 30, 20, shapeData, 180); // Medium (20) 
      const smallAsteroid = new Asteroid(app, 100, 100, 10, 10, 10, shapeData, 180); // Small (10)

      // Large asteroid should split into 2 medium
      const largeFragments = splitter.split(largeAsteroid, 5);
      expect(largeFragments.length).toBe(2);
      largeFragments.forEach(fragment => {
        expect(fragment.size).toBe(20); // Medium size
      });

      // Medium asteroid should split into 2 small  
      const mediumFragments = splitter.split(mediumAsteroid, 5);
      expect(mediumFragments.length).toBe(2);
      mediumFragments.forEach(fragment => {
        expect(fragment.size).toBe(10); // Small size
      });

      // Small asteroid should be destroyed (no split)
      const smallFragments = splitter.split(smallAsteroid, 5);
      expect(smallFragments.length).toBe(0);

      console.log('✅ AUTHENTIC: Large→2Medium, Medium→2Small, Small→Destroyed');
    });
  });

  describe('CRITICAL: 26 Asteroid Limit (Original Feature)', () => {
    it('should create only 1 fragment when near 26 asteroid limit', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const largeAsteroid = new Asteroid(app, 100, 100, 50, 50, 40, shapeData, 180);

      // Normal splitting (under limit)
      const normalFragments = splitter.split(largeAsteroid, 10);
      expect(normalFragments.length).toBe(2);

      // Near limit splitting (25 asteroids already exist)
      const limitedFragments = splitter.split(largeAsteroid, 25);
      expect(limitedFragments.length).toBe(1);

      // At limit splitting (26 asteroids already exist)
      const atLimitFragments = splitter.split(largeAsteroid, 26);
      expect(atLimitFragments.length).toBe(1);

      console.log('✅ AUTHENTIC: 26 asteroid limit enforced');
    });

    it('should provide limit checking utilities', () => {
      expect(AsteroidSplitter.isNearLimit(24)).toBe(true);
      expect(AsteroidSplitter.isNearLimit(10)).toBe(false);
      expect(AsteroidSplitter.getMaxAsteroids()).toBe(26);
    });
  });

  describe('CRITICAL: Conservation of Momentum + Randomness', () => {
    it('should apply realistic physics to fragments', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const asteroid = new Asteroid(app, 100, 100, 60, 40, 40, shapeData, 180);
      const originalSpeed = Math.hypot(asteroid.vx, asteroid.vy);
      
      const fragments = splitter.split(asteroid, 5);
      expect(fragments.length).toBe(2);

      fragments.forEach((fragment, i) => {
        // Fragments should have finite velocities
        expect(Number.isFinite(fragment.vx)).toBe(true);
        expect(Number.isFinite(fragment.vy)).toBe(true);
        
        // Fragment speeds should be somewhat related to original
        const fragmentSpeed = Math.hypot(fragment.vx, fragment.vy);
        expect(fragmentSpeed).toBeGreaterThan(originalSpeed * 0.3);
        expect(fragmentSpeed).toBeLessThan(originalSpeed * 2.0);
        
        // Position should be offset to prevent overlap
        const distance = Math.hypot(fragment.x - asteroid.x, fragment.y - asteroid.y);
        expect(distance).toBeGreaterThan(5); // Some separation
        expect(distance).toBeLessThan(50); // But not too far
        
        console.log(`✅ Fragment ${i}: speed ${fragmentSpeed.toFixed(1)}, distance ${distance.toFixed(1)}`);
      });
    });

    it('should create fragments with random directions', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const asteroid = new Asteroid(app, 100, 100, 50, 0, 40, shapeData, 180); // Moving right
      const allAngles: number[] = [];
      
      // Test multiple splits to verify randomness
      for (let test = 0; test < 10; test++) {
        const fragments = splitter.split(asteroid, 5);
        fragments.forEach(fragment => {
          const angle = Math.atan2(fragment.vy, fragment.vx);
          allAngles.push(angle);
        });
      }
      
      // Should have variety in angles (not all the same direction)
      const uniqueAngles = new Set(allAngles.map(a => Math.round(a * 10) / 10));
      expect(uniqueAngles.size).toBeGreaterThan(5); // At least some variety
      
      console.log(`✅ AUTHENTIC: Fragment angles vary (${uniqueAngles.size} unique directions)`);
    });
  });

  describe('CRITICAL: DRY Code Reuse', () => {
    it('should use same Asteroid constructor as parent', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const parentAsteroid = new Asteroid(app, 100, 100, 30, 20, 40, shapeData, 180);
      
      const fragments = splitter.split(parentAsteroid, 5);
      expect(fragments.length).toBe(2);
      
      fragments.forEach(fragment => {
        // Should be proper Asteroid instances
        expect(fragment).toBeInstanceOf(Asteroid);
        
        // Should have all essential properties
        expect(typeof fragment.x).toBe('number');
        expect(typeof fragment.y).toBe('number');
        expect(typeof fragment.vx).toBe('number');
        expect(typeof fragment.vy).toBe('number');
        expect(typeof fragment.size).toBe('number');
        expect(typeof fragment.hue).toBe('number');
        
        // Should use same movement/physics code
        expect(typeof fragment.update).toBe('function');
        // Note: draw method is private but fragments should have proper rendering
      });
      
      console.log('✅ AUTHENTIC: Fragments use exact same DRY Asteroid code');
    });
  });

  describe('CRITICAL: Game Balance & Scoring', () => {
    it('should maintain proper size progression', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const largeAsteroid = new Asteroid(app, 100, 100, 30, 20, 40, shapeData, 180);
      
      // Large → Medium
      const mediumFragments = splitter.split(largeAsteroid, 5);
      expect(mediumFragments.length).toBe(2);
      expect(mediumFragments[0].size).toBe(20);
      
      // Medium → Small  
      const smallFragments = splitter.split(mediumFragments[0], 5);
      expect(smallFragments.length).toBe(2);
      expect(smallFragments[0].size).toBe(10);
      
      // Small → Destroyed
      const destroyedFragments = splitter.split(smallFragments[0], 5);
      expect(destroyedFragments.length).toBe(0);
      
      console.log('✅ AUTHENTIC: Progression 40→20→10→Destroyed matches original');
    });

    it('should handle edge cases gracefully', () => {
      const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
      const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
      const asteroid = new Asteroid(app, 100, 100, 0, 0, 40, shapeData, 180); // No velocity
      
      const fragments = splitter.split(asteroid, 5);
      expect(fragments.length).toBe(2);
      
      fragments.forEach(fragment => {
        // Even with no parent velocity, fragments should move
        const speed = Math.hypot(fragment.vx, fragment.vy);
        expect(speed).toBeGreaterThan(0);
        expect(Number.isFinite(speed)).toBe(true);
      });
      
      console.log('✅ AUTHENTIC: Zero velocity parent handled correctly');
    });
  });

  describe('CRITICAL: Memory Management & Performance', () => {
    it('should not leak memory during rapid splitting', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Rapidly create and split many asteroids
      for (let i = 0; i < 100; i++) {
        const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
        const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
        const asteroid = new Asteroid(app, Math.random() * 800, Math.random() * 600, 
          (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, 40, shapeData, 180);
        
        const fragments = splitter.split(asteroid, 10);
        
        // Clean up fragments  
        fragments.forEach(fragment => fragment.destroy());
        asteroid.destroy();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Should not grow excessively (less than 5MB)
      expect(memoryGrowth).toBeLessThan(5 * 1024 * 1024);
      
      console.log(`✅ AUTHENTIC: Memory growth acceptable (${Math.round(memoryGrowth / 1024)}KB for 100 splits)`);
    });
  });
});