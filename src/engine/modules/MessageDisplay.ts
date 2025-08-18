/**
 * MessageDisplay - Handles on-screen messages like combos and boss announcements
 * Extracted from ComboEffects to separate message display from particle effects
 */

import * as PIXI from 'pixi.js';

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
   * Get minimum combo to display based on wave - PROGRESSIVE FILTER FROM WAVE 4!
   */
  private getMinComboThreshold(wave: number): number {
    if (wave <= 3) return 2;      // Waves 1-3: show ALL combos (2x and up)
    if (wave <= 5) return 3;      // Waves 4-5: show 3x and up
    if (wave <= 8) return 4;      // Waves 6-8: show 4x and up
    if (wave <= 12) return 5;     // Waves 9-12: show 5x and up
    if (wave <= 18) return 7;     // Waves 13-18: show 7x and up
    if (wave <= 25) return 10;    // Waves 19-25: show 10x and up
    if (wave <= 35) return 15;    // Waves 26-35: show 15x and up
    if (wave <= 50) return 20;    // Waves 36-50: show 20x and up
    return 30;                     // Waves 50+: show 30x and up only!
  }
  
  /**
   * Display combo text on screen - OLD STYLE WITH TIER COLORS!
   */
  displayCombo(combo: number, x: number, y: number): void {
    // Check if combo meets wave threshold
    const minThreshold = this.getMinComboThreshold(this.currentWave);
    if (combo < minThreshold) {
      console.log(`[COMBO] Suppressed ${combo}x combo (min threshold: ${minThreshold}x for wave ${this.currentWave})`);
      return;
    }
    
    const tier = this.getComboTier(combo);
    const comboTextString = combo >= 20 ? `${tier.name}!\n${combo}x COMBO!` : `${combo}x ${tier.name}!`;
    
    // OLD STYLE - use tier color, position at kill location, scale by tier!
    this.displayOldStyleMessage(comboTextString, tier.color, x, y, tier.scale);
  }
  
  
  /**
   * THE ONE MESSAGE DISPLAY FUNCTION - OLD STYLE ANIMATION!
   */
  displayMessage(text: string): void {
    // Boss always magenta, center position
    const color = 0xFF00FF;
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 3;
    
    this.displayOldStyleMessage(text, color, x, y, 1.5);
  }
  
  /**
   * OLD STYLE MESSAGE WITH PUNCH ANIMATION!
   */
  private displayOldStyleMessage(text: string, color: number, x: number, y: number, scale: number): void {
    // Calculate font size - MOBILE RESPONSIVE!
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isMobile = screenWidth < 768;
    
    const maxFontSize = isMobile ? 
      Math.min(screenWidth * 0.15, 60) : 
      Math.min(screenWidth * 0.1, 100);
    
    const baseFontSize = 48 + (scale - 1) * 20;
    const fontSize = Math.min(baseFontSize, maxFontSize);
    
    // Create text with OLD STYLE
    const messageText = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Arial',
        fontSize: fontSize,
        fontWeight: 'bold',
        fontStyle: scale >= 1.4 ? 'italic' : 'normal', // Italic for big combos
        fill: color,
        stroke: { 
          color: scale >= 2.0 ? 0xFFFFFF : 0x000000, // White for big, black for small
          width: scale >= 1.4 ? 5 : 3 
        },
        align: 'center',
        dropShadow: {
          color: color,
          blur: scale >= 1.4 ? 12 : 6,
          angle: Math.PI / 4,
          distance: 4,
          alpha: 0.8
        },
        letterSpacing: scale >= 1.4 ? 3 : 1
      }
    });
    
    // Position with screen bounds clamping
    messageText.anchor.set(0.5);
    const padding = fontSize * 0.5;
    messageText.x = Math.max(padding, Math.min(x, screenWidth - padding));
    messageText.y = Math.max(padding, Math.min(y, screenHeight - padding));
    messageText.scale.set(0.1); // Start small for punch-in
    messageText.rotation = (Math.random() - 0.5) * 0.2; // Slight random rotation
    messageText.zIndex = 1002;
    messageText.alpha = 1;
    
    this.app.stage.addChild(messageText);
    
    // OLD STYLE ANIMATION - PUNCH IN, BOUNCE, FLOAT UP!
    let frame = 0;
    const maxFrames = 120;
    const targetScale = Math.min(scale, isMobile ? 1.0 : 1.5);
    
    const animate = () => {
      frame++;
      
      if (frame > maxFrames) {
        this.app.ticker.remove(animate);
        this.app.stage.removeChild(messageText);
        messageText.destroy();
        return;
      }
      
      // PUNCH-IN EFFECT (frames 1-10)
      if (frame <= 10) {
        const t = frame / 10;
        const easeOut = 1 - Math.pow(1 - t, 3);
        const overshoot = isMobile ? 1.1 : 1.2;
        messageText.scale.set(0.1 + (targetScale * overshoot - 0.1) * easeOut);
      }
      // BOUNCE BACK (frames 11-20)
      else if (frame <= 20) {
        const t = (frame - 10) / 10;
        const easeIn = t * t;
        const overshoot = isMobile ? 0.1 : 0.2;
        messageText.scale.set(targetScale * (1 + overshoot) - (overshoot * targetScale) * easeIn);
      }
      // FLOAT UP AND FADE (frames 21+)
      else {
        const t = (frame - 20) / (maxFrames - 20);
        messageText.y -= 1.5; // Float up
        messageText.alpha = 1 - t; // Fade out
        messageText.scale.set(targetScale + t * 0.2); // Grow slightly
        if (scale >= 1.4) {
          messageText.rotation += 0.01; // Rotate for big combos
        }
      }
    };
    
    this.app.ticker.add(animate);
  }
  
  /**
   * Display boss level announcement
   */
  displayBossAnnouncement(): void {
    console.log('[BOSS ANNOUNCEMENT] Starting boss announcement');
    // EXACT SAME CALL AS COMBO - only text different!
    this.displayMessage('BOSS LEVEL!');
  }
  
  /**
   * Clear any active messages
   */
  clearActiveMessages(): void {
    // Nothing to clear - messages clean themselves up!
    // Stupid simple = no state tracking needed
  }
}