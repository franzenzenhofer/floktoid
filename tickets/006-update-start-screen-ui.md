# Ticket #006: Update Start Screen UI

## Priority: High
## Status: Open
## Created: 2025-01-25
## Depends On: #002, #004
## Blocks: #001

## Overview
Redesign the start screen to support the new progression system with Continue/New Game options.

## Current State (IS)
```tsx
// Current StartScreen shows:
- Title
- Difficulty buttons (Easy, Medium, Hard)
- White Belt progress
- Version info
```

## Desired State (SHOULD)
```tsx
// New StartScreen shows:
- Title with subtitle
- Continue button (if save exists)
  - Shows: "Level 42 • 128k points"
- New Game button
  - Warning if save exists
- Statistics (if save exists)
  - Total levels completed
  - Total points
  - Best streak
- Version info (bottom)
```

## Visual Design
```
┌─────────────────────────────┐
│                             │
│      COLOR ME SAME          │
│   Make all tiles match!     │
│                             │
│  ┌───────────────────────┐  │
│  │      CONTINUE         │  │
│  │   Level 42 • 128k     │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │      NEW GAME         │  │
│  └───────────────────────┘  │
│                             │
│  Completed: 41 levels       │
│  Total Points: 128,450      │
│  Best Streak: 12           │
│                             │
│         v1.38.1             │
└─────────────────────────────┘
```

## Implementation Details
1. Check for saved game on mount
2. Show Continue only if save exists
3. Confirm dialog for New Game if save exists
4. Load saved state when Continue clicked
5. Clear save and start Level 1 for New Game
6. Animate button appearances

## Acceptance Criteria
- [ ] Continue button only shows with saved game
- [ ] Continue shows current level and points
- [ ] New Game warns about overwriting save
- [ ] Statistics display correctly
- [ ] Number formatting applied (128k)
- [ ] Smooth animations on load
- [ ] Mobile responsive layout