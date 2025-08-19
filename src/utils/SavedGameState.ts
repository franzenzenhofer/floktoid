/**
 * SavedGameState - Handles game state persistence to localStorage
 * DRY principle: Single source of truth for saved game data
 */

export interface SavedGame {
  gameId: string;
  score: number;
  wave: number;
  timestamp: number;
  // Mid-wave state - continue exactly where left off
  birdsRemaining: number;  // How many birds left to spawn in this wave
  activeBirds: number;     // How many birds are currently on screen
  stolenDots: number[];    // Which dot indices are stolen (0-based)
  dotsLost: number;        // Total dots lost this wave
}

export class SavedGameState {
  private static readonly STORAGE_KEY = 'floktoid-saved-game';
  
  /**
   * Save current game state
   */
  static save(state: SavedGame): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      console.log(`[SAVED GAME] Saved game ${state.gameId} at wave ${state.wave}`);
    } catch (error) {
      console.error('[SAVED GAME] Failed to save:', error);
    }
  }
  
  /**
   * Load saved game state
   */
  static load(): SavedGame | null {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return null;
      
      const state = JSON.parse(saved) as SavedGame;
      
      // Validate saved state is recent (within 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (state.timestamp < sevenDaysAgo) {
        console.log('[SAVED GAME] Saved game too old, discarding');
        this.clear();
        return null;
      }
      
      console.log(`[SAVED GAME] Loaded game ${state.gameId} at wave ${state.wave}`);
      return state;
    } catch (error) {
      console.error('[SAVED GAME] Failed to load:', error);
      return null;
    }
  }
  
  /**
   * Clear saved game
   */
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[SAVED GAME] Cleared saved game');
  }
  
  /**
   * Check if saved game exists
   */
  static exists(): boolean {
    return localStorage.getItem(this.STORAGE_KEY) !== null;
  }
}