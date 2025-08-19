/**
 * Unit tests for SavedGameState save/restore logic
 * Ensures what we save is exactly what we restore
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SavedGameState, type SavedGame } from '../SavedGameState';

// Mock localStorage for tests
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Set up localStorage mock
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('SavedGameState', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Save and Restore Integrity', () => {
    it('should restore exactly what was saved', () => {
      const originalState: SavedGame = {
        gameId: 'game_123_test',
        score: 5432,
        wave: 7,
        timestamp: Date.now(),
        birdsRemaining: 3,
        activeBirds: 2,
        stolenDots: [0, 2, 4],
        dotsLost: 2
      };

      // Save the state
      SavedGameState.save(originalState);

      // Load the state
      const restoredState = SavedGameState.load();

      // Verify exact match
      expect(restoredState).not.toBeNull();
      expect(restoredState?.gameId).toBe(originalState.gameId);
      expect(restoredState?.score).toBe(originalState.score);
      expect(restoredState?.wave).toBe(originalState.wave);
      expect(restoredState?.timestamp).toBe(originalState.timestamp);
      expect(restoredState?.birdsRemaining).toBe(originalState.birdsRemaining);
      expect(restoredState?.activeBirds).toBe(originalState.activeBirds);
      expect(restoredState?.stolenDots).toEqual(originalState.stolenDots);
      expect(restoredState?.dotsLost).toBe(originalState.dotsLost);
    });

    it('should handle edge case: wave 1 with no stolen dots', () => {
      const state: SavedGame = {
        gameId: 'game_456_test',
        score: 1000,
        wave: 1,
        timestamp: Date.now(),
        birdsRemaining: 2,
        activeBirds: 0,
        stolenDots: [],
        dotsLost: 0
      };

      SavedGameState.save(state);
      const restored = SavedGameState.load();

      expect(restored?.wave).toBe(1);
      expect(restored?.stolenDots).toEqual([]);
      expect(restored?.dotsLost).toBe(0);
    });

    it('should handle edge case: high wave with many stolen dots', () => {
      const state: SavedGame = {
        gameId: 'game_789_test',
        score: 999999,
        wave: 42,
        timestamp: Date.now(),
        birdsRemaining: 15,
        activeBirds: 5,
        stolenDots: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        dotsLost: 9
      };

      SavedGameState.save(state);
      const restored = SavedGameState.load();

      expect(restored?.wave).toBe(42);
      expect(restored?.stolenDots).toHaveLength(9);
      expect(restored?.stolenDots).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(restored?.dotsLost).toBe(9);
    });
  });

  describe('Clear Functionality', () => {
    it('should clear saved game', () => {
      const state: SavedGame = {
        gameId: 'game_clear_test',
        score: 1234,
        wave: 3,
        timestamp: Date.now(),
        birdsRemaining: 4,
        activeBirds: 1,
        stolenDots: [1],
        dotsLost: 1
      };

      SavedGameState.save(state);
      expect(SavedGameState.exists()).toBe(true);

      SavedGameState.clear();
      expect(SavedGameState.exists()).toBe(false);
      expect(SavedGameState.load()).toBeNull();
    });
  });

  describe('Expiration Logic', () => {
    it('should not load games older than 7 days', () => {
      const oldState: SavedGame = {
        gameId: 'game_old_test',
        score: 5000,
        wave: 5,
        timestamp: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days ago
        birdsRemaining: 2,
        activeBirds: 1,
        stolenDots: [3],
        dotsLost: 1
      };

      // Manually set in localStorage to bypass save method
      localStorage.setItem('floktoid-saved-game', JSON.stringify(oldState));

      const restored = SavedGameState.load();
      expect(restored).toBeNull();
      expect(SavedGameState.exists()).toBe(false);
    });

    it('should load games within 7 days', () => {
      const recentState: SavedGame = {
        gameId: 'game_recent_test',
        score: 6000,
        wave: 6,
        timestamp: Date.now() - (6 * 24 * 60 * 60 * 1000), // 6 days ago
        birdsRemaining: 3,
        activeBirds: 2,
        stolenDots: [2, 4],
        dotsLost: 2
      };

      // Manually set in localStorage
      localStorage.setItem('floktoid-saved-game', JSON.stringify(recentState));

      const restored = SavedGameState.load();
      expect(restored).not.toBeNull();
      expect(restored?.gameId).toBe('game_recent_test');
      expect(restored?.wave).toBe(6);
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.setItem('floktoid-saved-game', 'not valid json {]');

      const restored = SavedGameState.load();
      expect(restored).toBeNull();
    });

    it('should handle missing fields gracefully', () => {
      const incompleteState = {
        gameId: 'incomplete',
        score: 1000,
        // Missing other required fields
      };

      localStorage.setItem('floktoid-saved-game', JSON.stringify(incompleteState));

      const restored = SavedGameState.load();
      // Should still load but with undefined fields
      expect(restored?.gameId).toBe('incomplete');
      expect(restored?.score).toBe(1000);
      expect(restored?.birdsRemaining).toBeUndefined();
    });
  });

  describe('Real Game Scenarios', () => {
    it('should handle typical wave 2 save from home button', () => {
      // User is in wave 2, clicks home button
      const wave2State: SavedGame = {
        gameId: 'game_home_test',
        score: 2500,
        wave: 2, // Currently in wave 2
        timestamp: Date.now(),
        birdsRemaining: 3, // 3 birds left to spawn in wave 2
        activeBirds: 1, // 1 bird currently on screen
        stolenDots: [1], // One dot stolen
        dotsLost: 1
      };

      SavedGameState.save(wave2State);
      const restored = SavedGameState.load();

      // Should restore to wave 2, not wave 3!
      expect(restored?.wave).toBe(2);
      expect(restored?.birdsRemaining).toBe(3);
      expect(restored?.stolenDots).toEqual([1]);
    });

    it('should handle wave completion auto-save', () => {
      // Just completed wave 3, starting wave 4
      const wave4Start: SavedGame = {
        gameId: 'game_auto_test',
        score: 4000,
        wave: 4, // Just started wave 4
        timestamp: Date.now(),
        birdsRemaining: 6, // Full birds for wave 4
        activeBirds: 0, // No birds on screen yet
        stolenDots: [], // Fresh wave, no stolen dots
        dotsLost: 0
      };

      SavedGameState.save(wave4Start);
      const restored = SavedGameState.load();

      expect(restored?.wave).toBe(4);
      expect(restored?.birdsRemaining).toBe(6);
      expect(restored?.stolenDots).toEqual([]);
    });
  });
});