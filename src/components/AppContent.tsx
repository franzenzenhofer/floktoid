import React, { useState } from 'react';
import PageShell from './layout/PageShell';
import GameBoard from './board/GameBoard';
import CompactDashboard from './hud/CompactDashboard';
import PowerUps from './hud/PowerUps';
import ColorCycleInfo from './hud/ColorCycleInfo';
import VictoryModal from './modals/VictoryModal';
import TutorialModal from './modals/TutorialModal';
import AchievementModal from './modals/AchievementModal';
import StartScreen from './screens/StartScreen';
import { VersionInfo } from './VersionInfo';
import Header from './layout/Header';
import SaveGameLoader from './SaveGameLoader';
import WinDetector from './WinDetector';

const AppContent: React.FC = () => {
  
  // Local state for achievement modal (not in game state as it's UI-only)
  const [achievementModal, setAchievementModal] = useState<{
    isOpen: boolean;
    achievements: string[];
  }>({ isOpen: false, achievements: [] });

  const showAchievements = (achievements: string[]) => {
    setAchievementModal({ isOpen: true, achievements });
  };

  const closeAchievements = () => {
    setAchievementModal({ isOpen: false, achievements: [] });
  };

  return (
    <SaveGameLoader>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Header />
        <PageShell>
          <StartScreen />
          <CompactDashboard />
          <PowerUps />
          <GameBoard />
          <ColorCycleInfo />
          <WinDetector />
          <TutorialModal />
          <VictoryModal onShowAchievements={showAchievements} />
          <AchievementModal
            isOpen={achievementModal.isOpen}
            achievements={achievementModal.achievements}
            onClose={closeAchievements}
          />
          <VersionInfo />
        </PageShell>
      </div>
    </SaveGameLoader>
  );
};

export default AppContent;