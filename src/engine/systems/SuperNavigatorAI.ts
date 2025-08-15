/**
 * SuperNavigatorAI - Advanced movement algorithm for elite birds
 * These birds use predictive pathfinding, swarm intelligence, and quantum mechanics!
 */

import { Boid } from '../entities/Boid';
import { EnergyDot } from '../entities/EnergyDot';
import { Asteroid } from '../entities/Asteroid';
import CentralConfig from '../CentralConfig';

const { SIZES } = CentralConfig;

interface Vector2D {
  x: number;
  y: number;
}

interface PredictedPath {
  positions: Vector2D[];
  cost: number;
  danger: number;
}

export class SuperNavigatorAI {
  private static readonly PREDICTION_STEPS = 30;
  private static readonly PREDICTION_DT = 0.05;
  private static readonly QUANTUM_LEAP_CHANCE = 0.02;
  private static readonly PACK_HUNT_RADIUS = 200;
  private static readonly DANGER_RADIUS = 100;
  
  // Artistic movement patterns
  private static readonly PATTERNS = {
    LISSAJOUS: 'lissajous',
    SPIRAL: 'spiral',
    FIGURE_EIGHT: 'figure8',
    SINE_WAVE: 'sinewave',
    GOLDEN_SPIRAL: 'golden',
    ROSE: 'rose',
    BUTTERFLY: 'butterfly'
  };
  
  // Memory for each super navigator
  private memory = new Map<Boid, {
    lastTarget: EnergyDot | null;
    dodgePattern: number;
    packLeader: Boid | null;
    quantumCooldown: number;
    artisticPattern: string;
    patternPhase: number;
    patternCenter: Vector2D;
    patternScale: number;
    timeAlive: number;
    independenceLevel: number;  // 0-1, how much they ignore pack
  }>();
  
  /**
   * Calculate SUPER movement for elite birds
   */
  calculateSuperForces(
    boid: Boid,
    allBoids: Boid[],
    energyDots: EnergyDot[],
    asteroids: Asteroid[],
    fallingDots?: Array<{ x: number; y: number; vx: number; vy: number; sprite: unknown }>
  ): { x: number; y: number } {
    // Initialize memory for this bird
    if (!this.memory.has(boid)) {
      // Each super navigator gets a unique artistic pattern
      const patterns = Object.values(SuperNavigatorAI.PATTERNS);
      const chosenPattern = patterns[Math.floor(Math.random() * patterns.length)];
      
      this.memory.set(boid, {
        lastTarget: null,
        dodgePattern: Math.random() * Math.PI * 2,
        packLeader: null,
        quantumCooldown: 0,
        artisticPattern: chosenPattern,
        patternPhase: Math.random() * Math.PI * 2,
        patternCenter: { x: boid.x, y: boid.y },
        patternScale: 50 + Math.random() * 100,  // 50-150 pixel patterns
        timeAlive: 0,
        independenceLevel: 0.7 + Math.random() * 0.3  // 70-100% independent
      });
    }
    
    const mem = this.memory.get(boid)!;
    mem.timeAlive++;
    
    // ARTISTIC MATHEMATICAL MOVEMENT - Beautiful lone fighter patterns!
    const artisticForce = this.calculateArtisticMovement(boid, mem, energyDots, fallingDots);
    
    // QUANTUM LEAP - Occasionally teleport short distances!
    if (mem.quantumCooldown <= 0 && Math.random() < SuperNavigatorAI.QUANTUM_LEAP_CHANCE) {
      const leap = this.performQuantumLeap(boid, asteroids);
      if (leap) {
        mem.quantumCooldown = 120; // 2 second cooldown
        return leap;
      }
    }
    mem.quantumCooldown--;
    
    // PACK HUNTING - Reduced for lone fighters!
    const packForce = this.calculatePackHunting(boid, allBoids, energyDots, mem);
    const reducedPackForce = {
      x: packForce.x * (1 - mem.independenceLevel),  // Mostly ignore pack
      y: packForce.y * (1 - mem.independenceLevel)
    };
    
    // PREDICTIVE PATHFINDING - Look into the future!
    const predictiveForce = this.calculatePredictivePath(boid, asteroids, energyDots, fallingDots);
    
    // EVASIVE MANEUVERS - Advanced dodging patterns
    const evasiveForce = this.calculateEvasiveManeuvers(boid, asteroids, mem);
    
    // INTERCEPT CALCULATION - Perfect trajectory to targets
    const interceptForce = this.calculateInterceptVector(boid, energyDots, fallingDots);
    
    // Combine all forces with artistic emphasis!
    const totalForce = {
      x: artisticForce.x * 3.0 +      // STRONG artistic patterns
         predictiveForce.x * 1.5 +     // Good prediction
         reducedPackForce.x * 0.3 +   // Minimal pack influence
         evasiveForce.x * 3.0 +       // SUPER asteroid avoidance
         interceptForce.x * 1.2,       // Target tracking
      y: artisticForce.y * 3.0 +
         predictiveForce.y * 1.5 +
         reducedPackForce.y * 0.3 +
         evasiveForce.y * 3.0 +
         interceptForce.y * 1.2
    };
    
    // Normalize and amplify for SUPER SPEED
    const magnitude = Math.hypot(totalForce.x, totalForce.y);
    if (magnitude > 0) {
      const superBoost = 2.5; // Super navigators are FAST!
      totalForce.x = (totalForce.x / magnitude) * boid.maxForce * superBoost;
      totalForce.y = (totalForce.y / magnitude) * boid.maxForce * superBoost;
    }
    
    return totalForce;
  }
  
