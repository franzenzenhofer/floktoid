import { describe, it, expect } from "vitest";
import {
  calculateShredderSpawnProbability,
  shouldSpawnShredder,
} from "../entities/Shredder";

// Deterministic PRNG (mulberry32)
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Shredder spawn probability", () => {
  it("matches spec table", () => {
    const cases = [
      { A: 0, P: 0.05 },
      { A: 10, P: 0.05 },
      { A: 20, P: 0.07 },
      { A: 50, P: 0.1 },
      { A: 100, P: 0.15 },
    ];
    for (const { A, P } of cases) {
      expect(calculateShredderSpawnProbability(A)).toBeCloseTo(P, 5);
    }
  });

  it("respects clamp", () => {
    const prob = calculateShredderSpawnProbability(1000, {
      clampEnabled: true,
      maxSpawnProb: 0.25,
    });
    expect(prob).toBe(0.25);
  });

  it("should spawn when random below probability", () => {
    const result = shouldSpawnShredder(0, 0, 0.01);
    expect(result).toBe(true);
  });

  it("should not spawn if existing shredders exceed max concurrent", () => {
    const result = shouldSpawnShredder(20, 2, 0.0, { maxConcurrent: 2 });
    expect(result).toBe(false);
  });
});

describe("Shredder spawn Monte Carlo", () => {
  it("approx 7% for A=20", () => {
    const rng = mulberry32(123);
    const trials = 10000;
    let count = 0;
    for (let i = 0; i < trials; i++) {
      if (shouldSpawnShredder(20, 0, rng())) count++;
    }
    const observed = count / trials;
    expect(observed).toBeGreaterThan(0.06);
    expect(observed).toBeLessThan(0.08);
  });
});
