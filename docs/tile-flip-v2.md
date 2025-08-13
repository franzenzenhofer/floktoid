# Tile Flip Animation v2 - Simplified Design

## Problem with v1
- Complex state management with previousValue tracking
- Initial render triggered unwanted animations
- Animation state got stuck
- Too many moving parts with displayValue vs actual value

## New Approach - Keep It Simple

### Core Principle
Use Framer Motion's built-in animation detection to trigger flips when the value prop changes.

### Implementation Strategy

1. **Single Source of Truth**
   - The tile always displays its current `value` prop
   - No separate displayValue or previousValue tracking
   - Let Framer Motion handle change detection

2. **Animation Trigger**
   - Use `animate` prop with a key that changes when value changes
   - This forces Framer Motion to re-animate when color changes
   - Simple rotation animation on Y-axis

3. **Visual Effect**
   - Tile rotates 180° when value changes
   - Use `rotateY` with proper 3D transform setup
   - Single smooth animation, no complex timing

4. **Staggered Animation**
   - Pass delay from GameBoard based on tile position
   - Center tile: 0ms delay
   - Adjacent tiles: 50ms delay
   - Power tile pattern: delay based on distance

### Key Differences from v1
- No useEffect for animation triggering
- No separate front/back faces
- No displayValue state
- Simpler, more reliable animation
- Let Framer Motion do the heavy lifting

### Implementation Steps
1. Add animation key based on value to force re-animation
2. Use simple rotateY animation
3. Add perspective for 3D effect
4. Pass delays from GameBoard
5. Test thoroughly