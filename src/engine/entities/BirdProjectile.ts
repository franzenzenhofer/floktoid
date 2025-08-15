/**
 * BirdProjectile - Energy projectiles shot by shooter birds
 * DRY, modular, and performant implementation
 */

import * as PIXI from 'pixi.js';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { VISUALS } from '../CentralConfig';

export class BirdProjectile {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public lifetime: number;
  public maxLifetime: number;
  public destroyed = false;
  
  private sprite: PIXI.Graphics;
  private app: PIXI.Application;
  private glowSprite: PIXI.Graphics;
  private pulseTime = 0;
  
  // Projectile constants
  public static readonly BASE_SIZE = 4;
  public static readonly SPEED = 400; // pixels per second
  public static readonly MAX_LIFETIME = 2; // seconds
  
  constructor(
    app: PIXI.Application,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number = BirdProjectile.BASE_SIZE
  ) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.lifetime = 0;
    this.maxLifetime = BirdProjectile.MAX_LIFETIME;
    
    // Create sprites
    this.glowSprite = new PIXI.Graphics();
    this.sprite = new PIXI.Graphics();
    
    // Add to stage (glow behind main sprite)
    app.stage.addChild(this.glowSprite);
    app.stage.addChild(this.sprite);
    
    this.draw();
  }
  
  /**
   * Draw laser beam like original Asteroids game
   */
  private draw(): void {
    const alpha = Math.max(0, 1 - (this.lifetime / this.maxLifetime));
    
    // Calculate laser beam length based on velocity (faster = longer beam)
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const beamLength = Math.max(8, speed * 0.05); // Minimum 8px, scales with speed
    
    // Main laser beam - thin bright cyan line
    this.sprite.clear();
    this.sprite.moveTo(-beamLength / 2, 0);
    this.sprite.lineTo(beamLength / 2, 0);
    this.sprite.stroke({ width: 2, color: VISUALS.COLORS.NEON_CYAN, alpha });
    
    // Inner core - even brighter white
    this.sprite.moveTo(-beamLength / 2, 0);
    this.sprite.lineTo(beamLength / 2, 0);
    this.sprite.stroke({ width: 1, color: 0xFFFFFF, alpha: alpha * 0.9 });
    
    // Glow effect - wider, dimmer lines
    this.glowSprite.clear();
    const pulseScale = 1 + Math.sin(this.pulseTime * 15) * 0.2; // Faster pulse
    const glowLength = beamLength * pulseScale;
    
    // Multiple glow layers for intensity
    for (let i = 3; i > 0; i--) {
      const layerWidth = (2 + i * 2);
      const layerAlpha = alpha * 0.15 * (1 / i);
      this.glowSprite.moveTo(-glowLength / 2, 0);
      this.glowSprite.lineTo(glowLength / 2, 0);
      this.glowSprite.stroke({ width: layerWidth, color: VISUALS.COLORS.NEON_CYAN, alpha: layerAlpha });
    }
  }
  
  /**
   * Update projectile position and lifetime
   */
  public update(dt: number): boolean {
    if (this.destroyed) return false;
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Update lifetime
    this.lifetime += dt;
    this.pulseTime += dt;
    
    // Check if expired
    if (this.isExpired()) {
      return false;
    }
    
    // Update sprite positions and rotation to align laser beam
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = Math.atan2(this.vy, this.vx);
    
    this.glowSprite.x = this.x;
    this.glowSprite.y = this.y;
    this.glowSprite.rotation = Math.atan2(this.vy, this.vx);
    
    // Redraw with updated alpha
    this.draw();
    
    return true;
  }
  
  /**
   * Check if projectile has expired
   */
  public isExpired(): boolean {
    return this.lifetime >= this.maxLifetime;
  }
  
  /**
   * Check if projectile is off screen
   */
  public isOffScreen(screen: PIXI.Rectangle): boolean {
    const margin = 50;
    return (
      this.x < -margin ||
      this.x > screen.width + margin ||
      this.y < -margin ||
      this.y > screen.height + margin
    );
  }
  
  /**
   * Create projectile aimed at target
   */
  public static createAimed(
    app: PIXI.Application,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number
  ): BirdProjectile {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const distance = Math.hypot(dx, dy);
    
    if (distance === 0) {
      // Shoot upward if no valid target
      return new BirdProjectile(app, sourceX, sourceY, 0, -BirdProjectile.SPEED);
    }
    
    // Normalize and apply speed with RANDOM VARIABILITY (±20%)
    const speedVariability = 0.8 + Math.random() * 0.4;  // 0.8 to 1.2
    const actualSpeed = BirdProjectile.SPEED * speedVariability;
    const vx = (dx / distance) * actualSpeed;
    const vy = (dy / distance) * actualSpeed;
    
    return new BirdProjectile(app, sourceX, sourceY, vx, vy);
  }
  
  /**
   * Create spread shot pattern
   */
  public static createSpread(
    app: PIXI.Application,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    count: number = 3,
    spreadAngle: number = Math.PI / 6
  ): BirdProjectile[] {
    const projectiles: BirdProjectile[] = [];
    const baseAngle = Math.atan2(targetY - sourceY, targetX - sourceX);
    
    for (let i = 0; i < count; i++) {
      const angleOffset = (i - (count - 1) / 2) * (spreadAngle / (count - 1));
      const angle = baseAngle + angleOffset;
      
      const vx = Math.cos(angle) * BirdProjectile.SPEED;
      const vy = Math.sin(angle) * BirdProjectile.SPEED;
      
      projectiles.push(new BirdProjectile(app, sourceX, sourceY, vx, vy));
    }
    
    return projectiles;
  }
  
  /**
   * Destroy the projectile
   */
  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    
    EntityDestroyer.destroyEntity(
      {
        sprite: this.sprite,
        app: this.app
      },
      {
        markAsDestroyed: false
      }
    );
    
    // Also destroy glow sprite
    if (this.glowSprite.parent) {
      this.glowSprite.parent.removeChild(this.glowSprite);
    }
    this.glowSprite.destroy();
  }
}