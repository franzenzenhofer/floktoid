import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Dashboard from '../../../src/components/hud/Dashboard';
import { DIFFICULTIES } from '../../../src/constants/gameConfig';

// Mock state
const mockState = {
  started: false,
  time: 0,
  moves: 0,
  score: 0,
  difficulty: 'easy' as const,
  won: false,
  level: 1
};

const mockDispatch = vi.fn();

// Mock the useGame hook
vi.mock('../../../src/context/GameContext', () => ({
  useGame: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
}));

// Mock the useTimer hook
vi.mock('../../../src/hooks/useTimer', () => ({
  useTimer: vi.fn()
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) => 
      <div {...props}>{children}</div>
  }
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.started = false;
    mockState.time = 0;
    mockState.moves = 0;
    mockState.score = 0;
    mockState.difficulty = 'easy';
    mockState.won = false;
    mockState.level = 1;
  });

  it('does not render when game has not started', () => {
    render(<Dashboard />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders all stats when game has started', () => {
    mockState.started = true;
    render(<Dashboard />);
    
    // Check for level display
    expect(screen.getByText('L1')).toBeInTheDocument();
    
    // Check for moves (appears with /∞)
    const moveElements = screen.getAllByText(/0/);
    expect(moveElements.length).toBeGreaterThan(0);
    
    // Check for time
    expect(screen.getByText('0:00')).toBeInTheDocument();
    
    // Check for difficulty
    expect(screen.getByText('EASY')).toBeInTheDocument();
  });

  it('formats time correctly', () => {
    mockState.started = true;
    mockState.time = 125; // 2:05
    render(<Dashboard />);
    
    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('shows time limit for timed modes', () => {
    mockState.started = true;
    mockState.difficulty = 'hard';
    mockState.time = 30;
    render(<Dashboard />);
    
    const timeLimit = DIFFICULTIES.hard.timeLimit;
    const remaining = timeLimit - 30;
    const expectedTime = `${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`;
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('shows danger state when time is critical', () => {
    mockState.started = true;
    mockState.difficulty = 'hard';
    mockState.time = DIFFICULTIES.hard.timeLimit - 20; // Less than 30 seconds remaining
    render(<Dashboard />);
    
    // Find the timer stat by looking for the Timer icon's parent
    const timerContainer = screen.getByText(/\d+:\d+/).closest('.flex-col');
    const timerValue = timerContainer?.querySelector('.text-base');
    expect(timerValue).toHaveClass('text-red-400');
  });

  it('shows max moves when limited', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    mockState.moves = 5;
    render(<Dashboard />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(`/${DIFFICULTIES.medium.maxMoves}`)).toBeInTheDocument();
  });

  it('shows infinity symbol for unlimited moves', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<Dashboard />);
    
    expect(screen.getByText('/∞')).toBeInTheDocument();
  });

  it('displays correct level number', () => {
    mockState.started = true;
    mockState.level = 15;
    render(<Dashboard />);
    
    expect(screen.getByText('L15')).toBeInTheDocument();
  });

  it('displays score correctly', () => {
    mockState.started = true;
    mockState.score = 12345;
    render(<Dashboard />);
    
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('capitalizes difficulty display', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    render(<Dashboard />);
    
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('has correct grid layout', () => {
    mockState.started = true;
    render(<Dashboard />);
    
    const grid = screen.getByText('L1').closest('.grid');
    expect(grid).toHaveClass('grid-cols-4', 'gap-1');
  });
});