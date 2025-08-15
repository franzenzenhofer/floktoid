/**
 * ValidationUtils - DRY validation utilities
 * Consolidates input validation and sanitization patterns
 */

import CentralConfig from '../CentralConfig';

const { SIZES } = CentralConfig;

/**
 * Number validation utilities
 */
export class NumberValidator {
  /**
   * Check if value is a valid finite number
   * @param value - Value to check
   * @returns Whether value is valid
   */
  static isValid(value: unknown): value is number {
    return typeof value === 'number' && isFinite(value) && !isNaN(value);
  }
  
  /**
   * Validate and clamp a number
   * @param value - Value to validate
   * @param min - Minimum value
   * @param max - Maximum value
   * @param fallback - Fallback value if invalid
   * @returns Valid clamped value
   */
  static clamp(value: unknown, min: number, max: number, fallback: number = min): number {
    if (!this.isValid(value)) {
      console.warn(`[NumberValidator] Invalid value: ${value}, using fallback: ${fallback}`);
      return fallback;
    }
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Validate positive number
   * @param value - Value to validate
   * @param fallback - Fallback if invalid
   * @returns Valid positive number
   */
  static positive(value: unknown, fallback: number = 1): number {
    if (!this.isValid(value) || value <= 0) {
      console.warn(`[NumberValidator] Invalid positive value: ${value}, using fallback: ${fallback}`);
      return fallback;
    }
    return value;
  }
  
  /**
   * Validate integer
   * @param value - Value to validate
   * @param fallback - Fallback if invalid
   * @returns Valid integer
   */
  static integer(value: unknown, fallback: number = 0): number {
    if (!this.isValid(value)) {
      return fallback;
    }
    return Math.round(value);
  }
}

/**
 * Position validation utilities
 */
export class PositionValidator {
  /**
   * Validate 2D position
   * @param x - X coordinate
   * @param y - Y coordinate
   * @returns Whether position is valid
   */
  static isValid(x: unknown, y: unknown): boolean {
    return NumberValidator.isValid(x) && NumberValidator.isValid(y);
  }
  
  /**
   * Clamp position to screen bounds
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param width - Screen width
   * @param height - Screen height
   * @param margin - Margin from edges
   * @returns Clamped position
   */
  static clampToScreen(
    x: number,
    y: number,
    width: number,
    height: number,
    margin: number = 0
  ): { x: number; y: number } {
    return {
      x: NumberValidator.clamp(x, margin, width - margin, width / 2),
      y: NumberValidator.clamp(y, margin, height - margin, height / 2)
    };
  }
  
  /**
   * Validate distance between points
   * @param x1 - First X coordinate
   * @param y1 - First Y coordinate
   * @param x2 - Second X coordinate
   * @param y2 - Second Y coordinate
   * @param maxDistance - Maximum allowed distance
   * @returns Whether distance is valid
   */
  static isWithinDistance(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    maxDistance: number
  ): boolean {
    if (!this.isValid(x1, y1) || !this.isValid(x2, y2)) {
      return false;
    }
    
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    const maxDistSq = maxDistance * maxDistance;
    
    return distSq <= maxDistSq;
  }
}

/**
 * Velocity validation utilities
 */
export class VelocityValidator {
  /**
   * Validate velocity vector
   * @param vx - X velocity
   * @param vy - Y velocity
   * @returns Whether velocity is valid
   */
  static isValid(vx: unknown, vy: unknown): boolean {
    return NumberValidator.isValid(vx) && NumberValidator.isValid(vy);
  }
  
  /**
   * Clamp velocity to maximum speed
   * @param vx - X velocity
   * @param vy - Y velocity
   * @param maxSpeed - Maximum speed
   * @returns Clamped velocity
   */
  static clampSpeed(
    vx: number,
    vy: number,
    maxSpeed: number = 1000
  ): { vx: number; vy: number } {
    if (!this.isValid(vx, vy)) {
      return { vx: 0, vy: 0 };
    }
    
    const speed = Math.hypot(vx, vy);
    if (speed <= maxSpeed) {
      return { vx, vy };
    }
    
    const scale = maxSpeed / speed;
    return {
      vx: vx * scale,
      vy: vy * scale
    };
  }
  
