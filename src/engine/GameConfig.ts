export const GameConfig = {
  // Flocking parameters
  VIEW_RADIUS: 100,
  SEPARATION_RADIUS: 35,
  BOID_SIZE: 7,
  BASE_SPEED: 40,
  BASE_FORCE: 80,
  
  // Flocking weights
  WEIGHT_SEPARATION: 2.0,
  WEIGHT_ALIGNMENT: 1.0,
  WEIGHT_COHESION: 0.8,
  WEIGHT_TARGET: 1.5,
  WEIGHT_AVOID: 3.0,
  
  // Game mechanics
  ENERGY_COUNT: 12,
  ENERGY_RADIUS: 6,
  BASE_Y: 0.9, // Position of energy dots (90% down the screen)
  
  // Respawn timers (balanced for difficulty)
  DOT_RESPAWN_BASE: 15000, // Base 15 seconds at wave 1
  DOT_RESPAWN_PER_WAVE: -300, // Faster by 0.3s per wave
  DOT_RESPAWN_MIN: 3000, // Never faster than 3 seconds
  
  // Asteroids
  AST_MIN: 15,
  AST_MAX: 60,
  AST_SPEED: 500,
  AST_GROWTH_RATE: 20, // pixels per second while holding
  AST_MAX_CHARGE: 100, // max size from charging
  AST_SLOWNESS_FACTOR: 0.3, // BIG asteroids are 70% slower! (was 0.7, then 0.4)
  
  // Progression - More gradual increase with more stages
  BIRDS_PER_WAVE: [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, // Waves 1-10: gentle start
    12, 13, 14, 16, 18, 20, 22, 24, 26, 28, // Waves 11-20: moderate
    30, 32, 35, 38, 41, 44, 47, 50, 54, 58, // Waves 21-30: challenging
    62, 66, 70, 75, 80, 85, 90, 96, 102, 108, // Waves 31-40: hard
    115, 122, 130, 138, 146, 155, 164, 174, 184, 195, // Waves 41-50: very hard
    206, 218, 230, 243, 256, 270, 285, 300, 316, 333  // Waves 51-60: extreme
  ],
  SPEED_GROWTH: 1.02, // Only 2% faster each wave (was 5%)
  // SPAWN_BURST: Dynamic - equals current wave number (1 bird on wave 1, 10 on wave 10, etc.)
  
  // Visual
  NEON_COLORS: [
    0xff00ff, // Magenta
    0x00ffff, // Cyan
    0xffff00, // Yellow
    0xff00aa, // Pink
    0x00ff00, // Green
    0xff6600, // Orange
    0x0099ff, // Blue
    0xff0066, // Red-pink
    0x66ff00, // Lime
    0xff3366, // Coral
  ],
  
  // Performance
  MAX_PARTICLES: 500,
  PARTICLE_LIFETIME: 1.0,
  
  // Scoring
  SCORE_HIT: 10,
  SCORE_COMBO_2: 25,
  SCORE_COMBO_3: 50,
  SCORE_COMBO_4: 100,
  SCORE_CLEVER: 200, // ricochet kills
  SCORE_DOT_SAVED: 50,
} as const;