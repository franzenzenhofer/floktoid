import { describe, it, expect } from 'vitest';
import { getLevelConfig } from '../../src/utils/levelConfig';

describe('Level Configuration Transitions', () => {
  it('should ensure all levels can generate required moves within grid limits', () => {
    const testLevels = [1, 9, 10, 18, 19, 27, 28, 32, 48, 64, 65, 75, 100];
    
    for (const level of testLevels) {
      const config = getLevelConfig(level);
      const maxPossibleMoves = config.gridSize * config.gridSize * (config.colors - 1);
      const canGenerate = config.requiredMoves <= maxPossibleMoves;
      
      expect(canGenerate).toBe(true);
      
      // Log for visibility
      console.log(
        `Level ${level}: ${config.gridSize}x${config.gridSize} grid, ` +
        `${config.colors} colors, ${config.requiredMoves} moves ` +
        `(max possible: ${maxPossibleMoves})`
      );
    }
  });
  
  it('should use 2 colors for levels 1-9', () => {
    for (let level = 1; level <= 9; level++) {
      const config = getLevelConfig(level);
      expect(config.colors).toBe(2);
    }
  });
  
  it('should transition colors at correct levels', () => {
    expect(getLevelConfig(9).colors).toBe(2);
    expect(getLevelConfig(10).colors).toBe(3); // 3 colors unlocked
    expect(getLevelConfig(18).colors).toBe(3);
    expect(getLevelConfig(19).colors).toBe(4); // 4 colors unlocked
    expect(getLevelConfig(27).colors).toBe(4);
    expect(getLevelConfig(28).colors).toBe(2); // Back to 2 for new grid
  });
  
  it('should transition from 3x3 to 4x4 at level 28', () => {
    const level27 = getLevelConfig(27);
    const level28 = getLevelConfig(28);
    
    expect(level27.gridSize).toBe(3);
    expect(level28.gridSize).toBe(4);
    expect(level27.requiredMoves).toBe(27); // Max for 3x3 with 4 colors
    expect(level28.requiredMoves).toBeLessThanOrEqual(16); // Within 4x4 with 2 colors limit
  });
  
  it('should transition from 4x4 to 5x5 at level 65', () => {
    const level64 = getLevelConfig(64);
    const level65 = getLevelConfig(65);
    
    expect(level64.gridSize).toBe(4);
    expect(level65.gridSize).toBe(5);
    expect(level64.requiredMoves).toBeLessThanOrEqual(48); // 4x4 with 4 colors max
    expect(level65.requiredMoves).toBeLessThanOrEqual(50); // 5x5 with 3 colors max
  });
  
  it('should never require more moves than mathematically possible', () => {
    // Test levels 1-100
    for (let level = 1; level <= 100; level++) {
      const config = getLevelConfig(level);
      const maxPossibleMoves = config.gridSize * config.gridSize * (config.colors - 1);
      
      expect(config.requiredMoves).toBeLessThanOrEqual(maxPossibleMoves);
    }
  });
  
  it('should have appropriate move progression', () => {
    // Check that moves increase within each grid size
    // Level 1-27 (3x3)
    for (let level = 1; level < 27; level++) {
      const current = getLevelConfig(level);
      const next = getLevelConfig(level + 1);
      if (current.gridSize === next.gridSize) {
        expect(next.requiredMoves).toBeGreaterThanOrEqual(current.requiredMoves);
      }
    }
    
    // Verify grid transitions may reset moves but stay within limits
    const level27 = getLevelConfig(27);
    const level28 = getLevelConfig(28);
    expect(level28.requiredMoves).toBeLessThanOrEqual(16); // 4x4 with 2 colors
  });
});