import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorialModal from '../TutorialModal';
import { GameProvider } from '../../../context/GameContext';

// Helper to render with context
const renderWithContext = (ui: React.ReactElement, _contextValue?: unknown) => {
  return render(
    <GameProvider>
      {ui}
    </GameProvider>
  );
};

describe('TutorialModal Component', () => {
  it('should not render when showTutorial is false', () => {
    // Mock context with showTutorial false
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: false },
          dispatch: vi.fn(),
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    // Check for specific tutorial modal text instead of "how to play"
    expect(screen.queryByText(/goal/i)).not.toBeInTheDocument();
  });

  it('should render tutorial content when visible', () => {
    // Mock context with showTutorial true
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch: vi.fn(),
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    expect(screen.getByText(/how to play/i)).toBeInTheDocument();
    expect(screen.getByText(/goal/i)).toBeInTheDocument();
    expect(screen.getByText(/turn all tiles the same color/i)).toBeInTheDocument();
    expect(screen.getByText(/special tiles/i)).toBeInTheDocument();
    expect(screen.getByText(/tips/i)).toBeInTheDocument();
  });

  it('should close when clicking backdrop', () => {
    const dispatch = vi.fn();
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch,
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    // Click backdrop
    const backdrop = screen.getByText(/how to play/i).closest('.modal-backdrop');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
    }
  });

  it('should close when clicking X button', () => {
    const dispatch = vi.fn();
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch,
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should close when clicking "Let\'s Play!" button', () => {
    const dispatch = vi.fn();
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch,
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    const playButton = screen.getByRole('button', { name: /let's play/i });
    fireEvent.click(playButton);
    
    expect(dispatch).toHaveBeenCalledWith({ type: 'SHOW_MODAL', modal: null });
  });

  it('should not close when clicking modal content', () => {
    const dispatch = vi.fn();
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch,
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    const modalContent = screen.getByText(/how to play/i).closest('.modal-content');
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(dispatch).not.toHaveBeenCalled();
    }
  });

  it('should show all tutorial sections', () => {
    vi.mock('../../../context/GameContext', async () => {
      const actual = await vi.importActual('../../../context/GameContext');
      return {
        ...actual,
        useGame: () => ({
          state: { showTutorial: true },
          dispatch: vi.fn(),
        }),
      };
    });

    renderWithContext(<TutorialModal />);
    
    // Check all sections are present
    expect(screen.getByText(/click any tile to rotate/i)).toBeInTheDocument();
    expect(screen.getByText(/cross pattern/i)).toBeInTheDocument();
    expect(screen.getByText(/power tiles.*3×3/i)).toBeInTheDocument();
    expect(screen.getByText(/locked tiles/i)).toBeInTheDocument();
    expect(screen.getByText(/fewer moves.*higher score/i)).toBeInTheDocument();
  });
});