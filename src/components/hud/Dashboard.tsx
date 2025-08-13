import React, { useCallback } from 'react';
import { Timer, Target, Trophy, Hash } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useTimer } from '../../hooks/useTimer';
import { motion } from 'framer-motion';
import { formatPoints } from '../../utils/scoring';

const Dashboard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { started, time, moves, won, level, totalPoints } = state;

  // Global timer
  const timeLimit = 0; // No time limits in new progression system
  useTimer(started && !won && !!timeLimit, useCallback(() => {
    dispatch({ type: 'TICK' });
  }, [dispatch]));

  if (!started) return null;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remaining = timeLimit ? Math.max(0, timeLimit - time) : undefined;
  const isTimeCritical = !!timeLimit && remaining! < 30;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-1.5 mb-1"
    >
      <div className="grid grid-cols-4 gap-1 text-white">
        <Stat
          icon={<Target size={18} />}
          value={moves}
          subValue={level} // Shows required moves for the level
        />
        <Stat
          icon={<Timer size={18} />}
          value={timeLimit ? formatTime(remaining!) : formatTime(time)}
          danger={isTimeCritical}
        />
        <Stat
          icon={<Trophy size={18} />}
          value={formatPoints(totalPoints)}
          label="Points"
        />
        <Stat
          icon={<Hash size={18} />}
          value={`Level ${level}`}
        />
      </div>
    </motion.div>
  );
};

interface StatProps {
  icon: React.ReactNode;
  label?: string;
  value: number | string;
  subValue?: number | string;
  danger?: boolean;
}

const Stat: React.FC<StatProps> = ({ icon, label, value, subValue, danger }) => (
  <div className="flex flex-col items-center text-center py-0.5">
    <div className={`${danger ? 'text-red-400 animate-pulse' : ''}`}>
      {icon}
    </div>
    <span className={`text-base font-bold leading-tight ${danger ? 'text-red-400' : ''}`}>
      {value}
      {subValue && (
        <span className="text-xs opacity-60 ml-0.5">/{subValue}</span>
      )}
    </span>
    {label && <span className="text-xs opacity-60 leading-tight">{label}</span>}
  </div>
);

export default Dashboard;