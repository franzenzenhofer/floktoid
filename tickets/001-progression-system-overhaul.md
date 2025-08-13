# Ticket #001: Complete Progression System Overhaul

## Priority: High
## Status: Open
## Created: 2025-01-25

## Overview
Replace the current Easy/Medium/Hard difficulty system with a gradual, level-based progression system that starts extremely simple and gradually increases complexity over hundreds of levels.

## Current State (IS)
- Three difficulty modes: Easy (3x3, 3 colors), Medium (6x6, 4 colors), Hard (10x10, 4 colors)
- Players choose difficulty at start
- No progression between games
- No persistent progress tracking
- Hints are optional toggle
- Power-ups and locked tiles appear based on difficulty

## Desired State (SHOULD)
- Continuous level-based progression (Level 1, 2, 3... potentially infinite)
- Start with tutorial levels (1-2 moves from solution)
- Gradual increase in moves required
- Grid size increases at specific milestones
- Color count increases within each grid size stage
- Persistent progress saving
- Points system with level and total scores
- No points awarded if hints are used
- Automatic hint display for tutorial levels

## Key Requirements
1. **Tutorial Levels (1-3)**
   - Level 1: 1 move to solve (center tile only)
   - Level 2: 2 moves to solve
   - Level 3: 3 moves to solve (hints no longer auto-enabled)
   - All on 3x3 grid with 3 colors

2. **Progression Formula**
   - Levels 1-20: 3x3 grid, 3 colors, 1-20 moves
   - Levels 21-50: 4x4 grid, 3 colors (21-40), 4 colors (41-45), 5 colors (46-50), 10-30 moves
   - Levels 51-100: 5x5 grid, similar color progression, 15-40 moves
   - Pattern continues...

3. **Persistent State**
   - Save current level
   - Save total points
   - Save completion status

4. **UI Changes**
   - Remove difficulty selection
   - Add "Continue" and "New Game" options
   - Show current level and points
   - Use number shortcuts (1k, 32k, 1M) for large numbers

## Dependencies
- Solvability checking must work for all configurations
- Save system implementation
- Points calculation system
- UI redesign for start screen

## Acceptance Criteria
- [ ] Player can start from Level 1 with 1 move solution
- [ ] Each level increases moves required by 1
- [ ] Grid size increases at correct milestones
- [ ] Colors increase at correct stages
- [ ] Progress persists between sessions
- [ ] Points accumulate correctly
- [ ] No points awarded when hints used
- [ ] All generated puzzles are solvable
- [ ] Smooth difficulty curve with no sudden jumps

## Related Tickets
- #002: Remove Difficulty Selection System
- #003: Implement Level Generation Algorithm
- #004: Create Persistent Save System
- #005: Design Points & Scoring System
- #006: Update Start Screen UI
- #007: Implement Tutorial Level Logic
- #008: Create Progression Milestones System
- #009: Add Level Display UI
- #010: Implement Gradual Constraints System