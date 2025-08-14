import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';

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
    const safeCount = Math.min(count, 20);
    for (let i = 0; i < safeCount; i++) {
      const angle = (i / safeCount) * Math.PI * 2;
      const speed = 200 + Math.random() * 100;
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
    const color = Math.floor(
      (Math.cos(hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
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
    const color = Math.floor(
      (Math.cos(hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
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
    if (this.particles.length >= GameConfig.MAX_PARTICLES) {
      // Remove oldest particle
      const oldest = this.particles.shift();
      if (oldest) {
        this.container.removeChild(oldest.sprite);
        oldest.sprite.destroy();
      }
    }
    
    const sprite = new PIXI.Graphics();
    sprite.circle(0, 0, 2);
    sprite.fill({ color, alpha: 1 });
    
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
  
  createComboText(x: number, y: number, text: string, multiplier: number) {
    const comboText = new PIXI.Text({
      text,
      style: {
        fontFamily: 'Space Mono',
        fontSize: 32 + multiplier * 4,
        fill: [0xFFFF00, 0xFF00FF],
        stroke: { color: 0xFFFFFF, width: 2 },
        dropShadow: {
          color: 0x000000,
          blur: 4,
          angle: Math.PI / 4,
          distance: 3
        }
      }
    });
    
    comboText.anchor.set(0.5);
    comboText.x = x;
    comboText.y = y;
    
    this.app.stage.addChild(comboText);
    this.comboTexts.push({ text: comboText, life: 1.5, vy: -50 });
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
    
    // Update combo texts
    for (let i = this.comboTexts.length - 1; i >= 0; i--) {
      const combo = this.comboTexts[i];
      combo.life -= dt;
      combo.text.y += combo.vy * dt;
      combo.text.alpha = Math.max(0, combo.life);
      combo.text.scale.set(1 + (1.5 - combo.life) * 0.2);
      
      if (combo.life <= 0) {
        this.app.stage.removeChild(combo.text);
        combo.text.destroy();
        this.comboTexts.splice(i, 1);
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