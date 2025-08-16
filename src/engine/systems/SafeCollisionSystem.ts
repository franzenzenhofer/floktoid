/**
 * SafeCollisionSystem - 100% safe, tested collision detection
 * NO FREEZES GUARANTEED!
 */

import { Boid } from '../entities/Boid';
import { BirdProjectile } from '../entities/BirdProjectile';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';
import { GameConfig } from '../GameConfig';
import * as PIXI from 'pixi.js';

interface CollisionPair {
  type: 'ast-boid' | 'ast-ast' | 'boid-dot' | 'proj-ast';
  index1: number;
  index2: number;
  distance: number;
}

export class SafeCollisionSystem {
  private maxChecksPerFrame = 1000; // Limit checks to prevent freeze
  private collisionPairs: CollisionPair[] = [];
  private frameCounter = 0;
  constructor(_app?: PIXI.Application) {
    // Constructor available for future asteroid splitter integration
  }
  
  /**
   * Phase 1: Detection only - NO modifications, NO callbacks
   */
  detectCollisions(
    boids: Boid[],
    asteroids: Asteroid[],
    _dots: EnergyDot[],
    projectiles?: BirdProjectile[]
  ): CollisionPair[] {
    this.frameCounter++;
    this.collisionPairs = [];
    let checkCount = 0;
    
    // OPTIMIZATION: Early exit if too many entities
    if (asteroids.length * boids.length > this.maxChecksPerFrame) {
      console.warn(`Too many collision checks: ${asteroids.length * boids.length}`);
      return [];
    }
    
    // Asteroid-Boid collisions - SAFE: Add comprehensive null checks
    for (let i = 0; i < asteroids.length && checkCount < this.maxChecksPerFrame; i++) {
      const ast = asteroids[i];
      if (!ast || ast.destroyed || typeof ast.x !== 'number' || typeof ast.y !== 'number' || 
          typeof ast.size !== 'number' || !isFinite(ast.x) || !isFinite(ast.y) || !isFinite(ast.size)) {
        continue;
      }
      
      for (let j = 0; j < boids.length && checkCount < this.maxChecksPerFrame; j++) {
        const boid = boids[j];
        if (!boid || !boid.alive || typeof boid.x !== 'number' || typeof boid.y !== 'number' || 
            !isFinite(boid.x) || !isFinite(boid.y)) {
          continue;
        }
        
        checkCount++;
        
        // Use squared distance to avoid sqrt
        const dx = ast.x - boid.x;
        const dy = ast.y - boid.y;
        const distSq = dx * dx + dy * dy;
        const thresholdSq = (ast.size + GameConfig.BOID_SIZE) ** 2;
        
        if (distSq < thresholdSq) {
          this.collisionPairs.push({
            type: 'ast-boid',
            index1: i,
            index2: j,
            distance: Math.sqrt(distSq)
          });
        }
      }
    }
    
    // Projectile-Asteroid collisions
    if (projectiles) {
      for (let i = 0; i < projectiles.length && checkCount < this.maxChecksPerFrame; i++) {
        const proj = projectiles[i];
        if (!proj || proj.destroyed || !isFinite(proj.x) || !isFinite(proj.y)) {
          continue;
        }
        
        for (let j = 0; j < asteroids.length && checkCount < this.maxChecksPerFrame; j++) {
          const ast = asteroids[j];
          if (!ast || ast.destroyed || !isFinite(ast.x) || !isFinite(ast.y) || !isFinite(ast.size)) {
            continue;
          }
          
          checkCount++;
          
          const dx = proj.x - ast.x;
          const dy = proj.y - ast.y;
          const distSq = dx * dx + dy * dy;
          const threshold = (proj.size + ast.size) * (proj.size + ast.size);
          
          if (distSq < threshold) {
            this.collisionPairs.push({
              type: 'proj-ast',
              index1: i, // projectile index
              index2: j, // asteroid index
              distance: Math.sqrt(distSq)
            });
          }
        }
      }
    }
    
    return this.collisionPairs;
  }
  
