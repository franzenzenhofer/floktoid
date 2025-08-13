# Ticket #010: Implement Gradual Constraints System

## Priority: HIGH
## Status: Open
## Created: 2025-01-25
## Depends On: #003, #007
## Blocks: #001
## Estimated Effort: 16-20 hours

## Problem Statement
Currently, game constraints (time limits, move limits, special tiles) appear suddenly based on difficulty selection. This creates jarring difficulty spikes that frustrate players. We need a system that introduces constraints so gradually that players barely notice they're being challenged more - the "boiling frog" approach to difficulty.

## Psychological Design Principles
1. **Imperceptible Increases**: Each new constraint should feel like "just one more small thing"
2. **Preparation Period**: Players need 5-10 levels to adapt before next constraint
3. **Positive Framing**: Present constraints as "features" or "bonuses"
4. **Safety Nets**: Always provide escape valves (hints, undo) when introducing new challenges

## Current State (IS) - Problem Analysis

### Current Constraint System
```typescript
// Binary on/off based on difficulty
if (difficulty === 'medium') {
  addPowerTiles(2);
}
if (difficulty === 'hard') {
  addPowerTiles(3);
  addLockedTiles(3);
  enableTimer();
}
```

### Problems
1. **Shock Introduction**: 0 to 3 locked tiles instantly
2. **No Learning Curve**: Players don't understand new mechanics
3. **Cognitive Overload**: Multiple new concepts at once
4. **Frustration Points**: Players quit when hitting new constraints

## Desired State (SHOULD) - Gradual Introduction System

### Constraint Introduction Timeline

```typescript
interface ConstraintMilestone {
  level: number;
  type: ConstraintType;
  value: any;
  tutorialText?: string;
  introductionMode: 'soft' | 'medium' | 'full';
}

enum ConstraintType {
  MOVE_LIMIT_SOFT = 'move_limit_soft',        // Generous limit
  MOVE_LIMIT_MEDIUM = 'move_limit_medium',    // Tighter limit
  MOVE_LIMIT_TIGHT = 'move_limit_tight',      // Optimal + 20%
  TIME_AWARENESS = 'time_awareness',          // Show timer, no limit
  TIME_BONUS = 'time_bonus',                  // Bonus points for speed
  TIME_LIMIT_SOFT = 'time_limit_soft',        // 5 minutes
  POWER_TILE_INTRO = 'power_tile_intro',      // 1 beneficial power tile
  LOCKED_TILE_INTRO = 'locked_tile_intro',    // 1 locked tile (2 clicks)
  UNDO_LIMIT = 'undo_limit',                  // Limited undos
  HINT_COST = 'hint_cost',                    // Hints cost points
}
```

### Detailed Introduction Schedule

#### Levels 1-30: Pure Foundation
- **Goal**: Build confidence and pattern recognition
- **Constraints**: NONE
- **Focus**: Learning core mechanics

#### Levels 31-40: Move Awareness
```typescript
// Level 31: Introduce move counter prominently
{
  level: 31,
  type: MOVE_LIMIT_SOFT,
  value: optimalMoves * 3, // Very generous
  tutorialText: "Great job! Did you know experts solve this in 12 moves? No pressure though!"
}

// Level 35: Tighten slightly
{
  level: 35,
  type: MOVE_LIMIT_MEDIUM,
  value: optimalMoves * 2.5,
  tutorialText: "You're getting efficient! Try to beat 20 moves for bonus points!"
}
```

#### Levels 41-50: Time Awareness (No Pressure)
```typescript
// Level 41: Just show the timer
{
  level: 41,
  type: TIME_AWARENESS,
  value: null,
  tutorialText: "New feature: See how fast you can solve puzzles! No time limit, just for fun!"
}

// Level 45: Introduce time bonuses
{
  level: 45,
  type: TIME_BONUS,
  value: { under60s: 500, under120s: 250 },
  tutorialText: "Quick solving earns bonus points! But take your time if needed."
}
```

#### Levels 51-60: Beneficial Power Tiles
```typescript
// Level 51: First power tile (always helpful position)
{
  level: 51,
  type: POWER_TILE_INTRO,
  value: 1,
  tutorialText: "⚡ Power Tile! This special tile affects a 3×3 area - super helpful!",
  introductionMode: 'soft' // Placed optimally
}

// Level 56: Two power tiles
{
  level: 56,
  type: POWER_TILE_INCREASE,
  value: 2,
  introductionMode: 'medium' // Random placement
}
```

#### Levels 71-80: Locked Tiles (Gentle Introduction)
```typescript
// Level 71: Single locked tile in corner
{
  level: 71,
  type: LOCKED_TILE_INTRO,
  value: { count: 1, clicks: 2, position: 'corner' },
  tutorialText: "🔒 This tile needs 2 clicks to unlock! Each click helps nearby tiles too!",
  introductionMode: 'soft'
}

// Level 76: Two locked tiles
{
  level: 76,
  type: LOCKED_TILE_INCREASE,
  value: { count: 2, clicks: 2 },
  introductionMode: 'medium'
}
```

#### Levels 91-100: Combining Constraints
```typescript
// Level 91: Move limit + power tiles
// Level 95: Time bonus + locked tiles  
// Level 100: All constraints active (still generous)
```

### Constraint Scaling Algorithm

