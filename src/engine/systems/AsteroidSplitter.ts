/**
 * AsteroidSplitter - EXACT recreation of original Asteroids (1979) splitting mechanics
 * Based on authentic Atari arcade behavior: Large→2Medium→2Small→Destroyed
 */

import * as PIXI from 'pixi.js';
import { Asteroid } from '../entities/Asteroid';
// Original Asteroids size categories

// Original Asteroids size categories (in our game units)
export enum AsteroidSize {
  LARGE = 'LARGE',
  MEDIUM = 'MEDIUM', 
  SMALL = 'SMALL'
}

export class AsteroidSplitter {
  private app: PIXI.Application;
  
  // Original Asteroids constants
  private static readonly MAX_ASTEROIDS = 26; // Original game limit
  private static readonly FRAGMENT_COUNT = 2; // Always splits into 2 pieces
  
  // Size definitions (based on original Asteroids ratios)
  private static readonly SIZE_LARGE = 40;   // Large asteroid
  private static readonly SIZE_MEDIUM = 20;  // Medium = half of large
  private static readonly SIZE_SMALL = 10;   // Small = half of medium
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  /**
   * Get asteroid size category based on its current size
   */
  private getAsteroidCategory(size: number): AsteroidSize {
    if (size >= AsteroidSplitter.SIZE_LARGE * 0.8) return AsteroidSize.LARGE;
    if (size >= AsteroidSplitter.SIZE_MEDIUM * 0.8) return AsteroidSize.MEDIUM;
    return AsteroidSize.SMALL;
  }
  
  /**
   * Split an asteroid exactly like original Asteroids (1979)
   * Large → 2 Medium, Medium → 2 Small, Small → Destroyed
   * Optional: Provide pushAwayFrom position to make fragments fly away from that point
   */
  public split(asteroid: Asteroid, currentAsteroidCount: number = 0, pushAwayFrom?: { x: number; y: number }): Asteroid[] {
    const category = this.getAsteroidCategory(asteroid.size);
    
    // Small asteroids are destroyed completely (no split)
    if (category === AsteroidSize.SMALL) {
      console.log('[ASTEROIDS] Small asteroid destroyed - no split');
      return [];
    }
    
    // Check asteroid limit (original Asteroids feature)
    const wouldExceedLimit = currentAsteroidCount + 1 >= AsteroidSplitter.MAX_ASTEROIDS;
    const fragmentCount = wouldExceedLimit ? 1 : AsteroidSplitter.FRAGMENT_COUNT;
    
    if (wouldExceedLimit) {
      console.log(`[ASTEROIDS] Near limit (${currentAsteroidCount}/${AsteroidSplitter.MAX_ASTEROIDS}) - creating 1 fragment instead of 2`);
    }
    
    // Determine fragment size
    let fragmentSize: number;
    if (category === AsteroidSize.LARGE) {
      fragmentSize = AsteroidSplitter.SIZE_MEDIUM;
    } else { // MEDIUM
      fragmentSize = AsteroidSplitter.SIZE_SMALL;
    }
    
    const fragments: Asteroid[] = [];
    const parentShape = asteroid.getShapeData();
    
    // Create fragments with conservation of momentum + randomness
    for (let i = 0; i < fragmentCount; i++) {
      let vx: number, vy: number;
      const baseSpeed = Math.hypot(asteroid.vx, asteroid.vy);
      
      if (pushAwayFrom) {
        // Push fragments away from the source (boss shield)
        const dx = asteroid.x - pushAwayFrom.x;
        const dy = asteroid.y - pushAwayFrom.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance > 0) {
          // Normalize direction and add some spread
          const pushAngle = Math.atan2(dy, dx);
          const spread = (Math.PI / 4) * (Math.random() - 0.5); // ±22.5 degrees spread
          const finalAngle = pushAngle + spread;
          
          // Strong push away from shield
          const pushSpeed = Math.max(baseSpeed * 1.5, 80); // At least 80 speed to push away
          vx = Math.cos(finalAngle) * pushSpeed;
          vy = Math.sin(finalAngle) * pushSpeed;
        } else {
          // Fallback to random if somehow at exact same position
          const randomAngle = Math.random() * Math.PI * 2;
          const speed = Math.max(baseSpeed, 60);
          vx = Math.cos(randomAngle) * speed;
          vy = Math.sin(randomAngle) * speed;
        }
      } else {
        // Original random direction logic
        const randomAngle = Math.random() * Math.PI * 2;
        
        // Conservation of momentum with realistic variation
        const momentumFactor = 0.7; // Some momentum is "lost" in the break
        const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5x speed variation
        
        const speed = (baseSpeed * momentumFactor + Math.random() * 30) * randomFactor;
        vx = Math.cos(randomAngle) * speed;
        vy = Math.sin(randomAngle) * speed;
      }
      
      // Fragment position (slightly offset to prevent overlap)
      const offsetDistance = fragmentSize * 0.7;
      const offsetAngle = (i / fragmentCount) * Math.PI * 2 + Math.random() * 0.5;
      const fragmentX = asteroid.x + Math.cos(offsetAngle) * offsetDistance;
      const fragmentY = asteroid.y + Math.sin(offsetAngle) * offsetDistance;
      
      // Create fragment using same DRY Asteroid constructor
      const fragment = new Asteroid(
        this.app,
        fragmentX,
        fragmentY,
        vx,
        vy,
        fragmentSize,
        {
          vertices: this.mutateShape(parentShape.vertices, fragmentSize / asteroid.size),
          roughness: parentShape.roughness // Keep same roughness pattern
        },
        asteroid.hue + (Math.random() * 20 - 10) // Slight color variation
      );
      
      fragments.push(fragment);
      const actualSpeed = Math.hypot(vx, vy);
      console.log(`[ASTEROIDS] Created ${category}→fragment: size ${fragmentSize}, speed ${actualSpeed.toFixed(1)}`);
    }
    
    return fragments;
  }
  
  /**
   * Mutate asteroid shape for fragment (same logic as before)
   */
  private mutateShape(originalShape: number[], scaleFactor: number): number[] {
    return originalShape.map((point) => {
      const scaled = point * scaleFactor;
      // Add slight variation to make fragments look different
      const variation = 1 + (Math.random() - 0.5) * 0.2; // ±10% variation
      return scaled * variation;
    });
  }
  
  /**
   * Check if we're near the asteroid limit
   */
  public static isNearLimit(count: number): boolean {
    return count >= AsteroidSplitter.MAX_ASTEROIDS - 2;
  }
  
  /**
   * Get the maximum asteroid count (for game logic)
   */
  public static getMaxAsteroids(): number {
    return AsteroidSplitter.MAX_ASTEROIDS;
  }
}