import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { getLevelConfig } from '../utils/levelConfig';

/**
 * Hook to show milestone toasts when color counts change
 */
export const useMilestoneToasts = () => {
  const { state } = useGame();
  const { showToast } = useToast();
  const { level, started, playerMoves } = state;
  
  // Track previous color count to detect changes
  const prevColorsRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!started || playerMoves.length > 0) return;
    
    const config = getLevelConfig(level);
    const prevColors = prevColorsRef.current;
    
    // Check if colors changed from previous level
    if (prevColors !== null && prevColors !== config.colors) {
      // Show toast for color change
      let message = '';
      if (config.colors === 2 && prevColors > 2) {
        message = '🎯 Back to basics: 2 colors';
      } else if (config.colors === 3 && prevColors === 2) {
        message = '🎨 3 colors unlocked!';
      } else if (config.colors === 4 && prevColors === 3) {
        message = '🌈 4 colors unlocked!';
      } else if (config.colors === 5 && prevColors === 4) {
        message = '✨ 5 colors unlocked!';
      }
      
      if (message) {
        setTimeout(() => {
          showToast(message, 'success', 3000);
        }, 500);
      }
    }
    
    // Update ref for next comparison
    prevColorsRef.current = config.colors;
  }, [level, started, playerMoves.length, showToast]);
};