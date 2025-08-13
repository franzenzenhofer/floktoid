import { useCallback, useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import { MilestoneManager, Milestone, PlayerStats } from '../services/MilestoneManager';
import { useToast } from '../context/ToastContext';
import { log } from '../utils/logger';

/**
 * Hook to integrate milestone system with the game
 * 
 * This hook:
 * - Tracks player statistics
 * - Checks for newly unlocked milestones
 * - Shows milestone celebration toasts
 * - Provides milestone progress data
 */
export const useMilestones = () => {
  const { state } = useGame();
  const { showToast } = useToast();
  const [milestoneManager] = useState(() => MilestoneManager.getInstance());
  const [nextMilestone, setNextMilestone] = useState<Milestone | null>(null);
  
  // Calculate player statistics from game state
  const getPlayerStats = useCallback((): PlayerStats => {
    const { 
      level, 
      completedLevels, 
      totalPoints, 
      streak,
      moves,
      optimalPath,
      time,
      showHints
    } = state;
    
    // Calculate perfect games (optimal moves, no hints)
    const perfectGames = completedLevels.filter((_lvl, _idx) => {
      // This is simplified - in real implementation we'd track this per level
      return !showHints && moves === optimalPath.length;
    }).length;
    
    // Calculate best streak from completed levels
    let bestStreak = 0;
    let currentStreakCount = 0;
    const sorted = [...completedLevels].sort((a, b) => a - b);
    
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] === sorted[i - 1] + 1) {
        currentStreakCount++;
        bestStreak = Math.max(bestStreak, currentStreakCount);
      } else {
        currentStreakCount = 1;
      }
    }
    
    return {
      currentLevel: level,
      completedLevels,
      totalPoints,
      currentStreak: streak,
      bestStreak,
      perfectGames,
      fastestTime: time, // This would need to track fastest completion
      totalGamesPlayed: completedLevels.length,
      hintsUsed: showHints ? 1 : 0, // Simplified
      averageEfficiency: moves > 0 ? optimalPath.length / moves : 0
    };
  }, [state]);
  
  // Check for milestones when game state changes
  useEffect(() => {
    if (!state.started || !state.won) return;
    
    const stats = getPlayerStats();
    const newlyUnlocked = milestoneManager.checkMilestones(stats);
    
    // Show celebration for each unlocked milestone (except speed demon)
    newlyUnlocked
      .filter(milestone => milestone.id !== 'speed_30s') // Skip speed demon toast
      .forEach((milestone, index) => {
        setTimeout(() => {
          const celebration = milestoneManager.getCelebrationData(milestone);
          
          // Show minimal celebration toast
          showToast(
            `${celebration.icon} ${celebration.title}`,
            'success',
            2000
          );
          
          log('info', 'Milestone celebration shown', {
            milestone: milestone.id,
            type: milestone.celebrationType
          });
        }, index * 2000); // Stagger multiple celebrations
      });
    
    // Update next milestone
    const next = milestoneManager.getNextMilestone(stats);
    setNextMilestone(next);
  }, [state.won, state.started, state.level, state.completedLevels.length, 
      getPlayerStats, milestoneManager, showToast]);
  
  // Get current belt
  const getCurrentBelt = useCallback(() => {
    const stats = getPlayerStats();
    return milestoneManager.getCurrentBelt(stats);
  }, [getPlayerStats, milestoneManager]);
  
  // Get milestone progress
  const getMilestoneProgress = useCallback((milestoneId: string) => {
    const stats = getPlayerStats();
    return milestoneManager.getMilestoneProgress(milestoneId, stats);
  }, [getPlayerStats, milestoneManager]);
  
  // Get all unlocked milestones
  const getUnlockedMilestones = useCallback(() => {
    return milestoneManager.getUnlockedMilestones();
  }, [milestoneManager]);
  
  // Save milestone state (for integration with SaveManager)
  const saveMilestoneState = useCallback(() => {
    return milestoneManager.serialize();
  }, [milestoneManager]);
  
  // Load milestone state
  const loadMilestoneState = useCallback((data: { unlockedMilestones: string[] }) => {
    milestoneManager.deserialize(data);
    
    // Update next milestone after loading
    const stats = getPlayerStats();
    const next = milestoneManager.getNextMilestone(stats);
    setNextMilestone(next);
  }, [milestoneManager, getPlayerStats]);
  
  return {
    nextMilestone,
    getCurrentBelt,
    getMilestoneProgress,
    getUnlockedMilestones,
    saveMilestoneState,
    loadMilestoneState
  };
};