  /**
   * Quantum leap - teleport to avoid danger!
   */
  private performQuantumLeap(boid: Boid, asteroids: Asteroid[]): Vector2D | null {
    // Check if in immediate danger
    const dangerLevel = this.calculateDangerLevel(boid.x, boid.y, asteroids);
    
    if (dangerLevel > 0.7) {
      // Find safe quantum position
      const angles = [0, Math.PI/4, Math.PI/2, 3*Math.PI/4, Math.PI, -3*Math.PI/4, -Math.PI/2, -Math.PI/4];
      const leapDistance = 150;
      
      let bestPos: Vector2D | null = null;
      let lowestDanger = dangerLevel;
      
      for (const angle of angles) {
        const newX = boid.x + Math.cos(angle) * leapDistance;
        const newY = boid.y + Math.sin(angle) * leapDistance;
        
        const newDanger = this.calculateDangerLevel(newX, newY, asteroids);
        if (newDanger < lowestDanger) {
          lowestDanger = newDanger;
          bestPos = { x: newX - boid.x, y: newY - boid.y };
        }
      }
      
      if (bestPos && lowestDanger < 0.3) {
        // Quantum leap force - instant acceleration!
        return {
          x: bestPos.x * 100,
          y: bestPos.y * 100
        };
      }
    }
    
    return null;
  }
  
  /**
   * Pack hunting coordination
   */
  private calculatePackHunting(
    boid: Boid,
    allBoids: Boid[],
    energyDots: EnergyDot[],
    mem: NonNullable<ReturnType<typeof this.memory.get>>
  ): Vector2D {
    const packForce = { x: 0, y: 0 };
    
    // Find other super navigators nearby
    const packMembers = allBoids.filter(b => 
      b !== boid && 
      b.isSuperNavigator && 
      b.alive &&
      Math.hypot(b.x - boid.x, b.y - boid.y) < SuperNavigatorAI.PACK_HUNT_RADIUS
    );
    
    if (packMembers.length > 0) {
      // Designate pack leader (closest to target)
      if (!mem.packLeader || !mem.packLeader.alive) {
        const availableDots = energyDots.filter(d => !d.stolen);
        if (availableDots.length > 0) {
          const target = availableDots[0];
          mem.packLeader = [...packMembers, boid].reduce((leader, member) => {
            const leaderDist = Math.hypot(leader.x - target.x, leader.y - target.y);
            const memberDist = Math.hypot(member.x - target.x, member.y - target.y);
            return memberDist < leaderDist ? member : leader;
          });
        }
      }
      
      // Follow pack leader or spread out for coverage
      if (mem.packLeader && mem.packLeader !== boid) {
        // Follow leader but maintain formation
        const dx = mem.packLeader.x - boid.x;
        const dy = mem.packLeader.y - boid.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 50) {
          packForce.x = dx / dist * 50;
          packForce.y = dy / dist * 50;
        }
        
        // Add flanking behavior
        const flankAngle = boid.x > mem.packLeader.x ? Math.PI/6 : -Math.PI/6;
        packForce.x += Math.cos(flankAngle) * 30;
        packForce.y += Math.sin(flankAngle) * 30;
      }
    }
    
