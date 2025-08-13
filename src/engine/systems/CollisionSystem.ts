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
    // Track asteroids to remove to avoid index corruption
    const asteroidsToRemove = new Set<number>();
    
    // Check asteroid-asteroid collisions first
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroidsToRemove.has(i)) continue;
      const ast1 = asteroids[i];
      
      for (let j = i - 1; j >= 0; j--) {
        if (asteroidsToRemove.has(j)) continue;
        const ast2 = asteroids[j];
        const dist = Math.hypot(ast1.x - ast2.x, ast1.y - ast2.y);
        
        if (dist < ast1.size + ast2.size) {
          // Small asteroid hitting large asteroid - fragment the large one
          if (ast1.size < 25 && ast2.size > 40) {
            // ast1 (small) fragments ast2 (large)
            if (onAsteroidFragment) {
              onAsteroidFragment(ast2, 4);
            }
            asteroidsToRemove.add(i); // Mark small asteroid for removal
            asteroidsToRemove.add(j); // Mark large asteroid for removal
            break;
          } else if (ast2.size < 25 && ast1.size > 40) {
            // ast2 (small) fragments ast1 (large)
            if (onAsteroidFragment) {
              onAsteroidFragment(ast1, 4);
            }
            asteroidsToRemove.add(i); // Mark large asteroid for removal
            asteroidsToRemove.add(j); // Mark small asteroid for removal
            break;
          }
        }
      }
    }
    
    // Remove marked asteroids in reverse order to preserve indices
    const sortedIndices = Array.from(asteroidsToRemove).sort((a, b) => b - a);
    for (const idx of sortedIndices) {
      asteroids.splice(idx, 1);
    }
    
    // Track boids to remove
    const boidsToRemove = new Set<number>();
    asteroidsToRemove.clear();
    
    // Check asteroid-boid collisions
    for (let i = asteroids.length - 1; i >= 0; i--) {
      if (asteroidsToRemove.has(i)) continue;
      const ast = asteroids[i];
      
      for (let j = boids.length - 1; j >= 0; j--) {
        if (boidsToRemove.has(j)) continue;
        const boid = boids[j];
        if (!boid.alive) continue;
        
        const dist = Math.hypot(ast.x - boid.x, ast.y - boid.y);
        
        // More precise collision - reduce detection radius slightly
        if (dist < (ast.size * 0.9) + (GameConfig.BOID_SIZE * 0.8)) {
          // Hit! Don't restore dot immediately - let it fall
          // The falling dot is created in the onBoidHit callback
          
          onBoidHit(boid);
          boid.destroy();
          boidsToRemove.add(j);
          
          // Shrink or destroy asteroid
          if (onAsteroidHit(ast)) {
            asteroidsToRemove.add(i);
          }
        }
      }
    }
    
    // Remove marked boids and asteroids
    const sortedBoidIndices = Array.from(boidsToRemove).sort((a, b) => b - a);
    for (const idx of sortedBoidIndices) {
      boids.splice(idx, 1);
    }
    
    const sortedAsteroidIndices = Array.from(asteroidsToRemove).sort((a, b) => b - a);
    for (const idx of sortedAsteroidIndices) {
      asteroids.splice(idx, 1);
    }
  }
}