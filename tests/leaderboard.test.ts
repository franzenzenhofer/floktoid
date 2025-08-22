import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaderboardService } from '../src/services/LeaderboardService';
import { UsernameGenerator } from '../src/utils/UsernameGenerator';

// Mock fetch globally
global.fetch = vi.fn();

describe('LeaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  describe('submitScore', () => {
    it('should submit score successfully', async () => {
      const mockUsername = 'TestPlayer123';
      vi.spyOn(UsernameGenerator, 'getSessionUsername').mockReturnValue(mockUsername);
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      } as Response);

      const result = await leaderboardService.submitScore(1000, 5, 'game123');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith('/api/leaderboard/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: mockUsername,
          score: 1000,
          wave: 5,
          gameId: 'game123'
        })
      });
    });

    it('should handle submit failure', async () => {
      vi.spyOn(UsernameGenerator, 'getSessionUsername').mockReturnValue('TestPlayer');
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const result = await leaderboardService.submitScore(1000, 5);

      expect(result).toBe(false);
    });

    it('should handle network error', async () => {
      vi.spyOn(UsernameGenerator, 'getSessionUsername').mockReturnValue('TestPlayer');
      
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const result = await leaderboardService.submitScore(1000, 5);

      expect(result).toBe(false);
    });
  });

  describe('getLeaderboard', () => {
    it('should fetch leaderboard successfully', async () => {
      const mockData = {
        allTime: [
          { username: 'Player1', score: 5000, wave: 20 },
          { username: 'Player2', score: 4000, wave: 18 }
        ],
        last24h: [
          { username: 'Player3', score: 3000, wave: 15 }
        ],
        topPlayer: { username: 'Player3', score: 3000, wave: 15 },
        totalPlayers: 10,
        playersLast24h: 3
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as Response);

      const result = await leaderboardService.getLeaderboard();

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith('/api/leaderboard/top');
    });

    it('should return empty data on fetch failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500
      } as Response);

      const result = await leaderboardService.getLeaderboard();

      expect(result).toEqual({
        allTime: [],
        last24h: [],
        topPlayer: null
      });
    });

    it('should handle network error gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

      const result = await leaderboardService.getLeaderboard();

      expect(result).toEqual({
        allTime: [],
        last24h: [],
        topPlayer: null
      });
    });
  });

  describe('getTopPlayer', () => {
    it('should return top player from leaderboard', async () => {
      const mockTopPlayer = { username: 'TopPlayer', score: 9999, wave: 30 };
      
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allTime: [],
          last24h: [],
          topPlayer: mockTopPlayer
        })
      } as Response);

      const result = await leaderboardService.getTopPlayer();

      expect(result).toEqual(mockTopPlayer);
    });

    it('should return null when no top player', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          allTime: [],
          last24h: [],
          topPlayer: null
        })
      } as Response);

      const result = await leaderboardService.getTopPlayer();

      expect(result).toBeNull();
    });
  });
});