import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Tile from '@/components/board/Tile';
import { COLOR_PALETTE } from '@/constants/gameConfig';
import React from 'react';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, className, onClick, disabled, style, 'aria-label': ariaLabel, ...props }: any) => 
      React.createElement('button', { className, onClick, disabled, style, 'aria-label': ariaLabel, ...props }, children),
    div: ({ children, className, style, ...props }: any) => 
      React.createElement('div', { className, style, ...props }, children)
  }
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Lock: ({ size, className }: any) => 
    React.createElement('div', { 'data-testid': 'lock-icon', 'data-size': size, className }, 'Lock'),
  Sparkles: ({ size, className, fill }: any) => 
    React.createElement('div', { 'data-testid': 'sparkles-icon', 'data-size': size, className, 'data-fill': fill }, 'Sparkles')
}));

describe('Tile', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render tile with correct color', () => {
    render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveStyle({ backgroundColor: COLOR_PALETTE[0] });
  });

  it('should render all color values correctly', () => {
    for (let i = 0; i < 8; i++) {
      const { rerender } = render(
        <Tile value={i} power={false} locked={false} highlight={false} onClick={mockOnClick} />
      );
      
      const tile = screen.getByRole('button');
      expect(tile).toHaveStyle({ backgroundColor: COLOR_PALETTE[i] });
      
      rerender(<div />); // Clean up for next iteration
    }
  });

  it('should handle invalid color value', () => {
    render(<Tile value={99} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveStyle({ backgroundColor: COLOR_PALETTE[0] });
  });

  it('should have correct aria-label', () => {
    render(<Tile value={2} power={false} locked={false} highlight={false} onClick={mockOnClick} row={1} col={2} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-label', 'Blue tile at row 2, column 3');
  });

  it('should have locked aria-label when locked', () => {
    render(<Tile value={1} power={false} locked={true} highlight={false} onClick={mockOnClick} row={0} col={0} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-label', 'Green tile at row 1, column 1, locked');
  });

  it('should have power aria-label when power tile', () => {
    render(<Tile value={0} power={true} locked={false} highlight={false} onClick={mockOnClick} row={0} col={0} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-label', 'Red tile at row 1, column 1, power tile');
  });

  it('should handle click when not locked or disabled', () => {
    render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    fireEvent.click(tile);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should not handle click when locked', () => {
    render(<Tile value={0} power={false} locked={true} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    fireEvent.click(tile);
    
    expect(mockOnClick).not.toHaveBeenCalled();
    expect(tile).toBeDisabled();
  });

  it('should not handle click when disabled', () => {
    render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} disabled={true} />);
    
    const tile = screen.getByRole('button');
    fireEvent.click(tile);
    
    expect(mockOnClick).not.toHaveBeenCalled();
    expect(tile).toBeDisabled();
  });

  it('should show lock icon when locked', () => {
    render(<Tile value={0} power={false} locked={true} highlight={false} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('should show lock count when locked with count', () => {
    render(<Tile value={0} power={false} locked={true} lockCount={3} highlight={false} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should not show lock count when count is 0', () => {
    render(<Tile value={0} power={false} locked={true} lockCount={0} highlight={false} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should show sparkles icon when power tile', () => {
    render(<Tile value={0} power={true} locked={false} highlight={false} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
  });

  it('should show highlight effects', () => {
    render(<Tile value={0} power={false} locked={false} highlight={true} onClick={mockOnClick} />);
    
    // Check for dashed border element
    const highlightBorder = screen.getByRole('button').querySelector('.border-dashed');
    expect(highlightBorder).toBeTruthy();
  });

  it('should have cursor-not-allowed when locked', () => {
    render(<Tile value={0} power={false} locked={true} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    expect(tile.className).toContain('cursor-not-allowed');
  });

  it('should have cursor-pointer when not locked or disabled', () => {
    render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    expect(tile.className).toContain('cursor-pointer');
  });

  it('should have opacity-60 when disabled', () => {
    render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} disabled={true} />);
    
    const tile = screen.getByRole('button');
    expect(tile.className).toContain('opacity-60');
  });

  it('should show click ripple effect', async () => {
    const { container } = render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const tile = screen.getByRole('button');
    fireEvent.click(tile);
    
    // The click should trigger isClicking state
    expect(tile.className).toContain('scale-90');
    
    // After timeout, it should reset
    vi.advanceTimersByTime(200);
    await waitFor(() => {
      expect(tile.className).not.toContain('scale-90');
    });
  });

  it('should render glossy effect overlay', () => {
    const { container } = render(<Tile value={0} power={false} locked={false} highlight={false} onClick={mockOnClick} />);
    
    const glossyEffect = container.querySelector('.bg-gradient-to-br.from-white\\/30');
    expect(glossyEffect).toBeInTheDocument();
  });

  it('should use React.memo for performance', () => {
    expect(Tile.$$typeof?.toString()).toContain('memo');
  });

  it('should render both power and locked states together', () => {
    render(<Tile value={0} power={true} locked={true} lockCount={2} highlight={false} onClick={mockOnClick} />);
    
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render all states together', () => {
    render(<Tile value={3} power={true} locked={true} lockCount={5} highlight={true} onClick={mockOnClick} row={2} col={3} disabled={true} />);
    
    const tile = screen.getByRole('button');
    expect(tile).toHaveAttribute('aria-label', 'Amber tile at row 3, column 4, locked, power tile');
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(tile.className).toContain('opacity-60');
    expect(tile).toBeDisabled();
  });
});