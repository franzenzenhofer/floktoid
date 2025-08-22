import * as PIXI from 'pixi.js';
import { clearGraphics } from './SpriteFactory';

// SUPER BRIGHT HIGH CONTRAST NEON COLORS!!!
export const NEON_COLORS = [
  0xFF00FF, // HOT MAGENTA
  0x00FFFF, // ELECTRIC CYAN
  0xFFFF00, // LASER YELLOW
  0xFF0080, // NEON PINK
  0x00FF00, // TOXIC GREEN
  0xFF4500, // BLAZING ORANGE
  0x8000FF, // ULTRAVIOLET
  0x00FFAA, // AQUA MINT
  0xFFAA00, // AMBER GLOW
  0xFF00FF, // MAGENTA AGAIN (double chance)
  0x00FFFF, // CYAN AGAIN (double chance)
];

/**
 * Get the neon color for a given hue value
 * This ensures consistent color mapping between preview and actual asteroid
 */
export function getNeonColorFromHue(hue: number): number {
  const colorIndex = Math.floor((hue / 360) * NEON_COLORS.length) % NEON_COLORS.length;
  return NEON_COLORS[colorIndex];
}

/**
 * DRY: Shared asteroid rendering logic
 * Used by both charging preview and actual asteroid
 * This ensures EXACT visual consistency!
 */
export function renderAsteroid(
  graphics: PIXI.Graphics,
  vertices: number[],
  hue: number,
  x = 0,
  y = 0,
  scale = 1
) {
  clearGraphics(graphics);
  
  // Get the color based on hue
  const color = getNeonColorFromHue(hue);
  
  // Scale and position vertices
  const scaledVertices: number[] = [];
  for (let i = 0; i < vertices.length; i += 2) {
    scaledVertices.push(x + vertices[i] * scale);
    scaledVertices.push(y + vertices[i + 1] * scale);
  }
  
  // EXACT SAME RENDERING AS ASTEROID CLASS!
  
  // 1. Main shape with bright stroke
  graphics.poly(scaledVertices);
  graphics.stroke({ width: 4, color, alpha: 1 });
  
  // 2. Inner fill with glowing neon
  graphics.poly(scaledVertices);
  graphics.fill({ color, alpha: 0.5 });
  
  // 3. Extra glow layer for maximum brightness
  graphics.poly(scaledVertices);
  graphics.stroke({ width: 8, color, alpha: 0.3 });
  
  // 4. White outline for visibility against dark background
  graphics.poly(scaledVertices);
  graphics.stroke({ width: 2, color: 0xFFFFFF, alpha: 0.9 });
  
  // 5. Black inner stroke for contrast against bright backgrounds
  graphics.poly(scaledVertices);
  graphics.stroke({ width: 1, color: 0x000000, alpha: 0.5 });
}

/**
 * Render asteroid preview during charging
 * Uses EXACT same rendering as launched asteroid!
 */
export function renderAsteroidPreview(
  graphics: PIXI.Graphics,
  vertices: number[],
  hue: number,
  x: number,
  y: number,
  chargeSize: number,
  baseSize: number
) {
  const scale = chargeSize / baseSize;
  renderAsteroid(graphics, vertices, hue, x, y, scale);
}