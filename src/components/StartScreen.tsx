import React from 'react';

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
}

export function StartScreen({ onStart, highScore }: StartScreenProps) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      <div className="text-center space-y-8">
        <h1 className="text-8xl font-bold mb-2">
          <span className="neon-text">NEON</span>{' '}
          <span className="neon-pink">FLOCK</span>
        </h1>
        
        <div className="text-xl neon-yellow pulse-neon">
          DEFEND YOUR ENERGY CORES
        </div>
        
        <div className="space-y-4 text-gray-400">
          <p className="text-lg">
            🎯 Click and drag to launch asteroids
          </p>
          <p className="text-lg">
            ⚡ Stop the flock from stealing energy
          </p>
          <p className="text-lg">
            🌟 Survive increasingly intense waves
          </p>
        </div>
        
        {highScore > 0 && (
          <div className="text-2xl neon-yellow">
            HIGH SCORE: {highScore.toString().padStart(6, '0')}
          </div>
        )}
        
        <button
          onClick={onStart}
          className="px-12 py-4 text-2xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
        >
          START GAME
        </button>
        
        <div className="text-sm text-gray-600 mt-8">
          Built with TypeScript + Pixi.js + Vite
        </div>
      </div>
    </div>
  );
}