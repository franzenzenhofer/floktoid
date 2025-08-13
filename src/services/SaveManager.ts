/**
 * @fileoverview Save System for Color Me Same
 * 
 * This module manages persistent game saves using localStorage as the primary
 * storage mechanism. It handles save versioning, migration, validation, and
 * corruption recovery to ensure players never lose progress.
 * 
 * Key features:
 * - Auto-save after level completion
 * - Version migration for backward compatibility
 * - Corruption detection and recovery
 * - Minimal performance impact
 * 
 * @module SaveManager
 */

import { log } from '../utils/logger';

/**
 * Saved game state interface
 * Contains all data needed to restore player progress
 */
export interface SavedGameState {
  currentLevel: number;
  totalPoints: number;
  levelPoints: number;
  completedLevels: number[];
  lastPlayed: string; // ISO date string
  version: string; // Save format version
  stats?: {
    totalMoves: number;
    totalTime: number;
    perfectLevels: number; // Completed in optimal moves
    hintsUsed: number;
  };
  // Current game state for mid-level resume
  currentGame?: {
    grid: number[][];
    targetGrid: number[][];
    moves: number;
    time: number;
    optimalPath: { row: number; col: number }[];
    hintsEnabled: boolean;
    undoCount: number;
    playerMoves: { row: number; col: number }[];
    initialGrid: number[][];
  };
}

/**
 * Current save format version
 * Increment when making breaking changes to SavedGameState
 */
const CURRENT_SAVE_VERSION = '1.1.0';

/**
 * localStorage key for game saves
 */
const SAVE_KEY = 'colorMeSame_save';

/**
 * Save manager singleton class
 * Handles all save/load operations with error handling and migration
 */
export class SaveManager {
  private static instance: SaveManager;
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }
  
  /**
   * Save game state to localStorage
   * 
   * @param state - Current game state to save
   * @returns Promise that resolves when save is complete
   */
  async save(state: SavedGameState): Promise<void> {
    try {
      // Ensure state has current version
      state.version = CURRENT_SAVE_VERSION;
      state.lastPlayed = new Date().toISOString();
      
      // Validate before saving
      if (!this.isValid(state)) {
        throw new Error('Invalid save state');
      }
      
      // Serialize and save
      const serialized = JSON.stringify(state);
      localStorage.setItem(SAVE_KEY, serialized);
      
      log('info', '💾 Game saved successfully', {
        level: state.currentLevel,
        points: state.totalPoints,
        completedLevels: state.completedLevels.length
      });
    } catch (error) {
      log('error', '❌ Failed to save game', { error });
      throw error;
    }
  }
  
  /**
   * Load game state from localStorage
   * 
   * @returns Saved game state or null if no save exists
   */
  async load(): Promise<SavedGameState | null> {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      
      if (!serialized) {
        log('info', 'No saved game found');
        return null;
      }
      
      let parsed: unknown;
      try {
        parsed = JSON.parse(serialized);
      } catch (e) {
        log('error', 'Failed to parse save data', { error: e });
        return null;
      }
      
      // Validate loaded data
      if (!this.isValid(parsed)) {
        log('warn', 'Invalid save data detected', { save: parsed });
        return null;
      }
      
      // Migrate if needed
      const validSave = parsed as Record<string, unknown>;
      if (validSave.version !== CURRENT_SAVE_VERSION) {
        log('info', 'Migrating save from older version', {
          from: validSave.version,
          to: CURRENT_SAVE_VERSION
        });
        parsed = this.migrate(validSave);
      }
      
      const result = parsed as SavedGameState;
      
      log('info', '✅ Game loaded successfully', {
        level: result.currentLevel,
        points: result.totalPoints,
        completedLevels: result.completedLevels.length,
        lastPlayed: result.lastPlayed
      });
      
      return result;
    } catch (error) {
      log('error', '❌ Failed to load game', { error });
      return null;
    }
  }
  
  /**
   * Clear saved game data
   */
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(SAVE_KEY);
      log('info', '🗑️ Save data cleared');
    } catch (error) {
      log('error', '❌ Failed to clear save data', { error });
      throw error;
    }
  }
  
  /**
   * Migrate save data from older versions
   * 
   * @param oldSave - Save data from an older version
   * @returns Migrated save data compatible with current version
   */
  migrate(oldSave: Record<string, unknown>): SavedGameState {
    // Start with default structure
    const stats = oldSave.stats as Record<string, number> | undefined;
    
    const migrated: SavedGameState = {
      currentLevel: (oldSave.currentLevel as number) || 1,
      totalPoints: (oldSave.totalPoints as number) || 0,
      levelPoints: (oldSave.levelPoints as number) || 0,
      completedLevels: (oldSave.completedLevels as number[]) || [],
      lastPlayed: (oldSave.lastPlayed as string) || new Date().toISOString(),
      version: CURRENT_SAVE_VERSION,
      stats: {
        totalMoves: stats?.totalMoves || 0,
        totalTime: stats?.totalTime || 0,
        perfectLevels: stats?.perfectLevels || 0,
        hintsUsed: stats?.hintsUsed || 0
      }
    };
    
    // Version-specific migrations
    if (!oldSave.version || oldSave.version < '1.0.0') {
      // Pre-1.0.0 saves might not have stats
      if (!oldSave.stats) {
        migrated.stats = {
          totalMoves: 0,
          totalTime: 0,
          perfectLevels: 0,
          hintsUsed: 0
        };
      }
    }
    
    return migrated;
  }
  
  /**
   * Validate save data structure
   * 
   * @param save - Data to validate
   * @returns True if save data is valid
   */
  isValid(save: unknown): boolean {
    if (!save || typeof save !== 'object' || save === null) {
      return false;
    }
    
    const record = save as Record<string, unknown>;
    
    // Check required fields
    const requiredFields = ['currentLevel', 'totalPoints', 'completedLevels'];
    for (const field of requiredFields) {
      if (!(field in record)) {
        return false;
      }
    }
    
    // Type checks
    if (typeof record.currentLevel !== 'number' || record.currentLevel < 1) {
      return false;
    }
    
    if (typeof record.totalPoints !== 'number' || record.totalPoints < 0) {
      return false;
    }
    
    if (!Array.isArray(record.completedLevels)) {
      return false;
    }
    
    // All completed levels should be positive integers
    if (!record.completedLevels.every((level: unknown) => 
      typeof level === 'number' && level > 0 && Number.isInteger(level)
    )) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Create a new save state from current game state
   * 
   * @param currentLevel - Current level number
   * @param totalPoints - Total points earned
   * @param levelPoints - Points for current level
   * @param completedLevels - Array of completed level numbers
   * @returns New save state object
   */
  createSaveState(
    currentLevel: number,
    totalPoints: number,
    levelPoints: number,
    completedLevels: number[],
    stats?: SavedGameState['stats']
  ): SavedGameState {
    return {
      currentLevel,
      totalPoints,
      levelPoints,
      completedLevels: [...completedLevels], // Copy array to prevent mutations
      lastPlayed: new Date().toISOString(),
      version: CURRENT_SAVE_VERSION,
      stats: stats || {
        totalMoves: 0,
        totalTime: 0,
        perfectLevels: 0,
        hintsUsed: 0
      }
    };
  }
  
  /**
   * Check if a save exists
   */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }
}

// Export singleton instance
export const saveManager = SaveManager.getInstance();