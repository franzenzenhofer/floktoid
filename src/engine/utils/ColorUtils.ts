/**
 * ColorUtils - DRY color calculation utilities
 * Extracted from duplicated color conversion logic found in 7+ places
 */

/**
 * Convert HSL-based hue to RGB color integer
 * Used for dynamic color generation based on hue values
 * @param hue - Hue value in degrees (0-360)
 * @returns RGB color as hexadecimal integer
 */
export function hueToRGB(hue: number): number {
  const r = Math.floor((Math.cos(hue * Math.PI / 180) * 0.5 + 0.5) * 255);
  const g = Math.floor((Math.sin(hue * Math.PI / 180) * 0.5 + 0.5) * 255);
  const b = Math.floor((Math.cos((hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255);
  return (r << 16) | (g << 8) | b;
}

/**
 * Convert RGB components to hexadecimal color integer
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns RGB color as hexadecimal integer
 */
export function rgbToHex(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

/**
 * Extract RGB components from hexadecimal color
 * @param hex - Hexadecimal color integer
 * @returns Object with r, g, b components
 */
export function hexToRGB(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 0xFF,
    g: (hex >> 8) & 0xFF,
    b: hex & 0xFF
  };
}

/**
 * Lighten a color by a factor
 * @param color - Base color as hex integer
 * @param factor - Lightening factor (0-1, where 1 is white)
 * @returns Lightened color as hex integer
 */
export function lightenColor(color: number, factor: number): number {
  const { r, g, b } = hexToRGB(color);
  const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * factor));
  return rgbToHex(lighten(r), lighten(g), lighten(b));
}

/**
 * Darken a color by a factor
 * @param color - Base color as hex integer
 * @param factor - Darkening factor (0-1, where 1 is black)
 * @returns Darkened color as hex integer
 */
export function darkenColor(color: number, factor: number): number {
  const { r, g, b } = hexToRGB(color);
  const darken = (c: number) => Math.floor(c * (1 - factor));
  return rgbToHex(darken(r), darken(g), darken(b));
}

/**
 * Blend two colors together
 * @param color1 - First color as hex integer
 * @param color2 - Second color as hex integer
 * @param ratio - Blend ratio (0 = color1, 1 = color2)
 * @returns Blended color as hex integer
 */
export function blendColors(color1: number, color2: number, ratio: number): number {
  const c1 = hexToRGB(color1);
  const c2 = hexToRGB(color2);
  const blend = (a: number, b: number) => Math.floor(a * (1 - ratio) + b * ratio);
  return rgbToHex(blend(c1.r, c2.r), blend(c1.g, c2.g), blend(c1.b, c2.b));
}