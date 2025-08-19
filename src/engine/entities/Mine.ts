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
    
    // HYPER FAST PULSATING - 3X FASTER!
    const fastPulse = Math.sin(this.pulseTime * 3.6) * 0.7 + 0.3; // 3x faster
    const mediumPulse = Math.sin(this.pulseTime * 2.4) * 0.5 + 0.5; // 3x faster
    const slowPulse = Math.sin(this.pulseTime * 1.2) * 0.4 + 0.6;  // 3x faster
    const ultraFastPulse = Math.sin(this.pulseTime * 6.0) * 0.5 + 0.5; // 3x faster
    const hyperPulse = Math.sin(this.pulseTime * 9.0) * 0.5 + 0.5; // 3x faster
    const flash = 0.5 + Math.sin(this.pulseTime * 4.5) * 0.5; // 3x faster
    
    // NEON SHIMMERING COLORS - Each mine has its own unique hue!
    // Shimmer between the mine's base hue and complementary colors
    const shimmerSpeed = 0.8; // Speed of color shifting
    const currentHue = (this.hue + this.pulseTime * shimmerSpeed * 360) % 360;
    
    // Create beautiful neon variations
    const baseColor = hueToRGB(currentHue);
    const complementColor = hueToRGB((currentHue + 180) % 360); // Opposite color
    const triadColor1 = hueToRGB((currentHue + 120) % 360); // Triad harmony
    const triadColor2 = hueToRGB((currentHue + 240) % 360); // Triad harmony
    
    // Oscillate between colors for shimmering effect
    const colorPhase = (this.pulseTime * 0.6) % (Math.PI * 2);
    let color: number;
    if (colorPhase < Math.PI / 2) {
      color = baseColor; // Base neon color
    } else if (colorPhase < Math.PI) {
      color = complementColor; // Complementary neon
    } else if (colorPhase < Math.PI * 1.5) {
      color = triadColor1; // First triad neon
    } else {
      color = triadColor2; // Second triad neon
    }
    
    // Draw TINY fast pulsating glow rings with NEON COLORS
    const glowRadius1 = this.radius * (2 + fastPulse); // Smaller glow
    this.sprite.circle(0, 0, glowRadius1);
    this.sprite.fill({ color, alpha: 0.3 * flash });
    
    const glowRadius2 = this.radius * (1.5 + hyperPulse * 0.5); // Smaller glow
    this.sprite.circle(0, 0, glowRadius2);
    this.sprite.fill({ color: complementColor, alpha: 0.2 * ultraFastPulse });
    
    // Draw TINY HEAVILY pulsating diamond shape - CONSTANTLY CHANGING SIZE
    const size = this.radius * (0.6 + fastPulse * 0.6); // Smaller base size with variation
    
    // Outer diamond with continuous pulsing
    this.sprite.poly([
      0, -size * (1.2 + ultraFastPulse * 0.3),  // Top pulsates
      size * (0.9 + mediumPulse * 0.2), 0,      // Right pulsates
      0, size * (1.2 + ultraFastPulse * 0.3),   // Bottom pulsates
      -size * (0.9 + mediumPulse * 0.2), 0      // Left pulsates
    ]);
    this.sprite.fill({ color, alpha: 0.7 + flash * 0.3 });
    this.sprite.stroke({ color: triadColor2, width: 2 + fastPulse, alpha: flash });
    
    // Middle diamond layer - ALSO PULSATING
    const midSize = size * (0.7 + ultraFastPulse * 0.2);
    this.sprite.poly([
      0, -midSize * (1 + fastPulse * 0.2),
      midSize * 0.7, 0,
      0, midSize * (1 + fastPulse * 0.2),
      -midSize * 0.7, 0
    ]);
    this.sprite.fill({ color: triadColor1, alpha: 0.5 + slowPulse * 0.3 });
    
    // Inner diamond core - INTENSE PULSATING
    const innerSize = size * (0.3 + ultraFastPulse * 0.3);
    this.sprite.poly([
      0, -innerSize,
      innerSize * 0.7, 0,
      0, innerSize,
      -innerSize * 0.7, 0
    ]);
    this.sprite.fill({ color: baseColor, alpha: 0.7 + flash * 0.3 });
    
    // Energy beams shooting out - SHORTER AND FASTER PULSATING
    const beamLength = size * (1.0 + fastPulse * 0.5); // Shorter beams
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.pulseTime * 0.3; // Faster rotation
      const individualPulse = Math.sin(this.pulseTime * 1.5 + i) * 0.5 + 0.5; // 3x faster individual pulse
      const thisBeamLength = beamLength * (0.5 + individualPulse * 0.5); // Shorter beams
      this.sprite.moveTo(0, 0);
      this.sprite.lineTo(
        Math.cos(angle) * thisBeamLength,
        Math.sin(angle) * thisBeamLength
      );
    }
    this.sprite.stroke({ color: complementColor, width: 1 + ultraFastPulse, alpha: 0.4 + flash * 0.3 });
    
    // Position sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    
    // Rotate the diamond MUCH faster for hyper energy
    this.sprite.rotation = this.pulseTime * 0.6; // 3x faster rotation
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