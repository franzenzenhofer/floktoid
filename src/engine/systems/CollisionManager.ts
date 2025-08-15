/**
 * CollisionManager - A bulletproof collision detection and handling system
 * 
 * Features:
 * - Event queue for deferred processing
 * - No duplicate collision events
 * - Safe entity removal
 * - Performance monitoring
 * - Full logging in dev mode
 */

import * as PIXI from 'pixi.js';
import { Boid } from '../entities/Boid';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';
import { BirdProjectile } from '../entities/BirdProjectile';
import { AsteroidSplitter } from './AsteroidSplitter';

export interface CollisionEvent {
  type: 'asteroid-boid' | 'asteroid-asteroid' | 'boid-dot' | 'projectile-asteroid';
  entities: [unknown, unknown];
  timestamp: number;
  processed: boolean;
}

export interface CollisionCallbacks {
  onBoidHit: (boid: Boid) => void;
  onAsteroidHit: (asteroid: Asteroid) => boolean;
  onAsteroidFragment?: (asteroid: Asteroid, fragments: number) => void;
  onDotPickup?: (boid: Boid, dot: EnergyDot) => void;
  onProjectileHit?: (projectile: BirdProjectile, asteroid: Asteroid) => Asteroid[];
}

export class CollisionManager {
  private eventQueue: CollisionEvent[] = [];
  private processedPairs = new Set<string>();
  private frameCount = 0;
  private debug = false;
  private asteroidSplitter: AsteroidSplitter | null = null;
  
  constructor(debug = false, app?: PIXI.Application) {
    this.debug = debug;
    if (app) {
      this.asteroidSplitter = new AsteroidSplitter(app);
    }
  }
  
  /**
   * Main collision detection - finds all collisions but doesn't process them
   */
  detectCollisions(
    boids: Boid[],
    asteroids: Asteroid[],
    _energyDots: EnergyDot[],
    projectiles?: BirdProjectile[]
  ): CollisionEvent[] {
    const events: CollisionEvent[] = [];
    const timestamp = performance.now();
    
    // Reset for new frame
    this.processedPairs.clear();
    this.frameCount++;
    
    if (this.debug) {
      console.log(`[Frame ${this.frameCount}] Starting collision detection`);
    }
    
    // Asteroid-Boid collisions
    for (let i = 0; i < asteroids.length; i++) {
      const ast = asteroids[i];
      if (!ast || ast.destroyed) continue;
      
      for (let j = 0; j < boids.length; j++) {
        const boid = boids[j];
        if (!boid || !boid.alive) continue;
        
        const pairKey = `ast${i}-boid${j}`;
        if (this.processedPairs.has(pairKey)) continue;
        
        const dx = ast.x - boid.x;
        const dy = ast.y - boid.y;
        const distSq = dx * dx + dy * dy;
        const threshold = (ast.size + 15) * (ast.size + 15); // Squared for performance
        
        if (distSq < threshold) {
          this.processedPairs.add(pairKey);
          events.push({
            type: 'asteroid-boid',
            entities: [ast, boid],
            timestamp,
            processed: false
          });
          
          if (this.debug) {
            console.log(`  Collision: Asteroid ${i} -> Boid ${j} (dist: ${Math.sqrt(distSq)})`);
          }
        }
      }
    }
    
    // Projectile-Asteroid collisions
    if (projectiles) {
      for (let i = 0; i < projectiles.length; i++) {
        const proj = projectiles[i];
        if (!proj || proj.destroyed) continue;
        
        for (let j = 0; j < asteroids.length; j++) {
          const ast = asteroids[j];
          if (!ast || ast.destroyed) continue;
          
          const pairKey = `proj${i}-ast${j}`;
          if (this.processedPairs.has(pairKey)) continue;
          
          const dx = proj.x - ast.x;
          const dy = proj.y - ast.y;
          const distSq = dx * dx + dy * dy;
          const threshold = (proj.size + ast.size) * (proj.size + ast.size);
          
          if (distSq < threshold) {
            this.processedPairs.add(pairKey);
            events.push({
              type: 'projectile-asteroid',
              entities: [proj, ast],
              timestamp,
              processed: false
            });
            
            if (this.debug) {
              console.log(`  Collision: Projectile ${i} -> Asteroid ${j} (dist: ${Math.sqrt(distSq)})`);
            }
          }
        }
      }
    }
    
    // Asteroid-Asteroid collisions for fragmentation
    for (let i = 0; i < asteroids.length; i++) {
      const ast1 = asteroids[i];
      if (!ast1 || ast1.destroyed) continue;
      
      for (let j = i + 1; j < asteroids.length; j++) {
        const ast2 = asteroids[j];
        if (!ast2 || ast2.destroyed) continue;
        
        const pairKey = `ast${i}-ast${j}`;
        if (this.processedPairs.has(pairKey)) continue;
        
        const dx = ast1.x - ast2.x;
        const dy = ast1.y - ast2.y;
        const distSq = dx * dx + dy * dy;
        const threshold = (ast1.size + ast2.size) * (ast1.size + ast2.size);
        
        if (distSq < threshold) {
          // Only fragment if one is small and other is large
          if ((ast1.size < 25 && ast2.size > 40) || (ast2.size < 25 && ast1.size > 40)) {
            this.processedPairs.add(pairKey);
            events.push({
              type: 'asteroid-asteroid',
              entities: [ast1, ast2],
              timestamp,
              processed: false
            });
          }
        }
      }
    }
    
    return events;
  }
  
