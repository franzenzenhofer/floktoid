import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NeonFlockEngine } from '../src/engine/NeonFlockEngine';
import * as PIXI from 'pixi.js';

// Mock PIXI.Application
vi.mock('pixi.js', () => {
  const mockCanvas = document.createElement('canvas');
  mockCanvas.addEventListener = vi.fn();
  mockCanvas.removeEventListener = vi.fn();
  
  return {
    Application: vi.fn().mockImplementation(() => ({
      init: vi.fn().mockResolvedValue(undefined),
      canvas: mockCanvas,
      view: mockCanvas, // Add view property
      screen: { width: 800, height: 600 },
      stage: {
        addChild: vi.fn(),
        removeChild: vi.fn(),
      },
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
        deltaTime: 1,
        stop: vi.fn(),
      },
      renderer: {
        resize: vi.fn(),
      },
      start: vi.fn(),
      destroy: vi.fn(),
    })),
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    circle: vi.fn(),
    rect: vi.fn(),
    poly: vi.fn(), // Add poly method
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    destroy: vi.fn(),
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroyed: false,
    parent: null,
    scale: { set: vi.fn() },
    rotation: 0,
    alpha: 1,
    x: 0,
    y: 0,
  })),
  Container: vi.fn().mockImplementation(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
  })),
  Text: vi.fn().mockImplementation(() => ({
    anchor: { set: vi.fn() },
    scale: { set: vi.fn() },
    destroy: vi.fn(),
    destroyed: false,
    alpha: 1,
    x: 0,
    y: 0,
  })),
  };
});

