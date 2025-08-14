import * as PIXI from 'pixi.js';
import { NeonFlockEngine } from '../NeonFlockEngine';
import { GameConfig } from '../GameConfig';
import { generateAsteroid } from '../utils/AsteroidGenerator';
import { renderAsteroidPreview } from '../utils/AsteroidRenderer';
import CentralConfig from '../CentralConfig';
import { scoringSystem } from '../ScoringSystem';

const { SIZES, VISUALS } = CentralConfig;

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
  private asteroidShape: { vertices: number[], roughness: number[] } | null = null;

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
    
    // Generate unique asteroid shape that won't self-intersect
    // Use AST_MIN as base size for the shape generation
    this.asteroidShape = generateAsteroid(undefined, GameConfig.AST_MIN);
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
    
    // If dragged out of spawn zone, clamp target to spawn zone boundary
    let targetX = this.currentPos.x;
    let targetY = this.currentPos.y;
    
    const spawnBoundary = this.app.screen.height * 0.67;
    if (targetY < spawnBoundary) {
      // Calculate angle and project to boundary
      const dx = targetX - this.chargeStart.x;
      const dy = targetY - this.chargeStart.y;
      const angle = Math.atan2(dy, dx);
      
      // Project to spawn boundary
      const distToBoundary = (spawnBoundary - this.chargeStart.y) / Math.sin(angle);
      if (distToBoundary > 0) {
        targetX = this.chargeStart.x + Math.cos(angle) * Math.abs(distToBoundary);
        targetY = spawnBoundary;
      }
    }
    
    // Clear all visuals immediately before launch
    this.chargeIndicator.clear();
    this.aimLine.clear();
    this.cursor.clear(); // CRITICAL FIX: Clear cursor to remove red circle
    
    const dx = targetX - this.chargeStart.x;
    const dy = targetY - this.chargeStart.y;
    const dist = Math.hypot(dx, dy);
    
    // Calculate angle from horizontal
    // 0 degrees = horizontal, 90 degrees = straight up
    const angle = Math.abs(Math.atan2(dy, dx) * (180 / Math.PI));
    
    // Only launch if distance > 20 and angle NOT between 0-15 or 165-180 degrees (prevent horizontal shots)
    if (dist > 20 && angle > 15 && angle < 165) {
      // Apply slowness factor for bigger asteroids
      const slownessFactor = 1 - ((this.chargeSize - GameConfig.AST_MIN) / (GameConfig.AST_MAX_CHARGE - GameConfig.AST_MIN)) * (1 - GameConfig.AST_SLOWNESS_FACTOR);
      
      // CRITICAL FIX: Use the EXACT color at RELEASE moment!
      // This is what the user sees when they let go!
      const releaseTime = performance.now();
      const hue = (releaseTime / 10) % 360; // Color at the moment of release!
      
      // CRITICAL FIX: Scale the asteroid shape to match the charged size!
      // The shape was generated at AST_MIN, so we need to scale it to the actual charge size
      let scaledShape = null;
      if (this.asteroidShape) {
        const scale = this.chargeSize / GameConfig.AST_MIN;
        const scaledVertices: number[] = [];
        for (let i = 0; i < this.asteroidShape.vertices.length; i++) {
          scaledVertices.push(this.asteroidShape.vertices[i] * scale);
        }
        scaledShape = {
          vertices: scaledVertices,
          roughness: this.asteroidShape.roughness
        };
      }
      
      this.engine.launchAsteroid(
        this.chargeStart.x,
        this.chargeStart.y,
        targetX,
        targetY,
        this.chargeSize,
        slownessFactor,
        scaledShape,
        hue // Pass the exact hue that was shown!
      );
    }
    
    // Reset state
    this.charging = false;
    this.asteroidShape = null;
    this.chargeSize = GameConfig.AST_MIN;
  };
  
  private updateVisuals = () => {
    // Update cursor
    this.cursor.clear();
    const cursorColor = this.charging ? VISUALS.COLORS.NEON_YELLOW : VISUALS.COLORS.NEON_CYAN;
    // Show spawn zone indicator
    if (this.currentPos.y < this.app.screen.height * 0.67) {
      this.cursor.circle(this.currentPos.x, this.currentPos.y, SIZES.BIRD.BASE);
      this.cursor.stroke({ width: VISUALS.STROKE.NORMAL, color: VISUALS.COLORS.NEON_RED, alpha: VISUALS.ALPHA.MEDIUM }); // Red when out of spawn zone (top 2/3)
    } else {
      this.cursor.circle(this.currentPos.x, this.currentPos.y, SIZES.BIRD.BASE);
      this.cursor.stroke({ width: VISUALS.STROKE.NORMAL, color: cursorColor, alpha: VISUALS.ALPHA.FULL });
    }
    
    // Update charging visuals
    if (this.charging) {
      // Grow charge size based on hold time
      const holdTime = (performance.now() - this.chargeStartTime) / 1000;
      this.chargeSize = Math.min(
        GameConfig.AST_MIN + holdTime * GameConfig.AST_GROWTH_RATE,
        GameConfig.AST_MAX_CHARGE
      );
      
      // Check if player can afford this asteroid
      const canAfford = scoringSystem.canAffordAsteroid(this.chargeSize);
      
      // Draw charge indicator using EXACT SAME RENDERING as launched asteroid!
      const hue = canAfford ? (performance.now() / 10) % 360 : 0; // Red hue if can't afford
      
      // Show actual asteroid shape preview using the generated shape
      const pulse = Math.sin(performance.now() / 100) * 0.05 + 1;
      const asteroidSize = this.chargeSize * pulse;
      
      if (this.asteroidShape) {
        // DRY: Use shared renderer for PERFECT visual consistency!
        renderAsteroidPreview(
          this.chargeIndicator,
          this.asteroidShape.vertices,
          canAfford ? hue : 0, // Red if can't afford
          this.chargeStart.x,
          this.chargeStart.y,
          asteroidSize,
          GameConfig.AST_MIN
        );
        
        // Add cost indicator and warning if can't afford
        const cost = scoringSystem.calculateAsteroidCost(this.chargeSize);
        const currentScore = scoringSystem.getScore();
        
        // Show cost text
        const costColor = canAfford ? VISUALS.COLORS.NEON_CYAN : VISUALS.COLORS.NEON_RED;
        const costText = canAfford ? `Cost: ${cost}` : `NEED ${cost} (Have ${currentScore})`;
        
        // Create text style for cost indicator
        this.chargeIndicator.rect(
          this.chargeStart.x - 60,
          this.chargeStart.y - asteroidSize - 40,
          120,
          25
        );
        this.chargeIndicator.fill({ color: VISUALS.COLORS.BLACK, alpha: 0.7 });
        this.chargeIndicator.stroke({ color: costColor, width: 2 });
        
        // Note: We can't render text directly in Graphics, but the rect shows the cost zone
        // The actual cost will be shown in the score display
      }
      
      // Draw aim line with dotted pattern
      this.aimLine.clear();
      const segments = 10;
      const dx = (this.currentPos.x - this.chargeStart.x) / segments;
      const dy = (this.currentPos.y - this.chargeStart.y) / segments;
      
      // Check if angle is valid (not too horizontal)
      const angle = Math.abs(Math.atan2(dy * segments, dx * segments) * (180 / Math.PI));
      const validAngle = angle > 15 && angle < 165;
      // Get color from hue for aim line - red if can't afford
      const aimColor = canAfford ? 
        (Math.floor((Math.cos(hue * Math.PI / 180) * 0.5 + 0.5) * 255) << 16 | 
         Math.floor((Math.sin(hue * Math.PI / 180) * 0.5 + 0.5) * 255) << 8 | 
         Math.floor((Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255)) :
        0xFF0000; // Red if can't afford
      const lineColor = !validAngle ? 0x808080 : aimColor; // Gray if invalid angle, colored otherwise
      
      for (let i = 0; i < segments; i += 2) {
        this.aimLine.moveTo(this.chargeStart.x + dx * i, this.chargeStart.y + dy * i);
        this.aimLine.lineTo(this.chargeStart.x + dx * (i + 1), this.chargeStart.y + dy * (i + 1));
        this.aimLine.stroke({ width: 2, color: lineColor, alpha: 0.5 });
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