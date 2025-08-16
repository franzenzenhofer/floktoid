import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { LeaderboardScreen } from '../components/LeaderboardScreen';
import { StandaloneLeaderboard } from '../components/StandaloneLeaderboard';
import { leaderboardService } from '../services/LeaderboardService';

// Mock the leaderboard service
vi.mock('../services/LeaderboardService', () => ({
  leaderboardService: {
    getLeaderboard: vi.fn(),
    submitScore: vi.fn()
  }
}));

describe('Leaderboard UI Wave Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LeaderboardScreen Component', () => {
    it('should display wave number for each entry', async () => {
      const mockData = {
        last24h: [
          { username: 'Player1', score: 2000, wave: 8, timestamp: Date.now() },
          { username: 'Player2', score: 1500, wave: 6, timestamp: Date.now() },
          { username: 'Player3', score: 1000, wave: 4, timestamp: Date.now() }
        ],
        allTime: [
          { username: 'Champion', score: 5000, wave: 15, timestamp: Date.now() }
        ],
        totalPlayers: 100,
        playersLast24h: 20,
        topPlayer: { username: 'Champion', score: 5000, wave: 15, timestamp: Date.now() }
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText('Wave 8')).toBeInTheDocument();
        expect(screen.getByText('Wave 6')).toBeInTheDocument();
        expect(screen.getByText('Wave 4')).toBeInTheDocument();
        expect(screen.getByText('Wave 15')).toBeInTheDocument();
      });
    });

    it('should display dash for missing wave data', async () => {
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

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        const waveDashes = screen.getAllByText('Wave -');
        expect(waveDashes).toHaveLength(2);
      });
    });

    it('should display wave below score in correct position', async () => {
      const mockData = {
        last24h: [
          { username: 'TestUser', score: 3000, wave: 10, timestamp: Date.now() }
        ],
        allTime: [],
        totalPlayers: 1,
        playersLast24h: 1,
        topPlayer: null
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        // Check that wave is displayed in the right structure
        const scoreElement = screen.getByText('3,000');
        const waveElement = screen.getByText('Wave 10');
        
        // Wave should be in a child element of the score's parent
        const scoreParent = scoreElement.parentElement;
        expect(scoreParent).toContainElement(waveElement);
        
        // Wave should have the correct styling class
        expect(waveElement.className).toContain('text-gray-400');
        expect(waveElement.className).toContain('text-xs');
      });
    });

    it('should handle wave 0 correctly', async () => {
      const mockData = {
        last24h: [
          { username: 'NewPlayer', score: 100, wave: 0, timestamp: Date.now() }
        ],
        allTime: [],
        totalPlayers: 1,
        playersLast24h: 1,
        topPlayer: null
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        // Wave 0 should be displayed as "Wave -" or "Wave 0" depending on design
        const waveText = screen.queryByText('Wave 0') || screen.queryByText('Wave -');
        expect(waveText).toBeInTheDocument();
      });
    });

    it('should display large wave numbers correctly', async () => {
      const mockData = {
        last24h: [],
        allTime: [
          { username: 'ProPlayer', score: 50000, wave: 99, timestamp: Date.now() }
        ],
        totalPlayers: 1,
        playersLast24h: 0,
        topPlayer: { username: 'ProPlayer', score: 50000, wave: 99, timestamp: Date.now() }
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        expect(screen.getByText('Wave 99')).toBeInTheDocument();
      });
    });
  });

  describe('StandaloneLeaderboard Component', () => {
    it('should display wave for both 24h and all-time sections', async () => {
      const mockData = {
        last24h: [
          { username: 'Today1', score: 2000, wave: 8, timestamp: Date.now() },
          { username: 'Today2', score: 1500, wave: 6, timestamp: Date.now() }
        ],
        allTime: [
          { username: 'AllTime1', score: 5000, wave: 15, timestamp: Date.now() },
          { username: 'AllTime2', score: 4000, wave: 12, timestamp: Date.now() }
        ],
        totalPlayers: 100,
        playersLast24h: 20,
        topPlayer: { username: 'Champion', score: 5000, wave: 15, timestamp: Date.now() }
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<StandaloneLeaderboard />);

      await waitFor(() => {
        // Check 24h section
        expect(screen.getByText('Wave 8')).toBeInTheDocument();
        expect(screen.getByText('Wave 6')).toBeInTheDocument();
        
        // Check all-time section
        expect(screen.getByText('Wave 15')).toBeInTheDocument();
        expect(screen.getByText('Wave 12')).toBeInTheDocument();
      });
    });

    it('should maintain wave display after refresh', async () => {
      const mockData = {
        last24h: [
          { username: 'Player1', score: 2000, wave: 8, timestamp: Date.now() }
        ],
        allTime: [],
        totalPlayers: 1,
        playersLast24h: 1,
        topPlayer: null
      };

      vi.mocked(leaderboardService.getLeaderboard)
        .mockResolvedValueOnce(mockData)
        .mockResolvedValueOnce({
          ...mockData,
          last24h: [
            { username: 'Player1', score: 2000, wave: 8, timestamp: Date.now() },
            { username: 'Player2', score: 2500, wave: 9, timestamp: Date.now() }
          ]
        });

      render(<StandaloneLeaderboard />);

      // Initial render
      await waitFor(() => {
        expect(screen.getByText('Wave 8')).toBeInTheDocument();
      });

      // Simulate auto-refresh (component refreshes every 30 seconds)
      vi.advanceTimersByTime(30000);
      
      // After refresh, both waves should be displayed
      await waitFor(() => {
        expect(screen.getByText('Wave 8')).toBeInTheDocument();
        expect(screen.getByText('Wave 9')).toBeInTheDocument();
      });
    });

    it('should handle mixed wave data (some with, some without)', async () => {
      const mockData = {
        last24h: [
          { username: 'Player1', score: 3000, wave: 10, timestamp: Date.now() },
          { username: 'Player2', score: 2500, timestamp: Date.now() }, // No wave
          { username: 'Player3', score: 2000, wave: 7, timestamp: Date.now() },
          { username: 'Player4', score: 1500, wave: undefined, timestamp: Date.now() }
        ],
        allTime: [],
        totalPlayers: 4,
        playersLast24h: 4,
        topPlayer: { username: 'Player1', score: 3000, wave: 10, timestamp: Date.now() }
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<StandaloneLeaderboard />);

      await waitFor(() => {
        expect(screen.getByText('Wave 10')).toBeInTheDocument();
        expect(screen.getByText('Wave 7')).toBeInTheDocument();
        
        // Should have 2 entries showing "Wave -"
        const waveDashes = screen.getAllByText('Wave -');
        expect(waveDashes).toHaveLength(2);
      });
    });

    it('should format wave with proper styling', async () => {
      const mockData = {
        last24h: [
          { username: 'StyledPlayer', score: 5000, wave: 20, timestamp: Date.now() }
        ],
        allTime: [],
        totalPlayers: 1,
        playersLast24h: 1,
        topPlayer: null
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<StandaloneLeaderboard />);

      await waitFor(() => {
        const waveElement = screen.getByText('Wave 20');
        
        // Check for proper styling classes
        expect(waveElement.className).toContain('text-xs');
        expect(waveElement.className).toContain('text-gray-400');
        
        // Verify it's in the correct container structure
        const parent = waveElement.parentElement;
        expect(parent?.className).toContain('text-right');
      });
    });
  });

  describe('Integration with LeaderboardService', () => {
    it('should correctly pass wave from service to UI', async () => {
      const testWave = 25;
      const mockData = {
        last24h: [
          { username: 'IntegrationTest', score: 10000, wave: testWave, timestamp: Date.now() }
        ],
        allTime: [
          { username: 'IntegrationTest', score: 10000, wave: testWave, timestamp: Date.now() }
        ],
        totalPlayers: 1,
        playersLast24h: 1,
        topPlayer: null
      };

      vi.mocked(leaderboardService.getLeaderboard).mockResolvedValue(mockData);

      render(<LeaderboardScreen onBack={() => {}} />);

      await waitFor(() => {
        // Should appear in both sections with same wave
        const waveElements = screen.getAllByText(`Wave ${testWave}`);
        expect(waveElements).toHaveLength(2); // One in 24h, one in all-time
      });
    });
  });
});