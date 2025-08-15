import * as PIXI from 'pixi.js';

/**
 * Create collision animation with three short lines showing bird crash/falter
 */
export class CollisionEffects {
  private app: PIXI.Application;
  private activeEffects: PIXI.Graphics[] = [];

  constructor(app: PIXI.Application) {
    this.app = app;
  }

  /**
   * Create impact effect (alias for crash lines)
   */
  createImpact(x: number, y: number, color: number = 0xff0000) {
    this.createCrashLines(x, y, color);
  }

  /**
   * Create crash lines effect when bird is hit
   * Three short lines emanating from collision point showing impact
   */
  createCrashLines(x: number, y: number, color: number = 0x00ffff) {
    const crashGraphics = new PIXI.Graphics();
    
    // Three lines at different angles showing crash/falter
    const lines = [
      { angle: -Math.PI / 6, length: 30 },  // Upper line
      { angle: 0, length: 35 },              // Middle line
      { angle: Math.PI / 6, length: 30 }     // Lower line
    ];
    
    // Initial drawing
    this.drawCrashLines(crashGraphics, x, y, lines, color, 1);
    this.app.stage.addChild(crashGraphics);
    this.activeEffects.push(crashGraphics);
    
    // Animate the crash lines
    let frame = 0;
    const maxFrames = 20;
    
    const animateCrash = () => {
      frame++;
      
      if (frame >= maxFrames || crashGraphics.destroyed) {
        this.app.ticker.remove(animateCrash);
        if (!crashGraphics.destroyed) {
          this.app.stage.removeChild(crashGraphics);
          crashGraphics.destroy();
        }
        const index = this.activeEffects.indexOf(crashGraphics);
        if (index > -1) {
          this.activeEffects.splice(index, 1);
        }
        return;
      }
      
      const progress = frame / maxFrames;
      const alpha = 1 - progress;
      const expansion = 1 + progress * 0.5;
      
      // Redraw with animation
      this.drawCrashLines(crashGraphics, x, y, lines, color, alpha, expansion, progress);
    };
    
    this.app.ticker.add(animateCrash);
  }
  
  private drawCrashLines(
    graphics: PIXI.Graphics,
    x: number,
    y: number,
    lines: Array<{ angle: number; length: number }>,
    color: number,
    alpha: number,
    expansion: number = 1,
    wobble: number = 0
  ) {
    graphics.clear();
    
    lines.forEach((line, i) => {
      // Add wobble effect to show impact
      const wobbleAngle = line.angle + Math.sin(wobble * Math.PI * 2 + i) * 0.2;
      const length = line.length * expansion;
      
      // Calculate line endpoints
      const startX = x + Math.cos(wobbleAngle) * 10;
      const startY = y + Math.sin(wobbleAngle) * 10;
      const endX = x + Math.cos(wobbleAngle) * length;
      const endY = y + Math.sin(wobbleAngle) * length;
      
      // Draw jagged/broken line to show impact
      graphics.moveTo(startX, startY);
      
      // Add slight break in middle for "shattered" effect
      const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 5;
      const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 5;
      
      graphics.lineTo(midX, midY);
      graphics.lineTo(endX, endY);
      
      // Style the lines
      graphics.stroke({
        width: 3 - i * 0.5,
        color,
        alpha: alpha * (1 - i * 0.2),
        cap: 'round'
      });
    });
    
    // Add glow effect
    graphics.filters = [
      new PIXI.BlurFilter({
        strength: 2,
        quality: 2
      })
    ];
  }
  
  /**
   * Clean up all active effects
   */
  cleanup() {
    this.activeEffects.forEach(effect => {
      if (!effect.destroyed) {
        this.app.stage.removeChild(effect);
        effect.destroy();
      }
    });
    this.activeEffects = [];
  }
}