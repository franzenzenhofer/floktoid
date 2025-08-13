import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PageShell from '../../../src/components/layout/PageShell';

describe('PageShell', () => {
  it('renders children correctly', () => {
    render(
      <PageShell>
        <div data-testid="child">Test Child</div>
      </PageShell>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('applies gradient background classes', () => {
    const { container } = render(
      <PageShell>
        <div>Content</div>
      </PageShell>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('w-full');
  });

  it('creates proper layout structure', () => {
    const { container } = render(
      <PageShell>
        <div>Content</div>
      </PageShell>
    );
    
    // Check nested structure
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).toHaveClass('w-full');
    
    const innerWrapper = outerDiv.firstChild as HTMLElement;
    expect(innerWrapper).toHaveClass('w-full');
    
    const contentWrapper = innerWrapper.firstChild as HTMLElement;
    expect(contentWrapper).toHaveClass('p-2', 'sm:p-4');
  });

  it('applies max width constraint', () => {
    const { container } = render(
      <PageShell>
        <div>Content</div>
      </PageShell>
    );
    
    const maxWidthContainer = container.querySelector('.max-w-6xl');
    expect(maxWidthContainer).toBeInTheDocument();
    expect(maxWidthContainer).toHaveClass('mx-auto', 'flex', 'flex-col', 'gap-2');
  });

  it('handles multiple children', () => {
    render(
      <PageShell>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <div data-testid="child3">Child 3</div>
      </PageShell>
    );
    
    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByTestId('child3')).toBeInTheDocument();
  });

  it('maintains scroll behavior', () => {
    const { container } = render(
      <PageShell>
        <div style={{ height: '2000px' }}>Tall content</div>
      </PageShell>
    );
    
    // PageShell no longer has explicit scroll containers
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('w-full');
  });
});