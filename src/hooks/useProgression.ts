import { useState, useEffect } from 'react';
import { BELT_COLORS, ACHIEVEMENTS } from '../constants/gameConfig';

export interface UserProgress {
  totalXP: number;
  currentBelt: keyof typeof BELT_COLORS;
  completedPuzzles: number;
  perfectSolves: number;
  dailyStreak: number;
  lastPlayDate: string;
  achievements: string[];
  statistics: {
    totalMoves: number;
    totalTime: number;
    bestTime: number;
    averageMoves: number;
  };
}

const DEFAULT_PROGRESS: UserProgress = {
  totalXP: 0,
  currentBelt: 'white',
  completedPuzzles: 0,
  perfectSolves: 0,
  dailyStreak: 0,
  lastPlayDate: '',
  achievements: [],
  statistics: {
    totalMoves: 0,
    totalTime: 0,
    bestTime: Infinity,
    averageMoves: 0,
  },
};

export function useProgression() {
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('color-me-same-progress');
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setProgress({ ...DEFAULT_PROGRESS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved progress:', error);
      }
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('color-me-same-progress', JSON.stringify(progress));
  }, [progress]);

  const addXP = (amount: number) => {
    setProgress(prev => {
      const newXP = prev.totalXP + amount;
      const newBelt = getCurrentBelt(newXP);
      
      return {
        ...prev,
        totalXP: newXP,
        currentBelt: newBelt,
      };
    });
  };

  const completeLevel = (moves: number, time: number, perfect: boolean) => {
    setProgress(prev => {
      const newStats = {
        totalMoves: prev.statistics.totalMoves + moves,
        totalTime: prev.statistics.totalTime + time,
        bestTime: Math.min(prev.statistics.bestTime, time),
        averageMoves: Math.round((prev.statistics.totalMoves + moves) / (prev.completedPuzzles + 1)),
      };

      const today = new Date().toDateString();
      const isNewDay = prev.lastPlayDate !== today;
      const newStreak = isNewDay ? prev.dailyStreak + 1 : prev.dailyStreak;

      return {
        ...prev,
        completedPuzzles: prev.completedPuzzles + 1,
        perfectSolves: perfect ? prev.perfectSolves + 1 : prev.perfectSolves,
        dailyStreak: newStreak,
        lastPlayDate: today,
        statistics: newStats,
      };
    });

    // Award base XP for completing a level
    let xpGained = 50;
    if (perfect) xpGained += 25; // Bonus for perfect solve
    if (time < 30) xpGained += 15; // Speed bonus

    addXP(xpGained);
    checkAchievements(moves, time, perfect);
  };

  const checkAchievements = (_moves: number, time: number, perfect: boolean) => {
    const newAchievements: string[] = [];

    // Check each achievement
    ACHIEVEMENTS.forEach(achievement => {
      if (progress.achievements.includes(achievement.id)) return;

      let unlocked = false;
      switch (achievement.id) {
        case 'first_win':
          unlocked = progress.completedPuzzles === 0; // This will be their first
          break;
        case 'perfect_solve':
          unlocked = perfect;
          break;
        case 'speed_demon':
          unlocked = time < 30;
          break;
        case 'streak_5':
          unlocked = progress.dailyStreak >= 4; // Will be 5 after update
          break;
        case 'streak_30':
          unlocked = progress.dailyStreak >= 29; // Will be 30 after update
          break;
      }

      if (unlocked) {
        newAchievements.push(achievement.id);
        addXP(achievement.xp);
      }
    });

    if (newAchievements.length > 0) {
      setProgress(prev => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }));
    }

    return newAchievements;
  };

  const getCurrentBelt = (xp: number): keyof typeof BELT_COLORS => {
    const belts = Object.entries(BELT_COLORS).reverse(); // Highest first
    
    for (const [belt, data] of belts) {
      if (xp >= data.minXP) {
        return belt as keyof typeof BELT_COLORS;
      }
    }
    
    return 'white';
  };

  const getNextBelt = () => {
    // const currentBeltData = BELT_COLORS[progress.currentBelt];
    const belts = Object.entries(BELT_COLORS);
    const currentIndex = belts.findIndex(([belt]) => belt === progress.currentBelt);
    
    if (currentIndex < belts.length - 1) {
      const [, nextData] = belts[currentIndex + 1];
      return {
        name: nextData.name,
        color: nextData.color,
        xpNeeded: nextData.minXP - progress.totalXP,
        progress: Math.min(1, progress.totalXP / nextData.minXP),
      };
    }
    
    return null; // Already at highest belt
  };

  const resetProgress = () => {
    setProgress(DEFAULT_PROGRESS);
    localStorage.removeItem('color-me-same-progress');
  };

  return {
    progress,
    addXP,
    completeLevel,
    getCurrentBelt: () => progress.currentBelt,
    getNextBelt,
    resetProgress,
    checkAchievements,
  };
}