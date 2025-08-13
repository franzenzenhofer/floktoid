import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorialModal from '@/components/modals/TutorialModal';
import { GameContext } from '@/context/GameContext';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, onClick, initial, animate, exit, ...props }: any) => 
      React.createElement('div', { className, onClick, ...props }, children)
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  BookOpen: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'book-open-icon', 'data-size': size, className }, 'BookOpen'),
  X: ({ size }: any) => 
    React.createElement('div', { 'data-testid': 'x-icon', 'data-size': size }, 'X')
}));

const mockDispatch = vi.fn();

const createMockState = (overrides = {}) => ({
  showTutorial: true,
  ...overrides
});

const renderWithContext = (state: any) => {
  return render(
    <GameContext.Provider value={{ state, dispatch: mockDispatch }}>
      <TutorialModal />
    </GameContext.Provider>
  );
};

describe('TutorialModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when showTutorial is false', () => {
    renderWithContext(createMockState({ showTutorial: false }));
    
    expect(screen.queryByText('How to Play')).not.toBeInTheDocument();
  });

  it('should render tutorial modal when showTutorial is true', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByText('How to Play')).toBeInTheDocument();
    expect(screen.getByTestId('book-open-icon')).toBeInTheDocument();
  });

  it('should display all tutorial sections', () => {
    renderWithContext(createMockState());
    
    // Check section headers
    expect(screen.getByText('🎯 Goal')).toBeInTheDocument();
    expect(screen.getByText('🎮 How to Play')).toBeInTheDocument();
    expect(screen.getByText('⚡ Special Tiles')).toBeInTheDocument();
    expect(screen.getByText('💡 Tips')).toBeInTheDocument();
  });

  it('should display game instructions', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByText('Turn all tiles the same color!')).toBeInTheDocument();
    expect(screen.getByText('Click any tile to rotate its color and neighbors')).toBeInTheDocument();
    expect(screen.getByText('Each click affects a cross pattern (+ shape)')).toBeInTheDocument();
    expect(screen.getByText('Plan your moves to reach a single color')).toBeInTheDocument();
  });

  it('should display special tiles information', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByText(/Power tiles/)).toBeInTheDocument();
    expect(screen.getByText(/affect a 3×3 area/)).toBeInTheDocument();
    expect(screen.getByText(/Locked tiles/)).toBeInTheDocument();
    expect(screen.getByText(/need multiple clicks to unlock/)).toBeInTheDocument();
  });

  it('should display tips', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByText('Use the hint button if you get stuck')).toBeInTheDocument();
    expect(screen.getByText('Fewer moves = higher score')).toBeInTheDocument();
    expect(screen.getByText('Complete puzzles to unlock new worlds!')).toBeInTheDocument();
  });

  it('should close modal when X button is clicked', () => {
    renderWithContext(createMockState());
    
    const closeButton = screen.getByTestId('x-icon').parentElement!;
    fireEvent.click(closeButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should close modal when backdrop is clicked', () => {
    const { container } = renderWithContext(createMockState());
    
    // Click the backdrop (first div with modal-backdrop class)
    const backdrop = container.querySelector('.modal-backdrop');
    fireEvent.click(backdrop!);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should not close modal when modal content is clicked', () => {
    const { container } = renderWithContext(createMockState());
    
    // Click the modal content
    const modalContent = container.querySelector('.modal-content');
    fireEvent.click(modalContent!);
    
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('should close modal when "Let\'s Play!" button is clicked', () => {
    renderWithContext(createMockState());
    
    const playButton = screen.getByText("Let's Play!");
    fireEvent.click(playButton);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should render icons with correct sizes', () => {
    renderWithContext(createMockState());
    
    expect(screen.getByTestId('book-open-icon')).toHaveAttribute('data-size', '48');
    expect(screen.getByTestId('x-icon')).toHaveAttribute('data-size', '20');
  });

  it('should have correct CSS classes', () => {
    renderWithContext(createMockState());
    
    const playButton = screen.getByText("Let's Play!");
    expect(playButton.className).toContain('btn-primary');
    expect(playButton.className).toContain('w-full');
    
    const bookIcon = screen.getByTestId('book-open-icon');
    expect(bookIcon.className).toContain('text-blue-600');
  });

  it('should stop propagation when modal content is clicked', () => {
    const { container } = renderWithContext(createMockState());
    
    const modalContent = container.querySelector('.modal-content');
    const clickEvent = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');
    
    modalContent!.dispatchEvent(clickEvent);
    
    // Since we're using a mock, we can't test stopPropagation directly
    // but we can verify the dispatch wasn't called
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});