/**
 * SafeCollisionSystemExtended - Extension of SafeCollisionSystem with projectile support
 * Modular approach to avoid breaking existing collision system
 */

import { SafeCollisionSystem } from './SafeCollisionSystem';
import { Boid } from '../entities/Boid';
import { BirdProjectile } from '../entities/BirdProjectile';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';
import { AsteroidSplitter } from './AsteroidSplitter';
import * as PIXI from 'pixi.js';

export class SafeCollisionSystemExtended extends SafeCollisionSystem {
  private asteroidSplitter: AsteroidSplitter | null = null;
  
  constructor(app?: PIXI.Application) {
    super();
    if (app) {
      this.asteroidSplitter = new AsteroidSplitter(app);
    }
  }
  
  /**
   * Extended collision handling with projectiles
   */
  handleCollisionsWithProjectiles(
    boids: Boid[],
    asteroids: Asteroid[],
    dots: EnergyDot[],
    projectiles: BirdProjectile[],
    callbacks: {
      onBoidHit?: (boid: Boid) => void;
      onAsteroidHit?: (ast: Asteroid) => boolean;
      onProjectileHit?: (proj: BirdProjectile, ast: Asteroid) => void;
    }
  ): Asteroid[] {
    // First handle normal collisions
    this.handleCollisions(boids, asteroids, dots, callbacks);
    
    // Then handle projectile collisions
    const newAsteroids: Asteroid[] = [];
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
          
          // Call callback
          if (callbacks.onProjectileHit) {
            callbacks.onProjectileHit(proj, ast);
          }
          
          // Split asteroid (AUTHENTIC: Pass current count for 26 asteroid limit)
          if (this.asteroidSplitter) {
            const fragments = this.asteroidSplitter.split(ast, asteroids.length);
            newAsteroids.push(...fragments);
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