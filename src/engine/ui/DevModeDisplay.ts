/**
 * DevModeDisplay - On-screen messages for dev mode
 * Shows spawn notifications and debug info
 */

import * as PIXI from 'pixi.js';

interface SpawnMessage {
  text: string;
  color: number;
  y: number;
  alpha: number;
  lifetime: number;
}

export class DevModeDisplay {
  private app: PIXI.Application;
  private container: PIXI.Container;
  private messages: SpawnMessage[] = [];
  private messageTexts: PIXI.Text[] = [];
  private enabled = false;
  private consoleContainer?: PIXI.Container;
  private consoleText?: PIXI.Text;
  private consoleVisible = true;
  private consoleButton?: PIXI.Graphics;
  
  constructor(app: PIXI.Application, enabled = false) {
    this.app = app;
    this.container = new PIXI.Container();
    this.app.stage.addChild(this.container);
    
    // Check for dev mode from URL params or constructor param
    const urlParams = new URLSearchParams(window.location.search);
    this.enabled = enabled || urlParams.get('dev') === 'true' || urlParams.get('debug') === 'true';
    
    if (this.enabled) {
      this.initConsoleLog();
    }
  }
  
  /**
   * Initialize foldable console log display
   */
  private initConsoleLog(): void {
    // Console container
    this.consoleContainer = new PIXI.Container();
    this.consoleContainer.x = 10;
    this.consoleContainer.y = this.app.screen.height - 200;
    this.container.addChild(this.consoleContainer);
    
    // Background for console
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 400, 180);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    bg.stroke({ width: 2, color: 0x00FFFF });
    this.consoleContainer.addChild(bg);
    
    // Console text
    this.consoleText = new PIXI.Text({
      text: 'DEV CONSOLE\n-----------',
      style: {
        fontFamily: 'monospace',
        fontSize: 10,
        fill: 0x00FF00,
        wordWrap: true,
        wordWrapWidth: 380
      }
    });
    this.consoleText.x = 10;
    this.consoleText.y = 30;
    this.consoleContainer.addChild(this.consoleText);
    
    // Toggle button
    this.consoleButton = new PIXI.Graphics();
    this.consoleButton.rect(0, 0, 100, 20);
    this.consoleButton.fill({ color: 0x00FFFF, alpha: 0.8 });
    this.consoleContainer.addChild(this.consoleButton);
    
    const buttonText = new PIXI.Text({
      text: 'CONSOLE ▼',
      style: {
        fontFamily: 'monospace',
        fontSize: 12,
        fill: 0x000000
      }
    });
    buttonText.x = 10;
    buttonText.y = 2;
    this.consoleButton.addChild(buttonText);
    
    // Make button interactive (only if PIXI events are available)
    if (this.consoleButton.eventMode !== undefined) {
      this.consoleButton.eventMode = 'static';
    }
    if (this.consoleButton.cursor !== undefined) {
      this.consoleButton.cursor = 'pointer';
    }
    if (typeof this.consoleButton.on === 'function') {
      this.consoleButton.on('pointerdown', () => this.toggleConsole());
    }
  }
  
  /**
   * Toggle console visibility
   */
  private toggleConsole(): void {
    this.consoleVisible = !this.consoleVisible;
    if (this.consoleText) {
      this.consoleText.visible = this.consoleVisible;
    }
    
    // Update button text
    const buttonText = this.consoleButton?.children[0] as PIXI.Text;
    if (buttonText) {
      buttonText.text = this.consoleVisible ? 'CONSOLE ▼' : 'CONSOLE ▶';
    }
    
    // Animate fold
    if (this.consoleContainer) {
      const bg = this.consoleContainer.children[0] as PIXI.Graphics;
      if (bg) {
        bg.clear();
        bg.rect(0, 0, 400, this.consoleVisible ? 180 : 20);
        bg.fill({ color: 0x000000, alpha: 0.7 });
        bg.stroke({ width: 2, color: 0x00FFFF });
      }
    }
  }
  
  /**
   * Add spawn message for special birds
   */
  public addSpawnMessage(type: 'super' | 'shooter'): void {
    if (!this.enabled) return;
    
    const message: SpawnMessage = {
      text: type === 'super' 
        ? '⚡ SUPER NAVIGATOR SPAWNED!' 
        : '🔫 SHOOTER BIRD SPAWNED!',
      color: type === 'super' ? 0x00AAFF : 0xFF0000,
      y: 100 + this.messages.length * 30,
      alpha: 1,
      lifetime: 3 // 3 seconds
    };
    
    this.messages.push(message);
    
    // Create text object
    const text = new PIXI.Text({
      text: message.text,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: message.color,
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          alpha: 0.8,
          angle: Math.PI / 2,
          blur: 4,
          color: message.color,
          distance: 0
        }
      }
    });
    
    text.x = this.app.screen.width / 2 - text.width / 2;
    text.y = message.y;
    
    this.container.addChild(text);
    this.messageTexts.push(text);
    
    // Also log to console display
    this.logToConsole(`${type.toUpperCase()} BIRD SPAWNED`);
  }
  
  /**
   * Log to on-screen console
   */
  public logToConsole(message: string): void {
    if (!this.enabled || !this.consoleText || !this.consoleText.text) return;
    
    const lines = (this.consoleText.text || '').split('\n');
    lines.push(`[${new Date().toLocaleTimeString()}] ${message}`);
    
    // Keep only last 8 lines
    if (lines.length > 10) {
      lines.splice(2, lines.length - 10); // Keep header + 8 lines
    }
    
    this.consoleText.text = lines.join('\n');
  }
  
  /**
   * Update display (fade out messages)
   */
  public update(dt: number): void {
    if (!this.enabled) return;
    
    // Update messages
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const message = this.messages[i];
      const text = this.messageTexts[i];
      
      message.lifetime -= dt;
      
      if (message.lifetime <= 0) {
        // Remove expired message
        this.messages.splice(i, 1);
        this.messageTexts.splice(i, 1);
        this.container.removeChild(text);
        text.destroy();
      } else if (message.lifetime < 1) {
        // Fade out
        text.alpha = message.lifetime;
      }
      
      // Float up animation
      text.y -= dt * 20;
    }
  }
  
  /**
   * Check if dev mode is enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }
  
  /**
   * Enable/disable dev mode
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.container.visible = enabled;
    
    if (enabled && !this.consoleContainer) {
      this.initConsoleLog();
    }
  }
}