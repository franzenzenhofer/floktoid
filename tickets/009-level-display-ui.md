# Ticket #009: Implement Level Display UI Components

## Priority: HIGH
## Status: Open
## Created: 2025-01-25
## Depends On: #003, #005
## Blocks: #001
## Estimated Effort: 8-12 hours

## Problem Statement
Currently, players have no visibility into their progression journey. They don't know what level they're on, how many points they've earned, or what's coming next. This creates a disconnected experience where each game feels isolated rather than part of a larger journey.

## User Stories
1. **As a player**, I want to see my current level prominently so I feel a sense of progression
2. **As a player**, I want to see my total points with smart formatting so I can track my overall success
3. **As a player**, I want to know what's coming next so I stay motivated to continue
4. **As a player**, I want visual feedback when I gain points so I feel rewarded

## Current State (IS) - Detailed Analysis

### Current UI Elements
```typescript
// Dashboard shows:
- Move counter (simple number)
- Timer (MM:SS)
- Difficulty label (Easy/Medium/Hard)
- Pause button
```

### What's Missing
- No level indicator
- No points display
- No progression feedback
- No "next milestone" teaser
- Poor visual hierarchy

## Desired State (SHOULD) - Comprehensive Design

### New Dashboard Layout
```
┌─────────────────────────────────────────┐
│ LEVEL 42          Color Me Same      ⚙️  │
├─────────────────────────────────────────┤
│                                         │
│  Points: 128.5k  (+2,340)  🔥12 streak │
│  ──────────────[███████──]───────────  │
│         Next: 4×4 grid at Level 51     │
│                                         │
├─────────────────────────────────────────┤
│   Moves: 18/24   Time: 1:34   ❓ Hint  │
└─────────────────────────────────────────┘
```

### Component Specifications

#### 1. Level Indicator Component
```typescript
interface LevelIndicatorProps {
  currentLevel: number;
  isSpecialLevel: boolean; // Milestone levels
  animation?: 'pulse' | 'glow' | 'none';
}

// Visual Design:
// - Large, bold font (2rem)
// - Gradient text for milestone levels
// - Subtle pulse animation on level up
// - Color coding:
//   - 1-20: Green (learning)
//   - 21-50: Blue (growing)
//   - 51-100: Purple (advancing)
//   - 101+: Gold (expert)
```

#### 2. Points Display Component
```typescript
interface PointsDisplayProps {
  totalPoints: number;
  levelPoints: number;      // Current level accumulated
  lastGain?: number;        // For animation
  showAnimation: boolean;
}

// Features:
// - Smart number formatting
// - Animated point additions (+250 floats up)
// - Color changes based on performance
// - Milestone celebrations (confetti at 100k, 1M)

// Number Formatting Rules:
formatPoints(points: number): string {
  if (points < 1000) return points.toString();
  if (points < 10000) return (points / 1000).toFixed(1) + 'k';
  if (points < 1000000) return Math.floor(points / 1000) + 'k';
  if (points < 10000000) return (points / 1000000).toFixed(1) + 'M';
  return Math.floor(points / 1000000) + 'M';
}
```

#### 3. Progress Bar Component
```typescript
interface ProgressBarProps {
  currentLevel: number;
  nextMilestone: number;
  milestoneType: 'grid' | 'color' | 'feature';
  percentage: number;
}

// Visual Features:
// - Gradient fill based on progress
// - Milestone markers
// - Animated fill on progress
// - Tooltip with details on hover
// - Particle effects at 100%
```

#### 4. Streak Counter Component
```typescript
interface StreakCounterProps {
  currentStreak: number;
  bestStreak: number;
  isActive: boolean;
}

// Visual Design:
// - Fire emoji for active streaks
// - Grows/shakes on increment
// - Special effects at 5, 10, 25, 50
// - Shows risk indicator if using hints
```

### Animation Specifications

#### Level Up Animation Sequence
```typescript
// 1. Current level number scales up and fades
// 2. New level number slides in from bottom
// 3. Particle burst effect
// 4. Progress bar fills to next milestone
// 5. If milestone: special celebration modal

const levelUpSequence = {
  duration: 1200,
  steps: [
    { element: 'oldLevel', animation: 'scaleAndFade', duration: 300 },
    { element: 'newLevel', animation: 'slideInBounce', duration: 400 },
    { element: 'particles', animation: 'burst', duration: 600 },
    { element: 'progressBar', animation: 'fill', duration: 500 }
  ]
};
```

