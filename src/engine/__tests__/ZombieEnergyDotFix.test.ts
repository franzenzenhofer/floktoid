/**
 * Test to verify zombie energy dot fix - dots should restore properly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { EnergyDot } from '../entities/EnergyDot';

describe('Zombie Energy Dot Fix', () => {
  let app: Application;

  beforeEach(() => {
    app = new Application();
    Object.defineProperty(app, 'screen', {
      value: { width: 800, height: 600 },
      writable: false,
      configurable: true
    });
    
    // Mock ticker for testing
    app.ticker = {
      add: vi.fn(),
      remove: vi.fn()
    } as any;
    
    // Mock stage
    app.stage = {
      addChild: vi.fn(),
      removeChild: vi.fn()
    } as any;
  });

  it('should clear graphics when stealing dot to prevent zombie state', () => {
    const dot = new EnergyDot(app, 400, 500, 180);
    
    // Access private properties via any cast for testing
    const dotAny = dot as any;
    const sprite = dotAny.sprite;
    const glowSprite = dotAny.glowSprite;
    
    // Mock the clear method to track if it's called
    const spriteClearSpy = vi.spyOn(sprite, 'clear');
    const glowClearSpy = vi.spyOn(glowSprite, 'clear');
    
    // Steal the dot
    dot.steal();
    
    // CRITICAL ASSERTIONS:
    // 1. Graphics should be cleared when stealing
    expect(spriteClearSpy).toHaveBeenCalled();
    expect(glowClearSpy).toHaveBeenCalled();
    
    // 2. Sprites should be invisible
    expect(sprite.visible).toBe(false);
    expect(glowSprite.visible).toBe(false);
    
    // 3. Dot should be marked as stolen
    expect(dot.stolen).toBe(true);
    
    console.log('✅ Graphics cleared on steal - no zombie graphics retained');
  });

  it('should immediately redraw when restoring dot to prevent zombie appearance', () => {
    const dot = new EnergyDot(app, 400, 500, 180);
    
    // Access private draw method via any cast
    const dotAny = dot as any;
    const drawSpy = vi.spyOn(dotAny, 'draw');
    
    // Steal then restore
    dot.steal();
    
    // Clear the spy count from constructor
    drawSpy.mockClear();
    
    // Restore the dot
    dot.restore();
    
    // CRITICAL ASSERTIONS:
    // 1. Draw should be called immediately on restore
    expect(drawSpy).toHaveBeenCalledTimes(1);
    
    // 2. Sprites should be visible
    expect(dotAny.sprite.visible).toBe(true);
    expect(dotAny.glowSprite.visible).toBe(true);
    
    // 3. Dot should not be stolen
    expect(dot.stolen).toBe(false);
    
    console.log('✅ Immediate redraw on restore - no zombie state possible');
  });

  it('should handle rapid steal/restore cycles without zombies', () => {
    const dot = new EnergyDot(app, 400, 500, 180);
    const dotAny = dot as any;
    
    // Simulate rapid steal/restore like when bird grabs and immediately dies
    for (let i = 0; i < 10; i++) {
      dot.steal();
      expect(dot.stolen).toBe(true);
      expect(dotAny.sprite.visible).toBe(false);
      
      // Immediately restore (simulating bird death)
      dot.restore();
      expect(dot.stolen).toBe(false);
      expect(dotAny.sprite.visible).toBe(true);
      
      // Graphics should be in consistent state
      // No zombie dots should appear
    }
    
    console.log('✅ Rapid steal/restore cycles handled correctly');
  });

  it('should not show incomplete graphics after restore', () => {
    const dot = new EnergyDot(app, 400, 500, 180);
    const dotAny = dot as any;
    
    // Mock graphics to track state
    const sprite = dotAny.sprite;
    const mockCircleCalls: any[] = [];
    const mockFillCalls: any[] = [];
    
    sprite.circle = vi.fn((...args) => {
      mockCircleCalls.push(args);
      return sprite;
    });
    
    sprite.fill = vi.fn((...args) => {
      mockFillCalls.push(args);
      return sprite;
    });
    
    // Steal the dot
    dot.steal();
    
    // Clear mock tracking
    mockCircleCalls.length = 0;
    mockFillCalls.length = 0;
    
    // Restore should trigger immediate redraw
    dot.restore();
    
    // Should have drawn both the colored dot and white core
    expect(mockCircleCalls.length).toBeGreaterThanOrEqual(2); // At least dot + core
    expect(mockFillCalls.length).toBeGreaterThanOrEqual(2); // At least dot fill + core fill
    
    // Check that white core was drawn (last fill should be white)
    const lastFill = mockFillCalls[mockFillCalls.length - 1];
    if (lastFill && lastFill[0] && typeof lastFill[0] === 'object') {
      expect(lastFill[0].color).toBe(0xFFFFFF); // White color for core
    }
    
    console.log('✅ Complete graphics drawn on restore - white core included');
  });
});