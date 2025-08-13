import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager, SavedGameState } from '../SaveManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

// Replace global localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SaveManager', () => {
  let saveManager: SaveManager;

  beforeEach(() => {
    localStorageMock.clear();
    saveManager = SaveManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = SaveManager.getInstance();
      const instance2 = SaveManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('save', () => {
    it('should save valid game state to localStorage', async () => {
      const gameState: SavedGameState = {
        currentLevel: 5,
        totalPoints: 1000,
        levelPoints: 100,
        completedLevels: [1, 2, 3, 4],
        lastPlayed: new Date().toISOString(),
        version: '1.0.0'
      };

      await saveManager.save(gameState);

      const saved = localStorage.getItem('colorMeSame_save');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.currentLevel).toBe(5);
      expect(parsed.totalPoints).toBe(1000);
      expect(parsed.completedLevels).toEqual([1, 2, 3, 4]);
    });

    it('should update lastPlayed on save', async () => {
      const now = new Date();
      const gameState: SavedGameState = {
        currentLevel: 1,
        totalPoints: 0,
        levelPoints: 0,
        completedLevels: [],
        lastPlayed: '2020-01-01',
        version: '1.0.0'
      };

      await saveManager.save(gameState);

      const saved = JSON.parse(localStorage.getItem('colorMeSame_save')!);
      const savedDate = new Date(saved.lastPlayed);
      expect(savedDate.getTime()).toBeGreaterThanOrEqual(now.getTime());
    });

    it('should reject invalid save state', async () => {
      const invalidState = {
        currentLevel: -1, // Invalid
        totalPoints: 0,
        levelPoints: 0,
        completedLevels: [],
        lastPlayed: '',
        version: '1.0.0'
      } as SavedGameState;

      await expect(saveManager.save(invalidState)).rejects.toThrow();
    });
  });

  describe('load', () => {
    it('should load saved game state', async () => {
      const gameState: SavedGameState = {
        currentLevel: 10,
        totalPoints: 2500,
        levelPoints: 250,
        completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        lastPlayed: new Date().toISOString(),
        version: '1.0.0',
        stats: {
          totalMoves: 100,
          totalTime: 3600,
          perfectLevels: 3,
          hintsUsed: 2
        }
      };

      localStorage.setItem('colorMeSame_save', JSON.stringify(gameState));

      const loaded = await saveManager.load();
      expect(loaded).toBeTruthy();
      expect(loaded!.currentLevel).toBe(10);
      expect(loaded!.totalPoints).toBe(2500);
      expect(loaded!.version).toBe('1.1.0'); // Migrated version
    });

    it('should return null if no save exists', async () => {
      const loaded = await saveManager.load();
      expect(loaded).toBeNull();
    });

    it('should return null for corrupted save data', async () => {
      localStorage.setItem('colorMeSame_save', 'invalid json data');
      const loaded = await saveManager.load();
      expect(loaded).toBeNull();
    });

    it('should migrate old save format', async () => {
      const oldSave = {
        currentLevel: 5,
        totalPoints: 1000,
        completedLevels: [1, 2, 3, 4],
        // Missing required fields
      };

      localStorage.setItem('colorMeSame_save', JSON.stringify(oldSave));

      const loaded = await saveManager.load();
      expect(loaded).toBeTruthy();
      expect(loaded!.version).toBe('1.1.0');
      expect(loaded!.levelPoints).toBe(0);
      expect(loaded!.stats).toBeTruthy();
    });
  });

  describe('clear', () => {
    it('should remove saved data', async () => {
      localStorage.setItem('colorMeSame_save', 'some data');
      
      await saveManager.clear();
      
      expect(localStorage.getItem('colorMeSame_save')).toBeNull();
    });
  });

  describe('hasSave', () => {
    it('should return true when save exists', () => {
      localStorage.setItem('colorMeSame_save', 'some data');
      expect(saveManager.hasSave()).toBe(true);
    });

    it('should return false when no save exists', () => {
      expect(saveManager.hasSave()).toBe(false);
    });
  });

  describe('isValid', () => {
    it('should validate correct save data', () => {
      const validSave = {
        currentLevel: 5,
        totalPoints: 1000,
        levelPoints: 100,
        completedLevels: [1, 2, 3, 4]
      };

      expect(saveManager.isValid(validSave)).toBe(true);
    });

    it('should reject save with missing fields', () => {
      const invalidSave = {
        currentLevel: 5,
        totalPoints: 1000
        // Missing completedLevels
      };

      expect(saveManager.isValid(invalidSave)).toBe(false);
    });

    it('should reject save with invalid level', () => {
      const invalidSave = {
        currentLevel: 0, // Must be >= 1
        totalPoints: 1000,
        completedLevels: []
      };

      expect(saveManager.isValid(invalidSave)).toBe(false);
    });

    it('should reject save with negative points', () => {
      const invalidSave = {
        currentLevel: 1,
        totalPoints: -100,
        completedLevels: []
      };

      expect(saveManager.isValid(invalidSave)).toBe(false);
    });

    it('should reject save with invalid completed levels', () => {
      const invalidSave = {
        currentLevel: 1,
        totalPoints: 0,
        completedLevels: [1, 0, -1, 2.5] // Invalid levels
      };

      expect(saveManager.isValid(invalidSave)).toBe(false);
    });
  });

  describe('createSaveState', () => {
    it('should create valid save state', () => {
      const save = saveManager.createSaveState(
        10,
        2500,
        250,
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        {
          totalMoves: 150,
          totalTime: 3600,
          perfectLevels: 4,
          hintsUsed: 1
        }
      );

      expect(save.currentLevel).toBe(10);
      expect(save.totalPoints).toBe(2500);
      expect(save.levelPoints).toBe(250);
      expect(save.completedLevels).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(save.version).toBe('1.1.0');
      expect(save.stats?.totalMoves).toBe(150);
    });

    it('should create save state with default stats', () => {
      const save = saveManager.createSaveState(1, 0, 0, []);

      expect(save.stats).toEqual({
        totalMoves: 0,
        totalTime: 0,
        perfectLevels: 0,
        hintsUsed: 0
      });
    });
  });

  describe('migrate', () => {
    it('should migrate pre-1.0.0 saves', () => {
      const oldSave = {
        currentLevel: 5,
        totalPoints: 1000,
        completedLevels: [1, 2, 3, 4],
        // No version, no stats
      };

      const migrated = saveManager.migrate(oldSave);

      expect(migrated.version).toBe('1.1.0');
      expect(migrated.levelPoints).toBe(0);
      expect(migrated.stats).toEqual({
        totalMoves: 0,
        totalTime: 0,
        perfectLevels: 0,
        hintsUsed: 0
      });
    });

    it('should preserve existing data during migration', () => {
      const oldSave = {
        currentLevel: 15,
        totalPoints: 5000,
        completedLevels: [1, 2, 3, 4, 5],
        lastPlayed: '2024-01-01',
        version: '0.9.0'
      };

      const migrated = saveManager.migrate(oldSave);

      expect(migrated.currentLevel).toBe(15);
      expect(migrated.totalPoints).toBe(5000);
      expect(migrated.completedLevels).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('currentGame state', () => {
    it('should save current game state for mid-level resume', async () => {
      const gameState: SavedGameState = {
        currentLevel: 5,
        totalPoints: 1000,
        levelPoints: 50,
        completedLevels: [1, 2, 3, 4],
        lastPlayed: new Date().toISOString(),
        version: '1.1.0',
        currentGame: {
          grid: [[0, 1, 2], [1, 2, 0], [2, 0, 1]],
          targetGrid: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
          moves: 3,
          time: 45,
          optimalPath: [{ row: 0, col: 0 }, { row: 1, col: 1 }],
          hintsEnabled: false,
          undoCount: 1,
          playerMoves: [{ row: 0, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 2 }],
          initialGrid: [[1, 1, 2], [1, 0, 0], [2, 0, 1]]
        }
      };

      await saveManager.save(gameState);

      const saved = JSON.parse(localStorage.getItem('colorMeSame_save')!);
      expect(saved.currentGame).toBeDefined();
      expect(saved.currentGame.grid).toEqual([[0, 1, 2], [1, 2, 0], [2, 0, 1]]);
      expect(saved.currentGame.moves).toBe(3);
      expect(saved.currentGame.playerMoves).toHaveLength(3);
    });

    it('should load current game state correctly', async () => {
      const gameState: SavedGameState = {
        currentLevel: 7,
        totalPoints: 1500,
        levelPoints: 0,
        completedLevels: [1, 2, 3, 4, 5, 6],
        lastPlayed: new Date().toISOString(),
        version: '1.1.0',
        currentGame: {
          grid: [[2, 2, 2], [2, 0, 2], [2, 2, 2]],
          targetGrid: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
          moves: 10,
          time: 180,
          optimalPath: [{ row: 1, col: 1 }],
          hintsEnabled: true,
          undoCount: 3,
          playerMoves: Array(10).fill({ row: 0, col: 0 }),
          initialGrid: [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
        }
      };

      localStorage.setItem('colorMeSame_save', JSON.stringify(gameState));

      const loaded = await saveManager.load();
      expect(loaded).toBeTruthy();
      expect(loaded!.currentGame).toBeDefined();
      expect(loaded!.currentGame!.moves).toBe(10);
      expect(loaded!.currentGame!.time).toBe(180);
      expect(loaded!.currentGame!.hintsEnabled).toBe(true);
    });

    it('should handle saves without currentGame', async () => {
      const gameState: SavedGameState = {
        currentLevel: 10,
        totalPoints: 2000,
        levelPoints: 200,
        completedLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        lastPlayed: new Date().toISOString(),
        version: '1.1.0'
        // No currentGame - player completed the level
      };

      localStorage.setItem('colorMeSame_save', JSON.stringify(gameState));

      const loaded = await saveManager.load();
      expect(loaded).toBeTruthy();
      expect(loaded!.currentGame).toBeUndefined();
    });

    it('should migrate old saves without currentGame', async () => {
      const oldSave = {
        currentLevel: 8,
        totalPoints: 1800,
        levelPoints: 100,
        completedLevels: [1, 2, 3, 4, 5, 6, 7],
        lastPlayed: '2024-01-01',
        version: '1.0.0' // Old version without currentGame support
      };

      localStorage.setItem('colorMeSame_save', JSON.stringify(oldSave));

      const loaded = await saveManager.load();
      expect(loaded).toBeTruthy();
      expect(loaded!.version).toBe('1.1.0');
      expect(loaded!.currentGame).toBeUndefined();
    });
  });
});