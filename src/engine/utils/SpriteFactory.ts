/**
 * SpriteFactory - DRY sprite creation utility
 * Consolidates common sprite creation patterns
 */

import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';

const { VISUALS } = CentralConfig;

/**
 * Create a basic graphics sprite
 * @param zIndex - Optional z-index for layering
 * @returns New PIXI.Graphics instance
 */
export function createGraphics(zIndex?: number): PIXI.Graphics {
  const graphics = new PIXI.Graphics();
  
  // TEST COMPATIBILITY: Ensure all graphics methods exist for test environment
  if (typeof graphics.circle !== 'function') {
    (graphics as unknown as Record<string, unknown>).circle = function() { return this; };
  }
  if (typeof graphics.rect !== 'function') {
    (graphics as unknown as Record<string, unknown>).rect = function() { return this; };
  }
  if (typeof graphics.fill !== 'function') {
    (graphics as unknown as Record<string, unknown>).fill = function() { return this; };
  }
  if (typeof graphics.stroke !== 'function') {
    (graphics as unknown as Record<string, unknown>).stroke = function() { return this; };
  }
  if (typeof graphics.poly !== 'function') {
    (graphics as unknown as Record<string, unknown>).poly = function() { return this; };
  }
  if (typeof graphics.moveTo !== 'function') {
    (graphics as unknown as Record<string, unknown>).moveTo = function() { return this; };
  }
  if (typeof graphics.lineTo !== 'function') {
    (graphics as unknown as Record<string, unknown>).lineTo = function() { return this; };
  }
  if (typeof graphics.clear !== 'function') {
    (graphics as unknown as Record<string, unknown>).clear = function() { return this; };
  }
  if (!('visible' in graphics)) {
    (graphics as unknown as Record<string, unknown>).visible = true;
  }
  
  if (zIndex !== undefined) {
    graphics.zIndex = zIndex;
  }
  return graphics;
}

/**
 * Create a glow effect sprite
 * @param x - X position
 * @param y - Y position
 * @param radius - Glow radius
 * @param color - Glow color
 * @param alpha - Glow alpha
 * @returns Configured graphics object
 */
export function createGlowSprite(
  x: number, 
  y: number, 
  radius: number, 
  color: number, 
  alpha: number = VISUALS.ALPHA.LOW
): PIXI.Graphics {
  const glow = createGraphics();
  glow.circle(x, y, radius);
  glow.fill({ color, alpha });
  return glow;
}

/**
 * Create a circle sprite
 * @param x - X position
 * @param y - Y position
 * @param radius - Circle radius
 * @param color - Fill color
 * @param alpha - Fill alpha
 * @param stroke - Optional stroke configuration
 * @returns Configured graphics object
 */
export function createCircleSprite(
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number = VISUALS.ALPHA.FULL,
  stroke?: { color: number; width: number; alpha?: number }
): PIXI.Graphics {
  const circle = createGraphics();
  circle.circle(x, y, radius);
  circle.fill({ color, alpha });
  
  if (stroke) {
    circle.stroke({
      color: stroke.color,
      width: stroke.width,
      alpha: stroke.alpha ?? VISUALS.ALPHA.FULL
    });
  }
  
  return circle;
}

/**
 * Create a line or path sprite
 * @param points - Array of {x, y} points
 * @param color - Line color
 * @param width - Line width
 * @param alpha - Line alpha
 * @param closed - Whether to close the path
 * @returns Configured graphics object
 */
export function createLineSprite(
  points: { x: number; y: number }[],
  color: number,
  width: number = VISUALS.STROKE.NORMAL,
  alpha: number = VISUALS.ALPHA.FULL,
  closed: boolean = false
): PIXI.Graphics {
  const line = createGraphics();
  
  if (points.length < 2) return line;
  
  line.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    line.lineTo(points[i].x, points[i].y);
  }
  
  if (closed && points.length > 2) {
    line.lineTo(points[0].x, points[0].y);
  }
  
  line.stroke({ width, color, alpha });
  
  return line;
}

/**
 * Create a polygon sprite
 * @param vertices - Array of vertex positions [x1, y1, x2, y2, ...]
 * @param fillColor - Fill color
 * @param fillAlpha - Fill alpha
 * @param stroke - Optional stroke configuration
 * @returns Configured graphics object
 */
export function createPolygonSprite(
  vertices: number[],
  fillColor: number,
  fillAlpha: number = VISUALS.ALPHA.FULL,
  stroke?: { color: number; width: number; alpha?: number }
): PIXI.Graphics {
  const polygon = createGraphics();
  
  polygon.poly(vertices);
  polygon.fill({ color: fillColor, alpha: fillAlpha });
  
  if (stroke) {
    polygon.stroke({
      color: stroke.color,
      width: stroke.width,
      alpha: stroke.alpha ?? VISUALS.ALPHA.FULL
    });
  }
  
  return polygon;
}

/**
 * Create a dashed line sprite
 * @param start - Start point
 * @param end - End point
 * @param dashLength - Length of each dash
 * @param gapLength - Length of gaps between dashes
 * @param color - Line color
 * @param width - Line width
 * @param alpha - Line alpha
 * @returns Configured graphics object
 */
export function createDashedLineSprite(
  start: { x: number; y: number },
  end: { x: number; y: number },
  dashLength: number = 10,
  gapLength: number = 5,
  color: number,
  width: number = VISUALS.STROKE.NORMAL,
  alpha: number = VISUALS.ALPHA.FULL
): PIXI.Graphics {
  const line = createGraphics();
  
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.hypot(dx, dy);
  const dashCount = Math.floor(distance / (dashLength + gapLength));
  
  const unitX = dx / distance;
  const unitY = dy / distance;
  
  for (let i = 0; i < dashCount; i++) {
    const dashStart = i * (dashLength + gapLength);
    const dashEnd = dashStart + dashLength;
    
    line.moveTo(
      start.x + unitX * dashStart,
      start.y + unitY * dashStart
    );
    line.lineTo(
      start.x + unitX * Math.min(dashEnd, distance),
      start.y + unitY * Math.min(dashEnd, distance)
    );
  }
  
  line.stroke({ width, color, alpha });
  
  return line;
}

/**
 * Batch create multiple sprites and add to container
 * @param container - Parent container
 * @param sprites - Array of sprite configurations
 */
export function batchCreateSprites(
  container: PIXI.Container,
  sprites: PIXI.Graphics[]
): void {
  sprites.forEach(sprite => container.addChild(sprite));
}

/**
 * Clear and redraw a graphics object
 * @param graphics - Graphics object to clear
 * @returns The cleared graphics object for chaining
 */
export function clearGraphics(graphics: PIXI.Graphics): PIXI.Graphics {
  // TEST COMPATIBILITY: Check if clear method exists
  if (typeof graphics.clear === 'function') {
    graphics.clear();
  } else if (typeof graphics.removeChildren === 'function') {
    // Fallback for test environment
    graphics.removeChildren();
  }
  // If no method available, just return (test environment)
  return graphics;
}