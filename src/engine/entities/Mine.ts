import * as PIXI from 'pixi.js';
import { Asteroid } from './Asteroid';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { clearGraphics } from '../utils/SpriteFactory';
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
    
    // DRAMATIC flashing and pulsing!
    const fastPulse = Math.sin(this.pulseTime * 0.3) * 0.5 + 0.5; // Fast pulse
    const slowPulse = Math.sin(this.pulseTime * 0.1) * 0.3 + 0.7;  // Slow pulse
    const flash = Math.sin(this.pulseTime * 0.5) > 0.5 ? 1 : 0.3; // Sharp flashing
    
    // Rotating colors - purple to cyan to white
    const colorPhase = (this.pulseTime * 0.2) % (Math.PI * 2);
    let color: number;
    if (colorPhase < Math.PI / 2) {
      color = 0xFF00FF; // Purple
    } else if (colorPhase < Math.PI) {
      color = 0x00FFFF; // Cyan
    } else if (colorPhase < Math.PI * 1.5) {
      color = 0xFFFF00; // Yellow
    } else {
      color = 0xFFFFFF; // White
    }
    
    // Draw flashing outer glow ring
    const glowRadius = this.radius * (2 + fastPulse);
    this.sprite.circle(0, 0, glowRadius);
    this.sprite.fill({ color, alpha: 0.2 * flash });
    
    // Draw pulsating diamond shape - BIGGER and more dramatic
    const size = this.radius * (1 + fastPulse * 0.5);
    
    // Outer diamond with flash effect
    this.sprite.poly([
      0, -size * 1.2,        // Top
      size * 0.9, 0,         // Right
      0, size * 1.2,         // Bottom
      -size * 0.9, 0         // Left
    ]);
    this.sprite.fill({ color, alpha: 0.8 * flash });
    this.sprite.stroke({ color: 0xFFFFFF, width: 2, alpha: flash });
    
    // Middle diamond layer - contrasting color
    const midSize = size * 0.7;
    this.sprite.poly([
      0, -midSize,
      midSize * 0.7, 0,
      0, midSize,
      -midSize * 0.7, 0
    ]);
    this.sprite.fill({ color: color === 0xFF00FF ? 0x00FFFF : 0xFF00FF, alpha: 0.6 * slowPulse });
    
    // Inner diamond core - bright white flash
    const innerSize = size * 0.4;
    this.sprite.poly([
      0, -innerSize,
      innerSize * 0.7, 0,
      0, innerSize,
      -innerSize * 0.7, 0
    ]);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 0.9 * flash });
    
    // Energy beams shooting out (like a star)
    const beamLength = size * 2 * fastPulse;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      this.sprite.moveTo(0, 0);
      this.sprite.lineTo(
        Math.cos(angle) * beamLength,
        Math.sin(angle) * beamLength
      );
    }
    this.sprite.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 * flash });
    
    // Position sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    
    // Rotate the diamond faster for more energy
    this.sprite.rotation = this.pulseTime * 0.2;
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