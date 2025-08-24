/**
 * GameSession - Manages unique game IDs and continuous score tracking
 * Each game gets a unique ID and saves its highest score/wave to leaderboard
 */

export class GameSession {
  private gameId: string;
  private highestScore: number = 0;
  private highestWave: number = 1;
  private lastSubmittedScore: number = 0;
  private isGameActive: boolean = true;
  
  constructor(existingGameId?: string, existingScore?: number, existingWave?: number) {
    if (existingGameId) {
      // Restore from saved game
      this.gameId = existingGameId;
      this.highestScore = existingScore || 0;
      this.highestWave = existingWave || 1;
      // Don't reset to 0! Set to current score to prevent immediate resubmission
      this.lastSubmittedScore = this.highestScore;
      console.log(`[GAME SESSION] Resumed game ${this.gameId} at score ${this.highestScore}, wave ${this.highestWave}`);
    } else {
      // Generate unique game ID using timestamp + random
      this.gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // For new games, set lastSubmittedScore to 1000 (starting score) to prevent immediate submission
      this.lastSubmittedScore = 1000;
      console.log(`[GAME SESSION] New game started with ID: ${this.gameId}`);
    }
  }
  
  /**
   * Get the unique game ID
   */
  getGameId(): string {
    return this.gameId;
  }
  
  /**
   * Update the current score/wave and return if it's a new high for this game
   */
  updateProgress(score: number, wave: number): boolean {
    let isNewHigh = false;
    
    if (score > this.highestScore) {
      this.highestScore = score;
      isNewHigh = true;
    }
    
    if (wave > this.highestWave) {
      this.highestWave = wave;
      isNewHigh = true;
    }
    
    return isNewHigh;
  }
  
  /**
   * Get current highest score for this game
   */
  getHighestScore(): number {
    return this.highestScore;
  }
  
  /**
   * Get current highest wave for this game
   */
  getHighestWave(): number {
    return this.highestWave;
  }
  
  /**
   * Check if we should submit to leaderboard
   * Only submit if score improved significantly (every 1000 points)
   */
  shouldSubmitToLeaderboard(): boolean {
    // Don't submit the starting score (1000) or if no real progress
    if (this.highestScore <= 1000) {
      return false;
    }
    
    // Submit if score increased by at least 1000 since last submission
    // This prevents spamming the leaderboard with tiny updates
    const threshold = 1000;
    return this.highestScore >= this.lastSubmittedScore + threshold;
  }
  
  /**
   * Mark that we submitted to leaderboard
   */
  markSubmitted(): void {
    this.lastSubmittedScore = this.highestScore;
    console.log(`[GAME SESSION] Submitted score ${this.highestScore} for game ${this.gameId}`);
  }
  
  /**
   * End the game session
   */
  endGame(): void {
    this.isGameActive = false;
    console.log(`[GAME SESSION] Game ${this.gameId} ended. Final: Score ${this.highestScore}, Wave ${this.highestWave}`);
  }
  
  /**
   * Check if game is still active
   */
  isActive(): boolean {
    return this.isGameActive;
  }
}