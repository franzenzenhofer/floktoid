/**
 * COMPREHENSIVE SCORING SYSTEM
 * Complete point system with combos, costs, and rewards
 * NO NEGATIVE SCORES ALLOWED!
 */

import CentralConfig from './CentralConfig';

const { SIZES } = CentralConfig;

// ============================================
// SCORING EVENTS
// ============================================

export enum ScoringEvent {
  // COSTS (Negative)
  ASTEROID_LAUNCH = 'ASTEROID_LAUNCH',
  ENERGY_DOT_LOST = 'ENERGY_DOT_LOST',
  
  // REWARDS (Positive)
  BIRD_HIT = 'BIRD_HIT',
  BIRD_WITH_ENERGY_HIT = 'BIRD_WITH_ENERGY_HIT',
  BOSS_HIT = 'BOSS_HIT',
  BOSS_DEFEATED = 'BOSS_DEFEATED',
  ENERGY_DOT_RECLAIMED = 'ENERGY_DOT_RECLAIMED',
  ENERGY_DOT_CAUGHT_FALLING = 'ENERGY_DOT_CAUGHT_FALLING',
  ASTEROID_SPLIT = 'ASTEROID_SPLIT',
  WAVE_COMPLETE = 'WAVE_COMPLETE',
  PERFECT_WAVE = 'PERFECT_WAVE',
  
  // COMBO EVENTS
  COMBO_2X = 'COMBO_2X',
  COMBO_3X = 'COMBO_3X',
  COMBO_5X = 'COMBO_5X',
  COMBO_10X = 'COMBO_10X',
  COMBO_EPIC = 'COMBO_EPIC',
  
  // SPECIAL EVENTS
  MULTI_KILL = 'MULTI_KILL',
  RICOCHET_KILL = 'RICOCHET_KILL',
  LONG_SHOT = 'LONG_SHOT',
  CLOSE_CALL = 'CLOSE_CALL',
  LAST_SECOND_SAVE = 'LAST_SECOND_SAVE',
  FLAWLESS_DEFENSE = 'FLAWLESS_DEFENSE',
  SPEED_BONUS = 'SPEED_BONUS',
  ACCURACY_BONUS = 'ACCURACY_BONUS',
}

// ============================================
// POINT VALUES
// ============================================

export const POINT_VALUES = {
  // COSTS (what player pays)
  COSTS: {
    ASTEROID_LAUNCH_MIN: 10,      // Smallest asteroid costs 10
    ASTEROID_LAUNCH_MAX: 200,     // Biggest asteroid costs 200
    ENERGY_DOT_LOST: 50,          // Penalty when dot reaches top
  },
  
  // BASIC REWARDS
  REWARDS: {
    BIRD_HIT: 25,                 // Basic bird hit
    BIRD_WITH_ENERGY_HIT: 100,    // Bird carrying energy dot
    BOSS_HIT: 50,                 // Hitting boss bird
    BOSS_DEFEATED: 1000,          // Defeating boss
    ENERGY_DOT_RECLAIMED: 150,    // Getting stolen dot back
    ENERGY_DOT_CAUGHT_FALLING: 75, // Catching falling dot
    ASTEROID_SPLIT: 10,           // When asteroid splits
    WAVE_COMPLETE: 250,           // Completing a wave
    PERFECT_WAVE: 500,            // No dots lost in wave
  },
  
  // COMBO MULTIPLIERS
  COMBOS: {
    COMBO_2X: 2.0,
    COMBO_3X: 3.0,
    COMBO_5X: 5.0,
    COMBO_10X: 10.0,
    COMBO_EPIC: 20.0,
  },
  
  // SPECIAL BONUSES
  SPECIAL: {
    MULTI_KILL: 50,               // Per extra bird in multi-kill
    RICOCHET_KILL: 100,           // Bouncing asteroid kill
    LONG_SHOT: 75,                // Long distance hit
    CLOSE_CALL: 200,              // Last moment save
    LAST_SECOND_SAVE: 300,        // Saving dot at last second
    FLAWLESS_DEFENSE: 1000,       // Perfect defense for whole wave
    SPEED_BONUS: 50,              // Quick wave completion
    ACCURACY_BONUS: 100,          // High accuracy in wave
  },
} as const;

// ============================================
// COMBO SYSTEM
// ============================================

export interface ComboState {
  count: number;
  multiplier: number;
  timer: number;
  lastEventTime: number;
  events: ScoringEvent[];
}

// ============================================
// SCORING SYSTEM CLASS
// ============================================

export class ScoringSystem {
  private score: number = 0;
  private combo: ComboState = {
    count: 0,
    multiplier: 1,
    timer: 0,
    lastEventTime: 0,
    events: []
  };
  
