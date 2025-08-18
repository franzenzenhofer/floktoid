import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as PIXI from 'pixi.js';
import { Shredder } from '../entities/Shredder';

vi.mock('pixi.js', () => ({
  Graphics: vi.fn().mockImplementation(() => ({
    clear: vi.fn(),
    poly: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    circle: vi.fn(),
    x: 0,
    y: 0,
    rotation: 0,
    destroyed: false
  })),
  Application: vi.fn().mockImplementation(() => ({
    stage: {
      addChild: vi.fn(),
      removeChild: vi.fn()
    },
    screen: {
      width: 800,
      height: 600
    }
  }))
}));

describe('Shredder Rotation System', () => {
  let app: any;
  let shredder: Shredder;

  beforeEach(() => {
    app = new PIXI.Application();
    shredder = new Shredder(app);
  });

  it('should complete full rotations and trigger state change', () => {
    // Force specific test values
    (shredder as any).rotationsUntilSwitch = 2; // Should switch after 2 rotations
    (shredder as any).rotationSpeed = 20; // 20 rad/sec
    (shredder as any).baseRotationSpeed = 20;
    (shredder as any).rotationDirection = 1; // Start rotating right
    (shredder as any).rotationState = 'spinning';
    (shredder as any).rotationCount = 0;
    (shredder as any).cumulativeRotation = 0;

    // Simulate time to complete 2 full rotations
    // 2 rotations = 4π radians, at 20 rad/sec = 0.628 seconds
    const dt = 0.016; // 60 FPS
    const steps = Math.ceil(0.65 / dt); // A bit more than needed
    
    let stateChanged = false;
    
    for (let i = 0; i < steps; i++) {
      shredder.update(dt);
      
      // Check if state changed to 'slowing'
      if ((shredder as any).rotationState === 'slowing') {
        stateChanged = true;
        break;
      }
    }
    
    expect(stateChanged).toBe(true);
    expect((shredder as any).rotationCount).toBeGreaterThanOrEqual(2);
  });

  it('should track cumulative rotation correctly', () => {
    (shredder as any).rotationSpeed = 10; // 10 rad/sec
    (shredder as any).baseRotationSpeed = 10;
    (shredder as any).rotationDirection = -1; // Left
    (shredder as any).cumulativeRotation = 0;
    
    const dt = 0.1; // 100ms
    shredder.update(dt);
    
    // Should accumulate 1 radian (10 * 0.1)
    expect((shredder as any).cumulativeRotation).toBeCloseTo(1.0, 1);
  });

  it('should have random initial rotation direction', () => {
    const directions: number[] = [];
    
    // Create 100 shredders and check distribution
    for (let i = 0; i < 100; i++) {
      const testShredder = new Shredder(app);
      directions.push((testShredder as any).rotationDirection);
    }
    
    const leftCount = directions.filter(d => d === -1).length;
    const rightCount = directions.filter(d => d === 1).length;
    
    // Should be roughly 50/50 (within reasonable variance)
    expect(leftCount).toBeGreaterThan(30);
    expect(rightCount).toBeGreaterThan(30);
    expect(leftCount + rightCount).toBe(100);
  });

  it('should go through complete state cycle', () => {
    (shredder as any).rotationsUntilSwitch = 1; // Switch after 1 rotation
    (shredder as any).rotationSpeed = 50; // Very fast for testing
    (shredder as any).baseRotationSpeed = 50;
    (shredder as any).rotationDirection = 1;
    (shredder as any).rotationState = 'spinning';
    
    const states: string[] = [];
    const dt = 0.016;
    const maxSteps = 200; // ~3.2 seconds should be enough
    
    for (let i = 0; i < maxSteps; i++) {
      const currentState = (shredder as any).rotationState;
      if (states.length === 0 || states[states.length - 1] !== currentState) {
        states.push(currentState);
      }
      
      shredder.update(dt);
      
      // Stop if we've completed a full cycle
      if (states.length >= 4 && states[states.length - 1] === 'spinning') {
        break;
      }
    }
    
    // Should go: spinning -> slowing -> stopped -> accelerating -> spinning
    expect(states).toContain('spinning');
    expect(states).toContain('slowing');
    expect(states).toContain('stopped');
    expect(states).toContain('accelerating');
  });

  it('should reverse direction after stop', () => {
    (shredder as any).rotationsUntilSwitch = 1;
    (shredder as any).rotationSpeed = 100; // Very fast
    (shredder as any).baseRotationSpeed = 100;
    (shredder as any).rotationDirection = 1; // Start right
    (shredder as any).rotationState = 'spinning';
    
    const dt = 0.016;
    let initialDirection = (shredder as any).rotationDirection;
    let directionChanged = false;
    
    // Run for enough time to complete cycle
    for (let i = 0; i < 300; i++) {
      shredder.update(dt);
      
      if ((shredder as any).rotationDirection !== initialDirection) {
        directionChanged = true;
        break;
      }
    }
    
    expect(directionChanged).toBe(true);
    expect((shredder as any).rotationDirection).toBe(-initialDirection);
  });
});