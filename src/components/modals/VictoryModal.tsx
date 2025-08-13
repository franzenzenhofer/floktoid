import React from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, ArrowRight, Shield } from 'lucide-react';
import { useGenerator } from '../../hooks/useGenerator';
import { DIFFICULTIES } from '../../constants/gameConfig';
import { getLevelMilestoneDescription } from '../../utils/levelConfig';
import { calculateLevelScore, formatPoints } from '../../utils/scoring';

interface VictoryModalProps {
  onShowAchievements?: (achievements: string[]) => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ onShowAchievements: _onShowAchievements }) => {
  const { state, dispatch } = useGame();
  const { showVictory, won, score, moves, optimalPath, time, level, hintsEnabled, undoCount, totalPoints } = state;
  const { generate } = useGenerator();

  if (!showVictory) return null;


  // Calculate efficiency - can be over 100% if player beats optimal path!
  const efficiency = optimalPath.length && moves > 0 ? Math.round((optimalPath.length / moves) * 100) : 100;
  const stars = efficiency >= 100 ? 3 : efficiency >= 80 ? 2 : 1;
  
  // Calculate score breakdown
  const levelScore = won ? calculateLevelScore({
    level,
    moves,
    optimalMoves: optimalPath.length,
    time,
    hintsUsed: hintsEnabled,
    undoUsed: undoCount > 0,
    powerTilesUsedOptimally: 0 // TODO: Track power tile usage
  }) : null;

  const handleNewGame = () => {
    window.location.reload(); // Simple reload for now
  };

  const handleContinue = async () => {
    try {
      // Generate new game for next level
      const nextLevel = level + 1;
      const result = await generate(DIFFICULTIES.easy, nextLevel);
      
      // Start new game with next level
      dispatch({ 
        type: 'NEW_GAME', 
        payload: { ...result, level: nextLevel } 
      });
    } catch (error) {
      console.error('Failed to generate next level:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="modal-content text-center"
        >
          {won ? (
            <>
              <h2 className="text-lg font-bold text-green-600 mb-2 flex items-center justify-center gap-2">
                <span className="text-2xl">🎉</span>
                Level {level} Complete!
              </h2>
              
              
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: i < stars ? 1 : 0.3, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    <Star
                      size={24}
                      className={i < stars ? 'text-yellow-400' : 'text-gray-300'}
                      fill={i < stars ? 'currentColor' : 'none'}
                    />
                  </motion.div>
                ))}
              </div>
              
              <div className="space-y-1 mb-3">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span>Moves: {moves}/{optimalPath.length}</span>
                </div>
                
                {/* Score breakdown */}
                {levelScore && levelScore.totalPoints > 0 && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Base Points:</span>
                          <span>{levelScore.basePoints}</span>
                        </div>
                        {levelScore.moveBonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Move Bonus:
                              {moves < optimalPath.length && " 🌟"}
                            </span>
                            <span className="text-green-600">+{levelScore.moveBonus}</span>
                          </div>
                        )}
                        {levelScore.timeBonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time Bonus:</span>
                            <span className="text-green-600">+{levelScore.timeBonus}</span>
                          </div>
                        )}
                        {levelScore.perfectBonus > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Perfect Bonus:</span>
                            <span className="text-green-600">+{levelScore.perfectBonus}</span>
                          </div>
                        )}
                        {undoCount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Undo Penalty:</span>
                            <span className="text-red-600">-25%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex items-center justify-center gap-2">
                        <Trophy size={20} className="text-yellow-500" />
                        <span className="text-lg font-bold">{formatPoints(score)} points</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Total: {formatPoints(totalPoints)}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Zero points message for hints - not shown in tutorial levels */}
                {hintsEnabled && level > 3 && (
                  <div className="bg-yellow-50/50 border border-yellow-200/50 rounded p-1.5">
                    <div className="flex items-center justify-center gap-2 text-yellow-700">
                      <Shield size={14} />
                      <span className="text-xs">Hints: 0 pts</span>
                    </div>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                Efficiency: {efficiency}%
              </p>
              
              {/* Show milestone message for next level */}
              {(() => {
                const nextLevel = level + 1;
                const milestone = getLevelMilestoneDescription(nextLevel);
                if (milestone) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2"
                    >
                      <p className="text-sm text-blue-800 font-medium">
                        {milestone}
                      </p>
                    </motion.div>
                  );
                }
                return null;
              })()}
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">⏰</div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Time&apos;s Up!
              </h2>
              <p className="text-gray-600 mb-4">
                Don&apos;t worry, you can try again!
              </p>
            </>
          )}
          
          <div className="flex flex-col gap-2">
            {won && (
              <button
                onClick={handleContinue}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleNewGame}
                className={`btn-secondary flex-1 ${!won ? 'btn-primary' : ''}`}
              >
                New Game
              </button>
              <button
                onClick={() => dispatch({ type: 'SHOW_MODAL', modal: null })}
                className="btn-secondary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VictoryModal;