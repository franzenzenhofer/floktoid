import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';

export class Asteroid {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public hue: number;
  
  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotSpeed: number;
  private app: PIXI.Application;

  constructor(
    app: PIXI.Application,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number
  ) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.hue = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 10;
    
    this.sprite = new PIXI.Graphics();
    app.stage.addChild(this.sprite);
    
    this.draw();
  }
  
  private draw() {
    const color = PIXI.utils.rgb2hex([
      Math.cos(this.hue * Math.PI / 180) * 0.5 + 0.5,
      Math.sin(this.hue * Math.PI / 180) * 0.5 + 0.5,
      Math.cos((this.hue + 120) * Math.PI / 180) * 0.5 + 0.5
    ]);
    
    this.sprite.clear();
    this.sprite.lineStyle(2, color, 1);
    
    // Draw irregular asteroid shape
    const points = 8;
    const angleStep = (Math.PI * 2) / points;
    
    this.sprite.moveTo(
      Math.cos(0) * this.size,
      Math.sin(0) * this.size
    );
    
    for (let i = 1; i <= points; i++) {
      const angle = i * angleStep;
      const r = this.size * (0.8 + Math.sin(i * 2.7) * 0.2);
      this.sprite.lineTo(
        Math.cos(angle) * r,
        Math.sin(angle) * r
      );
    }
    
    this.sprite.closePath();
    
    // Add glow filter
    this.sprite.filters = [new PIXI.filters.BlurFilter(2)];
  }
  
  public update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation;
  }
  
  public updateSize() {
    this.draw();
  }
  
  public isOffScreen(screen: PIXI.Rectangle): boolean {
    const margin = 100;
    return (
      this.x < -margin ||
      this.x > screen.width + margin ||
      this.y < -margin ||
      this.y > screen.height + margin
    );
  }
  
  public destroy() {
    this.app.stage.removeChild(this.sprite);
    this.sprite.destroy();
  }
}