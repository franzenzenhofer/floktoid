# ROOT CAUSE ANALYSIS: Boss Wave Skipping at Multiples of 5

## Problem Statement
When the player completes wave 4 the game immediately reports wave 6. Wave 5, which should introduce the first boss encounter, is skipped or completes so quickly that no enemies or boss are visible.

## 7 Whys Analysis

1. **Why does the game not present wave 5 after completing wave 4?**  
   Because the wave-advance check fires again right after starting wave 5.
2. **Why is the current wave indicator set to 6 at that transition moment?**  
   The wave counter increments twice: once correctly when wave 4 ends and a second time immediately afterward.
3. **Why would any wave-advance logic trigger more than once between the end of wave 4 and the start of wave 6?**  
   The completion condition considers a wave finished when there are no birds without energy dots.
4. **Why would the boss-wave condition fail to produce visible boss entities?**  
   As soon as the boss steals a dot (or if all spawned birds begin with one), the completion condition is satisfied and the wave advances, removing the chance to see the boss.
5. **Why could rendering/visibility of wave 5 be skipped or suppressed?**  
   The second wave increment happens before rendering the newly spawned enemies, so the UI immediately shows wave 6.
6. **Why would leftover state cause the system to treat wave 5 as complete and jump to 6?**  
   Wave completion is based on `birdsToSpawn === 0 && no birds without dots`; once wave 5 begins, this condition remains true until a bird without a dot exists.
7. **Why are timers/events not enforcing a single, observable wave progression step?**  
   The game loop evaluates the completion condition every frame without guarding against re-entry after `startWave()` runs.

## Root Cause
The wave completion logic checks for **absence of birds without stolen energy dots** instead of **absence of birds altogether**:
```ts
if (this.birdsToSpawn === 0 && this.boids.filter(b => !b.hasDot).length === 0) {
  scoringSystem.addEvent(ScoringEvent.WAVE_COMPLETE);
  this.updateScoreDisplay();
  this.wave++;
  this.startWave();
}
```
When wave 5 starts, the boss and any birds quickly satisfy this condition (all have or immediately steal dots), causing the wave to advance to 6 before enemies become visible.

## Evidence
- Wave completion check that allows double advance `src/engine/NeonFlockEngine.ts` lines 1322-1327【F:src/engine/NeonFlockEngine.ts†L1322-L1327】
- Birds/bosses spawn with `hasDot` defaulting to `false`, so acquiring a dot flips the completion condition `src/engine/entities/Boid.ts` line 38【F:src/engine/entities/Boid.ts†L32-L39】
- Boss spawning logic at wave start `src/engine/NeonFlockEngine.ts` lines 432-470【F:src/engine/NeonFlockEngine.ts†L432-L470】

## Summary
Boss waves are skipped because the engine advances to the next wave whenever **all existing birds carry energy dots**, regardless of whether any birds remain alive. This allows wave 5 (and every multiple of 5) to auto-complete immediately after spawning.

## Proposed Direction (not implemented)
Refine the completion check to require that **no birds remain** rather than just checking their dot status.

