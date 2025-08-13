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

  constructor(app: PIXI.Application) {
    this.app = app;
    this.container = new PIXI.Container();
    app.stage.addChild(this.container);
  }
  
  createExplosion(x: number, y: number, color: number, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
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
    const color = PIXI.utils.rgb2hex([
      Math.cos(hue * Math.PI / 180) * 0.5 + 0.5,
      Math.sin(hue * Math.PI / 180) * 0.5 + 0.5,
      Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5
    ]);
    
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
    sprite.beginFill(color, 1);
    sprite.drawCircle(0, 0, 2);
    sprite.endFill();
    
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