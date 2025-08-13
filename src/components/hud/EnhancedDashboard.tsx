import React, { useCallback, useEffect, useState } from 'react';
import { Timer, Target, Settings } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useTimer } from '../../hooks/useTimer';
import { motion } from 'framer-motion';
import LevelIndicator from '../ui/LevelIndicator';
import PointsDisplay from '../ui/PointsDisplay';
import ProgressBar from '../ui/ProgressBar';
import StreakCounter from '../ui/StreakCounter';
import { getLevelMilestoneDescription } from '../../utils/levelConfig';

const EnhancedDashboard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { 
    started, 
    time, 
    moves, 
    won, 
    level, 
    totalPoints, 
    levelPoints,
    optimalPath,
    streak,
    hintsEnabled,
    paused
  } = state;
  
  const [lastPointGain, setLastPointGain] = useState<number | undefined>();
  const [prevTotalPoints, setPrevTotalPoints] = useState(totalPoints);
  
  // Track point gains
  useEffect(() => {
    if (totalPoints > prevTotalPoints) {
      setLastPointGain(totalPoints - prevTotalPoints);
      setPrevTotalPoints(totalPoints);
    }
  }, [totalPoints, prevTotalPoints]);
  
  // Global timer
  useTimer(started && !won && !paused, useCallback(() => {
    dispatch({ type: 'TICK' });
  }, [dispatch]));

  if (!started) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Check if this is a milestone level
  const milestoneDesc = getLevelMilestoneDescription(level);
  const isSpecialLevel = !!milestoneDesc;
  
  // Optimal moves display
  const optimalMoves = optimalPath.length || level; // Fallback to level number
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 mb-4"
    >
      {/* Top Bar - Level and Settings */}
      <div className="glass-effect rounded-xl p-3">
        <div className="flex items-center justify-between">
          <LevelIndicator 
            currentLevel={level} 
            isSpecialLevel={isSpecialLevel}
            animation={isSpecialLevel ? 'pulse' : 'none'}
          />
          
          <h1 className="text-lg font-bold text-white/80 hidden sm:block">
            Color Me Same
          </h1>
          
          <button
            onClick={() => dispatch({ type: 'PAUSE', paused: !paused })}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} className="text-white/70" />
          </button>
        </div>
      </div>
      
      {/* Middle Section - Points and Progress */}
      <div className="glass-effect rounded-xl p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/70">Points:</span>
            <PointsDisplay 
              totalPoints={totalPoints}
              levelPoints={levelPoints}
              lastGain={lastPointGain}
              showAnimation={true}
            />
          </div>
          
          <StreakCounter 
            currentStreak={streak}
            bestStreak={0} // TODO: Track best streak
            isActive={!hintsEnabled}
            hintsUsed={hintsEnabled}
          />
        </div>
        
        <ProgressBar currentLevel={level} nextMilestone={0} percentage={0} />
      </div>
      
      {/* Bottom Bar - Game Stats */}
      <div className="glass-effect rounded-xl p-2">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 justify-center">
            <Target size={18} className="text-white/70" />
            <span className="text-white font-medium">
              Moves: {moves}
              <span className="text-white/50 text-sm">/{optimalMoves}</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 justify-center">
            <Timer size={18} className="text-white/70" />
            <span className="text-white font-medium">
              Time: {formatTime(time)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedDashboard;