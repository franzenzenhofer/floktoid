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
  public originalDotPosition: { x: number; y: number }; // Where the dot should return to
  public isLeaving = false; // Whether StarBase is leaving
  public leavingDirection: 'up' | 'left' | 'right' = 'up'; // Direction to leave
  private movementSpeed = 100; // pixels per second for descent
  
  // Visual components
  private sprite: PIXI.Graphics;
  private outerShieldSprite: PIXI.Graphics; // Separate sprite for outer shield
  private innerShieldSprite: PIXI.Graphics; // Separate sprite for inner shield
  private app: PIXI.Application;
  
  // Combat properties
  private rotationTarget = 0;
  private isRotating = false;
  private actionPhase: 'rotate' | 'pause1' | 'shoot' | 'pause2' = 'rotate';
  private phaseTimer = 0;
  
  // Lasers
  public lasers: Laser[] = [];
  private readonly LASER_SPEED = 350; // Pixels per second (faster)
  private readonly LASER_LIFETIME = 3; // Seconds
  
  constructor(
    app: PIXI.Application,
    wave: number,
    dotHue: number = 60, // Yellow by default
    dotPosition?: { x: number; y: number }
  ) {
    this.app = app;
    this.dotHue = dotHue;
    this.originalDotPosition = dotPosition || { x: app.screen.width / 2, y: app.screen.height - 100 };
    
    // Start at top, will descend to center
    this.x = app.screen.width / 2;
    this.y = -this.size * 2; // Start above screen
    this.targetY = app.screen.height / 2; // Target: center of screen
    
    // Health scales with wave (5 shots for first StarBase on wave 7)
    this.health = this.calculateHealth(wave);
    this.maxHealth = this.health;
    
    // Timer decreases on higher waves (30s -> 20s on later waves)
    this.maxTimeAlive = Math.max(20, 30 - Math.floor(wave / 20) * 2);
    
    // Create visual components
    this.sprite = new PIXI.Graphics();
    this.outerShieldSprite = new PIXI.Graphics();
    this.innerShieldSprite = new PIXI.Graphics();
    
    // Add to stage with proper z-ordering
    this.sprite.zIndex = 500;
    this.innerShieldSprite.zIndex = 499;
    this.outerShieldSprite.zIndex = 498;
    
    app.stage.addChild(this.outerShieldSprite);
    app.stage.addChild(this.innerShieldSprite);
    app.stage.addChild(this.sprite);
    
    // Initial draw
    this.draw();
    
    console.log(`[STARBASE] Created with ${this.health} HP (${this.health - 1} shield + 1 core), ${this.maxTimeAlive}s timer`);
  }
  
  private calculateHealth(wave: number): number {
    // StarBase appears on waves 7, 17, 27, etc.
    // ALWAYS require 5 shield + 1 core = 6 total for first appearance
    // Wave 7: 5 shield + 1 core = 6 total
    // Wave 17: 7 shield + 1 core = 8 total  
    // Wave 27: 9 shield + 1 core = 10 total
    // Dev mode also gets 5+1 for consistency
    if (wave < 7) return 6;  // 5 + 1 for dev mode testing
    if (wave >= 7 && wave < 17) return 6;  // 5 + 1
    if (wave >= 17 && wave < 27) return 8;  // 7 + 1
    if (wave >= 27 && wave < 37) return 10; // 9 + 1
    return 10 + Math.floor((wave - 27) / 10) * 2; // +2 health every 10 waves after 27
  }
  
  private draw() {
    this.sprite.clear();
    
    // Main hexagon body with cooler look
    const vertices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation;
      vertices.push(
        Math.cos(angle) * this.size,
        Math.sin(angle) * this.size
      );
    }
    
    // Dark metallic body with gradient effect
    this.sprite.poly(vertices);
    this.sprite.fill({ color: 0x1A1A2E, alpha: 1 });
    this.sprite.stroke({ width: 2, color: 0x00FFFF, alpha: 1 });
    
    // Inner hexagon for depth
    const innerVertices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation;
      innerVertices.push(
        Math.cos(angle) * this.size * 0.7,
        Math.sin(angle) * this.size * 0.7
      );
    }
    this.sprite.poly(innerVertices);
    this.sprite.stroke({ width: 1, color: 0x00AAAA, alpha: 0.5 });
    
    // Tech lines connecting vertices for cooler look
    for (let i = 0; i < 6; i++) {
      const angle1 = (i * Math.PI * 2) / 6 + this.rotation;
      const angle2 = ((i + 3) % 6 * Math.PI * 2) / 6 + this.rotation; // Connect to opposite vertex
      
      this.sprite.moveTo(
        Math.cos(angle1) * this.size * 0.3,
        Math.sin(angle1) * this.size * 0.3
      );
      this.sprite.lineTo(
        Math.cos(angle2) * this.size * 0.3,
        Math.sin(angle2) * this.size * 0.3
      );
      this.sprite.stroke({ width: 1, color: 0x006666, alpha: 0.3 });
    }
    
    // Inner core - draw like actual energy dot with matching color!
    const dotColor = hueToRGB(this.dotHue);
    const pulse = Math.sin(this.timeAlive * 5) * 0.2 + 1;
    const coreRadius = 8 * pulse; // Energy dot size
    
    // Multiple glow layers for better effect
    for (let i = 3; i > 0; i--) {
      this.sprite.circle(0, 0, coreRadius * i);
      this.sprite.fill({ color: dotColor, alpha: 0.1 * pulse });
    }
    
    // Main dot
    this.sprite.circle(0, 0, coreRadius);
    this.sprite.fill({ color: dotColor, alpha: 0.9 });
    
    // White core center
    this.sprite.circle(0, 0, coreRadius * 0.3);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 1 });
    
    // Enhanced red triangular laser cannons on 3 sides
    for (let i = 0; i < 6; i += 2) { // Every other side has a cannon
      const angle = (i * Math.PI * 2) / 6 + this.rotation;
      const cannonX = Math.cos(angle) * (this.size * 0.85);
      const cannonY = Math.sin(angle) * (this.size * 0.85);
      
      // Draw larger, cooler red triangle pointing outward
      const triangleSize = 10;
      const tipX = cannonX + Math.cos(angle) * triangleSize;
      const tipY = cannonY + Math.sin(angle) * triangleSize;
      const base1X = cannonX + Math.cos(angle + Math.PI * 2/3) * triangleSize * 0.7;
      const base1Y = cannonY + Math.sin(angle + Math.PI * 2/3) * triangleSize * 0.7;
      const base2X = cannonX + Math.cos(angle - Math.PI * 2/3) * triangleSize * 0.7;
      const base2Y = cannonY + Math.sin(angle - Math.PI * 2/3) * triangleSize * 0.7;
      
      // Glow effect for cannons
      this.sprite.circle(cannonX, cannonY, triangleSize * 0.8);
      this.sprite.fill({ color: 0xFF0000, alpha: 0.2 });
      
      this.sprite.poly([tipX, tipY, base1X, base1Y, base2X, base2Y]);
      this.sprite.fill({ color: 0xFF0000, alpha: 1 });
      this.sprite.stroke({ width: 1, color: 0xFFAAAA });
      
      // Inner detail
      this.sprite.circle(cannonX, cannonY, 3);
      this.sprite.fill({ color: 0xFF6666, alpha: 0.8 });
    }
    
    // Update position
    this.sprite.x = this.x;
    this.sprite.y = this.y;
  }
  
  private updateShield() {
    // Clear both shield sprites
    this.outerShieldSprite.clear();
    this.innerShieldSprite.clear();
    
    // Shield only visible when health > 1 (last HP is core without shield)
    if (this.health <= 1 || !this.alive) {
      // Position sprites even when cleared
      this.outerShieldSprite.x = this.x;
      this.outerShieldSprite.y = this.y;
      this.innerShieldSprite.x = this.x;
      this.innerShieldSprite.y = this.y;
      return;
    }
    
    // Calculate how many shield hits have been taken
    const shieldHitsTaken = this.maxHealth - this.health;
    
    // Determine shield states based on damage
    const outerShieldActive = shieldHitsTaken < 2; // First 2 hits
    const innerShieldActive = this.health > 1; // Always show inner if shields exist
    
    // Shield radii
    const outerShieldRadius = this.size * 1.5;
    const innerShieldRadius = this.size * 1.2;
    
    // Calculate shield health percentage (not including core)
    const shieldHealth = this.health - 1; // -1 for core
    const maxShieldHealth = this.maxHealth - 1;
    const healthPercent = shieldHealth / maxShieldHealth;
    
    // Color transitions: Green -> Yellow -> Orange -> Red for ACTIVE shields
    let activeShieldColor: number;
    if (healthPercent > 0.75) {
      // Green
      activeShieldColor = 0x00FF00;
    } else if (healthPercent > 0.5) {
      // Green to Yellow
      const t = (healthPercent - 0.5) * 4;
      const r = Math.floor(255 * (1 - t));
      const g = 255;
      activeShieldColor = (r << 16) | (g << 8) | 0;
    } else if (healthPercent > 0.25) {
      // Yellow to Orange
      const t = (healthPercent - 0.25) * 4;
      const r = 255;
      const g = Math.floor(255 * t);
      activeShieldColor = (r << 16) | (g << 8) | 0;
    } else {
      // Orange to Red
      const t = healthPercent * 4;
      const r = 255;
      const g = Math.floor(128 * t);
      activeShieldColor = (r << 16) | (g << 8) | 0;
    }
    
    // Destroyed shield color (dark gray/damaged)
    const destroyedShieldColor = 0x444444;
    
    // ALWAYS DRAW BOTH SHIELDS - just change appearance based on state
    
    // Draw outer shield (destroyed or active)
    const outerVertices: number[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
      outerVertices.push(
        Math.cos(angle) * outerShieldRadius,
        Math.sin(angle) * outerShieldRadius
      );
    }
    
    if (outerShieldActive) {
      // Draw active outer shield
      this.shieldSprite.poly(outerVertices);
      this.shieldSprite.stroke({ 
        width: 3, 
        color: activeShieldColor, 
        alpha: 0.8 + healthPercent * 0.2 
      });
      
      // Add glow effect for active shield
      const pulseAlpha = Math.sin(this.timeAlive * 3) * 0.1 + 0.1;
      this.shieldSprite.circle(0, 0, outerShieldRadius);
      this.shieldSprite.fill({ color: activeShieldColor, alpha: pulseAlpha });
    } else {
      // Draw destroyed outer shield (broken/damaged appearance)
      // Draw as dashed/broken line segments
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        const angle2 = ((i + 1) % 6 * Math.PI * 2) / 6 + this.rotation * 0.5;
        
        // Only draw some segments to show it's broken
        if (i % 2 === 0 || Math.random() > 0.3) {
          const x1 = Math.cos(angle1) * outerShieldRadius;
          const y1 = Math.sin(angle1) * outerShieldRadius;
          const x2 = Math.cos(angle2) * outerShieldRadius;
          const y2 = Math.sin(angle2) * outerShieldRadius;
          
          // Draw partial segment
          const segmentStart = 0.1 + Math.random() * 0.2;
          const segmentEnd = 0.7 + Math.random() * 0.2;
          
          this.shieldSprite.moveTo(
            x1 + (x2 - x1) * segmentStart,
            y1 + (y2 - y1) * segmentStart
          );
          this.shieldSprite.lineTo(
            x1 + (x2 - x1) * segmentEnd,
            y1 + (y2 - y1) * segmentEnd
          );
          this.shieldSprite.stroke({ 
            width: 1, 
            color: destroyedShieldColor, 
            alpha: 0.3 
          });
        }
      }
    }
    
    // Draw inner shield (always visible if shields exist)
    if (innerShieldActive) {
      const innerVertices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        innerVertices.push(
          Math.cos(angle) * innerShieldRadius,
          Math.sin(angle) * innerShieldRadius
        );
      }
      
      // Inner shield uses active color when it's the active collision zone
      const innerIsActiveCollisionZone = !outerShieldActive;
      const innerColor = innerIsActiveCollisionZone ? activeShieldColor : activeShieldColor;
      const innerAlpha = innerIsActiveCollisionZone ? 0.8 + healthPercent * 0.2 : 0.5;
      
      this.shieldSprite.poly(innerVertices);
      this.shieldSprite.stroke({ 
        width: innerIsActiveCollisionZone ? 3 : 2, 
        color: innerColor, 
        alpha: innerAlpha 
      });
      
      // Add detail lines
      const detailVertices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        detailVertices.push(
          Math.cos(angle) * innerShieldRadius * 0.9,
          Math.sin(angle) * innerShieldRadius * 0.9
        );
      }
      this.shieldSprite.poly(detailVertices);
      this.shieldSprite.stroke({ 
        width: 1, 
        color: innerColor, 
        alpha: 0.3 
      });
      
      // Add pulsing effect if this is the active collision zone
      if (innerIsActiveCollisionZone) {
        const pulseAlpha = Math.sin(this.timeAlive * 3) * 0.1 + 0.1;
        this.shieldSprite.circle(0, 0, innerShieldRadius);
        this.shieldSprite.fill({ color: activeShieldColor, alpha: pulseAlpha });
      }
    }
    
    this.shieldSprite.x = this.x;
    this.shieldSprite.y = this.y;
  }
  
  update(dt: number) {
    if (!this.alive) return;
    
    this.timeAlive += dt;
    
    // Check if time expired and not already leaving
    if (this.timeAlive >= this.maxTimeAlive && !this.isLeaving) {
      this.startLeaving();
    }
    
    // Handle leaving animation
    if (this.isLeaving) {
      const leaveSpeed = 200; // pixels per second
      
      if (this.leavingDirection === 'up') {
        this.y -= leaveSpeed * dt;
        if (this.y < -100) {
          this.alive = false;
        }
      } else if (this.leavingDirection === 'left') {
        this.x -= leaveSpeed * dt;
        if (this.x < -100) {
          this.alive = false;
        }
      } else if (this.leavingDirection === 'right') {
        this.x += leaveSpeed * dt;
        if (this.x > this.app.screen.width + 100) {
          this.alive = false;
        }
      }
      
      // Continue updating visuals while leaving
      this.updateLasers(dt);
      this.draw();
      this.updateShield();
      return; // Don't do combat logic while leaving
    }
    
    // Move down to center position (only when not leaving)
    if (this.y < this.targetY) {
      this.y += this.movementSpeed * dt;
      if (this.y > this.targetY) {
        this.y = this.targetY;
      }
    }
    
    // Combat logic - only when in position and not leaving
    if (this.y >= this.targetY && !this.isLeaving) {
      this.phaseTimer -= dt;
      
      // Handle action phases: rotate -> pause -> shoot -> pause -> rotate...
      switch (this.actionPhase) {
        case 'rotate':
          if (this.phaseTimer <= 0) {
            // Random rotation between 10 and 360 degrees
            const minRotation = Math.PI / 18; // 10 degrees
            const maxRotation = Math.PI * 2; // 360 degrees
            const randomRotation = minRotation + Math.random() * (maxRotation - minRotation);
            
            this.rotationTarget = this.rotation + randomRotation;
            this.isRotating = true;
            this.actionPhase = 'pause1';
            this.phaseTimer = 0.7; // Pause for 0.7 seconds after rotation
          }
          break;
          
        case 'pause1':
          // Do rotation animation
          if (this.isRotating) {
            const rotationDiff = this.rotationTarget - this.rotation;
            if (Math.abs(rotationDiff) > 0.01) {
              this.rotation += rotationDiff * dt * 4; // Smooth rotation
            } else {
              this.rotation = this.rotationTarget;
              this.isRotating = false;
            }
          }
          
          if (this.phaseTimer <= 0 && !this.isRotating) {
            this.actionPhase = 'shoot';
            this.phaseTimer = 0;
          }
          break;
          
        case 'shoot':
          this.fireVolley();
          this.actionPhase = 'pause2';
          this.phaseTimer = 1.2; // Pause after shooting
          break;
          
        case 'pause2':
          if (this.phaseTimer <= 0) {
            this.actionPhase = 'rotate';
            this.phaseTimer = 0;
          }
          break;
      }
    }
    
    // Update lasers
    this.updateLasers(dt);
    
    // Update visuals
    this.draw();
    this.updateShield();
  }
  
  private fireVolley() {
    // Fire from ALL 3 cannons at once!
    for (let cannonIndex = 0; cannonIndex < 3; cannonIndex++) {
      const hexSide = cannonIndex * 2; // Convert to hexagon side (0, 2, 4)
      const angle = (hexSide * Math.PI * 2) / 6 + this.rotation;
      
      // Start from triangle tip (further out than cannon base)
      const cannonBaseDistance = this.size * 0.85;
      const triangleTipDistance = cannonBaseDistance + 10; // Triangle extends 10 pixels
      const startX = this.x + Math.cos(angle) * triangleTipDistance;
      const startY = this.y + Math.sin(angle) * triangleTipDistance;
      
      // Small random spread for each laser
      const spread = (Math.random() - 0.5) * 0.15;
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
    
    console.log(`[STARBASE] Fired from all 3 cannons!`);
  }
  
  private updateLasers(dt: number) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      
      // Update position
      laser.x += laser.vx * dt;
      laser.y += laser.vy * dt;
      laser.lifetime -= dt;
      
      // Draw enhanced laser
      laser.sprite.clear();
      
      // Laser trail
      laser.sprite.moveTo(laser.x, laser.y);
      laser.sprite.lineTo(
        laser.x - laser.vx * 0.15, 
        laser.y - laser.vy * 0.15
      );
      laser.sprite.stroke({ width: 4, color: 0xFF0000, alpha: 0.9 });
      
      // Inner bright line
      laser.sprite.moveTo(laser.x, laser.y);
      laser.sprite.lineTo(
        laser.x - laser.vx * 0.1, 
        laser.y - laser.vy * 0.1
      );
      laser.sprite.stroke({ width: 2, color: 0xFFAAAA, alpha: 1 });
      
      // Glow at tip
      laser.sprite.circle(laser.x, laser.y, 5);
      laser.sprite.fill({ color: 0xFF0000, alpha: 0.4 });
      
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
    
    // Flash effect - only flash the SHIELD, not the core!
    if (this.hasActiveShield()) {
      this.shieldSprite.tint = 0xFF0000;
      setTimeout(() => {
        this.shieldSprite.tint = 0xFFFFFF;
      }, 100);
    } else {
      // Only flash the core if no shield left
      this.sprite.tint = 0xFF0000;
      setTimeout(() => {
        this.sprite.tint = 0xFFFFFF;
      }, 100);
    }
    
    console.log(`[STARBASE] Hit! Health: ${this.health}/${this.maxHealth}`);
    
    if (this.health <= 0) {
      this.destroy();
      return true; // Destroyed
    }
    
    return false; // Still alive
  }
  
  private startLeaving() {
    console.log(`[STARBASE] Time expired, leaving...`);
    this.isLeaving = true;
    
    // Randomly choose direction to leave
    const rand = Math.random();
    if (rand < 0.33) {
      this.leavingDirection = 'left';
    } else if (rand < 0.66) {
      this.leavingDirection = 'right';
    } else {
      this.leavingDirection = 'up';
    }
    
    console.log(`[STARBASE] Leaving via ${this.leavingDirection}`);
  }
  
  destroy() {
    this.alive = false;
    
    // Clean up sprites
    this.app.stage.removeChild(this.sprite);
    this.app.stage.removeChild(this.shieldSprite);
    
    this.sprite.destroy();
    this.shieldSprite.destroy();
    
    // Clean up lasers
    for (const laser of this.lasers) {
      this.app.stage.removeChild(laser.sprite);
      laser.sprite.destroy();
    }
    this.lasers = [];
    
    console.log(`[STARBASE] Destroyed! Energy dot should return to position: ${this.originalDotPosition.x}, ${this.originalDotPosition.y}`);
  }
  
  /**
   * Check if a point collides with the StarBase
   * Uses same logic as BossBird for consistency (DRY)
   */
  containsPoint(x: number, y: number): boolean {
    if (!this.alive) return false;
    
    const dx = x - this.x;
    const dy = y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Use shield radius if shield is active, otherwise use base size
    const collisionRadius = this.hasActiveShield() ? this.getShieldRadius() : this.size;
    return distance <= collisionRadius;
  }
  
  /**
   * Get shield radius with PROGRESSIVE collision zones
   * - First 2 hits: Outer shield (1.5x)
   * - Middle hits: Inner shield (1.2x)  
   * - Last hit: Core only (1.0x)
   */
  getShieldRadius(): number {
    if (!this.hasActiveShield()) return this.size;
    
    // Calculate how many shield hits have been taken
    const shieldHitsTaken = this.maxHealth - this.health;
    
    // First 2 hits use outer shield (1.5x)
    if (shieldHitsTaken < 2) {
      return this.size * 1.5; // Outer shield collision zone
    }
    
    // After outer shield is gone, use inner shield (1.2x)
    // Until only core remains (health = 1)
    return this.size * 1.2; // Inner shield collision zone
  }
  
  /**
   * Check if StarBase has active shield (like boss)
   */
  hasActiveShield(): boolean {
    return this.health > 1 && this.alive;
  }
  
  /**
   * Get the original position where the energy dot should return
   */
  getOriginalDotPosition(): { x: number; y: number } {
    return this.originalDotPosition;
  }
}