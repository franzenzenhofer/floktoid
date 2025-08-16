// Test boss config logic
function getBossConfig(wave) {
  // Every 5 waves is a boss wave
  if (wave % 5 !== 0) {
    return { count: 0, health: 0, shootingPercent: 0 };
  }
  
  // Which boss wave is this? (1st, 2nd, 3rd, etc.)
  const bossWaveNumber = Math.floor(wave / 5);
  
  // Determine cycle (groups of 3: 5/10/15 health pattern)
  const cycleNumber = Math.floor((bossWaveNumber - 1) / 3); // 0-based cycle
  const positionInCycle = ((bossWaveNumber - 1) % 3); // 0=5hp, 1=10hp, 2=15hp
  
  // Base health: 5, 10, or 15
  const health = (positionInCycle + 1) * 5;
  
  // Boss count increases each cycle: 1, 2, 3, 4...
  const count = Math.min(cycleNumber + 1, 5); // Cap at 5 bosses max
  
  // Shooting percentage: 0% for cycle 0, 50% for cycle 1, 60% for cycle 2, etc.
  let shootingPercent = 0;
  if (cycleNumber > 0) {
    shootingPercent = Math.min(50 + (cycleNumber - 1) * 10, 100);
  }
  
  return { count, health, shootingPercent };
}

// Test waves 1-10
for (let wave = 1; wave <= 10; wave++) {
  const config = getBossConfig(wave);
  console.log(`Wave ${wave}:`, config);
}