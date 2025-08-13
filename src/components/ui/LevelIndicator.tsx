import React from 'react';
import { motion } from 'framer-motion';

interface LevelIndicatorProps {
  currentLevel: number;
  isSpecialLevel?: boolean;
  animation?: 'pulse' | 'glow' | 'none';
}

/**
 * Get color theme based on level range
 */
function getLevelColor(level: number): string {
  if (level <= 20) return 'text-green-500'; // Learning
  if (level <= 50) return 'text-blue-500';  // Growing
  if (level <= 100) return 'text-purple-500'; // Advancing
  return 'text-yellow-500'; // Expert
}

/**
 * Get background gradient for special levels
 */
function getSpecialGradient(level: number): string {
  if (level <= 20) return 'from-green-400 to-emerald-600';
  if (level <= 50) return 'from-blue-400 to-indigo-600';
  if (level <= 100) return 'from-purple-400 to-pink-600';
  return 'from-yellow-400 to-orange-600';
}

const LevelIndicator: React.FC<LevelIndicatorProps> = ({ 
  currentLevel, 
  isSpecialLevel = false,
  animation = 'none' 
}) => {
  const colorClass = getLevelColor(currentLevel);
  const gradientClass = getSpecialGradient(currentLevel);
  
  const animationVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2 }
    },
    glow: {
      filter: ['brightness(100%)', 'brightness(120%)', 'brightness(100%)'],
      transition: { repeat: Infinity, duration: 3 }
    },
    none: {}
  };
  
  return (
    <motion.div
      className="relative"
      animate={animation !== 'none' ? animationVariants[animation] : {}}
    >
      {isSpecialLevel ? (
        <div className={`bg-gradient-to-r ${gradientClass} text-transparent bg-clip-text`}>
          <span className="text-sm font-medium uppercase tracking-wider">Level</span>
          <div className="text-3xl font-bold">{currentLevel}</div>
        </div>
      ) : (
        <div className={colorClass}>
          <span className="text-sm font-medium uppercase tracking-wider opacity-70">Level</span>
          <div className="text-3xl font-bold">{currentLevel}</div>
        </div>
      )}
    </motion.div>
  );
};

export default LevelIndicator;