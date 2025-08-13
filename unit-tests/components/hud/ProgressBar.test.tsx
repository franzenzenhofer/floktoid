import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProgressBar from '../../../src/components/hud/ProgressBar';
import { BELT_COLORS } from '../../../src/constants/gameConfig';

// Mock progress data
const mockProgress = {
  currentBelt: 'white' as keyof typeof BELT_COLORS,
  totalXP: 0,
  nextRequirement: 100,
  previousRequirement: 0
};

const mockGetNextBelt = vi.fn();

// Mock the useProgression hook
vi.mock('../../../src/hooks/useProgression', () => ({
  useProgression: () => ({
    progress: mockProgress,
    getNextBelt: mockGetNextBelt
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) => 
      <div {...props}>{children}</div>
  }
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Trophy: ({ size, className }: { size: number; className: string }) => 
    <span className={className}>🏆</span>
}));

describe('ProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProgress.currentBelt = 'white';
    mockProgress.totalXP = 0;
    mockProgress.nextRequirement = 100;
    mockProgress.previousRequirement = 0;
    mockGetNextBelt.mockReturnValue({
      belt: 'yellow',
      color: '#FBBF24',
      progress: 0
    });
  });

  it('renders progress bar', () => {
    render(<ProgressBar />);
    expect(screen.getByText(/Belt/)).toBeInTheDocument();
  });

  it('displays current belt name', () => {
    mockProgress.currentBelt = 'yellow';
    render(<ProgressBar />);
    expect(screen.getByText('Yellow Belt')).toBeInTheDocument();
  });

  it('displays total XP', () => {
    mockProgress.totalXP = 500;
    render(<ProgressBar />);
    expect(screen.getByText('500 XP')).toBeInTheDocument();
  });

  it('shows trophy icon', () => {
    render(<ProgressBar />);
    expect(screen.getByText('🏆')).toBeInTheDocument();
  });

  it('applies correct belt color', () => {
    mockProgress.currentBelt = 'green';
    render(<ProgressBar />);
    
    const beltIcon = screen.getByText('🏆').parentElement;
    expect(beltIcon).toHaveStyle({ backgroundColor: BELT_COLORS.green.color });
  });

  it('shows progress bar when next belt exists', () => {
    mockGetNextBelt.mockReturnValue({
      belt: 'yellow',
      color: '#FBBF24',
      progress: 0.5
    });
    render(<ProgressBar />);
    
    // Check for progress bar container
    const progressBar = screen.getByText('White Belt').closest('.p-1\\.5')?.querySelector('.bg-white\\/10');
    expect(progressBar).toBeInTheDocument();
  });

  it('does not show progress bar for black belt', () => {
    mockProgress.currentBelt = 'black';
    mockGetNextBelt.mockReturnValue(null);
    render(<ProgressBar />);
    
    // Check that there's no progress bar
    const progressBar = screen.getByText('Black Belt').closest('.p-1\\.5')?.querySelector('.bg-white\\/10');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('progress bar renders with correct structure', () => {
    mockGetNextBelt.mockReturnValue({
      belt: 'yellow',
      color: '#FBBF24',
      progress: 0.75
    });
    render(<ProgressBar />);
    
    const progressFill = screen.getByText('White Belt').closest('.p-1\\.5')?.querySelector('.absolute');
    expect(progressFill).toBeInTheDocument();
    expect(progressFill).toHaveClass('top-0', 'left-0', 'h-full', 'rounded-full');
  });

  it('progress bar has correct color for next belt', () => {
    mockGetNextBelt.mockReturnValue({
      belt: 'orange',
      color: '#FB923C',
      progress: 0.25
    });
    render(<ProgressBar />);
    
    const progressFill = screen.getByText('White Belt').closest('.p-1\\.5')?.querySelector('.absolute');
    expect(progressFill).toHaveStyle({ backgroundColor: '#FB923C' });
  });

  it('has correct container styling', () => {
    render(<ProgressBar />);
    
    const container = screen.getByText(/Belt/).closest('.bg-white\\/10');
    expect(container).toHaveClass('backdrop-blur-sm', 'rounded-lg', 'p-1.5', 'mb-1', 'mt-1');
  });

  it('belt icon has animation classes', () => {
    render(<ProgressBar />);
    
    const beltIcon = screen.getByText('🏆').parentElement;
    expect(beltIcon).toHaveClass('w-6', 'h-6', 'rounded-full', 'border', 'border-white/30');
  });

  it('text has correct styling', () => {
    render(<ProgressBar />);
    
    const beltText = screen.getByText('White Belt');
    expect(beltText).toHaveClass('text-white/90', 'font-medium');
    
    const xpText = screen.getByText('0 XP');
    expect(xpText).toHaveClass('text-white/60');
  });

  it('updates when belt changes', () => {
    const { rerender } = render(<ProgressBar />);
    expect(screen.getByText('White Belt')).toBeInTheDocument();
    
    mockProgress.currentBelt = 'blue';
    mockProgress.totalXP = 1500;
    rerender(<ProgressBar />);
    
    expect(screen.getByText('Blue Belt')).toBeInTheDocument();
    expect(screen.getByText('1500 XP')).toBeInTheDocument();
  });

  it('capitalizes belt names correctly', () => {
    mockProgress.currentBelt = 'purple';
    render(<ProgressBar />);
    expect(screen.getByText('Purple Belt')).toBeInTheDocument();
  });

  it('progress bar renders for different progress values', () => {
    mockGetNextBelt.mockReturnValue({
      belt: 'yellow',
      color: '#FBBF24',
      progress: 0
    });
    const { rerender } = render(<ProgressBar />);
    
    let progressFill = screen.getByText('White Belt').closest('.p-1\\.5')?.querySelector('.absolute');
    expect(progressFill).toBeInTheDocument();
    
    // Test with full progress
    mockGetNextBelt.mockReturnValue({
      belt: 'yellow',
      color: '#FBBF24',
      progress: 1
    });
    rerender(<ProgressBar />);
    
    progressFill = screen.getByText('White Belt').closest('.p-1\\.5')?.querySelector('.absolute');
    expect(progressFill).toBeInTheDocument();
  });
});