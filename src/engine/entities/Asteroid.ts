import * as PIXI from 'pixi.js';

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
    const color = Math.floor(
      (Math.cos(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((this.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
    this.sprite.clear();
    
    // Draw VERY irregular asteroid shape with jagged edges
    const points = 12 + Math.floor(Math.random() * 4); // 12-15 points for more detail
    const angleStep = (Math.PI * 2) / points;
    const vertices: number[] = [];
    
    // Generate random roughness for each vertex
    const roughness = [];
    for (let i = 0; i < points; i++) {
      roughness.push(0.4 + Math.random() * 0.6); // 40-100% of radius
    }
    
    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = i * angleStep + (Math.random() - 0.5) * angleStep * 0.3; // Vary angle slightly
      const r = this.size * roughness[idx];
      vertices.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    
    this.sprite.poly(vertices);
    this.sprite.stroke({ width: 2, color, alpha: 1 });
    
    // Add some craters/details
    const craterCount = Math.floor(this.size / 20);
    for (let i = 0; i < craterCount; i++) {
      const craterAngle = Math.random() * Math.PI * 2;
      const craterDist = Math.random() * this.size * 0.5;
      const craterSize = 3 + Math.random() * 5;
      this.sprite.circle(
        Math.cos(craterAngle) * craterDist,
        Math.sin(craterAngle) * craterDist,
        craterSize
      );
      this.sprite.stroke({ width: 1, color, alpha: 0.3 });
    }
    
    // Add glow filter
    this.sprite.filters = [new PIXI.BlurFilter(2)];
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