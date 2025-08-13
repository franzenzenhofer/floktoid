import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

const TutorialModal: React.FC = () => {
  const { state, dispatch } = useGame();
  const { showTutorial } = state;

  if (!showTutorial) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-backdrop"
        onClick={() => dispatch({ type: 'SHOW_MODAL', modal: null })}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => dispatch({ type: 'SHOW_MODAL', modal: null })}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
          
          <div className="text-center">
            <BookOpen size={48} className="text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">How to Play</h2>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-1">🎯 Goal</h3>
              <p>Turn all tiles the same color!</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">🎮 How to Play</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Click any tile to rotate its color and neighbors</li>
                <li>Each click affects a cross pattern (+ shape)</li>
                <li>Plan your moves to reach a single color</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">⚡ Special Tiles</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><span className="text-yellow-500 font-bold">⚡ Power tiles</span> affect a 3×3 area</li>
                <li><span className="text-gray-500 font-bold">🔒 Locked tiles</span> need multiple clicks to unlock</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">💡 Tips</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Use the hint button if you get stuck</li>
                <li>Fewer moves = higher score</li>
                <li>Complete puzzles to unlock new worlds!</li>
              </ul>
            </div>
          </div>
          
          <button
            onClick={() => dispatch({ type: 'SHOW_MODAL', modal: null })}
            className="btn-primary w-full mt-6"
          >
            Let&apos;s Play!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TutorialModal;