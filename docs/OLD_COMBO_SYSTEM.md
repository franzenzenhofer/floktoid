# OLD COMBO SYSTEM DOCUMENTATION

## History
The old combo system tracked simultaneous hits in a single frame. This was replaced with a lifetime-based system where combos track kills across an asteroid's entire lifetime.

## Key Changes Made

### 1. Lifetime Kill Tracking
**Old System:** Only counted kills if they happened in the same physics frame
**New System:** Each asteroid tracks `killCount` across its entire lifetime

### 2. Filter Logic Fixed
**Problem:** Wave updates weren't being passed to ComboEffects, so filter always thought it was wave 1
**Solution:** Connected WaveManager -> NeonFlockEngine -> ComboEffects.setWave()

### 3. Progressive Filtering
Starts at wave 4 (not wave 6):
- Waves 1-3: Show ALL combos (2x and up)
- Waves 4-5: Show 3x and up  
- Waves 6-8: Show 4x and up
- Waves 9-12: Show 5x and up
- Waves 13-18: Show 7x and up
- Waves 19-25: Show 10x and up
- Waves 26-35: Show 15x and up
- Waves 36-50: Show 20x and up
- Waves 50+: Show 30x and up only

### 4. Points Always Count
Combo points are added via `scoringSystem.addEvent()` BEFORE checking if the message should be displayed. This ensures players get points even when the combo message is suppressed by the filter.

### 5. Shredder Integration
Shredders count for combos! When an asteroid kills a shredder:
- `asteroid.killCount++` is incremented
- Shredder kills are tracked and displayed in combo messages
- Points are awarded via `ScoringEvent.SHREDDER_DESTROYED`

## Old ComboEffectsOld.ts Features Preserved

The old visual system has been preserved in the new implementation:

1. **Color Tiers** - Each combo level has specific colors (2x yellow, 3x cyan, etc.)
2. **Scale by Tier** - Higher combos get larger text (1.0 to 2.5 scale)
3. **Animation Style** - Punch-in, bounce-back, float-up-and-fade
4. **Positioning** - Shows at exact kill location, clamped to screen bounds
5. **Mobile Responsive** - Font sizes adapt to screen width
6. **Particles** - Star shapes for big combos, circles for small
7. **Screen Effects** - Shake and flash for epic combos

## Implementation Details

### Wave Connection Flow
```
WaveManager.startWave() 
  -> calls onWaveUpdate callback
  -> NeonFlockEngine.waveManager.onWaveUpdate
  -> ComboEffects.setWave(wave) 
  -> MessageDisplay.setWave(wave)
```

### Combo Display Flow
```
Asteroid hits enemy
  -> asteroid.killCount++
  -> Check lifetime kills
  -> ComboEffects.createComboDisplay(killCount, x, y)
  -> MessageDisplay.displayCombo(combo, x, y)
  -> Check getMinComboThreshold(wave)
  -> If meets threshold: displayOldStyleMessage()
  -> If not: console.log() suppression message
```

## Testing
See `/src/engine/__tests__/ComboFilterIntegration.test.ts` for comprehensive tests of the filter logic.
See `/src/engine/modules/__tests__/ComboFilter.test.ts` for unit tests of the MessageDisplay filter.

## Migration Notes
The old `ComboEffectsOld.ts` file is preserved for reference but is no longer used. All functionality has been refactored into:
- `ComboEffects.ts` - Particle effects and coordination
- `MessageDisplay.ts` - Text display and filtering logic