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
            // Restore engine state
            engine.restoreGameState(savedGame.score, savedGame.wave, savedGame.energyDots, savedGame.boids);
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
          
          engine.onWaveUpdate = setWave;
          engine.onEnergyStatus = (critical: boolean) => setEnergyCritical(critical);
          engine.onGameOver = () => {
            // Submit final score to leaderboard with game ID
            const finalScore = engine.getScore();
            const finalWave = engine.getWave();
            
            if (session) {
              session.updateProgress(finalScore, finalWave);
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
        engineRef.current?.destroy();
        engineRef.current = null;
        gameSessionRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, devMode]); // Include devMode to reinitialize engine with debug mode

  const handleStart = (isDevMode = false) => {
    // Clear any saved game when starting fresh
    SavedGameState.clear();
    setScore(0);
    setWave(1);
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
    // Clear saved game on restart after game over
    SavedGameState.clear();
    setScore(0);
    setWave(1);
    setGameState('playing');
  };

  const handleMenu = () => {
    // Save game state ONLY if game is active (not game over)
    if (gameState === 'playing' && engineRef.current && gameSessionRef.current) {
      const engine = engineRef.current;
      const session = gameSessionRef.current;
      
      // Only save if game is still running (not game over)
      if (session.isActive()) {
        const saveState: SavedGame = {
          gameId: session.getGameId(),
          score: engine.getScore(),
          wave: engine.getWave(),
          timestamp: Date.now(),
          // Get engine state for restoration
          energyDots: engine.getEnergyDotsState(),
          boids: engine.getBoidsState()
        };
        
        SavedGameState.save(saveState);
        console.log('[GAME] Saved game state for continuation');
      }
    }
    
    setGameState('menu');
  };

  const handleShowLeaderboard = () => {
    setGameState('leaderboard');
  };

  return (
    <div className={gameState === 'leaderboard' ? '' : 'game-container'}>
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