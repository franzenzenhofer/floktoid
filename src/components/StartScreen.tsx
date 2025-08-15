import { useState, useEffect } from 'react';
import { VERSION_INFO } from '../version';
import { UsernameGenerator } from '../utils/UsernameGenerator';
import { leaderboardService, type LeaderboardEntry } from '../services/LeaderboardService';

interface StartScreenProps {
  onStart: (devMode?: boolean) => void;
  highScore: number;
}

export function StartScreen({ onStart, highScore }: StartScreenProps) {
  const [username] = useState(() => UsernameGenerator.getSessionUsername());
  const [topPlayer, setTopPlayer] = useState<LeaderboardEntry | null>(null);
  
  useEffect(() => {
    // Fetch top player on mount
    leaderboardService.getTopPlayer().then(setTopPlayer);
  }, []);
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 md:space-y-8 max-w-lg">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-2">
          <span className="neon-text">FLOK</span>
          <span className="neon-pink">TOID</span>
        </h1>
        
        <div className="text-sm sm:text-lg md:text-xl neon-yellow pulse-neon">
          Asteroids vs Evil Spaceships
        </div>
        
        <div className="text-xs sm:text-sm md:text-base text-gray-300 max-w-md">
          Defend the energy dots!
        </div>
        
        {topPlayer && (
          <div className="text-sm sm:text-base text-cyan-400">
            Top Leader: {topPlayer.username} - {topPlayer.score.toLocaleString()}
          </div>
        )}
        
        <div className="text-xs sm:text-sm text-gray-500">
          Your username: <span className="text-cyan-300">{username}</span>
        </div>
        
        <div className="space-y-2 md:space-y-4 text-gray-400">
          <p className="text-sm sm:text-base md:text-lg">
            • Click and drag to launch asteroids
          </p>
          <p className="text-sm sm:text-base md:text-lg">
            • Stop the flock from stealing energy
          </p>
          <p className="text-sm sm:text-base md:text-lg">
            • Survive increasingly intense waves
          </p>
        </div>
        
        {highScore > 0 && (
          <div className="text-lg sm:text-xl md:text-2xl neon-yellow">
            HIGH SCORE: {highScore.toString().padStart(6, '0')}
          </div>
        )}
        
        <button
          onClick={() => onStart(false)}
          className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
        >
          START GAME
        </button>
        
        
        <div className="text-xs sm:text-sm text-gray-600 mt-4 md:mt-8 space-y-1">
          <div className="text-cyan-400 font-mono">{VERSION_INFO.displayVersion}</div>
          <button 
            onClick={() => onStart(true)} 
            className="text-gray-700 hover:text-gray-500 text-xs underline"
          >
            dev
          </button>
        </div>
      </div>
    </div>
  );
}