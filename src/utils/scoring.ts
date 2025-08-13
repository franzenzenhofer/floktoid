/**
 * @fileoverview Advanced Scoring System for Color Me Same
 * 
 * This module implements the complete scoring system that rewards optimal play,
 * speed, and perfect execution. It replaces the old score.ts with a more
 * sophisticated level-based system.
 * 
 * @module scoring
 */

import { log } from './logger';

/**
 * Score breakdown for a completed level
 */
export interface LevelScore {
  basePoints: number;      // Based on level difficulty
  moveBonus: number;       // Bonus for optimal moves
  timeBonus: number;       // Bonus for quick completion
  perfectBonus: number;    // Bonus for no hints/undo
  totalPoints: number;     // Sum of all
}

/**
 * Scoring configuration
 */
interface ScoringConfig {
  level: number;
  moves: number;
  optimalMoves: number;
  time: number; // in seconds
  hintsUsed: boolean;
  undoUsed: boolean;
  powerTilesUsedOptimally: number;
}

/**
 * Get base points for a level
 * 
 * @param level - The level number
 * @returns Base points for that level
 */
export function getBasePoints(level: number): number {
  // Tutorial levels (1-3) get fixed 50 points
  if (level >= 1 && level <= 3) {
    return 50;
  }
  
  // Regular levels: 100 points for 1-20, 200 for 21-50, etc.
  // Pattern: +100 every 50 levels
  const tier = Math.floor((level - 1) / 50);
  return 100 + (tier * 100);
}

/**
 * Calculate move bonus based on efficiency
 * 
 * @param moves - Actual moves used
 * @param optimalMoves - Optimal moves required
 * @param basePoints - Base points for the level
 * @returns Move bonus points
 */
export function calculateMoveBonus(
  moves: number, 
  optimalMoves: number, 
  basePoints: number
): number {
  if (moves === optimalMoves) {
    // Perfect play: +50% of base points
    return Math.round(basePoints * 0.5);
  } else if (moves < optimalMoves) {
    // Super efficiency! Player found a better solution
    // Give +50% base bonus PLUS extra 20% for each move saved
    const movesSaved = optimalMoves - moves;
    const superBonus = 0.5 + (movesSaved * 0.2);
    return Math.round(basePoints * superBonus);
  }
  
  // Each extra move reduces bonus by 10%
  const extraMoves = moves - optimalMoves;
  const penaltyFactor = Math.max(0, 1 - (extraMoves * 0.1));
  
  return Math.round(basePoints * 0.5 * penaltyFactor);
}

/**
 * Calculate time bonus based on completion speed
 * 
 * @param time - Time taken in seconds
 * @param basePoints - Base points for the level
 * @returns Time bonus points
 */
export function calculateTimeBonus(time: number, basePoints: number): number {
  if (time < 30) {
    // Under 30 seconds: +20% of base points
    return Math.round(basePoints * 0.2);
  } else if (time < 60) {
    // Under 60 seconds: +10% of base points
    return Math.round(basePoints * 0.1);
  }
  
  // No bonus after 60 seconds
  return 0;
}

/**
 * Calculate perfect play bonus
 * 
 * @param hintsUsed - Whether hints were used
 * @param basePoints - Base points for the level
 * @returns Perfect bonus points
 */
export function calculatePerfectBonus(
  hintsUsed: boolean, 
  basePoints: number
): number {
  if (!hintsUsed) {
    // No hints: +100% of base points
    return basePoints;
  }
  
  // Hints used: No perfect bonus
  return 0;
}

/**
 * Calculate power tile bonus
 * 
 * @param powerTilesUsedOptimally - Number of power tiles used optimally
 * @param basePoints - Base points for the level
 * @returns Power tile bonus points
 */
export function calculatePowerTileBonus(
  powerTilesUsedOptimally: number,
  basePoints: number
): number {
  // +10% of base points for each power tile used optimally
  return Math.round(basePoints * 0.1 * powerTilesUsedOptimally);
}

/**
 * Apply penalties for undo usage
 * 
 * @param totalPoints - Total points before penalties
 * @param undoUsed - Whether undo was used
 * @returns Points after penalties
 */
export function applyPenalties(totalPoints: number, undoUsed: boolean): number {
  if (undoUsed) {
    // -25% penalty for using undo
    return Math.round(totalPoints * 0.75);
  }
  
  return totalPoints;
}

/**
 * Calculate the complete score for a level
 * 
 * @param config - Scoring configuration
 * @returns Complete score breakdown
 */
export function calculateLevelScore(config: ScoringConfig): LevelScore {
  const { level, moves, optimalMoves, time, hintsUsed, undoUsed, powerTilesUsedOptimally } = config;
  
  // Special case: Hints used = 0 points total (except for tutorial levels)
  // Tutorial levels (1-3) always have hints enabled, so we allow points
  if (hintsUsed && level > 3) {
    log('debug', 'Hints used - zero points awarded', { level });
    return {
      basePoints: 0,
      moveBonus: 0,
      timeBonus: 0,
      perfectBonus: 0,
      totalPoints: 0
    };
  }
  
  const basePoints = getBasePoints(level);
  const moveBonus = calculateMoveBonus(moves, optimalMoves, basePoints);
  const timeBonus = calculateTimeBonus(time, basePoints);
  const perfectBonus = calculatePerfectBonus(hintsUsed, basePoints);
  const powerTileBonus = calculatePowerTileBonus(powerTilesUsedOptimally, basePoints);
  
  // Sum all bonuses
  let totalPoints = basePoints + moveBonus + timeBonus + perfectBonus + powerTileBonus;
  
  // Apply penalties
  totalPoints = applyPenalties(totalPoints, undoUsed);
  
  log('debug', 'Level score calculated', {
    level,
    basePoints,
    moveBonus,
    timeBonus,
    perfectBonus,
    powerTileBonus,
    undoUsed,
    totalPoints
  });
  
  return {
    basePoints,
    moveBonus,
    timeBonus,
    perfectBonus,
    totalPoints
  };
}

/**
 * Format large numbers with shortcuts (1.2k, 32k, 1.5M)
 * 
 * @param points - Number to format
 * @returns Formatted string
 */
export function formatPoints(points: number): string {
  if (points < 1000) {
    return points.toString();
  } else if (points < 10000) {
    // 1,234 → 1.2k
    return (points / 1000).toFixed(1) + 'k';
  } else if (points < 1000000) {
    // 12,345 → 12k
    return Math.round(points / 1000) + 'k';
  } else if (points < 10000000) {
    // 1,234,567 → 1.2M
    return (points / 1000000).toFixed(1) + 'M';
  } else {
    // 12,345,678 → 12M
    return Math.round(points / 1000000) + 'M';
  }
}