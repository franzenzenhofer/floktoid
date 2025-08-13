import React from 'react';
import { Undo2, RotateCcw, Lightbulb } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { motion } from 'framer-motion';

const PowerUps: React.FC = () => {
  const { state, dispatch } = useGame();
  const { started, won, paused, level, hintsEnabled, undoHistory, undoCount, maxUndos } = state;
  
  // Tutorial levels (1-10) get unlimited undos
  const isTutorialLevel = level <= 10;
  const hasUndos = undoHistory.length > 0;
  const canUndo = hasUndos && (maxUndos === -1 || undoCount < maxUndos);
  const undosRemaining = maxUndos === -1 ? -1 : Math.max(0, maxUndos - undoCount);

  if (!started) return null;

  const disabled = won || paused;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-3 gap-1 mb-2"
    >
      <PowerUpButton
        icon={<Undo2 size={18} />}
        label="Undo"
        count={undosRemaining === -1 ? undefined : undosRemaining}
        showUnlimited={undosRemaining === -1}
        disabled={!canUndo || disabled}
        onClick={() => {
          dispatch({ type: 'UNDO' });
        }}
        tooltip={
          isTutorialLevel 
            ? "Undo last move (unlimited)" 
            : `Undo last move (${undosRemaining} left)`
        }
      />
      
      <PowerUpButton
        icon={<RotateCcw size={18} />}
        label="Reset"
        showUnlimited={isTutorialLevel}
        disabled={disabled}
        onClick={() => {
          dispatch({ type: 'RESET' });
        }}
        tooltip="Reset to start position"
      />
      
      <PowerUpButton
        icon={<Lightbulb size={18} />}
        label="Hint"
        active={hintsEnabled}
        showUnlimited={isTutorialLevel}
        disabled={disabled}
        onClick={() => {
          dispatch({ type: 'TOGGLE_HINTS' });
        }}
        tooltip={isTutorialLevel ? "Show hints (unlimited)" : "Show next move"}
      />
    </motion.div>
  );
};

interface PowerUpButtonProps {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  active?: boolean;
  count?: number;
  showUnlimited?: boolean;
  onClick: () => void;
  tooltip: string;
}

const PowerUpButton: React.FC<PowerUpButtonProps> = ({
  icon,
  label,
  disabled,
  active,
  count,
  showUnlimited,
  onClick,
  tooltip
}) => (
  <motion.button
    whileHover={{ scale: disabled ? 1 : 1.05 }}
    whileTap={{ scale: disabled ? 1 : 0.95 }}
    disabled={disabled}
    onClick={onClick}
    className={`
      relative p-2 rounded-lg flex flex-col items-center gap-0.5 transition-all
      ${active ? 'bg-green-500 text-white' : 'bg-white/10 backdrop-blur-sm text-white'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/20'}
    `}
    title={tooltip}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
    {showUnlimited && (
      <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
        ∞
      </span>
    )}
    {count !== undefined && count > 0 && !showUnlimited && (
      <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-10">
        {count}
      </span>
    )}
  </motion.button>
);

export default PowerUps;