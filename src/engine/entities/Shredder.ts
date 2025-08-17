import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { GameConfig } from '../GameConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import type { Asteroid } from './Asteroid';

const { SHREDDER, SIZES } = CentralConfig;

export type ShredderPath = 'SINE' | 'COSINE' | 'LISSAJOUS';

export function calculateShredderSpawnProbability(A: number): number {
  let P = A <= 10 ? SHREDDER.SPAWN.BASE_PROBABILITY : SHREDDER.SPAWN.BASE_PROBABILITY + A * SHREDDER.SPAWN.EXTRA_PER_ASTEROID;
  if (SHREDDER.SPAWN.MAX_PROBABILITY !== undefined) {
    P = Math.min(P, SHREDDER.SPAWN.MAX_PROBABILITY);
  }
  return P;
}

export class Shredder {
  public x: number;
  public y: number;
  public radius: number;
  public destroyed = false;
  public targetAsteroid: Asteroid | null = null; // Asteroid to hunt

  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotationSpeed: number = 4; // Much faster base rotation
  private rotationDirection: number = 1; // 1 for right, -1 for left
  private rotationCount: number = 0; // Count full rotations
  private t = 0;
  private app: PIXI.Application;
  private vx: number = 0; // Velocity for hunting
  private vy: number = 0;
  private maxSpeed: number;
  private maxForce: number = 150;

  constructor(app: PIXI.Application) {
    this.app = app;
    // Smaller shredders - limit max size
    const scale = Math.min(SHREDDER.SCALE.MIN + Math.random() * (SHREDDER.SCALE.MAX - SHREDDER.SCALE.MIN), 2.0);
    const baseTip = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    this.radius = baseTip * scale; // No extra multiplication - keep them smaller

    // Movement speed like birds
    this.maxSpeed = GameConfig.BASE_SPEED * (0.8 + Math.random() * 0.4);
    
    // Spawn from top like other ships
    this.x = Math.random() * app.screen.width;
    this.y = -this.radius;
    
    // Initial downward velocity
    this.vy = this.maxSpeed;

    this.sprite = new PIXI.Graphics();
    this.draw();
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    app.stage.addChild(this.sprite);
  }

  private draw() {
    this.sprite.clear();
    
    // Draw like our triangular spaceships but with 3 triangles in a spinning formation
    // Each triangle is like a normal ship
    const triangleSize = this.radius * 0.8;
    
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3; // 120 degrees apart
      const centerX = Math.cos(angle) * this.radius * 0.6;
      const centerY = Math.sin(angle) * this.radius * 0.6;
      
      // Draw triangular ship pointing outward from center
      const tipX = centerX + Math.cos(angle) * triangleSize;
      const tipY = centerY + Math.sin(angle) * triangleSize;
      const leftX = centerX + Math.cos(angle + 2.4) * triangleSize * 0.7;
      const leftY = centerY + Math.sin(angle + 2.4) * triangleSize * 0.7;
      const rightX = centerX + Math.cos(angle - 2.4) * triangleSize * 0.7;
      const rightY = centerY + Math.sin(angle - 2.4) * triangleSize * 0.7;
      
      // Draw filled triangle (like normal ships)
      this.sprite.poly([tipX, tipY, leftX, leftY, centerX, centerY, rightX, rightY]);
      this.sprite.fill({ color: 0xFF00FF, alpha: 1 }); // Full opacity, no transparency!
      this.sprite.stroke({ width: 2, color: 0xFFFFFF, alpha: 1 });
    }
    
    // Central connecting hub
    this.sprite.circle(0, 0, this.radius * 0.15);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 1 }); // Bright white center
    this.sprite.stroke({ width: 2, color: 0xFF00FF, alpha: 1 });
  }

  update(dt: number, asteroids?: Asteroid[]): boolean {
    this.t += dt;
    
    // Rotation pattern: 3 full rotations right, then switch to left
    const prevRotation = this.rotation;
    this.rotation += this.rotationSpeed * this.rotationDirection * dt;
    
    // Check if we completed a full rotation
    if (this.rotationDirection > 0 && this.rotation - prevRotation > Math.PI * 2) {
      this.rotationCount++;
      if (this.rotationCount >= 3) {
        this.rotationDirection = -1; // Switch to left
        this.rotationCount = 0;
      }
    } else if (this.rotationDirection < 0 && prevRotation - this.rotation > Math.PI * 2) {
      this.rotationCount++;
      if (this.rotationCount >= 3) {
        this.rotationDirection = 1; // Switch to right
        this.rotationCount = 0;
      }
    }
    
    // Hunt for asteroids if provided
    if (asteroids && asteroids.length > 0) {
      // Find the biggest asteroid we can still shred
      let bestTarget = null;
      let bestSize = 0;
      const tau = SHREDDER.TOLERANCE || 0.05;
      
      for (const asteroid of asteroids) {
        if (!asteroid || asteroid.destroyed) continue;
        // Can we shred it?
        if (asteroid.size < this.radius * (1 - tau)) {
          // Is it bigger than our current target?
          if (asteroid.size > bestSize) {
            bestSize = asteroid.size;
            bestTarget = asteroid;
          }
        }
      }
      
      this.targetAsteroid = bestTarget;
    }
    
    // Seek behavior toward target asteroid
    if (this.targetAsteroid && !this.targetAsteroid.destroyed) {
      const dx = this.targetAsteroid.x - this.x;
      const dy = this.targetAsteroid.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // Desired velocity toward target
        const desiredVx = (dx / dist) * this.maxSpeed;
        const desiredVy = (dy / dist) * this.maxSpeed;
        
        // Steering force
        const steerX = desiredVx - this.vx;
        const steerY = desiredVy - this.vy;
        
        // Apply force
        this.vx += steerX * dt;
        this.vy += steerY * dt;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
          this.vx = (this.vx / speed) * this.maxSpeed;
          this.vy = (this.vy / speed) * this.maxSpeed;
        }
      }
    } else {
      // No target - just move with some randomness
      this.vx += (Math.random() - 0.5) * this.maxForce * dt;
      this.vy += Math.random() * this.maxForce * 0.5 * dt; // Slight downward bias
      
      // Limit speed
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > this.maxSpeed) {
        this.vx = (this.vx / speed) * this.maxSpeed;
        this.vy = (this.vy / speed) * this.maxSpeed;
      }
    }
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Update sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation;

    return !this.isOffScreen(this.app.screen);
  }

  isOffScreen(screen: PIXI.Rectangle): boolean {
    const margin = this.radius * 2;
    return this.x < -margin || this.x > screen.width + margin || this.y < -margin || this.y > screen.height + margin;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    EntityDestroyer.destroyEntity({ sprite: this.sprite, app: this.app });
  }
}
