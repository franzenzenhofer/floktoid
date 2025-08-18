import { Home } from 'lucide-react';

interface HomeButtonProps {
  onClick: () => void;
}

export function HomeButton({ onClick }: HomeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 p-2 bg-black/50 hover:bg-black/70 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg transition-all duration-200 group"
      aria-label="Return to menu"
      style={{ zIndex: 1000 }}
    >
      <Home 
        size={16} 
        className="text-cyan-500/50 group-hover:text-cyan-500 transition-colors"
      />
    </button>
  );
}