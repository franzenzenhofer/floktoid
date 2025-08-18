# OLD COMBO DESIGN REFERENCE

## Colors by Tier
- 2x DOUBLE: color: 0x00FFFF (cyan), secondary: 0x0088FF (blue)
- 3x TRIPLE: color: 0x00FF88 (green-cyan), secondary: 0x00FFFF (cyan)
- 4x QUAD: color: 0x44FF44 (green), secondary: 0x88FF88 (light green)
- 5x COMBO: color: 0x88FF00 (yellow-green), secondary: 0xFFFF00 (yellow)
- 10x MEGA: color: 0xFF00FF (magenta), secondary: 0xFF88FF (pink)
- 15x ULTRA: color: 0xFF8800 (orange), secondary: 0xFFFF00 (yellow)
- 20x EPIC: color: 0xFFD700 (gold), secondary: 0xFFFFFF (white)
- 30x LEGENDARY: color: 0xFF00FF (magenta), secondary: 0x00FFFF (cyan)

## Scale by Tier
- 2x: scale 1.0
- 3x: scale 1.1
- 4x: scale 1.15
- 5x: scale 1.2
- 10x: scale 1.4
- 15x: scale 1.6
- 20x: scale 2.0
- 30x: scale 2.5

## Animation (120 frames total = 2 seconds)
1. **Punch-in (frames 1-10)**: Start at 0.1 scale, punch to 1.2x overshoot
2. **Bounce back (frames 11-20)**: Ease back from overshoot to target scale
3. **Float up & fade (frames 21-120)**: 
   - Move up 1.5 pixels per frame
   - Fade alpha from 1 to 0
   - Scale grows by 0.2 over duration
   - Rotate if combo >= 10

## Text Styling
- Font size: BASE + (scale - 1) * 20, capped at screen limits
- Bold weight always
- Italic style for combo >= 10
- Stroke: white (5px) for combo >= 20, black (3px) otherwise  
- Drop shadow: color matching tier, blur 12 for big combos, 6 for small
- Letter spacing: 3 for combo >= 10, 1 otherwise
- Random initial rotation: ±0.2 radians

## Positioning
- Show at exact kill location (x, y)
- Clamp to screen bounds with padding = fontSize * 0.5
- Text anchor at center (0.5, 0.5)

## Particles
- 5 particles for 2x, up to 100 for 30x
- Star shapes for combo >= 10, circles otherwise
- Burst outward in circle pattern
- Gravity effect (fall down over time)

## Screen Effects
- Screen shake for combo >= 10
- Screen flash for big combos

## Duration
- Combo timer: 2000ms (2 seconds)
- Animation: 120 frames at 60fps = 2 seconds