  private statistics = {
    totalBirdsHit: 0,
    totalAsteroidsLaunched: 0,
    totalDotsReclaimed: 0,
    highestCombo: 0,
    perfectWaves: 0,
    bossesDefeated: 0,
    accuracy: 0,
  };
  
  private readonly COMBO_WINDOW_MS = 2000; // 2 seconds to maintain combo
  private readonly MIN_SCORE = 0; // Never go below 0!
  
  constructor() {
    this.reset();
  }
  
  /**
   * Reset scoring system
   */
  reset(): void {
    this.score = 0;
    this.combo = {
      count: 0,
      multiplier: 1,
      timer: 0,
      lastEventTime: 0,
      events: []
    };
    this.resetStatistics();
  }
  
  /**
   * Calculate asteroid launch cost based on size
   */
  calculateAsteroidCost(asteroidSize: number): number {
    const minSize = SIZES.ASTEROID.MIN;
    const maxSize = SIZES.ASTEROID.MAX_CHARGE_SIZE;
    const minCost = POINT_VALUES.COSTS.ASTEROID_LAUNCH_MIN;
    const maxCost = POINT_VALUES.COSTS.ASTEROID_LAUNCH_MAX;
    
    // Linear interpolation between min and max cost
    const sizeFactor = (asteroidSize - minSize) / (maxSize - minSize);
    const cost = Math.round(minCost + (maxCost - minCost) * sizeFactor);
    
    return Math.max(minCost, Math.min(maxCost, cost));
  }
  
  /**
   * Add points for an event
   */
  addEvent(event: ScoringEvent, context?: any): number {
    const now = Date.now();
    let points = 0;
    
    // Calculate base points
    switch (event) {
      // COSTS
      case ScoringEvent.ASTEROID_LAUNCH:
        const cost = this.calculateAsteroidCost(context?.size || SIZES.ASTEROID.MIN);
        points = -cost; // Negative because it's a cost
        this.statistics.totalAsteroidsLaunched++;
        break;
        
      case ScoringEvent.ENERGY_DOT_LOST:
        points = -POINT_VALUES.COSTS.ENERGY_DOT_LOST;
        this.resetCombo(); // Lost dot breaks combo
        break;
      
      // REWARDS
      case ScoringEvent.BIRD_HIT:
        points = POINT_VALUES.REWARDS.BIRD_HIT;
        this.statistics.totalBirdsHit++;
        this.incrementCombo();
        break;
        
      case ScoringEvent.BIRD_WITH_ENERGY_HIT:
        points = POINT_VALUES.REWARDS.BIRD_WITH_ENERGY_HIT;
        this.statistics.totalBirdsHit++;
        this.incrementCombo();
        break;
        
      case ScoringEvent.BOSS_HIT:
        points = POINT_VALUES.REWARDS.BOSS_HIT;
        this.incrementCombo();
        break;
        
      case ScoringEvent.BOSS_DEFEATED:
        points = POINT_VALUES.REWARDS.BOSS_DEFEATED;
        this.statistics.bossesDefeated++;
        this.incrementCombo();
        break;
        
      case ScoringEvent.ENERGY_DOT_RECLAIMED:
        points = POINT_VALUES.REWARDS.ENERGY_DOT_RECLAIMED;
        this.statistics.totalDotsReclaimed++;
        this.incrementCombo();
        break;
        
      case ScoringEvent.ENERGY_DOT_CAUGHT_FALLING:
        points = POINT_VALUES.REWARDS.ENERGY_DOT_CAUGHT_FALLING;
        this.incrementCombo();
        break;
        
      case ScoringEvent.WAVE_COMPLETE:
        points = POINT_VALUES.REWARDS.WAVE_COMPLETE;
        break;
        
      case ScoringEvent.PERFECT_WAVE:
        points = POINT_VALUES.REWARDS.PERFECT_WAVE;
        this.statistics.perfectWaves++;
        break;
        
      // SPECIAL EVENTS
      case ScoringEvent.MULTI_KILL:
        points = POINT_VALUES.SPECIAL.MULTI_KILL * (context?.count || 2);
        this.incrementCombo();
        break;
        
      case ScoringEvent.RICOCHET_KILL:
        points = POINT_VALUES.SPECIAL.RICOCHET_KILL;
        this.incrementCombo();
        break;
        
      case ScoringEvent.LONG_SHOT:
        points = POINT_VALUES.SPECIAL.LONG_SHOT;
        break;
        
      case ScoringEvent.CLOSE_CALL:
        points = POINT_VALUES.SPECIAL.CLOSE_CALL;
        break;
        
      case ScoringEvent.LAST_SECOND_SAVE:
        points = POINT_VALUES.SPECIAL.LAST_SECOND_SAVE;
        break;
        
      case ScoringEvent.FLAWLESS_DEFENSE:
        points = POINT_VALUES.SPECIAL.FLAWLESS_DEFENSE;
        break;
        
      case ScoringEvent.SPEED_BONUS:
        points = POINT_VALUES.SPECIAL.SPEED_BONUS;
        break;
        
      case ScoringEvent.ACCURACY_BONUS:
        points = POINT_VALUES.SPECIAL.ACCURACY_BONUS;
        break;
    }
    
    // Apply combo multiplier (only for positive points)
    if (points > 0 && this.combo.multiplier > 1) {
      points = Math.round(points * this.combo.multiplier);
    }
    
    // Update score (NEVER go below 0!)
    const oldScore = this.score;
    this.score = Math.max(this.MIN_SCORE, this.score + points);
    const actualPointsAdded = this.score - oldScore;
    
    // Track event
    this.combo.events.push(event);
    this.combo.lastEventTime = now;
    
    return actualPointsAdded;
  }
  
