import { useState, useEffect } from 'react';
import { saveManager } from '../services/SaveManager';

/**
 * Hook to get saved game stats for the start screen
 * This loads stats directly from localStorage to show even before game state is loaded
 */
export const useStartScreenStats = () => {
  const [stats, setStats] = useState<{
    completedLevels: number;
    totalPoints: number;
    bestStreak: number;
    currentLevel: number;
  }>({
    completedLevels: 0,
    totalPoints: 0,
    bestStreak: 0,
    currentLevel: 1
  });
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const savedState = await saveManager.load();
        if (savedState) {
          setStats({
            completedLevels: savedState.completedLevels?.length || 0,
            totalPoints: savedState.totalPoints || 0,
            bestStreak: savedState.stats?.perfectLevels || 0, // Use perfect levels as streak
            currentLevel: savedState.currentLevel || 1
          });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    
    loadStats();
  }, []);
  
  return stats;
};