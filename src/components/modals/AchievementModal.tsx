import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Zap } from 'lucide-react';
import { ACHIEVEMENTS } from '../../constants/gameConfig';

interface AchievementModalProps {
  isOpen: boolean;
  achievements: string[];
  onClose: () => void;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ 
  isOpen, 
  achievements, 
  onClose 
}) => {
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (achievements.length === 0) return;

    const timer = setTimeout(() => {
      if (displayIndex < achievements.length - 1) {
        setDisplayIndex(displayIndex + 1);
      } else {
        // All achievements shown, auto-close after delay
        setTimeout(onClose, 2000);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [displayIndex, achievements.length, onClose]);

  if (!isOpen || achievements.length === 0) return null;

  const currentAchievement = ACHIEVEMENTS.find(a => a.id === achievements[displayIndex]);
  if (!currentAchievement) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-1 rounded-2xl max-w-md w-full"
          initial={{ scale: 0, rotateY: -180 }}
          animate={{ scale: 1, rotateY: 0 }}
          exit={{ scale: 0, rotateY: 180 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="bg-gray-900 rounded-xl p-8 text-center relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Achievement Icon */}
            <motion.div
              className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Trophy size={40} className="text-white drop-shadow-lg" />
            </motion.div>

            {/* Achievement unlocked text */}
            <motion.h2
              className="text-2xl font-bold text-yellow-400 mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Achievement Unlocked!
            </motion.h2>

            {/* Achievement name */}
            <motion.h3
              className="text-xl font-semibold text-white mb-2"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {currentAchievement.name}
            </motion.h3>

            {/* Achievement description */}
            <motion.p
              className="text-white/80 mb-4"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {currentAchievement.description}
            </motion.p>

            {/* XP reward */}
            <motion.div
              className="flex items-center justify-center gap-2 text-green-400 font-semibold"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <Zap size={16} className="text-yellow-400" />
              <span>+{currentAchievement.xp} XP</span>
            </motion.div>

            {/* Progress indicator if multiple achievements */}
            {achievements.length > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {achievements.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === displayIndex ? 'bg-yellow-400' : 'bg-white/30'
                    }`}
                    animate={index === displayIndex ? { scale: [1, 1.5, 1] } : {}}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            )}

            {/* Particle effects */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                style={{
                  top: '50%',
                  left: '50%',
                  x: '-50%',
                  y: '-50%',
                }}
                animate={{
                  x: Math.cos(i * 30 * Math.PI / 180) * 100,
                  y: Math.sin(i * 30 * Math.PI / 180) * 100,
                  opacity: [1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AchievementModal;