  /**
   * Process collision events safely with callbacks
   */
  processEvents(
    events: CollisionEvent[],
    callbacks: CollisionCallbacks,
    boids: Boid[],
    asteroids: Asteroid[],
    projectiles?: BirdProjectile[]
  ): Asteroid[] {
    if (this.debug) {
      console.log(`Processing ${events.length} collision events`);
    }
    
    // Track what needs removal
    const boidsToRemove = new Set<Boid>();
    const asteroidsToRemove = new Set<Asteroid>();
    const projectilesToRemove = new Set<BirdProjectile>();
    const newAsteroids: Asteroid[] = [];
    const visualEffects: (() => void)[] = [];
    
    // Process each event
    for (const event of events) {
      if (event.processed) continue;
      
      switch (event.type) {
        case 'asteroid-boid': {
          const [asteroid, boid] = event.entities as [Asteroid, Boid];
          
          // Skip if already marked for removal
          if (boidsToRemove.has(boid) || asteroidsToRemove.has(asteroid)) {
            continue;
          }
          
          // Mark boid for removal
          boidsToRemove.add(boid);
          
          // Queue visual effect
          visualEffects.push(() => callbacks.onBoidHit(boid));
          
          // Handle asteroid (shrink or destroy)
          if (callbacks.onAsteroidHit(asteroid)) {
            asteroidsToRemove.add(asteroid);
          }
          
          event.processed = true;
          break;
        }
        
        case 'asteroid-asteroid': {
          const [ast1, ast2] = event.entities as [Asteroid, Asteroid];
          
          if (asteroidsToRemove.has(ast1) || asteroidsToRemove.has(ast2)) {
            continue;
          }
          
          // Determine which fragments which
          const large = ast1.size > ast2.size ? ast1 : ast2;
          const small = ast1.size > ast2.size ? ast2 : ast1;
          
          if (callbacks.onAsteroidFragment) {
            visualEffects.push(() => callbacks.onAsteroidFragment!(large, 4));
          }
          
          asteroidsToRemove.add(large);
          asteroidsToRemove.add(small);
          
          event.processed = true;
          break;
        }
        
        case 'projectile-asteroid': {
          const [projectile, asteroid] = event.entities as [BirdProjectile, Asteroid];
          
          if (projectilesToRemove.has(projectile) || asteroidsToRemove.has(asteroid)) {
            continue;
          }
          
          // Mark projectile for removal
          projectilesToRemove.add(projectile);
          asteroidsToRemove.add(asteroid);
          
          // Create fragments if callback provided
          if (callbacks.onProjectileHit && this.asteroidSplitter) {
            const fragments = this.asteroidSplitter.split(asteroid);
            newAsteroids.push(...fragments);
            
            // Queue visual effect
            visualEffects.push(() => {
              if (callbacks.onProjectileHit) {
                callbacks.onProjectileHit(projectile, asteroid);
              }
            });
          }
          
          event.processed = true;
          break;
        }
      }
    }
    
    // Remove entities safely
    this.removeEntities(boids, boidsToRemove, asteroids, asteroidsToRemove);
    
    // Remove projectiles
    if (projectiles) {
      for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectilesToRemove.has(projectiles[i])) {
          const projectile = projectiles[i];
          projectile.destroy();
          projectiles.splice(i, 1);
        }
      }
    }
    
    // Process visual effects after all removals
    for (const effect of visualEffects) {
      try {
        effect();
      } catch (e) {
        console.error('Visual effect error:', e);
      }
    }
    
    return newAsteroids;
  }
  
  /**
   * Safely remove entities from arrays
   */
  private removeEntities(
    boids: Boid[],
    boidsToRemove: Set<Boid>,
    asteroids: Asteroid[],
    asteroidsToRemove: Set<Asteroid>
  ): void {
    // Remove boids
    for (let i = boids.length - 1; i >= 0; i--) {
      if (boidsToRemove.has(boids[i])) {
        const boid = boids[i];
        boid.destroy();
        boids.splice(i, 1);
      }
    }
    
    // Remove asteroids
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroidsToRemove.has(asteroids[i])) {
        const asteroid = asteroids[i];
        asteroid.destroy();
        asteroids.splice(i, 1);
      }
    }
  }
  
  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      frameCount: this.frameCount,
      queueSize: this.eventQueue.length,
      processedPairs: this.processedPairs.size
    };
  }
  
  /**
   * Reset the manager
   */
  reset() {
    this.eventQueue = [];
    this.processedPairs.clear();
    this.frameCount = 0;
  }
}