#### Points Addition Animation
```typescript
// Smooth counter increment
// Floating +points indicator
// Scale pulse on total
// Color flash for big gains

function animatePoints(from: number, to: number, duration: number = 800) {
  const frames = 60;
  const increment = (to - from) / frames;
  let current = from;
  
  const interval = setInterval(() => {
    current += increment;
    updateDisplay(formatPoints(Math.floor(current)));
    
    if (current >= to) {
      clearInterval(interval);
      pulseEffect();
    }
  }, duration / frames);
}
```

### Mobile Responsive Design

#### Portrait Mode (< 768px)
```
┌─────────────────────┐
│ LVL 42    128.5k 🔥12│
│ ═══════════[███]═══ │
│ Moves: 18  Time: 1:34│
└─────────────────────┘
```

#### Landscape Mode
- Horizontal layout
- Points on right
- Level on left
- Progress bar as border

### Accessibility Requirements
1. **Screen Readers**
   - Announce level changes
   - Read point gains
   - Describe progress

2. **Color Blind Mode**
   - Pattern-based progress
   - Shape indicators
   - High contrast option

3. **Reduced Motion**
   - Instant transitions
   - No particle effects
   - Simple state changes

### Performance Considerations
1. **Animations**
   - Use CSS transforms only
   - RequestAnimationFrame for JS
   - Throttle updates to 60fps
   - Disable on low-end devices

2. **Memory**
   - Reuse particle pool
   - Limit animation instances
   - Clean up completed animations

3. **React Optimization**
   - Memoize formatting functions
   - Use React.memo for static parts
   - Separate animated components

## Implementation Plan

### Phase 1: Core Components (Day 1-2)
1. Create LevelIndicator component
2. Create PointsDisplay component
3. Create ProgressBar component
4. Create StreakCounter component

### Phase 2: Integration (Day 2-3)
1. Update Dashboard layout
2. Connect to GameContext
3. Add responsive styles
4. Wire up state updates

### Phase 3: Animations (Day 3-4)
1. Implement level up sequence
2. Add point gain animations
3. Create particle effects
4. Add celebration moments

### Phase 4: Polish (Day 4-5)
1. Mobile optimization
2. Accessibility features
3. Performance tuning
4. Edge case handling

## Test Cases

### Unit Tests
```typescript
describe('PointsDisplay', () => {
  test('formats numbers correctly', () => {
    expect(formatPoints(999)).toBe('999');
    expect(formatPoints(1000)).toBe('1.0k');
    expect(formatPoints(1500)).toBe('1.5k');
    expect(formatPoints(10000)).toBe('10k');
    expect(formatPoints(999999)).toBe('999k');
    expect(formatPoints(1000000)).toBe('1.0M');
  });
  
  test('animates point additions', async () => {
    const { getByText } = render(<PointsDisplay totalPoints={1000} />);
    
    act(() => {
      addPoints(500);
    });
    
    await waitFor(() => {
      expect(getByText('1.5k')).toBeInTheDocument();
      expect(getByText('+500')).toHaveClass('floating-animation');
    });
  });
});
```

### Integration Tests
- Level changes update all components
- Points persist across sessions
- Progress bar calculates correctly
- Animations don't block interactions

### E2E Tests
- Complete level and see updates
- Streak maintains across levels
- Milestone triggers special effects
- Mobile layout responds correctly

## Acceptance Criteria - Detailed
- [ ] Level number always visible and prominent
- [ ] Points display with smart formatting (999, 1.2k, 45k, 1.3M)
- [ ] Point additions animate smoothly
- [ ] Progress bar shows next milestone
- [ ] Streak counter tracks consecutive wins
- [ ] Fire emoji appears for active streaks
- [ ] Level up triggers celebration animation
- [ ] Milestone reached shows special modal
- [ ] Mobile layout fits without scrolling
- [ ] Animations respect prefers-reduced-motion
- [ ] Screen readers announce important changes
- [ ] Performance: 60fps animations on modern devices
- [ ] No memory leaks from animations
- [ ] Works offline (animations gracefully degrade)
- [ ] Color blind mode provides alternatives

## Future Enhancements
- Leaderboard position indicator
- Daily challenge progress
- XP bar for meta-progression
- Achievement notification area
- Social sharing shortcuts
- Mini-map of level progression
- Statistics hover panel

## Design Mockups
[Would include actual Figma/design links in real ticket]

## Related Documentation
- Animation Guidelines: /docs/animations.md
- Number Formatting: /docs/formatting.md
- Accessibility Standards: /docs/a11y.md
- Performance Budgets: /docs/performance.md