  /**
   * Apply friction to velocity
   * @param vx - X velocity
   * @param vy - Y velocity
   * @param friction - Friction coefficient
   * @param dt - Delta time
   * @returns Velocity after friction
   */
  static applyFriction(
    vx: number,
    vy: number,
    friction: number = 0.95,
    dt: number = 1
  ): { vx: number; vy: number } {
    if (!this.isValid(vx, vy)) {
      return { vx: 0, vy: 0 };
    }
    
    const factor = Math.pow(1 - friction, dt);
    return {
      vx: vx * factor,
      vy: vy * factor
    };
  }
}

/**
 * Game entity validation utilities
 */
export class EntityValidator {
  /**
   * Validate entity size
   * @param size - Entity size
   * @param minSize - Minimum allowed size
   * @param maxSize - Maximum allowed size
   * @param fallback - Fallback size
   * @returns Valid size
   */
  static validateSize(
    size: unknown,
    minSize: number = SIZES.ASTEROID.MIN,
    maxSize: number = SIZES.ASTEROID.MAX_CHARGE_SIZE,
    fallback: number = SIZES.ASTEROID.MIN
  ): number {
    return NumberValidator.clamp(size, minSize, maxSize, fallback);
  }
  
  /**
   * Validate entity alive state
   * @param entity - Entity object
   * @returns Whether entity is alive
   */
  static isAlive(entity: unknown): entity is { alive: boolean; destroyed: boolean; x: number; y: number } {
    if (entity === null || entity === undefined || typeof entity !== 'object') {
      return false;
    }
    
    const obj = entity as Record<string, unknown>;
    return 'alive' in obj &&
           'destroyed' in obj &&
           'x' in obj &&
           'y' in obj &&
           obj.alive === true && 
           !obj.destroyed &&
           NumberValidator.isValid(obj.x) &&
           NumberValidator.isValid(obj.y);
  }
  
  /**
   * Validate collision between entities
   * @param entity1 - First entity
   * @param entity2 - Second entity
   * @returns Whether entities can collide
   */
  static canCollide(entity1: unknown, entity2: unknown): boolean {
    return this.isAlive(entity1) && 
           this.isAlive(entity2) &&
           entity1 !== entity2;
  }
}

/**
 * Input validation utilities
 */
export class InputValidator {
  /**
   * Validate pointer position
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param screenWidth - Screen width
   * @param screenHeight - Screen height
   * @returns Whether position is valid
   */
  static isValidPointerPosition(
    x: unknown,
    y: unknown,
    screenWidth: number,
    screenHeight: number
  ): boolean {
    return NumberValidator.isValid(x) &&
           NumberValidator.isValid(y) &&
           x >= 0 && x <= screenWidth &&
           y >= 0 && y <= screenHeight;
  }
  
  /**
   * Validate launch angle
   * @param angle - Launch angle in radians
   * @param minAngle - Minimum allowed angle
   * @param maxAngle - Maximum allowed angle
   * @returns Whether angle is valid
   */
  static isValidLaunchAngle(
    angle: number,
    minAngle: number = -Math.PI,
    maxAngle: number = Math.PI
  ): boolean {
    return NumberValidator.isValid(angle) &&
           angle >= minAngle &&
           angle <= maxAngle;
  }
  
  /**
   * Validate charge amount
   * @param charge - Charge value
   * @param maxCharge - Maximum charge
   * @returns Valid charge amount
   */
  static validateCharge(charge: unknown, maxCharge: number = 1): number {
    return NumberValidator.clamp(charge, 0, maxCharge, 0);
  }
}

/**
 * Array validation utilities
 */
export class ArrayValidator {
  /**
   * Ensure value is an array
   * @param value - Value to check
   * @param fallback - Fallback array
   * @returns Valid array
   */
  static ensure<T>(value: unknown, fallback: T[] = []): T[] {
    if (!Array.isArray(value)) {
      console.warn(`[ArrayValidator] Invalid array: ${value}, using fallback`);
      return fallback;
    }
    return value;
  }
  
  /**
   * Filter invalid entries from array
   * @param array - Array to filter
   * @param validator - Validation function
   * @returns Filtered array
   */
  static filter<T>(array: T[], validator: (item: T) => boolean): T[] {
    return array.filter((item, index) => {
      const isValid = validator(item);
      if (!isValid) {
        console.warn(`[ArrayValidator] Invalid item at index ${index}:`, item);
      }
      return isValid;
    });
  }
  
  /**
   * Limit array size
   * @param array - Array to limit
   * @param maxSize - Maximum size
   * @returns Limited array
   */
  static limit<T>(array: T[], maxSize: number): T[] {
    if (array.length <= maxSize) {
      return array;
    }
    
    console.warn(`[ArrayValidator] Array too large (${array.length}), limiting to ${maxSize}`);
    return array.slice(0, maxSize);
  }
}