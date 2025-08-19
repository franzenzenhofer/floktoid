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
    
    // CONTINUOUS DRAMATIC PULSATING!
    const fastPulse = Math.sin(this.pulseTime * 0.4) * 0.6 + 0.4; // Bigger range pulsing
    const mediumPulse = Math.sin(this.pulseTime * 0.2) * 0.4 + 0.6; // Medium speed pulse
    const slowPulse = Math.sin(this.pulseTime * 0.1) * 0.3 + 0.7;  // Slow pulse
    const ultraFastPulse = Math.sin(this.pulseTime * 0.8) * 0.5 + 0.5; // Very fast pulse
    const flash = 0.5 + Math.sin(this.pulseTime * 0.6) * 0.5; // Smooth flashing, always visible
    
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
    
    // Draw MULTIPLE pulsating glow rings
    const glowRadius1 = this.radius * (2.5 + fastPulse);
    this.sprite.circle(0, 0, glowRadius1);
    this.sprite.fill({ color, alpha: 0.15 * flash });
    
    const glowRadius2 = this.radius * (2 + mediumPulse);
    this.sprite.circle(0, 0, glowRadius2);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 0.1 * ultraFastPulse });
    
    // Draw HEAVILY pulsating diamond shape - CONSTANTLY CHANGING SIZE
    const size = this.radius * (0.8 + fastPulse * 0.8); // Big size variation!
    
    // Outer diamond with continuous pulsing
    this.sprite.poly([
      0, -size * (1.2 + ultraFastPulse * 0.3),  // Top pulsates
      size * (0.9 + mediumPulse * 0.2), 0,      // Right pulsates
      0, size * (1.2 + ultraFastPulse * 0.3),   // Bottom pulsates
      -size * (0.9 + mediumPulse * 0.2), 0      // Left pulsates
    ]);
    this.sprite.fill({ color, alpha: 0.7 + flash * 0.3 });
    this.sprite.stroke({ color: 0xFFFFFF, width: 2 + fastPulse, alpha: flash });
    
    // Middle diamond layer - ALSO PULSATING
    const midSize = size * (0.7 + ultraFastPulse * 0.2);
    this.sprite.poly([
      0, -midSize * (1 + fastPulse * 0.2),
      midSize * 0.7, 0,
      0, midSize * (1 + fastPulse * 0.2),
      -midSize * 0.7, 0
    ]);
    this.sprite.fill({ color: color === 0xFF00FF ? 0x00FFFF : 0xFF00FF, alpha: 0.5 + slowPulse * 0.3 });
    
    // Inner diamond core - INTENSE PULSATING
    const innerSize = size * (0.3 + ultraFastPulse * 0.3);
    this.sprite.poly([
      0, -innerSize,
      innerSize * 0.7, 0,
      0, innerSize,
      -innerSize * 0.7, 0
    ]);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 0.7 + flash * 0.3 });
    
    // Energy beams shooting out - PULSATING LENGTH
    const beamLength = size * (1.5 + fastPulse * 1.5); // Beams grow and shrink dramatically
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.pulseTime * 0.1; // Slight rotation
      const individualPulse = Math.sin(this.pulseTime * 0.5 + i) * 0.5 + 0.5;
      const thisBeamLength = beamLength * (0.7 + individualPulse * 0.3);
      this.sprite.moveTo(0, 0);
      this.sprite.lineTo(
        Math.cos(angle) * thisBeamLength,
        Math.sin(angle) * thisBeamLength
      );
    }
    this.sprite.stroke({ color: 0xFFFFFF, width: 1 + ultraFastPulse, alpha: 0.4 + flash * 0.3 });
    
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