import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ColorCycleInfo from '../../../src/components/hud/ColorCycleInfo';
import { COLOR_PALETTE, DIFFICULTIES } from '../../../src/constants/gameConfig';

// Mock state
const mockState = {
  started: false,
  difficulty: 'easy' as const,
  grid: [[0, 1], [1, 0]]
};

// Mock the useGame hook
vi.mock('../../../src/context/GameContext', () => ({
  useGame: () => ({
    state: mockState
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
  ArrowRight: ({ size, className }: { size: number; className: string }) => 
    <span className={className}>→</span>
}));

describe('ColorCycleInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.started = false;
    mockState.difficulty = 'easy';
    mockState.grid = [[0, 1], [1, 0]];
  });

  it('renders color cycle info', () => {
    render(<ColorCycleInfo />);
    expect(screen.getByText(/Color Cycle/)).toBeInTheDocument();
  });

  it('shows default 3 colors when game not started', () => {
    mockState.started = false;
    render(<ColorCycleInfo />);
    expect(screen.getByText('Color Cycle (3 colors)')).toBeInTheDocument();
  });

  it('shows correct color count for easy difficulty', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    expect(screen.getByText(`Color Cycle (${DIFFICULTIES.easy.colors} colors)`)).toBeInTheDocument();
  });

  it('shows correct color count for medium difficulty', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    render(<ColorCycleInfo />);
    expect(screen.getByText(`Color Cycle (${DIFFICULTIES.medium.colors} colors)`)).toBeInTheDocument();
  });

  it('shows correct color count for hard difficulty', () => {
    mockState.started = true;
    mockState.difficulty = 'hard';
    render(<ColorCycleInfo />);
    expect(screen.getByText(`Color Cycle (${DIFFICULTIES.hard.colors} colors)`)).toBeInTheDocument();
  });

  it('displays correct number of color boxes for easy', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    
    // Should show 3 colors + 1 repeat of first color = 4 color boxes
    const colorBoxes = screen.getAllByTitle(/Color|Back to first color/);
    expect(colorBoxes).toHaveLength(DIFFICULTIES.easy.colors + 1);
  });

  it('displays correct number of color boxes for medium', () => {
    mockState.started = true;
    mockState.difficulty = 'medium';
    render(<ColorCycleInfo />);
    
    // Should show 4 colors + 1 repeat of first color = 5 color boxes
    const colorBoxes = screen.getAllByTitle(/Color|Back to first color/);
    expect(colorBoxes).toHaveLength(DIFFICULTIES.medium.colors + 1);
  });

  it('displays correct number of color boxes for hard', () => {
    mockState.started = true;
    mockState.difficulty = 'hard';
    render(<ColorCycleInfo />);
    
    // Should show 5 colors + 1 repeat of first color = 6 color boxes
    const colorBoxes = screen.getAllByTitle(/Color|Back to first color/);
    expect(colorBoxes).toHaveLength(DIFFICULTIES.hard.colors + 1);
  });

  it('shows arrows between all colors including cycle back', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    
    const arrows = screen.getAllByText('→');
    // 2 arrows between 3 colors + 1 arrow to cycle back = 3 arrows
    expect(arrows).toHaveLength(DIFFICULTIES.easy.colors);
  });

  it('last color box shows cycle back to first', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    
    expect(screen.getByTitle('Back to first color')).toBeInTheDocument();
  });

  it('color boxes have correct titles', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    
    expect(screen.getByTitle('Color 1')).toBeInTheDocument();
    expect(screen.getByTitle('Color 2')).toBeInTheDocument();
    expect(screen.getByTitle('Color 3')).toBeInTheDocument();
  });

  it('applies correct background colors', () => {
    mockState.started = true;
    mockState.difficulty = 'easy';
    render(<ColorCycleInfo />);
    
    const firstColorBox = screen.getByTitle('Color 1');
    const lastColorBox = screen.getByTitle('Back to first color');
    
    // First and last should have same color
    expect(firstColorBox).toHaveStyle({ backgroundColor: COLOR_PALETTE[0] });
    expect(lastColorBox).toHaveStyle({ backgroundColor: COLOR_PALETTE[0] });
  });

  it('has correct layout structure', () => {
    render(<ColorCycleInfo />);
    
    const container = screen.getByText(/Color Cycle/).closest('div');
    expect(container).toHaveClass('mt-2', 'p-2', 'bg-black/20', 'backdrop-blur-sm', 'rounded-lg');
  });

  it('color boxes have correct styling', () => {
    mockState.started = true;
    render(<ColorCycleInfo />);
    
    const colorBox = screen.getByTitle('Color 1');
    expect(colorBox).toHaveClass('w-6', 'h-6', 'rounded', 'shadow-sm', 'border', 'border-white/20');
  });

  it('uses flex layout for color display', () => {
    render(<ColorCycleInfo />);
    
    const colorContainer = screen.getByTitle('Color 1').parentElement;
    expect(colorContainer).toHaveClass('flex', 'items-center', 'justify-center', 'gap-1');
  });
});