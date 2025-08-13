import * as PIXI from 'pixi.js';

export class Asteroid {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public size: number;
  public baseSize: number;
  public hue: number;
  
  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotSpeed: number;
  private app: PIXI.Application;
  private shapeVertices: number[] = [];
  private shapeRoughness: number[] = [];

  constructor(
    app: PIXI.Application,
    x: number,
    y: number,
    vx: number,
    vy: number,
    size: number,
    shapeData?: { vertices: number[], roughness: number[] }
  ) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.baseSize = size;
    this.hue = Math.random() * 360;
    this.rotSpeed = (Math.random() - 0.5) * 10;
    
    this.sprite = new PIXI.Graphics();
    app.stage.addChild(this.sprite);
    
    // Use provided shape or generate new one
    if (shapeData) {
      this.shapeVertices = shapeData.vertices;
      this.shapeRoughness = shapeData.roughness;
    } else {
      this.generateShape();
    }
    
    this.draw();
  }
  
  private generateShape() {
    const points = 12 + Math.floor(Math.random() * 4);
    this.shapeVertices = [];
    this.shapeRoughness = [];
    
    // Generate random roughness for each vertex
    for (let i = 0; i < points; i++) {
      this.shapeRoughness.push(0.4 + Math.random() * 0.6);
      this.shapeVertices.push(i); // Store index
    }
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
    
    // Use stored shape with current size
    const points = this.shapeRoughness.length;
    const angleStep = (Math.PI * 2) / points;
    const vertices: number[] = [];
    
    // Scale shape based on current size vs base size
    const scale = this.size / this.baseSize;
    
    for (let i = 0; i <= points; i++) {
      const idx = i % points;
      const angle = i * angleStep + (this.shapeVertices[idx] * 0.01 - 0.5) * angleStep * 0.3;
      const r = this.size * this.shapeRoughness[idx];
      vertices.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    
    this.sprite.poly(vertices);
    this.sprite.stroke({ width: 2, color, alpha: 1 });
    
    // Scale craters with size
    const craterCount = Math.floor(this.baseSize / 20);
    for (let i = 0; i < craterCount; i++) {
      const seed = i * 137.5; // Consistent crater positions
      const craterAngle = (seed % 360) * Math.PI / 180;
      const craterDist = ((seed * 0.3) % 1) * this.size * 0.5;
      const craterSize = (3 + (seed * 0.7) % 5) * scale;
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
  
  public getShapeData() {
    return {
      vertices: [...this.shapeVertices],
      roughness: [...this.shapeRoughness]
    };
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