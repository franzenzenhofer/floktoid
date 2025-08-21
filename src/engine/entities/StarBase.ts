/**
 * StarBase - Hexagonal space station that replaces energy dot respawning
 * Appears on waves 7, 17, 27, etc. when energy dots are missing
 * Contains one missing energy dot that drops when destroyed
 */

import * as PIXI from 'pixi.js';
import { hueToRGB } from '../utils/ColorUtils';

export interface Laser {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifetime: number;
  sprite: PIXI.Graphics;
}

export class StarBase {
  public x: number;
  public y: number;
  public targetY: number; // Target Y position (center of screen)
  public rotation = 0;
  public health: number;
  public maxHealth: number;
  public size = 40; // Smaller radius like boss
  public alive = true;
  public timeAlive = 0;
  public maxTimeAlive: number; // Time before leaving (30s initially)
  public dotHue: number; // Color of the energy dot inside
  private movementSpeed = 100; // pixels per second for descent
  
  // Visual components
  private sprite: PIXI.Graphics;
  private shieldSprite: PIXI.Graphics;
  private healthBarSprite: PIXI.Graphics;
  private app: PIXI.Application;
  
  // Combat properties
  private shootCooldown = 0;
  private readonly SHOOT_INTERVAL = 2; // Seconds between shot bursts
  private rotationTarget = 0;
  private isRotating = false;
  private shotsFired = 0;
  
  // Lasers
  public lasers: Laser[] = [];
  private readonly LASER_SPEED = 300; // Pixels per second
  private readonly LASER_LIFETIME = 3; // Seconds
  
  constructor(
    app: PIXI.Application,
    wave: number,
    dotHue: number = 60 // Yellow by default
  ) {
    this.app = app;
    this.dotHue = dotHue;
    
    // Start at top, will descend to center
    this.x = app.screen.width / 2;
    this.y = -this.size * 2; // Start above screen
    this.targetY = app.screen.height / 2; // Target: center of screen
    
    // Health scales with wave
    this.health = this.calculateHealth(wave);
    this.maxHealth = this.health;
    
    // Timer decreases on higher waves (30s -> 20s on later waves)
    this.maxTimeAlive = Math.max(20, 30 - Math.floor(wave / 20) * 2);
    
    // Create visual components
    this.sprite = new PIXI.Graphics();
    this.shieldSprite = new PIXI.Graphics();
    this.healthBarSprite = new PIXI.Graphics();
    
    // Add to stage with proper z-ordering
    this.sprite.zIndex = 500;
    this.shieldSprite.zIndex = 499;
    this.healthBarSprite.zIndex = 501;
    
    app.stage.addChild(this.sprite);
    app.stage.addChild(this.shieldSprite);
    app.stage.addChild(this.healthBarSprite);
    
    // Initial draw
    this.draw();
    
    console.log(`[STARBASE] Created with ${this.health} HP, ${this.maxTimeAlive}s timer`);
  }
  
  private calculateHealth(wave: number): number {
    // Like boss: health is for shield, +1 for core
    // Wave 7: 3 shield + 1 core = 4 total
    // Wave 17: 5 shield + 1 core = 6 total
    // Wave 27: 7 shield + 1 core = 8 total
    if (wave <= 7) return 4;
    if (wave <= 17) return 6;
    if (wave <= 27) return 8;
    return 8 + Math.floor((wave - 27) / 10) * 2; // +2 health every 10 waves after 27
  }
  
  private draw() {
    this.sprite.clear();
    
    // Main hexagon body
    const vertices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation;
      vertices.push(
        Math.cos(angle) * this.size,
        Math.sin(angle) * this.size
      );
    }
    
    // Dark metallic body
    this.sprite.poly(vertices);
    this.sprite.fill({ color: 0x2A2A3E, alpha: 1 });
    this.sprite.stroke({ width: 3, color: 0x00FFFF, alpha: 0.8 });
    
    // Inner core - draw like actual energy dot with matching color!
    const dotColor = hueToRGB(this.dotHue);
    const pulse = Math.sin(this.timeAlive * 5) * 0.2 + 1;
    const coreRadius = 8 * pulse; // Energy dot size
    
    // Glow like energy dot
    this.sprite.circle(0, 0, coreRadius * 2);
    this.sprite.fill({ color: dotColor, alpha: 0.3 * pulse });
    
    // Main dot
    this.sprite.circle(0, 0, coreRadius);
    this.sprite.fill({ color: dotColor, alpha: 0.9 });
    
