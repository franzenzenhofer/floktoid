# Ticket #011: Implement Solvability Guarantee & Recovery System

## Priority: CRITICAL
## Status: Open
## Created: 2025-01-25
## Depends On: #003
## Blocks: #001
## Estimated Effort: 12-16 hours

## Problem Statement
While our current generation system uses reverse-move algorithm that guarantees 100% solvability for generated puzzles, there are critical gaps:
1. Players can navigate themselves into unsolvable states through gameplay
2. No detection system for when a puzzle becomes unsolvable
3. No recovery mechanism when players get stuck
4. Mathematical solvability checker exists but isn't integrated into gameplay
5. No user feedback when approaching or entering unsolvable states

## Mathematical Background
The game uses Gaussian elimination over finite fields (Z_k) to verify solvability. A puzzle is solvable if the system of linear equations Ax = b has a solution, where:
- A is the influence matrix (which tiles affect which)
- x is the click vector (which tiles to click)
- b is the difference vector between current and target state

## Current State (IS) - Detailed Analysis

### What Works
1. **Generation Guarantees**: Reverse-move algorithm ensures 100% solvable puzzles
2. **Mathematical Checker**: `isSolvable()` function correctly implements Gaussian elimination
3. **Influence Matrices**: Proper calculation of cross (+) and power (3x3) patterns

### Critical Gaps
1. **No Runtime Checking**: Solvability isn't checked during gameplay
2. **No User Warnings**: Players don't know when they're in trouble
3. **No Recovery Options**: No way to escape unsolvable states
4. **Missing Integration**: Solvability checker not connected to game loop

### Code Analysis
```typescript
// Current solvability check (utils/solvability.ts)
export function isSolvable(
  grid: Grid, 
  k: number, 
  powerTiles: Set<string> = new Set(),
  lockedTiles: Map<string, number> = new Map()
): boolean {
  // Tries each target color 0 to k-1
  // Returns true if ANY color is reachable
  // But this is NEVER CALLED during gameplay!
}
```

## Desired State (SHOULD) - Comprehensive Solution

### 1. Real-time Solvability Monitoring
```typescript
interface SolvabilityMonitor {
  checkInterval: number; // Check every N moves
  lastCheckMove: number;
  lastCheckResult: SolvabilityStatus;
  warningThreshold: number; // Warn if < N solvable targets
}

enum SolvabilityStatus {
  FULLY_SOLVABLE = 'fully_solvable',      // Can reach all colors
  PARTIALLY_SOLVABLE = 'partially_solvable', // Can reach some colors
  SINGLE_SOLUTION = 'single_solution',      // Only one target reachable
  UNSOLVABLE = 'unsolvable'                 // No targets reachable
}
```

### 2. Progressive Warning System
```typescript
interface SolvabilityWarning {
  level: 'info' | 'warning' | 'danger' | 'critical';
  message: string;
  suggestedActions: SuggestedAction[];
  movesUntilUnsolvable?: number;
}

enum SuggestedAction {
  USE_UNDO = 'use_undo',
  USE_HINT = 'use_hint',
  RESTART_LEVEL = 'restart_level',
  ENABLE_SAFETY_MODE = 'enable_safety_mode'
}
```

### 3. Unsolvable State Detection Algorithm
```typescript
class UnsolvableStateDetector {
  private moveHistory: Move[];
  private solvabilityCache: Map<string, SolvabilityResult>;
  
  async checkAfterMove(
    grid: number[][],
    move: Move,
    gameConfig: GameConfig
  ): Promise<SolvabilityCheck> {
    // 1. Quick hash check
    const gridHash = this.hashGrid(grid);
    if (this.solvabilityCache.has(gridHash)) {
      return this.solvabilityCache.get(gridHash)!;
    }
    
    // 2. Check reachable colors
    const reachableColors = await this.findReachableColors(
      grid, 
      gameConfig.colors,
      gameConfig.powerTiles,
      gameConfig.lockedTiles
    );
    
    // 3. Analyze results
    const status = this.analyzeSolvability(reachableColors, gameConfig.colors);
    
    // 4. If concerning, check future moves
    let movesUntilUnsolvable: number | undefined;
    if (status === SolvabilityStatus.SINGLE_SOLUTION) {
      movesUntilUnsolvable = await this.predictUnsolvableDistance(
        grid,
        gameConfig,
        reachableColors[0]
      );
    }
    
    const result = {
      status,
      reachableColors,
      totalColors: gameConfig.colors,
      movesUntilUnsolvable,
      timestamp: Date.now()
    };
    
    this.solvabilityCache.set(gridHash, result);
    return result;
  }
  
  private async predictUnsolvableDistance(
    grid: number[][],
    config: GameConfig,
    targetColor: number
  ): Promise<number> {
    // Simulate all possible next moves
    // Return minimum moves until no solution exists
    // This helps warn players BEFORE they get stuck
  }
}
```

### 4. Recovery Mechanisms
```typescript
interface RecoverySystem {
  // Automatic safety net
  autoSaveInterval: number; // Save state every N moves
  safeStates: SafeState[]; // Rolling buffer of solvable states
  
  // Player-triggered recovery
  requestHelp(): RecoveryOption[];
  activateRecovery(option: RecoveryOption): void;
}

interface SafeState {
  grid: number[][];
  moveNumber: number;
  solvabilityStatus: SolvabilityStatus;
  timestamp: number;
}

enum RecoveryOption {
  UNDO_TO_SAFE = 'undo_to_safe',        // Undo to last known solvable
  HINT_PATH = 'hint_path',              // Show path to nearest solvable
  POWER_BOOST = 'power_boost',          // Add temporary power tile
  COLOR_REDUCTION = 'color_reduction',   // Temporarily reduce colors
  RESTART_CHECKPOINT = 'restart_checkpoint' // Restart from safe point
}
```

