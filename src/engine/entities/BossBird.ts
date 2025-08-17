import * as PIXI from 'pixi.js';
import { Boid } from './Boid';
import { GameConfig } from '../GameConfig';

export class BossBird extends Boid {
  public isBoss = true;
  public health: number; // Dynamic health based on wave
  public maxHealth: number; // Track max for shield color
  public size: number; // Boss bird size
  public isBossShooter: boolean = false; // Whether this boss can shoot
  private shieldGraphics: PIXI.Graphics;
  // Removed pulseTime - no longer pulsing
  private flashTimeoutId: NodeJS.Timeout | null = null; // CRITICAL FIX: Track timeout to prevent leaks
  
  constructor(
    app: PIXI.Application,
    x: number,
    y: number,
    speedMultiplier: number,
    health: number = 5, // Default health
    _canShoot: boolean = true // Bosses are ALWAYS shooters
  ) {
    super(app, x, y, speedMultiplier);
    
    // Set health
    this.health = health;
    this.maxHealth = health;
    this.isBossShooter = true; // All bosses are shooters
    
    console.log(`[BOSS CREATED] Health: ${health}, Shield radius will be: ${GameConfig.BOID_SIZE * 2.5 * 1.8}px`);
    
    // Enable shooting for ALL bosses - they're very goal oriented!
    this.isShooter = true;
    this.maxShootCooldown = 30; // Shoot very fast - goal oriented!
    
    // Make boss extra goal-oriented (prioritize energy dots)
    this.isSuperNavigator = true; // Use super navigator behavior for goal orientation
    
    // Boss birds are larger and more aggressive
    this.size = GameConfig.BOID_SIZE * 2.5;
    this.maxSpeed *= 0.8; // Faster than before for goal orientation
    this.maxForce *= 2.5; // Much stronger for aggressive movement
    
    // Create shield effect
    this.shieldGraphics = new PIXI.Graphics();
    app.stage.addChild(this.shieldGraphics);
    
    // Redraw as boss
    this.drawBoss();
  }
  
  private drawBoss() {
    this.sprite.clear();
    
    // Draw larger, more menacing triangle
    this.sprite.poly([
      this.size * 1.5, 0,
      -this.size * 1.2, this.size,
      -this.size * 0.8, 0,
      -this.size * 1.2, -this.size,
    ]);
    
    // Boss colors - different based on shooting ability
    const bossColor = this.isBossShooter ? 0xFF0066 : 0x9900FF; // Red for shooters, purple for normal
    this.sprite.fill({ color: bossColor, alpha: 0.95 });
    this.sprite.stroke({ width: 4, color: 0xFF00FF, alpha: 1 });
    
    // Add inner glow effect instead of eyes
    this.sprite.poly([
      this.size * 0.8, 0,
      -this.size * 0.6, this.size * 0.5,
      -this.size * 0.4, 0,
      -this.size * 0.6, -this.size * 0.5,
    ]);
    this.sprite.fill({ color: 0xFFFFFF, alpha: 0.2 });
  }
  
  update(dt: number) {
    // Call parent update which handles all flocking behavior
    super.update(dt);
    
    // Update shield effect (no pulsing)
    this.updateShield();
  }
  
  private updateShield() {
    this.shieldGraphics.clear();
    
    if (this.health <= 0 || !this.alive) {
      return;
    }
    
    // Position shield at bird location
    this.shieldGraphics.x = this.x;
    this.shieldGraphics.y = this.y;
    
    // Fixed shield size - no pulsing
    const shieldRadius = this.size * 1.8;
    
    // Shield color gradient from green to red based on health
    const healthPercent = this.health / this.maxHealth;
    let shieldColor: number;
    
    if (healthPercent > 0.5) {
      // Green to yellow (health 100% to 50%)
      const t = (healthPercent - 0.5) * 2; // 0 to 1
      const r = Math.floor(255 * (1 - t));
      const g = 255;
      shieldColor = (r << 16) | (g << 8) | 0;
    } else {
      // Yellow to red (health 50% to 0%)
      const t = healthPercent * 2; // 0 to 1
      const r = 255;
      const g = Math.floor(255 * t);
      shieldColor = (r << 16) | (g << 8) | 0;
    }
    
    // Draw hexagonal shield (aligned with game's neon aesthetic)
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;
    const vertices: number[] = [];
    
    // Rotate hexagon to point up (matches bird direction)
    const rotationOffset = Math.PI / 6;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + rotationOffset;
      vertices.push(
        Math.cos(angle) * shieldRadius,
        Math.sin(angle) * shieldRadius
      );
    }
    
    this.shieldGraphics.poly(vertices);
    this.shieldGraphics.stroke({ 
      width: 3, 
      color: shieldColor, 
      alpha: 0.6 * healthPercent + 0.2 // More visible shield
    });
    
    // Add inner hexagon for more depth
    const innerVertices: number[] = [];
    const innerRadius = shieldRadius * 0.7;
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep + rotationOffset;
      innerVertices.push(
        Math.cos(angle) * innerRadius,
        Math.sin(angle) * innerRadius
      );
    }
    
    this.shieldGraphics.poly(innerVertices);
    this.shieldGraphics.stroke({ 
      width: 1, 
      color: shieldColor, 
      alpha: 0.3 * healthPercent 
    });
  }
  
  /**
   * Check if the boss has an active shield
   */
  hasActiveShield(): boolean {
    return this.health > 0 && this.alive;
  }
  
  /**
   * Get the shield collision radius (larger than the bird itself)
   */
  getShieldRadius(): number {
    if (!this.hasActiveShield()) return 0;
    return this.size * 1.8; // Shield is 1.8x the boss size
  }
  
  /**
   * Boss takes damage but doesn't die immediately
   * Returns true if boss is destroyed, false otherwise
   */
  takeDamage(): boolean {
    this.health--;
    
    if (this.health <= 0) {
      this.destroy();
      return true; // Boss destroyed
    }
    
    // CRITICAL FIX: Clear any existing flash timeout to prevent accumulation
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    
    // Flash effect when hit
    const originalAlpha = this.sprite.alpha;
    this.sprite.alpha = 0.5;
    this.flashTimeoutId = setTimeout(() => {
      if (!this.sprite.destroyed) {
        this.sprite.alpha = originalAlpha;
      }
      this.flashTimeoutId = null; // Clear reference
    }, 100);
    
    return false; // Boss still alive
  }
  
  destroy() {
    if (!this.alive) return;
    
    // CRITICAL FIX: Clear flash timeout on destroy to prevent leaks
    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
      this.flashTimeoutId = null;
    }
    
    // Clean up shield
    if (this.shieldGraphics.parent) {
      this.app.stage.removeChild(this.shieldGraphics);
    }
    if (!this.shieldGraphics.destroyed) {
      this.shieldGraphics.destroy();
    }
    
    super.destroy();
  }
}