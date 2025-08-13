import { useEffect } from 'react';
import { useGame } from '../context/GameContext';

/**
 * Component that detects when the game is won and dispatches the WIN action
 * This ensures points are calculated and saved
 */
const WinDetector: React.FC = () => {
  const { state, dispatch } = useGame();
  
  useEffect(() => {
    // When the game is won but victory modal not yet shown, dispatch WIN
    if (state.won && !state.showVictory) {
      // Small delay to ensure the winning animation plays
      setTimeout(() => {
        dispatch({ type: 'WIN' });
      }, 500);
    }
  }, [state.won, state.showVictory, dispatch]);
  
  return null;
};

export default WinDetector;