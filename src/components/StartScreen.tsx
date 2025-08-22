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
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as unknown as Record<string, unknown>).standalone) {
      setIsInstalled(true);
      
      // Register service worker ONLY for installed PWA
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered for installed PWA');
            registration.update();
          })
          .catch(err => console.error('Service Worker registration failed:', err));
      }
    } else {
      // NOT installed as PWA - UNREGISTER any service workers to ensure fresh content!
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            registration.unregister();
            console.log('Service Worker unregistered - using online version');
          });
        });
        
        // Clear all caches too
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
              console.log('Cache cleared:', name);
            });
          });
        }
      }
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
    <div className="min-h-screen bg-black overflow-y-auto">
      <div className="flex flex-col items-center p-4 pt-20">
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
        
        <div className="space-y-1">
          {topPlayer ? (
            <div className="text-sm sm:text-base text-yellow-400">
              24h Top Leader: {topPlayer.username} - {topPlayer.score.toLocaleString()}
            </div>
          ) : allTimeTopPlayer ? (
            <div className="text-sm sm:text-base text-yellow-400">
              All-Time Leader: {allTimeTopPlayer.username} - {allTimeTopPlayer.score.toLocaleString()}
            </div>
          ) : null}
          <a
            href="/leaderboard"
            className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            View Full Leaderboard
          </a>
        </div>
        
        <div className="text-xs sm:text-sm text-gray-500">
          Your username: <span className="text-cyan-300">{username}</span>
        </div>
        
        <div className="text-sm sm:text-base text-gray-400">
          Click and drag to launch asteroids. Stop the flock from stealing energy. Survive increasingly intense waves.
        </div>
        
        {highScore > 0 && (
          <div className="text-lg sm:text-xl md:text-2xl neon-yellow">
            HIGH SCORE: {highScore.toString().padStart(6, '0')}
          </div>
        )}
        
        {savedGame && onContinue && (
          <button
            onClick={onContinue}
            className="px-6 sm:px-10 py-2 sm:py-3 text-base sm:text-lg md:text-xl font-bold bg-transparent border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]"
          >
            CONTINUE GAME (W{savedGame.wave})
          </button>
        )}
        
        <button
          onClick={() => onStart(false)}
          className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
        >
          START GAME
        </button>
        
        
        <div className="text-xs sm:text-sm text-gray-600 mt-4 md:mt-8 space-y-2">
          <div className="text-cyan-400 font-mono">{VERSION_INFO.displayVersion}</div>
          <div className="flex items-center justify-center gap-3">
            <button 
              onClick={() => onStart(true)} 
              className="text-gray-700 hover:text-gray-500 text-xs underline"
            >
              dev
            </button>
            <span className="text-gray-700">|</span>
            <a 
              href="https://github.com/franzenzenhofer/floktoid" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-cyan-400 text-xs underline transition-colors"
            >
              GitHub
            </a>
          </div>
          <div className="pt-4 space-y-3 border-t border-gray-700 mt-4">
            <div className="bg-blue-900/20 p-3 rounded border border-blue-400">
              {isInstalled ? (
                <button
                  onClick={handleUninstallClick}
                  className="text-red-400 hover:text-red-200 text-base underline font-bold transition-colors block mx-auto"
                >
                  UNINSTALL PWA
                </button>
              ) : canInstall ? (
                <button
                  onClick={handleInstallClick}
                  className="text-blue-400 hover:text-white text-lg underline font-bold transition-colors animate-pulse block mx-auto bg-blue-600/30 px-6 py-2 rounded"
                  style={{ textDecorationThickness: '2px', textShadow: '0 0 10px rgba(59, 130, 246, 0.8)' }}
                >
                  INSTALL AS APP
                </button>
              ) : (
                <div className="text-yellow-300 text-base font-bold">
                  Install not available
                </div>
              )}
            </div>
            <a
              href="/pwa-diagnostic"
              target="_blank"
              className="text-cyan-300 hover:text-white text-base underline font-bold transition-colors block bg-cyan-900/30 px-4 py-2 rounded border border-cyan-400"
              style={{ textShadow: '0 0 10px rgba(6, 182, 212, 0.8)' }}
            >
              PWA INSTALLATION ANALYSIS
            </a>
          </div>
          
          {/* Add bottom padding to ensure scrollability */}
          <div className="h-20"></div>
        </div>
      </div>
      </div>
    </div>
  );
}