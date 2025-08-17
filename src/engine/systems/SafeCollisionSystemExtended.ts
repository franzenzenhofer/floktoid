/**
 * SafeCollisionSystemExtended - Extension of SafeCollisionSystem with projectile support
 * Modular approach to avoid breaking existing collision system
 */

import { SafeCollisionSystem } from './SafeCollisionSystem';
import { Boid } from '../entities/Boid';
import { BirdProjectile } from '../entities/BirdProjectile';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';

export class SafeCollisionSystemExtended extends SafeCollisionSystem {
  private bossAsteroidFragments: Asteroid[] = [];
  
  constructor() {
    super();
  }
  
  /**
   * Handle collisions with special boss shield support
   */
  private handleCollisionsWithBossSupport(
    boids: Boid[],
    asteroids: Asteroid[],
    dots: EnergyDot[],
    callbacks: {
      onBoidHit?: (boid: Boid) => void;
      onAsteroidHit?: (ast: Asteroid) => boolean;
      onBossShieldHit?: (ast: Asteroid, boss: Boid) => Asteroid[] | void;
    }
  ): void {
    // Phase 1: Detect collisions (already uses shield radius for bosses)
    const pairs = this.detectCollisions(boids, asteroids, dots);
    
    // Phase 2: Process with boss support
    const removeBoids = new Set<number>();
    const removeAsteroids = new Set<number>();
    const processedBoids = new Set<number>();
    
    for (const pair of pairs) {
      if (pair.type === 'ast-boid') {
        const astIndex = pair.index1;
        const boidIndex = pair.index2;
        
        // Skip if already processed
        if (removeBoids.has(boidIndex) || removeAsteroids.has(astIndex)) {
          continue;
        }
        
        const boid = boids[boidIndex];
        const ast = asteroids[astIndex];
        
        // Check if this is a boss with shield
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyBoid = boid as any;
        const isBossWithShield = anyBoid.isBoss === true && 
                                 anyBoid.hasActiveShield && 
                                 anyBoid.hasActiveShield();
        
        if (isBossWithShield) {
          console.log('[BOSS SHIELD HIT] Asteroid collided with boss shield - splitting!');
          
          // Boss shield hit - split the asteroid like a laser!
          removeAsteroids.add(astIndex); // Remove original asteroid
          
          // Create fragments if callback provided
          if (callbacks.onBossShieldHit) {
            const fragments = callbacks.onBossShieldHit(ast, boid);
            if (fragments) {
              this.bossAsteroidFragments.push(...fragments);
            }
          }
          
          // Handle boss damage
          if (!processedBoids.has(boidIndex)) {
            processedBoids.add(boidIndex);
            if (callbacks.onBoidHit) {
              const result = callbacks.onBoidHit(boid) as boolean | void;
              // Only destroy boss if callback returns true
              if (result === true) {
                removeBoids.add(boidIndex);
              }
            }
          }
        } else {
          // Normal collision handling
          if (!processedBoids.has(boidIndex)) {
            processedBoids.add(boidIndex);
            
            // Handle boid hit
            let shouldRemove = true;
            if (callbacks.onBoidHit) {
              const result = callbacks.onBoidHit(boid) as boolean | void;
              shouldRemove = result !== false;
            }
            
            if (shouldRemove) {
              removeBoids.add(boidIndex);
            }
          }
          
          // Handle asteroid
          if (callbacks.onAsteroidHit) {
            if (callbacks.onAsteroidHit(ast)) {
              removeAsteroids.add(astIndex);
            }
          }
        }
      }
    }
    
    // Phase 3: Remove entities
    this.removeEntities(
      boids,
      asteroids,
      Array.from(removeBoids).sort((a, b) => b - a),
      Array.from(removeAsteroids).sort((a, b) => b - a)
    );
  }
  
  /**
   * Extended collision handling with projectiles AND boss shield splitting
   */
  handleCollisionsWithProjectiles(
    boids: Boid[],
    asteroids: Asteroid[],
    dots: EnergyDot[],
    projectiles: BirdProjectile[],
    callbacks: {
      onBoidHit?: (boid: Boid) => void;
      onAsteroidHit?: (ast: Asteroid) => boolean;
      onProjectileHit?: (proj: BirdProjectile, ast: Asteroid) => Asteroid[] | void;
      onBossShieldHit?: (ast: Asteroid, boss: Boid) => Asteroid[] | void; // NEW: Boss shield callback
    }
  ): Asteroid[] {
    // Clear fragments from previous frame
    this.bossAsteroidFragments = [];
    
    // Handle collisions with boss shield support
    this.handleCollisionsWithBossSupport(boids, asteroids, dots, callbacks);
    
    // Then handle projectile collisions
    const newAsteroids: Asteroid[] = [...this.bossAsteroidFragments];
    const projectilesToRemove: number[] = [];
    const asteroidsToSplit: number[] = [];
    
    // Check projectile-asteroid collisions
    for (let i = 0; i < projectiles.length; i++) {
      const proj = projectiles[i];
      if (!proj || proj.destroyed) continue;
      
      for (let j = 0; j < asteroids.length; j++) {
        const ast = asteroids[j];
        if (!ast || ast.destroyed) continue;
        
        const dx = proj.x - ast.x;
        const dy = proj.y - ast.y;
        const distSq = dx * dx + dy * dy;
        const threshold = (proj.size + ast.size) * (proj.size + ast.size);
        
        if (distSq < threshold) {
          // Mark for removal
          projectilesToRemove.push(i);
          asteroidsToSplit.push(j);
          
          // Call callback - let it handle the splitting
          if (callbacks.onProjectileHit) {
            const fragments = callbacks.onProjectileHit(proj, ast);
            if (fragments) {
              newAsteroids.push(...fragments);
            }
          }
          
          break; // Each projectile can only hit one asteroid
        }
      }
    }
    
    // Remove projectiles (in reverse order)
    projectilesToRemove.sort((a, b) => b - a);
    for (const idx of projectilesToRemove) {
      if (projectiles[idx]) {
        projectiles[idx].destroy();
        projectiles.splice(idx, 1);
      }
    }
    
    // Remove split asteroids (in reverse order)
    asteroidsToSplit.sort((a, b) => b - a);
    for (const idx of asteroidsToSplit) {
      if (asteroids[idx]) {
        asteroids[idx].destroy();
        asteroids.splice(idx, 1);
      }
    }
    
    return newAsteroids;
  }
}