# Migration Plan: Implementing Guaranteed Solvability

## Overview
We're migrating from the current BFS-based puzzle generation to a mathematically guaranteed reverse-move generation system. This ensures 100% solvability without needing to verify with BFS.

## Phase 1: Parallel Implementation (Current)
✅ Created new files alongside existing ones:
- `useGeneratorV2.ts` - New reverse-move generator
- `useDynamicHintV2.ts` - Enhanced hint engine with optimal path tracking
- `GameContextV2.tsx` - Updated context to track player moves
- `gridV2.ts` - Pure functional grid utilities
- `useGeneratorV2.test.ts` - Comprehensive tests

## Phase 2: Integration Points
Need to update these files to use the new system:

1. **StartScreen.tsx**
   - Import `useGeneratorV2` instead of `useGenerator`
   - Update the generation call to use new hook

2. **GameBoard.tsx**
   - Import `useDynamicHintV2` instead of `useDynamicHint`
   - Pass `optimalPath` and `playerMoves` from context

3. **VictoryModal.tsx**
   - Use `optimalPath.length` for perfect score calculation
   - Show if player was on optimal path

4. **App.tsx**
   - Switch from `GameProvider` to `GameProviderV2`

## Phase 3: Update Imports
Replace imports in all components:
```typescript
// Old
import { useGame } from './context/GameContext';
import { useGenerator } from './hooks/useGenerator';

// New
import { useGame } from './context/GameContextV2';
import { useGeneratorV2 } from './hooks/useGeneratorV2';
```

## Phase 4: Testing & Verification
1. Run all existing tests with new implementation
2. Add integration tests for hint system
3. Verify level progression works correctly
4. Test power tiles and locked tiles behavior

## Phase 5: Cleanup
Once verified working:
1. Remove old files:
   - `useGenerator.ts`
   - `useDynamicHint.ts`
   - `GameContext.tsx`
2. Rename V2 files to remove "V2" suffix
3. Update all imports

## Benefits of New System
1. **100% Guaranteed Solvability** - No need for BFS verification
2. **Perfect Hint System** - Always knows the optimal path
3. **Better Performance** - No BFS computation during generation
4. **Cleaner Code** - Pure functions, easier to test
5. **Mathematical Correctness** - Based on proven linear algebra

## Risk Mitigation
- Keep old files until fully tested
- Can rollback by switching imports
- All game mechanics remain the same
- UI/UX unchanged