/**
 * StateManager - DRY state management utilities
 * Consolidates game state management patterns
 */

export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory',
  LOADING = 'loading'
}

export interface GameStateData {
  score: number;
  wave: number;
  lives: number;
  combo: number;
  highScore: number;
  enemiesKilled: number;
  asteroidsLaunched: number;
  energyDotsRemaining: number;
  timeElapsed: number;
}

/**
 * Generic state manager for game objects
 */
export class StateManager<T extends Record<string, unknown>> {
  private state: T;
  private previousState: T;
  private listeners: Map<keyof T, Set<(value: unknown, prevValue: unknown) => void>> = new Map();
  private globalListeners: Set<(state: T, prevState: T) => void> = new Set();
  
  constructor(initialState: T) {
    this.state = { ...initialState };
    this.previousState = { ...initialState };
  }
  
  /**
   * Get current state value
   * @param key - State key
   * @returns State value
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.state[key];
  }
  
  /**
   * Set state value
   * @param key - State key
   * @param value - New value
   */
  set<K extends keyof T>(key: K, value: T[K]): void {
    if (this.state[key] === value) return;
    
    const prevValue = this.state[key];
    this.previousState[key] = prevValue;
    this.state[key] = value;
    
    // Notify specific listeners
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(value, prevValue);
        } catch (error) {
          console.error(`[StateManager] Error in listener for ${String(key)}:`, error);
        }
      });
    }
    
    // Notify global listeners
    this.globalListeners.forEach(callback => {
      try {
        callback(this.state, this.previousState);
      } catch (error) {
        console.error('[StateManager] Error in global listener:', error);
      }
    });
  }
  
  /**
   * Update multiple state values
   * @param updates - Object with state updates
   */
  update(updates: Partial<T>): void {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key as keyof T, value);
    });
  }
  
  /**
   * Subscribe to state changes
   * @param key - State key to watch
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribe<K extends keyof T>(
    key: K,
    callback: (value: T[K], prevValue: T[K]) => void
  ): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    const wrappedCallback = (value: unknown, prevValue: unknown) => {
      callback(value as T[K], prevValue as T[K]);
    };
    
    this.listeners.get(key)!.add(wrappedCallback);
    
    return () => {
      this.listeners.get(key)?.delete(wrappedCallback);
    };
  }
  
  /**
   * Subscribe to all state changes
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  subscribeAll(callback: (state: T, prevState: T) => void): () => void {
    this.globalListeners.add(callback);
    
    return () => {
      this.globalListeners.delete(callback);
    };
  }
  
  /**
   * Get entire state object
   * @returns Current state
   */
  getState(): Readonly<T> {
    return { ...this.state };
  }
  
  /**
   * Get previous state
   * @returns Previous state
   */
  getPreviousState(): Readonly<T> {
    return { ...this.previousState };
  }
  
  /**
   * Reset state to initial values
   * @param initialState - Initial state values
   */
  reset(initialState: T): void {
    this.previousState = { ...this.state };
    this.state = { ...initialState };
    
    // Notify all listeners of reset
    this.globalListeners.forEach(callback => {
      try {
        callback(this.state, this.previousState);
      } catch (error) {
        console.error('[StateManager] Error in global listener during reset:', error);
      }
    });
  }
  
  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

/**
 * Game state machine
 */
export class GameStateMachine {
  private currentState: GameState;
  private transitions: Map<GameState, Set<GameState>> = new Map();
  private enterCallbacks: Map<GameState, Set<() => void>> = new Map();
  private exitCallbacks: Map<GameState, Set<() => void>> = new Map();
  private updateCallbacks: Map<GameState, Set<(dt: number) => void>> = new Map();
  
  constructor(initialState: GameState = GameState.MENU) {
    this.currentState = initialState;
    
    // Define valid state transitions
    this.setupTransitions();
  }
  
