/**
 * @fileoverview Main Application Component for Color Me Same
 * 
 * This is the root component that sets up the entire game application.
 * It provides the game context to all child components and manages the
 * top-level layout and modal states.
 * 
 * Architecture:
 * - GameProvider: Wraps everything with game state context
 * - PageShell: Provides responsive layout container
 * - Component hierarchy organized by function (HUD, Board, Modals)
 * 
 * The app uses a centralized state management pattern where all game
 * state lives in the GameContext and components dispatch actions to
 * update it. This ensures predictable state updates and easy debugging.
 * 
 * @module App
 */

import React from 'react';
import { GameProvider } from './context/GameContext';
import { ToastProvider } from './context/ToastContext';
import AppContent from './components/AppContent';

/**
 * Root Application Component
 * 
 * Renders the complete game UI with all necessary components:
 * - StartScreen: Initial game menu
 * - Dashboard: Stats display (timer, moves, score)
 * - PowerUps: Action buttons (undo, reset, hints)
 * - GameBoard: The main puzzle grid
 * - ColorCycleInfo: Shows color progression
 * - ProgressBar: Level and XP progress
 * - Modals: Victory, tutorial, and achievement popups
 * 
 * @component
 * @returns {JSX.Element} The complete game application
 */
const App: React.FC = () => {
  return (
    <GameProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </GameProvider>
  );
};

export default App;