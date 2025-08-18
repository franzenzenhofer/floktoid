/**
 * MessageDisplay - Handles on-screen messages like combos and boss announcements
 * Extracted from ComboEffects to separate message display from particle effects
 */

import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';

const { VISUALS, UI } = CentralConfig;

interface ComboTier {
  threshold: number;
  name: string;
  color: number;
  secondaryColor: number;
  scale: number;
  particles: number;
  screenEffect: boolean;
}

export class MessageDisplay {
  private app: PIXI.Application;
  private activeComboText: PIXI.Text | null = null;
  private comboTextAnimationActive = false;
  private currentWave = 1;
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  /**
   * Set current wave for combo threshold calculation
   */
  setWave(wave: number): void {
    this.currentWave = wave;
  }
  
  /**
   * Get combo tier information
   */
  private getComboTier(combo: number): ComboTier {
    if (combo >= 20) {
      return {
        threshold: 20,
        name: "GODLIKE",
        color: 0xFFD700, // Gold
        secondaryColor: 0xFFFFFF,
        scale: 3.0,
        particles: 100,
        screenEffect: true
      };
    } else if (combo >= 10) {
      return {
        threshold: 10,
        name: "LEGENDARY",
        color: 0xFF00FF, // Magenta
        secondaryColor: 0x00FFFF,
        scale: 2.5,
        particles: 80,
        screenEffect: true
      };
    } else if (combo >= 7) {
      return {
        threshold: 7,
        name: "EPIC",
        color: 0x9400D3, // Purple
        secondaryColor: 0xFF00FF,
        scale: 2.0,
        particles: 60,
        screenEffect: true
      };
    } else if (combo >= 5) {
      return {
        threshold: 5,
        name: "MEGA",
        color: 0xFF0000, // Red
        secondaryColor: 0xFFA500,
        scale: 1.8,
        particles: 40,
        screenEffect: false
      };
    } else if (combo >= 4) {
      return {
        threshold: 4,
        name: "SUPER",
        color: 0x00FF00, // Green
        secondaryColor: 0xFFFF00,
        scale: 1.6,
        particles: 30,
        screenEffect: false
      };
    } else if (combo >= 3) {
      return {
        threshold: 3,
        name: "TRIPLE",
        color: 0x00FFFF, // Cyan
        secondaryColor: 0x0000FF,
        scale: 1.4,
        particles: 20,
        screenEffect: false
      };
    } else {
      return {
        threshold: 2,
        name: "DOUBLE",
        color: 0xFFFF00, // Yellow
        secondaryColor: 0xFFA500,
        scale: 1.2,
        particles: 10,
        screenEffect: false
      };
    }
  }
  
