/**
 * ComboEffects - Advanced combo visual effects system
 * Designed for maximum game feel and player satisfaction
 */

import * as PIXI from 'pixi.js';
import { MessageDisplay } from '../modules/MessageDisplay';

export interface ComboTier {
  threshold: number;
  color: number;
  secondaryColor: number;
  name: string;
  scale: number;
  particles: number;
  screenEffect: boolean;
}

/**
 * Combo tier definitions for progressive visual feedback
 */
export const COMBO_TIERS: ComboTier[] = [
  { threshold: 2, color: 0x00FFFF, secondaryColor: 0x0088FF, name: "DOUBLE", scale: 1.0, particles: 5, screenEffect: false },
  { threshold: 3, color: 0x00FF88, secondaryColor: 0x00FFFF, name: "TRIPLE", scale: 1.1, particles: 8, screenEffect: false },
  { threshold: 4, color: 0x44FF44, secondaryColor: 0x88FF88, name: "QUAD", scale: 1.15, particles: 10, screenEffect: false },
  { threshold: 5, color: 0x88FF00, secondaryColor: 0xFFFF00, name: "COMBO", scale: 1.2, particles: 12, screenEffect: false },
  { threshold: 10, color: 0xFF00FF, secondaryColor: 0xFF88FF, name: "MEGA", scale: 1.4, particles: 20, screenEffect: true },
  { threshold: 15, color: 0xFF8800, secondaryColor: 0xFFFF00, name: "ULTRA", scale: 1.6, particles: 30, screenEffect: true },
  { threshold: 20, color: 0xFFD700, secondaryColor: 0xFFFFFF, name: "EPIC", scale: 2.0, particles: 50, screenEffect: true },
  { threshold: 30, color: 0xFF00FF, secondaryColor: 0x00FFFF, name: "LEGENDARY", scale: 2.5, particles: 100, screenEffect: true },
];

