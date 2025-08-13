import { describe, it, expect } from 'vitest';
import { GameConfig } from '../GameConfig';

describe('GameConfig', () => {
  it('should have valid flocking parameters', () => {
    expect(GameConfig.VIEW_RADIUS).toBeGreaterThan(0);
    expect(GameConfig.SEPARATION_RADIUS).toBeGreaterThan(0);
    expect(GameConfig.SEPARATION_RADIUS).toBeLessThan(GameConfig.VIEW_RADIUS);
  });

  it('should have valid progression parameters', () => {
    expect(GameConfig.BIRDS_PER_WAVE).toBeDefined();
    expect(GameConfig.BIRDS_PER_WAVE[0]).toBe(2);
    expect(GameConfig.BIRDS_PER_WAVE[1]).toBe(4);
    expect(GameConfig.BIRDS_PER_WAVE[2]).toBe(8);
    expect(GameConfig.SPEED_GROWTH).toBeGreaterThan(1);
    expect(GameConfig.SPAWN_BURST).toBeGreaterThan(0);
  });

  it('should have valid asteroid parameters', () => {
    expect(GameConfig.AST_MIN).toBeGreaterThan(0);
    expect(GameConfig.AST_MAX).toBeGreaterThan(GameConfig.AST_MIN);
    expect(GameConfig.AST_SPEED).toBeGreaterThan(0);
  });

  it('should have valid weight parameters', () => {
    expect(GameConfig.WEIGHT_SEPARATION).toBeGreaterThan(0);
    expect(GameConfig.WEIGHT_ALIGNMENT).toBeGreaterThan(0);
    expect(GameConfig.WEIGHT_COHESION).toBeGreaterThan(0);
    expect(GameConfig.WEIGHT_TARGET).toBeGreaterThan(0);
    expect(GameConfig.WEIGHT_AVOID).toBeGreaterThan(0);
  });
});