  /**
   * Get minimum combo to display based on wave
   */
  private getMinComboThreshold(wave: number): number {
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
   * Display combo text on screen
   */
  displayCombo(combo: number, x: number, y: number): void {
    // Prevent multiple overlapping combo texts
    if (this.comboTextAnimationActive) {
      console.log(`[COMBO] Skipping combo display - animation already active`);
      return;
    }
    
    // Check if combo meets wave threshold
    const minThreshold = this.getMinComboThreshold(this.currentWave);
    if (combo < minThreshold) {
      console.log(`[COMBO] Suppressed ${combo}x combo (min threshold: ${minThreshold}x for wave ${this.currentWave})`);
      return;
    }
    
    const tier = this.getComboTier(combo);
    
    // Calculate font size
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isMobile = screenWidth < 768;
    
    const maxFontSize = isMobile ? 
      Math.min(screenWidth * 0.15, 60) : 
      Math.min(screenWidth * 0.1, 100);
    
    const baseFontSize = UI.FONTS.SIZES.LARGE + (tier.scale - 1) * 20;
    const fontSize = Math.min(baseFontSize, maxFontSize);
    
    // Destroy any existing combo text
    if (this.activeComboText && !this.activeComboText.destroyed) {
      this.app.stage.removeChild(this.activeComboText);
      this.activeComboText.destroy();
      this.activeComboText = null;
    }
    
    // Create combo text
    const comboText = new PIXI.Text({
      text: combo >= 20 ? `${tier.name}!\n${combo}x COMBO!` : `${combo}x ${tier.name}!`,
      style: {
        fontFamily: UI.FONTS.PRIMARY,
        fontSize: fontSize,
        fontWeight: 'bold',
        fontStyle: combo >= 10 ? 'italic' : 'normal',
        fill: tier.color,
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
    });
    
    // Store reference
    this.activeComboText = comboText;
    this.comboTextAnimationActive = true;
    
    // Position text
    comboText.anchor.set(0.5);
    const padding = fontSize * 0.5;
    comboText.x = Math.max(padding, Math.min(x, screenWidth - padding));
    comboText.y = Math.max(padding, Math.min(y, screenHeight - padding));
    comboText.scale.set(0.1);
    comboText.rotation = (Math.random() - 0.5) * 0.2;
    comboText.zIndex = 1002;
    this.app.stage.addChild(comboText);
    
    // Animate
    this.animateComboText(comboText, tier);
  }
  
  /**
   * Animate combo text with punch and fade
   */
  private animateComboText(text: PIXI.Text, tier: ComboTier): void {
    let frame = 0;
    const maxFrames = 120;
    
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    const maxSafeScale = isMobile ? 1.0 : 1.5;
    const targetScale = Math.min(tier.scale, maxSafeScale);
    
    const animate = () => {
      frame++;
      
      if (!text || text.destroyed || frame > maxFrames) {
        this.app.ticker.remove(animate);
        if (text && !text.destroyed) {
          text.destroy();
        }
        
        if (this.activeComboText === text) {
          this.activeComboText = null;
          this.comboTextAnimationActive = false;
        }
        return;
      }
      
      // Punch-in effect (first 20 frames)
      if (frame <= 20) {
        const progress = frame / 20;
        const easeOut = 1 - Math.pow(1 - progress, 3);
        text.scale.set(0.1 + (targetScale - 0.1) * easeOut);
      }
      
      // Float and rotate (frames 20-80)
      else if (frame <= 80) {
        text.y -= 0.5;
        text.rotation = Math.sin(frame * 0.1) * 0.05;
        
        // Pulse effect for high combos
        if (tier.threshold >= 5) {
          const pulse = 1 + Math.sin(frame * 0.2) * 0.05;
          text.scale.set(targetScale * pulse);
        }
      }
      
      // Fade out (frames 80-120)
      else {
        const fadeProgress = (frame - 80) / 40;
        text.alpha = 1 - fadeProgress;
        text.scale.set(targetScale * (1 - fadeProgress * 0.3));
      }
    };
    
    this.app.ticker.add(animate);
  }
  
  /**
   * Display boss level announcement
   */
  displayBossAnnouncement(): void {
    console.log('[BOSS ANNOUNCEMENT] Starting boss announcement');
    
    // Calculate font size
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    const fontSize = isMobile ? 
      Math.min(screenWidth * 0.1, 36) : 
      48;
    
    // Create boss text
    const bossText = new PIXI.Text({
      text: 'BOSS LEVEL!',
      style: {
        fontFamily: 'Arial',
        fontSize: fontSize,
        fontWeight: 'bold',
        fill: 0xFF00FF,
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
    
    // Position text
    bossText.anchor.set(0.5);
    bossText.x = this.app.screen.width / 2;
    bossText.y = this.app.screen.height / 3;
    bossText.zIndex = 9999;
    bossText.alpha = 1;
    
    this.app.stage.addChild(bossText);
    
    // Animate
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
        this.app.stage.removeChild(bossText);
        bossText.destroy();
      }
    };
    
    this.app.ticker.add(animate);
  }
  
  /**
   * Clear any active messages
   */
  clearActiveMessages(): void {
    if (this.activeComboText && !this.activeComboText.destroyed) {
      this.app.stage.removeChild(this.activeComboText);
      this.activeComboText.destroy();
      this.activeComboText = null;
      this.comboTextAnimationActive = false;
    }
  }
}