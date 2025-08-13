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
    onAsteroidHit: (asteroid: Asteroid) => boolean,
    onAsteroidFragment?: (ast: Asteroid, fragments: number) => void
  ) {
    // Check asteroid-asteroid collisions first
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast1 = asteroids[i];
      
      for (let j = i - 1; j >= 0; j--) {
        const ast2 = asteroids[j];
        const dist = Math.hypot(ast1.x - ast2.x, ast1.y - ast2.y);
        
        if (dist < ast1.size + ast2.size) {
          // Small asteroid hitting large asteroid - fragment the large one
          if (ast1.size < 25 && ast2.size > 40) {
            // ast1 (small) fragments ast2 (large)
            if (onAsteroidFragment) {
              onAsteroidFragment(ast2, 4);
            }
            asteroids.splice(j, 1); // Remove large asteroid
            asteroids.splice(i, 1); // Remove small asteroid
            break;
          } else if (ast2.size < 25 && ast1.size > 40) {
            // ast2 (small) fragments ast1 (large)
            if (onAsteroidFragment) {
              onAsteroidFragment(ast1, 4);
            }
            asteroids.splice(i, 1); // Remove large asteroid
            asteroids.splice(j, 1); // Remove small asteroid
            break;
          }
        }
      }
    }
    
    // Check asteroid-boid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const ast = asteroids[i];
      
      for (let j = boids.length - 1; j >= 0; j--) {
        const boid = boids[j];
        if (!boid.alive) continue;
        
        const dist = Math.hypot(ast.x - boid.x, ast.y - boid.y);
        
        // More precise collision - reduce detection radius slightly
        if (dist < (ast.size * 0.9) + (GameConfig.BOID_SIZE * 0.8)) {
          // Hit! Don't restore dot immediately - let it fall
          // The falling dot is created in the onBoidHit callback
          
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