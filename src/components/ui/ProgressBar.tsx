import React from 'react';
import { motion } from 'framer-motion';
import { getLevelMilestoneDescription } from '../../utils/levelConfig';

interface ProgressBarProps {
  currentLevel: number;
  nextMilestone: number;
  milestoneType?: 'grid' | 'color' | 'feature';
  percentage: number;
}

/**
 * Get the next major milestone level
 */
function getNextMilestone(currentLevel: number): number {
  if (currentLevel < 21) return 21;       // 4x4 grid
  if (currentLevel < 31) return 31;       // Power tiles
  if (currentLevel < 41) return 41;       // 4 colors
  if (currentLevel < 51) return 51;       // 5x5 grid
  if (currentLevel < 71) return 71;       // Locked tiles
  if (currentLevel < 101) return 101;     // 6x6 grid
  if (currentLevel < 151) return 151;     // 7x7 grid
  return Math.ceil(currentLevel / 50) * 50; // Every 50 levels
}

/**
 * Calculate progress percentage to next milestone
 */
function calculateProgress(current: number, next: number): number {
  const prevMilestone = next <= 21 ? 1 : 
                       next <= 31 ? 21 :
                       next <= 41 ? 31 :
                       next <= 51 ? 41 :
                       next <= 71 ? 51 :
                       next <= 101 ? 71 :
                       next <= 151 ? 101 :
                       next - 50;
  
  const total = next - prevMilestone;
  const progress = current - prevMilestone;
  return Math.min(100, Math.max(0, (progress / total) * 100));
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  currentLevel,
  nextMilestone: providedMilestone,
  milestoneType,
  percentage: providedPercentage
}) => {
  const nextMilestone = providedMilestone || getNextMilestone(currentLevel);
  const percentage = providedPercentage ?? calculateProgress(currentLevel, nextMilestone);
  const milestoneDescription = getLevelMilestoneDescription(nextMilestone);
  
  // Get gradient based on milestone type
  const getGradient = () => {
    if (milestoneType === 'grid') return 'from-blue-400 to-blue-600';
    if (milestoneType === 'color') return 'from-purple-400 to-purple-600';
    if (milestoneType === 'feature') return 'from-green-400 to-green-600';
    
    // Auto-detect type based on milestone
    if ([21, 51, 101, 151].includes(nextMilestone)) return 'from-blue-400 to-blue-600';
    if ([41, 46].includes(nextMilestone)) return 'from-purple-400 to-purple-600';
    return 'from-green-400 to-green-600';
  };
  
  return (
    <div className="w-full">
      <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getGradient()} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        
        {/* Progress text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-white/90 drop-shadow-md">
            {Math.floor(percentage)}% to Level {nextMilestone}
          </span>
        </div>
        
        {/* Milestone markers */}
        <div className="absolute top-0 right-2 h-full flex items-center">
          <div className="w-0.5 h-3 bg-white/30" />
        </div>
      </div>
      
      {/* Milestone description */}
      {milestoneDescription && (
        <motion.p 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-400 mt-1 text-center"
        >
          Next: {milestoneDescription.split(' - ')[0]}
        </motion.p>
      )}
    </div>
  );
};

export default ProgressBar;