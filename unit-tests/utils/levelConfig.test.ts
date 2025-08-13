import { describe, it, expect } from 'vitest';
import { getLevelConfig, getLevelMilestoneDescription, calculateLevelXP } from '../../src/utils/levelConfig';

describe('getLevelConfig', () => {
  it('returns correct config for level 1', () => {
    const config = getLevelConfig(1);
    expect(config).toEqual({
      level: 1,
      gridSize: 3,
      colors: 3,
      requiredMoves: 1,
      powerTiles: 0,
      lockedTiles: 0,
      hintsEnabled: true,
      timeLimit: 0
    });
  });

  it('returns correct config for level 3 (last tutorial)', () => {
    const config = getLevelConfig(3);
    expect(config).toEqual({
      level: 3,
      gridSize: 3,
      colors: 3,
      requiredMoves: 3,
      powerTiles: 0,
      lockedTiles: 0,
      hintsEnabled: true,
      timeLimit: 0
    });
  });

  it('disables hints after level 3', () => {
    const config = getLevelConfig(4);
    expect(config.hintsEnabled).toBe(false);
  });

  it('increases grid size at level 21', () => {
    const config20 = getLevelConfig(20);
    const config21 = getLevelConfig(21);
    expect(config20.gridSize).toBe(3);
    expect(config21.gridSize).toBe(4);
  });

  it('introduces power tiles at level 31', () => {
    const config30 = getLevelConfig(30);
    const config31 = getLevelConfig(31);
    expect(config30.powerTiles).toBe(0);
    expect(config31.powerTiles).toBe(1);
  });

  it('adds 4th color at level 41', () => {
    const config40 = getLevelConfig(40);
    const config41 = getLevelConfig(41);
    expect(config40.colors).toBe(3);
    expect(config41.colors).toBe(4);
  });

  it('introduces locked tiles at level 71', () => {
    const config70 = getLevelConfig(70);
    const config71 = getLevelConfig(71);
    expect(config70.lockedTiles).toBe(0);
    expect(config71.lockedTiles).toBe(1);
  });

  it('handles levels beyond 100', () => {
    const config150 = getLevelConfig(150);
    expect(config150.gridSize).toBe(6);
    expect(config150.colors).toBeGreaterThanOrEqual(3);
    expect(config150.colors).toBeLessThanOrEqual(5);
    expect(config150.requiredMoves).toBeGreaterThan(64);
  });

  it('caps grid size at reasonable maximum', () => {
    const config500 = getLevelConfig(500);
    expect(config500.gridSize).toBeLessThanOrEqual(10);
  });
});

describe('getLevelMilestoneDescription', () => {
  it('returns welcome message for level 1', () => {
    const desc = getLevelMilestoneDescription(1);
    expect(desc).toContain('Welcome');
  });

  it('returns grid expansion message for level 21', () => {
    const desc = getLevelMilestoneDescription(21);
    expect(desc).toContain('4×4');
  });

  it('returns power tile message for level 31', () => {
    const desc = getLevelMilestoneDescription(31);
    expect(desc).toContain('Power tiles');
  });

  it('returns null for non-milestone levels', () => {
    const desc = getLevelMilestoneDescription(15);
    expect(desc).toBeNull();
  });
});

describe('calculateLevelXP', () => {
  const config = {
    level: 10,
    gridSize: 3,
    colors: 3,
    requiredMoves: 10,
    powerTiles: 0,
    lockedTiles: 0,
    hintsEnabled: false,
    timeLimit: 0
  };

  it('gives base XP for completing level', () => {
    const xp = calculateLevelXP(config, 15, false);
    expect(xp).toBeGreaterThan(0);
  });

  it('gives efficiency bonus for perfect play', () => {
    const xpPerfect = calculateLevelXP(config, 10, false); // Perfect moves
    const xpNormal = calculateLevelXP(config, 15, false); // More moves
    expect(xpPerfect).toBeGreaterThan(xpNormal);
  });

  it('reduces XP when hints are used', () => {
    const xpNoHints = calculateLevelXP(config, 10, false);
    const xpWithHints = calculateLevelXP(config, 10, true);
    expect(xpWithHints).toBe(Math.floor(xpNoHints * 0.5));
  });

  it('gives complexity bonus for power/locked tiles', () => {
    const complexConfig = { ...config, powerTiles: 2, lockedTiles: 1 };
    const xpComplex = calculateLevelXP(complexConfig, 10, false);
    const xpSimple = calculateLevelXP(config, 10, false);
    expect(xpComplex).toBeGreaterThan(xpSimple);
  });
});