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
    } else if (combo >= 9) {
      return {
        threshold: 9,
        name: "RAMPAGE",
        color: 0xFF1493, // Deep Pink
        secondaryColor: 0xFF00FF,
        scale: 2.2,
        particles: 70,
        screenEffect: true
      };
    } else if (combo >= 8) {
      return {
        threshold: 8,
        name: "BRUTAL",
        color: 0x8B008B, // Dark Magenta
        secondaryColor: 0xFF00FF,
        scale: 2.1,
        particles: 65,
        screenEffect: true
      };
    } else if (combo >= 7) {
      return {
        threshold: 7,
        name: "MONSTER",
        color: 0x9400D3, // Purple
        secondaryColor: 0xFF00FF,
        scale: 2.0,
        particles: 60,
        screenEffect: true
      };
    } else if (combo >= 6) {
      return {
        threshold: 6,
        name: "HEXA",
        color: 0xFFA500, // Orange
        secondaryColor: 0xFF0000,
        scale: 1.9,
        particles: 50,
        screenEffect: false
      };
    } else if (combo >= 5) {
      return {
        threshold: 5,
        name: "PENTA",
        color: 0xFF0000, // Red
        secondaryColor: 0xFFA500,
        scale: 1.8,
        particles: 40,
        screenEffect: false
      };
    } else if (combo >= 4) {
      return {
        threshold: 4,
        name: "QUAD",
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
   * Get minimum combo to display based on wave - RELAXED: Hide 2x at wave 4, then increase every 8 waves!
   */
  private getMinComboThreshold(wave: number): number {
    if (wave <= 3) return 2;      // Waves 1-3: show ALL combos (2x and up)
    if (wave <= 11) return 3;     // Waves 4-11: show 3x and up (8 waves)
    if (wave <= 19) return 4;     // Waves 12-19: show 4x and up (8 waves)
    if (wave <= 27) return 5;     // Waves 20-27: show 5x and up (8 waves)
    if (wave <= 35) return 7;     // Waves 28-35: show 7x and up (8 waves)
    if (wave <= 43) return 10;    // Waves 36-43: show 10x and up (8 waves)
    if (wave <= 51) return 15;    // Waves 44-51: show 15x and up (8 waves)
    if (wave <= 59) return 20;    // Waves 52-59: show 20x and up (8 waves)
    return 30;                     // Waves 60+: show 30x and up only!
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
    // COOL COMBO NAMES - Show the number AND the cool name!
    // Like "2x DOUBLE", "3x TRIPLE", "4x QUAD", "5x PENTA", etc.
    const comboTextString = `${combo}x ${tier.name}`;
    
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
   * OLD EXACT STYLE WITH PROPER ANIMATION!
   */
  private displayOldStyleMessage(text: string, color: number, x: number, y: number, scale: number): void {
    // Calculate font size - EXACT OLD FORMULA!
    const screenWidth = this.app.screen.width;
    const screenHeight = this.app.screen.height;
    const isMobile = screenWidth < 768;
    
    // OLD EXACT: Mobile gets 15% of width max, Desktop 10% max
    const maxFontSize = isMobile ? 
      Math.min(screenWidth * 0.15, 60) : 
      Math.min(screenWidth * 0.1, 100);
    
    // OLD EXACT: Base was 24 (LARGE) + scale difference * 20
    const baseFontSize = 24 + (scale - 1) * 20;
    const fontSize = Math.min(baseFontSize, maxFontSize);
    
    // Determine if this is a big combo (10+ has scale >= 1.4)
    const isBigCombo = scale >= 1.4;
    const isEpicCombo = scale >= 2.0;
    
    // Create text with EXACT OLD STYLE
    const messageText = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Space Mono, monospace', // OLD used Space Mono!
        fontSize: fontSize,
        fontWeight: 'bold',
        fontStyle: isBigCombo ? 'italic' : 'normal', // Italic for 10+
        fill: color,
        stroke: { 
          color: isEpicCombo ? 0xFFFFFF : 0x000000, // White for 20+, black otherwise
          width: isBigCombo ? 5 : 3 
        },
        align: 'center',
        dropShadow: {
          color: color,
          blur: isBigCombo ? 12 : 6,
          angle: Math.PI / 4,
          distance: 4,
          alpha: 0.8
        },
        letterSpacing: isBigCombo ? 3 : 1
      }
    });
    
    // EXACT OLD POSITIONING - clamp to screen with padding!
    messageText.anchor.set(0.5);
    const padding = fontSize * 0.5;
    messageText.x = Math.max(padding, Math.min(x, screenWidth - padding));
    messageText.y = Math.max(padding, Math.min(y, screenHeight - padding));
    messageText.scale.set(0.1); // Start at 0.1 for punch
    messageText.rotation = (Math.random() - 0.5) * 0.2; // ±0.2 radians random
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
   * Display boss level announcement - CENTER SCREEN WITH UNIQUE ANIMATION!
   */
  displayBossAnnouncement(): void {
    console.log('[BOSS ANNOUNCEMENT] Starting boss announcement');
    
    // Boss message: Center of screen, magenta color, special animation
    const text = 'BOSS LEVEL!';
    const color = 0xFF00FF; // Magenta
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 2; // CENTER of screen!
    
    // Special boss animation - pulsing zoom effect
    this.displayBossMessage(text, color, x, y);
  }
  
  /**
   * Special boss message with unique pulsing animation
   */
  private displayBossMessage(text: string, color: number, x: number, y: number): void {
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    
    // Responsive font for boss announcement - SMALLER to account for ANIMATION SCALING!
    const fontSize = isMobile ? 
      Math.min(screenWidth * 0.08, 36) :  // Mobile: 8% of width max, cap at 36px (animation scales to 1.2x)
      Math.min(screenWidth * 0.08, 60);    // Desktop: 8% of width max, cap at 60px
    
    const messageText = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Space Mono, monospace',
        fontSize: fontSize,
        fontWeight: 'bold',
        fontStyle: 'italic',
        fill: color,
        stroke: { 
          color: 0xFFFFFF, // White outline
          width: isMobile ? 4 : 6  // Thinner stroke on mobile
        },
        align: 'center',
        dropShadow: {
          color: color,
          blur: 20,
          angle: Math.PI / 4,
          distance: 0,
          alpha: 1
        },
        letterSpacing: 5
      }
    });
    
    // Center positioning
    messageText.anchor.set(0.5);
    messageText.x = x;
    messageText.y = y;
    messageText.scale.set(0); // Start at 0 for zoom in
    messageText.zIndex = 9999; // On top of everything
    messageText.alpha = 1;
    
    this.app.stage.addChild(messageText);
    
    // BOSS ANIMATION - Zoom in, pulse, then fade
    let frame = 0;
    const maxFrames = 180; // 3 seconds
    
    const animate = () => {
      frame++;
      
      if (frame > maxFrames) {
        this.app.ticker.remove(animate);
        this.app.stage.removeChild(messageText);
        messageText.destroy();
        return;
      }
      
      // Phase 1: Zoom in (frames 1-20) - SMALLER TARGET SCALE
      if (frame <= 20) {
        const t = frame / 20;
        const easeOut = 1 - Math.pow(1 - t, 3);
        messageText.scale.set(easeOut * 0.9);  // Max scale 0.9 instead of 1.2
      }
      // Phase 2: Pulse effect (frames 21-120) - GENTLER PULSE
      else if (frame <= 120) {
        const pulse = 0.9 + Math.sin((frame - 20) * 0.15) * 0.1;  // Pulse between 0.8 and 1.0
        messageText.scale.set(pulse);
        messageText.rotation = Math.sin((frame - 20) * 0.05) * 0.02;
      }
      // Phase 3: Zoom out and fade (frames 121-180)
      else {
        const t = (frame - 120) / 60;
        messageText.scale.set(0.9 * (1 + t * 0.3));  // Less zoom out
        messageText.alpha = 1 - t;
      }
    };
    
    this.app.ticker.add(animate);
  }
  
  /**
   * Clear any active messages
   */
  clearActiveMessages(): void {
    // Nothing to clear - messages clean themselves up!
    // Stupid simple = no state tracking needed
  }
}