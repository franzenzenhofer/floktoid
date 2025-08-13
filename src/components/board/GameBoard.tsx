/**
 * @fileoverview Main Game Board Component
 * 
 * The GameBoard is the central interactive element of Color Me Same. It renders
 * a responsive grid of colored tiles that players click to solve puzzles.
 * 
 * Key features:
 * - Responsive sizing: Adapts to any screen size (3x3 to 20x20 grids)
 * - Dynamic hints: Shows optimal next move when enabled
 * - Solvability verification: Real-time checking (for debugging)
 * - Smooth animations: Framer Motion for delightful interactions
 * - Victory detection: Auto-shows victory modal on completion
 * 
 * The component uses custom hooks for complex logic separation and
 * maintains performance even with large grids through React optimizations.
 * 
 * @module GameBoard
 */

import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import Tile from './Tile';
import { useDynamicHint } from '../../hooks/useDynamicHint';
import { useSolvabilityCheck } from '../../hooks/useSolvabilityCheck';
import { motion } from 'framer-motion';
import { getLevelConfig } from '../../utils/levelConfig';
import { useToast } from '../../context/ToastContext';
import { useTutorialToasts } from '../../hooks/useTutorialToasts';
import { useMilestoneToasts } from '../../hooks/useMilestoneToasts';
import { useConstraintTutorials } from '../../hooks/useConstraintTutorials';
import { useSolvabilityGuarantee } from '../../hooks/useSolvabilityGuarantee';
import { useMilestones } from '../../hooks/useMilestones';

/**
 * GameBoard Component - Renders the interactive puzzle grid
 * 
 * This component is responsible for:
 * 1. Rendering the grid of tiles based on game state
 * 2. Calculating responsive tile sizes for any screen
 * 3. Showing hints when enabled
 * 4. Detecting victory condition
 * 5. Managing tile interactions
 * 
 * @component
 * @returns {JSX.Element} The game board grid
 */
