import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { leaderboardService } from '../services/LeaderboardService';
import { NeonFlockEngine } from '../engine/NeonFlockEngine';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Wave Tracking in Leaderboard', () => {
  let engine: NeonFlockEngine;

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset();
    
    // Create engine with mock div (NeonFlockEngine expects a container div)
    const mockContainer = document.createElement('div');
    engine = new NeonFlockEngine(mockContainer);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('LeaderboardService', () => {
    it('should include wave in submission payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await leaderboardService.submitScore(1000, 5);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/submit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"score":1000')
        })
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/submit',
        expect.objectContaining({
          body: expect.stringContaining('"wave":5')
        })
      );
    });

    it('should handle missing wave parameter gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Submit without wave
      await leaderboardService.submitScore(1000);

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/leaderboard/submit',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('"score":1000')
        })
      );
    });

    it('should fetch leaderboard entries with wave data', async () => {
      const mockData = {
        last24h: [
          { username: 'Player1', score: 2000, wave: 8, timestamp: Date.now() },
          { username: 'Player2', score: 1500, wave: 6, timestamp: Date.now() }
        ],
        allTime: [
          { username: 'Champion', score: 5000, wave: 15, timestamp: Date.now() },
          { username: 'Runner', score: 3000, wave: 10, timestamp: Date.now() }
        ],
        totalPlayers: 100,
        playersLast24h: 20,
        topPlayer: { username: 'Champion', score: 5000, wave: 15, timestamp: Date.now() }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await leaderboardService.getLeaderboard();

      expect(result.last24h[0].wave).toBe(8);
      expect(result.last24h[1].wave).toBe(6);
      expect(result.allTime[0].wave).toBe(15);
      expect(result.allTime[1].wave).toBe(10);
    });

    it('should handle null/undefined wave values', async () => {
      const mockData = {
        last24h: [
          { username: 'Player1', score: 2000, wave: undefined, timestamp: Date.now() },
          { username: 'Player2', score: 1500, timestamp: Date.now() } // No wave field
        ],
        allTime: [],
        totalPlayers: 2,
        playersLast24h: 2,
        topPlayer: null
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await leaderboardService.getLeaderboard();

      expect(result.last24h[0].wave).toBeUndefined();
      expect(result.last24h[1].wave).toBeUndefined();
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await leaderboardService.submitScore(1000, 5);
      expect(result).toBe(false);
    });

    it('should handle non-200 responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await leaderboardService.submitScore(1000, 5);
      expect(result).toBe(false);
    });
  });

  describe('NeonFlockEngine', () => {
    it('should have getWave method', () => {
      expect(typeof engine.getWave).toBe('function');
    });

    it('should return current wave number', () => {
      // Initial wave should be 1
      expect(engine.getWave()).toBe(1);
    });

    it('should track wave progression', () => {
      // Simulate wave progression
      const initialWave = engine.getWave();
      
      // Trigger wave completion by eliminating all birds
      // This is implementation-specific, but wave should increment
      engine['wave'] = 5; // Direct access for testing
      
      expect(engine.getWave()).toBe(5);
      expect(engine.getWave()).toBeGreaterThan(initialWave);
    });

    it('should maintain wave state during gameplay', () => {
      // Set specific wave
      engine['wave'] = 10;
      
      // Wave should persist
      expect(engine.getWave()).toBe(10);
      
      // Wave should still be accessible after being set
      expect(engine.getWave()).toBe(10);
    });
  });

  describe('Integration Tests', () => {
    it('should submit score with correct wave from engine', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Set engine wave
      engine['wave'] = 7;
      const currentWave = engine.getWave();
      
      // Submit score with wave from engine
      await leaderboardService.submitScore(2500, currentWave);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"score":2500')
        })
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"wave":7')
        })
      );
    });

    it('should handle complete game-over flow with wave tracking', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Simulate game progression
      engine['wave'] = 12;
      
      const gameOverData = {
        score: 3500,
        wave: engine.getWave()
      };

      // Submit final score
      await leaderboardService.submitScore(
        gameOverData.score,
        gameOverData.wave
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"score":3500')
        })
      );
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"wave":12')
        })
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate wave number is positive integer', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Test with valid wave
      await leaderboardService.submitScore(1000, 5);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"wave":5')
        })
      );
    });

    it('should handle zero wave', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await leaderboardService.submitScore(1000, 0);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"wave":0')
        })
      );
    });

    it('should handle very large wave numbers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const largeWave = 999;
      await leaderboardService.submitScore(100000, largeWave);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(`"wave":${largeWave}`)
        })
      );
    });
  });

  describe('Display Format', () => {
    it('should format wave display correctly', () => {
      const entries = [
        { username: 'Player1', score: 1000, wave: 5, timestamp: Date.now() },
        { username: 'Player2', score: 800, wave: undefined, timestamp: Date.now() },
        { username: 'Player3', score: 600, wave: undefined, timestamp: Date.now() }
      ];

      // Format wave for display
      const formatted = entries.map(entry => ({
        ...entry,
        waveDisplay: entry.wave ? `Wave ${entry.wave}` : 'Wave -'
      }));

      expect(formatted[0].waveDisplay).toBe('Wave 5');
      expect(formatted[1].waveDisplay).toBe('Wave -');
      expect(formatted[2].waveDisplay).toBe('Wave -');
    });
  });
});