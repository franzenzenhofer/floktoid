/**
 * @fileoverview Gradual Constraints System
 * 
 * This module implements a gradual difficulty progression system that introduces
 * game constraints slowly over time, following the "boiling frog" approach.
 * Players barely notice they're being challenged more as each constraint is
 * introduced gently with proper tutorials and preparation.
 * 
 * @module ConstraintManager
 */

import { log } from '../utils/logger';

/**
 * Types of constraints that can be applied to levels
 */
export enum ConstraintType {
  MOVE_LIMIT_SOFT = 'move_limit_soft',        // Generous limit (3x optimal)
  MOVE_LIMIT_MEDIUM = 'move_limit_medium',    // Tighter limit (2.5x optimal)
  MOVE_LIMIT_TIGHT = 'move_limit_tight',      // Challenging (1.5x optimal)
  TIME_AWARENESS = 'time_awareness',          // Show timer, no limit
  TIME_BONUS = 'time_bonus',                  // Bonus points for speed
  TIME_LIMIT_SOFT = 'time_limit_soft',        // 5 minutes
  POWER_TILE_INTRO = 'power_tile_intro',      // 1 beneficial power tile
  LOCKED_TILE_INTRO = 'locked_tile_intro',    // 1 locked tile (2 clicks)
  UNDO_LIMIT = 'undo_limit',                  // Limited undos
  HINT_COST = 'hint_cost',                    // Hints cost points
}

/**
 * Constraint milestone definition
 */
export interface ConstraintMilestone {
  level: number;
  type: ConstraintType;
  value: number | { under60s: number; under120s: number } | null;
  tutorialText?: string;
  introductionMode: 'soft' | 'medium' | 'full';
}

/**
 * Level constraints configuration
 */
export interface LevelConstraints {
  moveLimit?: number;
  timeLimit?: number;
  timeBonus?: { under60s: number; under120s: number };
  showTimer: boolean;
  powerTiles?: number;
  lockedTiles?: number;
  undoLimit?: number;
  hintsHaveCost: boolean;
  tutorialMessage?: string;
}

/**
 * Player performance tracking for adaptive difficulty
 */
export interface PlayerPerformance {
  recentLevels: {
    level: number;
    attempts: number;
    completed: boolean;
    movesUsed: number;
    optimalMoves: number;
    timeUsed: number;
    hintsUsed: boolean;
  }[];
}

/**
 * Manages the gradual introduction of game constraints
 */
export class ConstraintManager {
  private static instance: ConstraintManager;
  private constraintMilestones: ConstraintMilestone[] = [];
  private playerPerformance: PlayerPerformance = { recentLevels: [] };
  
