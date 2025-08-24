import { useState, useEffect } from 'react';
import { VERSION_INFO } from '../version';
import { UsernameGenerator } from '../utils/UsernameGenerator';
import { leaderboardService, type LeaderboardEntry } from '../services/LeaderboardService';
import type { SavedGame } from '../utils/SavedGameState';


interface StartScreenProps {
  onStart: (devMode?: boolean) => void;
  onContinue?: () => void;
  savedGame?: SavedGame | null;
  highScore: number;
  onShowLeaderboard?: () => void;
}

export function StartScreen({ onStart, onContinue, savedGame, highScore }: StartScreenProps) {
  const [username] = useState(() => UsernameGenerator.getSessionUsername());
  const [topPlayer, setTopPlayer] = useState<LeaderboardEntry | null>(null);
  const [allTimeTopPlayer, setAllTimeTopPlayer] = useState<LeaderboardEntry | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    // Fetch leaderboard data on mount
    leaderboardService.getLeaderboard().then(data => {
      setTopPlayer(data.topPlayer);
      // If no 24h leader, use all-time top
      if (!data.topPlayer && data.allTime.length > 0) {
        setAllTimeTopPlayer(data.allTime[0]);
      }
    });
    
    // Listen for online/offline events - use browser's built-in detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check current status
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-black overflow-y-auto">
      <div className="flex flex-col items-center px-4 py-6">
        <div className="text-center w-full max-w-sm sm:max-w-md md:max-w-lg space-y-3">
        {/* Title - Mobile first sizing */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold">
          <span className="neon-text">FLOK</span>
          <span className="neon-pink">TOID</span>
        </h1>
        
        {/* Subtitle - Better mobile sizing */}
        <div className="text-sm sm:text-base md:text-lg neon-yellow pulse-neon">
          Asteroids vs Evil Spaceships
        </div>
        
        <div className="text-xs sm:text-sm text-gray-300">
          Defend the energy dots!
        </div>
        
        {/* Leaderboard - Mobile responsive */}
        <div className="space-y-1">
          {topPlayer ? (
            <div className="text-sm sm:text-base text-yellow-400">
              <span className="block sm:inline">24h Leader:</span>
              <span className="block sm:inline sm:ml-1">{topPlayer.username} - {topPlayer.score.toLocaleString()}</span>
            </div>
          ) : allTimeTopPlayer ? (
            <div className="text-sm sm:text-base text-yellow-400">
              <span className="block sm:inline">All-Time:</span>
              <span className="block sm:inline sm:ml-1">{allTimeTopPlayer.username} - {allTimeTopPlayer.score.toLocaleString()}</span>
            </div>
          ) : null}
          <a
            href="/leaderboard"
            className="text-sm sm:text-base text-cyan-400 hover:text-cyan-300 underline block"
          >
            View Full Leaderboard
          </a>
        </div>
        
        {/* User info */}
        <div className="text-sm sm:text-base text-gray-500">
          Player: <span className="text-cyan-300">{username}</span>
        </div>
        
        {/* Instructions - Hidden on smallest screens */}
        <div className="hidden sm:block text-sm text-gray-400">
          Click and drag to launch asteroids. Stop the flock!
        </div>
        
        {/* High Score - Bigger on mobile */}
        {highScore > 0 && (
          <div className="text-base sm:text-lg md:text-xl neon-yellow">
            HIGH SCORE: {highScore.toString().padStart(6, '0')}
          </div>
        )}
        
        {/* Game Buttons - Full width on mobile */}
        <div className="space-y-3 w-full">
          {savedGame && onContinue && (
            <button
              onClick={onContinue}
              className="w-full px-6 py-3 text-base sm:text-lg font-bold bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]"
            >
              CONTINUE WAVE {savedGame.wave}
            </button>
          )}
          
          <button
            onClick={() => onStart(false)}
            className="w-full px-6 py-4 text-lg sm:text-xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          >
            START GAME
          </button>
        </div>
        
        
        {/* Footer - Better spacing on mobile */}
        <div className="text-xs sm:text-sm text-gray-600 mt-4 space-y-2">
          <div className="text-cyan-400 font-mono">{VERSION_INFO.displayVersion}</div>
          <div className="flex items-center justify-center gap-4">
            <button 
              onClick={() => onStart(true)} 
              className="text-gray-700 hover:text-gray-500 text-xs sm:text-sm underline"
            >
              dev
            </button>
            <span className="text-gray-700">|</span>
            <a 
              href="https://github.com/franzenzenhofer/floktoid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-cyan-400 text-xs sm:text-sm underline transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        
        {/* Online/Offline Indicator - At the very bottom */}
        <div className="mt-6 px-3 py-1 rounded text-xs sm:text-sm" 
             style={{
               backgroundColor: isOnline ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 165, 0, 0.2)',
               border: `1px solid ${isOnline ? '#00ff0080' : '#ffa500'}`,
               color: isOnline ? '#00ff00' : '#ffa500',
               textShadow: isOnline ? '0 0 3px #00ff0040' : '0 0 5px #ffa50080'
             }}>
          {isOnline ? 'online' : (
            <span>
              <span className="sm:hidden">OFFLINE</span>
              <span className="hidden sm:inline">OFFLINE MODE - Scores saved locally</span>
            </span>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
