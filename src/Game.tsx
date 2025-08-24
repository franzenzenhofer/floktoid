import { useEffect, useRef, useState } from 'react';
import { NeonFlockEngine } from './engine/NeonFlockEngine';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { DevConsole } from './components/DevConsole';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { HomeButton } from './components/HomeButton';
import { leaderboardService } from './services/LeaderboardService';
import { GameSession } from './utils/GameSession';
import { SavedGameState, SavedGame } from './utils/SavedGameState';

export function Game() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NeonFlockEngine | null>(null);
  const gameSessionRef = useRef<GameSession | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover' | 'leaderboard'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [energyCritical, setEnergyCritical] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('floktoid-highscore');
    return saved ? parseInt(saved) : 0;
  });

  // Manage scroll prevention based on game state
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => e.preventDefault();
    const preventGesture = (e: Event) => e.preventDefault();
    
    if (gameState === 'playing') {
      // Only prevent scrolling during gameplay
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('gesturestart', preventGesture);
      document.addEventListener('gesturechange', preventGesture);
      document.addEventListener('gestureend', preventGesture);
    }
    
    return () => {
      // Clean up when game state changes or component unmounts
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
      document.removeEventListener('gestureend', preventGesture);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      const initEngine = async () => {
        try {
          const engine = new NeonFlockEngine(canvasRef.current!, devMode);
          await engine.initialize();
          
          // Check for saved game
          const savedGame = SavedGameState.load();
          
          // Create or restore game session
          if (savedGame) {
            gameSessionRef.current = new GameSession(savedGame.gameId, savedGame.score, savedGame.wave);
            // KISS: Restore with simplified state
            engine.restoreGameState(
              savedGame.score, 
              savedGame.wave, 
              savedGame.stolenDots
            );
            // Clear saved game after restoration
            SavedGameState.clear();
          } else {
            gameSessionRef.current = new GameSession();
          }
          const session = gameSessionRef.current;
          
          // CRITICAL FIX: Use stable highScore reference to prevent re-initialization loops
          const currentHighScore = highScore;
          engine.onScoreUpdate = (newScore) => {
            setScore(newScore);
            if (newScore > currentHighScore) {
              setHighScore(newScore);
              localStorage.setItem('floktoid-highscore', newScore.toString());
            }
            
            // Update game session and submit to leaderboard if significant progress
            const currentWave = engine.getWave();
            session.updateProgress(newScore, currentWave);
            
            // Auto-submit to leaderboard every 1000 points
            if (session.shouldSubmitToLeaderboard()) {
              leaderboardService.submitScore(
                session.getHighestScore(),
                session.getHighestWave(),
                session.getGameId()
              ).then(() => {
                session.markSubmitted();
              }).catch(error => {
                console.error('Failed to submit progress:', error);
              });
            }
          };
          
          engine.onWaveUpdate = (newWave) => {
            setWave(newWave);
            
            // KISS: Save when wave completes (new wave starts means previous completed)
            if (session && session.isActive() && newWave > 1) {
              const currentScore = engine.getScore();
              const engineState = engine.getGameStateForSave();
              
              // Save state at completed wave
              const saveState: SavedGame = {
                gameId: session.getGameId(),
                score: currentScore,
                wave: newWave, // Save current wave we're starting
                timestamp: Date.now(),
                stolenDots: engineState.stolenDots
              };
              
              SavedGameState.save(saveState);
              console.log(`[WAVE-COMPLETE-SAVE] Wave ${newWave-1} complete, starting wave ${newWave}, score: ${currentScore}`);
            }
          };
          engine.onEnergyStatus = (critical: boolean) => setEnergyCritical(critical);
          engine.onGameOver = () => {
            // Submit final score to leaderboard with game ID
            const finalScore = engine.getScore();
            const finalWave = engine.getWave();
            
            if (session) {
              session.updateProgress(finalScore, finalWave);
              
              // SAVE on game over
              const engineState = engine.getGameStateForSave();
              const saveState: SavedGame = {
                gameId: session.getGameId(),
                score: finalScore,
                wave: finalWave,
                timestamp: Date.now(),
                stolenDots: engineState.stolenDots
              };
              SavedGameState.save(saveState);
              console.log(`[GAME-OVER-SAVE] Final save - Wave: ${finalWave}, Score: ${finalScore}`);
              
              session.endGame();
              
              // Final submission with game ID
              leaderboardService.submitScore(
                session.getHighestScore(),
                session.getHighestWave(),
                session.getGameId()
              ).catch(error => {
                console.error('Failed to submit final score:', error);
              });
            }
            
            setGameState('gameover');
          };
          
          engine.start();
          engineRef.current = engine;
          
          // Save on page unload (browser close/refresh) - ALWAYS SAVE
          const handleBeforeUnload = () => {
            if (session && session.isActive()) {
              const currentScore = engine.getScore();
              const currentWave = engine.getWave();
              const engineState = engine.getGameStateForSave();
              
              const saveState: SavedGame = {
                gameId: session.getGameId(),
                score: currentScore,
                wave: currentWave,
                timestamp: Date.now(),
                stolenDots: engineState.stolenDots
              };
              
              SavedGameState.save(saveState);
              console.log(`[UNLOAD-SAVE] Saved on page unload - Wave: ${currentWave}, Score: ${currentScore}`);
            }
          };
          window.addEventListener('beforeunload', handleBeforeUnload);
          
          // Expose autopilot to window for testing
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).gameEngine = engine;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).enableAutopilot = () => engine.enableAutopilot();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).disableAutopilot = () => engine.disableAutopilot();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).testBossAnnouncement = () => {
            // Access through public method or make comboEffects public
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyEngine = engine as any;
            anyEngine.comboEffects.createBossAnnouncement();
          };
        } catch (error) {
          console.error('[GAME] Failed to initialize engine:', error);
        }
      };
      
      initEngine();
      
      return () => {
        // End game session if still active
        if (gameSessionRef.current?.isActive()) {
          gameSessionRef.current.endGame();
        }
        // Remove beforeunload listener
        window.removeEventListener('beforeunload', () => {});
        engineRef.current?.destroy();
        engineRef.current = null;
        gameSessionRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, devMode]); // Include devMode to reinitialize engine with debug mode

  const handleStart = (isDevMode = false) => {
    // CRITICAL: Destroy any existing engine before starting fresh
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (gameSessionRef.current) {
      gameSessionRef.current.endGame();
      gameSessionRef.current = null;
    }
    
    // Clear any saved game when starting fresh
    SavedGameState.clear();
    setScore(0);
    setWave(1);
    setEnergyCritical(false);
    setDevMode(isDevMode);
    if (isDevMode) {
      console.log('[DEV MODE] Starting game in development mode');
    }
    setGameState('playing');
  };
  
  const handleContinue = () => {
    const saved = SavedGameState.load();
    if (saved) {
      setScore(saved.score);
      setWave(saved.wave);
      setGameState('playing');
      // Engine will restore from saved state in useEffect
    }
  };

  const handleRestart = () => {
    // CRITICAL: Destroy the old engine first!
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    if (gameSessionRef.current) {
      gameSessionRef.current.endGame();
      gameSessionRef.current = null;
    }
    
    // Clear any saved game when restarting - ensure clean state like handleStart
    SavedGameState.clear();
    // Reset all game state for fresh start
    setScore(0);
    setWave(1);
    setEnergyCritical(false);
    setGameState('playing');
  };

  const handleMenu = () => {
    // If coming from game over, destroy the engine to ensure clean state
    if (gameState === 'gameover' && engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
      if (gameSessionRef.current) {
        gameSessionRef.current.endGame();
        gameSessionRef.current = null;
      }
      // Reset UI state when returning to menu from game over
      setScore(0);
      setWave(1);
      setEnergyCritical(false);
    }
    // KISS: Home button ALWAYS saves if playing
    else if (gameState === 'playing' && engineRef.current && gameSessionRef.current) {
      const engine = engineRef.current;
      const session = gameSessionRef.current;
      const currentScore = engine.getScore();
      const currentWave = engine.getWave();
      
      // ALWAYS SAVE when home button clicked (user wants to continue later)
      if (session.isActive()) {
        const engineState = engine.getGameStateForSave();
        const saveState: SavedGame = {
          gameId: session.getGameId(),
          score: currentScore,
          wave: currentWave,
          timestamp: Date.now(),
          stolenDots: engineState.stolenDots
        };
        
        SavedGameState.save(saveState);
        console.log(`[HOME-BUTTON-SAVE] Saved game - Wave: ${currentWave}, Score: ${currentScore}`);
      }
    }
    
    setGameState('menu');
  };

  const handleShowLeaderboard = () => {
    setGameState('leaderboard');
  };

  return (
    <div className={gameState === 'playing' || gameState === 'gameover' ? 'game-container' : ''}>
      {gameState === 'menu' && (
        <StartScreen 
          onStart={handleStart}
          onContinue={handleContinue}
          savedGame={SavedGameState.load()}
          highScore={highScore} 
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}
      
      {gameState === 'playing' && (
        <>
          <div ref={canvasRef} className="fixed inset-0 w-full h-full" />
          <HUD score={score} wave={wave} energyCritical={energyCritical} />
          <HomeButton onClick={handleMenu} />
          {devMode && <DevConsole />}
        </>
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen 
          score={score} 
          wave={wave}
          highScore={highScore}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
      
      {gameState === 'leaderboard' && (
        <LeaderboardScreen onBack={handleMenu} />
      )}
    </div>
  );
}