export class ComboEffects {
  private app: PIXI.Application;
  private screenFlash: PIXI.Graphics | null = null;
  private comboParticles: PIXI.Container;
  private comboTimer: number = 0;
  private shakeIntensity: number = 0;
  private originalStagePosition: { x: number; y: number } = { x: 0, y: 0 };
  private messageDisplay: MessageDisplay;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    this.comboParticles = new PIXI.Container();
    this.app.stage.addChild(this.comboParticles);
    this.messageDisplay = new MessageDisplay(app);
    this.setupComboUI();
  }
  
  /**
   * Setup persistent combo UI elements
   */
  private setupComboUI(): void {
    // Create screen flash overlay only (removed combo meter and text)
    this.screenFlash = new PIXI.Graphics();
    this.screenFlash.zIndex = 999;
    this.screenFlash.alpha = 0;
    this.app.stage.addChild(this.screenFlash);
  }
  
  /**
   * Get combo tier based on combo count
   */
  private getComboTier(combo: number): ComboTier {
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (combo >= COMBO_TIERS[i].threshold) {
        return COMBO_TIERS[i];
      }
    }
    return COMBO_TIERS[0];
  }
  
  /**
   * Create stylish combo text with effects
   */
  
  /**
   * Set current wave for combo threshold calculation
   */
  setWave(wave: number): void {
    this.messageDisplay.setWave(wave);
  }
  
  createComboDisplay(
    combo: number,
    x: number,
    y: number,
    _multiplier: number
  ): void {
    // Delegate text display to MessageDisplay
    this.messageDisplay.displayCombo(combo, x, y);
    
    // Get tier for particle effects
    const tier = this.getComboTier(combo);
    
    // Update combo timer
    this.comboTimer = 2000; // 2 seconds
    
    // Create particles
    this.createComboParticles(x, y, tier);
    
    // Screen effects for big combos
    if (tier.screenEffect) {
      this.triggerScreenEffect(tier);
      this.startScreenShake(tier.scale * 2);
    }
  }
  
  /**
   * Create particle burst for combos
   */
  private createComboParticles(x: number, y: number, tier: ComboTier): void {
    for (let i = 0; i < tier.particles; i++) {
      const particle = new PIXI.Graphics();
      const size = 2 + Math.random() * 4;
      const color = Math.random() > 0.5 ? tier.color : tier.secondaryColor;
      
      // Star shape for high combos
      if (tier.threshold >= 10) {
        this.drawStar(particle, 0, 0, size * 2, size, 5, color);
      } else {
        particle.circle(0, 0, size);
        particle.fill({ color, alpha: 1 });
      }
      
      particle.x = x;
      particle.y = y;
      
      const angle = (Math.PI * 2 * i) / tier.particles + Math.random() * 0.5;
      const speed = 100 + Math.random() * 200;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      
      this.comboParticles.addChild(particle);
      
      // Animate particle
      let particleFrame = 0;
      const maxParticleFrames = 60;
      
      const animateParticle = () => {
        particleFrame++;
        
        if (!particle || particle.destroyed || particleFrame > maxParticleFrames) {
          this.app.ticker.remove(animateParticle);
          if (particle && !particle.destroyed) {
            this.comboParticles.removeChild(particle);
            particle.destroy();
          }
          return;
        }
        
        const dt = 1 / 60;
        particle.x += vx * dt;
        particle.y += vy * dt + particleFrame * 0.5; // Gravity
        particle.alpha = 1 - (particleFrame / maxParticleFrames);
        particle.rotation += 0.1;
        particle.scale.set(1 - (particleFrame / maxParticleFrames) * 0.5);
      };
      
      this.app.ticker.add(animateParticle);
    }
  }
  
  /**
   * Create boss level announcement
   */
  createBossAnnouncement(): void {
    // Delegate text display to MessageDisplay
    this.messageDisplay.displayBossAnnouncement();
    
    // Trigger screen effects
    this.triggerScreenEffect({
      threshold: 0,
      color: 0xFF00FF,
      secondaryColor: 0x00FFFF,
      name: "BOSS",
      scale: 2.0,
      particles: 50,
      screenEffect: true
    });
  }
  
  /**
   * Draw a star shape
   */
  private drawStar(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    outerRadius: number,
    innerRadius: number,
    points: number,
    color: number
  ): void {
    const step = Math.PI / points;
    const vertices: number[] = [];
    
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = i * step - Math.PI / 2;
      vertices.push(
        x + Math.cos(angle) * radius,
        y + Math.sin(angle) * radius
      );
    }
    
    graphics.poly(vertices);
    graphics.fill({ color, alpha: 1 });
  }
  
  /**
   * Trigger screen-wide visual effect
   */
  private triggerScreenEffect(tier: ComboTier): void {
    if (!this.screenFlash) return;
    
    this.screenFlash.clear();
    this.screenFlash.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.screenFlash.fill({ color: tier.color, alpha: 0.3 });
    
    // Fade out flash
    let flashFrame = 0;
    const maxFlashFrames = 20;
    
    const animateFlash = () => {
      flashFrame++;
      
      if (flashFrame > maxFlashFrames) {
        this.app.ticker.remove(animateFlash);
        if (this.screenFlash) {
          this.screenFlash.alpha = 0;
        }
        return;
      }
      
      if (this.screenFlash) {
        this.screenFlash.alpha = 0.3 * (1 - flashFrame / maxFlashFrames);
      }
    };
    
    this.app.ticker.add(animateFlash);
  }
  
  /**
   * Start screen shake effect
   */
  private startScreenShake(intensity: number): void {
    this.shakeIntensity = intensity;
    this.originalStagePosition = {
      x: this.app.stage.x,
      y: this.app.stage.y
    };
  }
  
  
  /**
   * Update effects (call each frame)
   */
  update(dt: number): void {
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }
    
    // Update screen shake
    if (this.shakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity;
      this.app.stage.x = this.originalStagePosition.x + shakeX;
      this.app.stage.y = this.originalStagePosition.y + shakeY;
      
      this.shakeIntensity *= 0.95; // Decay
      
      if (this.shakeIntensity < 0.1) {
        this.shakeIntensity = 0;
        this.app.stage.x = this.originalStagePosition.x;
        this.app.stage.y = this.originalStagePosition.y;
      }
    }
  }
  
  /**
   * Reset combo display
   */
  resetCombo(): void {
    this.comboTimer = 0;
    // Removed combo meter and text clearing
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    // Clean up message display
    this.messageDisplay.clearActiveMessages();
    
    // Clean up screen effects
    if (this.screenFlash) {
      this.screenFlash.destroy();
    }
    this.comboParticles.destroy({ children: true });
  }
}