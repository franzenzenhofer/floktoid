/**
 * Leaderboard Service - Handles score submission and retrieval
 */

import { UsernameGenerator } from '../utils/UsernameGenerator';

export interface LeaderboardEntry {
  username: string;
  score: number;
  timestamp?: number;
}

export interface LeaderboardData {
  allTime: LeaderboardEntry[];
  last24h: LeaderboardEntry[];
  topPlayer: LeaderboardEntry | null;
  totalPlayers?: number;
  playersLast24h?: number;
}

class LeaderboardService {
  private apiUrl: string;
  
  constructor() {
    // Use relative URL for same-origin requests
    this.apiUrl = '';
  }
  
  /**
   * Submit a score to the leaderboard
   */
  async submitScore(score: number): Promise<boolean> {
    try {
      const username = UsernameGenerator.getSessionUsername();
      
      const response = await fetch(`${this.apiUrl}/api/leaderboard/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, score })
      });
      
      if (!response.ok) {
        console.error('Failed to submit score:', response.status);
        return false;
      }
      
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Error submitting score:', error);
      return false;
    }
  }
  
  /**
   * Get the current leaderboard
   */
  async getLeaderboard(): Promise<LeaderboardData> {
    try {
      const response = await fetch(`${this.apiUrl}/api/leaderboard/top`);
      
      if (!response.ok) {
        console.error('Failed to fetch leaderboard:', response.status);
        return {
          allTime: [],
          last24h: [],
          topPlayer: null
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return {
        allTime: [],
        last24h: [],
        topPlayer: null
      };
    }
  }
  
  /**
   * Get just the top player for display on start screen
   */
  async getTopPlayer(): Promise<LeaderboardEntry | null> {
    const data = await this.getLeaderboard();
    return data.topPlayer;
  }
}

// Export singleton instance
export const leaderboardService = new LeaderboardService();