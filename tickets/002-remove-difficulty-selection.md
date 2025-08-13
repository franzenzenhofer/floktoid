# Ticket #002: Remove Difficulty Selection System

## Priority: High
## Status: Open
## Created: 2025-01-25
## Depends On: None
## Blocks: #001

## Overview
Remove the current Easy/Medium/Hard difficulty selection from the start screen and game context.

## Current State (IS)
```typescript
// StartScreen.tsx shows:
- Easy button (3x3, 3 colors)
- Medium button (6x6, 4 colors, power tiles)
- Hard button (10x10, 4 colors, power tiles, locked tiles)

// GameContext tracks:
- difficulty: 'easy' | 'medium' | 'hard'
- Different game configs based on difficulty
```

## Desired State (SHOULD)
```typescript
// StartScreen.tsx shows:
- Continue button (if saved progress exists)
- New Game button
- No difficulty selection

// GameContext tracks:
- currentLevel: number
- No difficulty field
```

## Implementation Steps
1. Remove difficulty buttons from StartScreen
2. Remove difficulty type from GameState
3. Remove DIFFICULTIES constant usage
4. Remove SELECT_DIFFICULTY action
5. Update START/NEW_GAME action to not require difficulty

## Affected Files
- `src/components/screens/StartScreen.tsx`
- `src/context/GameContext.tsx`
- `src/constants/gameConfig.ts`
- `src/types/game.ts`
- All test files referencing difficulty

## Acceptance Criteria
- [ ] No difficulty selection visible on start screen
- [ ] Game starts without selecting difficulty
- [ ] All difficulty-related code removed
- [ ] Tests updated to not use difficulty
- [ ] No TypeScript errors