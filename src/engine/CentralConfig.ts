/**
 * CENTRAL CONFIGURATION - SINGLE SOURCE OF TRUTH
 * NO MAGIC NUMBERS OR STRINGS ALLOWED ANYWHERE ELSE!
 */

// ============================================
// GAME CONSTANTS
// ============================================

export const GAME_CONSTANTS = {
  // Version
  VERSION: '1.69.0',
  
  // Canvas
  CANVAS: {
    BACKGROUND_COLOR: '#000000',
    DEFAULT_WIDTH: 800,
    DEFAULT_HEIGHT: 600,
  },
  
  // Performance
  PERFORMANCE: {
    TARGET_FPS: 60,
    MAX_DELTA_TIME: 1000 / 30, // Cap at 30fps minimum
    TICKER_PRIORITY: 1,
  },
  
  // Platform Detection
  PLATFORM: {
    IOS_USER_AGENT_REGEX: /iPhone|iPad|iPod/i,
    MOBILE_USER_AGENT_REGEX: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i,
  },
} as const;

// ============================================
// ENTITY LIMITS
// ============================================

export const ENTITY_LIMITS = {
  BIRDS: {
    MAX_TOTAL: 200,
    MAX_PER_FRAME: 50,
    MIN_COUNT: 0,
    WARNING_THRESHOLD: 150,
  },
  ASTEROIDS: {
    MAX_TOTAL: 100,
    MAX_PER_FRAME: 20,
    MIN_COUNT: 0,
    WARNING_THRESHOLD: 80,
  },
  SHREDDERS: {
    MAX_TOTAL: 2,
    MAX_PER_FRAME: 2,
    MIN_COUNT: 0,
    WARNING_THRESHOLD: 2,
  },
  PARTICLES: {
    MAX_TOTAL: 1000,
    MAX_PER_EXPLOSION: 50,
    MIN_COUNT: 0,
  },
  FALLING_DOTS: {
    MAX_TOTAL: 50,
    MIN_COUNT: 0,
  },
  ENERGY_DOTS: {
    TOTAL_COUNT: 5,
    MIN_COUNT: 0,
  },
  TOTAL_ENTITIES: {
    MAX: 500,
    EMERGENCY_CLEANUP_THRESHOLD: 450,
  },
} as const;

// ============================================
// PHYSICS CONSTANTS
// ============================================

export const PHYSICS = {
  GRAVITY: {
    BASE: 50,
    FALLING_DOT_MULTIPLIER: 1,
  },
  SPEED: {
    BASE_BIRD_SPEED: 40,
    BASE_BIRD_FORCE: 80,
    ASTEROID_BASE_SPEED: 300,
    FALLING_DOT_SPEED_RATIO: 0.1, // 10% of bird speed
    MAX_SPEED_MULTIPLIER: 10,
  },
  FRICTION: {
    AIR_RESISTANCE: 0.95,
    BOUNDARY_BOUNCE: 100,
  },
} as const;

// ============================================
// FLOCKING BEHAVIOR
// ============================================

export const FLOCKING = {
  RADIUS: {
    VIEW: 100,
    SEPARATION: 35,
    COHESION: 80,
    ALIGNMENT: 100,
    AVOIDANCE: 60,
    DOT_DETECTION: 20,
    FALLING_DOT_CATCH: 30,
  },
  WEIGHTS: {
    SEPARATION: 1.5,
    ALIGNMENT: 1.0,
    COHESION: 0.8,
    TARGET: 2.0,
    AVOID: 3.0,
  },
  PERSONALITY_MULTIPLIERS: {
    MIN: 0.3,
    MAX: 2.0,
    DEFAULT: 1.0,
  },
} as const;

// ============================================
// VISUAL CONSTANTS
// ============================================

export const VISUALS = {
  COLORS: {
    NEON_CYAN: 0x00FFFF,
    NEON_MAGENTA: 0xFF00FF,
    NEON_YELLOW: 0xFFFF00,
    NEON_RED: 0xFF0000,
    NEON_GREEN: 0x00FF00,
    NEON_BLUE: 0x0000FF,
    NEON_ORANGE: 0xFFA500,
    NEON_PURPLE: 0x9400D3,
    WHITE: 0xFFFFFF,
    BLACK: 0x000000,
  },
  ALPHA: {
    FULL: 1.0,
    HIGH: 0.9,
    MEDIUM: 0.7,
    LOW: 0.5,
    VERY_LOW: 0.3,
    MINIMAL: 0.1,
    NONE: 0,
  },
  STROKE: {
    THIN: 1,
    NORMAL: 2,
    THICK: 3,
    VERY_THICK: 4,
    ULTRA_THICK: 5,
  },
  GLOW: {
    INNER_RADIUS_MULTIPLIER: 1.0,
    OUTER_RADIUS_MULTIPLIER: 1.5,
    BLUR_AMOUNT: 4,
  },
  TRAIL: {
    MAX_LENGTH: 10,
    MIN_LENGTH: 1,
    FADE_RATE: 0.02,
  },
  GRID: {
    SIZE: 50,
    LINE_ALPHA: 0.1,
    LINE_WIDTH: 1,
  },
  STARS: {
    COUNT: 100,
    MIN_SIZE: 0.5,
    MAX_SIZE: 2,
    MIN_ALPHA: 0.1,
    MAX_ALPHA: 0.5,
  },
} as const;

