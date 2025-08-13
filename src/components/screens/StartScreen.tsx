import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useGenerator } from '../../hooks/useGenerator';
import { useSaveGame } from '../../hooks/useSaveGame';
import { saveManager } from '../../services/SaveManager';
import { DIFFICULTIES } from '../../constants/gameConfig';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Trophy, TrendingUp, Target, HelpCircle } from 'lucide-react';
import { formatPoints } from '../../utils/scoring';
import { useStartScreenStats } from '../../hooks/useStartScreenStats';
import { MilestoneProgress } from '../ui/MilestoneProgress';
import HowToPlayModal from '../modals/HowToPlayModal';

const StartScreen: React.FC = () => {
  const { state, dispatch } = useGame();
  const { generate } = useGenerator();
  const { hasSave, clearSave } = useSaveGame();
  const stats = useStartScreenStats();
  const [loading, setLoading] = useState(false);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  if (state.started) return null;
  
  const savedGameExists = hasSave();

  const handleNewGame = async () => {
    // If save exists, confirm overwrite
    if (savedGameExists && !showNewGameConfirm) {
      setShowNewGameConfirm(true);
      return;
    }
    
    setLoading(true);
    setShowNewGameConfirm(false);
    
    // Clear existing save if any
    if (savedGameExists) {
      await clearSave();
    }
    
    try {
      // Always start at level 1 for new games
      const startingLevel = 1;
      
      // Use a dummy config for now - will be replaced by level-based generation
      const puzzle = await generate(DIFFICULTIES.easy, startingLevel);
      dispatch({ 
        type: 'NEW_GAME', 
        payload: { level: startingLevel, ...puzzle } 
      });
    } catch (error) {
      console.error('Failed to generate puzzle:', error);
      setLoading(false);
    }
  };
  
  const handleContinue = async () => {
    setLoading(true);
    try {
      // Load the full saved state
      const savedState = await saveManager.load();
      
      if (savedState) {
        // Generate puzzle for the saved level (needed for power/locked tiles info)
        const puzzle = await generate(DIFFICULTIES.easy, savedState.currentLevel);
        
        dispatch({ 
          type: 'CONTINUE_GAME', 
          savedState,
          puzzle
        });
      } else {
        // Fallback to new game if save is corrupted
        const puzzle = await generate(DIFFICULTIES.easy, stats.currentLevel);
        dispatch({ 
          type: 'NEW_GAME', 
          payload: { level: stats.currentLevel, ...puzzle } 
        });
      }
    } catch (error) {
      console.error('Failed to continue game:', error);
      setLoading(false);
    }
  };
  
  // Calculate best streak from completed levels
  const calculateBestStreak = () => {
    // Just return the pre-calculated best streak from saved stats
    return stats.bestStreak;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center flex-1 flex flex-col justify-center max-h-screen py-2"
    >
      {/* Header */}
      <div className="mb-6">
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-4xl md:text-5xl font-bold text-white mb-2"
        >
          Color Me Same
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-white/80"
        >
          Make all tiles match!
        </motion.p>
      </div>

      {/* Game buttons */}
      <div className="flex flex-col gap-4 items-center mb-6 w-full max-w-sm mx-auto">
        {savedGameExists && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full"
          >
            <button
              onClick={handleContinue}
              disabled={loading}
              className="btn-primary text-lg px-8 py-4 flex flex-col items-center gap-1 w-full
                         hover:scale-105 active:scale-95 transition-transform"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Play size={24} />
                    <span className="font-bold text-xl">CONTINUE</span>
                  </div>
                  <span className="text-sm opacity-90">
                    Level {stats.currentLevel} • {formatPoints(stats.totalPoints)}
                  </span>
                </>
              )}
            </button>
          </motion.div>
        )}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: savedGameExists ? 0.4 : 0.3 }}
          className="w-full"
        >
          <button
            onClick={handleNewGame}
            disabled={loading}
            className={`${savedGameExists ? 'btn-secondary' : 'btn-primary'} 
                       text-lg px-8 py-4 flex items-center justify-center gap-2 w-full
                       hover:scale-105 active:scale-95 transition-transform`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <RotateCcw size={20} />
                <span className="font-bold">NEW GAME</span>
              </>
            )}
          </button>
        </motion.div>
      </div>

      {/* How to Play button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6 flex justify-center"
      >
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setShowHowToPlay(true);
          }}
          className="btn-secondary text-sm px-6 py-2 flex items-center justify-center gap-2
                     hover:scale-105 active:scale-95 transition-transform"
        >
          <HelpCircle size={18} />
          <span>How to Play</span>
        </button>
      </motion.div>

      {/* Statistics or starting info */}
      {savedGameExists ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-6 text-white/80"
        >
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Target size={20} className="opacity-60" />
            </div>
            <div className="text-lg font-semibold">{stats.completedLevels}</div>
            <div className="text-xs opacity-70">Completed</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <Trophy size={20} className="opacity-60" />
            </div>
            <div className="text-lg font-semibold">{formatPoints(stats.totalPoints)}</div>
            <div className="text-xs opacity-70">Total Points</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-1">
              <TrendingUp size={20} className="opacity-60" />
            </div>
            <div className="text-lg font-semibold">{calculateBestStreak()}</div>
            <div className="text-xs opacity-70">Best Streak</div>
          </div>
        </motion.div>
      ) : (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/60 text-sm mb-6"
        >
          Starting at Level 1 • 3×3 Grid • 1 Move
        </motion.p>
      )}
      
      {/* Milestone Progress */}
      {savedGameExists && (
        <MilestoneProgress className="mb-6" />
      )}
      
      {/* New game confirmation */}
      {showNewGameConfirm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowNewGameConfirm(false)}
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Start New Game?
            </h3>
            <p className="text-gray-600 mb-4">
              This will erase your current progress at Level {stats.currentLevel}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleNewGame}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg 
                         hover:bg-red-600 transition-colors font-medium"
              >
                Yes, Start Over
              </button>
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg 
                         hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* How to Play Modal */}
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
    </motion.div>
  );
};

export default StartScreen;