### 5. Visual Feedback System
```typescript
interface SolvabilityIndicator {
  // Traffic light system
  displayMode: 'subtle' | 'prominent';
  position: 'top-right' | 'integrated';
  
  // Visual states
  states: {
    green: {
      icon: '✓',
      color: '#10b981',
      message: 'Multiple solutions available'
    },
    yellow: {
      icon: '⚠',
      color: '#f59e0b',
      message: 'Limited solutions - be careful!'
    },
    red: {
      icon: '⚡',
      color: '#ef4444',
      message: 'Danger! Only one path remains'
    },
    black: {
      icon: '💀',
      color: '#000000',
      message: 'Unsolvable - use recovery options'
    }
  };
}
```

### 6. Integration Points
```typescript
// In GameContext reducer
case 'CLICK': {
  // ... existing click logic ...
  
  // New: Check solvability after move
  if (state.moves % SOLVABILITY_CHECK_INTERVAL === 0) {
    const solvabilityCheck = await checkSolvability(nextGrid, state);
    
    if (solvabilityCheck.status === SolvabilityStatus.UNSOLVABLE) {
      return {
        ...state,
        grid: nextGrid,
        unsolvable: true,
        recoveryOptions: generateRecoveryOptions(state)
      };
    }
    
    if (solvabilityCheck.movesUntilUnsolvable <= 3) {
      dispatch({ 
        type: 'SHOW_WARNING', 
        payload: createWarning(solvabilityCheck) 
      });
    }
  }
  
  // Auto-save if still solvable
  if (solvabilityCheck.status !== SolvabilityStatus.UNSOLVABLE) {
    safeStateManager.save(nextGrid, state.moves);
  }
}
```

## Implementation Strategy

### Phase 1: Core Detection (Days 1-3)
1. Integrate `isSolvable()` into game loop
2. Implement efficient caching system
3. Create move prediction algorithm
4. Build safe state manager

### Phase 2: User Feedback (Days 4-5)
1. Design solvability indicator UI
2. Implement warning system
3. Create recovery options modal
4. Add visual danger zones

### Phase 3: Recovery Systems (Days 6-7)
1. Implement auto-save mechanism
2. Create undo-to-safe feature
3. Build hint path calculator
4. Add emergency recovery options

### Phase 4: Testing & Tuning (Days 8)
1. Test edge cases
2. Performance optimization
3. User feedback refinement
4. Documentation

## Performance Considerations

### Optimization Strategies
```typescript
class OptimizedSolvabilityChecker {
  // 1. Incremental checking
  private lastCheckedGrid: string;
  private lastResult: SolvabilityResult;
  
  // 2. Probabilistic checking
  shouldCheckNow(moveNumber: number): boolean {
    // Check more frequently as puzzle progresses
    const checkProbability = Math.min(0.8, moveNumber / 50);
    return Math.random() < checkProbability;
  }
  
  // 3. Background checking
  async checkInBackground(grid: number[][]): Promise<void> {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.performCheck(grid));
    } else {
      setTimeout(() => this.performCheck(grid), 100);
    }
  }
  
  // 4. Early termination
  async quickCheck(grid: number[][]): Promise<boolean> {
    // Just check if current winning color is reachable
    const winningColor = grid[0][0];
    return this.canReachColor(grid, winningColor);
  }
}
```

## Edge Cases & Solutions

### 1. Player Creates Unsolvable State
**Scenario**: Player makes moves that eliminate all solution paths
**Solution**: 
- Immediate detection and warning
- Offer undo to last safe state
- Provide "learning mode" explanation

### 2. Locked Tiles Block All Solutions
**Scenario**: Locked tile configuration prevents any solution
**Solution**:
- Pre-check during level generation
- Emergency unlock option (costs points)
- Alternative win conditions

### 3. Performance Impact
**Scenario**: Solvability checking slows down gameplay
**Solution**:
- Async checking with Web Workers
- Incremental checks only on significant moves
- Cache results aggressively

## Success Metrics
- **Detection Rate**: 100% of unsolvable states detected within 2 moves
- **Recovery Success**: 95% of players successfully recover from unsolvable states
- **Performance Impact**: < 16ms per solvability check
- **User Satisfaction**: 80% report feeling "supported, not frustrated" when stuck

## Acceptance Criteria
- [ ] Solvability checked after every N moves (configurable)
- [ ] Visual indicator shows current solvability status
- [ ] Warning appears 3+ moves before unsolvable state
- [ ] Players can undo to last safe state
- [ ] Recovery options menu accessible when stuck
- [ ] Performance remains smooth (60fps) during checks
- [ ] Safe states auto-saved every 5 moves
- [ ] Tutorial explains solvability concept
- [ ] Unsolvable states log for analysis
- [ ] Emergency "reset to solvable" always available
- [ ] Color-blind friendly indicators
- [ ] Mobile-optimized recovery UI

## Future Enhancements
- AI assistant that suggests moves to avoid unsolvable states
- "Guardian Angel" mode that prevents unsolvable moves
- Solvability heatmap showing dangerous tiles
- Machine learning to predict player trouble spots
- Community-shared recovery strategies