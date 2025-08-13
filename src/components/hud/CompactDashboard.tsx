import React, { useCallback } from 'react';
import { Timer, Target, Trophy, Zap } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useTimer } from '../../hooks/useTimer';
import { motion } from 'framer-motion';
import { formatPoints } from '../../utils/scoring';

const CompactDashboard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { 
    started, 
    time, 
    moves, 
    won, 
    level, 
    totalPoints,
    optimalPath,
    streak,
    hintsEnabled,
    paused,
    moveLimit,
    timeLimit,
    showTimer
  } = state;
  

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
  
  const optimalMoves = optimalPath.length || level;
  
  // Level color based on range
  const getLevelColor = () => {
    if (level <= 20) return 'text-green-400';
    if (level <= 50) return 'text-blue-400';
    if (level <= 100) return 'text-purple-400';
    return 'text-yellow-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-lg p-1.5 mb-2 text-sm"
    >
      {/* Single compact row with all essential info */}
      <div className="flex items-center justify-between gap-2 text-white">
        {/* Level */}
        <div className="flex items-center gap-1">
          <span className={`font-bold text-base ${getLevelColor()}`}>L{level}</span>
        </div>
        
        {/* Moves */}
        <div className="flex items-center gap-1">
          <Target size={14} className="opacity-70" />
          <span className={`font-medium ${moveLimit && moves > moveLimit * 0.8 ? 'text-yellow-400' : ''}`}>
            {moves}
            <span className="opacity-60 text-xs">/{moveLimit || optimalMoves}</span>
          </span>
        </div>
        
        {/* Time - only show if enabled */}
        {showTimer && (
          <div className="flex items-center gap-1">
            <Timer size={14} className="opacity-70" />
            <span className={`font-medium ${timeLimit && time > timeLimit * 0.8 ? 'text-yellow-400' : ''}`}>
              {formatTime(time)}
              {timeLimit && <span className="opacity-60 text-xs">/{formatTime(timeLimit)}</span>}
            </span>
          </div>
        )}
        
        {/* Points with animation */}
        <div className="flex items-center gap-1 relative">
          <Trophy size={14} className="opacity-70" />
          <span className="font-medium">
            {formatPoints(totalPoints)}
          </span>
          
          {/* Streak indicator */}
          {streak > 0 && !hintsEnabled && (
            <div className="flex items-center">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-xs text-yellow-400">{streak}</span>
            </div>
          )}
          
        </div>
      </div>
    </motion.div>
  );
};

export default CompactDashboard;