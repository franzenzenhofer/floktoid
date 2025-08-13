import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AchievementModal from '@/components/modals/AchievementModal';
import { ACHIEVEMENTS } from '@/constants/gameConfig';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, initial, animate, exit, transition, style, ...props }: any) => 
      React.createElement('div', { className, style, ...props }, children),
    h2: ({ children, className, initial, animate, transition, ...props }: any) => 
      React.createElement('h2', { className, ...props }, children),
    h3: ({ children, className, initial, animate, transition, ...props }: any) => 
      React.createElement('h3', { className, ...props }, children),
    p: ({ children, className, initial, animate, transition, ...props }: any) => 
      React.createElement('p', { className, ...props }, children)
  },
  AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children)
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Trophy: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'trophy-icon', 'data-size': size, className }, 'Trophy'),
  X: ({ size }: any) => 
    React.createElement('div', { 'data-testid': 'close-icon', 'data-size': size }, 'X'),
  Zap: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'zap-icon', 'data-size': size, className }, 'Zap')
}));

describe('AchievementModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when closed', () => {
    render(<AchievementModal isOpen={false} achievements={['first_win']} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });

  it('should not render when no achievements', () => {
    render(<AchievementModal isOpen={true} achievements={[]} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });

  it('should render achievement modal when open with achievement', () => {
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    expect(screen.getByText('Achievement Unlocked!')).toBeInTheDocument();
    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument();
  });

  it('should display achievement details', () => {
    const achievement = ACHIEVEMENTS.find(a => a.id === 'first_win');
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    expect(screen.getByText(achievement!.name)).toBeInTheDocument();
    expect(screen.getByText(achievement!.description)).toBeInTheDocument();
    expect(screen.getByText(`+${achievement!.xp} XP`)).toBeInTheDocument();
  });

  it('should render close button', () => {
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement;
    expect(closeButton).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-icon').parentElement!;
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should auto-close after showing single achievement', () => {
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    // First timeout advances to next achievement (but there is none)
    vi.advanceTimersByTime(3000);
    
    // Second timeout closes the modal
    vi.advanceTimersByTime(2000);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should cycle through multiple achievements', () => {
    const achievements = ['first_win', 'speed_demon', 'perfect_game'];
    const { rerender } = render(
      <AchievementModal isOpen={true} achievements={achievements} onClose={mockOnClose} />
    );
    
    // First achievement
    const firstAchievement = ACHIEVEMENTS.find(a => a.id === 'first_win');
    expect(screen.getByText(firstAchievement!.name)).toBeInTheDocument();
    
    // Advance to second achievement
    vi.advanceTimersByTime(3000);
    rerender(<AchievementModal isOpen={true} achievements={achievements} onClose={mockOnClose} />);
    
    const secondAchievement = ACHIEVEMENTS.find(a => a.id === 'speed_demon');
    expect(screen.getByText(secondAchievement!.name)).toBeInTheDocument();
  });

  it('should show progress indicators for multiple achievements', () => {
    const achievements = ['first_win', 'speed_demon', 'perfect_game'];
    const { container } = render(<AchievementModal isOpen={true} achievements={achievements} onClose={mockOnClose} />);
    
    // Should have 3 progress dots
    const progressDots = container.querySelectorAll('.w-2.h-2.rounded-full');
    // Filter out particle effects (which also have w-2 h-2 but also have .absolute)
    const actualProgressDots = Array.from(progressDots).filter(dot => !dot.classList.contains('absolute'));
    expect(actualProgressDots).toHaveLength(3);
  });

  it('should render particle effects', () => {
    const { container } = render(
      <AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />
    );
    
    // Should have 12 particle divs
    const particles = container.querySelectorAll('.absolute.w-2.h-2.bg-yellow-400');
    expect(particles.length).toBe(12);
  });

  it('should render icons with correct props', () => {
    render(<AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />);
    
    const trophyIcon = screen.getByTestId('trophy-icon');
    expect(trophyIcon).toHaveAttribute('data-size', '40');
    
    const closeIcon = screen.getByTestId('close-icon');
    expect(closeIcon).toHaveAttribute('data-size', '20');
    
    const zapIcon = screen.getByTestId('zap-icon');
    expect(zapIcon).toHaveAttribute('data-size', '16');
  });

  it('should handle invalid achievement ID gracefully', () => {
    render(<AchievementModal isOpen={true} achievements={['invalid_id']} onClose={mockOnClose} />);
    
    expect(screen.queryByText('Achievement Unlocked!')).not.toBeInTheDocument();
  });

  it('should cleanup timers on unmount', () => {
    const { unmount } = render(
      <AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />
    );
    
    unmount();
    vi.advanceTimersByTime(5000);
    
    // Should not call onClose after unmount
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render achievement gradient background', () => {
    const { container } = render(
      <AchievementModal isOpen={true} achievements={['first_win']} onClose={mockOnClose} />
    );
    
    const gradientDiv = container.querySelector('.bg-gradient-to-br.from-yellow-400.via-orange-500.to-red-500');
    expect(gradientDiv).toBeInTheDocument();
  });

  it('should handle achievement cycling completion', () => {
    const achievements = ['first_win', 'speed_demon'];
    const { rerender } = render(
      <AchievementModal isOpen={true} achievements={achievements} onClose={mockOnClose} />
    );
    
    // First achievement shows
    expect(screen.getByText(ACHIEVEMENTS.find(a => a.id === 'first_win')!.name)).toBeInTheDocument();
    
    // Advance to second achievement
    vi.advanceTimersByTime(3000);
    rerender(<AchievementModal isOpen={true} achievements={achievements} onClose={mockOnClose} />);
    expect(screen.getByText(ACHIEVEMENTS.find(a => a.id === 'speed_demon')!.name)).toBeInTheDocument();
    
    // Advance to trigger auto-close
    vi.advanceTimersByTime(3000);
    vi.advanceTimersByTime(2000);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});