    return packForce;
  }
  
  /**
   * Predictive pathfinding - simulate future to find best path
   */
  private calculatePredictivePath(
    boid: Boid,
    asteroids: Asteroid[],
    energyDots: EnergyDot[],
    fallingDots?: Array<{ x: number; y: number; vx: number; vy: number; sprite: unknown }>
  ): Vector2D {
    // Find target
    let targetPos: Vector2D | null = null;
    
    // Prioritize falling dots
    if (fallingDots && fallingDots.length > 0) {
      const closest = fallingDots.reduce((best, dot) => {
        const dist = Math.hypot(dot.x - boid.x, dot.y - boid.y);
        const bestDist = best ? Math.hypot(best.x - boid.x, best.y - boid.y) : Infinity;
        return dist < bestDist ? dot : best;
      }, null as typeof fallingDots[0] | null);
      
      if (closest) {
        // Predict intercept point
        const time = Math.hypot(closest.x - boid.x, closest.y - boid.y) / (boid.maxSpeed * 2);
        targetPos = {
          x: closest.x + closest.vx * time,
          y: closest.y + closest.vy * time
        };
      }
    }
    
    // Otherwise target energy dots
    if (!targetPos) {
      const available = energyDots.filter(d => !d.stolen);
      if (available.length > 0) {
        const closest = available[0];
        targetPos = { x: closest.x, y: closest.y };
      }
    }
    
    if (!targetPos) {
      return { x: 0, y: 0 };
    }
    
    // Generate multiple possible paths
    const paths: PredictedPath[] = [];
    const angles = [-Math.PI/3, -Math.PI/6, 0, Math.PI/6, Math.PI/3];
    
    for (const angle of angles) {
      const path = this.simulatePath(boid, targetPos, asteroids, angle);
      paths.push(path);
    }
    
    // Choose path with lowest cost
    const bestPath = paths.reduce((best, path) => 
      path.cost < best.cost ? path : best
    );
    
    // Return force toward first position in best path
    if (bestPath.positions.length > 1) {
      const nextPos = bestPath.positions[1];
      return {
        x: (nextPos.x - boid.x) * 10,
        y: (nextPos.y - boid.y) * 10
      };
    }
    
    return { x: 0, y: 0 };
  }
  
  /**
   * Simulate a path and calculate its cost
   */
  private simulatePath(
    boid: Boid,
    target: Vector2D,
    asteroids: Asteroid[],
    angleOffset: number
  ): PredictedPath {
    const positions: Vector2D[] = [{ x: boid.x, y: boid.y }];
    let totalCost = 0;
    let totalDanger = 0;
    
    let simX = boid.x;
    let simY = boid.y;
    let simVx = boid.vx;
    let simVy = boid.vy;
    
    for (let i = 0; i < SuperNavigatorAI.PREDICTION_STEPS; i++) {
      // Calculate force toward target with angle offset
      const dx = target.x - simX;
      const dy = target.y - simY;
      const angle = Math.atan2(dy, dx) + angleOffset;
      
      const fx = Math.cos(angle) * boid.maxForce * 2;
      const fy = Math.sin(angle) * boid.maxForce * 2;
      
      // Update velocity
      simVx += fx * SuperNavigatorAI.PREDICTION_DT;
      simVy += fy * SuperNavigatorAI.PREDICTION_DT;
      
      // Limit speed
      const speed = Math.hypot(simVx, simVy);
      if (speed > boid.maxSpeed * 1.5) {
        simVx = (simVx / speed) * boid.maxSpeed * 1.5;
        simVy = (simVy / speed) * boid.maxSpeed * 1.5;
      }
      
      // Update position
      simX += simVx * SuperNavigatorAI.PREDICTION_DT;
      simY += simVy * SuperNavigatorAI.PREDICTION_DT;
      
      positions.push({ x: simX, y: simY });
      
      // Calculate danger at this position
      const danger = this.calculateDangerLevel(simX, simY, asteroids);
      totalDanger += danger;
      
      // Calculate cost (distance + danger)
      const distToTarget = Math.hypot(target.x - simX, target.y - simY);
      totalCost += distToTarget + danger * 1000;
    }
    
    return {
      positions,
      cost: totalCost,
      danger: totalDanger
    };
  }
  
  /**
   * Calculate danger level at a position
   */
  private calculateDangerLevel(x: number, y: number, asteroids: Asteroid[]): number {
    let danger = 0;
    
    for (const asteroid of asteroids) {
      const dx = asteroid.x - x;
      const dy = asteroid.y - y;
      const dist = Math.hypot(dx, dy);
      
      // Predict asteroid position
      const futureX = asteroid.x + asteroid.vx * 0.5;
      const futureY = asteroid.y + asteroid.vy * 0.5;
      const futureDist = Math.hypot(futureX - x, futureY - y);
      
      // Use minimum of current and future distance
      const minDist = Math.min(dist, futureDist);
      
      if (minDist < SuperNavigatorAI.DANGER_RADIUS) {
        // Exponential danger increase as distance decreases
        const normalizedDist = minDist / SuperNavigatorAI.DANGER_RADIUS;
        danger += Math.exp(-normalizedDist * 3);
      }
    }
    
    return Math.min(danger, 1);
  }
  
  /**
   * Advanced evasive maneuvers
   */
  private calculateEvasiveManeuvers(
    boid: Boid,
    asteroids: Asteroid[],
    mem: NonNullable<ReturnType<typeof this.memory.get>>
  ): Vector2D {
    const evasiveForce = { x: 0, y: 0 };
    
    for (const asteroid of asteroids) {
      const dx = asteroid.x - boid.x;
      const dy = asteroid.y - boid.y;
      const dist = Math.hypot(dx, dy);
      
      // Predict collision course
      const relVx = asteroid.vx - boid.vx;
      const relVy = asteroid.vy - boid.vy;
      const timeToCollision = -(dx * relVx + dy * relVy) / (relVx * relVx + relVy * relVy);
      
      if (timeToCollision > 0 && timeToCollision < 2) {
        // Future positions
        const futureAstX = asteroid.x + asteroid.vx * timeToCollision;
        const futureAstY = asteroid.y + asteroid.vy * timeToCollision;
        const futureBoidX = boid.x + boid.vx * timeToCollision;
        const futureBoidY = boid.y + boid.vy * timeToCollision;
        
        const futureDist = Math.hypot(futureAstX - futureBoidX, futureAstY - futureBoidY);
        
        if (futureDist < asteroid.size + SIZES.BIRD.BASE * 3) {
          // EVASIVE ACTION!
          // Use spiral dodge pattern
          mem.dodgePattern += 0.3;
          const dodgeAngle = Math.atan2(dy, dx) + Math.PI/2 + Math.sin(mem.dodgePattern);
          
          const dodgeForce = 200 / (timeToCollision + 0.1); // Stronger force for imminent collisions
          evasiveForce.x += Math.cos(dodgeAngle) * dodgeForce;
          evasiveForce.y += Math.sin(dodgeAngle) * dodgeForce;
        }
      }
      
      // Also avoid asteroids that are simply too close
      if (dist < asteroid.size + SIZES.BIRD.BASE * 4) {
        const repulsion = 150 / (dist + 1);
        evasiveForce.x -= (dx / dist) * repulsion;
        evasiveForce.y -= (dy / dist) * repulsion;
      }
    }
    
    return evasiveForce;
  }
  
  /**
   * Calculate perfect intercept vector
   */
  private calculateInterceptVector(
    boid: Boid,
    energyDots: EnergyDot[],
    fallingDots?: Array<{ x: number; y: number; vx: number; vy: number; sprite: unknown }>
  ): Vector2D {
    let bestTarget: { x: number; y: number; vx: number; vy: number } | null = null;
    let bestTime = Infinity;
    
    // Check falling dots first (they're priority!)
    if (fallingDots) {
      for (const dot of fallingDots) {
        const time = this.calculateInterceptTime(boid, dot);
        if (time < bestTime && time > 0) {
          bestTime = time;
          bestTarget = dot;
        }
      }
    }
    
    // Check stationary dots if no falling dots
    if (!bestTarget) {
      const available = energyDots.filter(d => !d.stolen);
      for (const dot of available) {
        const staticDot = { x: dot.x, y: dot.y, vx: 0, vy: 0 };
        const time = this.calculateInterceptTime(boid, staticDot);
        if (time < bestTime && time > 0) {
          bestTime = time;
          bestTarget = staticDot;
        }
      }
    }
    
    if (bestTarget && bestTime < 10) {
      // Calculate intercept point
      const interceptX = bestTarget.x + bestTarget.vx * bestTime * 0.8; // Slight lead
      const interceptY = bestTarget.y + bestTarget.vy * bestTime * 0.8;
      
      return {
        x: (interceptX - boid.x) * 2,
        y: (interceptY - boid.y) * 2
      };
    }
    
    return { x: 0, y: 0 };
  }
  
  /**
   * Calculate time to intercept a moving target
   */
  private calculateInterceptTime(
    boid: Boid,
    target: { x: number; y: number; vx: number; vy: number }
  ): number {
    const dx = target.x - boid.x;
    const dy = target.y - boid.y;
    const dvx = target.vx;
    const dvy = target.vy;
    
    const a = dvx * dvx + dvy * dvy - boid.maxSpeed * boid.maxSpeed * 4; // Super speed!
    const b = 2 * (dx * dvx + dy * dvy);
    const c = dx * dx + dy * dy;
    
    // Quadratic formula
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      // No intercept possible
      return Infinity;
    }
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    // Return smallest positive time
    if (t1 > 0 && t2 > 0) {
      return Math.min(t1, t2);
    } else if (t1 > 0) {
      return t1;
    } else if (t2 > 0) {
      return t2;
    }
    
    return Infinity;
  }
  
  /**
   * Calculate artistic mathematical movement patterns
   */
  private calculateArtisticMovement(
    boid: Boid,
    mem: NonNullable<ReturnType<typeof this.memory.get>>,
    energyDots: EnergyDot[],
    fallingDots?: Array<{ x: number; y: number; vx: number; vy: number; sprite: unknown }>
  ): Vector2D {
    // Update pattern phase for animation
    mem.patternPhase += 0.05;
    
    // Find nearest target to orbit around
    let targetPos: Vector2D | null = null;
    
    if (fallingDots && fallingDots.length > 0) {
      const closest = fallingDots[0];
      targetPos = { x: closest.x, y: closest.y };
    } else {
      const available = energyDots.filter(d => !d.stolen);
      if (available.length > 0) {
        targetPos = { x: available[0].x, y: available[0].y };
      }
    }
    
    // Update pattern center to smoothly follow targets
    if (targetPos) {
      mem.patternCenter.x += (targetPos.x - mem.patternCenter.x) * 0.05;
      mem.patternCenter.y += (targetPos.y - mem.patternCenter.y) * 0.05;
    }
    
    // Calculate pattern-specific movement
    let patternX = 0;
    let patternY = 0;
    const t = mem.patternPhase;
    const scale = mem.patternScale;
    
    switch (mem.artisticPattern) {
      case SuperNavigatorAI.PATTERNS.LISSAJOUS: {
        // Beautiful Lissajous curves
        patternX = Math.sin(3 * t) * scale;
        patternY = Math.sin(2 * t + Math.PI/4) * scale;
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.SPIRAL: {
        // Expanding/contracting spiral
        const spiralR = scale * (1 + Math.sin(t * 0.5) * 0.5);
        patternX = Math.cos(t * 2) * spiralR * (t * 0.1);
        patternY = Math.sin(t * 2) * spiralR * (t * 0.1);
        // Reset spiral after full rotation
        if (mem.patternPhase > Math.PI * 4) {
          mem.patternPhase = 0;
        }
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.FIGURE_EIGHT: {
        // Figure-8 or infinity pattern
        patternX = Math.sin(t) * scale * 1.5;
        patternY = Math.sin(2 * t) * scale * 0.75;
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.SINE_WAVE: {
        // Sine wave with forward movement
        patternX = t * scale * 0.2;
        patternY = Math.sin(t * 3) * scale;
        // Reset after traveling
        if (mem.patternPhase > Math.PI * 2) {
          mem.patternPhase = 0;
        }
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.GOLDEN_SPIRAL: {
        // Golden ratio spiral
        const phi = 1.618033988749;
        const goldenAngle = t * phi;
        const goldenR = Math.sqrt(t) * scale * 0.3;
        patternX = Math.cos(goldenAngle) * goldenR;
        patternY = Math.sin(goldenAngle) * goldenR;
        // Reset after expansion
        if (mem.patternPhase > Math.PI * 6) {
          mem.patternPhase = 0;
        }
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.ROSE: {
        // Rose curve (flower pattern)
        const k = 5; // Number of petals
        const roseR = Math.cos(k * t) * scale;
        patternX = roseR * Math.cos(t);
        patternY = roseR * Math.sin(t);
        break;
      }
        
      case SuperNavigatorAI.PATTERNS.BUTTERFLY: {
        // Butterfly curve
        const butterflyT = t * 0.5;
        const expTerm = Math.exp(Math.cos(butterflyT));
        const butterflyR = expTerm - 2 * Math.cos(4 * butterflyT) - Math.pow(Math.sin(butterflyT / 12), 5);
        patternX = Math.sin(butterflyT) * butterflyR * scale * 0.3;
        patternY = Math.cos(butterflyT) * butterflyR * scale * 0.3;
        break;
      }
    }
    
    // Calculate force toward pattern position
    const targetX = mem.patternCenter.x + patternX;
    const targetY = mem.patternCenter.y + patternY;
    
    const dx = targetX - boid.x;
    const dy = targetY - boid.y;
    const dist = Math.hypot(dx, dy);
    
    // Strong force to maintain artistic pattern
    if (dist > 0) {
      const strength = Math.min(dist * 0.5, 100);
      return {
        x: (dx / dist) * strength,
        y: (dy / dist) * strength
      };
    }
    
    return { x: 0, y: 0 };
  }
  
  /**
   * Clean up memory for dead birds
   */
  cleanupMemory(boid: Boid): void {
    this.memory.delete(boid);
  }
}