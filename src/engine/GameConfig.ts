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
  
  // Progression
  BIRDS_WAVE_1: 2,
  WAVE_GROWTH: 1.15,
  SPEED_GROWTH: 1.03,
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
} as const;