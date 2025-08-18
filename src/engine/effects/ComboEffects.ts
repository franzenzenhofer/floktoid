/**
 * ComboEffects - Advanced combo visual effects system
 * Designed for maximum game feel and player satisfaction
 */

import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';

const { VISUALS, UI } = CentralConfig;

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
  private currentWave: number = 1;
  private comboTimer: number = 0;
  private shakeIntensity: number = 0;
  private originalStagePosition: { x: number; y: number } = { x: 0, y: 0 };
  private activeComboText: PIXI.Text | null = null;
  private comboTextAnimationActive: boolean = false;
  
  constructor(app: PIXI.Application) {
    this.app = app;
    this.comboParticles = new PIXI.Container();
    this.app.stage.addChild(this.comboParticles);
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
   * Get minimum combo to display based on wave - BALANCED PROGRESSION
   */
  private getMinComboThreshold(wave: number): number {
    // ALWAYS show 2x combos! They're exciting and important for gameplay!
    if (wave <= 5) return 2;      // Waves 1-5: show ALL combos (2x and up)
    if (wave <= 10) return 3;     // Waves 6-10: show 3x and up
    if (wave <= 15) return 4;     // Waves 11-15: show 4x and up
    if (wave <= 20) return 5;     // Waves 16-20: show 5x and up
    if (wave <= 30) return 7;     // Waves 21-30: show 7x and up
    if (wave <= 40) return 10;    // Waves 31-40: show 10x and up
    if (wave <= 50) return 15;    // Waves 41-50: show 15x and up
    return 20;                     // Waves 50+: show 20x and up only!
  }
  
  /**
   * Set current wave for combo threshold calculation
   */
  setWave(wave: number): void {
    this.currentWave = wave;
  }
  
  createComboDisplay(
    combo: number,
    x: number,
    y: number,
    _multiplier: number
  ): void {
    // CRITICAL FIX: Prevent multiple overlapping combo texts!
    // If a combo animation is already active, skip creating a new one
    if (this.comboTextAnimationActive) {
      console.log(`[COMBO] Skipping combo display - animation already active`);
      return;
    }
    
    // Check if combo meets wave threshold
    const minThreshold = this.getMinComboThreshold(this.currentWave);
    // CRITICAL FIX: Show combo if it's EQUAL TO or greater than threshold!
    if (combo < minThreshold) {
      console.log(`[COMBO] Suppressed ${combo}x combo (min threshold: ${minThreshold}x for wave ${this.currentWave})`);
      return; // Don't display combos below threshold
    }
    const tier = this.getComboTier(combo);
    
    // Update combo timer
    this.comboTimer = 2000; // 2 seconds
    
    // Create main combo text - MOBILE RESPONSIVE!
    // Calculate base font size with screen-aware scaling
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isMobile = screenWidth < 768; // Mobile breakpoint
    
    // Limit font size based on screen size to ensure visibility
    const maxFontSize = isMobile ? 
      Math.min(screenWidth * 0.15, 60) : // Mobile: max 15% of width or 60px
      Math.min(screenWidth * 0.1, 100); // Desktop: max 10% of width or 100px
    
    const baseFontSize = UI.FONTS.SIZES.LARGE + (tier.scale - 1) * 20;
    const fontSize = Math.min(baseFontSize, maxFontSize);
    
    // CRITICAL FIX: Destroy any existing combo text before creating new one
    if (this.activeComboText && !this.activeComboText.destroyed) {
      this.app.stage.removeChild(this.activeComboText);
      this.activeComboText.destroy();
      this.activeComboText = null;
    }
    
    const comboText = new PIXI.Text(
      combo >= 20 ? `${tier.name}!\n${combo}x COMBO!` : `${combo}x ${tier.name}!`,
      {
        fontFamily: UI.FONTS.PRIMARY,
        fontSize: fontSize,
        fontWeight: 'bold',
        fontStyle: combo >= 10 ? 'italic' : 'normal',
        fill: tier.color, // Use primary color (gradients cause PIXI errors)
        stroke: { 
          color: combo >= 20 ? 0xFFFFFF : VISUALS.COLORS.BLACK, 
          width: combo >= 10 ? 5 : 3 
        },
        align: 'center',
        dropShadow: {
          color: tier.color,
          blur: combo >= 10 ? 12 : 6,
          angle: Math.PI / 4,
          distance: 4,
          alpha: 0.8
        },
        letterSpacing: combo >= 10 ? 3 : 1
      }
    );
    
    // Store reference to active combo text
    this.activeComboText = comboText;
    this.comboTextAnimationActive = true;
    
    comboText.anchor.set(0.5);
    // Ensure text stays within screen bounds
    const padding = fontSize * 0.5;
    comboText.x = Math.max(padding, Math.min(x, screenWidth - padding));
    comboText.y = Math.max(padding, Math.min(y, screenHeight - padding));
    comboText.scale.set(0.1); // Start small for punch-in effect
    comboText.rotation = (Math.random() - 0.5) * 0.2; // Slight random rotation
    comboText.zIndex = 1002;
    this.app.stage.addChild(comboText);
    
    // Create particles
    this.createComboParticles(x, y, tier);
    
    // Screen effects for big combos
    if (tier.screenEffect) {
      this.triggerScreenEffect(tier);
      this.startScreenShake(tier.scale * 2);
    }
    
    // Animate combo text
    this.animateComboText(comboText, tier);
    
    // Removed combo meter update
  }
  
  /**
   * Animate combo text with punch and fade
   */
  private animateComboText(text: PIXI.Text, tier: ComboTier): void {
    let frame = 0;
    const maxFrames = 120;
    
    // MOBILE-AWARE SCALING: Cap scale based on screen size
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    
    // Calculate max safe scale to keep text on screen
    // We already limited font size, so don't scale up too much
    const maxSafeScale = isMobile ? 1.0 : 1.5; // Mobile: no scaling, Desktop: up to 1.5x
    const targetScale = Math.min(tier.scale, maxSafeScale);
    
    const animate = () => {
      frame++;
      
      if (!text || text.destroyed || frame > maxFrames) {
        this.app.ticker.remove(animate);
        if (text && !text.destroyed) {
          text.destroy();
        }
        // Clear the active text reference and animation flag
        if (this.activeComboText === text) {
          this.activeComboText = null;
        }
        this.comboTextAnimationActive = false;
        return;
      }
      
      // Punch-in effect (first 10 frames) - REDUCED OVERSHOOT
      if (frame <= 10) {
        const t = frame / 10;
        const easeOut = 1 - Math.pow(1 - t, 3);
        const overshoot = isMobile ? 1.1 : 1.2; // Less overshoot on mobile
        text.scale.set(0.1 + (targetScale * overshoot - 0.1) * easeOut);
      }
      // Bounce back (frames 10-20)
      else if (frame <= 20) {
        const t = (frame - 10) / 10;
        const easeIn = t * t;
        const overshoot = isMobile ? 0.1 : 0.2; // Less bounce on mobile
        text.scale.set(targetScale * (1 + overshoot) - (overshoot * targetScale) * easeIn);
      }
      // Float up and fade (frames 20+)
      else {
        const t = (frame - 20) / (maxFrames - 20);
        text.y -= 1.5;
        text.alpha = 1 - t;
        text.scale.set(targetScale + t * 0.2);
        text.rotation += 0.01 * (tier.threshold >= 10 ? 1 : 0);
      }
    };
    
    this.app.ticker.add(animate);
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
    console.log('[BOSS ANNOUNCEMENT] Starting boss announcement creation');
    
    // MOBILE RESPONSIVE font sizing
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    const fontSize = isMobile ? 
      Math.min(screenWidth * 0.1, 36) : // Mobile: max 10% of width or 36px
      48; // Desktop: 48px
    
    const bossText = new PIXI.Text({
      text: 'BOSS LEVEL!',
      style: {
        fontFamily: 'Arial',
        fontSize: fontSize,
        fontWeight: 'bold',
        fill: 0xFF00FF, // Simple magenta color
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: 0xFF00FF,
          distance: 0
        },
        stroke: { color: 0xFFFFFF, width: 3 },
      }
    });
    
    // Center on screen
    bossText.anchor.set(0.5);
    bossText.x = this.app.screen.width / 2;
    bossText.y = this.app.screen.height / 3;
    
    // Ensure visibility
    bossText.zIndex = 9999;
    bossText.alpha = 1;
    
    console.log('[BOSS ANNOUNCEMENT] Adding text to stage at:', bossText.x, bossText.y);
    this.comboParticles.addChild(bossText);
    console.log('[BOSS ANNOUNCEMENT] Text added, parent:', bossText.parent ? 'YES' : 'NO');
    
    // Animation with scale pulse and fade
    let frame = 0;
    const animationDuration = 180; // 3 seconds at 60fps
    
    const animate = () => {
      frame++;
      
      // Pulse effect
      const pulse = 1 + Math.sin(frame * 0.1) * 0.1;
      bossText.scale.set(pulse);
      
      // Rotation wobble
      bossText.rotation = Math.sin(frame * 0.05) * 0.02;
      
      // Fade out after 2 seconds
      if (frame > 120) {
        bossText.alpha = Math.max(0, 1 - (frame - 120) / 60);
      }
      
      if (frame >= animationDuration) {
        this.app.ticker.remove(animate);
        this.comboParticles.removeChild(bossText);
        bossText.destroy();
      }
    };
    
    this.app.ticker.add(animate);
    
    // Also trigger screen flash in magenta
    this.triggerScreenEffect({
      threshold: 0,
      color: 0xFF00FF,
      secondaryColor: 0x00FFFF,
      name: "BOSS",
      scale: 2.0,
      particles: 50,
      screenEffect: true
    });
    
    // Create particle burst (method not implemented yet)
    // this.createParticleBurst(
    //   this.app.screen.width / 2,
    //   this.app.screen.height / 3,
    //   0xFF00FF,
    //   50
    // );
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
    // Clean up active combo text
    if (this.activeComboText && !this.activeComboText.destroyed) {
      this.activeComboText.destroy();
      this.activeComboText = null;
    }
    this.comboTextAnimationActive = false;
    
    // Removed combo meter and text destruction
    if (this.screenFlash) {
      this.screenFlash.destroy();
    }
    this.comboParticles.destroy({ children: true });
  }
}