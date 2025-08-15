import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';
import CentralConfig from '../CentralConfig';
import { hueToRGB } from '../utils/ColorUtils';

const { ENTITY_LIMITS, PHYSICS, VISUALS } = CentralConfig;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  sprite: PIXI.Graphics;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private container: PIXI.Container;
  private app: PIXI.Application;
  private comboTexts: Array<{ text: PIXI.Text; life: number; vy: number }> = [];

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    app.stage.addChild(this.container);
  }
  
  createExplosion(x: number, y: number, color: number, count: number) {
    // Limit particle count to prevent freeze
    const safeCount = Math.min(count, ENTITY_LIMITS.PARTICLES.MAX_PER_EXPLOSION / 2.5);
    for (let i = 0; i < safeCount; i++) {
      const angle = (i / safeCount) * Math.PI * 2;
      const speed = PHYSICS.SPEED.ASTEROID_BASE_SPEED * 0.67 + Math.random() * 100;
      this.addParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color
      );
    }
  }
  
  createPickup(x: number, y: number, hue: number) {
    const color = hueToRGB(hue);
    
    for (let i = 0; i < 10; i++) {
      this.addParticle(
        x,
        y,
        (Math.random() - 0.5) * 200,
        -Math.random() * 200,
        color
      );
    }
  }
  
  // Create 3 colored lines explosion when bird is hit
  createBirdExplosion(x: number, y: number, hue: number, vx: number, vy: number) {
    const color = hueToRGB(hue);
    
    // SIMPLIFIED: Just use regular particles in 3 directions
    // This avoids creating complex Graphics objects during collision
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 * Math.PI / 180) + Math.atan2(vy, vx);
      const speed = 200;
      
      // Create a burst of simple particles instead of lines
      for (let j = 0; j < 3; j++) {
        const particleSpeed = speed * (0.8 + j * 0.2);
        this.addParticle(
          x,
          y,
          Math.cos(angle) * particleSpeed + vx * 0.3,
          Math.sin(angle) * particleSpeed + vy * 0.3,
          color
        );
      }
    }
  }
  
  
  private addParticle(x: number, y: number, vx: number, vy: number, color: number) {
    if (this.particles.length >= ENTITY_LIMITS.PARTICLES.MAX_TOTAL) {
      // Remove oldest particle
      const oldest = this.particles.shift();
      if (oldest) {
        this.container.removeChild(oldest.sprite);
        oldest.sprite.destroy();
      }
    }
    
    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, VISUALS.STROKE.NORMAL);
    sprite.fill({ color, alpha: VISUALS.ALPHA.FULL });
    
    this.container.addChild(sprite);
    
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life: GameConfig.PARTICLE_LIFETIME,
      maxLife: GameConfig.PARTICLE_LIFETIME,
      color,
      sprite
    });
  }
  
  createComboText(_x: number, _y: number, _text: string, _multiplier: number) {
    // REMOVED: Duplicate yellow combo display
    // Using NeonFlockEngine's neon cyan combo display instead
    return; // Method kept for compatibility but does nothing
  }
  
  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update physics
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 200 * dt; // Gravity
      p.vx *= 0.98; // Drag
      p.life -= dt;
      
      // Update visual
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.alpha = p.life / p.maxLife;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.container.removeChild(p.sprite);
        p.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
    
    // REMOVED: Combo text update logic - using NeonFlockEngine's display
    // Clear any leftover combo texts
    while (this.comboTexts.length > 0) {
      const combo = this.comboTexts.pop();
      if (combo && combo.text && !combo.text.destroyed) {
        this.app.stage.removeChild(combo.text);
        combo.text.destroy();
      }
    }
  }
  
  destroy() {
    this.particles.forEach(p => {
      this.container.removeChild(p.sprite);
      p.sprite.destroy();
    });
    this.particles = [];
    this.app.stage.removeChild(this.container);
    this.container.destroy();
  }
}