import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { GameConfig } from '../GameConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { hueToRGB } from '../utils/ColorUtils';
import type { Asteroid } from './Asteroid';
import type { Boid } from './Boid';

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
  private rotationSpeed: number; // Each shredder has different speed
  private rotationDirection: number; // 1 for right, -1 for left (50/50 chance)
  private rotationCount: number = 0; // Count full rotations
  private rotationsUntilSwitch: number; // Random 3-10 rotations before switching
  private t = 0;
  private app: PIXI.Application;
  private vx: number = 0; // Velocity for hunting
  private vy: number = 0;
  private maxSpeed: number;
  private maxForce: number = 150;
  private hue: number; // Hue like birds use (0-360)

  constructor(app: PIXI.Application) {
    this.app = app;
    // Smaller shredders - limit max size
    const scale = Math.min(SHREDDER.SCALE.MIN + Math.random() * (SHREDDER.SCALE.MAX - SHREDDER.SCALE.MIN), 2.0);
    const baseTip = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    this.radius = baseTip * scale; // No extra multiplication - keep them smaller
    
    // Random hue like birds - exactly the same as birds do it
    this.hue = Math.random() * 360;
    
    // Each shredder has different rotation speed (2 to 6 radians/sec)
    this.rotationSpeed = 2 + Math.random() * 4;
    
    // 50/50 chance to start rotating left or right
    this.rotationDirection = Math.random() < 0.5 ? 1 : -1;
    
    // Random rotation pattern - switch after 3-10 full rotations
    this.rotationsUntilSwitch = 3 + Math.floor(Math.random() * 8); // 3 to 10

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
    
    // Use EXACT same color logic as birds - hueToRGB function!
    const fillColor = hueToRGB(this.hue);
    const strokeColor = fillColor; // Same as birds - stroke matches fill by default
    
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
      
      // Draw filled triangle (EXACTLY like normal ships)
      this.sprite.poly([tipX, tipY, leftX, leftY, centerX, centerY, rightX, rightY]);
      this.sprite.fill({ color: fillColor, alpha: 0.9 }); // Same alpha as birds (0.9 for normal state)
      this.sprite.stroke({ width: 1.5, color: strokeColor, alpha: 1.0 }); // Same as birds - full alpha stroke
    }
    
    // Central connecting hub
    this.sprite.circle(0, 0, this.radius * 0.15);
    this.sprite.fill({ color: fillColor, alpha: 0.7 }); // Slightly transparent center
    this.sprite.stroke({ width: 1, color: strokeColor, alpha: 0.8 }); // Subtle outline
  }

  update(dt: number, asteroids?: Asteroid[], otherShredders?: Shredder[], boids?: Boid[]): boolean {
    this.t += dt;
    
    // Rotation with random switching pattern
    const prevRotation = this.rotation;
    this.rotation += this.rotationSpeed * this.rotationDirection * dt;
    
    // Check if we completed a full rotation
    const rotationDiff = Math.abs(this.rotation - prevRotation);
    if (rotationDiff > Math.PI * 2) {
      this.rotationCount++;
      
      // Switch direction after reaching target rotations
      if (this.rotationCount >= this.rotationsUntilSwitch) {
        this.rotationDirection *= -1; // Reverse direction
        this.rotationCount = 0;
        // New random target for next switch (3-10 rotations)
        this.rotationsUntilSwitch = 3 + Math.floor(Math.random() * 8);
      }
    }
    
    // Separation from other Shredders and birds
    let separationX = 0;
    let separationY = 0;
    const separationRadius = this.radius * 3; // Keep distance from others
    
    // Avoid other Shredders
    if (otherShredders) {
      for (const other of otherShredders) {
        if (other === this || other.destroyed) continue;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && dist < separationRadius) {
          // Push away from other shredder
          const force = (separationRadius - dist) / separationRadius;
          separationX += (dx / dist) * force * 100;
          separationY += (dy / dist) * force * 100;
        }
      }
    }
    
    // Avoid birds/spaceships
    if (boids) {
      for (const boid of boids) {
        if (!boid || !boid.alive) continue;
        const dx = this.x - boid.x;
        const dy = this.y - boid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && dist < separationRadius) {
          // Push away from bird
          const force = (separationRadius - dist) / separationRadius;
          separationX += (dx / dist) * force * 80;
          separationY += (dy / dist) * force * 80;
        }
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
    
    // Combine forces: separation + target seeking
    let targetForceX = 0;
    let targetForceY = 0;
    
    // Seek behavior toward target asteroid
    if (this.targetAsteroid && !this.targetAsteroid.destroyed) {
      const dx = this.targetAsteroid.x - this.x;
      const dy = this.targetAsteroid.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 0) {
        // Desired velocity toward target
        targetForceX = (dx / dist) * this.maxSpeed * 50;
        targetForceY = (dy / dist) * this.maxSpeed * 50;
      }
    } else {
      // No target - wander with variation
      // Add sinusoidal wandering to create path variation
      const wanderAngle = this.t * 2 + this.hue * 0.01; // Use hue for variation
      targetForceX = Math.sin(wanderAngle) * this.maxForce * 0.3;
      targetForceY = Math.cos(wanderAngle * 0.7) * this.maxForce * 0.3 + this.maxForce * 0.2; // Slight downward
    }
    
    // Apply combined forces
    this.vx += (separationX + targetForceX) * dt;
    this.vy += (separationY + targetForceY) * dt;
    
    // Limit speed
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
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
