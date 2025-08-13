import React from 'react';
import { COLOR_PALETTE } from '../../constants/gameConfig';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getLevelConfig } from '../../utils/levelConfig';

const ColorCycleInfo: React.FC = () => {
  const { state } = useGame();
  const { level, started } = state;
  
  // Get the color count from level configuration
  // Only show when game has started
  if (!started) return null;
  
  const { colors: colorCount } = getLevelConfig(level);
  const colors = COLOR_PALETTE.slice(0, colorCount);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-black/20 backdrop-blur-sm rounded-lg max-w-md mx-auto"
    >
      <div className="flex items-center justify-center gap-1 mb-1">
        {colors.map((color, index) => (
          <React.Fragment key={color}>
            <div
              className="w-6 h-6 rounded shadow-sm border border-white/20"
              style={{ backgroundColor: color }}
              title={`Color ${index + 1}`}
            />
            {index < colors.length - 1 && (
              <ArrowRight size={12} className="text-white/50" />
            )}
          </React.Fragment>
        ))}
        {/* Show it cycles back */}
        <ArrowRight size={12} className="text-white/50" />
        <div
          className="w-6 h-6 rounded shadow-sm border border-white/20"
          style={{ backgroundColor: colors[0] }}
          title="Back to first color"
        />
      </div>
      <p className="text-xs text-white/70 text-center">
        Color Cycle ({colorCount} colors)
      </p>
    </motion.div>
  );
};

export default ColorCycleInfo;