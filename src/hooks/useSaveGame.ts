import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { saveManager } from '../services/SaveManager';
import { log } from '../utils/logger';

/**
 * Hook that manages save game loading and provides save-related utilities
 * 
 * This hook:
 * - Loads saved game on mount
 * - Provides methods to manually save/load/clear
 * - Handles save errors gracefully
 */
export const useSaveGame = () => {
  const { state, dispatch } = useGame();
  
  const loadSavedGame = useCallback(async () => {
    try {
      const savedState = await saveManager.load();
      
      if (savedState) {
        log('info', '🎮 Loading saved game', {
          level: savedState.currentLevel,
          points: savedState.totalPoints
        });
        
        dispatch({ type: 'LOAD_SAVE', savedState });
        return true;
      }
      
      return false;
    } catch (error) {
      log('error', 'Failed to load saved game', { error });
      return false;
    }
  }, [dispatch]);
  
  // Load saved game on mount
  useEffect(() => {
    // Only load once on mount and if not already loaded
    if (!state.saveLoaded && !state.started) {
      loadSavedGame();
    }
  }, [state.saveLoaded, state.started, loadSavedGame]);
  
  const clearSave = useCallback(async () => {
    try {
      await saveManager.clear();
      // Reset to initial state
      window.location.reload(); // Simple way to reset everything
    } catch (error) {
      log('error', 'Failed to clear save', { error });
    }
  }, []);
  
  const hasSave = useCallback(() => {
    return saveManager.hasSave();
  }, []);
  
  return {
    loadSavedGame,
    clearSave,
    hasSave,
    saveLoaded: state.saveLoaded,
    currentLevel: state.level,
    totalPoints: state.totalPoints,
    completedLevels: state.completedLevels
  };
};