describe('Bird Spawn Behavior', () => {
  let container: HTMLDivElement;
  let engine: NeonFlockEngine;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should defer bird spawning to prevent array mutation during iteration', async () => {
    engine = new NeonFlockEngine(container, true); // Enable debug mode
    await engine.initialize();

    // Access private members via any type casting
    const engineAny = engine as any;
    
    // Initially no deferred spawns
    expect(engineAny.deferredBirdSpawns).toBeDefined();
    expect(engineAny.deferredBirdSpawns.length).toBe(0);

    // Simulate a bird reaching the top in wave 10
    engineAny.wave = 10;
    const testBoid = {
      x: 400,
      y: 10,
      alive: true,
      hasDot: true,
      targetDot: { x: 400, y: 500, stolen: true },
      moveToTop: vi.fn(),
      destroy: vi.fn(),
      update: vi.fn(),
      applyForces: vi.fn(),
      vx: 0,
      vy: 0,
      targetX: 400,
      targetY: 0,
      isShooter: false,
      isSuperNavigator: false,
      isMiner: false,
    };
    engineAny.boids = [testBoid];

    // Simulate one frame of game loop
    const gameLoopFn = engineAny.gameLoop;
    gameLoopFn(1);

    // Check that spawns were deferred
    expect(engineAny.deferredBirdSpawns.length).toBeGreaterThan(0);
    expect(engineAny.deferredBirdSpawns.length).toBe(10); // Wave 10 = 10 birds

    // Verify spawn data structure
    const firstSpawn = engineAny.deferredBirdSpawns[0];
    expect(firstSpawn).toHaveProperty('x');
    expect(firstSpawn).toHaveProperty('y');
    expect(firstSpawn).toHaveProperty('vx');
    expect(firstSpawn).toHaveProperty('vy');
    expect(firstSpawn.x).toBe(testBoid.x);
    expect(firstSpawn.y).toBe(testBoid.y);
  });

  it('should process deferred spawns after boid iteration', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;
    
    // Add some deferred spawns manually
    engineAny.deferredBirdSpawns = [
      { x: 100, y: 100, vx: 10, vy: 10 },
      { x: 200, y: 200, vx: 20, vy: 20 },
      { x: 300, y: 300, vx: 30, vy: 30 },
    ];

    const initialBoidCount = engineAny.boids.length;

    // Run one frame
    const gameLoopFn = engineAny.gameLoop;
    gameLoopFn(1);

    // Check that birds were spawned
    expect(engineAny.boids.length).toBe(initialBoidCount + 3);
    expect(engineAny.deferredBirdSpawns.length).toBe(0);
  });

  it('should limit total bird count to prevent performance issues', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;
    
    // Create many existing birds (near the limit)
    engineAny.boids = [];
    for (let i = 0; i < 195; i++) {
      engineAny.boids.push({
        alive: true,
        x: i,
        y: i,
        update: vi.fn(),
        hasDot: false,
      });
    }

    // Try to spawn 20 more birds (should be limited)
    for (let i = 0; i < 20; i++) {
      engineAny.deferredBirdSpawns.push({
        x: 400,
        y: 300,
        vx: i * 10,
        vy: i * 10,
      });
    }

    // Run one frame
    const gameLoopFn = engineAny.gameLoop;
    gameLoopFn(1);

    // Should only spawn up to the limit (200 total)
    expect(engineAny.boids.length).toBeLessThanOrEqual(200);
    expect(engineAny.boids.length).toBe(200); // Should hit exactly the limit
  });

  it('should handle spawn limit per frame', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;
    engineAny.boids = [];

    // Try to spawn 100 birds at once
    for (let i = 0; i < 100; i++) {
      engineAny.deferredBirdSpawns.push({
        x: 400,
        y: 300,
        vx: Math.cos(i) * 100,
        vy: Math.sin(i) * 100,
      });
    }

    // Run one frame
    const gameLoopFn = engineAny.gameLoop;
    gameLoopFn(1);

    // Should only spawn up to maxNewBirds (50)
    expect(engineAny.boids.length).toBe(50);
    expect(engineAny.deferredBirdSpawns.length).toBe(50); // 50 remaining
  });

  it('should not cause infinite loop when spawning birds', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;
    engineAny.wave = 10;

    // Create a bird that will reach the top
    const testBoid = {
      x: 400,
      y: 10,
      alive: true,
      hasDot: true,
      targetDot: { x: 400, y: 500, stolen: true },
      moveToTop: vi.fn(),
      destroy: vi.fn(),
      update: vi.fn(),
      checkDotPickup: vi.fn().mockReturnValue(false),
      applyForces: vi.fn(),
    };
    engineAny.boids = [testBoid];

    // Run multiple frames - should not freeze or infinite loop
    const gameLoopFn = engineAny.gameLoop;
    
    // This should complete without hanging
    const startTime = Date.now();
    for (let i = 0; i < 10; i++) {
      gameLoopFn(1);
    }
    const elapsed = Date.now() - startTime;

    // Should complete quickly (not hang)
    expect(elapsed).toBeLessThan(1000); // Should take less than 1 second
    
    // Should have spawned birds but not infinitely
    expect(engineAny.boids.length).toBeGreaterThan(0);
    expect(engineAny.boids.length).toBeLessThanOrEqual(200); // Respects limit
  });

  it('should spawn correct number of birds based on wave number', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;

    // Test different wave numbers
    const testWaves = [1, 5, 10, 15, 20];
    
    for (const wave of testWaves) {
      engineAny.wave = wave;
      engineAny.deferredBirdSpawns = [];
      engineAny.boids = [];

      // Create a bird reaching the top
      const testBoid = {
        x: 400,
        y: 10,
        alive: true,
        hasDot: true,
        targetDot: { x: 400, y: 500, stolen: true },
        moveToTop: vi.fn(),
        destroy: vi.fn(),
        update: vi.fn(),
      };
      engineAny.boids = [testBoid];

      // Run one frame
      const gameLoopFn = engineAny.gameLoop;
      gameLoopFn(1);

      // Should queue spawns equal to wave number
      expect(engineAny.deferredBirdSpawns.length).toBe(wave);
    }
  });

  it('should apply correct velocities to spawned birds (circular pattern)', async () => {
    engine = new NeonFlockEngine(container, true);
    await engine.initialize();

    const engineAny = engine as any;
    engineAny.wave = 8; // 8 birds for easy angle calculation

    // Create a bird reaching the top
    const testBoid = {
      x: 400,
      y: 10,
      alive: true,
      hasDot: true,
      targetDot: { x: 400, y: 500, stolen: true },
      moveToTop: vi.fn(),
      destroy: vi.fn(),
      update: vi.fn(),
    };
    engineAny.boids = [testBoid];

    // Run one frame to queue spawns
    const gameLoopFn = engineAny.gameLoop;
    gameLoopFn(1);

    // Check velocity vectors form a circle
    const spawns = engineAny.deferredBirdSpawns;
    expect(spawns.length).toBe(8);

    // Each bird should be 45 degrees apart (360/8)
    for (let i = 0; i < spawns.length; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const expectedVx = Math.cos(angle) * 150;
      const expectedVy = Math.sin(angle) * 150;
      
      expect(spawns[i].vx).toBeCloseTo(expectedVx, 5);
      expect(spawns[i].vy).toBeCloseTo(expectedVy, 5);
    }
  });

  afterEach(() => {
    engine?.destroy();
    container.remove();
    vi.clearAllMocks();
  });
});