// ============================================
// SIZES
// ============================================

export const SIZES = {
  BIRD: {
    BASE: 10,
    TRIANGLE_FRONT_MULTIPLIER: 1.2,
    TRIANGLE_BACK_MULTIPLIER: 0.8,
    DOT_INDICATOR_RADIUS: 4,
  },
  ASTEROID: {
    MIN: 10,
    MAX: 50,
    DEFAULT: 25,
    CHARGE_GROWTH_RATE: 35,  // FASTER growing when charging (was 20)
    MAX_CHARGE_SIZE: 75,     // BIGGER asteroids allowed (was 60)
    SHRINK_ON_HIT_MULTIPLIER: 0.8,
    DESTROY_THRESHOLD: 10,
  },
  ENERGY_DOT: {
    RADIUS: 12,
    PULSE_MIN_SCALE: 0.9,
    PULSE_MAX_SCALE: 1.1,
    GLOW_RADIUS_MULTIPLIER: 2,
  },
  BOSS_BIRD: {
    BASE_MULTIPLIER: 3, // 3x normal bird
    HEALTH_BAR_WIDTH: 60,
    HEALTH_BAR_HEIGHT: 8,
  },
} as const;

// ============================================
// TIMING
// ============================================

export const TIMING = {
  COMBO_WINDOW_MS: 2000,
  DOT_RESPAWN_DELAY_MS: 15000,
  WAVE_SPAWN_INTERVAL_MS: 500,
  ANIMATION: {
    FADE_DURATION_MS: 1000,
    PULSE_SPEED: 0.05,
    SHIMMER_SPEED: 10,
    ROTATION_SPEED: 0.01,
  },
  TIMEOUTS: {
    DEFAULT_MS: 100,
    SHORT_MS: 50,
    LONG_MS: 500,
    VERY_LONG_MS: 1000,
  },
  INPUT: {
    DOUBLE_TAP_THRESHOLD_MS: 300,
    HOLD_THRESHOLD_MS: 200,
    CHARGE_MAX_MS: 3000,
  },
} as const;

// ============================================
// SCORING
// ============================================

export const SCORING = {
  POINTS: {
    BIRD_HIT: 5,
    DOT_SAVED: 10,
    DOT_CAUGHT: 15,
    ASTEROID_HIT: 1,
    WAVE_COMPLETE: 100,
    BOSS_DEFEATED: 500,
  },
  MULTIPLIERS: {
    MIN: 1,
    MAX: 5,
    INCREMENT: 0.5,
  },
} as const;

// ============================================
// WAVES
// ============================================

export const WAVES = {
  BIRDS_PER_WAVE: [2, 3, 5, 7, 10, 12, 15, 18, 22, 25],
  SPEED_GROWTH: 1.03,
  SPAWN_BURST_MULTIPLIER: 1, // Birds spawned = wave number
  BOSS_WAVE_INTERVAL: 5,
  MAX_WAVE: 999,
} as const;

// ============================================
// COLLISION
// ============================================

export const COLLISION = {
  DETECTION: {
    MAX_CHECKS_PER_FRAME: 1000,
    SPATIAL_GRID_SIZE: 100,
  },
  RESPONSE: {
    BOUNCE_DAMPING: 0.8,
    MINIMUM_SEPARATION: 1,
  },
  SHAPES: {
    CIRCLE_TO_CIRCLE: 'CIRCLE_TO_CIRCLE',
    CIRCLE_TO_POLYGON: 'CIRCLE_TO_POLYGON',
    POLYGON_TO_POLYGON: 'POLYGON_TO_POLYGON',
  },
} as const;

// ============================================
// ASTEROID GENERATION
// ============================================

export const ASTEROID_GEN = {
  EDGES: {
    MIN: 3,
    MAX: 13,
    PREFERRED_MIN: 6,
    PREFERRED_MAX: 9,
    DISTRIBUTION: [
      3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7,
      8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 11, 11, 12, 12, 13
    ],
  },
  ROUGHNESS: {
    MIN: 0.2,
    MAX: 0.4,
    VARIATION: 0.1,
  },
  ROTATION: {
    MIN_SPEED: -0.5,   // Increased 10x for visible spin
    MAX_SPEED: 0.5,    // Some clockwise, some counter-clockwise
  },
} as const;

// ============================================
// SHREDDER ENEMY CONFIGURATION
// ============================================

export const SHREDDER = {
  SPAWN: {
    BASE_PROBABILITY: 0.05,
    EXTRA_PER_ASTEROID: 0.001,
    MAX_PROBABILITY: 0.25,
  },
  MAX_CONCURRENT: 2,
  SCALE: {
    MIN: 1.0,
    MAX: 1.8,  // Much smaller max size
  },
  SPIN: {
    MIN: 0.6,
    MAX: 1.6,
  },
  AMPLITUDE: {
    MIN: 0.15,
    MAX: 0.30,
  },
  SPEED_JITTER: 0.2,
  TOLERANCE: 0.05,
} as const;

