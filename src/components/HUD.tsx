import React from 'react';

interface HUDProps {
  score: number;
  wave: number;
}

export function HUD({ score, wave }: HUDProps) {
  return (
    <>
      <div className="fixed top-5 left-5 font-bold text-5xl neon-text select-none pointer-events-none">
        {score.toString().padStart(6, '0')}
      </div>
      <div className="fixed top-5 right-5 font-bold text-3xl neon-pink select-none pointer-events-none">
        WAVE {wave}
      </div>
    </>
  );
}