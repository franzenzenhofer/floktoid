import { Boid } from '../entities/Boid';
import { EnergyDot } from '../entities/EnergyDot';
import { Asteroid } from '../entities/Asteroid';
import CentralConfig from '../CentralConfig';

const { FLOCKING } = CentralConfig;

export class FlockingSystem {
  calculateForces(
    boid: Boid,
    allBoids: Boid[],
    energyDots: EnergyDot[],
    asteroids: Asteroid[],
    fallingDots?: Array<{ x: number; y: number; vx: number; vy: number; sprite: unknown }>
  ): { x: number; y: number } {
    const separation = { x: 0, y: 0 };
    const alignment = { x: 0, y: 0 };
    const cohesion = { x: 0, y: 0 };
    let count = 0;
    
    // Flocking forces from other boids
    for (const other of allBoids) {
      if (other === boid || !other.alive) continue;
      
      const dx = other.x - boid.x;
      const dy = other.y - boid.y;
      const d2 = dx * dx + dy * dy;
      
      if (d2 < FLOCKING.RADIUS.VIEW * FLOCKING.RADIUS.VIEW) {
        count++;
        alignment.x += other.vx;
        alignment.y += other.vy;
        cohesion.x += other.x;
        cohesion.y += other.y;
        
        if (d2 < FLOCKING.RADIUS.SEPARATION * FLOCKING.RADIUS.SEPARATION && d2 > 0) {
          const inv = 1 / Math.sqrt(d2);
          separation.x -= dx * inv;
          separation.y -= dy * inv;
        }
      }
    }
    
    if (count > 0) {
      alignment.x /= count;
      alignment.y /= count;
      cohesion.x = cohesion.x / count - boid.x;
      cohesion.y = cohesion.y / count - boid.y;
    }
    
    // Target energy dots - PRIORITIZE FALLING DOTS!
    const target = { x: 0, y: 0 };
    let targetingFallingDot = false;
    let targetingAsteroid = false;
    
    // SHOOTER SPECIAL BEHAVIOR: Target biggest nearby asteroid for better aim
    if (boid.isShooter && asteroids.length > 0) {
      let biggestAsteroid: Asteroid | null = null;
      let biggestSize = 0;
      const shooterViewRadius = FLOCKING.RADIUS.VIEW * 2; // Shooters have better vision
      
      // Find the biggest asteroid within view radius
      for (const ast of asteroids) {
        const dx = ast.x - boid.x;
        const dy = ast.y - boid.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < shooterViewRadius && ast.size > biggestSize) {
          biggestSize = ast.size;
          biggestAsteroid = ast;
        }
      }
      
      if (biggestAsteroid) {
        // Aim towards the biggest asteroid to get in shooting position
        const dx = biggestAsteroid.x - boid.x;
        const dy = biggestAsteroid.y - boid.y;
        
        // Position at optimal shooting distance (not too close, not too far)
        const optimalDistance = 150; // Good shooting distance
        const currentDistance = Math.hypot(dx, dy);
        
        if (currentDistance > optimalDistance) {
          // Move closer to asteroid
          target.x = dx;
          target.y = dy;
        } else if (currentDistance < optimalDistance * 0.7) {
          // Too close, back away slightly
          target.x = -dx * 0.5;
          target.y = -dy * 0.5;
        } else {
          // Good distance, circle around for better shot angle
          target.x = -dy * 0.5; // Perpendicular movement
          target.y = dx * 0.5;
        }
        targetingAsteroid = true;
      }
    }
    
