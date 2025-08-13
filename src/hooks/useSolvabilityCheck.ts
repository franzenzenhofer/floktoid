import { useEffect, useState, useCallback } from 'react';
import { isSolvable } from '../utils/solvability';
import { log } from '../utils/logger';

interface SolvabilityResult {
  isSolvable: boolean;
  isChecking: boolean;
  lastCheckTime: number;
}

/**
 * Hook to check if current game state is solvable
 * Runs after each move to ensure game remains winnable
 */
export const useSolvabilityCheck = (
  grid: number[][],
  colors: number,
  powerTiles: Set<string>,
  lockedTiles: Map<string, number>,
  enabled: boolean = true
): SolvabilityResult => {
  const [isSolvableState, setIsSolvableState] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  const checkSolvability = useCallback(async () => {
    if (!enabled || !grid.length) {
      return;
    }

    setIsChecking(true);
    const startTime = performance.now();

    try {
      // Run solvability check in next tick to avoid blocking UI
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const solvable = isSolvable(grid, colors, powerTiles, lockedTiles);
      setIsSolvableState(solvable);
      
      const checkTime = performance.now() - startTime;
      setLastCheckTime(checkTime);
      
      if (!solvable) {
        log('error', '⚠️ Game entered unsolvable state!', {
          gridSize: grid.length,
          colors,
          powerTiles: powerTiles.size,
          lockedTiles: lockedTiles.size,
          checkTimeMs: checkTime.toFixed(2)
        });
      } else {
        log('debug', 'Solvability check passed', {
          checkTimeMs: checkTime.toFixed(2)
        });
      }
    } catch (error) {
      log('error', 'Solvability check failed', { error });
      setIsSolvableState(true); // Assume solvable on error
    } finally {
      setIsChecking(false);
    }
  }, [grid, colors, powerTiles, lockedTiles, enabled]);

  // Check solvability when game state changes
  useEffect(() => {
    checkSolvability();
  }, [checkSolvability]);

  return {
    isSolvable: isSolvableState,
    isChecking,
    lastCheckTime
  };
};

/**
 * Hook to validate levels before playing
 * Useful for level editor or custom levels
 */
export const useValidateLevel = () => {
  const validate = useCallback(async (
    grid: number[][],
    colors: number,
    powerTiles: Set<string> = new Set(),
    lockedTiles: Map<string, number> = new Map()
  ): Promise<{ valid: boolean; reason?: string }> => {
    // Basic validation
    if (!grid || grid.length === 0) {
      return { valid: false, reason: 'Empty grid' };
    }

    const n = grid.length;
    if (grid.some(row => row.length !== n)) {
      return { valid: false, reason: 'Grid must be square' };
    }

    if (grid.some(row => row.some(cell => cell < 0 || cell >= colors))) {
      return { valid: false, reason: `Invalid color values (must be 0-${colors - 1})` };
    }

    // Check if already solved
    const firstColor = grid[0][0];
    if (grid.every(row => row.every(cell => cell === firstColor))) {
      return { valid: false, reason: 'Grid is already solved' };
    }

    // Check solvability
    const solvable = isSolvable(grid, colors, powerTiles, lockedTiles);
    if (!solvable) {
      return { valid: false, reason: 'Grid has no solution' };
    }

    return { valid: true };
  }, []);

  return { validate };
};