  /**
   * Increment combo
   */
  private incrementCombo(): void {
    this.combo.count++;
    
    // Update multiplier based on combo count
    if (this.combo.count >= 20) {
      this.combo.multiplier = POINT_VALUES.COMBOS.COMBO_EPIC;
    } else if (this.combo.count >= 10) {
      this.combo.multiplier = POINT_VALUES.COMBOS.COMBO_10X;
    } else if (this.combo.count >= 5) {
      this.combo.multiplier = POINT_VALUES.COMBOS.COMBO_5X;
    } else if (this.combo.count >= 3) {
      this.combo.multiplier = POINT_VALUES.COMBOS.COMBO_3X;
    } else if (this.combo.count >= 2) {
      this.combo.multiplier = POINT_VALUES.COMBOS.COMBO_2X;
    }
    
    // Update highest combo
    if (this.combo.count > this.statistics.highestCombo) {
      this.statistics.highestCombo = this.combo.count;
    }
    
    // Reset combo timer
    this.combo.timer = this.COMBO_WINDOW_MS;
  }
  
  /**
   * Reset combo
   */
  private resetCombo(): void {
    this.combo.count = 0;
    this.combo.multiplier = 1;
    this.combo.timer = 0;
    this.combo.events = [];
  }
  
  /**
   * Update combo timer
   */
  updateComboTimer(deltaMs: number): void {
    if (this.combo.timer > 0) {
      this.combo.timer -= deltaMs;
      if (this.combo.timer <= 0) {
        this.resetCombo();
      }
    }
  }
  
  /**
   * Get current score (ALWAYS >= 0)
   */
  getScore(): number {
    return Math.max(this.MIN_SCORE, this.score);
  }
  
  /**
   * Get combo info
   */
  getComboInfo(): ComboState {
    return { ...this.combo };
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return { ...this.statistics };
  }
  
  /**
   * Calculate accuracy
   */
  updateAccuracy(hits: number, misses: number): void {
    const total = hits + misses;
    if (total > 0) {
      this.statistics.accuracy = (hits / total) * 100;
    }
  }
  
  /**
   * Reset statistics
   */
  private resetStatistics(): void {
    this.statistics = {
      totalBirdsHit: 0,
      totalAsteroidsLaunched: 0,
      totalDotsReclaimed: 0,
      highestCombo: 0,
      perfectWaves: 0,
      bossesDefeated: 0,
      accuracy: 0,
    };
  }
  
  /**
   * Get score breakdown for UI
   */
  getScoreBreakdown() {
    return {
      score: this.getScore(),
      combo: this.combo.count,
      multiplier: this.combo.multiplier,
      comboTimeRemaining: Math.max(0, this.combo.timer / 1000), // in seconds
      statistics: this.getStatistics(),
    };
  }
  
  /**
   * Check for special achievements
   */
  checkAchievements(context: any): ScoringEvent[] {
    const achievements: ScoringEvent[] = [];
    
    // Check for multi-kill
    if (context.simultaneousKills > 1) {
      achievements.push(ScoringEvent.MULTI_KILL);
    }
    
    // Check for long shot
    if (context.distance > 500) {
      achievements.push(ScoringEvent.LONG_SHOT);
    }
    
    // Check for close call
    if (context.dotDistanceFromTop < 50) {
      achievements.push(ScoringEvent.CLOSE_CALL);
    }
    
    // Check for last second save
    if (context.timeUntilDotLost < 1000) {
      achievements.push(ScoringEvent.LAST_SECOND_SAVE);
    }
    
    return achievements;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const scoringSystem = new ScoringSystem();