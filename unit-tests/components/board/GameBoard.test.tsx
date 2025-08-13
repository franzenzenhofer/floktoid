import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameBoard } from '@/components/board/GameBoard';
import { GameContext } from '@/context/GameContext';
import { useDynamicHint } from '@/hooks/useDynamicHint';
import { useSolvabilityCheck } from '@/hooks/useSolvabilityCheck';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, transition, style, className, ...props }: any) => 
      React.createElement('div', { style, className, ...props }, children)
  }
}));

// Mock hooks
vi.mock('@/hooks/useDynamicHint');
vi.mock('@/hooks/useSolvabilityCheck');

// Mock Tile component
vi.mock('@/components/board/Tile', () => ({
  default: ({ value, power, locked, lockCount, highlight, onClick, disabled, row, col }: any) => (
    <div
      data-testid={`tile-${row}-${col}`}
      data-value={value}
      data-power={power}
      data-locked={locked}
      data-lock-count={lockCount}
      data-highlight={highlight}
      data-disabled={disabled}
      onClick={onClick}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      {value}
    </div>
  )
}));

const mockDispatch = vi.fn();

const createMockState = (overrides = {}) => ({
  grid: [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1]
  ],
  power: new Map(),
  locked: new Map(),
  started: true,
  won: false,
  paused: false,
  difficulty: 'easy' as const,
  showHints: false,
  optimalPath: [],
  playerMoves: [],
  showVictory: false,
  ...overrides
});

const renderWithContext = (state: any) => {
  return render(
    <GameContext.Provider value={{ state, dispatch: mockDispatch }}>
      <GameBoard />
    </GameContext.Provider>
  );
};

describe('GameBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDynamicHint as any).mockReturnValue({
      nextMove: null,
      isCalculating: false,
      isOnOptimalPath: false
    });
    (useSolvabilityCheck as any).mockReturnValue({
      isSolvable: true,
      isChecking: false
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the game board with correct grid', () => {
    renderWithContext(createMockState());

    // Check if all tiles are rendered
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const tile = screen.getByTestId(`tile-${r}-${c}`);
        expect(tile).toBeInTheDocument();
      }
    }
  });

  it('should not render when game has not started', () => {
    renderWithContext(createMockState({ started: false }));
    expect(screen.queryByTestId('tile-0-0')).not.toBeInTheDocument();
  });

  it('should not render when grid is empty', () => {
    renderWithContext(createMockState({ grid: [] }));
    expect(screen.queryByTestId('tile-0-0')).not.toBeInTheDocument();
  });

  it('should handle tile clicks correctly', () => {
    renderWithContext(createMockState());

    const tile = screen.getByTestId('tile-0-0');
    fireEvent.click(tile);

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLICK', row: 0, col: 0 });
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOCK_DECR' });
  });

  it('should not handle clicks when game is paused', () => {
    renderWithContext(createMockState({ paused: true }));

    const tile = screen.getByTestId('tile-0-0');
    fireEvent.click(tile);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should not handle clicks when game is won', () => {
    renderWithContext(createMockState({ won: true }));

    const tile = screen.getByTestId('tile-0-0');
    fireEvent.click(tile);

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should show hint when enabled', () => {
    (useDynamicHint as any).mockReturnValue({
      nextMove: { row: 1, col: 1 },
      isCalculating: false,
      isOnOptimalPath: true
    });

    renderWithContext(createMockState({ showHints: true }));

    const hintTile = screen.getByTestId('tile-1-1');
    expect(hintTile).toHaveAttribute('data-highlight', 'true');
    expect(screen.getByText(/Hint: Click the highlighted tile/)).toBeInTheDocument();
    expect(screen.getByText(/optimal path/)).toBeInTheDocument();
  });

  it('should show calculating hint message', () => {
    (useDynamicHint as any).mockReturnValue({
      nextMove: { row: 1, col: 1 },
      isCalculating: true,
      isOnOptimalPath: false
    });

    renderWithContext(createMockState({ showHints: true }));

    expect(screen.getByText(/calculating.../)).toBeInTheDocument();
  });

  it('should show unsolvable warning', () => {
    (useSolvabilityCheck as any).mockReturnValue({
      isSolvable: false,
      isChecking: false
    });

    renderWithContext(createMockState());

    expect(screen.getByText(/Warning: Puzzle has become unsolvable!/)).toBeInTheDocument();
  });

  it('should not show unsolvable warning when checking', () => {
    (useSolvabilityCheck as any).mockReturnValue({
      isSolvable: false,
      isChecking: true
    });

    renderWithContext(createMockState());

    expect(screen.queryByText(/Warning: Puzzle has become unsolvable!/)).not.toBeInTheDocument();
  });

  it('should show victory modal after winning', async () => {
    vi.useFakeTimers();
    renderWithContext(createMockState({ won: true }));

    // Wait for the timeout
    vi.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: 'victory' });
    });

    vi.useRealTimers();
  });

  it('should not show victory modal if already shown', () => {
    vi.useFakeTimers();
    renderWithContext(createMockState({ won: true, showVictory: true }));

    vi.advanceTimersByTime(2000);

    expect(mockDispatch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should render power tiles correctly', () => {
    const powerMap = new Map([['0-0', true]]);
    renderWithContext(createMockState({ power: powerMap }));

    const powerTile = screen.getByTestId('tile-0-0');
    expect(powerTile).toHaveAttribute('data-power', 'true');
  });

  it('should render locked tiles correctly', () => {
    const lockedMap = new Map([['1-1', 3]]);
    renderWithContext(createMockState({ locked: lockedMap }));

    const lockedTile = screen.getByTestId('tile-1-1');
    expect(lockedTile).toHaveAttribute('data-locked', 'true');
    expect(lockedTile).toHaveAttribute('data-lock-count', '3');
  });

  it('should handle window resize', () => {
    const { container } = renderWithContext(createMockState());

    // Trigger resize
    global.innerWidth = 500;
    global.innerHeight = 800;
    fireEvent(window, new Event('resize'));

    // Board should still be rendered
    expect(container.querySelector('.grid')).toBeInTheDocument();
  });

  it('should render victory celebration overlay', () => {
    renderWithContext(createMockState({ won: true, showVictory: false }));

    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should not show hint when game is won', () => {
    (useDynamicHint as any).mockReturnValue({
      nextMove: { row: 1, col: 1 },
      isCalculating: false,
      isOnOptimalPath: true
    });

    renderWithContext(createMockState({ showHints: true, won: true }));

    expect(screen.queryByText(/Hint: Click the highlighted tile/)).not.toBeInTheDocument();
  });

  it('should render larger grids correctly', () => {
    const largeGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    renderWithContext(createMockState({ grid: largeGrid }));

    // Check if 10x10 = 100 tiles are rendered
    const tiles = screen.getAllByTestId(/tile-\d+-\d+/);
    expect(tiles).toHaveLength(100);
  });

  it('should cleanup resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderWithContext(createMockState());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('should cleanup victory timer on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = renderWithContext(createMockState({ won: true }));

    unmount();
    vi.advanceTimersByTime(2000);

    // Should not dispatch after unmount
    expect(mockDispatch).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});