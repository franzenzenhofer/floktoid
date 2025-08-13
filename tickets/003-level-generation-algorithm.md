# Ticket #003: Implement Level Generation Algorithm

## Priority: High
## Status: Open
## Created: 2025-01-25
## Depends On: #002
## Blocks: #001

## Overview
Create a deterministic algorithm that generates puzzle configurations based on level number, ensuring gradual progression and solvability.

## Current State (IS)
```typescript
// Random generation with moves parameter
generateSolvableGrid(size: number, colors: number, minMoves?: number)
```

## Desired State (SHOULD)
```typescript
interface LevelConfig {
  level: number;
  gridSize: number;
  colors: number;
  requiredMoves: number;
  powerTiles: number;
  lockedTiles: number;
  hintsEnabled: boolean;
}

function getLevelConfig(level: number): LevelConfig
function generateLevelGrid(config: LevelConfig): GeneratedGrid
```

## Level Progression Rules
```
Levels 1-20 (3x3 grid):
- Colors: 3
- Moves: level number (1-20)
- No power/locked tiles
- Hints auto-enabled for levels 1-2

Levels 21-50 (4x4 grid):
- Colors: 3 (21-40), 4 (41-45), 5 (46-50)
- Moves: 10 + (level - 21) [10-39]
- Power tiles: 0 (21-30), 1 (31-40), 2 (41-50)
- No locked tiles

Levels 51-100 (5x5 grid):
- Colors: 3 (51-70), 4 (71-95), 5 (96-100)
- Moves: 15 + (level - 51) [15-64]
- Power tiles: 1 (51-60), 2 (61-80), 3 (81-100)
- Locked tiles: 0 (51-70), 1 (71-85), 2 (86-100)

Pattern continues...
```

## Implementation Details
1. Create `getLevelConfig()` that returns configuration for any level
2. Modify `generateSolvableGrid()` to accept exact move count
3. Ensure generated puzzle requires EXACTLY the specified moves
4. Add retry logic if generation fails
5. Cache level configurations for performance

## Acceptance Criteria
- [ ] Level 1 generates 3x3 grid requiring exactly 1 move
- [ ] Level progression follows specified rules
- [ ] All generated levels are solvable
- [ ] Move count matches level specification
- [ ] Power/locked tiles appear at correct levels
- [ ] Algorithm handles levels 1-1000+