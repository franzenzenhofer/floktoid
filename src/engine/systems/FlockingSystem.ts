import { Boid } from '../entities/Boid';
import { EnergyDot } from '../entities/EnergyDot';
import { Asteroid } from '../entities/Asteroid';
import { GameConfig } from '../GameConfig';

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
      
      if (d2 < GameConfig.VIEW_RADIUS * GameConfig.VIEW_RADIUS) {
        count++;
        alignment.x += other.vx;
        alignment.y += other.vy;
        cohesion.x += other.x;
        cohesion.y += other.y;
        
        if (d2 < GameConfig.SEPARATION_RADIUS * GameConfig.SEPARATION_RADIUS && d2 > 0) {
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
    
    // First check for falling dots to catch
    if (fallingDots && fallingDots.length > 0) {
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
        if (futureY < 600 && dist < closestDist && dist < 300) {
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
    
    // If not targeting a falling dot, target regular energy dots
    if (!targetingFallingDot) {
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
      const r = ast.size + 60;
      
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
    
    return {
      x: GameConfig.WEIGHT_SEPARATION * separation.x +
         GameConfig.WEIGHT_ALIGNMENT * alignment.x +
         GameConfig.WEIGHT_COHESION * cohesion.x +
         GameConfig.WEIGHT_TARGET * target.x +
         GameConfig.WEIGHT_AVOID * avoid.x,
      y: GameConfig.WEIGHT_SEPARATION * separation.y +
         GameConfig.WEIGHT_ALIGNMENT * alignment.y +
         GameConfig.WEIGHT_COHESION * cohesion.y +
         GameConfig.WEIGHT_TARGET * target.y +
         GameConfig.WEIGHT_AVOID * avoid.y
    };
  }
  
  private normalize(v: { x: number; y: number }, max: number) {
    const len = Math.hypot(v.x, v.y);
    if (len > 0) {
      v.x = (v.x / len) * max;
      v.y = (v.y / len) * max;
    }
  }
}