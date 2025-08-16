export interface ShredderSpawnConfig {
  clampEnabled?: boolean;
  maxSpawnProb?: number;
  maxConcurrent?: number;
}

/**
 * Calculate spawn probability for Shredder enemy based on number of asteroids on screen.
 * Implements piecewise rule:
 *   if A <= 10 -> 5%
 *   else -> 5% + (A / 1000)
 * Optional clamp to maxSpawnProb when clampEnabled.
 */
export function calculateShredderSpawnProbability(
  asteroidsOnScreen: number,
  config: ShredderSpawnConfig = {},
): number {
  const A = Math.max(0, asteroidsOnScreen);
  let probability = A <= 10 ? 0.05 : 0.05 + A / 1000;
  if (config.clampEnabled) {
    const max = config.maxSpawnProb ?? 0.25;
    probability = Math.min(probability, max);
  }
  return probability;
}

/**
 * Decide if a shredder should spawn this tick.
 * @param asteroidsOnScreen current asteroid count
 * @param currentShredders currently active shredders
 * @param random random value [0,1)
 * @param config configuration options
 */
export function shouldSpawnShredder(
  asteroidsOnScreen: number,
  currentShredders: number,
  random: number,
  config: ShredderSpawnConfig = {},
): boolean {
  const maxConcurrent = config.maxConcurrent ?? 2;
  if (currentShredders >= maxConcurrent) return false;
  const probability = calculateShredderSpawnProbability(
    asteroidsOnScreen,
    config,
  );
  return random < probability;
}

// Placeholder class for future implementation of full Shredder entity.
export class Shredder {
  // Actual rendering and behavior to be implemented separately.
}
