/**
 * EventManager - DRY event handling utilities
 * Consolidates common event patterns and listeners
 */

// Type definitions for PIXI event handling
interface PixiEventTarget {
  on(event: string, fn: (...args: unknown[]) => void): void;
  off(event: string, fn: (...args: unknown[]) => void): void;
  addEventListener?: never;
}

interface PixiPointerEvent {
  data?: {
    global?: {
      x: number;
      y: number;
    };
  };
  clientX?: never;
  clientY?: never;
}


export type GameEventType = 
  | 'gameStart'
  | 'gameOver'
  | 'waveComplete'
  | 'birdHit'
  | 'asteroidHit'
  | 'energyDotLost'
  | 'energyDotReclaimed'
  | 'scoreUpdate'
  | 'comboUpdate'
  | 'pause'
  | 'resume';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
  timestamp: number;
}

/**
 * Centralized event manager for game events
 */
export class EventManager {
  private listeners: Map<GameEventType, Set<(event: GameEvent) => void>> = new Map();
  private eventQueue: GameEvent[] = [];
  private isProcessing: boolean = false;
  
  /**
   * Subscribe to an event
   * @param type - Event type
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  on(type: GameEventType, callback: (event: GameEvent) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    
    this.listeners.get(type)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(callback);
    };
  }
  
  /**
   * Emit an event
   * @param type - Event type
   * @param data - Event data
   */
  emit(type: GameEventType, data?: unknown): void {
    const event: GameEvent = {
      type,
      data,
      timestamp: Date.now()
    };
    
    // Queue event for processing
    this.eventQueue.push(event);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  /**
   * Process event queue
   */
  private processQueue(): void {
    this.isProcessing = true;
    
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      const listeners = this.listeners.get(event.type);
      
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`[EventManager] Error in ${event.type} handler:`, error);
          }
        });
      }
    }
    
    this.isProcessing = false;
  }
  
  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
    this.eventQueue = [];
  }
  
  /**
   * Clear listeners for specific event type
   * @param type - Event type
   */
  clearType(type: GameEventType): void {
    this.listeners.delete(type);
  }
}

/**
 * Input event handler utilities
 */
export class InputHandler {
  private isPointerDown: boolean = false;
  private startPos: { x: number; y: number } | null = null;
  private currentPos: { x: number; y: number } | null = null;
  
  /**
   * Setup pointer event handlers
   * @param element - DOM element or PIXI container
   * @param handlers - Event handlers
   */
  setupPointerEvents(
    element: HTMLElement | PixiEventTarget,
    handlers: {
      onPointerDown?: (x: number, y: number) => void;
      onPointerMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
      onPointerUp?: (x: number, y: number, duration: number) => void;
      onPointerCancel?: () => void;
    }
  ): () => void {
    const handleStart = (e: PointerEvent | PixiPointerEvent) => {
      this.isPointerDown = true;
      const pos = this.getPosition(e);
      this.startPos = pos;
      this.currentPos = pos;
      handlers.onPointerDown?.(pos.x, pos.y);
    };
    
    const handleMove = (e: PointerEvent | PixiPointerEvent) => {
      if (!this.isPointerDown || !this.startPos) return;
      
      const pos = this.getPosition(e);
      const deltaX = pos.x - (this.currentPos?.x ?? pos.x);
      const deltaY = pos.y - (this.currentPos?.y ?? pos.y);
      this.currentPos = pos;
      
      handlers.onPointerMove?.(pos.x, pos.y, deltaX, deltaY);
    };
    
    const handleEnd = (e: PointerEvent | PixiPointerEvent) => {
      if (!this.isPointerDown || !this.startPos) return;
      
      const pos = this.getPosition(e);
      const startTime = this.startPos && 'timestamp' in this.startPos ? 
        (this.startPos as { timestamp: number }).timestamp : Date.now();
      const duration = Date.now() - startTime;
      
      handlers.onPointerUp?.(pos.x, pos.y, duration);
      
      this.isPointerDown = false;
      this.startPos = null;
      this.currentPos = null;
    };
    
    const handleCancel = () => {
      handlers.onPointerCancel?.();
      this.isPointerDown = false;
      this.startPos = null;
      this.currentPos = null;
    };
    
    // Add listeners
    if (element.addEventListener) {
      // DOM element
      element.addEventListener('pointerdown', handleStart);
      element.addEventListener('pointermove', handleMove);
      element.addEventListener('pointerup', handleEnd);
      element.addEventListener('pointercancel', handleCancel);
      
      return () => {
        element.removeEventListener('pointerdown', handleStart);
        element.removeEventListener('pointermove', handleMove);
        element.removeEventListener('pointerup', handleEnd);
        element.removeEventListener('pointercancel', handleCancel);
      };
    } else {
      // PIXI element - wrap handlers for proper typing
      const wrappedStart = (...args: unknown[]) => handleStart(args[0] as PixiPointerEvent);
      const wrappedMove = (...args: unknown[]) => handleMove(args[0] as PixiPointerEvent);
      const wrappedEnd = (...args: unknown[]) => handleEnd(args[0] as PixiPointerEvent);
      const wrappedCancel = () => handleCancel();
      
      element.on('pointerdown', wrappedStart);
      element.on('pointermove', wrappedMove);
      element.on('pointerup', wrappedEnd);
      element.on('pointercancel', wrappedCancel);
      
      return () => {
        element.off('pointerdown', wrappedStart);
        element.off('pointermove', wrappedMove);
        element.off('pointerup', wrappedEnd);
        element.off('pointercancel', wrappedCancel);
      };
    }
  }
  
  /**
   * Get position from event
   * @param e - Event object
   * @returns Position object with timestamp
   */
  private getPosition(e: PointerEvent | PixiPointerEvent): { x: number; y: number; timestamp: number } {
    let x: number, y: number;
    
    if ('data' in e && e.data?.global) {
      // PIXI event
      x = e.data.global.x;
      y = e.data.global.y;
    } else if ('clientX' in e && e.clientX !== undefined) {
      // DOM event
      x = e.clientX;
      y = e.clientY;
    } else {
      x = 0;
      y = 0;
    }
    
    return { x, y, timestamp: Date.now() };
  }
  
  /**
   * Check if pointer is down
   */
  get isDown(): boolean {
    return this.isPointerDown;
  }
  
  /**
   * Get current pointer position
   */
  get position(): { x: number; y: number } | null {
    return this.currentPos;
  }
}

// Singleton instance
export const gameEventManager = new EventManager();