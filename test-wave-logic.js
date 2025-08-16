// Simulating the exact logic flow to find the bug

class WaveSimulation {
  constructor() {
    this.wave = 4;
    this.birdsToSpawn = 0;
    this.boids = [];
    this.frameCount = 0;
  }
  
  gameLoop() {
    this.frameCount++;
    console.log(`\n=== FRAME ${this.frameCount} (Wave ${this.wave}) ===`);
    
    // Spawn birds gradually
    if (this.birdsToSpawn > 0) {
      console.log(`Spawning 1 bird (${this.birdsToSpawn} remaining)`);
      this.boids.push({ type: 'normal', hasDot: false });
      this.birdsToSpawn--;
    }
    
    // Update/process boids (simplified)
    console.log(`Boids in array: ${this.boids.length}`);
    
    // Check wave complete
    const birdsWithoutDots = this.boids.filter(b => !b.hasDot);
    console.log(`Wave completion check: birdsToSpawn=${this.birdsToSpawn}, birdsWithoutDots=${birdsWithoutDots.length}`);
    
    if (this.birdsToSpawn === 0 && birdsWithoutDots.length === 0) {
      console.log(`>>> Wave ${this.wave} COMPLETE! Moving to wave ${this.wave + 1}`);
      this.wave++;
      this.startWave();
      // CRITICAL: After startWave(), the gameLoop continues!
      console.log(`>>> After startWave(), continuing current frame...`);
    }
    
    // Rest of gameLoop continues...
    console.log(`Frame ${this.frameCount} ends.`);
  }
  
  startWave() {
    console.log(`>>> startWave() called for wave ${this.wave}`);
    
    if (this.wave % 5 === 0) {
      // Boss wave
      console.log(`>>> Boss wave! Adding boss to boids array`);
      this.boids.push({ type: 'boss', hasDot: false });
      this.birdsToSpawn = 5; // Half of normal
      console.log(`>>> Boss spawned. birdsToSpawn set to ${this.birdsToSpawn}`);
    } else {
      // Normal wave
      this.birdsToSpawn = this.wave + 1; // Simplified
      console.log(`>>> Normal wave. birdsToSpawn set to ${this.birdsToSpawn}`);
    }
  }
  
  clearAllBirds() {
    console.log(`>>> Clearing all birds`);
    this.boids = [];
  }
  
  run() {
    console.log("SIMULATING WAVE 4 TO 6 TRANSITION");
    console.log("=====================================");
    
    // Start at wave 4 with no birds
    this.wave = 4;
    this.birdsToSpawn = 0;
    this.boids = [];
    
    // Frame 1: Wave 4 complete
    console.log("\nSETUP: Wave 4, all birds dead, triggering completion");
    this.gameLoop();
    
    // Frame 2: First frame of wave 5
    console.log("\n--- NEXT FRAME ---");
    this.gameLoop();
    
    // Frame 3: Second frame of wave 5
    console.log("\n--- NEXT FRAME ---");
    this.gameLoop();
    
    // What if we clear the boss?
    console.log("\n--- SIMULATING BOSS DEATH ---");
    this.boids = this.boids.filter(b => b.type !== 'boss');
    console.log(`Removed boss. Boids remaining: ${this.boids.length}`);
    
    // Frame 4
    console.log("\n--- NEXT FRAME ---");
    this.gameLoop();
    
    // Frame 5
    console.log("\n--- NEXT FRAME ---");
    this.gameLoop();
    
    console.log("\n\nFINAL STATE:");
    console.log(`Wave: ${this.wave}`);
    console.log(`Birds to spawn: ${this.birdsToSpawn}`);
    console.log(`Boids in array: ${this.boids.length}`);
  }
}

const sim = new WaveSimulation();
sim.run();

console.log("\n=== HYPOTHESIS ===");
console.log("Wave 5 might be skipped if:");
console.log("1. The boss dies immediately (before normal birds spawn)");
console.log("2. AND the normal birds spawn count is 0 or gets reset");
console.log("3. OR there's a timing issue with wave completion check");