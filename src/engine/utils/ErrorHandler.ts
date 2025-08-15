/**
 * ErrorHandler - DRY error handling utilities
 * Consolidates error handling patterns across the codebase
 */


export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface GameError {
  message: string;
  severity: ErrorSeverity;
  context?: string;
  timestamp: number;
  stack?: string;
  data?: unknown;
}

/**
 * Centralized error handler for the game
 */
export class ErrorHandler {
  private static errors: GameError[] = [];
  private static maxErrors: number = 100;
  private static onError?: (error: GameError) => void;
  
  /**
   * Log an error
   * @param message - Error message
   * @param severity - Error severity
   * @param context - Context where error occurred
   * @param data - Additional error data
   */
  static log(
    message: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    context?: string,
    data?: unknown
  ): void {
    const error: GameError = {
      message,
      severity,
      context,
      timestamp: Date.now(),
      data
    };
    
    // Capture stack trace for errors and critical
    if (severity === ErrorSeverity.ERROR || severity === ErrorSeverity.CRITICAL) {
      error.stack = new Error().stack;
    }
    
    // Add to error list
    this.errors.push(error);
    
    // Maintain max errors limit
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
    
    // Console output based on severity
    this.outputToConsole(error);
    
    // Call error callback if set
    this.onError?.(error);
    
    // For critical errors, attempt recovery
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(error);
    }
  }
  
  /**
   * Output error to console
   * @param error - Game error object
   */
  private static outputToConsole(error: GameError): void {
    const prefix = error.context ? `[${error.context}]` : '[Game]';
    const message = `${prefix} ${error.message}`;
    
    switch (error.severity) {
      case ErrorSeverity.DEBUG:
        console.debug(message, error.data);
        break;
      case ErrorSeverity.INFO:
        console.info(message, error.data);
        break;
      case ErrorSeverity.WARNING:
        console.warn(message, error.data);
        break;
      case ErrorSeverity.ERROR:
        console.error(message, error.data, error.stack);
        break;
      case ErrorSeverity.CRITICAL:
        console.error(`🔴 CRITICAL: ${message}`, error.data, error.stack);
        break;
    }
  }
  
  /**
   * Handle critical errors
   * @param error - Critical error
   */
  private static handleCriticalError(error: GameError): void {
    // Attempt to save game state
    try {
      this.saveErrorReport(error);
    } catch (e) {
      console.error('Failed to save error report:', e);
    }
    
    // Notify user if possible
    if (typeof window !== 'undefined' && error.context !== 'Recovery') {
      // Don't show alert in production
      if (process.env.NODE_ENV !== 'production') {
        console.error('Critical error - check console for details');
      }
    }
  }
  
  /**
   * Save error report
   * @param error - Error to save
   */
  private static saveErrorReport(error: GameError): void {
    if (typeof localStorage !== 'undefined') {
      const errorKey = `error_${error.timestamp}`;
      localStorage.setItem(errorKey, JSON.stringify(error));
      
      // Keep only last 10 error reports
      const errorKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('error_'))
        .sort();
      
      if (errorKeys.length > 10) {
        localStorage.removeItem(errorKeys[0]);
      }
    }
  }
  
  /**
   * Safe try-catch wrapper
   * @param fn - Function to execute
   * @param context - Error context
   * @param fallback - Fallback value on error
   * @returns Result or fallback
   */
  static try<T>(fn: () => T, context: string, fallback?: T): T | undefined {
    try {
      return fn();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(errorMessage, ErrorSeverity.ERROR, context, error);
      return fallback;
    }
  }
  
  /**
   * Async safe try-catch wrapper
   * @param fn - Async function to execute
   * @param context - Error context
   * @param fallback - Fallback value on error
   * @returns Promise with result or fallback
   */
  static async tryAsync<T>(
    fn: () => Promise<T>,
    context: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(errorMessage, ErrorSeverity.ERROR, context, error);
      return fallback;
    }
  }
  
  /**
   * Validate and sanitize a value
   * @param value - Value to validate
   * @param validator - Validation function
   * @param context - Error context
   * @param fallback - Fallback value
   * @returns Validated value or fallback
   */
  static validate<T>(
    value: T,
    validator: (val: T) => boolean,
    context: string,
    fallback: T
  ): T {
    if (!validator(value)) {
      this.log(
        `Validation failed for value: ${JSON.stringify(value)}`,
        ErrorSeverity.WARNING,
        context
      );
      return fallback;
    }
    return value;
  }
  
  /**
   * Get recent errors
   * @param count - Number of errors to retrieve
   * @param severity - Filter by severity
   * @returns Array of recent errors
   */
  static getRecentErrors(
    count: number = 10,
    severity?: ErrorSeverity
  ): GameError[] {
    let errors = [...this.errors];
    
    if (severity) {
      errors = errors.filter(e => e.severity === severity);
    }
    
    return errors.slice(-count);
  }
  
  /**
   * Clear error log
   */
  static clearErrors(): void {
    this.errors = [];
  }
  
  /**
   * Set error callback
   * @param callback - Callback function
   */
  static setErrorCallback(callback: (error: GameError) => void): void {
    this.onError = callback;
  }
}

/**
 * Safe number operations
 */
export class SafeMath {
  /**
   * Safe division
   * @param a - Numerator
   * @param b - Denominator
   * @param fallback - Fallback value for division by zero
   * @returns Result or fallback
   */
  static divide(a: number, b: number, fallback: number = 0): number {
    if (b === 0 || !isFinite(b)) {
      ErrorHandler.log(
        `Division by zero or invalid denominator: ${a} / ${b}`,
        ErrorSeverity.WARNING,
        'SafeMath'
      );
      return fallback;
    }
    
    const result = a / b;
    if (!isFinite(result)) {
      ErrorHandler.log(
        `Invalid division result: ${a} / ${b} = ${result}`,
        ErrorSeverity.WARNING,
        'SafeMath'
      );
      return fallback;
    }
    
    return result;
  }
  
  /**
   * Clamp a value between min and max
   * @param value - Value to clamp
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Clamped value
   */
  static clamp(value: number, min: number, max: number): number {
    if (!isFinite(value)) {
      ErrorHandler.log(
        `Invalid value for clamp: ${value}`,
        ErrorSeverity.WARNING,
        'SafeMath'
      );
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Safe distance calculation
   * @param x1 - First X coordinate
   * @param y1 - First Y coordinate
   * @param x2 - Second X coordinate
   * @param y2 - Second Y coordinate
   * @returns Distance or 0 on error
   */
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distSq = dx * dx + dy * dy;
    
    if (!isFinite(distSq) || distSq < 0) {
      ErrorHandler.log(
        `Invalid distance calculation: (${x1}, ${y1}) to (${x2}, ${y2})`,
        ErrorSeverity.WARNING,
        'SafeMath'
      );
      return 0;
    }
    
    return Math.sqrt(distSq);
  }
}