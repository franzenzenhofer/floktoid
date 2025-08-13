import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPoints } from '../../utils/scoring';

interface PointsDisplayProps {
  totalPoints: number;
  levelPoints?: number;
  lastGain?: number;
  showAnimation?: boolean;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  totalPoints, 
  levelPoints = 0,
  lastGain,
  showAnimation = true 
}) => {
  const [displayPoints, setDisplayPoints] = useState(totalPoints);
  const [showGain, setShowGain] = useState(false);
  
  // Animate point counter
  useEffect(() => {
    if (!showAnimation || displayPoints === totalPoints) {
      setDisplayPoints(totalPoints);
      return;
    }
    
    const difference = totalPoints - displayPoints;
    const duration = 800; // ms
    const frames = 60;
    const increment = difference / frames;
    let current = displayPoints;
    let frame = 0;
    
    const interval = setInterval(() => {
      frame++;
      current += increment;
      
      if (frame >= frames || Math.abs(totalPoints - current) < Math.abs(increment)) {
        setDisplayPoints(totalPoints);
        clearInterval(interval);
      } else {
        setDisplayPoints(Math.floor(current));
      }
    }, duration / frames);
    
    return () => clearInterval(interval);
  }, [totalPoints, displayPoints, showAnimation]);
  
  // Show point gain animation
  useEffect(() => {
    if (lastGain && lastGain > 0) {
      setShowGain(true);
      const timer = setTimeout(() => setShowGain(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastGain]);
  
  // Get color based on performance
  const getPointsColor = useCallback(() => {
    if (levelPoints > 200) return 'text-green-400';
    if (levelPoints > 100) return 'text-blue-400';
    return 'text-white';
  }, [levelPoints]);
  
  return (
    <div className="relative inline-flex items-center gap-2">
      <motion.div 
        className={`text-xl font-bold ${getPointsColor()}`}
        animate={lastGain && lastGain > 100 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {formatPoints(displayPoints)}
      </motion.div>
      
      <AnimatePresence>
        {showGain && lastGain && (
          <motion.div
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ opacity: 1, y: -20, x: 10 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="absolute left-full ml-2 text-sm font-bold text-green-400 pointer-events-none whitespace-nowrap"
          >
            +{formatPoints(lastGain)}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Celebration for milestones */}
      <AnimatePresence>
        {totalPoints >= 100000 && totalPoints - (lastGain || 0) < 100000 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="absolute -top-8 left-1/2 transform -translate-x-1/2"
          >
            <span className="text-2xl">🎊</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PointsDisplay;