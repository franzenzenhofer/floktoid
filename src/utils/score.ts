/**
 * @fileoverview Score Calculation System
 * 
 * This module handles all score-related calculations for Color Me Same.
 * The scoring system rewards efficiency (solving in fewer moves) and speed
 * (solving quickly), with bonuses for harder difficulties.
 * 
 * Score components:
 * 1. Base score: 1000 points for completing any puzzle
 * 2. Efficiency bonus: Up to 1000 points for optimal play
 * 3. Time bonus: Points for finishing quickly
 * 4. Difficulty bonus: Extra points for harder modes
 * 
 * @module score
 */

/**
 * Calculate the final score for a completed puzzle
 * 
 * The scoring formula rewards players who:
 * - Use fewer moves (efficiency)
 * - Complete puzzles quickly (speed)
 * - Play on harder difficulties (challenge)
 * 
 * Score breakdown:
 * - Base: 1000 points (for completing the puzzle)
 * - Efficiency: (optimal/actual) * 100 * 10 (max 1000 if perfect)
 * - Time: (timeLimit - actualTime) * 5 (lose points over time)
 * - Difficulty: 100/200/300 for easy/medium/hard
 * 
 * @param {number} moves - Number of moves player used
 * @param {number} optimal - Optimal number of moves for this puzzle
 * @param {number} time - Time taken in seconds
 * @param {number} timeLimit - Time limit for this difficulty (0 = no limit)
 * @param {number} difficultyBonus - Bonus points for difficulty level
 * @returns {number} Final calculated score
 * 
 * @example
 * // Perfect play on medium difficulty
 * computeScore(5, 5, 30, 300, 200) // High score
 * 
 * // Inefficient play
 * computeScore(10, 5, 30, 300, 200) // Lower score due to extra moves
 */
export const computeScore = (
  moves: number,
  optimal: number,
  time: number,
  timeLimit: number,
  difficultyBonus: number,
): number => {
  // Efficiency: 100% if optimal, scaled down based on extra moves
  const efficiency = optimal ? Math.round((optimal / moves) * 100) : 100;
  
  // Time bonus: Full bonus if no limit, otherwise based on remaining time
  // Max ensures we use at least 5 minutes for calculation even if limit is shorter
  const timeBonus = timeLimit 
    ? Math.max(0, (Math.max(300, timeLimit) - time) * 5) 
    : 1000; // No time limit = max time bonus
  
  // Total: Base + efficiency bonus + time bonus + difficulty bonus
  return 1000 + efficiency * 10 + timeBonus + difficultyBonus;
};

/**
 * Get bonus points based on difficulty level
 * 
 * Higher difficulties award more points to compensate for
 * increased challenge and encourage progression.
 * 
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @returns {number} Bonus points for that difficulty
 */
export const getDifficultyBonus = (difficulty: string): number => {
  switch (difficulty) {
    case 'easy': 
      return 100;   // Small bonus for beginners
    case 'medium': 
      return 200;   // Moderate bonus for intermediate
    case 'hard': 
      return 300;   // Large bonus for experts
    default: 
      return 0;     // No bonus for unknown difficulty
  }
};