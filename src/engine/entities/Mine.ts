import * as PIXI from 'pixi.js';
import { Asteroid } from './Asteroid';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { clearGraphics } from '../utils/SpriteFactory';
import { hueToRGB } from '../utils/ColorUtils';
import CentralConfig from '../CentralConfig';

const { SIZES } = CentralConfig;

export class Mine {
  public x: number;
  public y: number;
  public radius: number;
  public active = true;
  public hue: number;
  private sprite: PIXI.Graphics;
  private app: PIXI.Application;
  private pulseTime = 0;
  
  constructor(app: PIXI.Application, x: number, y: number) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.radius = SIZES.MINE_RADIUS || 8; // Tiny and cool!
    this.hue = Math.random() * 360; // Random color for variety
    
    // Create sprite
    this.sprite = new PIXI.Graphics();
    this.draw();
    app.stage.addChild(this.sprite);
  }
  
  private draw(): void {
    clearGraphics(this.sprite);
    
    // Pulsing effect - more dramatic pulsing for diamonds
    const pulse = Math.sin(this.pulseTime * 0.15) * 0.4 + 0.8;
    const glow = Math.sin(this.pulseTime * 0.2) * 0.3 + 0.7;
    
    // Rotating diamond colors - purple to cyan
    const colorShift = Math.sin(this.pulseTime * 0.1) * 30;
    const diamondHue = 280 + colorShift; // Purple-ish to cyan-ish
    const color = hueToRGB(diamondHue);
    
    // Draw tiny pulsating diamond shape
    const size = this.radius * pulse;
    
    // Diamond shape (4 points)
    this.sprite.poly([
      0, -size,        // Top
      size * 0.7, 0,   // Right
      0, size,         // Bottom
      -size * 0.7, 0   // Left
    ]);
    this.sprite.fill({ color, alpha: 0.9 });
    this.sprite.stroke({ color: 0xFFFFFF, width: 1, alpha: glow });
    
    // Inner diamond for depth effect
    const innerSize = size * 0.5;
    this.sprite.poly([
      0, -innerSize,
      innerSize * 0.7, 0,
      0, innerSize,
      -innerSize * 0.7, 0
    ]);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 0.3 * glow });
    
    // Sparkle effect - tiny cross in center
    const sparkleSize = size * 0.2;
    this.sprite.moveTo(-sparkleSize, 0);
    this.sprite.lineTo(sparkleSize, 0);
    this.sprite.moveTo(0, -sparkleSize);
    this.sprite.lineTo(0, sparkleSize);
    this.sprite.stroke({ color: 0xFFFFFF, width: 2, alpha: glow });
    
    // Position sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    
    // Rotate the diamond slowly
    this.sprite.rotation = this.pulseTime * 0.05;
  }
  
  update(dt: number): void {
    if (!this.active) return;
    
    this.pulseTime += dt;
    this.draw();
  }
  
  checkCollision(asteroid: Asteroid): boolean {
    if (!this.active) return false;
    
    const dx = asteroid.x - this.x;
    const dy = asteroid.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Use asteroid size (not radius property)
    return distance < this.radius + asteroid.size;
  }
  
  explode(): void {
    this.active = false;
    // Explosion handled by particle system in engine
  }
  
  destroy(): void {
    EntityDestroyer.destroyEntity(
      {
        sprite: this.sprite,
        app: this.app
      },
      {
        markAsDestroyed: true
      }
    );
  }
}