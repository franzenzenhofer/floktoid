import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';
import { EnergyDot } from './EnergyDot';

export class Boid {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public maxSpeed: number;
  public maxForce: number;
  public hue: number;
  public originalHue: number;
  public alive = true;
  public hasDot = false;
  public targetDot: EnergyDot | null = null;
  public shimmerTime = 0;
  
  private sprite: PIXI.Graphics;
  private trail: { x: number; y: number }[] = [];
  private trailGraphics: PIXI.Graphics;
  private app: PIXI.Application;

  constructor(app: PIXI.Application, x: number, y: number, speedMultiplier: number) {
    this.app = app;
    this.x = x;
    this.y = y;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = GameConfig.BASE_SPEED * (0.8 + Math.random() * 0.4);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.maxSpeed = GameConfig.BASE_SPEED * speedMultiplier;
    this.maxForce = GameConfig.BASE_FORCE;
    this.hue = Math.random() * 360;
    this.originalHue = this.hue;
    
    this.sprite = new PIXI.Graphics();
    this.trailGraphics = new PIXI.Graphics();
    app.stage.addChild(this.trailGraphics);
    app.stage.addChild(this.sprite);
    
    this.draw();
  }
  
  private draw() {
    // Use normal bird color for fill
    const fillColor = Math.floor(
      (Math.cos(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((this.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
    // If carrying dot, shimmer outline between orange and red
    let strokeColor = fillColor;
    if (this.hasDot) {
      const shimmerPhase = Math.sin(this.shimmerTime * 10) * 0.5 + 0.5;
      const shimmerHue = 30 * (1 - shimmerPhase); // 30 to 0 (orange to red)
      strokeColor = Math.floor(
        (Math.cos(shimmerHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(shimmerHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((shimmerHue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
    }
    
    this.sprite.clear();
    
    // Draw triangle with shimmer on outline only
    this.sprite.poly([
      GameConfig.BOID_SIZE * 1.2, 0,
      -GameConfig.BOID_SIZE, GameConfig.BOID_SIZE * 0.8,
      -GameConfig.BOID_SIZE, -GameConfig.BOID_SIZE * 0.8
    ]);
    this.sprite.stroke({ width: this.hasDot ? 3 : 2, color: strokeColor, alpha: 1 });
    this.sprite.fill({ color: fillColor, alpha: this.hasDot ? 0.9 : 0.7 });
    
    // Dot indicator - show stolen dot color
    if (this.hasDot && this.targetDot) {
      const dotColor = Math.floor(
        (Math.cos(this.targetDot.hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(this.targetDot.hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((this.targetDot.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
      this.sprite.circle(0, 0, 4);
      this.sprite.fill({ color: dotColor, alpha: 1 });
    }
  }
  
  public applyForces(forces: { x: number; y: number }, dt: number) {
    const ax = Math.max(-this.maxForce, Math.min(this.maxForce, forces.x));
    const ay = Math.max(-this.maxForce, Math.min(this.maxForce, forces.y));
    
    this.vx += ax * dt;
    this.vy += ay * dt;
    
    // Limit speed
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
  }
  
  public moveToTop(_dt: number) {
    this.vy = -GameConfig.BASE_SPEED * 1.5 * (this.maxSpeed / GameConfig.BASE_SPEED);
    this.vx *= 0.95;
  }
  
  public checkDotPickup(dot: EnergyDot): boolean {
    const dist = Math.hypot(dot.x - this.x, dot.y - this.y);
    return dist < 20;
  }
  
  public update(dt: number) {
    // Update shimmer animation
    if (this.hasDot) {
      this.shimmerTime += dt;
    } else {
      this.shimmerTime = 0;
    }
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Soft bounds
    const margin = 20;
    if (this.x < margin) this.vx += 100 * dt;
    if (this.x > this.app.screen.width - margin) this.vx -= 100 * dt;
    if (this.y < margin && !this.hasDot) this.vy += 100 * dt;
    if (this.y > this.app.screen.height - margin) this.vy -= 100 * dt;
    
    // Update trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 10) this.trail.shift();
    
    // Draw trail
    this.trailGraphics.clear();
    if (this.trail.length > 1) {
      // Use shimmer color for trail if carrying dot
      let trailHue = this.hue;
      if (this.hasDot) {
        const shimmerPhase = Math.sin(this.shimmerTime * 10) * 0.5 + 0.5;
        trailHue = 30 * (1 - shimmerPhase);
      }
      
      const color = Math.floor(
        (Math.cos(trailHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(trailHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((trailHue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
      
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = (i / this.trail.length) * 0.5;
        const width = (i / this.trail.length) * 2;
        this.trailGraphics.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
        this.trailGraphics.lineTo(this.trail[i].x, this.trail[i].y);
        this.trailGraphics.stroke({ width, color, alpha });
      }
    }
    
    // Update sprite position and rotation
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = Math.atan2(this.vy, this.vx);
    
    // Redraw if state changed
    this.draw();
  }
  
  public destroy() {
    // Prevent double destruction
    if (!this.alive) return;
    
    this.alive = false;
    
    // Safely remove and destroy sprites
    if (this.sprite.parent) {
      this.app.stage.removeChild(this.sprite);
    }
    if (this.trailGraphics.parent) {
      this.app.stage.removeChild(this.trailGraphics);
    }
    
    // Destroy only if not already destroyed
    if (!this.sprite.destroyed) {
      this.sprite.destroy();
    }
    if (!this.trailGraphics.destroyed) {
      this.trailGraphics.destroy();
    }
  }
}