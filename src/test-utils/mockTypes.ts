import { vi } from 'vitest';

// Mock types for PIXI objects used in tests
export interface MockSprite {
  x: number;
  y: number;
  visible: boolean;
  destroy: ReturnType<typeof vi.fn>;
  destroyed?: boolean;
}

export interface MockGraphics extends MockSprite {
  clear: ReturnType<typeof vi.fn>;
  moveTo: ReturnType<typeof vi.fn>;
  lineTo: ReturnType<typeof vi.fn>;
  stroke: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  circle: ReturnType<typeof vi.fn>;
  rect: ReturnType<typeof vi.fn>;
  poly: ReturnType<typeof vi.fn>;
  rotation: number;
  addChild: ReturnType<typeof vi.fn>;
  removeChild: ReturnType<typeof vi.fn>;
}

export interface MockContainer {
  addChild: ReturnType<typeof vi.fn>;
  removeChild: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

export interface MockApp {
  stage: MockContainer;
  screen: {
    width: number;
    height: number;
  };
}

export interface MockBoid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alive: boolean;
  sprite: MockGraphics;
  isSuperNavigator?: boolean;
  isShooter?: boolean;
  id?: number;
  hasDot?: boolean;
  trail?: Array<{ x: number; y: number }>;
  update?: (delta: number) => void;
  destroy?: () => void;
}

export interface MockAsteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: 'large' | 'medium' | 'small';
  radius: number;
  alive: boolean;
  sprite?: MockGraphics;
  update?: (delta: number) => void;
  explode?: () => void;
  destroy?: () => void;
}

export interface MockEnergyDot {
  x: number;
  y: number;
  stolen: boolean;
  alive: boolean;
  sprite: MockGraphics;
  glowSprite?: MockGraphics;
  targetBird?: MockBoid | null;
  steal?: () => void;
  restore?: () => void;
  destroy?: () => void;
}

export interface MockProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alive: boolean;
  sprite?: MockGraphics;
  update?: (delta: number) => void;
  destroy?: () => void;
}

export interface MockParticleSystem {
  createExplosion: ReturnType<typeof vi.fn>;
  createBirdExplosion: ReturnType<typeof vi.fn>;
  createAsteroidExplosion: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}