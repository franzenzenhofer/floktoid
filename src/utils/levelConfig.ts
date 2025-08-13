/**
 * @fileoverview Level Configuration System
 * 
 * This module manages the configuration for each level in the game's
 * progression system. It provides a deterministic way to calculate
 * game parameters based on the level number.
 * 
 * The progression is designed to:
 * - Start very simple (3x3, 1 move) for tutorial
 * - Gradually increase grid size at key milestones
 * - Introduce new mechanics (colors, power tiles, locked tiles) progressively
 * - Maintain a smooth difficulty curve
 * 
 * @module levelConfig
 */

export interface LevelConfig {
  level: number;
  gridSize: number;
  colors: number;
  requiredMoves: number;
  powerTiles: number;
  lockedTiles: number;
  hintsEnabled: boolean;
  timeLimit: number; // seconds, 0 = no limit
}

/**
 * Get configuration for a specific level
 * 
 * The progression system is designed around key milestones:
 * - Levels 1-20: Tutorial and basics (3x3 grid)
 * - Levels 21-50: Introduction to complexity (4x4 grid)
 * - Levels 51-100: Advanced mechanics (5x5 grid)
 * - Levels 101+: Expert challenges (larger grids)
 * 
 * @param level - The level number (1-based)
 * @returns Complete configuration for the level
 */
export function getLevelConfig(level: number): LevelConfig {
  // Ensure level is at least 1
  level = Math.max(1, Math.floor(level));
  
  // Grid size progression
  let gridSize: number;
  if (level <= 27) {
    gridSize = 3; // 3x3 grid for first 27 levels
  } else if (level <= 64) {
    gridSize = 4; // 4x4 grid 
  } else if (level <= 100) {
    gridSize = 5; // 5x5 grid
  } else if (level <= 150) {
    gridSize = 6; // Expert play
  } else if (level <= 200) {
    gridSize = 7; // Master challenges
  } else {
    // Continue growing but cap at reasonable size
    gridSize = Math.min(10, 7 + Math.floor((level - 200) / 50));
  }
  
  // Color progression - starts with 2 colors for easier learning
  let colors: number;
  if (level <= 9) {
    colors = 2; // Binary mode - easiest to understand
  } else if (level <= 18) {
    colors = 3; // Introduce cycling with 3 colors
  } else if (level <= 27) {
    colors = 4; // 4 colors on 3x3 (still manageable)
  } else if (level <= 32) {
    colors = 2; // Back to 2 colors for new 4x4 grid
  } else if (level <= 48) {
    colors = 3; // 3 colors on 4x4
  } else if (level <= 64) {
    colors = 4; // 4 colors on 4x4 (if we extend)
  } else if (level <= 75) {
    colors = 3; // 3 colors on 5x5
  } else if (level <= 100) {
    colors = 4; // 4 colors on 5x5
  } else {
    // Cycle through 3-5 colors for variety
    const cycle = (level - 101) % 30;
    if (cycle < 10) colors = 3;
    else if (cycle < 20) colors = 4;
    else colors = 5;
  }
  
  // Required moves calculation - always stay within mathematical limits
  let requiredMoves: number;
  
  // Calculate max possible moves for this configuration
  const maxPossibleMoves = gridSize * gridSize * (colors - 1);
  
  if (level <= maxPossibleMoves) {
    // If level number is within limits, use it directly
    requiredMoves = level;
  } else {
    // Otherwise, scale within the possible range
    // Use a formula that grows but stays under the limit
    const progress = (level - 1) / 100; // 0 to 1 for levels 1-100
    requiredMoves = Math.min(
      Math.floor(maxPossibleMoves * 0.5 + progress * maxPossibleMoves * 0.5),
      maxPossibleMoves
    );
  }
  
  // Power tiles progression - DISABLED per user request
  const powerTiles = 0; // No power tiles at any level
  
  // Locked tiles progression - DISABLED per user request
  const lockedTiles = 0; // No locked tiles at any level
  
  // Hints enabled for tutorial levels
  const hintsEnabled = level <= 3;
  
  // Time limits (future feature)
  const timeLimit = 0; // No time limits for now
  
  return {
    level,
    gridSize,
    colors,
    requiredMoves,
    powerTiles,
    lockedTiles,
    hintsEnabled,
    timeLimit
  };
}

/**
 * Get a human-readable description of what's new at this level
 * 
 * @param level - The level number
 * @returns Description of new features/changes at this level
 */
export function getLevelMilestoneDescription(level: number): string | null {
  switch (level) {
    case 10:
      return "3 colors unlocked!";
    case 19:
      return "4 colors unlocked!";
    case 28:
      return "4×4 grid";
    case 33:
      return "3 colors on 4×4";
    case 49:
      return "4 colors on 4×4";
    case 65:
      return "5×5 grid";
    case 76:
      return "4 colors on 5×5";
    case 71:
      return "Harder puzzles";
    case 101:
      return "6×6";
    case 151:
      return "7×7";
    case 201:
      return "8×8";
    default:
      // Check for every 50 levels
      if (level > 200 && level % 50 === 1) {
        const newSize = Math.min(10, 7 + Math.floor((level - 200) / 50));
        if (newSize > 7 + Math.floor((level - 250) / 50)) {
          return `Grid expanded to ${newSize}×${newSize}!`;
        }
      }
      return null;
  }
}

/**
 * Calculate XP reward for completing a level
 * 
 * @param config - Level configuration
 * @param movesUsed - Actual moves used by player
 * @param hintsUsed - Whether hints were used
 * @returns XP points earned
 */
export function calculateLevelXP(
  config: LevelConfig,
  movesUsed: number,
  hintsUsed: boolean
): number {
  // Base XP scales with level
  const baseXP = 100 + config.level * 10;
  
  // Efficiency bonus
  const efficiency = config.requiredMoves / movesUsed;
  const efficiencyBonus = efficiency >= 1 ? Math.floor(baseXP * 0.5) : 
                          efficiency >= 0.8 ? Math.floor(baseXP * 0.25) : 0;
  
  // Complexity bonus for harder configurations - DISABLED since no special tiles
  const complexityBonus = 0;
  
  // Penalty for using hints
  const hintPenalty = hintsUsed ? 0.5 : 1;
  
  return Math.floor((baseXP + efficiencyBonus + complexityBonus) * hintPenalty);
}