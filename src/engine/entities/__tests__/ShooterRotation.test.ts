import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Boid } from '../Boid';

// Mock PIXI
vi.mock('pixi.js', () => ({
  Graphics: vi.fn(() => ({
    clear: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    circle: vi.fn(),
    rect: vi.fn(),
    poly: vi.fn(),
    destroyed: false,
    destroy: vi.fn(),
    x: 0,
    y: 0,
    rotation: 0,
    visible: true,
    addChild: vi.fn(),
    removeChild: vi.fn()
  })),
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn()
  }))
}));

describe('Shooter Rotation', () => {
  let mockApp: any;
  
  beforeEach(() => {
    // Create a proper mock app with stage
    const mockStage = {
      addChild: vi.fn(),
      removeChild: vi.fn()
    };
    
    mockApp = {
      stage: mockStage,
      screen: {
        width: 800,
        height: 600
      }
    };
  });
  
  describe('Rotation smoothing', () => {
    it('should rotate shooters more slowly than normal birds', () => {
      // Create a shooter
      const shooter = new Boid(mockApp, 100, 100, 1);
      shooter.isShooter = true;
      
      // Set initial rotation to 0
      shooter.sprite.rotation = 0;
      
      // Change velocity to point right (90 degrees)
      shooter.vx = 10;
      shooter.vy = 0;
      shooter.update(1);
      
      // Shooter should not rotate immediately to target
      const shooterRotation1 = shooter.sprite.rotation;
      expect(shooterRotation1).toBeLessThan(0.1); // Should be close to 0 still
      
      // Create a normal bird for comparison
      const normalBird = new Boid(mockApp, 100, 100, 1);
      normalBird.isShooter = false;
      normalBird.sprite.rotation = 0;
      normalBird.vx = 10;
      normalBird.vy = 0;
      normalBird.update(1);
      
      // Normal bird should rotate immediately
      const normalRotation = normalBird.sprite.rotation;
      expect(normalRotation).toBeCloseTo(0, 5); // Should be exactly at target
    });
    
    it('should gradually rotate shooter towards target angle', () => {
      const shooter = new Boid(mockApp, 100, 100, 1);
      shooter.isShooter = true;
      
      // Start facing right (0 radians)
      shooter.sprite.rotation = 0;
      
      // Change to face up (π/2 radians)
      shooter.vx = 0;
      shooter.vy = 10;
      
      const targetAngle = Math.atan2(10, 0); // π/2
      
      // Update multiple times
      const rotations: number[] = [];
      for (let i = 0; i < 10; i++) {
        shooter.update(1);
        rotations.push(shooter.sprite.rotation);
      }
      
      // Should gradually approach target
      for (let i = 1; i < rotations.length; i++) {
        const prevDiff = Math.abs(targetAngle - rotations[i - 1]);
        const currDiff = Math.abs(targetAngle - rotations[i]);
        expect(currDiff).toBeLessThanOrEqual(prevDiff);
      }
      
      // After many updates, should be close to target
      for (let i = 0; i < 20; i++) {
        shooter.update(1);
      }
      expect(shooter.sprite.rotation).toBeCloseTo(targetAngle, 1);
    });
    
    it('should handle angle wrapping correctly', () => {
      const shooter = new Boid(mockApp, 100, 100, 1);
      shooter.isShooter = true;
      
      // Start at almost 2π (facing right)
      shooter.sprite.rotation = Math.PI * 1.9;
      
      // Target just past 0 (slightly below right)
      shooter.vx = 10;
      shooter.vy = 1;
      
      // Should rotate forward through 0, not backward through π
      const initialRotation = shooter.sprite.rotation;
      shooter.update(1);
      const newRotation = shooter.sprite.rotation;
      
      // Check that we're moving in the right direction (forward, not backward)
      // The rotation should increase slightly (going from 1.9π towards 2π/0)
      const moved = newRotation - initialRotation;
      
      // We should move forward (positive direction) to reach the target
      expect(moved).toBeGreaterThan(0);
    });
    
    it('should use rotation speed of 0.15 for lerping', () => {
      const shooter = new Boid(mockApp, 100, 100, 1);
      shooter.isShooter = true;
      
      // Start at 0
      shooter.sprite.rotation = 0;
      
      // Target π/2
      shooter.vx = 0;
      shooter.vy = 10;
      
      shooter.update(1);
      
      // Should move 15% of the way to target
      const expectedRotation = 0 + (Math.PI / 2) * 0.15;
      expect(shooter.sprite.rotation).toBeCloseTo(expectedRotation, 2);
    });
  });
  
  describe('Normal bird rotation', () => {
    it('should rotate instantly for non-shooters', () => {
      const bird = new Boid(mockApp, 100, 100, 1);
      bird.isShooter = false;
      
      // Test multiple angle changes
      const angles = [
        { vx: 10, vy: 0 },    // 0 radians
        { vx: 0, vy: 10 },    // π/2 radians  
        { vx: -10, vy: 0 },   // π radians
        { vx: 0, vy: -10 },   // -π/2 radians
      ];
      
      for (const { vx, vy } of angles) {
        bird.vx = vx;
        bird.vy = vy;
        bird.update(1);
        
        const expectedRotation = Math.atan2(vy, vx);
        expect(bird.sprite.rotation).toBeCloseTo(expectedRotation, 5);
      }
    });
  });
});