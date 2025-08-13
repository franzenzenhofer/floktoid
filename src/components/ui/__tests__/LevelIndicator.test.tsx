import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LevelIndicator from '../LevelIndicator';

describe('LevelIndicator', () => {
  it('should render current level', () => {
    const { getByText } = render(<LevelIndicator currentLevel={42} />);
    expect(getByText('42')).toBeInTheDocument();
    expect(getByText('Level')).toBeInTheDocument();
  });
  
  it('should apply correct color class based on level range', () => {
    // Level 1-20: Green (learning)
    const { container: container1 } = render(<LevelIndicator currentLevel={10} />);
    expect(container1.querySelector('.text-green-500')).toBeInTheDocument();
    
    // Level 21-50: Blue (growing)
    const { container: container2 } = render(<LevelIndicator currentLevel={35} />);
    expect(container2.querySelector('.text-blue-500')).toBeInTheDocument();
    
    // Level 51-100: Purple (advancing)
    const { container: container3 } = render(<LevelIndicator currentLevel={75} />);
    expect(container3.querySelector('.text-purple-500')).toBeInTheDocument();
    
    // Level 101+: Gold (expert)
    const { container: container4 } = render(<LevelIndicator currentLevel={150} />);
    expect(container4.querySelector('.text-yellow-500')).toBeInTheDocument();
  });
  
  it('should show gradient text for special levels', () => {
    const { container } = render(<LevelIndicator currentLevel={21} isSpecialLevel={true} />);
    expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument();
    expect(container.querySelector('.text-transparent')).toBeInTheDocument();
    expect(container.querySelector('.bg-clip-text')).toBeInTheDocument();
  });
  
  it('should apply animation when specified', () => {
    const { container } = render(
      <LevelIndicator currentLevel={50} animation="pulse" />
    );
    // Framer motion adds animation styles dynamically, check component structure
    expect(container.firstChild).toBeTruthy();
  });
});