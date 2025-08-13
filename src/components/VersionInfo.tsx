import { useGame } from '../context/GameContext';
import { displayVersion, displayDate, displayCommit } from '../version';
import { CreatorCredit } from './CreatorCredit';

export function VersionInfo() {
  const { state } = useGame();
  
  // Only show on start screen
  if (state.started) return null;
  
  return (
    <div className="text-center mt-8">
      <div className="mb-2">
        <CreatorCredit />
      </div>
      <div className="text-white/40 text-sm font-mono">
        <div className="bg-black/20 rounded-lg px-4 py-2 inline-block">
          {displayVersion} | {displayDate} | {displayCommit}
        </div>
      </div>
    </div>
  );
}