import React, { useState } from 'react';
import { Home, HelpCircle } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import HowToPlayModal from '../modals/HowToPlayModal';

const Header: React.FC = () => {
  const { state } = useGame();
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const handleHomeClick = () => {
    // Reset the game state to go back to start screen
    if (state.started) {
      window.location.reload();
    }
  };

  return (
    <>
      <header className="bg-black/20 backdrop-blur-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-2 flex justify-between items-center">
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
          >
            <Home size={16} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium">Color Me Same</span>
          </button>
          
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setShowHowToPlay(true);
            }}
            className="text-white/80 hover:text-white transition-colors group"
            aria-label="How to Play"
          >
            <HelpCircle size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </header>
      
      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
    </>
  );
};

export default Header;