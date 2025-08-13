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
    
    // Create 3 lines at 120 degree angles
    // Lines should be same size as bird triangle (BOID_SIZE)
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 * Math.PI / 180) + Math.atan2(vy, vx);
      const baseSpeed = 150; // Much smaller than before
      
      // Create particles for a short line (max length = BOID_SIZE * 1.2)
      for (let j = 0; j < 5; j++) { // Fewer particles for shorter lines
        const lineSpeed = baseSpeed * (0.6 + j * 0.1);
        this.addLineParticle(
          x,
          y,
          Math.cos(angle) * lineSpeed + vx * 0.3,
          Math.sin(angle) * lineSpeed + vy * 0.3,
          color,
          0.8 // Faster fade for smaller effect
        );
      }
    }
  }
  
  private addLineParticle(x: number, y: number, vx: number, vy: number, color: number, fadeSpeed: number) {
    if (this.particles.length >= GameConfig.MAX_PARTICLES) {
      const oldest = this.particles.shift();
      if (oldest) {
        this.container.removeChild(oldest.sprite);
        oldest.sprite.destroy();
      }
    }
    
    const sprite = new PIXI.Graphics();
    // Draw as a line segment
    sprite.moveTo(-3, 0);
    sprite.lineTo(3, 0);
    sprite.stroke({ width: 2, color, alpha: 1 });
    sprite.rotation = Math.atan2(vy, vx);
    
    this.container.addChild(sprite);
    
    this.particles.push({
      x,
      y,
      vx,
      vy,
      life: GameConfig.PARTICLE_LIFETIME * fadeSpeed,
      maxLife: GameConfig.PARTICLE_LIFETIME * fadeSpeed,
      color,
      sprite
    });
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