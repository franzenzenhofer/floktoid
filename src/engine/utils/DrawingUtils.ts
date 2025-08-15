/**
 * DrawingUtils - DRY drawing utilities for common shapes and patterns
 * Consolidates repeated drawing logic across the codebase
 */

import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { hueToRGB } from './ColorUtils';

const { VISUALS, SIZES } = CentralConfig;

/**
 * Draw pulsing energy dot - DRY: Used by both EnergyDot entity and falling dots
 */
export function drawPulsingEnergyDot(
  graphics: PIXI.Graphics,
  glowGraphics: PIXI.Graphics | null,
  x: number,
  y: number,
  radius: number,
  hue: number,
  pulsePhase: number,
  time: number
): void {
  const color = hueToRGB(hue);
  const pulseRadius = radius * (1 + pulsePhase * 0.2);
  
  graphics.clear();
  
  // Outer glow
  graphics.circle(0, 0, pulseRadius * 1.5);
  graphics.fill({ color, alpha: 0.3 });
  
  // Inner core
  graphics.circle(0, 0, pulseRadius);
  graphics.fill({ color, alpha: 0.8 });
  
  // Update position
  graphics.x = x;
  graphics.y = y;
  
  // Glow effect if provided
  if (glowGraphics) {
    glowGraphics.clear();
    const glowAlpha = 0.2 + Math.sin(time * 0.003) * 0.1;
    glowGraphics.circle(x, y, radius * 3);
    glowGraphics.fill({ color, alpha: glowAlpha });
  }
}

/**
 * Draw a triangle/arrow shape (commonly used for birds)
 * @param graphics - Graphics object to draw on
 * @param x - Center X position
 * @param y - Center Y position
 * @param size - Size of the triangle
 * @param angle - Rotation angle in radians
 * @param color - Fill color
 * @param alpha - Fill alpha
 * @param stroke - Optional stroke configuration
 */
export function drawTriangle(
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  size: number,
  angle: number = 0,
  color: number,
  alpha: number = VISUALS.ALPHA.FULL,
  stroke?: { color: number; width: number; alpha?: number }
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  // Triangle points relative to origin
  const points = [
    { x: size, y: 0 },           // Tip
    { x: -size * 0.5, y: -size * 0.4 }, // Top wing
    { x: -size * 0.5, y: size * 0.4 }   // Bottom wing
  ];
  
  // Rotate and translate points
  const vertices: number[] = [];
  points.forEach(p => {
    const rx = p.x * cos - p.y * sin;
    const ry = p.x * sin + p.y * cos;
    vertices.push(x + rx, y + ry);
  });
  
  graphics.poly(vertices);
  graphics.fill({ color, alpha });
  
  if (stroke) {
    graphics.stroke({
      color: stroke.color,
      width: stroke.width,
      alpha: stroke.alpha ?? VISUALS.ALPHA.FULL
    });
  }
}

/**
 * Draw a pulsing energy dot with glow
 * @param graphics - Graphics object for the dot
 * @param glowGraphics - Graphics object for the glow
 * @param x - X position
 * @param y - Y position
 * @param radius - Base radius
 * @param color - Dot color
 * @param pulse - Pulse scale factor
 * @param withCore - Whether to add white core
 */
export function drawEnergyDot(
  graphics: PIXI.Graphics,
  glowGraphics: PIXI.Graphics | null,
  x: number,
  y: number,
  radius: number,
  color: number,
  pulse: number = 1,
  withCore: boolean = true
): void {
  // Draw glow if graphics provided
  if (glowGraphics) {
    glowGraphics.clear();
    glowGraphics.circle(x, y, radius * SIZES.ENERGY_DOT.GLOW_RADIUS_MULTIPLIER * pulse);
    glowGraphics.fill({ color, alpha: VISUALS.ALPHA.LOW * pulse });
  }
  
  // Draw main dot
  graphics.clear();
  graphics.circle(x, y, radius * pulse);
  graphics.fill({ color, alpha: VISUALS.ALPHA.FULL });
  
  // Draw core
  if (withCore) {
    graphics.circle(x, y, radius * 0.3);
    graphics.fill({ color: VISUALS.COLORS.WHITE, alpha: VISUALS.ALPHA.FULL });
  }
}