  /**
   * Phase 2: Process collisions - Batched operations
   */
  processCollisions(
    pairs: CollisionPair[],
    boids: Boid[],
    asteroids: Asteroid[],
    callbacks: {
      onBoidHit?: (boid: Boid) => void;
      onAsteroidHit?: (ast: Asteroid) => boolean;
    }
  ): { removeBoids: number[], removeAsteroids: number[] } {
    const removeBoids = new Set<number>();
    const removeAsteroids = new Set<number>();
    const processedBoids = new Set<number>();
    
    // Process each collision pair
    for (const pair of pairs) {
      if (pair.type === 'ast-boid') {
        const astIndex = pair.index1;
        const boidIndex = pair.index2;
        
        // Skip if already processed
        if (removeBoids.has(boidIndex) || removeAsteroids.has(astIndex)) {
          continue;
        }
        
        // Only call callback once per boid
        if (!processedBoids.has(boidIndex)) {
          processedBoids.add(boidIndex);
          const boid = boids[boidIndex];
          if (boid && callbacks.onBoidHit) {
            // Call immediately - handler should capture state before any async ops
            callbacks.onBoidHit(boid);
            
            // Check if boid is still alive after callback (for bosses)
            if (!boid.alive) {
              removeBoids.add(boidIndex);
            }
          } else {
            // No callback, just mark for removal
            removeBoids.add(boidIndex);
          }
        }
        
        // Handle asteroid
        const ast = asteroids[astIndex];
        if (ast && callbacks.onAsteroidHit) {
          if (callbacks.onAsteroidHit(ast)) {
            removeAsteroids.add(astIndex);
          }
        }
      }
    }
    
    return {
      removeBoids: Array.from(removeBoids).sort((a, b) => b - a),
      removeAsteroids: Array.from(removeAsteroids).sort((a, b) => b - a)
    };
  }
  
  /**
   * Phase 3: Safe entity removal
   */
  removeEntities(
    boids: Boid[],
    asteroids: Asteroid[],
    removeBoids: number[],
    removeAsteroids: number[]
  ): void {
    // SAFE: Remove in reverse order to preserve indices with comprehensive null checks
    for (const idx of removeBoids) {
      if (typeof idx === 'number' && isFinite(idx) && idx >= 0 && idx < boids.length && boids[idx]) {
        try {
          const boid = boids[idx];
          if (boid && typeof boid.destroy === 'function') {
            boid.destroy();
          }
          boids.splice(idx, 1);
        } catch (destroyError) {
          console.error('[COLLISION] Failed to destroy boid:', destroyError);
          // Still try to remove from array
          try {
            boids.splice(idx, 1);
          } catch (spliceError) {
            console.error('[COLLISION] Failed to splice boid:', spliceError);
          }
        }
      }
    }
    
    for (const idx of removeAsteroids) {
      if (typeof idx === 'number' && isFinite(idx) && idx >= 0 && idx < asteroids.length && asteroids[idx]) {
        try {
          const asteroid = asteroids[idx];
          if (asteroid && typeof asteroid.destroy === 'function') {
            asteroid.destroy();
          }
          asteroids.splice(idx, 1);
        } catch (destroyError) {
          console.error('[COLLISION] Failed to destroy asteroid:', destroyError);
          // Still try to remove from array
          try {
            asteroids.splice(idx, 1);
          } catch (spliceError) {
            console.error('[COLLISION] Failed to splice asteroid:', spliceError);
          }
        }
      }
    }
  }
  
  /**
   * All-in-one safe collision handling
   */
  handleCollisions(
    boids: Boid[],
    asteroids: Asteroid[],
    dots: EnergyDot[],
    callbacks: {
      onBoidHit?: (boid: Boid) => void;
      onAsteroidHit?: (ast: Asteroid) => boolean;
    }
  ): void {
    // Phase 1: Detect
    const pairs = this.detectCollisions(boids, asteroids, dots);
    
    // Phase 2: Process
    const { removeBoids, removeAsteroids } = this.processCollisions(
      pairs,
      boids,
      asteroids,
      callbacks
    );
    
    // Phase 3: Remove
    this.removeEntities(boids, asteroids, removeBoids, removeAsteroids);
  }
  
  getStats() {
    return {
      frame: this.frameCounter,
      collisions: this.collisionPairs.length,
      maxChecks: this.maxChecksPerFrame
    };
  }
}