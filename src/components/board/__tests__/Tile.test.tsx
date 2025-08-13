import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Tile from '../Tile';
import { COLOR_PALETTE } from '../../../constants/gameConfig';

describe('Tile Component', () => {
  const defaultProps = {
    value: 0,
    power: false,
    locked: false,
    highlight: false,
    onClick: vi.fn(),
  };

  it('should render with correct color', () => {
    const { container } = render(<Tile {...defaultProps} value={1} />);
    const button = container.querySelector('button');
    
    expect(button).toHaveStyle({ backgroundColor: COLOR_PALETTE[1] });
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Tile {...defaultProps} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when locked', () => {
    const onClick = vi.fn();
    render(<Tile {...defaultProps} locked={true} onClick={onClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('should show lock icon when locked', () => {
    render(<Tile {...defaultProps} locked={true} />);
    
    const lockIcon = screen.getByRole('button').querySelector('svg');
    expect(lockIcon).toBeInTheDocument();
  });

  it('should show lock count when provided', () => {
    render(<Tile {...defaultProps} locked={true} lockCount={3} />);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show power icon when power tile', () => {
    const { container } = render(<Tile {...defaultProps} power={true} />);
    
    // Look for the power icon (Sparkles)
    const powerIcon = container.querySelector('svg');
    expect(powerIcon).toBeInTheDocument();
    // Check for the yellow gradient background
    const powerContainer = container.querySelector('.from-yellow-300');
    expect(powerContainer).toBeInTheDocument();
  });

  it('should apply highlight styles', () => {
    const { container } = render(<Tile {...defaultProps} highlight={true} />);
    
    // Check for the yellow dashed border highlight
    const highlightBorder = container.querySelector('.border-yellow-400');
    expect(highlightBorder).toBeInTheDocument();
    expect(highlightBorder?.className).toContain('border-dashed');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Tile {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should have hover and active states when not locked', () => {
    const { container } = render(<Tile {...defaultProps} />);
    const button = container.querySelector('button');
    
    expect(button?.className).toContain('hover:shadow-xl');
    expect(button?.className).toContain('shadow-lg');
  });

  it('should not have hover states when locked', () => {
    const { container } = render(<Tile {...defaultProps} locked={true} />);
    const button = container.querySelector('button');
    
    expect(button?.className).toContain('cursor-not-allowed');
  });

  it('should render with multiple special states', () => {
    render(
      <Tile
        {...defaultProps}
        value={2}
        power={true}
        locked={true}
        lockCount={2}
        highlight={true}
      />
    );
    
    // Should show both lock and power icons
    const button = screen.getByRole('button');
    const icons = button.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(2);
    
    // Should show lock count
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Should have highlight styles
    expect(button.className).toContain('ring-4');
  });
});