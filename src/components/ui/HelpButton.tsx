import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HowToPlayModal from '../modals/HowToPlayModal';

const HelpButton: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <button
        onClick={() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setShowHelp(true);
        }}
        className="fixed bottom-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 
                   backdrop-blur-sm rounded-full flex items-center justify-center
                   text-white/60 hover:text-white/80 transition-all duration-200
                   shadow-sm hover:shadow-md z-40"
        aria-label="Help"
      >
        <HelpCircle size={16} />
      </button>
      
      <HowToPlayModal 
        isOpen={showHelp} 
        onClose={() => setShowHelp(false)} 
      />
    </>
  );
};

export default HelpButton;