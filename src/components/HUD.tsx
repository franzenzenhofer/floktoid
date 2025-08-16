
import { useEffect, useRef, useState } from 'react';
import { GameConfig } from '../engine/GameConfig';

interface HUDProps {
  score: number;
  wave: number;
  energyCritical?: boolean;
}

export function HUD({ score, wave, energyCritical }: HUDProps) {
  const [displayScore, setDisplayScore] = useState(score);
  const prevScoreRef = useRef(score);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    const prevScore = prevScoreRef.current;
    
    if (score < prevScore) {
      // Score decreased - animate countdown ULTRA FAST
      const difference = prevScore - score;
      const duration = Math.min(300, difference * 2); // Ultra fast: max 300ms
      const startTime = performance.now();
      const startScore = displayScore;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(startScore - (difference * easeOut));
        
        setDisplayScore(currentValue);
        
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setDisplayScore(score);
        }
      };
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      animationRef.current = requestAnimationFrame(animate);
    } else if (score > prevScore) {
      // Score increased - update immediately
      setDisplayScore(score);
    }
    
    prevScoreRef.current = score;
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, displayScore]);
  
  return (
    <>
      <div className="fixed top-2 sm:top-3 md:top-5 left-2 sm:left-3 md:left-5 font-bold text-2xl sm:text-3xl md:text-5xl neon-text select-none pointer-events-none">
        {displayScore.toString().padStart(6, '0')}
      </div>
      <div className="fixed top-2 sm:top-3 md:top-5 right-2 sm:right-3 md:right-5 font-bold text-xl sm:text-2xl md:text-3xl neon-pink select-none pointer-events-none">
        {wave % GameConfig.BOSS_WAVE_INTERVAL === 0 ? 'BOSS WAVE!' : `WAVE ${wave}`}
      </div>
      {energyCritical && (
        <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 font-bold text-3xl sm:text-4xl md:text-6xl text-red-500 animate-pulse select-none pointer-events-none">
          <div className="text-center">
            ⚠️ ENERGY CRITICAL ⚠️
            <div className="text-xl sm:text-2xl md:text-3xl mt-2">
              ALL DOTS STOLEN!
            </div>
          </div>
        </div>
      )}
    </>
  );
}