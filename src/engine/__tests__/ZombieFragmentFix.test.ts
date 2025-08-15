/**
 * Test to verify zombie fragment fix - no duplicate fragments on splitting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { SafeCollisionSystemExtended } from '../systems/SafeCollisionSystemExtended';
import { AsteroidSplitter } from '../systems/AsteroidSplitter';
import { Asteroid } from '../entities/Asteroid';
import { BirdProjectile } from '../entities/BirdProjectile';

describe('Zombie Fragment Fix', () => {
  let app: Application;
  let collisionSystem: SafeCollisionSystemExtended;
  let asteroidSplitter: AsteroidSplitter;

  beforeEach(() => {
    app = new Application();
    Object.defineProperty(app, 'screen', {
      value: { width: 800, height: 600 },
      writable: false,
      configurable: true
    });
    collisionSystem = new SafeCollisionSystemExtended();
    asteroidSplitter = new AsteroidSplitter(app);
  });

  it('should NOT create duplicate fragments when asteroid is hit by projectile', () => {
    const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
    const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
    
    // Create an asteroid
    const asteroid = new Asteroid(app, 400, 300, 20, 20, 40, shapeData, 180);
    const asteroids = [asteroid];
    
    // Create a projectile that will hit the asteroid
    // Position it at exact same position to guarantee collision
    const projectile = new BirdProjectile(app, 400, 300, 0, 0);
    const projectiles = [projectile];
    
    // Track how many times split is called
    let splitCallCount = 0;
    const originalSplit = asteroidSplitter.split.bind(asteroidSplitter);
    
    // Mock the callback to count splits
    const onProjectileHit = vi.fn((proj: BirdProjectile, ast: Asteroid) => {
      splitCallCount++;
      return originalSplit(ast, asteroids.length);
    });
    
    // Handle collisions
    const newFragments = collisionSystem.handleCollisionsWithProjectiles(
      [], // no boids
      asteroids,
      [], // no dots
      projectiles,
      {
        onProjectileHit
      }
    );
    
    // CRITICAL ASSERTIONS:
    // 1. Split should be called exactly ONCE (not twice!)
    expect(splitCallCount).toBe(1);
    expect(onProjectileHit).toHaveBeenCalledTimes(1);
    
    // 2. Should return exactly 2 fragments (not 4!)
    expect(newFragments.length).toBe(2);
    
    // 3. Fragments should have proper velocities (not zero/NaN)
    newFragments.forEach(fragment => {
      expect(Number.isFinite(fragment.vx)).toBe(true);
      expect(Number.isFinite(fragment.vy)).toBe(true);
      const speed = Math.hypot(fragment.vx, fragment.vy);
      expect(speed).toBeGreaterThan(0); // Should be moving!
    });
    
    // 4. Original asteroid should be removed
    expect(asteroids.length).toBe(0);
    
    // 5. Projectile should be removed
    expect(projectiles.length).toBe(0);
    
    console.log('✅ NO ZOMBIE FRAGMENTS: Split called once, fragments moving correctly');
  });

  it('should handle callback returning undefined gracefully', () => {
    const vertices = [10, 0, 8, 6, -8, 6, -10, 0, -8, -6, 8, -6];
    const shapeData = { vertices, roughness: [1, 1, 1, 1, 1, 1] };
    
    const asteroid = new Asteroid(app, 400, 300, 20, 20, 40, shapeData, 180);
    const asteroids = [asteroid];
    const projectile = new BirdProjectile(app, 400, 300, 0, 0);
    const projectiles = [projectile];
    
    // Callback that returns nothing (undefined)
    const onProjectileHit = vi.fn(() => undefined);
    
    const newFragments = collisionSystem.handleCollisionsWithProjectiles(
      [], 
      asteroids,
      [], 
      projectiles,
      {
        onProjectileHit
      }
    );
    
    // Should handle undefined gracefully
    expect(newFragments.length).toBe(0);
    expect(onProjectileHit).toHaveBeenCalledTimes(1);
    
    console.log('✅ Handles undefined callback return gracefully');
  });
});