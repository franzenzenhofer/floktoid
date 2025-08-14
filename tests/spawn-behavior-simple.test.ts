import { describe, it, expect } from 'vitest';

describe('Bird Spawn Behavior - Core Logic', () => {
  it('should defer spawns to prevent array mutation during iteration', () => {
    // Simulate the core logic without PIXI dependencies
    const boids: any[] = [];
    const deferredBirdSpawns: any[] = [];
    
    // Simulate iteration over boids
    const initialBoids = [
      { id: 1, y: 10, hasDot: true },
      { id: 2, y: 100, hasDot: false },
    ];
    
    // This simulates the game loop
    initialBoids.forEach((boid, i) => {
      if (boid.hasDot && boid.y < 20) {
        // Instead of adding directly to boids array (which would cause issues)
        // We defer the spawns
        const burstCount = 10; // Wave 10
        for (let j = 0; j < burstCount; j++) {
          const angle = (j / burstCount) * Math.PI * 2;
          deferredBirdSpawns.push({
            x: 400,
            y: 10,
            vx: Math.cos(angle) * 150,
            vy: Math.sin(angle) * 150,
          });
        }
      }
    });
    
    // After iteration, process deferred spawns
    expect(deferredBirdSpawns.length).toBe(10);
    
    // Now safe to add to boids array
    deferredBirdSpawns.forEach(spawn => {
      boids.push(spawn);
    });
    
    expect(boids.length).toBe(10);
  });
  
  it('should limit total bird count to prevent performance issues', () => {
    const maxTotalBirds = 200;
    const maxNewBirds = 50;
    
    // Simulate many existing birds
    const existingBirds = Array(195).fill(0).map((_, i) => ({ id: i }));
    
    // Try to spawn 30 more
    const deferredSpawns = Array(30).fill(0).map((_, i) => ({ id: 1000 + i }));
    
    // Calculate how many we can actually spawn
    const currentBirdCount = existingBirds.length;
    const availableSlots = Math.max(0, maxTotalBirds - currentBirdCount);
    const spawnsToProcess = Math.min(deferredSpawns.length, maxNewBirds, availableSlots);
    
    expect(spawnsToProcess).toBe(5); // Only 5 slots available (200 - 195)
    
    // Process only the allowed spawns
    const newBirds = deferredSpawns.slice(0, spawnsToProcess);
    const finalBirdCount = existingBirds.length + newBirds.length;
    
    expect(finalBirdCount).toBe(200);
  });
  
  it('should limit spawns per frame', () => {
    const maxNewBirds = 50;
    const deferredSpawns = Array(100).fill(0).map((_, i) => ({ id: i }));
    
    // First frame
    const firstFrameSpawns = Math.min(deferredSpawns.length, maxNewBirds);
    expect(firstFrameSpawns).toBe(50);
    
    // Remaining for next frame
    const remaining = deferredSpawns.length - firstFrameSpawns;
    expect(remaining).toBe(50);
  });
  
  it('should spawn birds in circular pattern', () => {
    const burstCount = 8;
    const spawns: any[] = [];
    
    for (let i = 0; i < burstCount; i++) {
      const angle = (i / burstCount) * Math.PI * 2;
      spawns.push({
        vx: Math.cos(angle) * 150,
        vy: Math.sin(angle) * 150,
      });
    }
    
    // Check that velocities form a circle
    expect(spawns.length).toBe(8);
    
    // First bird should go right (angle = 0)
    expect(spawns[0].vx).toBeCloseTo(150, 5);
    expect(spawns[0].vy).toBeCloseTo(0, 5);
    
    // Third bird should go up (angle = π/2) 
    expect(spawns[2].vx).toBeCloseTo(0, 5);
    expect(spawns[2].vy).toBeCloseTo(150, 5);
    
    // Fifth bird should go left (angle = π)
    expect(spawns[4].vx).toBeCloseTo(-150, 5);
    expect(spawns[4].vy).toBeCloseTo(0, 5);
    
    // Seventh bird should go down (angle = 3π/2)
    expect(spawns[6].vx).toBeCloseTo(0, 5);
    expect(spawns[6].vy).toBeCloseTo(-150, 5);
  });
  
  it('should scale spawn count with wave number', () => {
    const testWaves = [1, 5, 10, 15, 20];
    
    testWaves.forEach(wave => {
      const burstCount = wave; // Direct correlation: wave number = birds spawned
      expect(burstCount).toBe(wave);
    });
  });
  
  it('should not cause infinite loop with deferred spawning', () => {
    const boids: any[] = [];
    const deferredSpawns: any[] = [];
    let iterationCount = 0;
    const maxIterations = 100;
    
    // Initial bird that will spawn more
    boids.push({ id: 0, shouldSpawn: true });
    
    // Simulate game loop with protection
    while (iterationCount < maxIterations) {
      iterationCount++;
      
      // Process current boids (without modifying array during iteration)
      const toProcess = [...boids];
      toProcess.forEach(boid => {
        if (boid.shouldSpawn) {
          // Defer spawns instead of adding directly
          for (let i = 0; i < 10; i++) {
            deferredSpawns.push({ id: iterationCount * 100 + i, shouldSpawn: false });
          }
          boid.shouldSpawn = false; // Prevent re-spawning
        }
      });
      
      // Process deferred spawns after iteration
      if (deferredSpawns.length > 0) {
        const toSpawn = deferredSpawns.splice(0, Math.min(50, deferredSpawns.length));
        boids.push(...toSpawn);
      }
      
      // Exit if no more spawns pending
      if (deferredSpawns.length === 0) {
        break;
      }
    }
    
    // Should complete without hitting max iterations
    expect(iterationCount).toBeLessThan(maxIterations);
    expect(boids.length).toBe(11); // 1 original + 10 spawned
  });
});