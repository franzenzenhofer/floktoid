# Ticket #005: Design Points & Scoring System

## Priority: High
## Status: Open
## Created: 2025-01-25
## Depends On: #003
## Blocks: #001, #009

## Overview
Implement a points system that rewards optimal play and creates meaningful progression incentives.

## Current State (IS)
```typescript
// Basic score calculation exists but not used
calculateScore(moves, time, difficulty, hintsUsed, powerUsed, optimalMoves)
```

## Desired State (SHOULD)
```typescript
interface LevelScore {
  basePoints: number;      // Based on level difficulty
  moveBonus: number;       // Bonus for optimal moves
  timeBonus: number;       // Bonus for quick completion
  perfectBonus: number;    // Bonus for no hints/undo
  totalPoints: number;     // Sum of all
}

// Display formats:
// 1,234 → 1.2k
// 12,345 → 12k
// 123,456 → 123k
// 1,234,567 → 1.2M
```

## Scoring Rules
1. **Base Points**
   - Level 1-20: 100 points
   - Level 21-50: 200 points
   - Level 51-100: 300 points
   - Pattern: +100 every 50 levels

2. **Move Bonus**
   - Optimal moves: +50% base points
   - Each extra move: -10% (min 0)

3. **Time Bonus**
   - Under 30 seconds: +20%
   - Under 60 seconds: +10%
   - No bonus after 60 seconds

4. **Perfect Bonus**
   - No hints used: +100% base points
   - Hints used: 0 points total for level

5. **Special Rules**
   - Tutorial levels (1-3): Fixed 50 points each
   - Using undo: -25% from total
   - Power tiles used optimally: +10% each

## Display Requirements
- Show points earned after level completion
- Running total displayed during gameplay
- Use number shortcuts for large values
- Animate point additions

## Acceptance Criteria
- [ ] Points calculated correctly per rules
- [ ] Zero points when hints used
- [ ] Number formatting works (1.2k, 32k, 1.5M)
- [ ] Points persist in save system
- [ ] Victory modal shows level points
- [ ] Running total updates live