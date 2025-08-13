import { Boid } from '../entities/Boid';
import { Asteroid } from '../entities/Asteroid';
import { EnergyDot } from '../entities/EnergyDot';
import { GameConfig } from '../GameConfig';

export class CollisionSystem {
  checkCollisions(
    boids: Boid[],
    asteroids: Asteroid[],
    _energyDots: EnergyDot[],
    onBoidHit: (boid: Boid) => void,
    onAsteroidHit: (asteroid: Asteroid) => boolean
  ) {
    // Check asteroid-boid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      
      for (let j = boids.length - 1; j >= 0; j--) {
        const boid = boids[j];
        if (!boid.alive) continue;
        
        const dist = Math.hypot(ast.x - boid.x, ast.y - boid.y);
        
        if (dist < ast.size + GameConfig.BOID_SIZE) {
          // Hit! Return dot if carrying
          if (boid.hasDot && boid.targetDot) {
            boid.targetDot.restore();
          }
          
          onBoidHit(boid);
          boid.destroy();
          boids.splice(j, 1);
          
          // Shrink or destroy asteroid
          if (onAsteroidHit(ast)) {
            asteroids.splice(i, 1);
          }
        }
      }
    }
  }
}