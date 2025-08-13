import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useToast } from '../context/ToastContext';
import { ConstraintManager } from '../services/ConstraintManager';

/**
 * Hook to show tutorial toasts when new constraints are introduced
 */
export const useConstraintTutorials = () => {
  const { state } = useGame();
  const { showToast } = useToast();
  const { level, started } = state;
  
  const showConstraintTutorial = useCallback((message: string) => {
    showToast(message, 'tutorial', 2000);
  }, [showToast]);
  
  useEffect(() => {
    if (!started) return;
    
    const constraintManager = ConstraintManager.getInstance();
    
    // Check if this level introduces new constraints
    if (constraintManager.hasNewConstraint(level)) {
      const constraints = constraintManager.getConstraintsForLevel(level, state.optimalPath.length);
      
      if (constraints.tutorialMessage) {
        // Show tutorial after a short delay
        setTimeout(() => {
          showConstraintTutorial(constraints.tutorialMessage!);
        }, 1500);
      }
    }
  }, [level, started, state.optimalPath.length, showConstraintTutorial]);
  
  return { showConstraintTutorial };
};