```typescript
class ConstraintManager {
  private playerPerformance: PerformanceTracker;
  
  getConstraintsForLevel(level: number): LevelConstraints {
    const baseConstraints = this.getBaseConstraints(level);
    
    // Adaptive difficulty - ease up if player struggling
    if (this.playerPerformance.isStruggling()) {
      return this.easeConstraints(baseConstraints);
    }
    
    // Gradually tighten for skilled players
    if (this.playerPerformance.isExcelling()) {
      return this.tightenConstraints(baseConstraints);
    }
    
    return baseConstraints;
  }
  
  private easeConstraints(constraints: LevelConstraints): LevelConstraints {
    return {
      ...constraints,
      moveLimit: constraints.moveLimit ? constraints.moveLimit * 1.2 : undefined,
      timeLimit: constraints.timeLimit ? constraints.timeLimit * 1.5 : undefined,
      lockedTiles: Math.max(0, (constraints.lockedTiles || 0) - 1)
    };
  }
}
```

### Performance Tracking

```typescript
interface PerformanceTracker {
  recentAttempts: LevelAttempt[];
  
  isStruggling(): boolean {
    // True if:
    // - Failed same level 3+ times
    // - Average moves > optimal * 2
    // - Quit rate > 50% last 5 levels
  }
  
  isExcelling(): boolean {
    // True if:
    // - Completed last 5 levels first try
    // - Average moves < optimal * 1.2
    // - No hints used recently
  }
}
```

### Tutorial System for New Constraints

```typescript
interface ConstraintTutorial {
  showForConstraint(type: ConstraintType): TutorialFlow {
    switch(type) {
      case LOCKED_TILE_INTRO:
        return {
          steps: [
            {
              highlight: '.locked-tile',
              text: "This is a locked tile! It needs multiple clicks.",
              position: 'bottom'
            },
            {
              action: 'click-locked',
              text: "Click it once... see the number decrease!",
              waitForAction: true
            },
            {
              action: 'click-locked',
              text: "One more click to unlock it completely!",
              waitForAction: true
            },
            {
              text: "Great! Locked tiles still affect neighbors each click!",
              duration: 3000
            }
          ]
        };
    }
  }
}
```

### Visual Design for Constraints

#### Move Limit Display
```
Early Levels (Soft):
┌─────────────────────────┐
│ Moves: 15  (Pro: 8) 😊  │  // Encouraging
└─────────────────────────┘

Later Levels (Tight):
┌─────────────────────────┐
│ Moves: 12/15 ⚠️        │  // Warning at 80%
└─────────────────────────┘
```

#### Time Display Evolution
```
Level 41-50: ⏱️ 1:23        // Just informational
Level 51-70: ⏱️ 1:23 +500pts // Shows potential bonus
Level 71+:   ⏱️ 1:23/3:00    // Soft limit appears
```

### Adaptive Difficulty Engine

```typescript
class AdaptiveDifficulty {
  private readonly ADJUSTMENT_THRESHOLD = 3; // failures before easing
  private readonly EXCELLENCE_THRESHOLD = 5; // successes before tightening
  
  adjustLevel(level: LevelConfig, playerStats: PlayerStats): LevelConfig {
    const recentPerformance = this.calculateRecentPerformance(playerStats);
    
    // Dynamic constraint adjustment
    if (recentPerformance.failureRate > 0.5) {
      return this.makeEasier(level);
    }
    
    if (recentPerformance.excellenceRate > 0.8) {
      return this.makeHarder(level);
    }
    
    return level;
  }
  
  private makeEasier(level: LevelConfig): LevelConfig {
    return {
      ...level,
      moveLimit: level.moveLimit ? Math.floor(level.moveLimit * 1.15) : undefined,
      powerTiles: level.powerTiles + 1,
      lockedTiles: Math.max(0, level.lockedTiles - 1),
      hint: level.hint || this.generateHelpfulHint(level)
    };
  }
}
```

## Implementation Plan

### Phase 1: Constraint Framework (Days 1-3)
1. Create ConstraintManager class
2. Define constraint types and progression
3. Build performance tracking system
4. Implement adaptive difficulty

### Phase 2: Gradual Introduction (Days 4-6)
1. Move limit soft introduction
2. Time awareness system
3. Power tile tutorial
4. Locked tile gentle intro

### Phase 3: Visual & UX (Days 7-8)
1. Progressive UI changes
2. Tutorial overlays
3. Encouraging messaging
4. Warning states

### Phase 4: Testing & Tuning (Days 9-10)
1. Playtest with 20+ users
2. Identify difficulty spikes
3. Tune introduction rates
4. Polish transitions

## Success Metrics
- **Quit Rate**: < 5% at constraint introduction points
- **Completion Rate**: > 80% within 3 attempts
- **Player Feedback**: "Didn't notice it getting harder"
- **Retention**: 70% of players reach level 50
- **Time to Adapt**: < 3 levels to master new constraint

## Acceptance Criteria
- [ ] No constraint appears without introduction
- [ ] Each constraint has tutorial on first appearance
- [ ] Move limits start at 3x optimal
- [ ] Time starts as information only
- [ ] Power tiles introduced beneficially first
- [ ] Locked tiles start with just 1
- [ ] Performance tracking adjusts difficulty
- [ ] Players can always complete levels
- [ ] Constraints ease up after failures
- [ ] Visual indicators are encouraging, not punishing
- [ ] Tutorials are skippable but helpful
- [ ] No cognitive overload moments
- [ ] Smooth progression curve maintained

## Risk Mitigation
1. **Too Easy**: Excellence tracking tightens constraints
2. **Too Hard**: Automatic easing after failures
3. **Confusion**: Mandatory tutorials for new mechanics
4. **Frustration**: Always provide hints/skips
5. **Boredom**: Hidden excellence challenges

## Future Enhancements
- Player-selected difficulty preferences
- "Relaxed Mode" with no constraints
- "Challenge Mode" with tighter limits
- Constraint customization options
- Daily challenges with unique constraints