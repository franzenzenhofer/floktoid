import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VictoryModal from '@/components/modals/VictoryModal';
import { GameContext } from '@/context/GameContext';
import { useGenerator } from '@/hooks/useGenerator';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, ...props }: any) => 
      React.createElement('div', { className, ...props }, children)
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Trophy: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'trophy-icon', 'data-size': size, className }, 'Trophy'),
  Clock: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'clock-icon', 'data-size': size, className }, 'Clock'),
  Target: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'target-icon', 'data-size': size, className }, 'Target'),
  Star: ({ size, className, fill }: any) => 
    React.createElement('div', { 'data-testid': 'star-icon', 'data-size': size, className, 'data-fill': fill }, 'Star'),
  ArrowRight: ({ size }: any) => 
    React.createElement('div', { 'data-testid': 'arrow-right-icon', 'data-size': size }, 'ArrowRight')
}));

// Mock useGenerator
vi.mock('@/hooks/useGenerator');

const mockDispatch = vi.fn();
const mockGenerate = vi.fn();

const createMockState = (overrides = {}) => ({
  showVictory: true,
  won: true,
  score: 1000,
  moves: 5,
  solution: [0, 1, 2, 3],
  time: 125, // 2:05
  difficulty: 'easy' as const,
  level: 1,
  ...overrides
});

const renderWithContext = (state: any, props = {}) => {
  return render(
    <GameContext.Provider value={{ state, dispatch: mockDispatch }}>
      <VictoryModal {...props} />
    </GameContext.Provider>
  );
};

describe('VictoryModal', () => {
  const mockOnShowAchievements = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useGenerator as any).mockReturnValue({
      generate: mockGenerate
    });
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when showVictory is false', () => {
    renderWithContext(createMockState({ showVictory: false }));
    
    expect(screen.queryByText('Puzzle Solved!')).not.toBeInTheDocument();
  });

  it('should render victory content when won', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('Puzzle Solved!')).toBeInTheDocument();
  });

  it('should display game stats correctly', () => {
    renderWithContext(createMockState({
      moves: 5,
      solution: [0, 1, 2, 3],
      time: 125,
      score: 1000
    }));
    
    expect(screen.getByText('Moves:')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/ 4')).toBeInTheDocument();
    expect(screen.getByText('Time:')).toBeInTheDocument();
    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('Score:')).toBeInTheDocument();
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('should format time correctly', () => {
    const testCases = [
      { time: 59, expected: '0:59' },
      { time: 60, expected: '1:00' },
      { time: 125, expected: '2:05' },
      { time: 600, expected: '10:00' }
    ];

    testCases.forEach(({ time, expected }) => {
      const { rerender } = renderWithContext(createMockState({ time }));
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clean up for next iteration
    });
  });

  it('should calculate efficiency correctly', () => {
    renderWithContext(createMockState({
      moves: 4,
      solution: [0, 1, 2, 3]
    }));
    
    expect(screen.getByText('Efficiency: 100%')).toBeInTheDocument();
  });

  it('should display correct number of stars based on efficiency', () => {
    const testCases = [
      { moves: 4, solution: [0, 1, 2, 3], expectedStars: 3 }, // 100% efficiency
      { moves: 5, solution: [0, 1, 2, 3], expectedStars: 2 }, // 80% efficiency
      { moves: 8, solution: [0, 1, 2, 3], expectedStars: 1 }  // 50% efficiency
    ];

    testCases.forEach(({ moves, solution, expectedStars }) => {
      const { rerender } = renderWithContext(createMockState({ moves, solution }));
      
      const stars = screen.getAllByTestId('star-icon');
      const filledStars = stars.filter(star => star.getAttribute('data-fill') === 'currentColor');
      expect(filledStars).toHaveLength(expectedStars);
      
      rerender(<div />); // Clean up for next iteration
    });
  });

  it('should render defeat content when not won', () => {
    renderWithContext(createMockState({ won: false }));
    
    expect(screen.getByText('⏰')).toBeInTheDocument();
    expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    expect(screen.getByText("Don't worry, you can try again!")).toBeInTheDocument();
  });

  it('should show continue button only when won', () => {
    renderWithContext(createMockState({ won: true }));
    
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
  });

  it('should not show continue button when lost', () => {
    renderWithContext(createMockState({ won: false }));
    
    expect(screen.queryByText('Continue')).not.toBeInTheDocument();
  });

  it('should handle new game button click', () => {
    renderWithContext(createMockState());
    
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should handle continue button click', async () => {
    mockGenerate.mockResolvedValue({
      grid: [[0, 1], [1, 0]],
      solution: [0, 1],
      optimalPath: []
    });

    renderWithContext(createMockState({
      difficulty: 'medium',
      level: 5
    }));
    
    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'NEXT_LEVEL' });
    
    await waitFor(() => {
      expect(mockGenerate).toHaveBeenCalled();
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'NEW_GAME',
        payload: {
          grid: [[0, 1], [1, 0]],
          solution: [0, 1],
          optimalPath: [],
          difficulty: 'medium',
          level: 6
        }
      });
    });
  });

  it('should handle close button click', () => {
    renderWithContext(createMockState());
    
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should render icons with correct sizes', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByTestId('target-icon')).toHaveAttribute('data-size', '20');
    expect(screen.getByTestId('clock-icon')).toHaveAttribute('data-size', '20');
    expect(screen.getByTestId('trophy-icon')).toHaveAttribute('data-size', '20');
    expect(screen.getAllByTestId('star-icon')[0]).toHaveAttribute('data-size', '24');
  });

  it('should handle empty solution array', () => {
    renderWithContext(createMockState({
      moves: 5,
      solution: []
    }));
    
    expect(screen.getByText('Efficiency: 100%')).toBeInTheDocument();
  });

  it('should apply correct button classes for defeat state', () => {
    renderWithContext(createMockState({ won: false }));
    
    const newGameButton = screen.getByText('New Game');
    expect(newGameButton.className).toContain('btn-primary');
  });
});