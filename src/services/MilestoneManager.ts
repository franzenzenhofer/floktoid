/**
 * @fileoverview Progression Milestones System
 * 
 * This module implements a comprehensive progression system that rewards players
 * for reaching specific levels and achieving certain goals. It provides visual
 * feedback, rewards, and motivation to keep players engaged throughout their journey.
 * 
 * Features:
 * - Level-based milestones (every 10 levels)
 * - Achievement milestones
 * - Reward system (belts, badges, titles)
 * - Progress tracking
 * - Visual celebrations
 * 
 * @module MilestoneManager
 */

import { log } from '../utils/logger';

/**
 * Types of milestones
 */
export enum MilestoneType {
  LEVEL = 'level',
  STREAK = 'streak',
  PERFECT_GAMES = 'perfect_games',
  TOTAL_POINTS = 'total_points',
  SPEED_RUN = 'speed_run',
  NO_HINTS = 'no_hints',
  EFFICIENCY = 'efficiency'
}

/**
 * Belt progression system
 */
export enum Belt {
  WHITE = 'white',
  YELLOW = 'yellow',
  ORANGE = 'orange',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  BROWN = 'brown',
  BLACK = 'black',
  RED = 'red'      // Master level
}

/**
 * Milestone definition
 */
export interface Milestone {
  id: string;
  type: MilestoneType;
  level: number;
  name: string;
  description: string;
  requirement: number;
  reward?: {
    belt?: Belt;
    badge?: string;
    title?: string;
    points?: number;
  };
  celebrationType: 'minor' | 'major' | 'epic';
  unlocked?: boolean;
  unlockedAt?: number;
}

/**
 * Player statistics for milestone checking
 */
export interface PlayerStats {
  currentLevel: number;
  completedLevels: number[];
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  perfectGames: number;  // No hints, optimal moves
  fastestTime: number;   // Fastest level completion
  totalGamesPlayed: number;
  hintsUsed: number;
  averageEfficiency: number;
}

/**
 * Manages player progression milestones
 */
export class MilestoneManager {
  private static instance: MilestoneManager;
  private milestones: Map<string, Milestone>;
  private unlockedMilestones: Set<string>;
  
  private constructor() {
    this.milestones = new Map();
    this.unlockedMilestones = new Set();
    this.initializeMilestones();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): MilestoneManager {
    if (!MilestoneManager.instance) {
      MilestoneManager.instance = new MilestoneManager();
    }
    return MilestoneManager.instance;
  }
  
