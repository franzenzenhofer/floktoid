import React from 'react';

interface GameOverScreenProps {
  score: number;
  wave: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

export function GameOverScreen({ score, wave, highScore, onRestart, onMenu }: GameOverScreenProps) {
  const isNewHighScore = score >= highScore;
  
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-8xl font-bold neon-pink glitch">
          GAME OVER
        </h1>
        
        {isNewHighScore && (
          <div className="text-4xl neon-yellow pulse-neon">
            NEW HIGH SCORE!
          </div>
        )}
        
        <div className="space-y-4">
          <div className="text-3xl neon-text">
            SCORE: {score.toString().padStart(6, '0')}
          </div>
          <div className="text-2xl text-cyan-400">
            WAVE REACHED: {wave}
          </div>
          {!isNewHighScore && (
            <div className="text-xl text-gray-400">
              HIGH SCORE: {highScore.toString().padStart(6, '0')}
            </div>
          )}
        </div>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 text-xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onMenu}
            className="px-8 py-3 text-xl font-bold bg-transparent border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}