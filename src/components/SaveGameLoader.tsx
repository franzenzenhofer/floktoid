import React, { useEffect } from 'react';
import { useSaveGame } from '../hooks/useSaveGame';

/**
 * Component that loads saved game on mount
 * This is placed at the root to ensure saves are loaded before any UI renders
 */
const SaveGameLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loadSavedGame } = useSaveGame();
  
  useEffect(() => {
    // Load saved game on mount
    loadSavedGame();
  }, [loadSavedGame]);
  
  return <>{children}</>;
};

export default SaveGameLoader;