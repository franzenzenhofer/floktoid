import { useCallback, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { SolvabilityGuarantee } from '../services/SolvabilityGuarantee';
import { useToast } from '../context/ToastContext';
import { log } from '../utils/logger';
import { GenerationResult } from './useGenerator';

/**
 * Hook to integrate solvability guarantee system with the game
 * 
 * This hook:
 * - Verifies puzzles are solvable when generated
 * - Monitors runtime solvability after each move
 * - Provides recovery options for unsolvable states
 * - Reports performance metrics
 */
export const useSolvabilityGuarantee = () => {
  const { state } = useGame();
  const { showToast } = useToast();
  const solvabilityGuarantee = SolvabilityGuarantee.getInstance();
  
  // Verify puzzle solvability on generation
  const verifyPuzzle = useCallback(async (generationResult: GenerationResult) => {
    const checkResult = await solvabilityGuarantee.verifyGeneration(generationResult);
    
    if (!checkResult.isSolvable) {
      log('error', 'Generated unsolvable puzzle!', {
        level: state.level,
        method: checkResult.method,
        confidence: checkResult.confidence
      });
      
      // This should never happen with reverse-move generation
      showToast('⚠️ Regenerating', 'error', 2000);
      
      // Trigger regeneration
      return false;
    }
    
    log('debug', 'Puzzle verified as solvable', {
      level: state.level,
      method: checkResult.method,
      checkTimeMs: checkResult.checkTime.toFixed(2)
    });
    
    return true;
  }, [state.level, showToast, solvabilityGuarantee]);
  
  // Check runtime solvability after moves
  useEffect(() => {
    if (!state.started || state.won || state.grid.length === 0) return;
    
    // Skip check for first few moves or tutorial levels
    if (state.moves < 3 || state.level <= 3) return;
    
    // Debounce checks to avoid performance impact
    const checkTimeout = setTimeout(async () => {
      const colors = Math.max(...state.grid.flat()) + 1;
      const checkResult = await solvabilityGuarantee.checkRuntimeSolvability(
        state.grid,
        colors,
        state.power,
        state.locked
      );
      
      if (!checkResult.isSolvable) {
        log('warn', 'Game entered potentially unsolvable state', {
          level: state.level,
          moves: state.moves,
          confidence: checkResult.confidence
        });
        
        // Only show warning if high confidence
        if (checkResult.confidence > 0.8) {
          showToast(
            '⚠️ Try undo',
            'error',
            2000
          );
        }
      }
    }, 500); // Wait 500ms after move
    
    return () => clearTimeout(checkTimeout);
  }, [state.grid, state.started, state.won, state.moves, state.level, 
      state.power, state.locked, showToast, solvabilityGuarantee]);
  
  // Get recovery strategies
  const getRecoveryOptions = useCallback(() => {
    if (!state.initialGrid.length) return [];
    
    return solvabilityGuarantee.getRecoveryStrategies(
      state.grid,
      state.initialGrid,
      state.playerMoves
    );
  }, [state.grid, state.initialGrid, state.playerMoves, solvabilityGuarantee]);
  
  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return solvabilityGuarantee.getPerformanceReport();
  }, [solvabilityGuarantee]);
  
  // Reset on new game
  useEffect(() => {
    if (state.started && state.moves === 0) {
      solvabilityGuarantee.reset();
    }
  }, [state.started, state.moves, solvabilityGuarantee]);
  
  return {
    verifyPuzzle,
    getRecoveryOptions,
    getPerformanceReport
  };
};