  private constructor() {
    this.initializeConstraintSchedule();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ConstraintManager {
    if (!ConstraintManager.instance) {
      ConstraintManager.instance = new ConstraintManager();
    }
    return ConstraintManager.instance;
  }
  
  /**
   * Initialize the constraint introduction schedule
   */
  private initializeConstraintSchedule() {
    this.constraintMilestones = [
      // Levels 1-30: Pure foundation - NO CONSTRAINTS
      
      // Levels 31-40: Move awareness
      {
        level: 31,
        type: ConstraintType.MOVE_LIMIT_SOFT,
        value: 3.0, // Multiplier for optimal moves
        tutorialText: "Great job! Did you know experts solve this in fewer moves? No pressure though!",
        introductionMode: 'soft'
      },
      {
        level: 35,
        type: ConstraintType.MOVE_LIMIT_MEDIUM,
        value: 2.5,
        tutorialText: "You're getting efficient! Try to beat the target moves for bonus points!",
        introductionMode: 'medium'
      },
      
      // Levels 41-50: Time awareness (no pressure)
      {
        level: 41,
        type: ConstraintType.TIME_AWARENESS,
        value: null,
        tutorialText: "New feature: See how fast you can solve puzzles! No time limit, just for fun!",
        introductionMode: 'soft'
      },
      {
        level: 45,
        type: ConstraintType.TIME_BONUS,
        value: { under60s: 500, under120s: 250 },
        tutorialText: "Quick solving earns bonus points! But take your time if needed.",
        introductionMode: 'medium'
      },
      
      // Level 51+: Power tiles already introduced by level config
      // Level 71+: Locked tiles already introduced by level config
      
      // Level 91: Combine constraints
      {
        level: 91,
        type: ConstraintType.MOVE_LIMIT_TIGHT,
        value: 1.5,
        tutorialText: "Master challenge: Can you match the expert move count?",
        introductionMode: 'full'
      },
      
      // Level 101: Undo limits
      {
        level: 101,
        type: ConstraintType.UNDO_LIMIT,
        value: 5,
        tutorialText: "Pro mode: Limited undos available. Think before you click!",
        introductionMode: 'medium'
      }
    ];
  }
  
  /**
   * Get constraints for a specific level
   */
  getConstraintsForLevel(level: number, optimalMoves: number): LevelConstraints {
    const constraints: LevelConstraints = {
      showTimer: false,
      hintsHaveCost: false
    };
    
    // Apply all constraints up to current level
    for (const milestone of this.constraintMilestones) {
      if (milestone.level > level) break;
      
      switch (milestone.type) {
        case ConstraintType.MOVE_LIMIT_SOFT:
        case ConstraintType.MOVE_LIMIT_MEDIUM:
        case ConstraintType.MOVE_LIMIT_TIGHT:
          constraints.moveLimit = Math.ceil(optimalMoves * (milestone.value as number));
          break;
          
        case ConstraintType.TIME_AWARENESS:
          constraints.showTimer = true;
          break;
          
        case ConstraintType.TIME_BONUS:
          constraints.timeBonus = milestone.value as { under60s: number; under120s: number };
          constraints.showTimer = true;
          break;
          
        case ConstraintType.TIME_LIMIT_SOFT:
          constraints.timeLimit = milestone.value as number;
          constraints.showTimer = true;
          break;
          
        case ConstraintType.UNDO_LIMIT:
          constraints.undoLimit = milestone.value as number;
          break;
          
        case ConstraintType.HINT_COST:
          constraints.hintsHaveCost = true;
          break;
      }
      
      // Add tutorial message for newly introduced constraints
      if (milestone.level === level && milestone.tutorialText) {
        constraints.tutorialMessage = milestone.tutorialText;
      }
    }
    
    // Apply adaptive difficulty adjustments
    return this.applyAdaptiveDifficulty(constraints, level);
  }
  
  /**
   * Track player performance for adaptive difficulty
   */
  updatePerformance(levelData: {
    level: number;
    attempts: number;
    completed: boolean;
    movesUsed: number;
    optimalMoves: number;
    timeUsed: number;
    hintsUsed: boolean;
  }) {
    // Keep last 10 levels
    this.playerPerformance.recentLevels.push(levelData);
    if (this.playerPerformance.recentLevels.length > 10) {
      this.playerPerformance.recentLevels.shift();
    }
    
    log('info', 'Performance updated', { 
      level: levelData.level,
      efficiency: levelData.optimalMoves / levelData.movesUsed
    });
  }
  
  /**
   * Check if player is struggling
   */
  private isStruggling(): boolean {
    const recent = this.playerPerformance.recentLevels.slice(-5);
    if (recent.length < 3) return false;
    
    // Check failure rate
    const failures = recent.filter(l => !l.completed || l.attempts > 3).length;
    if (failures >= 3) return true;
    
    // Check efficiency
    const avgEfficiency = recent.reduce((sum, l) => 
      sum + (l.optimalMoves / l.movesUsed), 0) / recent.length;
    if (avgEfficiency < 0.5) return true;
    
    return false;
  }
  
  /**
   * Check if player is excelling
   */
  private isExcelling(): boolean {
    const recent = this.playerPerformance.recentLevels.slice(-5);
    if (recent.length < 5) return false;
    
    // All completed first try
    if (!recent.every(l => l.completed && l.attempts === 1)) return false;
    
    // High efficiency
    const avgEfficiency = recent.reduce((sum, l) => 
      sum + (l.optimalMoves / l.movesUsed), 0) / recent.length;
    if (avgEfficiency < 0.8) return false;
    
    // No hints used
    if (recent.some(l => l.hintsUsed)) return false;
    
    return true;
  }
  
  /**
   * Apply adaptive difficulty adjustments
   */
  private applyAdaptiveDifficulty(
    constraints: LevelConstraints, 
    level: number
  ): LevelConstraints {
    // Don't adjust tutorial levels
    if (level <= 30) return constraints;
    
    if (this.isStruggling()) {
      log('info', 'Player struggling - easing constraints', { level });
      
      // Ease move limits
      if (constraints.moveLimit) {
        constraints.moveLimit = Math.ceil(constraints.moveLimit * 1.2);
      }
      
      // Ease time limits
      if (constraints.timeLimit) {
        constraints.timeLimit = Math.ceil(constraints.timeLimit * 1.5);
      }
      
      // Add helpful message
      if (!constraints.tutorialMessage) {
        constraints.tutorialMessage = "Take your time! The game adjusts to your pace.";
      }
    } else if (this.isExcelling()) {
      log('info', 'Player excelling - tightening constraints', { level });
      
      // Tighten move limits slightly
      if (constraints.moveLimit) {
        constraints.moveLimit = Math.max(
          constraints.moveLimit - 2,
          Math.ceil(constraints.moveLimit * 0.9)
        );
      }
      
      // Add challenge message
      if (!constraints.tutorialMessage) {
        constraints.tutorialMessage = "You're doing great! Here's a little extra challenge.";
      }
    }
    
    return constraints;
  }
  
  /**
   * Get tutorial text for a constraint type
   */
  getTutorialForConstraint(type: ConstraintType): string | null {
    const milestone = this.constraintMilestones.find(m => m.type === type);
    return milestone?.tutorialText || null;
  }
  
  /**
   * Check if a level introduces a new constraint
   */
  hasNewConstraint(level: number): boolean {
    return this.constraintMilestones.some(m => m.level === level);
  }
  
  /**
   * Get the next constraint milestone
   */
  getNextMilestone(currentLevel: number): ConstraintMilestone | null {
    return this.constraintMilestones.find(m => m.level > currentLevel) || null;
  }
}