    // White core center
    this.sprite.circle(0, 0, coreRadius * 0.3);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 1 });
    
    // Laser cannons on 3 sides (visual indicators)
    for (let i = 0; i < 6; i += 2) { // Every other side has a cannon
      const angle = (i * Math.PI * 2) / 6 + this.rotation;
      const cannonX = Math.cos(angle) * (this.size * 0.8);
      const cannonY = Math.sin(angle) * (this.size * 0.8);
      
      this.sprite.circle(cannonX, cannonY, 5);
      this.sprite.fill({ color: 0xFF0000, alpha: 0.8 });
    }
    
    // Update position
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }
  
  private updateShield() {
    this.shieldSprite.clear();
    
    // Shield only visible when health > 1 (last HP is core without shield)
    if (this.health <= 1 || !this.alive) return;
    
    // Shield hexagon - like boss shield
    const shieldRadius = this.size * 1.8;
    const vertices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5; // Rotate slower
      vertices.push(
        Math.cos(angle) * shieldRadius,
        Math.sin(angle) * shieldRadius
      );
    }
    
    // Shield color based on shield health (not including core)
    const shieldHealth = this.health - 1; // -1 for core
    const maxShieldHealth = this.maxHealth - 1;
    const healthPercent = shieldHealth / maxShieldHealth;
    let shieldColor: number;
    
    if (healthPercent > 0.5) {
      // Green to yellow
      const t = (healthPercent - 0.5) * 2;
      shieldColor = (Math.floor(255 * (1 - t)) << 16) | (255 << 8) | 0;
    } else {
      // Yellow to red
      const t = healthPercent * 2;
      shieldColor = (255 << 16) | (Math.floor(255 * t) << 8) | 0;
    }
    
    this.shieldSprite.poly(vertices);
    this.shieldSprite.stroke({ 
      width: 2, 
      color: shieldColor, 
      alpha: 0.4 + healthPercent * 0.3 
    });
    
    // Inner shield layer
    const innerVertices: number[] = [];
    const innerRadius = shieldRadius * 0.7;
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
      innerVertices.push(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
    }
    
    this.shieldSprite.poly(innerVertices);
    this.shieldSprite.stroke({ 
      width: 1, 
      color: shieldColor, 
      alpha: 0.2 + healthPercent * 0.2 
    });
    
    this.shieldSprite.x = this.x;
    this.shieldSprite.y = this.y;
  }
  
  private updateHealthBar() {
    this.healthBarSprite.clear();
    
    if (!this.alive || this.health <= 0) return;
    
    // Health bar above StarBase
    const barWidth = 80;
    const barHeight = 8;
    const barY = -this.size - 20;
    
    // Background
    this.healthBarSprite.rect(-barWidth/2, barY, barWidth, barHeight);
    this.healthBarSprite.fill({ color: 0x333333, alpha: 0.8 });
    
    // Health fill
    const healthPercent = this.health / this.maxHealth;
    const fillWidth = barWidth * healthPercent;
    
    // Color based on health
    let fillColor: number;
    if (healthPercent > 0.5) {
      fillColor = 0x00FF00; // Green
    } else if (healthPercent > 0.25) {
      fillColor = 0xFFFF00; // Yellow
    } else {
      fillColor = 0xFF0000; // Red
    }
    
    this.healthBarSprite.rect(-barWidth/2, barY, fillWidth, barHeight);
    this.healthBarSprite.fill({ color: fillColor, alpha: 1 });
    
    // Health numbers shown in bar visually (no text needed)
    
    this.healthBarSprite.x = this.x;
    this.healthBarSprite.y = this.y;
  }
  
  update(dt: number) {
    if (!this.alive) return;
    
    this.timeAlive += dt;
    
    // Check if time expired
    if (this.timeAlive >= this.maxTimeAlive) {
      this.startLeaving();
      return;
    }
    
    // Move down to center position
    if (this.y < this.targetY) {
      this.y += this.movementSpeed * dt;
      if (this.y > this.targetY) {
        this.y = this.targetY;
      }
    }
    
    // Rotation animation
    if (this.isRotating) {
      const rotationDiff = this.rotationTarget - this.rotation;
      if (Math.abs(rotationDiff) > 0.01) {
        this.rotation += rotationDiff * dt * 5; // Smooth rotation
      } else {
        this.rotation = this.rotationTarget;
        this.isRotating = false;
      }
    }
    
    // Combat logic - only shoot when in position
    if (this.y >= this.targetY) {
      this.shootCooldown -= dt;
      
      if (this.shootCooldown <= 0 && !this.isRotating) {
      this.fireVolley();
      this.shootCooldown = this.SHOOT_INTERVAL;
      
        // Rotate after shooting
        this.rotationTarget = this.rotation + (Math.PI * 2) / 6; // Rotate 60 degrees
        this.isRotating = true;
      }
    }
    
    // Update lasers
    this.updateLasers(dt);
    
    // Update visuals
    this.draw();
    this.updateShield();
    this.updateHealthBar();
  }
  
  private fireVolley() {
    // Fire from 3 random sides
    const sides = [0, 1, 2, 3, 4, 5];
    const selectedSides: number[] = [];
    
    // Pick 3 random sides
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * sides.length);
      selectedSides.push(sides.splice(randomIndex, 1)[0]);
    }
    
    // Create lasers from selected sides
    for (const side of selectedSides) {
      const angle = (side * Math.PI * 2) / 6 + this.rotation;
      const startX = this.x + Math.cos(angle) * this.size;
      const startY = this.y + Math.sin(angle) * this.size;
      
      // Random spread for lasers
      const spread = (Math.random() - 0.5) * 0.3;
      const laserAngle = angle + spread;
      
      const laser: Laser = {
        x: startX,
        y: startY,
        vx: Math.cos(laserAngle) * this.LASER_SPEED,
        vy: Math.sin(laserAngle) * this.LASER_SPEED,
        lifetime: this.LASER_LIFETIME,
        sprite: new PIXI.Graphics()
      };
      
      laser.sprite.zIndex = 450;
      this.app.stage.addChild(laser.sprite);
      this.lasers.push(laser);
    }
    
    this.shotsFired++;
    console.log(`[STARBASE] Fired volley #${this.shotsFired} from 3 sides`);
  }
  
  private updateLasers(dt: number) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      
      // Update position
      laser.x += laser.vx * dt;
      laser.y += laser.vy * dt;
      laser.lifetime -= dt;
      
      // Draw laser
      laser.sprite.clear();
      laser.sprite.moveTo(laser.x, laser.y);
      laser.sprite.lineTo(
        laser.x - laser.vx * 0.1, 
        laser.y - laser.vy * 0.1
      );
      laser.sprite.stroke({ width: 3, color: 0xFF0000, alpha: 0.9 });
      
      // Add glow
      laser.sprite.circle(laser.x, laser.y, 4);
      laser.sprite.fill({ color: 0xFF0000, alpha: 0.3 });
      
      // Remove expired or off-screen lasers
      if (laser.lifetime <= 0 || 
          laser.x < -50 || laser.x > this.app.screen.width + 50 ||
          laser.y < -50 || laser.y > this.app.screen.height + 50) {
        this.app.stage.removeChild(laser.sprite);
        laser.sprite.destroy();
        this.lasers.splice(i, 1);
      }
    }
  }
  
  takeDamage(): boolean {
    if (!this.alive) return false;
    
    this.health--;
    
    // Flash effect
    this.sprite.tint = 0xFF0000;
    setTimeout(() => {
      this.sprite.tint = 0xFFFFFF;
    }, 100);
    
    console.log(`[STARBASE] Hit! Health: ${this.health}/${this.maxHealth}`);
    
    if (this.health <= 0) {
      this.destroy();
      return true; // Destroyed
    }
    
    return false; // Still alive
  }
  
  private startLeaving() {
    console.log(`[STARBASE] Time expired, leaving...`);
    this.alive = false;
    // Animate leaving (move up)
    // This will be handled in update()
  }
  
  destroy() {
    this.alive = false;
    
    // Clean up sprites
    this.app.stage.removeChild(this.sprite);
    this.app.stage.removeChild(this.shieldSprite);
    this.app.stage.removeChild(this.healthBarSprite);
    
    this.sprite.destroy();
    this.shieldSprite.destroy();
    this.healthBarSprite.destroy();
    
    // Clean up lasers
    for (const laser of this.lasers) {
      this.app.stage.removeChild(laser.sprite);
      laser.sprite.destroy();
    }
    this.lasers = [];
    
    console.log(`[STARBASE] Destroyed!`);
  }
  
  /**
   * Check if a point collides with the StarBase
   */
  containsPoint(x: number, y: number): boolean {
    if (!this.alive) return false;
    
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Collision with shield or core
    const collisionRadius = this.health > 1 ? this.size * 1.5 : this.size;
    return distance <= collisionRadius;
  }
  
  /**
   * Check if StarBase has active shield (like boss)
   */
  hasActiveShield(): boolean {
    return this.health > 1 && this.alive;
  }
}