/**
 * Draw a trail/path with gradient alpha
 * @param graphics - Graphics object to draw on
 * @param points - Array of trail points
 * @param color - Trail color
 * @param maxWidth - Maximum trail width
 * @param maxAlpha - Maximum trail alpha
 */
export function drawTrail(
  graphics: PIXI.Graphics,
  points: { x: number; y: number }[],
  color: number,
  maxWidth: number = VISUALS.STROKE.NORMAL,
  maxAlpha: number = VISUALS.ALPHA.MEDIUM
): void {
  if (points.length < 2) return;
  
  graphics.clear();
  
  for (let i = 1; i < points.length; i++) {
    const progress = i / points.length;
    const alpha = progress * maxAlpha;
    const width = progress * maxWidth;
    
    graphics.moveTo(points[i - 1].x, points[i - 1].y);
    graphics.lineTo(points[i].x, points[i].y);
    graphics.stroke({ width, color, alpha });
  }
}

/**
 * Draw a grid pattern
 * @param graphics - Graphics object to draw on
 * @param width - Grid width
 * @param height - Grid height
 * @param spacing - Grid spacing
 * @param color - Grid line color
 * @param alpha - Grid line alpha
 * @param strokeWidth - Grid line width
 */
export function drawGrid(
  graphics: PIXI.Graphics,
  width: number,
  height: number,
  spacing: number,
  color: number = VISUALS.COLORS.NEON_CYAN,
  alpha: number = VISUALS.ALPHA.VERY_LOW,
  strokeWidth: number = VISUALS.STROKE.THIN
): void {
  graphics.clear();
  
  // Vertical lines
  for (let x = 0; x <= width; x += spacing) {
    graphics.moveTo(x, 0);
    graphics.lineTo(x, height);
  }
  
  // Horizontal lines
  for (let y = 0; y <= height; y += spacing) {
    graphics.moveTo(0, y);
    graphics.lineTo(width, y);
  }
  
  graphics.stroke({ width: strokeWidth, color, alpha });
}

/**
 * Draw a gradient rectangle
 * @param graphics - Graphics object to draw on
 * @param x - X position
 * @param y - Y position
 * @param width - Rectangle width
 * @param height - Rectangle height
 * @param color - Base color
 * @param alphaTop - Alpha at top
 * @param alphaBottom - Alpha at bottom
 */
export function drawGradientRect(
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alphaTop: number,
  alphaBottom: number
): void {
  // Draw as two rectangles with different alphas for simple gradient effect
  const midHeight = height / 2;
  
  graphics.rect(x, y, width, midHeight);
  graphics.fill({ color, alpha: alphaTop });
  
  graphics.rect(x, y + midHeight, width, midHeight);
  graphics.fill({ color, alpha: alphaBottom });
}

/**
 * Draw a shield/hexagon shape
 * @param graphics - Graphics object to draw on
 * @param x - Center X
 * @param y - Center Y
 * @param radius - Shield radius
 * @param color - Shield color
 * @param alpha - Shield alpha
 * @param sides - Number of sides (6 for hexagon)
 */
export function drawShield(
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number = VISUALS.ALPHA.MEDIUM,
  sides: number = 6
): void {
  const vertices: number[] = [];
  const angleStep = (Math.PI * 2) / sides;
  
  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep - Math.PI / 2;
    vertices.push(
      x + Math.cos(angle) * radius,
      y + Math.sin(angle) * radius
    );
  }
  
  graphics.poly(vertices);
  graphics.fill({ color, alpha });
  graphics.stroke({ 
    width: VISUALS.STROKE.THICK, 
    color, 
    alpha: alpha * 1.5 
  });
}