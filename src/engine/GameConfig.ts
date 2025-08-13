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
  
  // Asteroids
  AST_MIN: 15,
  AST_MAX: 60,
  AST_SPEED: 500,
  AST_GROWTH_RATE: 20, // pixels per second while holding
  AST_MAX_CHARGE: 100, // max size from charging
  AST_SLOWNESS_FACTOR: 0.7, // bigger asteroids are slower
  
  // Progression - Fixed sequence: 2, 4, 8, 12, 16, 20, ...
  BIRDS_PER_WAVE: [2, 4, 8, 12, 16, 20, 24, 30, 36, 44, 52, 62, 72, 84, 96, 110],
  SPEED_GROWTH: 1.05, // 5% faster each wave
  SPAWN_BURST: 10, // Birds spawned when dot reaches top
  
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