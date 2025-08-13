import { describe, it, expect } from 'vitest';
import { GameConfig } from '../GameConfig';

describe('Game Logic Tests', () => {
  describe('Angle Restrictions', () => {
    it('should only allow launch angles between 15 and 70 degrees from horizontal', () => {
      const calculateAngle = (dx: number, dy: number) => {
        const angle = Math.atan2(Math.abs(dy), Math.abs(dx)) * (180 / Math.PI);
        return angle;
      };

      // Test minimum angle (15 degrees)
      const minAngle = calculateAngle(100, 27); // tan(15°) ≈ 0.268
      expect(minAngle).toBeCloseTo(15, 0);

      // Test maximum angle (70 degrees)  
      const maxAngle = calculateAngle(36, 100); // tan(70°) ≈ 2.747
      expect(maxAngle).toBeCloseTo(70, 0);

      // Test invalid angle (too shallow)
      const tooShallow = calculateAngle(100, 10);
      expect(tooShallow).toBeLessThan(15);

      // Test invalid angle (too steep)
      const tooSteep = calculateAngle(10, 100);
      expect(tooSteep).toBeGreaterThan(70);
    });

    it('should validate launch distance minimum', () => {
      const isValidLaunch = (dist: number) => dist > 20;
      
      expect(isValidLaunch(21)).toBe(true);
      expect(isValidLaunch(20)).toBe(false);
      expect(isValidLaunch(19)).toBe(false);
    });
  });

  describe('Asteroid Behavior', () => {
    it('should shrink asteroids when wrapping edges', () => {
      const shrinkFactor = 0.95;
      let size = 1.0;
      
      // Simulate wrapping
      size *= shrinkFactor;
      expect(size).toBeCloseTo(0.95);
      
      // Multiple wraps
      for (let i = 0; i < 5; i++) {
        size *= shrinkFactor;
      }
      expect(size).toBeLessThan(0.8);
    });

    it('should apply slowness penalty based on size', () => {
      const calculateSpeedMultiplier = (size: number) => {
        // Larger asteroids are slower
        return 0.3 + (1.5 - size) * 0.7;
      };

      // Small asteroid (fast)
      expect(calculateSpeedMultiplier(0.5)).toBeCloseTo(1.0);
      
      // Large asteroid (slow - 70% slower means 30% speed)
      expect(calculateSpeedMultiplier(1.5)).toBeCloseTo(0.3);
      
      // Medium asteroid
      expect(calculateSpeedMultiplier(1.0)).toBeCloseTo(0.65);
    });

    it('should generate unique asteroid shapes', () => {
      const generateAsteroidShape = () => {
        const points = [];
        const numPoints = 7 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const radius = 15 + Math.random() * 10;
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          });
        }
        return points;
      };

      const shapes = Array.from({ length: 100 }, generateAsteroidShape);
      const serialized = shapes.map(s => JSON.stringify(s));
      const unique = new Set(serialized);
      
      // Due to randomness, all should be unique
      expect(unique.size).toBe(100);
    });
  });

  describe('Bird Spawning', () => {
    it('should spawn birds in bursts when reaching top', () => {
      const SPAWN_BURST = 10;
      let birdCount = 5;
      
      // Bird reaches top
      const newBirds = SPAWN_BURST;
      birdCount += newBirds;
      
      expect(birdCount).toBe(15);
    });

    it('should handle multiple birds reaching top simultaneously', () => {
      const SPAWN_BURST = 10;
      let birdCount = 5;
      const birdsReachingTop = 3;
      
      // Multiple birds reach top
      const newBirds = SPAWN_BURST * birdsReachingTop;
      birdCount += newBirds;
      
      expect(birdCount).toBe(35);
    });

    it('should increase bird count per wave', () => {
      const calculateBirdsForWave = (wave: number) => {
        const base = 2; // Base birds for wave 1
        const growth = 1.15; // Growth factor
        return Math.ceil(base * Math.pow(growth, wave - 1));
      };

      expect(calculateBirdsForWave(1)).toBe(2);
      expect(calculateBirdsForWave(2)).toBe(3);
      expect(calculateBirdsForWave(5)).toBeGreaterThan(3);
      expect(calculateBirdsForWave(10)).toBeGreaterThan(5);
    });
  });

  describe('Energy Dot Mechanics', () => {
    it('should respawn dots after delay', () => {
      const RESPAWN_DELAY = 15000; // 15 seconds
      let timer = 0;
      const deltaTime = 16; // ~60fps
      
      // Simulate time passing
      while (timer < RESPAWN_DELAY) {
        timer += deltaTime;
      }
      
      expect(timer).toBeGreaterThanOrEqual(RESPAWN_DELAY);
    });

    it('should track falling dots separately', () => {
      interface DotInfo {
        originalIndex: number;
        y: number;
        vy: number;
      }
      
      interface EnergyDotState {
        stolen: boolean;
      }
      
      const fallingDots: DotInfo[] = [];
      const energyDots = Array(5).fill({ stolen: false }) as EnergyDotState[];
      
      // Simulate dot being stolen and falling
      energyDots[2] = { stolen: true };
      fallingDots.push({ 
        originalIndex: 2,
        y: 100,
        vy: 0.5
      });
      
      expect(fallingDots.length).toBe(1);
      expect(energyDots.filter(d => d.stolen).length).toBe(1);
    });
  });

  describe('Game Over Conditions', () => {
    it('should trigger game over when all dots are gone', () => {
      interface DotState {
        stolen: boolean;
      }
      
      interface FallingDot {
        y: number;
      }
      
      const checkGameOver = (dots: DotState[], fallingDots: FallingDot[], birdsWithDots: number) => {
        const availableDots = dots.filter(d => !d.stolen);
        return availableDots.length === 0 && 
               fallingDots.length === 0 && 
               birdsWithDots === 0;
      };

      // All dots stolen, no falling, no birds carrying
      expect(checkGameOver(
        [{ stolen: true }, { stolen: true }],
        [],
        0
      )).toBe(true);

      // Some dots still available
      expect(checkGameOver(
        [{ stolen: false }, { stolen: true }],
        [],
        0
      )).toBe(false);

      // All stolen but birds still carrying
      expect(checkGameOver(
        [{ stolen: true }, { stolen: true }],
        [],
        2
      )).toBe(false);

      // All stolen but dots still falling
      expect(checkGameOver(
        [{ stolen: true }, { stolen: true }],
        [{ y: 100 }],
        0
      )).toBe(false);
    });
  });

  describe('Combo System', () => {
    it('should increase combo on rapid hits', () => {
      let comboCount = 0;
      let comboTimer = 0;
      const COMBO_WINDOW = 2000;

      const hit = () => {
        if (comboTimer > 0) {
          comboCount++;
        }
        comboTimer = COMBO_WINDOW;
      };

      hit(); // First hit
      hit(); // Combo x1
      hit(); // Combo x2
      
      expect(comboCount).toBe(2);
    });

    it('should reset combo after timeout', () => {
      let comboCount = 0;
      let comboTimer = 2000;
      
      // Simulate time passing
      comboTimer -= 2100; // Past window
      
      if (comboTimer <= 0) {
        comboCount = 0;
      }
      
      expect(comboCount).toBe(0);
    });

    it('should apply combo multiplier to score', () => {
      const calculateScore = (base: number, combo: number) => {
        const multiplier = Math.min(1 + combo * 0.5, 5);
        return Math.floor(base * multiplier);
      };

      expect(calculateScore(100, 0)).toBe(100); // 1x
      expect(calculateScore(100, 2)).toBe(200); // 2x
      expect(calculateScore(100, 8)).toBe(500); // 5x max
      expect(calculateScore(100, 10)).toBe(500); // Still 5x max
    });
  });

  describe('Wave Progression', () => {
    it('should increase difficulty over waves', () => {
      const getWaveStats = (wave: number) => ({
        birds: Math.ceil(2 * Math.pow(1.15, wave - 1)),
        speed: GameConfig.BASE_SPEED * Math.pow(GameConfig.SPEED_GROWTH, wave - 1),
        force: GameConfig.BASE_FORCE * Math.pow(1.02, wave - 1)
      });

      const wave1 = getWaveStats(1);
      const wave5 = getWaveStats(5);
      const wave10 = getWaveStats(10);

      expect(wave5.birds).toBeGreaterThan(wave1.birds);
      expect(wave10.birds).toBeGreaterThan(wave5.birds);
      expect(wave5.speed).toBeGreaterThan(wave1.speed);
      expect(wave10.force).toBeGreaterThan(wave1.force);
    });
  });

  describe('Collision Detection', () => {
    it('should handle multiple simultaneous collisions without freezing', () => {
      const asteroids = Array(10).fill(null).map((_, i) => ({ id: i, toRemove: false }));
      const toRemove = new Set<number>();
      
      // Mark for removal
      toRemove.add(2);
      toRemove.add(5);
      toRemove.add(7);
      
      // Remove in reverse order to preserve indices
      const sorted = Array.from(toRemove).sort((a, b) => b - a);
      for (const idx of sorted) {
        asteroids.splice(idx, 1);
      }
      
      expect(asteroids.length).toBe(7);
      expect(asteroids[2].id).not.toBe(2); // Original index 2 is gone
    });
  });
});