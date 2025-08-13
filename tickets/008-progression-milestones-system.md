# Ticket #008: Create Progression Milestones System

## Priority: Medium
## Status: Open
## Created: 2025-01-25
## Depends On: #003, #005
## Blocks: #001

## Overview
Implement a milestone system that handles grid size increases, color additions, and feature unlocks at specific level thresholds.

## Current State (IS)
- Fixed configurations per difficulty
- No progression milestones
- All features available immediately

## Desired State (SHOULD)
```typescript
interface Milestone {
  level: number;
  type: 'grid_size' | 'colors' | 'feature' | 'celebration';
  value: any;
  message: string;
  reward?: number; // Bonus points
}

const MILESTONES = [
  { level: 21, type: 'grid_size', value: 4, message: 'Grid expanded to 4×4!' },
  { level: 41, type: 'colors', value: 4, message: '4th color unlocked!' },
  { level: 51, type: 'grid_size', value: 5, message: 'Grid expanded to 5×5!' },
  { level: 100, type: 'celebration', value: null, message: 'Century! 🎉' }
];
```

## Milestone Schedule
```
Level 1-20: 3×3, 3 colors
Level 21: → 4×4 grid (announcement)
Level 41: → 4 colors
Level 46: → 5 colors
Level 51: → 5×5 grid, reset to 3 colors
Level 71: → 4 colors
Level 96: → 5 colors
Level 101: → 6×6 grid, reset to 3 colors
(Pattern continues...)

Feature Unlocks:
Level 31: Power tiles introduced
Level 71: Locked tiles introduced
Level 121: Multi-locked tiles (2-3 clicks)
Level 171: Color bomb power-up
```

## UI Requirements
1. **Milestone Reached Modal**
   - Appears between levels
   - Shows achievement
   - Bonus points awarded
   - Continue button

2. **Next Milestone Indicator**
   - Progress bar to next milestone
   - "Next: 4×4 grid in 5 levels"

## Implementation Details
- Check for milestones after each level
- Show special animation/modal
- Update game configuration
- Award bonus points
- Save milestone achievements

## Acceptance Criteria
- [ ] Grid size changes at correct levels
- [ ] Colors increase per schedule
- [ ] Milestone modal appears
- [ ] Bonus points awarded
- [ ] Progress indicator accurate
- [ ] Smooth transitions between configs
- [ ] Milestones saved in progress