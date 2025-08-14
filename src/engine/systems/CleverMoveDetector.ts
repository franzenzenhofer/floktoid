import { Boid } from '../entities/Boid';
import { Asteroid } from '../entities/Asteroid';

interface CleverMove {
  type: 'near-miss' | 'multi-hit' | 'speed-shot' | 'long-range' | 'intercept';
  points: number;
  message: string;
}

export class CleverMoveDetector {
  private lastAsteroidLaunchTime = 0;
  private lastAsteroidLaunchPos = { x: 0, y: 0 };
  private nearMissCount = 0;
  private multiHitStreak = 0;
  private lastMultiHitTime = 0;
  
  /**
   * Detect near miss - asteroid passes very close to bird without hitting
   */
  detectNearMiss(asteroid: Asteroid, boids: Boid[]): CleverMove | null {
    for (const boid of boids) {
      if (!boid.alive) continue;
      
      const dist = Math.hypot(asteroid.x - boid.x, asteroid.y - boid.y);
      
      // Near miss if within 5-15 pixels
      if (dist > asteroid.size + 5 && dist < asteroid.size + 15) {
        this.nearMissCount++;
        
        if (this.nearMissCount >= 3) {
          // Bonus for multiple near misses
          this.nearMissCount = 0;
          return {
            type: 'near-miss',
            points: 50,
            message: 'CLOSE CALL x3!'
          };
        }
        
        return {
          type: 'near-miss',
          points: 10,
          message: 'NEAR MISS!'
        };
      }
    }
    return null;
  }
  
  /**
   * Detect multi-hit - one asteroid hits multiple birds
   */
  detectMultiHit(hitCount: number): CleverMove | null {
    if (hitCount < 2) return null;
    
    const now = performance.now();
    
    // Check if this is part of a streak
    if (now - this.lastMultiHitTime < 3000) {
      this.multiHitStreak++;
    } else {
      this.multiHitStreak = 1;
    }
    
    this.lastMultiHitTime = now;
    
    if (hitCount >= 5) {
      return {
        type: 'multi-hit',
        points: 200,
        message: 'MEGA STRIKE!'
      };
    } else if (hitCount >= 3) {
      return {
        type: 'multi-hit',
        points: 100,
        message: 'TRIPLE HIT!'
      };
    } else {
      return {
        type: 'multi-hit',
        points: 50,
        message: 'DOUBLE HIT!'
      };
    }
  }
  
  /**
   * Detect speed shot - very fast launch after previous
   */
  detectSpeedShot(launchPos: { x: number; y: number }): CleverMove | null {
    const now = performance.now();
    const timeSinceLastShot = now - this.lastAsteroidLaunchTime;
    
    this.lastAsteroidLaunchTime = now;
    this.lastAsteroidLaunchPos = launchPos;
    
    if (timeSinceLastShot < 500 && timeSinceLastShot > 100) {
      return {
        type: 'speed-shot',
        points: 25,
        message: 'RAPID FIRE!'
      };
    }
    
    return null;
  }
  
  /**
   * Detect long range hit - hitting bird from far away
   */
  detectLongRange(asteroidStart: { x: number; y: number }, hitPos: { x: number; y: number }): CleverMove | null {
    const distance = Math.hypot(hitPos.x - asteroidStart.x, hitPos.y - asteroidStart.y);
    
    if (distance > 400) {
      return {
        type: 'long-range',
        points: 75,
        message: 'SNIPER!'
      };
    } else if (distance > 300) {
      return {
        type: 'long-range',
        points: 35,
        message: 'LONG SHOT!'
      };
    }
    
    return null;
  }
  
  /**
   * Detect intercept - hitting bird that's carrying energy
   */
  detectIntercept(boid: Boid): CleverMove | null {
    if (boid.hasDot) {
      return {
        type: 'intercept',
        points: 100,
        message: 'INTERCEPTED!'
      };
    }
    return null;
  }
  
  /**
   * Reset streak counters
   */
  reset() {
    this.nearMissCount = 0;
    this.multiHitStreak = 0;
  }
}