  /**
   * Initialize all milestones
   */
  private initializeMilestones() {
    // Level milestones (every 10 levels)
    const levelMilestones: Milestone[] = [
      {
        id: 'level_10',
        type: MilestoneType.LEVEL,
        level: 10,
        name: 'Getting Started',
        description: 'Complete 10 levels',
        requirement: 10,
        reward: { belt: Belt.YELLOW, points: 1000 },
        celebrationType: 'major'
      },
      {
        id: 'level_25',
        type: MilestoneType.LEVEL,
        level: 25,
        name: 'Color Apprentice',
        description: 'Complete 25 levels',
        requirement: 25,
        reward: { belt: Belt.ORANGE, points: 2500, title: 'Apprentice' },
        celebrationType: 'major'
      },
      {
        id: 'level_50',
        type: MilestoneType.LEVEL,
        level: 50,
        name: 'Puzzle Solver',
        description: 'Complete 50 levels',
        requirement: 50,
        reward: { belt: Belt.GREEN, points: 5000, title: 'Solver' },
        celebrationType: 'epic'
      },
      {
        id: 'level_75',
        type: MilestoneType.LEVEL,
        level: 75,
        name: 'Color Expert',
        description: 'Complete 75 levels',
        requirement: 75,
        reward: { belt: Belt.BLUE, points: 7500, title: 'Expert' },
        celebrationType: 'major'
      },
      {
        id: 'level_100',
        type: MilestoneType.LEVEL,
        level: 100,
        name: 'Century Club',
        description: 'Complete 100 levels!',
        requirement: 100,
        reward: { belt: Belt.PURPLE, points: 10000, title: 'Centurion', badge: '💯' },
        celebrationType: 'epic'
      },
      {
        id: 'level_150',
        type: MilestoneType.LEVEL,
        level: 150,
        name: 'Color Master',
        description: 'Complete 150 levels',
        requirement: 150,
        reward: { belt: Belt.BROWN, points: 15000, title: 'Master' },
        celebrationType: 'epic'
      },
      {
        id: 'level_200',
        type: MilestoneType.LEVEL,
        level: 200,
        name: 'Grandmaster',
        description: 'Complete 200 levels',
        requirement: 200,
        reward: { belt: Belt.BLACK, points: 25000, title: 'Grandmaster', badge: '🏆' },
        celebrationType: 'epic'
      }
    ];
    
    // Streak milestones
    const streakMilestones: Milestone[] = [
      {
        id: 'streak_5',
        type: MilestoneType.STREAK,
        level: 0,
        name: 'Hot Streak',
        description: 'Complete 5 levels in a row',
        requirement: 5,
        reward: { points: 500, badge: '🔥' },
        celebrationType: 'minor'
      },
      {
        id: 'streak_10',
        type: MilestoneType.STREAK,
        level: 0,
        name: 'On Fire!',
        description: 'Complete 10 levels in a row',
        requirement: 10,
        reward: { points: 1500, badge: '🔥🔥' },
        celebrationType: 'major'
      },
      {
        id: 'streak_25',
        type: MilestoneType.STREAK,
        level: 0,
        name: 'Unstoppable!',
        description: 'Complete 25 levels in a row',
        requirement: 25,
        reward: { points: 5000, badge: '🔥🔥🔥', title: 'Unstoppable' },
        celebrationType: 'epic'
      }
    ];
    
    // Perfect game milestones
    const perfectMilestones: Milestone[] = [
      {
        id: 'perfect_1',
        type: MilestoneType.PERFECT_GAMES,
        level: 0,
        name: 'Perfectionist',
        description: 'Complete a level with optimal moves',
        requirement: 1,
        reward: { points: 200 },
        celebrationType: 'minor'
      },
      {
        id: 'perfect_10',
        type: MilestoneType.PERFECT_GAMES,
        level: 0,
        name: 'Precision Player',
        description: 'Complete 10 levels with optimal moves',
        requirement: 10,
        reward: { points: 2000, badge: '✨' },
        celebrationType: 'major'
      },
      {
        id: 'perfect_50',
        type: MilestoneType.PERFECT_GAMES,
        level: 0,
        name: 'Efficiency Master',
        description: 'Complete 50 levels with optimal moves',
        requirement: 50,
        reward: { points: 10000, badge: '💎', title: 'Efficient' },
        celebrationType: 'epic'
      }
    ];
    
    // Points milestones
    const pointsMilestones: Milestone[] = [
      {
        id: 'points_10k',
        type: MilestoneType.TOTAL_POINTS,
        level: 0,
        name: 'Point Collector',
        description: 'Earn 10,000 total points',
        requirement: 10000,
        reward: { badge: '💰' },
        celebrationType: 'minor'
      },
      {
        id: 'points_50k',
        type: MilestoneType.TOTAL_POINTS,
        level: 0,
        name: 'High Scorer',
        description: 'Earn 50,000 total points',
        requirement: 50000,
        reward: { badge: '💰💰', title: 'High Scorer' },
        celebrationType: 'major'
      },
      {
        id: 'points_100k',
        type: MilestoneType.TOTAL_POINTS,
        level: 0,
        name: 'Point Legend',
        description: 'Earn 100,000 total points',
        requirement: 100000,
        reward: { badge: '👑', title: 'Legend' },
        celebrationType: 'epic'
      }
    ];
    
    // Speed milestones
    const speedMilestones: Milestone[] = [
      {
        id: 'speed_30s',
        type: MilestoneType.SPEED_RUN,
        level: 0,
        name: 'Speed Demon',
        description: 'Complete any level in under 30 seconds',
        requirement: 30,
        reward: { points: 500, badge: '⚡' },
        celebrationType: 'minor'
      },
      {
        id: 'speed_15s',
        type: MilestoneType.SPEED_RUN,
        level: 0,
        name: 'Lightning Fast',
        description: 'Complete any level in under 15 seconds',
        requirement: 15,
        reward: { points: 2000, badge: '⚡⚡', title: 'Speedster' },
        celebrationType: 'major'
      }
    ];
    
    // Add all milestones to the map
    [...levelMilestones, ...streakMilestones, ...perfectMilestones, 
     ...pointsMilestones, ...speedMilestones].forEach(milestone => {
      this.milestones.set(milestone.id, milestone);
    });
    
    log('info', 'Milestones initialized', { count: this.milestones.size });
  }
  
  /**
   * Check for newly unlocked milestones
   */
  checkMilestones(stats: PlayerStats): Milestone[] {
    const newlyUnlocked: Milestone[] = [];
    
    for (const [id, milestone] of this.milestones) {
      if (this.unlockedMilestones.has(id)) continue;
      
      let achieved = false;
      
      switch (milestone.type) {
        case MilestoneType.LEVEL:
          achieved = stats.currentLevel >= milestone.requirement;
          break;
          
        case MilestoneType.STREAK:
          achieved = stats.currentStreak >= milestone.requirement || 
                    stats.bestStreak >= milestone.requirement;
          break;
          
        case MilestoneType.PERFECT_GAMES:
          achieved = stats.perfectGames >= milestone.requirement;
          break;
          
        case MilestoneType.TOTAL_POINTS:
          achieved = stats.totalPoints >= milestone.requirement;
          break;
          
        case MilestoneType.SPEED_RUN:
          achieved = stats.fastestTime > 0 && stats.fastestTime <= milestone.requirement;
          break;
          
        case MilestoneType.NO_HINTS:
          achieved = stats.totalGamesPlayed >= milestone.requirement && 
                    stats.hintsUsed === 0;
          break;
          
        case MilestoneType.EFFICIENCY:
          achieved = stats.averageEfficiency >= milestone.requirement;
          break;
      }
      
      if (achieved) {
        milestone.unlocked = true;
        milestone.unlockedAt = Date.now();
        this.unlockedMilestones.add(id);
        newlyUnlocked.push(milestone);
        
        log('info', 'Milestone unlocked!', {
          id: milestone.id,
          name: milestone.name,
          type: milestone.type
        });
      }
    }
    
    return newlyUnlocked;
  }
  
