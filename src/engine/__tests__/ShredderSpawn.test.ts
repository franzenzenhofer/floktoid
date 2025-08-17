import { describe, it, expect } from 'vitest';
import { calculateShredderSpawnProbability } from '../entities/Shredder';

describe('SHREDDER SPAWN PROBABILITY', () => {
  it('matches table values', () => {
    const cases: Array<[number, number]> = [
      [0, 0.05],
      [10, 0.05],
      [20, 0.07],
      [50, 0.10],
      [100, 0.15],
    ];
    for (const [A, expected] of cases) {
      expect(calculateShredderSpawnProbability(A)).toBeCloseTo(expected);
    }
  });

  it('Monte Carlo sanity at A=20', () => {
    const A = 20;
    const P = calculateShredderSpawnProbability(A);
    let spawns = 0;
    const trials = 10000;
    for (let i = 0; i < trials; i++) {
      if (Math.random() < P) spawns++;
    }
    const rate = spawns / trials;
    console.log(`Monte Carlo spawn rate: ${rate}`);
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.09);
  });
});
