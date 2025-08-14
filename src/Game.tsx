import { useEffect, useRef, useState } from 'react';
import { NeonFlockEngine } from './engine/NeonFlockEngine';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { DevConsole } from './components/DevConsole';

export function Game() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NeonFlockEngine | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
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
          
          // CRITICAL FIX: Use stable highScore reference to prevent re-initialization loops
          const currentHighScore = highScore;
          engine.onScoreUpdate = (newScore) => {
            setScore(newScore);
            if (newScore > currentHighScore) {
              setHighScore(newScore);
              localStorage.setItem('floktoid-highscore', newScore.toString());
            }
          };
          
          engine.onWaveUpdate = setWave;
          engine.onEnergyStatus = (critical: boolean) => setEnergyCritical(critical);
          engine.onGameOver = () => setGameState('gameover');
          
          engine.start();
          engineRef.current = engine;
        } catch (error) {
          console.error('[GAME] Failed to initialize engine:', error);
        }
      };
      
      initEngine();
      
      return () => {
        engineRef.current?.destroy();
        engineRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, devMode]); // Include devMode to reinitialize engine with debug mode

  const handleStart = (isDevMode = false) => {
    setScore(0);
    setWave(1);
    setDevMode(isDevMode);
    if (isDevMode) {
      console.log('[DEV MODE] Starting game in development mode');
    }
    setGameState('playing');
  };

  const handleRestart = () => {
    setScore(0);
    setWave(1);
    setGameState('playing');
  };

  const handleMenu = () => {
    setGameState('menu');
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden">
      {gameState === 'menu' && (
        <StartScreen onStart={handleStart} highScore={highScore} />
      )}
      
      {gameState === 'playing' && (
        <>
          <div ref={canvasRef} className="fixed inset-0 w-full h-full" />
          <HUD score={score} wave={wave} energyCritical={energyCritical} />
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
    </div>
  );
}