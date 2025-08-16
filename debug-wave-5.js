// Minimal reproduction of wave 5 skip bug

const BIRDS_PER_WAVE = [2, 3, 5, 7, 10, 12, 15, 18, 22, 25];

function getBossConfig(wave) {
  if (wave % 5 !== 0) {
    return { count: 0, health: 0, shootingPercent: 0 };
  }
  
  const bossWaveNumber = Math.floor(wave / 5);
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

class GameSim {
  constructor() {
    this.wave = 1;
    this.birdsToSpawn = 0;
    this.boids = [];
    this.bossesToSpawn = 0;
  }
  
  startWave() {
    console.log(`\n[WAVE] Starting wave ${this.wave}`);
    
    const bossConfig = getBossConfig(this.wave);
    this.bossesToSpawn = bossConfig.count;
    console.log(`[WAVE] Boss config for wave ${this.wave}:`, bossConfig);
    
    if (this.bossesToSpawn > 0) {
      // Spawn bosses immediately
      for (let i = 0; i < bossConfig.count; i++) {
        this.boids.push({ type: 'boss', hasDot: false, health: bossConfig.health });
      }
      
      // Reduce regular birds on boss waves
      const waveIndex = this.wave - 1;
      const baseCount = waveIndex < BIRDS_PER_WAVE.length 
        ? BIRDS_PER_WAVE[waveIndex]
        : BIRDS_PER_WAVE[BIRDS_PER_WAVE.length - 1] + (waveIndex - BIRDS_PER_WAVE.length + 1) * 10;
      this.birdsToSpawn = Math.floor(baseCount / 2);
      console.log(`[WAVE] Boss wave ${this.wave}: spawned ${bossConfig.count} bosses, birdsToSpawn=${this.birdsToSpawn}`);
    } else {
      // Normal wave
      const waveIndex = this.wave - 1;
      const count = waveIndex < BIRDS_PER_WAVE.length 
        ? BIRDS_PER_WAVE[waveIndex]
        : BIRDS_PER_WAVE[BIRDS_PER_WAVE.length - 1] + (waveIndex - BIRDS_PER_WAVE.length + 1) * 10;
      this.birdsToSpawn = count;
    }
    
    console.log(`[WAVE] After startWave: birdsToSpawn=${this.birdsToSpawn}, boids.length=${this.boids.length}`);
  }
  
  update() {
    // Spawn regular birds gradually
    if (this.birdsToSpawn > 0) {
      this.boids.push({ type: 'normal', hasDot: false });
      this.birdsToSpawn--;
    }
    
    // Check wave complete
    const birdsWithoutDots = this.boids.filter(b => !b.hasDot);
    
    if (this.wave === 5 && this.birdsToSpawn === 0) {
      console.log(`[WAVE 5 DEBUG] birdsToSpawn=${this.birdsToSpawn}, birdsWithoutDots=${birdsWithoutDots.length}, boids=${this.boids.length}`);
    }
    
    if (this.birdsToSpawn === 0 && birdsWithoutDots.length === 0) {
      console.log(`[WAVE] Wave ${this.wave} complete, moving to wave ${this.wave + 1}`);
      this.wave++;
      this.startWave();
      return true; // Wave completed
    }
    
    return false;
  }
  
  clearAllBirds() {
    // Simulate killing all birds
    this.boids = [];
  }
  
  simulate() {
    console.log("=== SIMULATING WAVE PROGRESSION ===");
    
    // Start the game
    this.startWave();
    
    // Simulate waves 1-6
    for (let i = 0; i < 100; i++) { // Max iterations to prevent infinite loop
      // Simulate frame updates
      const waveCompleted = this.update();
      
      if (!waveCompleted) {
        // If wave not complete, clear birds to simulate player killing them
        this.clearAllBirds();
      }
      
      if (this.wave > 6) {
        break;
      }
    }
  }
}

// Run simulation
const game = new GameSim();
game.simulate();

console.log("\n=== ANALYSIS ===");
console.log("The issue is that when bosses spawn, they have hasDot=false");
console.log("The wave completion check requires all birds without dots to be gone");
console.log("So bosses prevent the wave from completing until they're killed");
console.log("But if something causes them to be cleared immediately, the wave completes");
console.log("This could happen if there's a timing issue or initialization problem");