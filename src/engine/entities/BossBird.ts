import * as PIXI from 'pixi.js';
import { Boid } from './Boid';
import { GameConfig } from '../GameConfig';

export class BossBird extends Boid {
  public isBoss = true;
  public health = 3; // Takes 3 hits to destroy
  private shieldGraphics: PIXI.Graphics;
  private pulseTime = 0;
  
  constructor(
    app: PIXI.Application,
    x: number,
    y: number,
    speedMultiplier: number
  ) {
    super(app, x, y, speedMultiplier);
    
    // Boss birds are larger and slower
    this.size = GameConfig.BOID_SIZE * 2;
    this.maxSpeed *= 0.7;
    this.maxForce *= 1.5; // But stronger
    
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
    
    // Boss colors - deep red/purple
    const bossColor = 0xFF0066;
    this.sprite.fill({ color: bossColor, alpha: 0.9 });
    this.sprite.stroke({ width: 3, color: 0xFF00FF, alpha: 1 });
    
    // Add glowing eyes
    this.sprite.circle(this.size * 0.5, -this.size * 0.3, 3);
    this.sprite.circle(this.size * 0.5, this.size * 0.3, 3);
    this.sprite.fill({ color: 0xFFFF00, alpha: 1 });
  }
  
  update(dt: number) {
    super.update(dt);
    
    // Update shield effect
    this.pulseTime += dt;
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
    
    // Pulsing shield effect based on health
    const pulse = Math.sin(this.pulseTime * 5) * 0.2 + 0.8;
    const shieldRadius = this.size * 1.5 * pulse;
    
    // Shield color based on health
    let shieldColor = 0x00FFFF; // Cyan for full health
    if (this.health === 2) shieldColor = 0xFFFF00; // Yellow for damaged
    if (this.health === 1) shieldColor = 0xFF0000; // Red for critical
    
    // Draw hexagonal shield
    const sides = 6;
    const angleStep = (Math.PI * 2) / sides;
    const vertices: number[] = [];
    
    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep;
      vertices.push(
        Math.cos(angle) * shieldRadius,
        Math.sin(angle) * shieldRadius
      );
    }
    
    this.shieldGraphics.poly(vertices);
    this.shieldGraphics.stroke({ 
      width: 2, 
      color: shieldColor, 
      alpha: 0.3 * this.health / 3 
    });
  }
  
  /**
   * Boss takes damage but doesn't die immediately
   */
  takeDamage(): boolean {
    this.health--;
    
    if (this.health <= 0) {
      this.destroy();
      return true; // Boss destroyed
    }
    
    // Flash effect when hit
    const originalAlpha = this.sprite.alpha;
    this.sprite.alpha = 0.5;
    setTimeout(() => {
      if (!this.sprite.destroyed) {
        this.sprite.alpha = originalAlpha;
      }
    }, 100);
    
    return false; // Boss still alive
  }
  
  destroy() {
    if (!this.alive) return;
    
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