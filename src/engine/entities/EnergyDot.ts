import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { hueToRGB } from '../utils/ColorUtils';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { createGraphics, clearGraphics } from '../utils/SpriteFactory';

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
    
    this.glowSprite = createGraphics();
    this.sprite = createGraphics();
    
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
    
    const color = hueToRGB(this.hue);
    
    const pulse = Math.sin(performance.now() / 1000 * 5 + this.pulsePhase) * (SIZES.ENERGY_DOT.PULSE_MAX_SCALE - SIZES.ENERGY_DOT.PULSE_MIN_SCALE) / 2 + (SIZES.ENERGY_DOT.PULSE_MIN_SCALE + SIZES.ENERGY_DOT.PULSE_MAX_SCALE) / 2;
    
    // Draw glow
    clearGraphics(this.glowSprite);
    this.glowSprite.circle(this.x, this.y, SIZES.ENERGY_DOT.RADIUS * SIZES.ENERGY_DOT.GLOW_RADIUS_MULTIPLIER * pulse);
    this.glowSprite.fill({ color, alpha: VISUALS.ALPHA.LOW * pulse });
    
    // Draw dot
    clearGraphics(this.sprite);
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
    EntityDestroyer.destroyEntity(
      {
        sprite: this.sprite,
        glowSprite: this.glowSprite,
        app: this.app,
        update: this.update
      },
      {
        removeTickerCallbacks: true
      }
    );
  }
}