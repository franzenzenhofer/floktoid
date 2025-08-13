

interface StartScreenProps {
  onStart: () => void;
  highScore: number;
}

export function StartScreen({ onStart, highScore }: StartScreenProps) {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 md:space-y-8 max-w-lg">
        <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-2">
          <span className="neon-text">NEON</span>{' '}
          <span className="neon-pink">FLOCK</span>
        </h1>
        
        <div className="text-sm sm:text-lg md:text-xl neon-yellow pulse-neon">
          DEFEND YOUR ENERGY CORES
        </div>
        
        <div className="space-y-2 md:space-y-4 text-gray-400">
          <p className="text-sm sm:text-base md:text-lg">
            🎯 Click and drag to launch asteroids
          </p>
          <p className="text-sm sm:text-base md:text-lg">
            ⚡ Stop the flock from stealing energy
          </p>
          <p className="text-sm sm:text-base md:text-lg">
            🌟 Survive increasingly intense waves
          </p>
        </div>
        
        {highScore > 0 && (
          <div className="text-lg sm:text-xl md:text-2xl neon-yellow">
            HIGH SCORE: {highScore.toString().padStart(6, '0')}
          </div>
        )}
        
        <button
          onClick={onStart}
          className="px-8 sm:px-12 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl font-bold bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
        >
          START GAME
        </button>
        
        <div className="text-xs sm:text-sm text-gray-600 mt-4 md:mt-8">
          Built with TypeScript + Pixi.js + Vite
        </div>
      </div>
    </div>
  );
}