import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NeonFlockEngine } from '../src/engine/NeonFlockEngine';
import { GameConfig } from '../src/engine/GameConfig';
import * as PIXI from 'pixi.js';

// Mock PIXI modules
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js');
  return {
    ...actual,
    Graphics: vi.fn().mockImplementation(() => ({
      clear: vi.fn(),
      poly: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      circle: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      destroy: vi.fn(),
      x: 0,
      y: 0,
      rotation: 0,
      alpha: 1,
      scale: { x: 1, y: 1 },
      visible: true
    })),
    Container: vi.fn().mockImplementation(() => ({
      addChild: vi.fn(),
      removeChild: vi.fn(),
      children: [],
      destroy: vi.fn()
    })),
    Text: vi.fn().mockImplementation(() => ({
      x: 0,
      y: 0,
      text: '',
      style: {},
      anchor: { set: vi.fn() },
      destroy: vi.fn()
    }))
  };
});

describe('Asteroid Launch Mechanics', () => {
  let engine: NeonFlockEngine;
  let mockContainer: HTMLDivElement;
  let mockApp: any;

  afterEach(() => {
    // Clean up
    if (mockContainer && mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    vi.restoreAllMocks();
  });

  beforeEach(async () => {
    // Create mock HTML container
    mockContainer = document.createElement('div');
    document.body.appendChild(mockContainer);
    
    // Create engine with container
    engine = new NeonFlockEngine(mockContainer);
    
    // Create a proper mock canvas with event listeners
    const mockCanvas = document.createElement('canvas');
    mockCanvas.addEventListener = vi.fn();
    mockCanvas.removeEventListener = vi.fn();
    mockCanvas.getBoundingClientRect = vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 }));
    mockCanvas.style = {} as any;
    
    // Mock the app that will be created in initialize
    mockApp = {
      init: vi.fn().mockResolvedValue(undefined),
      screen: { width: 800, height: 600 },
      stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
        children: []
      },
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        deltaTime: 1
      },
      canvas: mockCanvas,
      view: mockCanvas, // InputManager uses app.view, not app.canvas
      renderer: {
        render: vi.fn()
      }
    };
    
    // Mock PIXI.Application constructor to return our mock
    vi.spyOn(PIXI, 'Application').mockImplementation(() => mockApp as any);
    
    // Initialize the engine
    await engine.initialize();
  });

  describe('Size-Speed Relationship', () => {
    it('should launch small asteroids at full speed', () => {
      const smallSize = GameConfig.AST_MIN;
      const slownessFactor = 1; // No slowdown for minimum size
      
      // Spy on asteroid creation
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, smallSize, slownessFactor);
      
      expect(asteroids.length).toBe(1);
      const asteroid = asteroids[0];
      
      // Check size is correct
      expect(asteroid.size).toBe(smallSize);
      
      // Check speed calculation
      const dist = Math.hypot(0, -400); // 100,100 to 100,500
      const expectedSpeed = Math.min(dist * 3, GameConfig.AST_SPEED) * slownessFactor;
      const actualSpeed = Math.hypot(asteroid.vx, asteroid.vy);
      
      expect(actualSpeed).toBeCloseTo(expectedSpeed, 1);
    });

    it('should launch large asteroids at reduced speed', () => {
      const largeSize = GameConfig.AST_MAX_CHARGE;
      // Calculate slowness factor for max charge
      const slownessFactor = 1 - ((largeSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX_CHARGE - GameConfig.AST_MIN)) * (1 - GameConfig.AST_SLOWNESS_FACTOR);
      
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, largeSize, slownessFactor);
      
      expect(asteroids.length).toBe(1);
      const asteroid = asteroids[0];
      
      // Check size is correct
      expect(asteroid.size).toBe(largeSize);
      
      // Check speed is reduced
      const dist = Math.hypot(0, -400);
      const maxSpeed = Math.min(dist * 3, GameConfig.AST_SPEED);
      const expectedSpeed = maxSpeed * slownessFactor;
      const actualSpeed = Math.hypot(asteroid.vx, asteroid.vy);
      
      expect(actualSpeed).toBeCloseTo(expectedSpeed, 1);
      expect(slownessFactor).toBeCloseTo(GameConfig.AST_SLOWNESS_FACTOR, 2); // Should be 30% of full speed
    });

    it('should interpolate speed for medium-sized asteroids', () => {
      const mediumSize = (GameConfig.AST_MIN + GameConfig.AST_MAX_CHARGE) / 2;
      const slownessFactor = 1 - ((mediumSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX_CHARGE - GameConfig.AST_MIN)) * (1 - GameConfig.AST_SLOWNESS_FACTOR);
      
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, mediumSize, slownessFactor);
      
      const asteroid = asteroids[0];
      
      // Slowness should be between min and max
      expect(slownessFactor).toBeGreaterThan(GameConfig.AST_SLOWNESS_FACTOR);
      expect(slownessFactor).toBeLessThan(1);
      
      // Speed should be proportionally reduced
      const dist = Math.hypot(0, -400);
      const maxSpeed = Math.min(dist * 3, GameConfig.AST_SPEED);
      const actualSpeed = Math.hypot(asteroid.vx, asteroid.vy);
      
      expect(actualSpeed).toBeLessThan(maxSpeed);
      expect(actualSpeed).toBeGreaterThan(maxSpeed * GameConfig.AST_SLOWNESS_FACTOR);
    });
  });

  describe('Launch Size Preservation', () => {
    it('should launch asteroid at the exact charged size', () => {
      const chargedSizes = [15, 30, 50, 75, 100];
      
      chargedSizes.forEach(size => {
        const asteroids: any[] = [];
        engine['asteroids'] = asteroids;
        
        engine.launchAsteroid(100, 500, 100, 100, size, 1);
        
        expect(asteroids[0].size).toBe(size);
        expect(asteroids[0].baseSize).toBe(size);
      });
    });

    it('should preserve shape data when provided', () => {
      const shapeData = {
        vertices: [0, -30, 26, -15, 26, 15, 0, 30, -26, 15, -26, -15],
        roughness: [1, 1, 1, 1, 1, 1]
      };
      
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, 50, 1, shapeData);
      
      const asteroid = asteroids[0];
      expect(asteroid.getShapeData()).toEqual(shapeData);
    });
  });

  describe('Physics Validation', () => {
    it('should calculate correct velocity vectors', () => {
      const testCases = [
        { start: [400, 500], target: [400, 100], expected: { vx: 0, vy: -1 } }, // Straight up
        { start: [100, 500], target: [500, 100], expected: { vx: 0.707, vy: -0.707 } }, // 45 degrees
        { start: [700, 500], target: [300, 100], expected: { vx: -0.707, vy: -0.707 } }, // -45 degrees
      ];
      
      testCases.forEach(({ start, target, expected }) => {
        const asteroids: any[] = [];
        engine['asteroids'] = asteroids;
        
        engine.launchAsteroid(start[0], start[1], target[0], target[1], 30, 1);
        
        const asteroid = asteroids[0];
        const speed = Math.hypot(asteroid.vx, asteroid.vy);
        const normalizedVx = asteroid.vx / speed;
        const normalizedVy = asteroid.vy / speed;
        
        expect(normalizedVx).toBeCloseTo(expected.vx, 1);
        expect(normalizedVy).toBeCloseTo(expected.vy, 1);
      });
    });

    it('should respect maximum speed limit', () => {
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      // Launch with huge distance
      engine.launchAsteroid(0, 600, 800, 0, 30, 1);
      
      const asteroid = asteroids[0];
      const speed = Math.hypot(asteroid.vx, asteroid.vy);
      
      expect(speed).toBeLessThanOrEqual(GameConfig.AST_SPEED);
    });

    it('should not launch if distance is too small', () => {
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      // Try to launch with tiny distance (< 20 pixels)
      engine.launchAsteroid(100, 100, 105, 105, 30, 1);
      
      expect(asteroids.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero slowness factor', () => {
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, 50, 0);
      
      const asteroid = asteroids[0];
      const speed = Math.hypot(asteroid.vx, asteroid.vy);
      
      expect(speed).toBe(0); // Should result in stationary asteroid
    });

    it('should handle maximum charge size', () => {
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, GameConfig.AST_MAX_CHARGE, GameConfig.AST_SLOWNESS_FACTOR);
      
      const asteroid = asteroids[0];
      expect(asteroid.size).toBe(GameConfig.AST_MAX_CHARGE);
    });

    it('should handle minimum size', () => {
      const asteroids: any[] = [];
      engine['asteroids'] = asteroids;
      
      engine.launchAsteroid(100, 500, 100, 100, GameConfig.AST_MIN, 1);
      
      const asteroid = asteroids[0];
      expect(asteroid.size).toBe(GameConfig.AST_MIN);
    });
  });
});