  /**
   * Setup valid state transitions
   */
  private setupTransitions(): void {
    // Menu can go to playing or loading
    this.addTransition(GameState.MENU, GameState.PLAYING);
    this.addTransition(GameState.MENU, GameState.LOADING);
    
    // Loading can go to playing
    this.addTransition(GameState.LOADING, GameState.PLAYING);
    
    // Playing can go to paused, game over, or victory
    this.addTransition(GameState.PLAYING, GameState.PAUSED);
    this.addTransition(GameState.PLAYING, GameState.GAME_OVER);
    this.addTransition(GameState.PLAYING, GameState.VICTORY);
    
    // Paused can go back to playing or menu
    this.addTransition(GameState.PAUSED, GameState.PLAYING);
    this.addTransition(GameState.PAUSED, GameState.MENU);
    
    // Game over and victory can go to menu or playing (restart)
    this.addTransition(GameState.GAME_OVER, GameState.MENU);
    this.addTransition(GameState.GAME_OVER, GameState.PLAYING);
    this.addTransition(GameState.VICTORY, GameState.MENU);
    this.addTransition(GameState.VICTORY, GameState.PLAYING);
  }
  
  /**
   * Add a valid transition
   * @param from - From state
   * @param to - To state
   */
  private addTransition(from: GameState, to: GameState): void {
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Set());
    }
    this.transitions.get(from)!.add(to);
  }
  
  /**
   * Check if transition is valid
   * @param to - Target state
   * @returns Whether transition is valid
   */
  canTransitionTo(to: GameState): boolean {
    const validTransitions = this.transitions.get(this.currentState);
    return validTransitions?.has(to) ?? false;
  }
  
  /**
   * Transition to a new state
   * @param newState - New state
   * @returns Whether transition was successful
   */
  transitionTo(newState: GameState): boolean {
    if (!this.canTransitionTo(newState)) {
      console.warn(`[GameStateMachine] Invalid transition from ${this.currentState} to ${newState}`);
      return false;
    }
    
    // Call exit callbacks for current state
    const exitCallbacks = this.exitCallbacks.get(this.currentState);
    if (exitCallbacks) {
      exitCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`[GameStateMachine] Error in exit callback for ${this.currentState}:`, error);
        }
      });
    }
    
    // Change state
    const previousState = this.currentState;
    this.currentState = newState;
    
    // Call enter callbacks for new state
    const enterCallbacks = this.enterCallbacks.get(newState);
    if (enterCallbacks) {
      enterCallbacks.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error(`[GameStateMachine] Error in enter callback for ${newState}:`, error);
        }
      });
    }
    
    console.log(`[GameStateMachine] Transitioned from ${previousState} to ${newState}`);
    return true;
  }
  
  /**
   * Register enter callback for a state
   * @param state - State
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onEnter(state: GameState, callback: () => void): () => void {
    if (!this.enterCallbacks.has(state)) {
      this.enterCallbacks.set(state, new Set());
    }
    
    this.enterCallbacks.get(state)!.add(callback);
    
    return () => {
      this.enterCallbacks.get(state)?.delete(callback);
    };
  }
  
  /**
   * Register exit callback for a state
   * @param state - State
   * @param callback - Callback function
   * @returns Unsubscribe function
   */
  onExit(state: GameState, callback: () => void): () => void {
    if (!this.exitCallbacks.has(state)) {
      this.exitCallbacks.set(state, new Set());
    }
    
    this.exitCallbacks.get(state)!.add(callback);
    
    return () => {
      this.exitCallbacks.get(state)?.delete(callback);
    };
  }
  
  /**
   * Register update callback for a state
   * @param state - State
   * @param callback - Callback function with delta time
   * @returns Unsubscribe function
   */
  onUpdate(state: GameState, callback: (dt: number) => void): () => void {
    if (!this.updateCallbacks.has(state)) {
      this.updateCallbacks.set(state, new Set());
    }
    
    this.updateCallbacks.get(state)!.add(callback);
    
    return () => {
      this.updateCallbacks.get(state)?.delete(callback);
    };
  }
  
  /**
   * Update current state
   * @param dt - Delta time
   */
  update(dt: number): void {
    const updateCallbacks = this.updateCallbacks.get(this.currentState);
    if (updateCallbacks) {
      updateCallbacks.forEach(callback => {
        try {
          callback(dt);
        } catch (error) {
          console.error(`[GameStateMachine] Error in update callback for ${this.currentState}:`, error);
        }
      });
    }
  }
  
  /**
   * Get current state
   * @returns Current state
   */
  getState(): GameState {
    return this.currentState;
  }
  
  /**
   * Check if in specific state
   * @param state - State to check
   * @returns Whether in that state
   */
  isInState(state: GameState): boolean {
    return this.currentState === state;
  }
}