

interface HUDProps {
  score: number;
  wave: number;
}

export function HUD({ score, wave }: HUDProps) {
  return (
    <>
      <div className="fixed top-2 sm:top-3 md:top-5 left-2 sm:left-3 md:left-5 font-bold text-2xl sm:text-3xl md:text-5xl neon-text select-none pointer-events-none">
        {score.toString().padStart(6, '0')}
      </div>
      <div className="fixed top-2 sm:top-3 md:top-5 right-2 sm:right-3 md:right-5 font-bold text-xl sm:text-2xl md:text-3xl neon-pink select-none pointer-events-none">
        WAVE {wave}
      </div>
    </>
  );
}