import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';

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
    
    const pulse = Math.sin(performance.now() / 1000 * 5 + this.pulsePhase) * 0.3 + 0.7;
    
    // Draw glow
    this.glowSprite.clear();
    this.glowSprite.circle(this.x, this.y, GameConfig.ENERGY_RADIUS * 3 * pulse);
    this.glowSprite.fill({ color, alpha: 0.3 * pulse });
    
    // Draw dot
    this.sprite.clear();
    this.sprite.circle(this.x, this.y, GameConfig.ENERGY_RADIUS * pulse);
    this.sprite.fill({ color, alpha: 1 });
    
    // Core
    this.sprite.circle(this.x, this.y, GameConfig.ENERGY_RADIUS * 0.3);
    this.sprite.fill({ color: 0xffffff, alpha: 1 });
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
    this.app.ticker.remove(this.update);
    this.app.stage.removeChild(this.sprite);
    this.app.stage.removeChild(this.glowSprite);
    this.sprite.destroy();
    this.glowSprite.destroy();
  }
}