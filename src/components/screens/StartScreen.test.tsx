import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StartScreen from './StartScreen';

// Create mock functions outside to avoid scoping issues
const mockGenerate = vi.fn();
const mockDispatch = vi.fn();

// Mock the hooks and dependencies
vi.mock('../../hooks/useGenerator', () => ({
  useGenerator: () => ({
    generate: mockGenerate
  })
}));

vi.mock('../../context/GameContext', () => ({
  useGame: () => ({
    state: { started: false },
    dispatch: mockDispatch
  }),
  GameProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) => <button {...props}>{children}</button>,
    h1: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLHeadingElement>>) => <h1 {...props}>{children}</h1>,
  }
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Play: () => <span>Play</span>,
  Trophy: () => <span>Trophy</span>,
  Zap: () => <span>Zap</span>,
  Clock: () => <span>Clock</span>,
}));

describe('StartScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerate.mockResolvedValue({
      grid: [[0, 1], [1, 0]],
      solved: [[0, 0], [0, 0]],
      power: new Set(),
      locked: new Map(),
      solution: [],
      reverse: [],
      optimalPath: [],
      playerMoves: []
    });
  });

  it('renders the start screen with new game button', () => {
    render(<StartScreen />);
    
    expect(screen.getByText('Color Me Same')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Starting at Level 1 • 3×3 Grid • 1 Move')).toBeInTheDocument();
  });

  it('starts new game at level 1', async () => {
    render(<StartScreen />);
    
    const startButton = screen.getByText('New Game');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      // Should generate with level 1
      expect(mockGenerate).toHaveBeenCalledWith(
        expect.any(Object), // dummy config
        1 // level 1
      );
    });
  });

  it('dispatches NEW_GAME action with level 1', async () => {
    render(<StartScreen />);
    
    const startButton = screen.getByText('New Game');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'NEW_GAME',
        payload: expect.objectContaining({
          level: 1,
          grid: [[0, 1], [1, 0]],
          solved: [[0, 0], [0, 0]]
        })
      });
    });
  });

  it('shows loading state while generating', async () => {
    // Make generate take longer
    mockGenerate.mockImplementationOnce(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<StartScreen />);
    
    const startButton = screen.getByText('New Game');
    fireEvent.click(startButton);
    
    // Should show loading
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });
});