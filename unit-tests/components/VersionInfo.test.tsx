import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { VersionInfo } from '../../src/components/VersionInfo';
import { GameContext } from '../../src/context/GameContext';

// Mock version module
vi.mock('../../src/version', () => ({
  displayVersion: 'v1.2.3',
  displayDate: '1/1/2025 12:00:00 PM',
  displayCommit: 'abc123d'
}));

// Mock the useGame hook
const mockState = { started: false };
vi.mock('../../src/context/GameContext', () => ({
  useGame: () => ({
    state: mockState
  }),
  GameContext: React.createContext(null)
}));

describe('VersionInfo', () => {
  beforeEach(() => {
    mockState.started = false;
  });

  it('renders version info when game has not started', () => {
    render(<VersionInfo />);
    
    expect(screen.getByText(/v1\.2\.3/)).toBeInTheDocument();
    expect(screen.getByText(/1\/1\/2025 12:00:00 PM/)).toBeInTheDocument();
    expect(screen.getByText(/abc123d/)).toBeInTheDocument();
  });

  it('displays all version elements in correct format', () => {
    render(<VersionInfo />);
    
    const versionText = screen.getByText(/v1\.2\.3 \| 1\/1\/2025 12:00:00 PM \| abc123d/);
    expect(versionText).toBeInTheDocument();
  });

  it('does not render when game has started', () => {
    mockState.started = true;
    const { container } = render(<VersionInfo />);
    
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText(/v1\.2\.3/)).not.toBeInTheDocument();
  });

  it('has correct CSS classes for styling', () => {
    const { container } = render(<VersionInfo />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('text-center', 'mt-8', 'text-white/40', 'text-sm', 'font-mono');
    
    const innerDiv = wrapper.firstChild as HTMLElement;
    expect(innerDiv).toHaveClass('bg-black/20', 'rounded-lg', 'px-4', 'py-2', 'inline-block');
  });

  it('renders inline-block for proper centering', () => {
    render(<VersionInfo />);
    
    const innerDiv = screen.getByText(/v1\.2\.3 \| 1\/1\/2025 12:00:00 PM \| abc123d/).parentElement;
    expect(innerDiv).toHaveClass('inline-block');
  });

  it('uses monospace font for version display', () => {
    const { container } = render(<VersionInfo />);
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('font-mono');
  });
});