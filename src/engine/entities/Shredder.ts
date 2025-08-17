import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { GameConfig } from '../GameConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';

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

  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotationSpeed: number;
  private rotationDirection: number = 1; // 1 for left, -1 for right
  private directionChangeTime: number;
  private nextDirectionChange: number;
  private t = 0;
  private app: PIXI.Application;
  private motionType: ShredderPath;
  private amplitude: number;
  private omega: number;
  private phase: number;
  private startX: number;
  private startY: number;
  private forwardSpeed: number;

  constructor(app: PIXI.Application) {
    this.app = app;
    const scale = SHREDDER.SCALE.MIN + Math.random() * (SHREDDER.SCALE.MAX - SHREDDER.SCALE.MIN);
    const baseTip = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    this.radius = baseTip * scale * 1.5; // Bigger for ninja nunchuck

    // Fast rotation that changes direction
    this.rotationSpeed = (SHREDDER.SPIN.MIN + Math.random() * (SHREDDER.SPIN.MAX - SHREDDER.SPIN.MIN)) * 2; // Faster spinning
    this.directionChangeTime = 1 + Math.random() * 2; // Change direction every 1-3 seconds
    this.nextDirectionChange = this.directionChangeTime;

    const motionTypes: ShredderPath[] = ['SINE', 'COSINE', 'LISSAJOUS'];
    this.motionType = motionTypes[Math.floor(Math.random() * motionTypes.length)];
    this.amplitude = (SHREDDER.AMPLITUDE.MIN + Math.random() * (SHREDDER.AMPLITUDE.MAX - SHREDDER.AMPLITUDE.MIN)) * app.screen.width * 0.3;
    this.omega = 0.8 + Math.random() * 0.8; // Faster oscillation
    this.phase = Math.random() * Math.PI * 2;
    this.forwardSpeed = GameConfig.BASE_SPEED * 1.2; // Comes down like other ships

    // Spawn from top like other ships
    this.startX = Math.random() * app.screen.width;
    this.startY = -this.radius;
    this.x = this.startX;
    this.y = this.startY;

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

  update(dt: number): boolean {
    this.t += dt;
    const t = this.t;
    
    // Change rotation direction periodically
    if (t > this.nextDirectionChange) {
      this.rotationDirection *= -1; // Reverse direction
      this.nextDirectionChange += this.directionChangeTime;
    }
    
    // Move down from top with horizontal oscillation
    this.y = this.startY + this.forwardSpeed * t;
    
    if (this.motionType === 'SINE') {
      this.x = this.startX + this.amplitude * Math.sin(this.omega * t + this.phase);
    } else if (this.motionType === 'COSINE') {
      this.x = this.startX + this.amplitude * Math.cos(this.omega * t + this.phase);
    } else {
      // Lissajous for complex movement
      this.x = this.startX + this.amplitude * Math.sin(this.omega * t + this.phase);
      // Add secondary oscillation
      this.x += this.amplitude * 0.3 * Math.sin(2 * this.omega * t);
    }
    
    // Fast rotation with direction changes
    this.rotation += this.rotationSpeed * this.rotationDirection * dt;
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
