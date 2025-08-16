# Boss Bird Mechanics

## Overview
Boss Birds are special enemy units that appear periodically in FLOKTOID to provide challenging gameplay moments. They are larger, tougher, and more dangerous than regular birds.

## Boss Bird Characteristics

### Visual Design
- **Size**: 2x larger than regular birds (doubles `BOID_SIZE`)
- **Shape**: Menacing triangular form with enhanced proportions
- **Color**: Deep red/purple (#FF0066) with magenta stroke
- **Eyes**: Glowing yellow eyes for intimidation
- **Shield**: Hexagonal energy shield that pulses and changes color based on health

### Combat Stats
- **Health**: 3 hit points (regular birds die in 1 hit)
- **Speed**: 70% of regular bird speed (slower but more deliberate)
- **Force**: 150% of regular bird force (stronger steering capabilities)
- **Damage**: Requires 3 asteroid hits to destroy

### Shield System
The boss bird features a dynamic shield visualization:
- **Full Health (3 HP)**: Cyan shield (#00FFFF)
- **Damaged (2 HP)**: Yellow shield (#FFFF00)  
- **Critical (1 HP)**: Red shield (#FF0000)
- **Effect**: Pulsing animation with transparency based on health

### Behavior
- Follows the same flocking algorithm as regular birds
- Can steal energy dots like regular birds
- More resilient to player attacks
- Flash effect when damaged (50% transparency for 100ms)

## Spawn Logic

### Configuration
```typescript
BOSS_WAVE_INTERVAL: 5  // Boss spawns every 5 waves
```

### Current Behavior
Boss birds spawn as an extra enemy on waves 5, 10, 15, and so on, alongside regular birds.

## Code Structure

### Files
- `/src/engine/entities/BossBird.ts` - Complete boss bird implementation
- `/src/engine/CentralConfig.ts` - Configuration for boss wave interval
- `/src/engine/ScoringSystem.ts` - Scoring events for boss interactions

### Key Methods
```typescript
class BossBird extends Boid {
  takeDamage(): boolean  // Returns true if destroyed
  updateShield(): void    // Updates shield visual
  destroy(): void         // Cleanup on death
}
```

## Scoring Integration

### Active Events
- `BOSS_HIT` – When the boss takes damage
- `BOSS_DEFEATED` – When the boss is eliminated

Points for these events are awarded through the `ScoringSystem`.

## Future Enhancements

### Possible Additions
1. **Boss Abilities**
   - Speed burst when health drops
   - Spawn minion birds
   - Temporary invulnerability
   
2. **Boss Variants**
   - Different boss types every 10 waves
   - Unique attack patterns
   - Special energy dot stealing abilities

3. **Boss Rewards**
   - Bonus points for quick elimination
   - Power-ups on defeat
   - Temporary player buffs

## Technical Notes

### Memory Management
- Proper cleanup of shield graphics
- Timeout clearing to prevent memory leaks
- Resource destruction on boss death

### Performance
- Boss birds add minimal overhead
- Shield animation is GPU-accelerated
- No significant impact on frame rate

## Balance Considerations

- Boss health (3) provides challenge without frustration
- Slower speed allows strategic planning
- Shield visualization gives clear health feedback
- Wave 5 interval prevents overwhelming difficulty curve
