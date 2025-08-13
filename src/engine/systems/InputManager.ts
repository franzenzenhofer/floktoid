import * as PIXI from 'pixi.js';
import { NeonFlockEngine } from '../NeonFlockEngine';
import { GameConfig } from '../GameConfig';

export class InputManager {
  private app: PIXI.Application;
  private engine: NeonFlockEngine;
  private charging = false;
  private chargeStart: { x: number; y: number } = { x: 0, y: 0 };
  private chargeSize = 0;
  private chargeStartTime = 0;
  private chargeIndicator: PIXI.Graphics;
  private aimLine: PIXI.Graphics;
  private cursor: PIXI.Graphics;
  private currentPos: { x: number; y: number } = { x: 0, y: 0 };

  constructor(app: PIXI.Application, engine: NeonFlockEngine) {
    this.app = app;
    this.engine = engine;
    
    this.chargeIndicator = new PIXI.Graphics();
    this.aimLine = new PIXI.Graphics();
    this.cursor = new PIXI.Graphics();
    
    app.stage.addChild(this.aimLine);
    app.stage.addChild(this.chargeIndicator);
    app.stage.addChild(this.cursor);
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    const canvas = this.app.view as HTMLCanvasElement;
    
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    
    // Update cursor on ticker
    this.app.ticker.add(this.updateVisuals);
  }
  
  private handlePointerDown = (e: PointerEvent) => {
    e.preventDefault(); // Prevent browser touch side effects
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only allow spawning in bottom third of screen
    if (y < this.app.screen.height * 0.67) {
      return;
    }
    
    this.charging = true;
    this.chargeStart = { x, y };
    this.chargeSize = GameConfig.AST_MIN;
    this.chargeStartTime = performance.now();
    this.currentPos = { x, y };
  };
  
  private handlePointerMove = (e: PointerEvent) => {
    e.preventDefault(); // Prevent browser touch side effects
    const canvas = this.app.view as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.currentPos.x = e.clientX - rect.left;
    this.currentPos.y = e.clientY - rect.top;
  };
  
  private handlePointerUp = (e?: PointerEvent) => {
    if (e) e.preventDefault();
    if (!this.charging) return;
    
    const dx = this.currentPos.x - this.chargeStart.x;
    const dy = this.currentPos.y - this.chargeStart.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 20) {
      // Apply slowness factor for bigger asteroids
      const slownessFactor = 1 - ((this.chargeSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX_CHARGE - GameConfig.AST_MIN)) * (1 - GameConfig.AST_SLOWNESS_FACTOR);
      
      this.engine.launchAsteroid(
        this.chargeStart.x,
        this.chargeStart.y,
        this.currentPos.x,
        this.currentPos.y,
        this.chargeSize,
        slownessFactor
      );
    }
    
    this.charging = false;
    this.chargeIndicator.clear();
    this.aimLine.clear();
  };
  
  private updateVisuals = () => {
    // Update cursor
    this.cursor.clear();
    const cursorColor = this.charging ? 0xffff00 : 0x00ffff;
    // Show spawn zone indicator
    if (this.currentPos.y < this.app.screen.height * 0.67) {
      this.cursor.circle(this.currentPos.x, this.currentPos.y, 10);
      this.cursor.stroke({ width: 2, color: 0xff0000, alpha: 0.5 }); // Red when out of spawn zone (top 2/3)
    } else {
      this.cursor.circle(this.currentPos.x, this.currentPos.y, 10);
      this.cursor.stroke({ width: 2, color: cursorColor, alpha: 1 });
    }
    
    // Update charging visuals
    if (this.charging) {
      // Grow charge size based on hold time
      const holdTime = (performance.now() - this.chargeStartTime) / 1000;
      this.chargeSize = Math.min(
        GameConfig.AST_MIN + holdTime * GameConfig.AST_GROWTH_RATE,
        GameConfig.AST_MAX_CHARGE
      );
      
      // Draw charge indicator
      this.chargeIndicator.clear();
      const hue = (performance.now() / 10) % 360;
      const color = Math.floor(
        (Math.cos(hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
      
      // Visual feedback for charge growth
      const pulse = Math.sin(performance.now() / 100) * 0.1 + 1;
      this.chargeIndicator.circle(this.chargeStart.x, this.chargeStart.y, this.chargeSize * pulse);
      this.chargeIndicator.stroke({ width: 2, color, alpha: 1 });
      this.chargeIndicator.fill({ color, alpha: 0.2 });
      
      // Draw aim line with dotted pattern
      this.aimLine.clear();
      const segments = 10;
      const dx = (this.currentPos.x - this.chargeStart.x) / segments;
      const dy = (this.currentPos.y - this.chargeStart.y) / segments;
      
      for (let i = 0; i < segments; i += 2) {
        this.aimLine.moveTo(this.chargeStart.x + dx * i, this.chargeStart.y + dy * i);
        this.aimLine.lineTo(this.chargeStart.x + dx * (i + 1), this.chargeStart.y + dy * (i + 1));
        this.aimLine.stroke({ width: 2, color, alpha: 0.5 });
      }
    }
  };
  
  destroy() {
    const canvas = this.app.view as HTMLCanvasElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    
    this.app.ticker.remove(this.updateVisuals);
    
    this.chargeIndicator.destroy();
    this.aimLine.destroy();
    this.cursor.destroy();
  }
}