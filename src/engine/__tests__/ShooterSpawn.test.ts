import { describe, it, expect, beforeEach } from 'vitest';
import { Application } from 'pixi.js';
import { Boid } from '../entities/Boid';

describe('SHOOTER SPAWN ROOT CAUSE ANALYSIS', () => {
  let app: Application;
  
  beforeEach(() => {
    app = new Application();
    // Mock screen property for tests
    (app as any).screen = { width: 800, height: 600 };
  });
  
  describe('7-WHY ANALYSIS: Shooters Not Spawning', () => {
    it('WHY 1: Is isShooter property being set?', () => {
      const shooterCount = { count: 0 };
      const superCount = { count: 0 };
      const bothCount = { count: 0 };
      
      // Test 1000 birds
      for (let i = 0; i < 1000; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter) shooterCount.count++;
        if (boid.isSuperNavigator) superCount.count++;
        if (boid.isShooter && boid.isSuperNavigator) bothCount.count++;
      }
      
      console.log(`SHOOTER SPAWN RATE: ${shooterCount.count}/1000 = ${shooterCount.count/10}%`);
      console.log(`SUPER NAV SPAWN RATE: ${superCount.count}/1000 = ${superCount.count/10}%`);
      console.log(`BOTH SPAWN RATE: ${bothCount.count}/1000 = ${bothCount.count/10}%`);
      
      // Should be around 10% (tolerance 7-13%)
      expect(shooterCount.count).toBeGreaterThan(70);
      expect(shooterCount.count).toBeLessThan(130);
      
      expect(superCount.count).toBeGreaterThan(70);
      expect(superCount.count).toBeLessThan(130);
      
      // Both should be around 1% (0.1 * 0.1)
      expect(bothCount.count).toBeGreaterThan(5);
      expect(bothCount.count).toBeLessThan(20);
    });
    
    it('WHY 2: Is Math.random() working correctly?', () => {
      const randoms = [];
      for (let i = 0; i < 100; i++) {
        randoms.push(Math.random());
      }
      
      const below01 = randoms.filter(r => r < 0.1).length;
      console.log(`RANDOM < 0.1: ${below01}/100 = ${below01}%`);
      
      expect(below01).toBeGreaterThan(5);
      expect(below01).toBeLessThan(15);
    });
    
    it('WHY 3: Is shooter property persisting after creation?', () => {
      const boid = new Boid(app, 100, 100, 1);
      // Force it to be a shooter for testing
      boid.isShooter = true;
      
      expect(boid.isShooter).toBe(true);
      
      // Check after update
      boid.update(0.016);
      expect(boid.isShooter).toBe(true);
    });
    
    it('WHY 4: Are shooter abilities being applied?', () => {
      let shooterBoid: Boid | null = null;
      let normalBoid: Boid | null = null;
      
      // Create birds until we get a shooter and non-shooter
      for (let i = 0; i < 100; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter && !shooterBoid) {
          shooterBoid = boid;
        }
        if (!boid.isShooter && !normalBoid) {
          normalBoid = boid;
        }
        if (shooterBoid && normalBoid) break;
      }
      
      expect(shooterBoid).toBeDefined();
      expect(normalBoid).toBeDefined();
      
      if (shooterBoid && normalBoid) {
        // Shooters should have different properties
        expect(shooterBoid.maxShootCooldown).toBeDefined();
        expect(shooterBoid.shootCooldown).toBeDefined();
        expect(shooterBoid.canShoot).toBeDefined();
        
        // Check speed modifier (shooters are 0.9x speed)
        const shooterSpeed = shooterBoid.personalityWeights.speedModifier;
        console.log(`SHOOTER SPEED MODIFIER: ${shooterSpeed}`);
      }
    });
    
    it('WHY 5: Can shooters actually shoot?', () => {
      const boid = new Boid(app, 100, 100, 1);
      boid.isShooter = true;
      boid.shootCooldown = 0; // Ready to shoot
      
      expect(boid.canShoot()).toBe(true);
      
      const projectile = boid.shoot();
      expect(projectile).toBeDefined();
      
      // After shooting, should be on cooldown
      expect(boid.canShoot()).toBe(false);
      expect(boid.shootCooldown).toBeGreaterThan(0);
    });
    
    it('WHY 6: Is the shooting check in game loop working?', () => {
      // This would need to check NeonFlockEngine
      // but we can test the condition logic
      const boid = new Boid(app, 100, 100, 1);
      boid.isShooter = true;
      boid.shootCooldown = 0;
      
      const asteroids = [{ x: 200, y: 200 }]; // Mock asteroid
      
      // The condition in NeonFlockEngine is:
      // if (boid.isShooter && boid.canShoot() && this.asteroids.length > 0)
      
      const shouldShoot = boid.isShooter && boid.canShoot() && asteroids.length > 0;
      expect(shouldShoot).toBe(true);
    });
    
    it('WHY 7: Is the visual effect preventing us from seeing shooters?', () => {
      const boid = new Boid(app, 100, 100, 1);
      boid.isShooter = true;
      
      // Check if shooter is properly initialized
      // We can't access sprite directly as it's protected
      
      // The draw() method should be setting stroke color
      // For shooters it should be 0xFF0000 (red)
      // We can't easily test PIXI rendering, but we can check the property exists
      expect(boid.isShooter).toBe(true);
    });
  });
  
  describe('STATISTICS: Expected spawn rates', () => {
    it('should match probability theory', () => {
      const trials = 10000;
      let shooterOnly = 0;
      let superOnly = 0;
      let both = 0;
      let neither = 0;
      
      for (let i = 0; i < trials; i++) {
        const boid = new Boid(app, 100, 100, 1);
        if (boid.isShooter && boid.isSuperNavigator) {
          both++;
        } else if (boid.isShooter) {
          shooterOnly++;
        } else if (boid.isSuperNavigator) {
          superOnly++;
        } else {
          neither++;
        }
      }
      
      console.log('=== SPAWN STATISTICS (10000 birds) ===');
      console.log(`Neither: ${neither} (${(neither/trials*100).toFixed(1)}%) - Expected: 81%`);
      console.log(`Shooter only: ${shooterOnly} (${(shooterOnly/trials*100).toFixed(1)}%) - Expected: 9%`);
      console.log(`Super only: ${superOnly} (${(superOnly/trials*100).toFixed(1)}%) - Expected: 9%`);
      console.log(`Both: ${both} (${(both/trials*100).toFixed(1)}%) - Expected: 1%`);
      
      // Check expectations (with tolerance)
      expect(neither/trials).toBeCloseTo(0.81, 1);
      expect(shooterOnly/trials).toBeCloseTo(0.09, 1);
      expect(superOnly/trials).toBeCloseTo(0.09, 1);
      expect(both/trials).toBeCloseTo(0.01, 1);
    });
  });
});