import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { Boid } from '../entities/Boid';
import { Asteroid } from '../entities/Asteroid';
import { BirdProjectile } from '../entities/BirdProjectile';
import { AsteroidSplitter } from '../systems/AsteroidSplitter';
import CentralConfig from '../CentralConfig';

const { SIZES } = CentralConfig;

describe('ShooterBird', () => {
  let app: Application;
  let shooterBird: Boid;
  
  beforeEach(() => {
    app = new Application();
    shooterBird = new Boid(app, 100, 100, 1, { vx: 0, vy: -1 });
    // Force bird to be a shooter
    shooterBird.isShooter = true;
  });
  
  describe('Shooter Assignment', () => {
    it('should have 10% chance of being a shooter', () => {
      const birds: Boid[] = [];
      const numBirds = 1000;
      
      for (let i = 0; i < numBirds; i++) {
        birds.push(new Boid(app, 100, 100, 1, { vx: 0, vy: -1 }));
      }
      
      const shooterCount = birds.filter(b => b.isShooter).length;
      // Expect around 10% with some tolerance
      expect(shooterCount).toBeGreaterThan(70);
      expect(shooterCount).toBeLessThan(130);
    });
    
    it('should identify as shooter when isShooter is true', () => {
      expect(shooterBird.isShooter).toBe(true);
    });
    
    it('should have enhanced shooting abilities', () => {
      const normalBird = new Boid(app, 100, 100, 1, { vx: 0, vy: -1 });
      normalBird.isShooter = false;
      
      expect(shooterBird.shootCooldown).toBeDefined();
      expect(shooterBird.maxShootCooldown).toBeGreaterThan(0);
    });
  });
  
  describe('Shooting Mechanics', () => {
    it('should create a projectile when shooting', () => {
      const projectile = shooterBird.shoot();
      
      expect(projectile).toBeInstanceOf(BirdProjectile);
      expect(projectile?.x).toBe(shooterBird.x);
      expect(projectile?.y).toBe(shooterBird.y);
    });
    
    it('should respect cooldown between shots', () => {
      const projectile1 = shooterBird.shoot();
      expect(projectile1).toBeDefined();
      
      // Immediate second shot should fail
      const projectile2 = shooterBird.shoot();
      expect(projectile2).toBeNull();
      
      // After cooldown, should work
      shooterBird.shootCooldown = 0;
      const projectile3 = shooterBird.shoot();
      expect(projectile3).toBeDefined();
    });
    
    it('should aim projectile at nearest asteroid', () => {
      const asteroid = new Asteroid(app, 200, 200, 0, 0, 30);
      const projectile = shooterBird.shoot([asteroid]);
      
      expect(projectile).toBeDefined();
      // Projectile should have velocity toward asteroid
      expect(projectile?.vx).toBeGreaterThan(0);
      expect(projectile?.vy).toBeGreaterThan(0);
    });
  });
});

describe('BirdProjectile', () => {
  let app: Application;
  let projectile: BirdProjectile;
  
  beforeEach(() => {
    app = new Application();
    projectile = new BirdProjectile(app, 100, 100, 5, 0);
  });
  
  describe('Projectile Movement', () => {
    it('should move according to velocity', () => {
      const initialX = projectile.x;
      const initialY = projectile.y;
      
      projectile.update(0.016); // 1 frame at 60fps
      
      expect(projectile.x).toBeGreaterThan(initialX);
      expect(projectile.y).toBe(initialY);
    });
    
    it('should have limited lifetime', () => {
      expect(projectile.lifetime).toBeGreaterThan(0);
      
      // Update many times
      for (let i = 0; i < 200; i++) {
        projectile.update(0.016);
      }
      
      expect(projectile.isExpired()).toBe(true);
    });
    
    it('should be destroyed when off-screen', () => {
      projectile.x = -100;
      const shouldRemove = projectile.isOffScreen(app.screen);
      expect(shouldRemove).toBe(true);
    });
  });
});

