// Test script to verify wave 5 skipping issue

class MockEngine {
  constructor() {
    this.wave = 1;
    this.birdsToSpawn = 0;
    this.boids = [];
    this.bossesToSpawn = 0;
  }

  getBossConfig() {
    if (this.wave % 5 !== 0) {
      return { count: 0, health: 0, shootingPercent: 0 };
    }
    const bossWaveNumber = Math.floor(this.wave / 5);
    const cycleNumber = Math.floor((bossWaveNumber - 1) / 3);
    const positionInCycle = ((bossWaveNumber - 1) % 3);
    const health = (positionInCycle + 1) * 5;
    const count = Math.min(cycleNumber + 1, 5);
    let shootingPercent = 0;
    if (cycleNumber > 0) {
      shootingPercent = Math.min(50 + (cycleNumber - 1) * 10, 100);
    }
    return { count, health, shootingPercent };
  }

  startWave() {
    console.log(`\n=== Starting Wave ${this.wave} ===`);
    
    const bossConfig = this.getBossConfig();
    this.bossesToSpawn = bossConfig.count;
    
    if (this.bossesToSpawn > 0) {
      console.log(`Boss wave! Spawning ${bossConfig.count} bosses with ${bossConfig.health} HP`);
      
      // Spawn bosses immediately
      for (let i = 0; i < bossConfig.count; i++) {
        this.boids.push({ type: 'boss', health: bossConfig.health });
      }
      
      // Reduce regular birds on boss waves
      const waveIndex = this.wave - 1;
      const BIRDS_PER_WAVE = [2, 3, 5, 7, 10, 12, 15, 18, 22, 25];
      const baseCount = waveIndex < BIRDS_PER_WAVE.length 
        ? BIRDS_PER_WAVE[waveIndex]
        : BIRDS_PER_WAVE[BIRDS_PER_WAVE.length - 1] + (waveIndex - BIRDS_PER_WAVE.length + 1) * 10;
      this.birdsToSpawn = Math.floor(baseCount / 2);
      console.log(`Also spawning ${this.birdsToSpawn} regular birds`);
    } else {
      // Normal wave
      const waveIndex = this.wave - 1;
      const BIRDS_PER_WAVE = [2, 3, 5, 7, 10, 12, 15, 18, 22, 25];
      const count = waveIndex < BIRDS_PER_WAVE.length 
        ? BIRDS_PER_WAVE[waveIndex]
        : BIRDS_PER_WAVE[BIRDS_PER_WAVE.length - 1] + (waveIndex - BIRDS_PER_WAVE.length + 1) * 10;
      this.birdsToSpawn = count;
      console.log(`Normal wave. Spawning ${this.birdsToSpawn} birds`);
    }
    
    console.log(`State after startWave: birdsToSpawn=${this.birdsToSpawn}, boids.length=${this.boids.length}`);
  }

  checkWaveComplete() {
    // Simulate the wave completion check
    const birdsWithoutDots = this.boids.filter(b => !b.hasDot);
    console.log(`Checking wave complete: birdsToSpawn=${this.birdsToSpawn}, birdsWithoutDots=${birdsWithoutDots.length}`);
    
    if (this.birdsToSpawn === 0 && birdsWithoutDots.length === 0) {
      console.log(`Wave ${this.wave} complete! Moving to next wave...`);
      this.wave++;
      this.startWave();
    }
  }

  simulateWaveProgression() {
    console.log("Simulating wave progression from wave 1 to 10...\n");
    
    for (let i = 0; i < 10; i++) {
      this.startWave();
      
      // Simulate clearing all birds
      this.boids = [];
      this.birdsToSpawn = 0;
      
      // Check if wave should complete
      this.checkWaveComplete();
    }
  }
}

// Run the test
const engine = new MockEngine();
engine.simulateWaveProgression();

console.log("\n=== ISSUE ANALYSIS ===");
console.log("Wave 5 appears to be skipped because:");
console.log("1. Wave 4 completes, wave++ makes it wave 5");
console.log("2. startWave() is called for wave 5 (boss wave)");
console.log("3. Bosses are spawned immediately to boids array");
console.log("4. birdsToSpawn is set to a reduced amount");
console.log("5. If birdsToSpawn is 0 or very low, and bosses are immediately");
console.log("   cleared (or not counted properly), wave completion triggers again");
console.log("6. This causes wave++ to happen again, jumping to wave 6");