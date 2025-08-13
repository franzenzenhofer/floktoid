import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import Header from '../../../src/components/layout/Header';

// Mock the useGame hook
const mockState = { started: false };
vi.mock('../../../src/context/GameContext', () => ({
  useGame: () => ({
    state: mockState
  })
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    header: ({ children, ...props }: React.PropsWithChildren<React.HTMLProps<HTMLElement>>) => 
      <header {...props}>{children}</header>
  }
}));

// Mock location
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true
});

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.started = false;
  });

  it('renders header with app name', () => {
    render(<Header />);
    expect(screen.getByText('Color Me Same')).toBeInTheDocument();
  });

  it('renders home icon', () => {
    render(<Header />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not reload when game has not started', () => {
    render(<Header />);
    const buttons = screen.getAllByRole('button');
    const homeButton = buttons[0]; // First button is the home button
    fireEvent.click(homeButton);
    expect(mockReload).not.toHaveBeenCalled();
  });

  it('reloads page when game has started', () => {
    mockState.started = true;
    render(<Header />);
    const buttons = screen.getAllByRole('button');
    const homeButton = buttons[0]; // First button is the home button
    fireEvent.click(homeButton);
    expect(mockReload).toHaveBeenCalled();
  });

  it('has correct styling classes', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-black/20', 'backdrop-blur-sm');
  });

  it('button has hover effects', () => {
    render(<Header />);
    const buttons = screen.getAllByRole('button');
    const homeButton = buttons[0]; // First button is the home button
    expect(homeButton).toHaveClass('group');
  });
});