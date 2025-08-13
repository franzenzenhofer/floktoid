import { useEffect, useRef, useState } from 'react';
import { NeonFlockEngine } from './engine/NeonFlockEngine';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverScreen } from './components/GameOverScreen';

export function Game() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<NeonFlockEngine | null>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore] = useState(0);
  const [wave, setWave] = useState(1);
  const [energyCritical, setEnergyCritical] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('floktoid-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      const initEngine = async () => {
        try {
          const engine = new NeonFlockEngine(canvasRef.current!);
          await engine.initialize();
          
          engine.onScoreUpdate = (newScore) => {
            setScore(newScore);
            if (newScore > highScore) {
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
  }, [gameState]); // Intentionally exclude highScore - it was causing engine to reset!

  const handleStart = () => {
    setScore(0);
    setWave(1);
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