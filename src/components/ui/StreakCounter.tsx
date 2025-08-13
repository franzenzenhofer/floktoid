import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  bestStreak?: number;
  isActive: boolean;
  hintsUsed?: boolean;
}

const StreakCounter: React.FC<StreakCounterProps> = ({ 
  currentStreak, 
  bestStreak = 0,
  isActive,
  hintsUsed = false
}) => {
  const [prevStreak, setPrevStreak] = useState(currentStreak);
  
  useEffect(() => {
    if (currentStreak !== prevStreak) {
      setPrevStreak(currentStreak);
    }
  }, [currentStreak, prevStreak]);
  
  // Determine fire intensity based on streak
  const getFireIntensity = () => {
    if (!isActive || currentStreak === 0) return 'grayscale opacity-50';
    if (currentStreak >= 50) return 'text-orange-500 drop-shadow-glow-orange animate-pulse';
    if (currentStreak >= 25) return 'text-orange-400 drop-shadow-glow';
    if (currentStreak >= 10) return 'text-yellow-500';
    if (currentStreak >= 5) return 'text-yellow-400';
    return 'text-yellow-300';
  };
  
  // Get size based on streak milestones
  const getSize = () => {
    if (currentStreak >= 50) return 24;
    if (currentStreak >= 25) return 22;
    if (currentStreak >= 10) return 20;
    return 18;
  };
  
  const showAnimation = currentStreak > prevStreak && isActive;
  
  return (
    <div className="relative inline-flex items-center gap-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStreak}
          initial={showAnimation ? { scale: 0.5, rotate: -180 } : {}}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative"
        >
          <Flame 
            size={getSize()} 
            className={`${getFireIntensity()} transition-all duration-300`}
            fill={isActive && currentStreak > 0 ? "currentColor" : "none"}
          />
          
          {/* Special effect for milestone streaks */}
          {[5, 10, 25, 50].includes(currentStreak) && isActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.8, 0] }}
              transition={{ duration: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Flame size={getSize() * 1.5} className={getFireIntensity()} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
      
      <div className="flex flex-col">
        <motion.span 
          className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}
          animate={showAnimation ? { scale: [1, 1.2, 1] } : {}}
        >
          {currentStreak}
        </motion.span>
        
        {bestStreak > 0 && currentStreak < bestStreak && (
          <span className="text-xs text-gray-500">
            Best: {bestStreak}
          </span>
        )}
      </div>
      
      {/* Warning if hints might break streak */}
      {hintsUsed && isActive && currentStreak > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute -right-16 top-0 text-xs text-red-400 whitespace-nowrap"
        >
          ⚠️ Streak at risk!
        </motion.div>
      )}
    </div>
  );
};

export default StreakCounter;