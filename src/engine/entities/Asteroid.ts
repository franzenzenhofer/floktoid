import * as PIXI from 'pixi.js';
import { generateAsteroid } from '../utils/AsteroidGenerator';
import { renderAsteroid } from '../utils/AsteroidRenderer';
import CentralConfig from '../CentralConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';

const { SIZES, ASTEROID_GEN } = CentralConfig;

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
    shapeData?: { vertices: number[], roughness: number[] },
    hue?: number // CRITICAL: Use the exact hue from charging!
  ) {
    this.app = app;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.size = size;
    this.baseSize = size;
    // CRITICAL FIX: Use provided hue to match what user saw during charging!
    this.hue = hue !== undefined ? hue : Math.random() * 360;
    this.rotSpeed = ASTEROID_GEN.ROTATION.MIN_SPEED + Math.random() * (ASTEROID_GEN.ROTATION.MAX_SPEED - ASTEROID_GEN.ROTATION.MIN_SPEED);
    
    this.sprite = new PIXI.Graphics();
    app.stage.addChild(this.sprite);
    
    // Use provided shape or generate new one
    if (shapeData) {
      // CRITICAL FIX: Shape is already scaled to the correct size from InputManager
      // So we use the size as the baseSize for the shape
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
    // DRY: Use shared renderer for EXACT visual consistency!
    const scale = this.size / this.baseSize;
    renderAsteroid(
      this.sprite,
      this.shapeVertices,
      this.hue,
      0, // x offset (sprite position is handled separately)
      0, // y offset
      scale
    );
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
      
      // Remove if too small
      if (this.size < SIZES.ASTEROID.MIN / 2) {
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
    const margin = SIZES.ASTEROID.MAX * 2;
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
    
    EntityDestroyer.destroyEntity(
      {
        sprite: this.sprite,
        app: this.app
      },
      {
        markAsDestroyed: false // Already marked destroyed above
      }
    );
  }
}