// ============================================
// UI CONSTANTS
// ============================================

export const UI = {
  Z_INDEX: {
    BACKGROUND: 0,
    GRID: 1,
    STARS: 2,
    ENERGY_DOTS: 10,
    ASTEROIDS: 20,
    BIRDS: 30,
    PARTICLES: 40,
    UI_OVERLAY: 50,
    MODAL: 100,
  },
  FONTS: {
    PRIMARY: 'Space Mono',
    FALLBACK: 'monospace',
    SIZES: {
      SMALL: 12,
      NORMAL: 16,
      LARGE: 24,
      HUGE: 32,
      MASSIVE: 48,
    },
  },
  MARGINS: {
    SMALL: 10,
    NORMAL: 20,
    LARGE: 40,
  },
  ANIMATIONS: {
    TRANSITION_MS: 300,
    EASE: 'ease-in-out',
  },
} as const;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERRORS = {
  ENGINE: {
    INIT_FAILED: 'ENGINE INITIALIZATION FAILED',
    WEBGL_FAILED: 'WebGL context creation failed',
    PIXI_FAILED: 'PIXI.js initialization failed',
    TEXTURE_FAILED: 'Texture loading failed',
  },
  GAME: {
    STATE_INVALID: 'Invalid game state',
    WAVE_OVERFLOW: 'Wave number overflow',
    ENTITY_OVERFLOW: 'Entity limit exceeded',
  },
  NETWORK: {
    FETCH_FAILED: 'Network request failed',
    TIMEOUT: 'Request timeout',
  },
  VALIDATION: {
    INVALID_NUMBER: 'Invalid number value',
    OUT_OF_BOUNDS: 'Value out of bounds',
    NULL_REFERENCE: 'Null reference error',
  },
} as const;

// ============================================
// GAME STATES
// ============================================

export enum GameState {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  WIN = 'WIN',
}

// ============================================
// ENTITY TYPES
// ============================================

export enum EntityType {
  BIRD = 'BIRD',
  BOSS_BIRD = 'BOSS_BIRD',
  ASTEROID = 'ASTEROID',
  ENERGY_DOT = 'ENERGY_DOT',
  PARTICLE = 'PARTICLE',
  POWER_UP = 'POWER_UP',
}

// ============================================
// INPUT TYPES
// ============================================

export enum InputType {
  MOUSE = 'MOUSE',
  TOUCH = 'TOUCH',
  KEYBOARD = 'KEYBOARD',
  GAMEPAD = 'GAMEPAD',
}

// ============================================
// SOUND TYPES (for future)
// ============================================

export enum SoundType {
  EXPLOSION = 'EXPLOSION',
  PICKUP = 'PICKUP',
  LAUNCH = 'LAUNCH',
  HIT = 'HIT',
  WAVE_COMPLETE = 'WAVE_COMPLETE',
  GAME_OVER = 'GAME_OVER',
  BACKGROUND_MUSIC = 'BACKGROUND_MUSIC',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export const ConfigHelpers = {
  // Get color as hex string
  getColorHex: (color: number): string => {
    return '#' + color.toString(16).padStart(6, '0');
  },
  
  // Get safe entity limit
  getSafeEntityLimit: (type: keyof typeof ENTITY_LIMITS): number => {
    const limits = ENTITY_LIMITS[type];
    if ('MAX_TOTAL' in limits) {
      return limits.MAX_TOTAL;
    }
    if ('TOTAL_COUNT' in limits) {
      return (limits as typeof ENTITY_LIMITS.ENERGY_DOTS).TOTAL_COUNT;
    }
    return 0;
  },
  
  // Check if value is within bounds
  isInBounds: (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
  },
  
  // Clamp value between min and max
  clamp: (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
  },
  
  // Get wave bird count
  getWaveBirdCount: (wave: number): number => {
    const index = wave - 1;
    if (index < WAVES.BIRDS_PER_WAVE.length) {
      return WAVES.BIRDS_PER_WAVE[index];
    }
    // Calculate for waves beyond array
    const lastCount = WAVES.BIRDS_PER_WAVE[WAVES.BIRDS_PER_WAVE.length - 1];
    const extraWaves = wave - WAVES.BIRDS_PER_WAVE.length;
    return lastCount + (extraWaves * 10);
  },
  
  // Validate number is finite
  isValidNumber: (value: unknown): value is number => {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  },
} as const;

// ============================================
// EXPORT CENTRAL CONFIG
// ============================================

export default {
  GAME_CONSTANTS,
  ENTITY_LIMITS,
  PHYSICS,
  FLOCKING,
  VISUALS,
  SIZES,
  TIMING,
  SCORING,
  WAVES,
  COLLISION,
  ASTEROID_GEN,
  SHREDDER,
  UI,
  ERRORS,
  GameState,
  EntityType,
  InputType,
  SoundType,
  ConfigHelpers,
} as const;