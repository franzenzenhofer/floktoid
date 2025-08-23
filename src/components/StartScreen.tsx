import { useState, useEffect, useRef } from 'react';
import { VERSION_INFO } from '../version';
import { UsernameGenerator } from '../utils/UsernameGenerator';
import { leaderboardService, type LeaderboardEntry } from '../services/LeaderboardService';
import type { SavedGame } from '../utils/SavedGameState';

// PWA install prompt event type
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  
  useEffect(() => {
    // Fetch leaderboard data on mount
    leaderboardService.getLeaderboard().then(data => {
      setTopPlayer(data.topPlayer);
      // If no 24h leader, use all-time top
      if (!data.topPlayer && data.allTime.length > 0) {
        setAllTimeTopPlayer(data.allTime[0]);
      }
    });
    
    // Check if app is already installed
    // ALWAYS register service worker for PWA installability
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered');
          registration.update();
        })
        .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // Listen for online/offline events - use browser's built-in detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check current status
    setIsOnline(navigator.onLine);
    
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as Record<string, unknown>).standalone) {
      setIsInstalled(true);
    }
    
    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPromptRef.current = null;
    };
    
    window.addEventListener('appinstalled', handleAppInstalled);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleInstallClick = async () => {
    if (!deferredPromptRef.current) {
      // No install prompt available yet, but inform user how to install
      alert('To install FLOKTOID as an app:\n\n' +
            'Chrome/Edge: Click the install icon in the address bar (⊕ or ⬇️)\n' +
            'Firefox: Not supported yet\n' +
            'Safari iOS: Tap Share → Add to Home Screen\n' +
            'Samsung Internet: Menu → Add page to → Home screen\n\n' +
            'Or try refreshing the page and clicking Install again.');
      return;
    }
    
    // Show install prompt
    deferredPromptRef.current.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPromptRef.current.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installed');
      
      // NOW register service worker for offline support AFTER install
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered for offline support');
            registration.update();
          })
          .catch(err => console.error('Service Worker registration failed:', err));
      }
    }
    
    deferredPromptRef.current = null;
    setCanInstall(false);
  };
  
  const handleUninstallClick = () => {
    // PWAs can't be uninstalled programmatically, show instructions
    alert('To uninstall:\n\n' +
          'Desktop: Click the three dots menu → Uninstall FLOKTOID\n' +
          'Mobile: Long press the app icon → Remove/Uninstall');
  };
  return (
    <div className="h-screen bg-black overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full px-4 py-6">
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
          {/* PWA Section - Better mobile spacing */}
          <div className="pt-3 space-y-3 border-t border-gray-700 mt-3">
            <div className="bg-blue-900/20 p-3 rounded border border-blue-400">
              {isInstalled ? (
                <button
                  onClick={handleUninstallClick}
                  className="text-red-400 hover:text-red-200 text-base sm:text-lg underline font-bold transition-colors block mx-auto px-4 py-2"
                >
                  UNINSTALL PWA
                </button>
              ) : canInstall ? (
                <button
                  onClick={handleInstallClick}
                  className="text-blue-400 hover:text-white text-base sm:text-lg underline font-bold transition-colors animate-pulse block mx-auto bg-blue-600/30 px-6 py-2 rounded"
                  style={{ textDecorationThickness: '2px', textShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}
                >
                  INSTALL AS APP
                </button>
              ) : (
                <div className="text-yellow-300 text-sm sm:text-base px-2">
                  {navigator.userAgent.includes('CriOS') || navigator.userAgent.includes('FxiOS') ? (
                    <div>Safari → Share → Add to Home</div>
                  ) : (
                    <div>Menu (⋮) → Install App</div>
                  )}
                </div>
              )}
            </div>
            <a
              href="/pwa-diagnostic"
              target="_blank"
              className="text-cyan-300 hover:text-white text-sm sm:text-base underline font-bold transition-colors block bg-cyan-900/30 px-4 py-2 rounded border border-cyan-400"
              style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}
            >
              PWA INSTALLATION ANALYSIS
            </a>
          </div>
        </div>
        </div>
        
        {/* Online/Offline Indicator - Mobile optimized */}
        <div className="fixed bottom-2 left-2 right-2 sm:right-auto px-2 py-1 rounded text-xs sm:text-sm text-center sm:text-left" 
             style={{
               backgroundColor: isOnline ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 165, 0, 0.2)',
               border: `1px solid ${isOnline ? '#00ff0080' : '#ffa500'}`,
               color: isOnline ? '#00ff00' : '#ffa500',
               textShadow: isOnline ? '0 0 3px #00ff0040' : '0 0 5px #ffa50080'
             }}>
          {isOnline ? 'online' : (
            <span className="block sm:inline">
              <span className="sm:hidden">OFFLINE</span>
              <span className="hidden sm:inline">OFFLINE MODE - Scores saved locally</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}