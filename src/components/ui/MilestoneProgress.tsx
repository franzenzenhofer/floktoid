/**
 * @fileoverview Milestone Progress Display Component
 * 
 * This component shows the player's current progression towards milestones,
 * including their current belt, next milestone to achieve, and progress bar.
 * It provides motivation and clear goals for the player to work towards.
 * 
 * @module MilestoneProgress
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Star } from 'lucide-react';
import { useMilestones } from '../../hooks/useMilestones';
import { Belt } from '../../services/MilestoneManager';

/**
 * Belt color mapping for visual display
 */
const BELT_COLORS: Record<Belt, string> = {
  [Belt.WHITE]: 'bg-gray-100 text-gray-800',
  [Belt.YELLOW]: 'bg-yellow-400 text-yellow-900',
  [Belt.ORANGE]: 'bg-orange-400 text-orange-900',
  [Belt.GREEN]: 'bg-green-400 text-green-900',
  [Belt.BLUE]: 'bg-blue-400 text-blue-900',
  [Belt.PURPLE]: 'bg-purple-400 text-purple-900',
  [Belt.BROWN]: 'bg-amber-600 text-amber-100',
  [Belt.BLACK]: 'bg-gray-900 text-white',
  [Belt.RED]: 'bg-red-600 text-white'
};

/**
 * Belt emoji mapping
 */
const BELT_EMOJIS: Record<Belt, string> = {
  [Belt.WHITE]: '🤍',
  [Belt.YELLOW]: '💛',
  [Belt.ORANGE]: '🧡',
  [Belt.GREEN]: '💚',
  [Belt.BLUE]: '💙',
  [Belt.PURPLE]: '💜',
  [Belt.BROWN]: '🤎',
  [Belt.BLACK]: '🖤',
  [Belt.RED]: '❤️'
};

interface MilestoneProgressProps {
  className?: string;
}

/**
 * Milestone Progress Component
 * 
 * Displays current belt, next milestone, and progress towards it.
 * Provides visual feedback on player progression.
 */
export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({ 
  className = '' 
}) => {
  const { 
    nextMilestone, 
    getCurrentBelt, 
    getMilestoneProgress,
    getUnlockedMilestones 
  } = useMilestones();
  
  const currentBelt = getCurrentBelt();
  const unlockedCount = getUnlockedMilestones().length;
  
  if (!nextMilestone && unlockedCount === 0) {
    return null; // Don't show anything for brand new players
  }
  
  const progress = nextMilestone ? getMilestoneProgress(nextMilestone.id) : 1;
  const progressPercent = Math.round(progress * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 ${className}`}
    >
      {/* Current Belt */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-400" />
          <span className="text-white/80 text-sm font-medium">Current Belt</span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${BELT_COLORS[currentBelt]}`}>
          <span>{BELT_EMOJIS[currentBelt]}</span>
          <span className="capitalize">{currentBelt}</span>
        </div>
      </div>
      
      {/* Next Milestone */}
      {nextMilestone && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-blue-400" />
            <span className="text-white/80 text-sm font-medium">Next Goal</span>
          </div>
          
          <div className="text-white">
            <div className="text-sm font-semibold">{nextMilestone.name}</div>
            <div className="text-xs text-white/70 mt-0.5">
              {nextMilestone.description}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
              />
            </div>
          </div>
          
          {/* Reward Preview */}
          {nextMilestone.reward && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-white/5 rounded-lg">
              <Star size={14} className="text-yellow-400" />
              <div className="text-xs text-white/70">
                Reward: {nextMilestone.reward.belt && `${nextMilestone.reward.belt} belt`}
                {nextMilestone.reward.points && ` • +${nextMilestone.reward.points} pts`}
                {nextMilestone.reward.badge && ` • ${nextMilestone.reward.badge}`}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Achievement Count */}
      {unlockedCount > 0 && (
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="text-center">
            <div className="text-white text-sm font-semibold">
              {unlockedCount} Achievement{unlockedCount !== 1 ? 's' : ''} Unlocked
            </div>
            <div className="text-white/60 text-xs">
              Keep playing to unlock more!
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MilestoneProgress;