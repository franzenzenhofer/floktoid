import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';

const { SIZES, VISUALS } = CentralConfig;

export class EnergyDot {
  public x: number;
  public y: number;
  public stolen = false;
  public hue: number;
  
  private sprite: PIXI.Graphics;
  private glowSprite: PIXI.Graphics;
  private app: PIXI.Application;
  private pulsePhase: number;

  constructor(app: PIXI.Application, x: number, y: number, hue: number) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.hue = hue;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    this.glowSprite = new PIXI.Graphics();
    this.sprite = new PIXI.Graphics();
    
    app.stage.addChild(this.glowSprite);
    app.stage.addChild(this.sprite);
    
    this.draw();
    this.app.ticker.add(this.update);
  }
  
  private draw() {
    if (this.stolen) {
      this.sprite.visible = false;
      this.glowSprite.visible = false;
      return;
    }
    
    const color = Math.floor(
      (Math.cos(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((this.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
    const pulse = Math.sin(performance.now() / 1000 * 5 + this.pulsePhase) * (SIZES.ENERGY_DOT.PULSE_MAX_SCALE - SIZES.ENERGY_DOT.PULSE_MIN_SCALE) / 2 + (SIZES.ENERGY_DOT.PULSE_MIN_SCALE + SIZES.ENERGY_DOT.PULSE_MAX_SCALE) / 2;
    
    // Draw glow
    this.glowSprite.clear();
    this.glowSprite.circle(this.x, this.y, SIZES.ENERGY_DOT.RADIUS * SIZES.ENERGY_DOT.GLOW_RADIUS_MULTIPLIER * pulse);
    this.glowSprite.fill({ color, alpha: VISUALS.ALPHA.LOW * pulse });
    
    // Draw dot
    this.sprite.clear();
    this.sprite.circle(this.x, this.y, SIZES.ENERGY_DOT.RADIUS * pulse);
    this.sprite.fill({ color, alpha: VISUALS.ALPHA.FULL });
    
    // Core
    this.sprite.circle(this.x, this.y, SIZES.ENERGY_DOT.RADIUS * 0.3);
    this.sprite.fill({ color: VISUALS.COLORS.WHITE, alpha: VISUALS.ALPHA.FULL });
  }
  
  private update = () => {
    this.draw();
  };
  
  public steal() {
    this.stolen = true;
    this.sprite.visible = false;
    this.glowSprite.visible = false;
  }
  
  public restore() {
    this.stolen = false;
    this.sprite.visible = true;
    this.glowSprite.visible = true;
  }
  
  public destroy() {
    // SAFE: Remove ticker callback to prevent memory leak
    try {
      this.app.ticker.remove(this.update);
    } catch (e) {
      console.warn('[EnergyDot] Failed to remove ticker callback:', e);
    }
    
    // SAFE: Remove sprites only if they have parents
    if (this.sprite.parent) {
      this.app.stage.removeChild(this.sprite);
    }
    if (this.glowSprite.parent) {
      this.app.stage.removeChild(this.glowSprite);
    }
    
    // SAFE: Destroy only if not already destroyed
    if (!this.sprite.destroyed) {
      this.sprite.destroy();
    }
    if (!this.glowSprite.destroyed) {
      this.glowSprite.destroy();
    }
  }
}