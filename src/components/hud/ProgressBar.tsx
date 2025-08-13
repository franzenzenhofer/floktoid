import React from 'react';
import { useProgression } from '../../hooks/useProgression';
import { BELT_COLORS } from '../../constants/gameConfig';
import { Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const ProgressBar: React.FC = () => {
  const { progress, getNextBelt } = useProgression();
  const currentBeltData = BELT_COLORS[progress.currentBelt];
  const nextBelt = getNextBelt();

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 mb-1 mt-1">
      {/* Compact Belt Display */}
      <div className="flex items-center gap-2">
        <motion.div
          className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: currentBeltData.color }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Trophy size={12} className="text-white drop-shadow-lg" />
        </motion.div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/90 font-medium">
            {currentBeltData.name} Belt
          </span>
          <span className="text-white/60">
            {progress.totalXP} XP
          </span>
        </div>
      </div>

      {/* Compact progress bar */}
      {nextBelt && (
        <div className="mt-1">
          <div className="relative bg-white/10 rounded-full h-1 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{ backgroundColor: nextBelt.color }}
              initial={{ width: 0 }}
              animate={{ width: `${nextBelt.progress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;