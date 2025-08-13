import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import PowerUps from '../../../src/components/hud/PowerUps';

// Mock state
const mockState = {
  started: false,
  won: false,
  paused: false,
  difficulty: 'easy' as const,
  hintsEnabled: false,
  undoHistory: [],
  undoCount: 0,
  maxUndos: -1
};

const mockDispatch = vi.fn();

// Mock the useGame hook
vi.mock('../../../src/context/GameContext', () => ({
  useGame: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) => 
      <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => 
      <button {...props}>{children}</button>
  }
}));

describe('PowerUps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.started = false;
    mockState.won = false;
    mockState.paused = false;
    mockState.difficulty = 'easy';
    mockState.hintsEnabled = false;
    mockState.undoHistory = [];
    mockState.undoCount = 0;
    mockState.maxUndos = -1;
  });

  it('does not render when game has not started', () => {
    render(<PowerUps />);
    expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  });

  it('renders all three power-up buttons when game started', () => {
    mockState.started = true;
    render(<PowerUps />);
    
    expect(screen.getByText('Undo')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Hint')).toBeInTheDocument();
  });

  it('shows unlimited symbol for easy mode', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<PowerUps />);
    
    const infinitySymbols = screen.getAllByText('∞');
    expect(infinitySymbols).toHaveLength(3); // All three buttons show unlimited
  });

  it('disables undo when no history', () => {
    mockState.started = true;
    mockState.undoHistory = [];
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    expect(undoButton).toBeDisabled();
  });

  it('enables undo when history exists', () => {
    mockState.started = true;
    mockState.undoHistory = [{ grid: [[1]], moves: 1 } as any];
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    expect(undoButton).not.toBeDisabled();
  });

  it('shows undo count for non-easy modes', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    mockState.maxUndos = 3;
    mockState.undoCount = 1;
    render(<PowerUps />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // 3 - 1 = 2 remaining
  });

  it('disables undo when max undos reached', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    mockState.undoHistory = [{ grid: [[1]], moves: 1 } as any];
    mockState.maxUndos = 3;
    mockState.undoCount = 3;
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    expect(undoButton).toBeDisabled();
  });

  it('dispatches UNDO action when undo clicked', () => {
    mockState.started = true;
    mockState.undoHistory = [{ grid: [[1]], moves: 1 } as any];
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button')!;
    fireEvent.click(undoButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'UNDO' });
  });

  it('dispatches RESET action when reset clicked', () => {
    mockState.started = true;
    render(<PowerUps />);
    
    const resetButton = screen.getByText('Reset').closest('button')!;
    fireEvent.click(resetButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET' });
  });

  it('dispatches TOGGLE_HINTS action when hint clicked', () => {
    mockState.started = true;
    render(<PowerUps />);
    
    const hintButton = screen.getByText('Hint').closest('button')!;
    fireEvent.click(hintButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'TOGGLE_HINTS' });
  });

  it('shows hint button as active when hints enabled', () => {
    mockState.started = true;
    mockState.hintsEnabled = true;
    render(<PowerUps />);
    
    const hintButton = screen.getByText('Hint').closest('button');
    expect(hintButton).toHaveClass('bg-green-500');
  });

  it('disables all buttons when game is won', () => {
    mockState.started = true;
    mockState.won = true;
    mockState.undoHistory = [{ grid: [[1]], moves: 1 } as any];
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    const resetButton = screen.getByText('Reset').closest('button');
    const hintButton = screen.getByText('Hint').closest('button');
    
    expect(undoButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
    expect(hintButton).toBeDisabled();
  });

  it('disables all buttons when game is paused', () => {
    mockState.started = true;
    mockState.paused = true;
    mockState.undoHistory = [{ grid: [[1]], moves: 1 } as any];
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    const resetButton = screen.getByText('Reset').closest('button');
    const hintButton = screen.getByText('Hint').closest('button');
    
    expect(undoButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
    expect(hintButton).toBeDisabled();
  });

  it('has correct grid layout', () => {
    mockState.started = true;
    render(<PowerUps />);
    
    const container = screen.getByText('Undo').closest('.grid');
    expect(container).toHaveClass('grid-cols-3', 'gap-1');
  });

  it('buttons have correct tooltips', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    mockState.maxUndos = 3;
    mockState.undoCount = 1;
    render(<PowerUps />);
    
    const undoButton = screen.getByText('Undo').closest('button');
    expect(undoButton).toHaveAttribute('title', 'Undo last move (2 left)');
    
    const resetButton = screen.getByText('Reset').closest('button');
    expect(resetButton).toHaveAttribute('title', 'Reset to start position');
    
    const hintButton = screen.getByText('Hint').closest('button');
    expect(hintButton).toHaveAttribute('title', 'Show next move');
  });
});