import * as PIXI from 'pixi.js';
import { NeonFlockEngine } from '../NeonFlockEngine';
import { GameConfig } from '../GameConfig';

export class InputManager {
  private app: PIXI.Application;
  private engine: NeonFlockEngine;
  private charging = false;
  private chargeStart: { x: number; y: number } = { x: 0, y: 0 };
  private chargeSize = 0;
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
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.charging = true;
    this.chargeStart = { x, y };
    this.chargeSize = GameConfig.AST_MIN;
    this.currentPos = { x, y };
  };
  
  private handlePointerMove = (e: PointerEvent) => {
    const canvas = this.app.view as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.currentPos.x = e.clientX - rect.left;
    this.currentPos.y = e.clientY - rect.top;
  };
  
  private handlePointerUp = () => {
    if (!this.charging) return;
    
    const dx = this.currentPos.x - this.chargeStart.x;
    const dy = this.currentPos.y - this.chargeStart.y;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 20) {
      this.engine.launchAsteroid(
        this.chargeStart.x,
        this.chargeStart.y,
        this.currentPos.x,
        this.currentPos.y,
        this.chargeSize
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
    this.cursor.lineStyle(2, cursorColor, 1);
    this.cursor.drawCircle(this.currentPos.x, this.currentPos.y, 10);
    
    // Update charging visuals
    if (this.charging) {
      // Grow charge size
      this.chargeSize = Math.min(
        this.chargeSize + 0.5,
        GameConfig.AST_MAX
      );
      
      // Draw charge indicator
      this.chargeIndicator.clear();
      const hue = (performance.now() / 10) % 360;
      const color = PIXI.utils.rgb2hex([
        Math.cos(hue * Math.PI / 180) * 0.5 + 0.5,
        Math.sin(hue * Math.PI / 180) * 0.5 + 0.5,
        Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5
      ]);
      
      this.chargeIndicator.lineStyle(2, color, 1);
      this.chargeIndicator.beginFill(color, 0.2);
      this.chargeIndicator.drawCircle(this.chargeStart.x, this.chargeStart.y, this.chargeSize);
      this.chargeIndicator.endFill();
      
      // Draw aim line
      this.aimLine.clear();
      this.aimLine.lineStyle(2, color, 0.5);
      this.aimLine.moveTo(this.chargeStart.x, this.chargeStart.y);
      this.aimLine.lineTo(this.currentPos.x, this.currentPos.y);
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