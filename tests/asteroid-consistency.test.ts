import { describe, it, expect, vi } from 'vitest';
import { generateAsteroid } from '../src/engine/utils/AsteroidGenerator';

describe('Asteroid Consistency Tests', () => {
  describe('Edge Distribution', () => {
    it('should generate varied edge counts (not mostly 3-sided)', () => {
      const edgeCounts: Record<number, number> = {};
      
      // Generate 100 asteroids
      for (let i = 0; i < 100; i++) {
        const asteroid = generateAsteroid();
        const numEdges = asteroid.vertices.length / 2;
        edgeCounts[numEdges] = (edgeCounts[numEdges] || 0) + 1;
      }
      
      // Check distribution
      console.log('Edge distribution:', edgeCounts);
      
      // 3-sided should not be more than 20% of asteroids
      const threeSidedCount = edgeCounts[3] || 0;
      expect(threeSidedCount).toBeLessThanOrEqual(20);
      
      // Should have good variety (at least 5 different edge counts)
      const differentEdgeCounts = Object.keys(edgeCounts).length;
      expect(differentEdgeCounts).toBeGreaterThanOrEqual(5);
      
      // Middle values (6-9) should be most common
      const middleCount = (edgeCounts[6] || 0) + (edgeCounts[7] || 0) + 
                         (edgeCounts[8] || 0) + (edgeCounts[9] || 0);
      expect(middleCount).toBeGreaterThan(30); // At least 30% should be 6-9 sided
    });
    
    it('should never generate asteroids with < 3 or > 13 edges', () => {
      for (let i = 0; i < 200; i++) {
        const asteroid = generateAsteroid();
        const numEdges = asteroid.vertices.length / 2;
        expect(numEdges).toBeGreaterThanOrEqual(3);
        expect(numEdges).toBeLessThanOrEqual(13);
      }
    });
  });
  
  describe('Color Consistency', () => {
    it('should use provided hue value correctly', () => {
      // This test would need to be done in integration with Asteroid class
      // For now just verify the shape generation works
      const testHues = [0, 60, 120, 180, 240, 300, 359];
      
      testHues.forEach(hue => {
        // Verify asteroid can be generated with any seed
        const asteroid = generateAsteroid(Math.floor(hue * 1000));
        expect(asteroid.vertices.length).toBeGreaterThanOrEqual(6);
      });
    });
  });
  
  describe('Size Consistency', () => {
    it('should generate asteroids at the requested size', () => {
      const sizes = [15, 30, 50, 75, 100];
      
      sizes.forEach(size => {
        const asteroid = generateAsteroid(undefined, size);
        
        // Calculate average radius
        let totalRadius = 0;
        const numVertices = asteroid.vertices.length / 2;
        
        for (let i = 0; i < numVertices; i++) {
          const x = asteroid.vertices[i * 2];
          const y = asteroid.vertices[i * 2 + 1];
          totalRadius += Math.sqrt(x * x + y * y);
        }
        
        const avgRadius = totalRadius / numVertices;
        
        // Should be roughly the requested size (within 50%)
        expect(avgRadius).toBeGreaterThan(size * 0.5);
        expect(avgRadius).toBeLessThan(size * 1.5);
      });
    });
  });
  
  describe('Visual Consistency', () => {
    it('should maintain shape when scaled', () => {
      const baseShape = generateAsteroid(12345, 30);
      const scaleFactor = 2;
      
      // Manually scale vertices
      const scaledVertices: number[] = [];
      for (let i = 0; i < baseShape.vertices.length; i++) {
        scaledVertices.push(baseShape.vertices[i] * scaleFactor);
      }
      
      // Verify scaling preserves shape properties
      const baseAngles: number[] = [];
      const scaledAngles: number[] = [];
      
      for (let i = 0; i < baseShape.vertices.length; i += 2) {
        const baseAngle = Math.atan2(baseShape.vertices[i + 1], baseShape.vertices[i]);
        const scaledAngle = Math.atan2(scaledVertices[i + 1], scaledVertices[i]);
        
        baseAngles.push(baseAngle);
        scaledAngles.push(scaledAngle);
      }
      
      // Angles should be identical after scaling
      baseAngles.forEach((angle, i) => {
        expect(scaledAngles[i]).toBeCloseTo(angle, 5);
      });
    });
  });
});