  /**
   * Get next milestone to work towards
   */
  getNextMilestone(stats: PlayerStats): Milestone | null {
    let closest: Milestone | null = null;
    let closestProgress = 0;
    
    for (const [id, milestone] of this.milestones) {
      if (this.unlockedMilestones.has(id)) continue;
      
      let progress = 0;
      
      switch (milestone.type) {
        case MilestoneType.LEVEL:
          progress = stats.currentLevel / milestone.requirement;
          break;
          
        case MilestoneType.STREAK:
          progress = Math.max(stats.currentStreak, stats.bestStreak) / milestone.requirement;
          break;
          
        case MilestoneType.PERFECT_GAMES:
          progress = stats.perfectGames / milestone.requirement;
          break;
          
        case MilestoneType.TOTAL_POINTS:
          progress = stats.totalPoints / milestone.requirement;
          break;
          
        case MilestoneType.SPEED_RUN:
          // Inverse progress for time-based
          if (stats.fastestTime > 0) {
            progress = milestone.requirement / stats.fastestTime;
          }
          break;
      }
      
      if (progress > closestProgress && progress < 1) {
        closest = milestone;
        closestProgress = progress;
      }
    }
    
    return closest;
  }
  
  /**
   * Get progress towards a specific milestone
   */
  getMilestoneProgress(milestoneId: string, stats: PlayerStats): number {
    const milestone = this.milestones.get(milestoneId);
    if (!milestone) return 0;
    
    switch (milestone.type) {
      case MilestoneType.LEVEL:
        return Math.min(1, stats.currentLevel / milestone.requirement);
        
      case MilestoneType.STREAK:
        return Math.min(1, Math.max(stats.currentStreak, stats.bestStreak) / milestone.requirement);
        
      case MilestoneType.PERFECT_GAMES:
        return Math.min(1, stats.perfectGames / milestone.requirement);
        
      case MilestoneType.TOTAL_POINTS:
        return Math.min(1, stats.totalPoints / milestone.requirement);
        
      case MilestoneType.SPEED_RUN:
        if (stats.fastestTime > 0 && stats.fastestTime <= milestone.requirement) {
          return 1;
        }
        return 0;
        
      default:
        return 0;
    }
  }
  
  /**
   * Get all unlocked milestones
   */
  getUnlockedMilestones(): Milestone[] {
    return Array.from(this.milestones.values())
      .filter(m => this.unlockedMilestones.has(m.id))
      .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
  }
  
  /**
   * Get current belt based on unlocked milestones
   */
  getCurrentBelt(_stats: PlayerStats): Belt {
    let highestBelt = Belt.WHITE;
    const beltOrder = [Belt.WHITE, Belt.YELLOW, Belt.ORANGE, Belt.GREEN, 
                      Belt.BLUE, Belt.PURPLE, Belt.BROWN, Belt.BLACK, Belt.RED];
    
    for (const milestone of this.getUnlockedMilestones()) {
      if (milestone.reward?.belt) {
        const beltIndex = beltOrder.indexOf(milestone.reward.belt);
        const currentIndex = beltOrder.indexOf(highestBelt);
        if (beltIndex > currentIndex) {
          highestBelt = milestone.reward.belt;
        }
      }
    }
    
    return highestBelt;
  }
  
  /**
   * Get milestone celebration data
   */
  getCelebrationData(milestone: Milestone): {
    title: string;
    subtitle: string;
    icon: string;
    duration: number;
    effects: string[];
  } {
    const celebrations = {
      minor: {
        duration: 3000,
        effects: ['confetti-small'],
        icon: '✨'
      },
      major: {
        duration: 5000,
        effects: ['confetti-medium', 'sound-achievement'],
        icon: '🎉'
      },
      epic: {
        duration: 7000,
        effects: ['confetti-large', 'sound-epic', 'screen-flash'],
        icon: '🏆'
      }
    };
    
    const celebration = celebrations[milestone.celebrationType];
    
    return {
      title: milestone.name,
      subtitle: milestone.description,
      icon: milestone.reward?.badge || celebration.icon,
      duration: celebration.duration,
      effects: celebration.effects
    };
  }
  
  /**
   * Save milestone state
   */
  serialize(): { unlockedMilestones: string[] } {
    return {
      unlockedMilestones: Array.from(this.unlockedMilestones)
    };
  }
  
  /**
   * Load milestone state
   */
  deserialize(data: { unlockedMilestones: string[] }) {
    this.unlockedMilestones = new Set(data.unlockedMilestones);
    
    // Update milestone objects
    for (const id of this.unlockedMilestones) {
      const milestone = this.milestones.get(id);
      if (milestone) {
        milestone.unlocked = true;
      }
    }
  }
}