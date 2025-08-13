import { describe, it, expect, vi } from 'vitest';
import { render, act, renderHook } from '@testing-library/react';
import React from 'react';
import { GameProvider, useGame } from '../../src/context/GameContext';
import { DIFFICULTIES } from '../../src/constants/gameConfig';

// Mock the utils
vi.mock('../../src/utils/grid', () => ({
  generateSolvableGrid: vi.fn((size, colors) => {
    const grid = Array(size).fill(null).map(() => Array(size).fill(0));
    return { grid, moves: 0 };
  }),
  applyMove: vi.fn((grid, row, col, power, colors) => {
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = (newGrid[row][col] + 1) % colors;
    return newGrid;
  }),
  checkWin: vi.fn((grid) => {
    const firstValue = grid[0][0];
    return grid.every(row => row.every(cell => cell === firstValue));
  })
}));

vi.mock('../../src/utils/score', () => ({
  calculateScore: vi.fn((moves, time, difficulty, hintsUsed, powerUsed, optimalMoves) => {
    return 1000 - moves * 10 - hintsUsed * 50 - powerUsed * 30;
  })
}));

describe('GameContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  // Helper to create a valid NEW_GAME payload
  const createNewGamePayload = (level = 1) => ({
    level,
    grid: [[0, 1], [1, 0]],
    solved: [[0, 0], [0, 0]],
    power: new Set<string>(),
    locked: new Map<string, number>(),
    solution: [],
    reverse: [],
    optimalPath: [],
    playerMoves: []
  });

  it('provides initial state', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    expect(result.current.state.started).toBe(false);
    expect(result.current.state.level).toBe(1);
    expect(result.current.state.grid).toEqual([]);
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.time).toBe(0);
    expect(result.current.state.won).toBe(false);
  });

  describe('NEW_GAME action', () => {
    it('starts a new game at specified level', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      const mockGrid = [[0, 1], [1, 0]];
      act(() => {
        result.current.dispatch({ 
          type: 'NEW_GAME', 
          payload: {
            level: 5,
            grid: mockGrid,
            solved: [[0, 0], [0, 0]],
            power: new Set<string>(),
            locked: new Map<string, number>(),
            solution: [],
            reverse: [],
            optimalPath: [],
            playerMoves: []
          }
        });
      });
      
      expect(result.current.state.started).toBe(true);
      expect(result.current.state.level).toBe(5);
      expect(result.current.state.grid).toEqual(mockGrid);
      expect(result.current.state.moves).toBe(0);
      expect(result.current.state.showTutorial).toBe(false);
    });

    it('enables hints for tutorial levels', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      act(() => {
        result.current.dispatch({ 
          type: 'NEW_GAME', 
          payload: {
            level: 2,
            grid: [[0]],
            solved: [[0]],
            power: new Set<string>(),
            locked: new Map<string, number>(),
            solution: [],
            reverse: [],
            optimalPath: [],
            playerMoves: []
          }
        });
      });
      
      expect(result.current.state.showHints).toBe(true);
      expect(result.current.state.hintsEnabled).toBe(true);
    });

    it('configures undos based on level', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      act(() => {
        result.current.dispatch({ 
          type: 'NEW_GAME', 
          payload: {
            level: 25,
            grid: [[0]],
            solved: [[0]],
            power: new Set<string>(),
            locked: new Map<string, number>(),
            solution: [],
            reverse: [],
            optimalPath: [],
            playerMoves: []
          }
        });
      });
      
      expect(result.current.state.maxUndos).toBe(10);
    });
  });

  describe('TOGGLE_SETTINGS action', () => {
    it('toggles settings modal', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      expect(result.current.state.showSettings).toBe(false);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_SETTINGS' });
      });
      
      expect(result.current.state.showSettings).toBe(true);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_SETTINGS' });
      });
      
      expect(result.current.state.showSettings).toBe(false);
    });
  });

  describe('TOGGLE_SOUND action', () => {
    it('toggles sound setting', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      expect(result.current.state.soundEnabled).toBe(true);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_SOUND' });
      });
      
      expect(result.current.state.soundEnabled).toBe(false);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_SOUND' });
      });
      
      expect(result.current.state.soundEnabled).toBe(true);
    });
  });

  describe('SELECT_DIFFICULTY action', () => {
    it('updates selected difficulty', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      act(() => {
        result.current.dispatch({ type: 'SELECT_DIFFICULTY', difficulty: 'hard' });
      });
      
      expect(result.current.state.difficulty).toBe('hard');
    });
  });

  describe('CLICK action', () => {
    it('applies move and increments move count', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ 
          type: 'NEW_GAME', 
          payload: {
            level: 1,
            grid: [[0, 1], [1, 0]],
            solved: [[0, 0], [0, 0]],
            power: new Set<string>(),
            locked: new Map<string, number>(),
            solution: [],
            reverse: [],
            optimalPath: [],
            playerMoves: []
          }
        });
      });
      
      const initialMoves = result.current.state.moves;
      
      act(() => {
        result.current.dispatch({ type: 'CLICK', row: 0, col: 0 });
      });
      
      expect(result.current.state.moves).toBe(initialMoves + 1);
      expect(result.current.state.playerMoves).toContain('0-0');
    });

    it('tracks move in analytics', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload() });
      });
      
      act(() => {
        result.current.dispatch({ type: 'CLICK', row: 1, col: 2 });
      });
      
      expect(result.current.state.playerMoves).toContain('1-2');
    });
  });

  describe('TOGGLE_PAUSE action', () => {
    it('toggles pause state during game', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload() });
      });
      
      expect(result.current.state.paused).toBe(false);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_PAUSE' });
      });
      
      expect(result.current.state.paused).toBe(true);
    });
  });

  describe('TOGGLE_HINTS action', () => {
    it('toggles hints and tracks usage', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload() });
      });
      
      expect(result.current.state.showHints).toBe(true);
      expect(result.current.state.hintsUsed).toBe(0);
      
      act(() => {
        result.current.dispatch({ type: 'TOGGLE_HINTS' });
      });
      
      expect(result.current.state.showHints).toBe(false);
      expect(result.current.state.hintsUsed).toBe(0);
    });
  });

  describe('SHOW_MODAL action', () => {
    it('shows victory modal', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      act(() => {
        result.current.dispatch({ type: 'SHOW_MODAL', modal: 'victory' });
      });
      
      expect(result.current.state.showVictory).toBe(true);
    });

    it('shows tutorial modal', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      act(() => {
        result.current.dispatch({ type: 'SHOW_MODAL', modal: 'tutorial' });
      });
      
      expect(result.current.state.showTutorial).toBe(true);
    });

    it('hides all modals when null', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Show some modals first
      act(() => {
        result.current.dispatch({ type: 'SHOW_MODAL', modal: 'victory' });
      });
      
      act(() => {
        result.current.dispatch({ type: 'SHOW_MODAL', modal: null });
      });
      
      expect(result.current.state.showVictory).toBe(false);
      expect(result.current.state.showTutorial).toBe(false);
    });
  });

  describe('RESTART action', () => {
    it('restarts game with same difficulty', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload(11) });
      });
      
      // Make some moves
      act(() => {
        result.current.dispatch({ type: 'CLICK', row: 0, col: 0 });
        result.current.dispatch({ type: 'TICK' });
      });
      
      act(() => {
        result.current.dispatch({ type: 'RESTART' });
      });
      
      expect(result.current.state.level).toBe(11);
      expect(result.current.state.moves).toBe(0);
      expect(result.current.state.time).toBe(0);
      expect(result.current.state.started).toBe(true);
    });
  });

  describe('TICK action', () => {
    it('increments time when game is running', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game first
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload() });
      });
      
      const initialTime = result.current.state.time;
      
      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });
      
      expect(result.current.state.time).toBe(initialTime + 1);
    });

    it('does not increment when paused', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game and pause
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload() });
        result.current.dispatch({ type: 'TOGGLE_PAUSE' });
      });
      
      const pausedTime = result.current.state.time;
      
      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });
      
      expect(result.current.state.time).toBe(pausedTime);
    });
  });

  describe('RESET action', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useGame(), { wrapper });
      
      // Start game and make changes
      act(() => {
        result.current.dispatch({ type: 'NEW_GAME', payload: createNewGamePayload(21) });
        result.current.dispatch({ type: 'CLICK', row: 0, col: 0 });
      });
      
      act(() => {
        result.current.dispatch({ type: 'RESET' });
      });
      
      expect(result.current.state.started).toBe(false);
      expect(result.current.state.difficulty).toBe('easy');
      expect(result.current.state.grid).toEqual([]);
    });
  });
});