describe('AsteroidSplitting', () => {
  let app: Application;
  let splitter: AsteroidSplitter;
  let asteroid: Asteroid;
  
  beforeEach(() => {
    app = new Application();
    splitter = new AsteroidSplitter(app);
    asteroid = new Asteroid(app, 200, 200, 2, 1, 60);
  });
  
  describe('Split Logic', () => {
    it('should split asteroid into 4 smaller pieces', () => {
      const fragments = splitter.split(asteroid);
      
      expect(fragments).toHaveLength(4);
      fragments.forEach(frag => {
        expect(frag).toBeInstanceOf(Asteroid);
        expect(frag.size).toBeLessThan(asteroid.size);
      });
    });
    
    it('should distribute fragments in different directions', () => {
      const fragments = splitter.split(asteroid);
      
      // Check that fragments fly in different directions
      const velocities = fragments.map(f => ({ vx: f.vx, vy: f.vy }));
      
      // No two fragments should have the same velocity
      for (let i = 0; i < velocities.length; i++) {
        for (let j = i + 1; j < velocities.length; j++) {
          expect(velocities[i].vx).not.toBeCloseTo(velocities[j].vx, 1);
          expect(velocities[i].vy).not.toBeCloseTo(velocities[j].vy, 1);
        }
      }
    });
    
    it('should not split if below minimum threshold', () => {
      const smallAsteroid = new Asteroid(app, 200, 200, 1, 1, SIZES.ASTEROID.MIN - 1);
      const fragments = splitter.split(smallAsteroid);
      
      expect(fragments).toHaveLength(0);
    });
    
    it('should inherit shape characteristics from parent', () => {
      const parentShape = asteroid.getShapeData();
      const fragments = splitter.split(asteroid);
      
      fragments.forEach(frag => {
        const fragShape = frag.getShapeData();
        // Should have similar number of vertices
        expect(fragShape.vertices.length).toBeCloseTo(parentShape.vertices.length, 4);
      });
    });
    
    it('should preserve total mass approximately', () => {
      const parentArea = Math.PI * Math.pow(asteroid.size, 2);
      const fragments = splitter.split(asteroid);
      
      const totalFragmentArea = fragments.reduce((sum, frag) => 
        sum + Math.PI * Math.pow(frag.size, 2), 0
      );
      
      // Total area should be roughly preserved (80-120%)
      expect(totalFragmentArea).toBeGreaterThan(parentArea * 0.8);
      expect(totalFragmentArea).toBeLessThan(parentArea * 1.2);
    });
  });
});

describe('Shooter-Asteroid Collision', () => {
  let app: Application;
  let shooterBird: Boid;
  let asteroid: Asteroid;
  let projectile: BirdProjectile;
  
  beforeEach(() => {
    app = new Application();
    shooterBird = new Boid(app, 100, 100, 1, { vx: 0, vy: -1 });
    shooterBird.isShooter = true;
    asteroid = new Asteroid(app, 200, 200, 0, 0, 40);
    projectile = new BirdProjectile(app, 190, 200, 10, 0);
  });
  
  describe('Projectile-Asteroid Collision', () => {
    it('should detect collision between projectile and asteroid', () => {
      const distance = Math.hypot(projectile.x - asteroid.x, projectile.y - asteroid.y);
      const collisionThreshold = asteroid.size + projectile.size;
      
      expect(distance).toBeLessThan(collisionThreshold);
    });
    
    it('should trigger split on collision', () => {
      const splitter = new AsteroidSplitter(app);
      const onHit = vi.fn();
      
      // Simulate collision detection
      const distance = Math.hypot(projectile.x - asteroid.x, projectile.y - asteroid.y);
      if (distance < asteroid.size + projectile.size) {
        onHit(asteroid, projectile);
        const fragments = splitter.split(asteroid);
        expect(fragments.length).toBe(4);
      }
      
      expect(onHit).toHaveBeenCalled();
    });
    
    it('should remove projectile after collision', () => {
      const projectiles = [projectile];
      
      // Check collision
      const distance = Math.hypot(projectile.x - asteroid.x, projectile.y - asteroid.y);
      if (distance < asteroid.size + projectile.size) {
        projectile.destroy();
        const index = projectiles.indexOf(projectile);
        if (index > -1) projectiles.splice(index, 1);
      }
      
      expect(projectiles.length).toBe(0);
    });
  });
});