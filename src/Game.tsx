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
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('floktoid-highscore');
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    if (gameState === 'playing' && canvasRef.current) {
      engineRef.current = new NeonFlockEngine(canvasRef.current);
      
      engineRef.current.onScoreUpdate = (newScore) => {
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('floktoid-highscore', newScore.toString());
        }
      };
      
      engineRef.current.onWaveUpdate = setWave;
      engineRef.current.onGameOver = () => setGameState('gameover');
      
      engineRef.current.start();
      
      return () => {
        engineRef.current?.destroy();
      };
    }
  }, [gameState, highScore]);

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
          <HUD score={score} wave={wave} />
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