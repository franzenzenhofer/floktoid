import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GameProvider, useGame } from '../GameContext';
import { DIFFICULTIES } from '../../constants/gameConfig';

// Mock the generator hook
vi.mock('../../hooks/useGenerator', () => ({
  useGenerator: () => ({
    generate: vi.fn().mockResolvedValue({
      grid: [[0, 1], [1, 0]],
      solved: [[0, 0], [0, 0]],
      power: new Set(['0-0']),
      locked: new Map([['1-1', 2]]),
      solution: [{ row: 0, col: 0 }],
      reverse: [{ row: 1, col: 1 }],
      optimalPath: [{ row: 0, col: 0 }],
      playerMoves: [],
    }),
  }),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GameProvider>{children}</GameProvider>
);

describe('GameContext', () => {
  it('should provide initial state', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    expect(result.current.state.started).toBe(false);
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.time).toBe(0);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.level).toBe(1);
  });

  it('should handle NEW_GAME action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 15,
          grid: [[1, 2], [3, 0]],
          solved: [[0, 0], [0, 0]],
          power: new Set(['0-1']),
          locked: new Map([['1-0', 3]]),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    expect(result.current.state.started).toBe(true);
    expect(result.current.state.level).toBe(15);
    expect(result.current.state.grid).toEqual([[1, 2], [3, 0]]);
    expect(result.current.state.power.has('0-1')).toBe(true);
    expect(result.current.state.locked.get('1-0')).toBe(3);
    expect(result.current.state.moves).toBe(0);
    expect(result.current.state.won).toBe(false);
  });

  it('should handle CLICK action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    // Start game first
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 1,
          grid: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
          solved: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
          power: new Set(),
          locked: new Map(),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    // Click center tile
    act(() => {
      result.current.dispatch({ type: 'CLICK', row: 1, col: 1 });
    });
    
    expect(result.current.state.moves).toBe(1);
    // Center and adjacent tiles should change
    expect(result.current.state.grid[1][1]).toBe(1);
    expect(result.current.state.grid[0][1]).toBe(1);
    expect(result.current.state.grid[2][1]).toBe(1);
    expect(result.current.state.grid[1][0]).toBe(1);
    expect(result.current.state.grid[1][2]).toBe(1);
  });

  it('should not allow clicks on locked tiles', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 15,
          grid: [[0, 0], [0, 0]],
          solved: [[0, 0], [0, 0]],
          power: new Set(),
          locked: new Map([['0-0', 2]]),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    const gridBefore = [...result.current.state.grid];
    
    act(() => {
      result.current.dispatch({ type: 'CLICK', row: 0, col: 0 });
    });
    
    // Grid should not change
    expect(result.current.state.grid).toEqual(gridBefore);
    expect(result.current.state.moves).toBe(0);
  });

  it('should detect winning state', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 1,
          grid: [[1, 0], [0, 0]], // One move away from winning - click (0,0) makes all 0
          solved: [[0, 0], [0, 0]],
          power: new Set(),
          locked: new Map(),
          solution: [{ row: 0, col: 0 }],
          reverse: [],
          optimalPath: [{ row: 0, col: 0 }],
          playerMoves: [],
        },
      });
    });
    
    act(() => {
      result.current.dispatch({ type: 'CLICK', row: 0, col: 0 });
    });
    
    expect(result.current.state.won).toBe(true);
    expect(result.current.state.score).toBeGreaterThan(0);
    expect(result.current.state.showVictory).toBe(false); // Victory modal shows after delay
  });

  it('should handle TICK action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 1,
          grid: [[0]],
          solved: [[0]],
          power: new Set(),
          locked: new Map(),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    act(() => {
      result.current.dispatch({ type: 'TICK' });
    });
    
    expect(result.current.state.time).toBe(1);
    
    act(() => {
      result.current.dispatch({ type: 'TICK' });
      result.current.dispatch({ type: 'TICK' });
    });
    
    expect(result.current.state.time).toBe(3);
  });

  it('should handle time limit expiration', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 30, // Higher level for time limit testing
          grid: [[0]],
          solved: [[0]],
          power: new Set(),
          locked: new Map(),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    // Advance time to limit
    const timeLimit = DIFFICULTIES.hard.timeLimit;
    for (let i = 0; i < timeLimit; i++) {
      act(() => {
        result.current.dispatch({ type: 'TICK' });
      });
    }
    
    expect(result.current.state.time).toBe(timeLimit);
    expect(result.current.state.paused).toBe(true);
    expect(result.current.state.showVictory).toBe(true);
  });

  it('should handle PAUSE action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({ type: 'PAUSE', paused: true });
    });
    
    expect(result.current.state.paused).toBe(true);
    
    act(() => {
      result.current.dispatch({ type: 'PAUSE', paused: false });
    });
    
    expect(result.current.state.paused).toBe(false);
  });

  it('should handle LOCK_DECR action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    act(() => {
      result.current.dispatch({
        type: 'NEW_GAME',
        payload: {
          level: 15,
          grid: [[0]],
          solved: [[0]],
          power: new Set(),
          locked: new Map([['0-0', 3], ['0-1', 1]]),
          solution: [],
          reverse: [],
          optimalPath: [],
          playerMoves: [],
        },
      });
    });
    
    act(() => {
      result.current.dispatch({ type: 'LOCK_DECR' });
    });
    
    expect(result.current.state.locked.get('0-0')).toBe(2);
    expect(result.current.state.locked.has('0-1')).toBe(false); // Removed when reaches 0
  });

  it('should handle ADD_XP action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    expect(result.current.state.xp).toBe(0);
    expect(result.current.state.belt).toBe('white');
    
    act(() => {
      result.current.dispatch({ type: 'ADD_XP', amount: 600 });
    });
    
    expect(result.current.state.xp).toBe(600);
    expect(result.current.state.belt).toBe('yellow');
    
    act(() => {
      result.current.dispatch({ type: 'ADD_XP', amount: 2500 });
    });
    
    expect(result.current.state.xp).toBe(3100);
    expect(result.current.state.belt).toBe('green');
  });

  it('should handle UNLOCK_ACHIEVEMENT action', () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    
    expect(result.current.state.achievements).toEqual([]);
    
    act(() => {
      result.current.dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: 'first_win' });
    });
    
    expect(result.current.state.achievements).toContain('first_win');
    
    // Should not duplicate achievements
    act(() => {
      result.current.dispatch({ type: 'UNLOCK_ACHIEVEMENT', id: 'first_win' });
    });
    
    expect(result.current.state.achievements).toEqual(['first_win']);
  });
});