const GameBoard: React.FC = () => {
  const { state, dispatch } = useGame();
  const { grid, power, locked, started, won, paused, level, showHints, optimalPath, playerMoves } = state;
  const { showToast, hideToast } = useToast();
  
  // Track if hint toast has been shown this session
  const [hintToastShown, setHintToastShown] = useState(false);
  
  // Track last clicked position for animation delays
  const [lastClickedPos, setLastClickedPos] = useState<{row: number, col: number} | null>(null);
  
  // Dynamic hint calculation with optimal path tracking
  const { nextMove: hintMove, isOnOptimalPath } = useDynamicHint(
    grid,
    power,
    locked,
    level,
    showHints && !won && !paused,
    optimalPath,
    playerMoves
  );
  
  // Check solvability after each move
  const { colors } = getLevelConfig(level);
  const { isSolvable, isChecking } = useSolvabilityCheck(
    grid,
    colors,
    power,
    locked,
    started && !won // Only check during active gameplay
  );
  
  // Tutorial toast messages
  useTutorialToasts();
  
  // Milestone toast messages (color changes)
  useMilestoneToasts();
  
  // Constraint tutorial messages
  useConstraintTutorials();
  
  // Solvability guarantee system
  const { getRecoveryOptions } = useSolvabilityGuarantee();
  
  // Milestone tracking
  useMilestones();
  
  // Show victory modal after delay when puzzle is solved
  useEffect(() => {
    if (won && !state.showVictory) {
      // Add time for flip animations to complete (400ms animation + up to 100ms delay)
      const flipAnimationTime = 500;
      
      // Gradual decrease in delay for first 3 levels, then consistent
      let baseDelay: number;
      switch (level) {
        case 1: baseDelay = 2000; break;
        case 2: baseDelay = 1700; break;
        case 3: baseDelay = 1500; break;
        default: baseDelay = 1200; // Level 4 and beyond
      }
      
      const timer = setTimeout(() => {
        dispatch({ type: 'SHOW_MODAL', modal: 'victory' });
      }, baseDelay + flipAnimationTime);
      
      return () => clearTimeout(timer);
    }
  }, [won, state.showVictory, dispatch, level]);
  
  // Show hint toast on first hint activation after tutorials
  useEffect(() => {
    if (showHints && !hintToastShown && hintMove && !won && level > 3) {
      const message = isOnOptimalPath ? "Optimal" : "Hint";
      showToast(message, 'hint', 2000);
      setHintToastShown(true);
    }
  }, [showHints, hintToastShown, hintMove, isOnOptimalPath, showToast, won, level]);
  
  // Reset hint toast state when starting a new game
  useEffect(() => {
    if (started && playerMoves.length === 0) {
      setHintToastShown(false);
    }
  }, [started, playerMoves.length]);
  
  // Hide any active toasts when victory celebration starts
  useEffect(() => {
    if (won && !state.showVictory) {
      hideToast();
    }
  }, [won, state.showVictory, hideToast]);


  if (!started || !grid.length) return null;

  const handleTileClick = (row: number, col: number) => {
    if (paused || won) return;
    
    setLastClickedPos({ row, col });
    dispatch({ type: 'CLICK', row, col });
    
    // Decrement locked tiles
    dispatch({ type: 'LOCK_DECR' });
    
    // Clear the clicked position after animations complete
    setTimeout(() => {
      setLastClickedPos(null);
    }, 1000);
  };
  
  // Calculate animation delay based on distance from clicked tile
  const getAnimationDelay = (tileRow: number, tileCol: number): number => {
    if (!lastClickedPos) return 0;
    
    const { row: clickedRow, col: clickedCol } = lastClickedPos;
    
    // Check if this tile is affected by the click
    const isPowerClick = power.has(`${clickedRow}-${clickedCol}`);
    const isAffected = isPowerClick ? 
      (Math.abs(tileRow - clickedRow) <= 1 && Math.abs(tileCol - clickedCol) <= 1) :
      (tileRow === clickedRow && tileCol === clickedCol) ||
      (tileRow === clickedRow && Math.abs(tileCol - clickedCol) === 1) ||
      (tileCol === clickedCol && Math.abs(tileRow - clickedRow) === 1);
    
    if (!isAffected) return 0;
    
    // Center tile (clicked tile) has no delay
    if (tileRow === clickedRow && tileCol === clickedCol) return 0;
    
    // Adjacent tiles have staggered delays
    const distance = Math.abs(tileRow - clickedRow) + Math.abs(tileCol - clickedCol);
    return distance * 50; // 50ms per distance unit
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full flex flex-col items-center py-2"
    >
      <div
        className="grid bg-black/20 backdrop-blur-sm rounded-xl p-3 relative"
        style={{ 
          gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))`,
          gap: '4px',
          width: 'min(90vw, 500px)',
          maxWidth: '500px'
        }}
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const isHint = showHints && hintMove?.row === r && hintMove?.col === c;
            const isPower = power.has(key);
            const isLocked = locked.has(key);
            const lockCount = locked.get(key);
            
            return (
              <motion.div
                key={key}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ 
                  scale: won && !state.showVictory ? [1, 1.1, 1] : 1, 
                  rotate: 0 
                }}
                transition={{ 
                  delay: (r * grid.length + c) * 0.02,
                  type: "spring",
                  stiffness: 200,
                  scale: won && !state.showVictory ? {
                    delay: 1.0 + (r * grid.length + c) * 0.05,  // Delayed to start after flips
                    duration: 0.5,
                    repeat: 2,
                    repeatType: "reverse"
                  } : {}
                }}
                className="relative w-full"
                style={{ aspectRatio: '1' }}
              >
                <Tile
                  value={cell}
                  power={isPower}
                  locked={isLocked}
                  lockCount={lockCount}
                  highlight={isHint}
                  onClick={() => handleTileClick(r, c)}
                  disabled={paused || won}
                  row={r}
                  col={c}
                  animationDelay={getAnimationDelay(r, c)}
                />
              </motion.div>
            );
          })
        )}
        
        {/* Victory celebration overlay - inside grid container */}
        {won && !state.showVictory && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              delay: 0.5  // Wait for flip animations to complete
            }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 2,
                rotate: { ease: "linear", repeat: 1 },
                scale: { repeat: 2, repeatType: "reverse" }
              }}
              className="text-6xl"
            >
              🎉
            </motion.div>
          </motion.div>
        )}
      </div>
      
      {/* Unsolvable warning with recovery options */}
      {!isSolvable && !isChecking && !won && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-0 left-0 right-0 bg-red-600 text-white p-3 rounded-lg shadow-lg z-50"
        >
          <p className="text-center font-bold">
            ⚠️ Warning: Puzzle has become unsolvable!
          </p>
          <p className="text-center text-sm mt-1">
            This shouldn&apos;t happen with our generation method.
          </p>
          <div className="flex justify-center gap-2 mt-2">
            {getRecoveryOptions().slice(0, 2).map((option, i) => (
              <button
                key={i}
                onClick={() => option.execute()}
                className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 text-sm"
              >
                {option.type === 'revert' ? 'Undo' : 'New Puzzle'}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GameBoard;