import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import PointsDisplay from '../PointsDisplay';

vi.mock('../../../utils/scoring', () => ({
  formatPoints: vi.fn((points: number) => {
    if (points < 1000) return points.toString();
    if (points < 10000) return (points / 1000).toFixed(1) + 'k';
    if (points < 1000000) return Math.floor(points / 1000) + 'k';
    return (points / 1000000).toFixed(1) + 'M';
  })
}));

describe('PointsDisplay', () => {
  it('should render formatted points', () => {
    const { getByText } = render(<PointsDisplay totalPoints={128450} />);
    expect(getByText('128k')).toBeInTheDocument();
  });
  
  it('should show point gain animation when lastGain is provided', () => {
    const { getByText } = render(
      <PointsDisplay totalPoints={1500} lastGain={500} />
    );
    expect(getByText('+500')).toBeInTheDocument();
  });
  
  it('should animate counter when points increase', async () => {
    const { rerender, container } = render(
      <PointsDisplay totalPoints={1000} showAnimation={true} />
    );
    
    rerender(<PointsDisplay totalPoints={2000} showAnimation={true} />);
    
    // Animation happens over time
    await waitFor(() => {
      const displayedText = container.textContent;
      expect(displayedText).toContain('k'); // Should show formatted number
    });
  });
  
  it('should change color based on level points', () => {
    // High performance (>200 points)
    const { container: container1 } = render(
      <PointsDisplay totalPoints={1000} levelPoints={250} />
    );
    expect(container1.querySelector('.text-green-400')).toBeInTheDocument();
    
    // Medium performance (>100 points)
    const { container: container2 } = render(
      <PointsDisplay totalPoints={1000} levelPoints={150} />
    );
    expect(container2.querySelector('.text-blue-400')).toBeInTheDocument();
    
    // Normal performance
    const { container: container3 } = render(
      <PointsDisplay totalPoints={1000} levelPoints={50} />
    );
    expect(container3.querySelector('.text-white')).toBeInTheDocument();
  });
  
  it('should show celebration for 100k milestone', () => {
    const { getByText } = render(
      <PointsDisplay totalPoints={100000} lastGain={5000} />
    );
    // Previous total was 95000, crossed 100k
    expect(getByText('🎊')).toBeInTheDocument();
  });
});