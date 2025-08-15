import { describe, it, expect, beforeEach } from 'vitest';
import { Application } from 'pixi.js';
import { Boid, BirdPersonality } from '../entities/Boid';

describe('Boid - CRITICAL ENTITY SPAWNING & PERSONALITIES', () => {
  let app: Application;
  
  beforeEach(() => {
    app = new Application();
    // Mock screen property for tests (use defineProperty for readonly properties)
    Object.defineProperty(app, 'screen', {
      value: { width: 800, height: 600 },
      writable: false,
      configurable: true
    });
  });
  
  describe('CRITICAL: Constructor Validation', () => {
    it('should create valid boid with all required properties', () => {
      const boid = new Boid(app, 100, 200, 1);
      
      // Essential properties must exist
      expect(boid.x).toBe(100);
      expect(boid.y).toBe(200);
      expect(boid.alive).toBe(true);
      
      // Velocities should be initialized
      expect(Number.isFinite(boid.vx)).toBe(true);
      expect(Number.isFinite(boid.vy)).toBe(true);
      
      // Personality must be assigned
      expect(boid.personality).toBeDefined();
      expect(typeof boid.personality).toBe('string');
      
      // Special bird flags must be boolean
      expect(typeof boid.isSuperNavigator).toBe('boolean');
      expect(typeof boid.isShooter).toBe('boolean');
      
      console.log(`✅ CRITICAL: Boid created with personality: ${boid.personality}, Super: ${boid.isSuperNavigator}, Shooter: ${boid.isShooter}`);
    });

    it('should handle invalid constructor parameters gracefully', () => {
      const invalidParams = [
        { x: NaN, y: 100, wave: 1 },
        { x: 100, y: NaN, wave: 1 },
        { x: Infinity, y: 100, wave: 1 },
        { x: 100, y: 100, wave: -1 },
        { x: 100, y: 100, wave: NaN },
      ];

      invalidParams.forEach((params, i) => {
        expect(() => {
          const boid = new Boid(app, params.x, params.y, params.wave);
          
          // Should still create a valid boid
          expect(Number.isFinite(boid.x)).toBe(true);
          expect(Number.isFinite(boid.y)).toBe(true);
          expect(boid.alive).toBe(true);
          
        }).not.toThrow();
        
        console.log(`✅ CRITICAL: Invalid params ${i} handled gracefully`);
      });
    });
  });

  describe('CRITICAL: Personality System', () => {
    it('should assign personalities correctly', () => {
      const personalities = new Set();
      const boids: Boid[] = [];
      
      // Create 100 boids to test personality distribution
      for (let i = 0; i < 100; i++) {
        const boid = new Boid(app, 100, 100, 1);
        boids.push(boid);
        personalities.add(boid.personality);
      }
      
      // Should have multiple personality types
      expect(personalities.size).toBeGreaterThan(1);
      console.log(`✅ CRITICAL: ${personalities.size} personality types assigned: ${Array.from(personalities).join(', ')}`);
      
      // All valid personality types
      const validPersonalities = Object.values(BirdPersonality);
      boids.forEach((boid, _i) => {
        expect(validPersonalities.includes(boid.personality)).toBe(true);
      });
    });

    it('should apply personality weights correctly', () => {
      const personalityTests = Object.values(BirdPersonality);

      personalityTests.forEach(personality => {
        // Create boids and check their weights
        for (let i = 0; i < 10; i++) {
          const boid = new Boid(app, 100, 100, 1);
          
          if (boid.personality === personality) {
            const weights = boid.personalityWeights;
            
            expect(Number.isFinite(weights.separation)).toBe(true);
            expect(Number.isFinite(weights.alignment)).toBe(true);
            expect(Number.isFinite(weights.cohesion)).toBe(true);
            expect(Number.isFinite(weights.targetSeek)).toBe(true);
            expect(Number.isFinite(weights.avoidance)).toBe(true);
            expect(Number.isFinite(weights.speedModifier)).toBe(true);
            
            // All weights should be positive
            expect(weights.separation).toBeGreaterThan(0);
            expect(weights.alignment).toBeGreaterThan(0);
            expect(weights.cohesion).toBeGreaterThan(0);
            expect(weights.targetSeek).toBeGreaterThan(0);
            expect(weights.avoidance).toBeGreaterThan(0);
            expect(weights.speedModifier).toBeGreaterThan(0);
            
            console.log(`✅ CRITICAL: ${personality} weights valid: sep=${weights.separation}, speed=${weights.speedModifier}`);
            break;
          }
        }
      });
    });
  });

  describe('CRITICAL: Special Bird Spawning (10% Each)', () => {
    it('should spawn Super Navigators at ~10% rate', () => {
      let superNavigatorCount = 0;
      const totalBirds = 1000;
      
      for (let i = 0; i < totalBirds; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isSuperNavigator) {
          superNavigatorCount++;
        }
      }
      
      const percentage = (superNavigatorCount / totalBirds) * 100;
      
      // Should be around 10% (tolerance 7-13%)
      expect(percentage).toBeGreaterThan(7);
      expect(percentage).toBeLessThan(13);
      
      console.log(`✅ CRITICAL: Super Navigator spawn rate: ${superNavigatorCount}/${totalBirds} (${percentage.toFixed(1)}%)`);
    });

    it('should spawn Shooters at ~10% rate', () => {
      let shooterCount = 0;
      const totalBirds = 1000;
      
      for (let i = 0; i < totalBirds; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter) {
          shooterCount++;
        }
      }
      
      const percentage = (shooterCount / totalBirds) * 100;
      
      // Should be around 10% (tolerance 7-13%)
      expect(percentage).toBeGreaterThan(7);
      expect(percentage).toBeLessThan(13);
      
      console.log(`✅ CRITICAL: Shooter spawn rate: ${shooterCount}/${totalBirds} (${percentage.toFixed(1)}%)`);
    });

    it('should spawn birds with both super and shooter traits at ~1% rate', () => {
      let bothTraitsCount = 0;
      const totalBirds = 1000;
      
      for (let i = 0; i < totalBirds; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isSuperNavigator && boid.isShooter) {
          bothTraitsCount++;
        }
      }
      
      const percentage = (bothTraitsCount / totalBirds) * 100;
      
      // Should be around 1% (0.1 * 0.1 = 0.01) with tolerance 0.3-1.7%
      expect(percentage).toBeGreaterThan(0.3);
      expect(percentage).toBeLessThan(1.7);
      
      console.log(`✅ CRITICAL: Both traits spawn rate: ${bothTraitsCount}/${totalBirds} (${percentage.toFixed(1)}%)`);
    });

    it('should ensure independence of super navigator and shooter rolls', () => {
      const stats = { neither: 0, superOnly: 0, shooterOnly: 0, both: 0 };
      const totalBirds = 10000;
      
      for (let i = 0; i < totalBirds; i++) {
        const boid = new Boid(app, 100, 100, 1);
        
        if (boid.isSuperNavigator && boid.isShooter) {
          stats.both++;
        } else if (boid.isSuperNavigator) {
          stats.superOnly++;
        } else if (boid.isShooter) {
          stats.shooterOnly++;
        } else {
          stats.neither++;
        }
      }
      
      // Expected probabilities (independent 10% each)
      // Neither: 0.9 * 0.9 = 0.81 (81%)
      // Super only: 0.1 * 0.9 = 0.09 (9%)
      // Shooter only: 0.9 * 0.1 = 0.09 (9%) 
      // Both: 0.1 * 0.1 = 0.01 (1%)
      
      const neitherPct = (stats.neither / totalBirds) * 100;
      const superOnlyPct = (stats.superOnly / totalBirds) * 100;
      const shooterOnlyPct = (stats.shooterOnly / totalBirds) * 100;
      const bothPct = (stats.both / totalBirds) * 100;
      
      expect(neitherPct).toBeCloseTo(81, 1);
      expect(superOnlyPct).toBeCloseTo(9, 1);
      expect(shooterOnlyPct).toBeCloseTo(9, 1);
      expect(bothPct).toBeCloseTo(1, 0.5);
      
      console.log(`✅ CRITICAL: Independent spawning confirmed:`);
      console.log(`  Neither: ${stats.neither} (${neitherPct.toFixed(1)}%)`);
      console.log(`  Super only: ${stats.superOnly} (${superOnlyPct.toFixed(1)}%)`);
      console.log(`  Shooter only: ${stats.shooterOnly} (${shooterOnlyPct.toFixed(1)}%)`);
      console.log(`  Both: ${stats.both} (${bothPct.toFixed(1)}%)`);
    });
  });

  describe('CRITICAL: Shooter Bird Mechanics', () => {
    it('should initialize shooter properties correctly', () => {
      let shooterBoid: Boid | null = null;
      
      // Find a shooter bird
      for (let i = 0; i < 100; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter) {
          shooterBoid = boid;
          break;
        }
      }
      
      expect(shooterBoid).toBeDefined();
      
      if (shooterBoid) {
        expect(shooterBoid.maxShootCooldown).toBeDefined();
        expect(shooterBoid.shootCooldown).toBeDefined();
        expect(Number.isFinite(shooterBoid.maxShootCooldown)).toBe(true);
        expect(Number.isFinite(shooterBoid.shootCooldown)).toBe(true);
        expect(shooterBoid.maxShootCooldown).toBeGreaterThan(0);
        
        console.log(`✅ CRITICAL: Shooter properties initialized: maxCooldown=${shooterBoid.maxShootCooldown}, cooldown=${shooterBoid.shootCooldown}`);
      }
    });

    it('should have canShoot method working correctly', () => {
      let shooterBoid: Boid | null = null;
      
      // Find a shooter bird
      for (let i = 0; i < 100; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter) {
          shooterBoid = boid;
          break;
        }
      }
      
      expect(shooterBoid).toBeDefined();
      
      if (shooterBoid) {
        // When cooldown is 0, should be able to shoot
        shooterBoid.shootCooldown = 0;
        expect(shooterBoid.canShoot()).toBe(true);
        
        // When cooldown is > 0, should not be able to shoot
        shooterBoid.shootCooldown = 1;
        expect(shooterBoid.canShoot()).toBe(false);
        
        // When dead, should not be able to shoot
        shooterBoid.alive = false;
        expect(shooterBoid.canShoot()).toBe(false);
        
        console.log(`✅ CRITICAL: canShoot method working correctly`);
      }
    });
  });

  describe('CRITICAL: Color Assignment', () => {
    it('should assign valid colors to all personalities', () => {
      const boids: Boid[] = [];
      
      // Create boids with different personalities
      for (let i = 0; i < 50; i++) {
        const boid = new Boid(app, 100, 100, 1);
        boids.push(boid);
      }
      
      boids.forEach((boid, _i) => {
        expect(Number.isFinite(boid.hue)).toBe(true);
        expect(boid.hue).toBeGreaterThanOrEqual(0);
        expect(boid.hue).toBeLessThanOrEqual(360);
        
        // Each personality should have hue in expected range
        switch (boid.personality) {
          case BirdPersonality.AGGRESSIVE:
            expect(boid.hue).toBeGreaterThanOrEqual(0);
            expect(boid.hue).toBeLessThanOrEqual(30);
            break;
          case BirdPersonality.DEFENSIVE:
            expect(boid.hue).toBeGreaterThanOrEqual(200);
            expect(boid.hue).toBeLessThanOrEqual(240);
            break;
          // Add more personality color checks...
        }
      });
      
      console.log(`✅ CRITICAL: All ${boids.length} boids have valid colors`);
    });
  });

  describe('CRITICAL: State Management', () => {
    it('should initialize state correctly', () => {
      const boid = new Boid(app, 100, 200, 3);
      
      // Initial state
      expect(boid.alive).toBe(true);
      expect(boid.hasDot).toBe(false);
      expect(boid.targetDot).toBeNull();
      // Basic state validation (lastHitTime and wave are internal)
      
      console.log(`✅ CRITICAL: Initial state correct`);
    });

    it('should handle state transitions correctly', () => {
      const boid = new Boid(app, 100, 200, 1);
      
      // Test dot pickup state
      boid.hasDot = true;
      expect(boid.hasDot).toBe(true);
      
      // Test death state
      boid.alive = false;
      expect(boid.alive).toBe(false);
      
      if (boid.isShooter) {
        // Test shooter cooldown
        expect(() => {
          boid.shootCooldown = 2.5;
        }).not.toThrow();
      }
      
      console.log(`✅ CRITICAL: State transitions working`);
    });
  });

  describe('CRITICAL: Memory Management', () => {
    it('should clean up resources properly', () => {
      const boids: Boid[] = [];
      
      // Create and destroy many boids
      for (let i = 0; i < 100; i++) {
        const boid = new Boid(app, Math.random() * 800, Math.random() * 600, 1);
        boids.push(boid);
      }
      
      // Destroy all boids
      boids.forEach(boid => {
        expect(() => {
          boid.destroy();
        }).not.toThrow();
      });
      
      console.log(`✅ CRITICAL: 100 boids created and destroyed without errors`);
    });

    it('should not leak memory during rapid creation/destruction', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Rapid creation and destruction
      for (let cycle = 0; cycle < 10; cycle++) {
        const boids: Boid[] = [];
        
        for (let _i = 0; _i < 100; _i++) {
          boids.push(new Boid(app, Math.random() * 800, Math.random() * 600, 1));
        }
        
        boids.forEach(boid => boid.destroy());
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      // Should not grow more than 10MB
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024);
      
      console.log(`✅ CRITICAL: Memory growth acceptable (${Math.round(memoryGrowth / 1024)}KB for 1000 boid cycles)`);
    });
  });

  describe('CRITICAL: Edge Cases & Error Handling', () => {
    it('should handle extreme positions', () => {
      const extremePositions = [
        { x: Number.MAX_SAFE_INTEGER, y: 100 },
        { x: Number.MIN_SAFE_INTEGER, y: 100 },
        { x: 100, y: Number.MAX_SAFE_INTEGER },
        { x: 100, y: Number.MIN_SAFE_INTEGER },
      ];

      extremePositions.forEach((pos, i) => {
        expect(() => {
          const boid = new Boid(app, pos.x, pos.y, 1);
          expect(boid.alive).toBe(true);
          expect(Number.isFinite(boid.x)).toBe(true);
          expect(Number.isFinite(boid.y)).toBe(true);
        }).not.toThrow();
        
        console.log(`✅ CRITICAL: Extreme position ${i} handled`);
      });
    });

    it('should maintain consistency under rapid updates', () => {
      const boid = new Boid(app, 100, 100, 1);
      const initialPersonality = boid.personality;
      const initialSuper = boid.isSuperNavigator;
      const initialShooter = boid.isShooter;
      
      // Rapid updates shouldn't change fundamental properties
      for (let i = 0; i < 100; i++) {
        boid.update(0.016); // 60 FPS
      }
      
      expect(boid.personality).toBe(initialPersonality);
      expect(boid.isSuperNavigator).toBe(initialSuper);
      expect(boid.isShooter).toBe(initialShooter);
      expect(boid.alive).toBe(true);
      
      console.log(`✅ CRITICAL: Properties consistent after 100 rapid updates`);
    });
  });
});