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
   * Display combo text on screen - EXACT SAME AS BOSS!
   */
  displayCombo(combo: number, _x: number, _y: number): void {
    // Check if combo meets wave threshold
    const minThreshold = this.getMinComboThreshold(this.currentWave);
    if (combo < minThreshold) {
      console.log(`[COMBO] Suppressed ${combo}x combo (min threshold: ${minThreshold}x for wave ${this.currentWave})`);
      return;
    }
    
    const tier = this.getComboTier(combo);
    const comboTextString = combo >= 20 ? `${tier.name}!\n${combo}x COMBO!` : `${combo}x ${tier.name}!`;
    
    // EXACT SAME CALL AS BOSS - only text different!
    this.displayMessage(comboTextString);
  }
  
  
  /**
   * THE ONE MESSAGE DISPLAY FUNCTION - SUPER DRY!
   */
  displayMessage(text: string): void {
    // Fixed color - magenta for ALL messages
    const color = 0xFF00FF;
    
    // Fixed position - center for ALL messages
    const x = this.app.screen.width / 2;
    const y = this.app.screen.height / 3;
    // Calculate font size
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    const fontSize = isMobile ? 
      Math.min(screenWidth * 0.1, 36) : 
      48;
    
    // Create text
    const messageText = new PIXI.Text({
      text: text,
      style: {
        fontFamily: 'Arial',
        fontSize: fontSize,
        fontWeight: 'bold',
        fill: color,
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: color,
          distance: 0
        },
        stroke: { color: 0xFFFFFF, width: 3 },
      }
    });
    
    // Position text
    messageText.anchor.set(0.5);
    messageText.x = x;
    messageText.y = y;
    messageText.zIndex = 9999;
    messageText.alpha = 1;
    
    this.app.stage.addChild(messageText);
    
    // Animate - EXACT SAME AS BOSS!
    let frame = 0;
    const animationDuration = 180; // 3 seconds at 60fps
    
    const animate = () => {
      frame++;
      
      // Pulse effect
      const pulse = 1 + Math.sin(frame * 0.1) * 0.1;
      messageText.scale.set(pulse);
      
      // Rotation wobble
      messageText.rotation = Math.sin(frame * 0.05) * 0.02;
      
      // Fade out after 2 seconds
      if (frame > 120) {
        messageText.alpha = Math.max(0, 1 - (frame - 120) / 60);
      }
      
      if (frame >= animationDuration) {
        this.app.ticker.remove(animate);
        this.app.stage.removeChild(messageText);
        messageText.destroy();
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