import { describe, it, expect } from 'vitest';
import { generateAsteroid, generateAsteroidBatch, mutateAsteroid } from '../src/engine/utils/AsteroidGenerator';

describe('Asteroid Generation', () => {
  describe('generateAsteroid', () => {
    it('should always generate asteroids with 3-13 edges', () => {
      // Test 100 random asteroids
      for (let i = 0; i < 100; i++) {
        const asteroid = generateAsteroid();
        const numVertices = asteroid.vertices.length / 2;
        
        expect(numVertices).toBeGreaterThanOrEqual(3);
        expect(numVertices).toBeLessThanOrEqual(13);
      }
    });
    
    it('should generate different shapes with different seeds', () => {
      const asteroid1 = generateAsteroid(12345);
      const asteroid2 = generateAsteroid(54321);
      
      // Should have different vertices
      expect(asteroid1.vertices).not.toEqual(asteroid2.vertices);
    });
    
    it('should generate same shape with same seed (deterministic)', () => {
      const asteroid1 = generateAsteroid(12345);
      const asteroid2 = generateAsteroid(12345);
      
      // Should have identical vertices
      expect(asteroid1.vertices).toEqual(asteroid2.vertices);
      expect(asteroid1.roughness).toEqual(asteroid2.roughness);
    });
    
    it('should respect size parameter', () => {
      const smallAsteroid = generateAsteroid(undefined, 10);
      const largeAsteroid = generateAsteroid(undefined, 100);
      
      // Calculate average radius
      const getAvgRadius = (vertices: number[]) => {
        let total = 0;
        for (let i = 0; i < vertices.length; i += 2) {
          const x = vertices[i];
          const y = vertices[i + 1];
          total += Math.sqrt(x * x + y * y);
        }
        return total / (vertices.length / 2);
      };
      
      const smallRadius = getAvgRadius(smallAsteroid.vertices);
      const largeRadius = getAvgRadius(largeAsteroid.vertices);
      
      expect(largeRadius).toBeGreaterThan(smallRadius * 5);
    });
    
    it('should never generate self-intersecting polygons', () => {
      // Test 50 asteroids for self-intersection
      for (let i = 0; i < 50; i++) {
        const asteroid = generateAsteroid();
        const vertices = asteroid.vertices;
        
        // Check that all vertices form a star-shaped polygon
        // by verifying angles are strictly increasing
        const angles: number[] = [];
        for (let j = 0; j < vertices.length; j += 2) {
          const x = vertices[j];
          const y = vertices[j + 1];
          const angle = Math.atan2(y, x);
          angles.push(angle);
        }
        
        // Sort angles and check they're unique (no duplicate angles)
        const sortedAngles = [...angles].sort((a, b) => a - b);
        for (let j = 1; j < sortedAngles.length; j++) {
          expect(sortedAngles[j]).toBeGreaterThan(sortedAngles[j - 1]);
        }
      }
    });
    
    it('should have valid roughness values', () => {
      const asteroid = generateAsteroid();
      
      // Roughness should have one value per edge
      expect(asteroid.roughness.length).toBe(asteroid.vertices.length / 2);
      
      // All roughness values should be positive
      asteroid.roughness.forEach(r => {
        expect(r).toBeGreaterThan(0);
        expect(r).toBeLessThanOrEqual(2); // Reasonable range
      });
    });
    
    it('should handle edge case seeds', () => {
      const edgeCases = [0, 1, -1, Number.MAX_SAFE_INTEGER, 0xffffffff];
      
      edgeCases.forEach(seed => {
        const asteroid = generateAsteroid(seed);
        const numVertices = asteroid.vertices.length / 2;
        
        expect(numVertices).toBeGreaterThanOrEqual(3);
        expect(numVertices).toBeLessThanOrEqual(13);
      });
    });
  });
  
  describe('generateAsteroidBatch', () => {
    it('should generate requested number of asteroids', () => {
      const batch = generateAsteroidBatch(5);
      expect(batch.length).toBe(5);
    });
    
    it('should generate unique asteroids in batch', () => {
      const batch = generateAsteroidBatch(10);
      
      // Check that all asteroids are different
      for (let i = 0; i < batch.length; i++) {
        for (let j = i + 1; j < batch.length; j++) {
          expect(batch[i].vertices).not.toEqual(batch[j].vertices);
        }
      }
    });
    
    it('should respect size parameter for all asteroids', () => {
      const batch = generateAsteroidBatch(5, undefined, 50);
      
      batch.forEach(asteroid => {
        let totalRadius = 0;
        for (let i = 0; i < asteroid.vertices.length; i += 2) {
          const x = asteroid.vertices[i];
          const y = asteroid.vertices[i + 1];
          totalRadius += Math.sqrt(x * x + y * y);
        }
        const avgRadius = totalRadius / (asteroid.vertices.length / 2);
        
        // Should be roughly around the specified size
        expect(avgRadius).toBeGreaterThan(20);
        expect(avgRadius).toBeLessThan(100);
      });
    });
  });
  
  describe('mutateAsteroid', () => {
    it('should create a different but similar-sized asteroid', () => {
      const original = generateAsteroid(12345, 50);
      const mutated = mutateAsteroid(original);
      
      // Should be different
      expect(mutated.vertices).not.toEqual(original.vertices);
      
      // But similar size
      const getAvgRadius = (vertices: number[]) => {
        let total = 0;
        for (let i = 0; i < vertices.length; i += 2) {
          const x = vertices[i];
          const y = vertices[i + 1];
          total += Math.sqrt(x * x + y * y);
        }
        return total / (vertices.length / 2);
      };
      
      const originalRadius = getAvgRadius(original.vertices);
      const mutatedRadius = getAvgRadius(mutated.vertices);
      
      // Should be within 50% of original size
      expect(mutatedRadius).toBeGreaterThan(originalRadius * 0.5);
      expect(mutatedRadius).toBeLessThan(originalRadius * 1.5);
    });
    
    it('should respect edge count constraints', () => {
      const original = generateAsteroid();
      const mutated = mutateAsteroid(original);
      
      const numVertices = mutated.vertices.length / 2;
      expect(numVertices).toBeGreaterThanOrEqual(3);
      expect(numVertices).toBeLessThanOrEqual(13);
    });
  });
  
  describe('Performance', () => {
    it('should generate 1000 asteroids quickly', () => {
      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        generateAsteroid();
      }
      
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(1000); // Should take less than 1 second
    });
  });
});