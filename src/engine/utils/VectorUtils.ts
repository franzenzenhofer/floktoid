/**
 * VectorUtils - Centralized vector mathematics utilities
 * DRY: Eliminates duplicate vector normalization and safety checks
 */

export interface Vector2D {
  x: number;
  y: number;
}

export class VectorUtils {
  /**
   * Normalize a vector to unit length with NaN/Infinity protection
   */
  static normalize(vector: Vector2D): Vector2D {
    const magnitude = Math.hypot(vector.x, vector.y);
    
    // Safety check for invalid values
    if (!isFinite(magnitude) || magnitude === 0 || !isFinite(vector.x) || !isFinite(vector.y)) {
      console.warn('[VectorUtils] Invalid vector detected, returning zero vector:', vector);
      return { x: 0, y: 0 };
    }
    
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }
  
  /**
   * Limit vector magnitude to max speed
   */
  static limitMagnitude(vector: Vector2D, maxMagnitude: number): Vector2D {
    const magnitude = Math.hypot(vector.x, vector.y);
    
    // Safety check
    if (!isFinite(magnitude) || !isFinite(maxMagnitude)) {
      console.warn('[VectorUtils] Invalid magnitude detected');
      return { x: 0, y: 0 };
    }
    
    if (magnitude > maxMagnitude && magnitude > 0) {
      return {
        x: (vector.x / magnitude) * maxMagnitude,
        y: (vector.y / magnitude) * maxMagnitude
      };
    }
    
    return vector;
  }
  
  /**
   * Clamp vector components to range
   */
  static clamp(vector: Vector2D, min: number, max: number): Vector2D {
    return {
      x: Math.max(min, Math.min(max, vector.x)),
      y: Math.max(min, Math.min(max, vector.y))
    };
  }
  
  /**
   * Safe distance calculation with NaN protection
   */
  static distance(a: Vector2D, b: Vector2D): number {
    // Safety check positions
    if (!isFinite(a.x) || !isFinite(a.y) || !isFinite(b.x) || !isFinite(b.y)) {
      console.warn('[VectorUtils] Invalid positions in distance calculation');
      return Infinity;
    }
    
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    
    if (!isFinite(dist)) {
      console.warn('[VectorUtils] Invalid distance calculated');
      return Infinity;
    }
    
    return dist;
  }
  
  /**
   * Add two vectors
   */
  static add(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x + b.x,
      y: a.y + b.y
    };
  }
  
  /**
   * Subtract two vectors
   */
  static subtract(a: Vector2D, b: Vector2D): Vector2D {
    return {
      x: a.x - b.x,
      y: a.y - b.y
    };
  }
  
  /**
   * Scale a vector by a scalar
   */
  static scale(vector: Vector2D, scalar: number): Vector2D {
    return {
      x: vector.x * scalar,
      y: vector.y * scalar
    };
  }
  
  /**
   * Get angle from vector
   */
  static angle(vector: Vector2D): number {
    return Math.atan2(vector.y, vector.x);
  }
  
  /**
   * Create vector from angle and magnitude
   */
  static fromAngle(angle: number, magnitude: number = 1): Vector2D {
    return {
      x: Math.cos(angle) * magnitude,
      y: Math.sin(angle) * magnitude
    };
  }
  
  /**
   * Dot product of two vectors
   */
  static dot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y;
  }
  
  /**
   * Check if vector is valid (no NaN/Infinity)
   */
  static isValid(vector: Vector2D): boolean {
    return isFinite(vector.x) && isFinite(vector.y);
  }
  
  /**
   * Ensure vector is valid, return default if not
   */
  static ensureValid(vector: Vector2D, defaultVector: Vector2D = { x: 0, y: 0 }): Vector2D {
    return this.isValid(vector) ? vector : defaultVector;
  }
}