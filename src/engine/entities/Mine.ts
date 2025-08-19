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
    
    // Pulsing effect
    const pulse = Math.sin(this.pulseTime * 0.1) * 0.3 + 0.7;
    const color = hueToRGB(this.hue);
    
    // Draw mine with spiky appearance
    this.sprite.circle(0, 0, this.radius * pulse);
    this.sprite.fill({ color, alpha: 0.8 });
    
    // Draw danger spikes
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spikeLength = this.radius * 1.5 * pulse;
      this.sprite.moveTo(0, 0);
      this.sprite.lineTo(
        Math.cos(angle) * spikeLength,
        Math.sin(angle) * spikeLength
      );
    }
    this.sprite.stroke({ color, width: 1, alpha: 0.9 });
    
    // Position sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
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