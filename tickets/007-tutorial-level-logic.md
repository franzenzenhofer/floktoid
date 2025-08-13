# Ticket #007: Implement Tutorial Level Logic

## Priority: High
## Status: Open
## Created: 2025-01-25
## Depends On: #003
## Blocks: #001

## Overview
Create special logic for tutorial levels (1-3) that ensures extremely simple puzzles and automatic hint display.

## Current State (IS)
- Hints are manually toggled
- No concept of tutorial levels
- Random puzzle generation

## Desired State (SHOULD)
```typescript
// Tutorial levels have special properties:
interface TutorialLevel {
  level: 1 | 2 | 3;
  hintsAutoEnabled: boolean; // true for 1-2
  moveSequence: Move[];      // Exact moves to solve
  startGrid: Grid;          // Predetermined start state
  tutorialText?: string;    // Optional guidance
}
```

## Tutorial Level Specifications

### Level 1: First Touch
- 3x3 grid, 3 colors
- Only center tile different
- 1 click to win
- Hint arrow points to center
- Text: "Tap the highlighted tile!"

### Level 2: Two Steps
- 3x3 grid, 3 colors
- Specific pattern requiring 2 moves
- Hints show both moves
- Text: "Follow the hints to match all tiles!"

### Level 3: On Your Own
- 3x3 grid, 3 colors
- 3 moves required
- Hints available but not auto-enabled
- Text: "Try solving without hints!"

## Implementation Requirements
1. Hardcode tutorial level configurations
2. Override random generation for levels 1-3
3. Auto-enable hints for levels 1-2
4. Show tutorial text overlay
5. Ensure exact move count
6. Special victory message for tutorials

## Acceptance Criteria
- [ ] Level 1 always requires 1 center click
- [ ] Level 2 always requires exactly 2 moves
- [ ] Level 3 always requires exactly 3 moves
- [ ] Hints auto-enabled for levels 1-2
- [ ] Tutorial text displays correctly
- [ ] Patterns are visually clear
- [ ] Always solvable in exact moves