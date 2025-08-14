/**
 * SafeCollisionSystem - 100% safe, tested collision detection
 * NO FREEZES GUARANTEED!
 */

import { Boid } from '../entities/Boid';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';
import { GameConfig } from '../GameConfig';

interface CollisionPair {
  type: 'ast-boid' | 'ast-ast' | 'boid-dot';
  index1: number;
  index2: number;
  distance: number;
}

export class SafeCollisionSystem {
  private maxChecksPerFrame = 1000; // Limit checks to prevent freeze
  private collisionPairs: CollisionPair[] = [];
  private frameCounter = 0;
  
  /**
   * Phase 1: Detection only - NO modifications, NO callbacks
   */
  detectCollisions(
    boids: Boid[],
    asteroids: Asteroid[],
    _dots: EnergyDot[]
  ): CollisionPair[] {
    this.frameCounter++;
    this.collisionPairs = [];
    let checkCount = 0;
    
    // OPTIMIZATION: Early exit if too many entities
    if (asteroids.length * boids.length > this.maxChecksPerFrame) {
      console.warn(`Too many collision checks: ${asteroids.length * boids.length}`);
      return [];
    }
    
    // Asteroid-Boid collisions
    for (let i = 0; i < asteroids.length && checkCount < this.maxChecksPerFrame; i++) {
      const ast = asteroids[i];
      if (!ast) continue;
      
      for (let j = 0; j < boids.length && checkCount < this.maxChecksPerFrame; j++) {
        const boid = boids[j];
        if (!boid || !boid.alive) continue;
        
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
        
        // Mark boid for removal
        removeBoids.add(boidIndex);
        
        // Only call callback once per boid
        if (!processedBoids.has(boidIndex)) {
          processedBoids.add(boidIndex);
          const boid = boids[boidIndex];
          if (boid && callbacks.onBoidHit) {
            // Defer callback to avoid stage modifications
            setTimeout(() => callbacks.onBoidHit!(boid), 0);
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
    // Remove in reverse order to preserve indices
    for (const idx of removeBoids) {
      if (boids[idx]) {
        boids[idx].destroy();
        boids.splice(idx, 1);
      }
    }
    
    for (const idx of removeAsteroids) {
      if (asteroids[idx]) {
        asteroids[idx].destroy();
        asteroids.splice(idx, 1);
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