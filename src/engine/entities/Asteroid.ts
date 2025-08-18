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
  
  public sprite: PIXI.Graphics;
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
    // Random rotation speed between min and max, with more variation
    const range = ASTEROID_GEN.ROTATION.MAX_SPEED - ASTEROID_GEN.ROTATION.MIN_SPEED;
    this.rotSpeed = ASTEROID_GEN.ROTATION.MIN_SPEED + Math.random() * range;
    // Add slight bias: 60% chance of slower rotation for realism
    if (Math.random() < 0.6) {
      this.rotSpeed *= 0.5; // Make some asteroids rotate more slowly
    }
    
    this.sprite = new PIXI.Graphics();
    this.sprite.x = this.x;  // FIX: Initialize sprite position immediately
    this.sprite.y = this.y;  // FIX: No more ghost asteroids at (0,0)
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
    // Validate velocity to prevent zombies
    if (!Number.isFinite(this.vx) || !Number.isFinite(this.vy)) {
      console.warn('[ASTEROID] Invalid velocity detected, destroying:', this.vx, this.vy);
      return false; // Remove invalid asteroid
    }
    
    // Validate position
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      console.warn('[ASTEROID] Invalid position detected, destroying:', this.x, this.y);
      return false;
    }
    
    // Check if already destroyed (zombie check)
    if (this.destroyed) {
      console.warn('[ASTEROID] Already destroyed but still updating');
      return false;
    }
    
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
    
    // Validate sprite before updating
    if (!this.sprite || this.sprite.destroyed) {
      console.warn('[ASTEROID] Sprite missing or destroyed, marking as zombie');
      return false; // Remove zombie asteroid
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