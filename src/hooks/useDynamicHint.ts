import { useState, useEffect, useCallback } from 'react';
import { bfsSolve } from './useSolver';
import { isWinningState } from '../utils/grid';
import { log } from '../utils/logger';
import { isSolvable } from '../utils/solvability';
import { getLevelConfig } from '../utils/levelConfig';

interface HintResult {
  nextMove: { row: number; col: number } | null;
  isCalculating: boolean;
  isOnOptimalPath: boolean;
}

export const useDynamicHint = (
  grid: number[][],
  power: Set<string>,
  locked: Map<string, number>,
  level: number,
  enabled: boolean,
  optimalPath: { row: number; col: number }[],
  playerMoves: { row: number; col: number }[]
): HintResult => {
  const [nextMove, setNextMove] = useState<{ row: number; col: number } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isOnOptimalPath, setIsOnOptimalPath] = useState(true);

  const calculateHint = useCallback(async () => {
    if (!grid.length || !enabled || isWinningState(grid)) {
      setNextMove(null);
      return;
    }

    setIsCalculating(true);
    
    try {
      // Check if player is still on the optimal path
      const movesMatch = playerMoves.every((move, index) => {
        const optimalMove = optimalPath[index];
        return optimalMove && move.row === optimalMove.row && move.col === optimalMove.col;
      });
      
      if (movesMatch && playerMoves.length < optimalPath.length) {
        // Player is on track - return next move from optimal path
        const nextOptimalMove = optimalPath[playerMoves.length];
        setNextMove(nextOptimalMove);
        setIsOnOptimalPath(true);
        
        log('debug', 'Player on optimal path', {
          playerMoves: playerMoves.length,
          nextMove: nextOptimalMove,
          remainingMoves: optimalPath.length - playerMoves.length
        });
      } else {
        // Player has diverged - calculate new shortest path
        setIsOnOptimalPath(false);
        const { colors } = getLevelConfig(level);
        const { solution } = await bfsSolve(grid, power, locked, colors);
        
        if (solution.length > 0) {
          setNextMove(solution[0]);
          log('debug', 'Player diverged, new path calculated', {
            playerMoves: playerMoves.length,
            newPathLength: solution.length,
            nextMove: solution[0]
          });
        } else {
          // Double-check with mathematical solvability
          const mathematicallySolvable = isSolvable(grid, colors, power, locked);
          
          if (mathematicallySolvable) {
            log('warn', 'BFS failed but mathematically solvable - may need more search depth');
          } else {
            log('error', 'Grid is mathematically unsolvable!');
          }
          
          setNextMove(null);
        }
      }
    } catch (error) {
      log('error', 'Failed to calculate hint', { error });
      setNextMove(null);
    } finally {
      setIsCalculating(false);
    }
  }, [grid, power, locked, level, enabled, optimalPath, playerMoves]);

  // Recalculate whenever dependencies change
  useEffect(() => {
    if (enabled) {
      calculateHint();
    } else {
      setNextMove(null);
      setIsOnOptimalPath(true);
    }
  }, [calculateHint, enabled]);

  return { nextMove, isCalculating, isOnOptimalPath };
};