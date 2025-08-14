import * as PIXI from 'pixi.js';
import { generateAsteroid } from '../utils/AsteroidGenerator';

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
  public destroyed = false;

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
    // Use the new vector-based generator for non-intersecting asteroids
    const shape = generateAsteroid(undefined, this.baseSize);
    this.shapeVertices = shape.vertices;
    this.shapeRoughness = shape.roughness;
  }
  
  private draw() {
    // High contrast neon colors for maximum visibility
    const neonColors = [
      0xFF00FF, // Hot magenta
      0x00FFFF, // Cyan
      0xFFFF00, // Yellow
      0xFF00AA, // Pink
      0x00FF00, // Green
      0xFF6600, // Orange
      0xAA00FF, // Purple
      0x00AAFF, // Sky blue
    ];
    
    // Pick a neon color based on hue
    const colorIndex = Math.floor((this.hue / 360) * neonColors.length) % neonColors.length;
    const color = neonColors[colorIndex];
    
    this.sprite.clear();
    
    // Scale shape based on current size vs base size
    const scale = this.size / this.baseSize;
    
    // Apply scaling to the pre-generated vertices
    const scaledVertices: number[] = [];
    for (let i = 0; i < this.shapeVertices.length; i += 2) {
      scaledVertices.push(this.shapeVertices[i] * scale);
      scaledVertices.push(this.shapeVertices[i + 1] * scale);
    }
    
    // Draw as a closed polygon - guaranteed no self-intersections!
    this.sprite.poly(scaledVertices);
    
    // High visibility neon stroke with glow
    this.sprite.stroke({ width: 3, color, alpha: 1 });
    
    // Add inner fill with semi-transparent neon
    this.sprite.poly(scaledVertices);
    this.sprite.fill({ color, alpha: 0.3 });
    
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
  
  public update(dt: number): boolean {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    
    // Wrap around left/right edges and shrink by 5%
    const screenWidth = this.app.screen.width;
    let wrapped = false;
    
    if (this.x < -this.size) {
      this.x = screenWidth + this.size;
      wrapped = true;
    } else if (this.x > screenWidth + this.size) {
      this.x = -this.size;
      wrapped = true;
    }
    
    // Shrink by 5% when wrapping
    if (wrapped) {
      this.size *= 0.95;
      this.updateSize();
      
      // Remove if too small (below 5 pixels)
      if (this.size < 5) {
        return false; // Signal removal
      }
    }
    
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation;
    
    return true; // Keep asteroid
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
    // Only check top/bottom since asteroids wrap left/right
    return (
      this.y < -margin ||
      this.y > screen.height + margin
    );
  }
  
  public destroy() {
    // Prevent double destruction
    if (this.destroyed) return;
    this.destroyed = true;
    
    // Safely remove and destroy sprite
    if (this.sprite.parent) {
      this.app.stage.removeChild(this.sprite);
    }
    if (!this.sprite.destroyed) {
      this.sprite.destroy();
    }
  }
}