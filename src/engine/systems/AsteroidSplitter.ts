/**
 * AsteroidSplitter - Handles splitting asteroids into smaller fragments
 * DRY, modular system for asteroid fragmentation
 */

import * as PIXI from 'pixi.js';
import { Asteroid } from '../entities/Asteroid';
import CentralConfig from '../CentralConfig';

const { SIZES } = CentralConfig;

export class AsteroidSplitter {
  private app: PIXI.Application;
  
  // Split configuration
  private static readonly FRAGMENT_COUNT = 4;
  private static readonly SIZE_REDUCTION_FACTOR = 0.5; // Each fragment is 50% of parent size
  private static readonly SPEED_MULTIPLIER = 1.5; // Fragments move faster
  private static readonly SPREAD_ANGLE = Math.PI * 2 / AsteroidSplitter.FRAGMENT_COUNT;
  private static readonly MIN_FRAGMENT_SIZE = SIZES.ASTEROID.MIN;
  
  constructor(app: PIXI.Application) {
    this.app = app;
  }
  
  /**
   * Split an asteroid into smaller fragments
   * Returns empty array if asteroid is too small to split
   */
  public split(asteroid: Asteroid): Asteroid[] {
    // Check if asteroid is large enough to split
    const fragmentSize = asteroid.size * AsteroidSplitter.SIZE_REDUCTION_FACTOR;
    
    if (fragmentSize < AsteroidSplitter.MIN_FRAGMENT_SIZE) {
      // Too small to split, just destroy
      return [];
    }
    
    const fragments: Asteroid[] = [];
    const parentShape = asteroid.getShapeData();
    const baseSpeed = Math.hypot(asteroid.vx, asteroid.vy) || 50;
    
    // Create fragments in different directions
    for (let i = 0; i < AsteroidSplitter.FRAGMENT_COUNT; i++) {
      const angle = i * AsteroidSplitter.SPREAD_ANGLE + Math.random() * 0.5 - 0.25;
      
      // Calculate fragment velocity
      const speed = baseSpeed * AsteroidSplitter.SPEED_MULTIPLIER * (0.8 + Math.random() * 0.4);
      const vx = Math.cos(angle) * speed + asteroid.vx * 0.3; // Inherit some parent velocity
      const vy = Math.sin(angle) * speed + asteroid.vy * 0.3;
      
      // Slightly randomize position to prevent overlap
      const offsetDist = fragmentSize * 0.5;
      const fragmentX = asteroid.x + Math.cos(angle) * offsetDist;
      const fragmentY = asteroid.y + Math.sin(angle) * offsetDist;
      
      // Create fragment with similar shape but scaled down
      const fragment = new Asteroid(
        this.app,
        fragmentX,
        fragmentY,
        vx,
        vy,
        fragmentSize,
        this.mutateShape(parentShape, fragmentSize),
        asteroid.hue + (Math.random() * 30 - 15) // Slight hue variation
      );
      
      fragments.push(fragment);
    }
    
    return fragments;
  }
  
  /**
   * Split multiple asteroids at once
   */
  public splitMultiple(asteroids: Asteroid[]): Asteroid[] {
    const allFragments: Asteroid[] = [];
    
    for (const asteroid of asteroids) {
      const fragments = this.split(asteroid);
      allFragments.push(...fragments);
    }
    
    return allFragments;
  }
  
  /**
   * Create a chain reaction split (for special effects)
   */
  public chainSplit(
    asteroid: Asteroid,
    depth: number = 1,
    maxDepth: number = 2
  ): Asteroid[] {
    if (depth > maxDepth) return [];
    
    const fragments = this.split(asteroid);
    const allFragments = [...fragments];
    
    // Recursively split some fragments
    if (depth < maxDepth) {
      const numToSplit = Math.min(2, fragments.length);
      for (let i = 0; i < numToSplit; i++) {
        const subFragments = this.chainSplit(fragments[i], depth + 1, maxDepth);
        allFragments.push(...subFragments);
      }
    }
    
    return allFragments;
  }
  
  /**
   * Mutate parent shape for variation in fragments
   */
  private mutateShape(
    parentShape: { vertices: number[], roughness: number[] },
    size: number
  ): { vertices: number[], roughness: number[] } {
    const vertices = [...parentShape.vertices];
    const roughness = [...parentShape.roughness];
    
    // Apply small random mutations
    for (let i = 0; i < vertices.length; i += 2) {
      vertices[i] = vertices[i] * (0.9 + Math.random() * 0.2); // X
      vertices[i + 1] = vertices[i + 1] * (0.9 + Math.random() * 0.2); // Y
    }
    
    // Scale to new size
    const scaleFactor = size / SIZES.ASTEROID.BASE;
    for (let i = 0; i < vertices.length; i++) {
      vertices[i] *= scaleFactor;
    }
    
    return { vertices, roughness };
  }
  
  /**
   * Check if an asteroid can be split
   */
  public canSplit(asteroid: Asteroid): boolean {
    const fragmentSize = asteroid.size * AsteroidSplitter.SIZE_REDUCTION_FACTOR;
    return fragmentSize >= AsteroidSplitter.MIN_FRAGMENT_SIZE;
  }
  
  /**
   * Get fragment info without creating them (for preview/planning)
   */
  public getFragmentInfo(asteroid: Asteroid): {
    count: number;
    size: number;
    canSplit: boolean;
  } {
    const fragmentSize = asteroid.size * AsteroidSplitter.SIZE_REDUCTION_FACTOR;
    
    return {
      count: this.canSplit(asteroid) ? AsteroidSplitter.FRAGMENT_COUNT : 0,
      size: fragmentSize,
      canSplit: this.canSplit(asteroid)
    };
  }
}