    // If not targeting an asteroid (or not a shooter), check for falling dots
    if (!targetingAsteroid && fallingDots && fallingDots.length > 0) {
      // Find closest falling dot that's catchable
      let closestDist = Infinity;
      let closestFallingDot: typeof fallingDots[0] | null = null;
      
      for (const dot of fallingDots) {
        const dx = dot.x - boid.x;
        const dy = dot.y - boid.y;
        const dist = Math.hypot(dx, dy);
        
        // Predict where dot will be based on its velocity
        const timeToReach = dist / boid.maxSpeed;
        const futureY = dot.y + dot.vy * timeToReach;
        
        // Only target if we can reach it before it falls off screen
        if (futureY < 600 && dist < closestDist && dist < FLOCKING.RADIUS.VIEW * 3) {
          closestDist = dist;
          closestFallingDot = dot;
        }
      }
      
      if (closestFallingDot) {
        // Intercept the falling dot!
        const interceptTime = closestDist / boid.maxSpeed;
        target.x = (closestFallingDot.x + closestFallingDot.vx * interceptTime * 0.5) - boid.x;
        target.y = (closestFallingDot.y + closestFallingDot.vy * interceptTime * 0.5) - boid.y;
        targetingFallingDot = true;
        boid.targetDot = null; // Clear regular target when chasing falling dot
      }
    }
    
    // If not targeting asteroid or falling dot, target regular energy dots
    if (!targetingAsteroid && !targetingFallingDot) {
      if (!boid.targetDot || boid.targetDot.stolen) {
        // Find new target
        const available = energyDots.filter(d => !d.stolen);
        if (available.length > 0) {
          boid.targetDot = available[Math.floor(Math.random() * available.length)];
        }
      }
      
      if (boid.targetDot && !boid.targetDot.stolen) {
        const dx = boid.targetDot.x - boid.x;
        const dy = boid.targetDot.y - boid.y;
        target.x = dx;
        target.y = dy;
      }
    }
    
    // Avoid asteroids
    const avoid = { x: 0, y: 0 };
    for (const ast of asteroids) {
      const dx = ast.x - boid.x;
      const dy = ast.y - boid.y;
      const d2 = dx * dx + dy * dy;
      const r = ast.size + FLOCKING.RADIUS.AVOIDANCE;
      
      if (d2 < r * r && d2 > 0) {
        const inv = 1 / Math.sqrt(d2);
        avoid.x -= dx * inv * 500;
        avoid.y -= dy * inv * 500;
      }
    }
    
    // Normalize and apply weights
    this.normalize(separation, boid.maxSpeed);
    this.normalize(alignment, boid.maxSpeed);
    this.normalize(cohesion, boid.maxSpeed);
    this.normalize(target, boid.maxSpeed);
    
    // Apply personality weights if bird has them
    const weights = boid.personalityWeights || {
      separation: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT, 
      alignment: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT, 
      cohesion: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT, 
      targetSeek: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT, 
      avoidance: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT, 
      speedModifier: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT
    };
    
    return {
      x: FLOCKING.WEIGHTS.SEPARATION * separation.x * weights.separation +
         FLOCKING.WEIGHTS.ALIGNMENT * alignment.x * weights.alignment +
         FLOCKING.WEIGHTS.COHESION * cohesion.x * weights.cohesion +
         FLOCKING.WEIGHTS.TARGET * target.x * weights.targetSeek +
         FLOCKING.WEIGHTS.AVOID * avoid.x * weights.avoidance,
      y: FLOCKING.WEIGHTS.SEPARATION * separation.y * weights.separation +
         FLOCKING.WEIGHTS.ALIGNMENT * alignment.y * weights.alignment +
         FLOCKING.WEIGHTS.COHESION * cohesion.y * weights.cohesion +
         FLOCKING.WEIGHTS.TARGET * target.y * weights.targetSeek +
         FLOCKING.WEIGHTS.AVOID * avoid.y * weights.avoidance
    };
  }
  
  private normalize(v: { x: number; y: number }, max: number) {
    const len = Math.hypot(v.x, v.y);
    // SAFE: Check for zero length and NaN/infinity to prevent division by zero freeze
    if (len > 0 && isFinite(len) && isFinite(max)) {
      const factor = max / len;
      if (isFinite(factor)) {
        v.x = v.x * factor;
        v.y = v.y * factor;
      } else {
        // Fallback to zero if factor is not finite
        v.x = 0;
        v.y = 0;
      }
    } else {
      // Zero vector or invalid length - set to zero
      v.x = 0;
      v.y = 0;
    }
  }
}