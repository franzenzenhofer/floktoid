import { describe, it, expect } from 'vitest';
import { VectorUtils } from '../utils/VectorUtils';

describe('VectorUtils - CRITICAL MATHEMATICAL OPERATIONS SAFETY', () => {
  describe('CRITICAL: NaN Prevention', () => {
    it('should never return NaN from normalize()', () => {
      // These are common scenarios that could cause NaN
      const testVectors = [
        { x: 0, y: 0 },           // Zero vector
        { x: NaN, y: 5 },         // NaN input
        { x: 3, y: NaN },         // NaN input
        { x: NaN, y: NaN },       // Both NaN
        { x: Infinity, y: 5 },    // Infinity input
        { x: -Infinity, y: 3 },   // Negative infinity
        { x: 0.000001, y: 0 },    // Very small vector
        { x: 1e-10, y: 1e-10 },   // Extremely small vector
      ];

      testVectors.forEach((vector, i) => {
        const result = VectorUtils.normalize(vector);
        
        expect(Number.isFinite(result.x)).toBe(true);
        expect(Number.isFinite(result.y)).toBe(true);
        expect(Number.isNaN(result.x)).toBe(false);
        expect(Number.isNaN(result.y)).toBe(false);
        
        console.log(`✅ CRITICAL: Vector ${i} normalized safely: (${vector.x}, ${vector.y}) → (${result.x.toFixed(3)}, ${result.y.toFixed(3)})`);
      });
    });

    it('should handle zero vector normalization gracefully', () => {
      const zeroVector = { x: 0, y: 0 };
      const result = VectorUtils.normalize(zeroVector);
      
      // Should return a safe default, not NaN
      expect(Number.isFinite(result.x)).toBe(true);
      expect(Number.isFinite(result.y)).toBe(true);
      
      // Common approaches: return (0,0), (1,0), or (0,1)
      const magnitude = Math.sqrt(result.x * result.x + result.y * result.y);
      expect(magnitude).toBeGreaterThanOrEqual(0);
      expect(magnitude).toBeLessThanOrEqual(1);
      
      console.log(`✅ CRITICAL: Zero vector handled: (0, 0) → (${result.x}, ${result.y})`);
    });
  });

  describe('CRITICAL: Distance Calculations', () => {
    it('should calculate distances accurately', () => {
      const testCases = [
        { p1: { x: 0, y: 0 }, p2: { x: 3, y: 4 }, expected: 5 },           // 3-4-5 triangle
        { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, expected: 0 },           // Same point
        { p1: { x: -1, y: -1 }, p2: { x: 1, y: 1 }, expected: Math.sqrt(8) }, // Negative coords
        { p1: { x: 100, y: 200 }, p2: { x: 103, y: 204 }, expected: 5 },   // Large coordinates
      ];

      testCases.forEach((testCase, i) => {
        const result = VectorUtils.distance(testCase.p1, testCase.p2);
        
        expect(result).toBeCloseTo(testCase.expected, 10);
        expect(Number.isFinite(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        
        console.log(`✅ CRITICAL: Distance calculation ${i} correct: ${result.toFixed(3)} (expected ${testCase.expected.toFixed(3)})`);
      });
    });

    it('should handle extreme coordinate values', () => {
      const extremeCases = [
        { x: Number.MAX_SAFE_INTEGER, y: 0 },
        { x: Number.MIN_SAFE_INTEGER, y: 0 },
        { x: 1e10, y: 1e10 },
        { x: -1e10, y: -1e10 },
      ];

      extremeCases.forEach((point, i) => {
        const origin = { x: 0, y: 0 };
        const result = VectorUtils.distance(origin, point);
        
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
        expect(result).toBeGreaterThanOrEqual(0);
        
        console.log(`✅ CRITICAL: Extreme distance ${i} handled: ${result}`);
      });
    });
  });

  describe('CRITICAL: Magnitude Limiting', () => {
    it('should limit vector magnitudes correctly', () => {
      const testVectors = [
        { vector: { x: 10, y: 0 }, limit: 5, expectedMag: 5 },
        { vector: { x: 3, y: 4 }, limit: 10, expectedMag: 5 },     // Already within limit
        { vector: { x: 0, y: 0 }, limit: 5, expectedMag: 0 },      // Zero vector
        { vector: { x: 100, y: 100 }, limit: 1, expectedMag: 1 },  // Large vector limited
      ];

      testVectors.forEach((test, i) => {
        const result = VectorUtils.limitMagnitude(test.vector, test.limit);
        const actualMag = Math.sqrt(result.x * result.x + result.y * result.y);
        
        expect(Number.isFinite(result.x)).toBe(true);
        expect(Number.isFinite(result.y)).toBe(true);
        expect(actualMag).toBeLessThanOrEqual(test.limit + 0.0001); // Small tolerance for floating point
        
        if (test.expectedMag > 0) {
          expect(actualMag).toBeCloseTo(Math.min(test.expectedMag, test.limit), 5);
        }
        
        console.log(`✅ CRITICAL: Magnitude limiting ${i}: (${test.vector.x}, ${test.vector.y}) → (${result.x.toFixed(3)}, ${result.y.toFixed(3)}) mag=${actualMag.toFixed(3)}`);
      });
    });

    it('should handle invalid limit values', () => {
      const vector = { x: 5, y: 5 };
      
      const invalidLimits = [NaN, Infinity, -Infinity, -1, 0];
      
      invalidLimits.forEach((limit, _i) => {
        const result = VectorUtils.limitMagnitude(vector, limit);
        
        expect(Number.isFinite(result.x)).toBe(true);
        expect(Number.isFinite(result.y)).toBe(true);
        
        console.log(`✅ CRITICAL: Invalid limit ${limit} handled gracefully`);
      });
    });
  });

  describe('CRITICAL: Value Clamping', () => {
    it('should clamp values within bounds', () => {
      const testCases = [
        { value: 5, min: 0, max: 10, expected: 5 },    // Within bounds
        { value: -5, min: 0, max: 10, expected: 0 },   // Below min
        { value: 15, min: 0, max: 10, expected: 10 },  // Above max
        { value: 7.5, min: 5, max: 10, expected: 7.5 }, // Decimal within bounds
      ];

      testCases.forEach((test, i) => {
        const result = VectorUtils.clamp(test.value, test.min, test.max);
        
        expect(result).toBe(test.expected);
        expect(result).toBeGreaterThanOrEqual(test.min);
        expect(result).toBeLessThanOrEqual(test.max);
        
        console.log(`✅ CRITICAL: Clamp ${i}: ${test.value} [${test.min}, ${test.max}] → ${result}`);
      });
    });

    it('should handle invalid clamp parameters', () => {
      const invalidCases = [
        { value: 5, min: NaN, max: 10 },
        { value: 5, min: 0, max: NaN },
        { value: NaN, min: 0, max: 10 },
        { value: 5, min: 10, max: 5 },  // Min > Max
        { value: Infinity, min: 0, max: 10 },
        { value: 5, min: -Infinity, max: Infinity },
      ];

      invalidCases.forEach((testCase, i) => {
        const result = VectorUtils.clamp(testCase.value, testCase.min, testCase.max);
        
        // Should return a valid finite number
        expect(Number.isFinite(result)).toBe(true);
        expect(Number.isNaN(result)).toBe(false);
        
        console.log(`✅ CRITICAL: Invalid clamp case ${i} handled: ${result}`);
      });
    });
  });

  describe('CRITICAL: Value Validation', () => {
    it('should detect and fix invalid vectors', () => {
      const invalidVectors = [
        { x: NaN, y: 5 },
        { x: 3, y: NaN },
        { x: NaN, y: NaN },
        { x: Infinity, y: 5 },
        { x: 3, y: -Infinity },
        { x: undefined as any, y: 5 },
        { x: null as any, y: 5 },
        { x: "invalid" as any, y: 5 },
      ];

      invalidVectors.forEach((vector, i) => {
        const result = VectorUtils.ensureValid(vector);
        
        expect(Number.isFinite(result.x)).toBe(true);
        expect(Number.isFinite(result.y)).toBe(true);
        expect(Number.isNaN(result.x)).toBe(false);
        expect(Number.isNaN(result.y)).toBe(false);
        
        console.log(`✅ CRITICAL: Invalid vector ${i} fixed: (${vector.x}, ${vector.y}) → (${result.x}, ${result.y})`);
      });
    });

    it('should preserve valid vectors', () => {
      const validVectors = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: -1, y: -1 },
        { x: 3.14159, y: 2.71828 },
        { x: 1e-10, y: 1e10 },
      ];

      validVectors.forEach((vector, i) => {
        const result = VectorUtils.ensureValid(vector);
        
        expect(result.x).toBe(vector.x);
        expect(result.y).toBe(vector.y);
        
        console.log(`✅ CRITICAL: Valid vector ${i} preserved: (${vector.x}, ${vector.y})`);
      });
    });
  });

  describe('CRITICAL: Performance & Edge Cases', () => {
    it('should perform vector operations quickly', () => {
      const startTime = performance.now();
      
      // Perform thousands of operations
      for (let i = 0; i < 10000; i++) {
        const vector = { x: Math.random() * 100, y: Math.random() * 100 };
        VectorUtils.normalize(vector);
        VectorUtils.limitMagnitude(vector, 10);
        VectorUtils.distance(vector, { x: 0, y: 0 });
        VectorUtils.clamp(vector.x, -10, 10);
        VectorUtils.ensureValid(vector);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(100); // Should be much faster than 100ms
      
      console.log(`✅ CRITICAL: Performance acceptable (${duration.toFixed(2)}ms for 50k operations)`);
    });

    it('should maintain precision with tiny numbers', () => {
      const tinyVectors = [
        { x: 1e-15, y: 1e-15 },
        { x: Number.MIN_VALUE, y: Number.MIN_VALUE },
        { x: 1e-100, y: 1e-100 },
      ];

      tinyVectors.forEach((vector, i) => {
        const normalized = VectorUtils.normalize(vector);
        const distance = VectorUtils.distance(vector, { x: 0, y: 0 });
        const limited = VectorUtils.limitMagnitude(vector, 1);
        
        expect(Number.isFinite(normalized.x)).toBe(true);
        expect(Number.isFinite(normalized.y)).toBe(true);
        expect(Number.isFinite(distance)).toBe(true);
        expect(Number.isFinite(limited.x)).toBe(true);
        expect(Number.isFinite(limited.y)).toBe(true);
        
        console.log(`✅ CRITICAL: Tiny vector ${i} handled safely`);
      });
    });

    it('should handle stress test with random inputs', () => {
      // Generate 1000 random vectors with extreme values
      for (let i = 0; i < 1000; i++) {
        const vector = {
          x: (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER,
          y: (Math.random() - 0.5) * Number.MAX_SAFE_INTEGER
        };
        
        // All operations should complete without throwing
        expect(() => {
          const normalized = VectorUtils.normalize(vector);
          const limited = VectorUtils.limitMagnitude(vector, Math.random() * 1000);
          const distance = VectorUtils.distance(vector, { x: 0, y: 0 });
          const clamped = VectorUtils.clamp(vector.x, -1000, 1000);
          const validated = VectorUtils.ensureValid(vector);
          
          // All results should be finite
          expect(Number.isFinite(normalized.x)).toBe(true);
          expect(Number.isFinite(limited.x)).toBe(true);
          expect(Number.isFinite(distance)).toBe(true);
          expect(Number.isFinite(clamped)).toBe(true);
          expect(Number.isFinite(validated.x)).toBe(true);
        }).not.toThrow();
      }
      
      console.log('✅ CRITICAL: 1000 random extreme vectors handled safely');
    });
  });
});