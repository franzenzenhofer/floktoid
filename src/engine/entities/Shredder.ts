import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { GameConfig } from '../GameConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { hueToRGB } from '../utils/ColorUtils';
import type { Asteroid } from './Asteroid';
import type { Boid } from './Boid';

const { SHREDDER, SIZES, VISUALS } = CentralConfig;

export type ShredderPath = 'SINE' | 'COSINE' | 'LISSAJOUS';

export enum ShredderBehavior {
  HUNTER = 'HUNTER',       // Hunt asteroids (current behavior)
  DISRUPTOR = 'DISRUPTOR', // Move to average launch position to interfere
  PROTECTOR = 'PROTECTOR'  // Stay near flock to protect them
}

export function calculateShredderSpawnProbability(A: number): number {
  let P = A <= 10 ? SHREDDER.SPAWN.BASE_PROBABILITY : SHREDDER.SPAWN.BASE_PROBABILITY + A * SHREDDER.SPAWN.EXTRA_PER_ASTEROID;
  if (SHREDDER.SPAWN.MAX_PROBABILITY !== undefined) {
    P = Math.min(P, SHREDDER.SPAWN.MAX_PROBABILITY);
  }
  return P;
}

export class Shredder {
  public x: number;
  public y: number;
  public radius: number;
  public destroyed = false;
  public targetAsteroid: Asteroid | null = null; // Asteroid to hunt
  public behavior: ShredderBehavior;

  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotationSpeed: number; // Each shredder has different speed
  private baseRotationSpeed: number; // Store original speed for transitions
  private rotationDirection: number; // 1 for right, -1 for left (50/50 chance)
  private rotationCount: number = 0; // Count full rotations
  private rotationsUntilSwitch: number; // Random 3-10 rotations before switching
  private cumulativeRotation: number = 0; // CRITICAL: Track total rotation since last reset
  
  // Rotation state management
  private rotationState: 'spinning' | 'slowing' | 'stopped' | 'accelerating' = 'spinning';
  private rotationStateTimer: number = 0;
  private stopDuration: number = 0.05; // 50ms stop - much shorter!
  
  private t = 0;
  private app: PIXI.Application;
  private vx: number = 0; // Velocity for hunting
  private vy: number = 0;
  private maxSpeed: number;
  private hue: number; // Hue like birds use (0-360)
  
  // Wave movement parameters
  private waveAmplitude: number; // How wide the wave is
  private waveFrequency: number; // How fast to oscillate
  private wavePhase: number; // Starting phase offset
  private usesSineWave: boolean; // true for sine, false for cosine
  
  // Smooth movement variables
  private desiredVx: number = 0;
  private desiredVy: number = 0;
  private smoothingFactor: number = 0.15; // How quickly to interpolate to desired velocity

  constructor(app: PIXI.Application) {
    this.app = app;
    // Smaller shredders - limit max size
    const scale = Math.min(SHREDDER.SCALE.MIN + Math.random() * (SHREDDER.SCALE.MAX - SHREDDER.SCALE.MIN), 2.0);
    const baseTip = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    this.radius = baseTip * scale; // No extra multiplication - keep them smaller
    
    // Random hue like birds - exactly the same as birds do it
    this.hue = Math.random() * 360;
    
    // Randomly assign behavior (33% chance each)
    const rand = Math.random();
    if (rand < 0.33) {
      this.behavior = ShredderBehavior.HUNTER;
      this.smoothingFactor = 0.12; // Slightly less smooth for aggressive hunting
      this.maxSpeed = 180; // Fast for chasing
    } else if (rand < 0.66) {
      this.behavior = ShredderBehavior.DISRUPTOR;
      this.smoothingFactor = 0.18; // Very smooth for weaving patterns
      this.maxSpeed = 160; // Medium-fast for interception
    } else {
      this.behavior = ShredderBehavior.PROTECTOR;
      this.smoothingFactor = 0.15; // Balanced smoothness
      this.maxSpeed = 150; // Moderate speed for defensive orbiting
    }
    
    // BALANCED SHREDDING ROTATION - AGGRESSIVE BUT CONTROLLED!
    // Speed: 15-22 radians/sec (lowered max from 28 to 22)
    this.baseRotationSpeed = 15 + Math.random() * 7;
    this.rotationSpeed = this.baseRotationSpeed;
    
    // 50/50 chance to start rotating left or right
    this.rotationDirection = Math.random() < 0.5 ? 1 : -1;
    
    // LONGER rotation phases - 5-10 rotations before switching
    this.rotationsUntilSwitch = 5 + Math.floor(Math.random() * 6);

    // Movement speed like birds
    this.maxSpeed = GameConfig.BASE_SPEED * (0.8 + Math.random() * 0.4);
    
    // Initialize wave movement parameters
    this.waveAmplitude = 80 + Math.random() * 60; // 80-140 pixels side-to-side
    this.waveFrequency = 2 + Math.random() * 2; // 2-4 oscillations per second
    this.wavePhase = Math.random() * Math.PI * 2; // Random starting phase
    this.usesSineWave = Math.random() < 0.5; // 50/50 sine or cosine
    
    // Spawn from top like other ships
    this.x = Math.random() * app.screen.width;
    this.y = -this.radius;
    
    // Initial downward velocity
    this.vy = this.maxSpeed;

    this.sprite = new PIXI.Graphics();
    this.draw();
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    app.stage.addChild(this.sprite);
  }

  private draw() {
    this.sprite.clear();
    
    // Use EXACT same color logic as birds - hueToRGB function!
    const fillColor = hueToRGB(this.hue);
    const strokeColor = fillColor; // Same as birds - stroke matches fill by default
    
    // Draw like our triangular spaceships but with 3 triangles in a spinning formation
    // Each triangle is like a normal ship
    const triangleSize = this.radius * 0.8;
    
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3; // 120 degrees apart
      const centerX = Math.cos(angle) * this.radius * 0.6;
      const centerY = Math.sin(angle) * this.radius * 0.6;
      
      // Draw triangular ship pointing outward from center
      const tipX = centerX + Math.cos(angle) * triangleSize;
      const tipY = centerY + Math.sin(angle) * triangleSize;
      const leftX = centerX + Math.cos(angle + 2.4) * triangleSize * 0.7;
      const leftY = centerY + Math.sin(angle + 2.4) * triangleSize * 0.7;
      const rightX = centerX + Math.cos(angle - 2.4) * triangleSize * 0.7;
      const rightY = centerY + Math.sin(angle - 2.4) * triangleSize * 0.7;
      
      // Draw filled triangle (EXACTLY like normal ships)
      this.sprite.poly([tipX, tipY, leftX, leftY, centerX, centerY, rightX, rightY]);
      
      // EXACT BIRD COLORING: Apply stroke and fill AFTER poly, not inside loop!
      // Using VISUALS constants just like birds
      const finalStrokeColor = strokeColor; // Could add special effects here like birds do
      
      // EXACT same as birds: stroke first, then fill
      this.sprite.stroke({ width: VISUALS.STROKE.NORMAL, color: finalStrokeColor, alpha: VISUALS.ALPHA.FULL });
      this.sprite.fill({ color: fillColor, alpha: VISUALS.ALPHA.MEDIUM }); // Same as birds normal state
    }
    
    // Central connecting hub
    this.sprite.circle(0, 0, this.radius * 0.15);
    this.sprite.stroke({ width: VISUALS.STROKE.NORMAL, color: strokeColor, alpha: VISUALS.ALPHA.FULL }); // Match bird stroke style
    this.sprite.fill({ color: fillColor, alpha: VISUALS.ALPHA.HIGH }); // Center slightly more visible
  }

  update(dt: number, asteroids?: Asteroid[], otherShredders?: Shredder[], boids?: Boid[], 
         launchPositions?: { x: number; y: number }[], flockCenter?: { x: number; y: number }): boolean {
    this.t += dt;
    
    // Rotation state machine with slowdown/stop/change
    switch (this.rotationState) {
      case 'spinning': {
        // Normal rotation
        const rotationDelta = this.rotationSpeed * this.rotationDirection * dt;
        this.rotation += rotationDelta;
        
        // CRITICAL FIX: Track cumulative rotation, not single-frame difference!
        this.cumulativeRotation += Math.abs(rotationDelta);
        
        // Check if we completed a full rotation (2π radians)
        if (this.cumulativeRotation >= Math.PI * 2) {
          this.rotationCount++;
          this.cumulativeRotation -= Math.PI * 2; // Reset for next rotation
          
          // Time to switch direction after reaching target rotations
          if (this.rotationCount >= this.rotationsUntilSwitch) {
            this.rotationState = 'slowing';
            this.rotationStateTimer = 0;
          }
        }
        break;
      }
        
      case 'slowing': {
        // Gradually slow down rotation - MUCH LONGER
        this.rotationStateTimer += dt;
        const slowdownDuration = 0.8; // 800ms to slow down - was 300ms
        const slowdownProgress = Math.min(this.rotationStateTimer / slowdownDuration, 1);
        
        // Ease out - slow down smoothly
        this.rotationSpeed = this.baseRotationSpeed * (1 - slowdownProgress);
        this.rotation += this.rotationSpeed * this.rotationDirection * dt;
        
        if (slowdownProgress >= 1) {
          this.rotationState = 'stopped';
          this.rotationStateTimer = 0;
          this.rotationSpeed = 0;
        }
        break;
      }
        
      case 'stopped': {
        // Pause for 200ms
        this.rotationStateTimer += dt;
        // No rotation during stop
        
        if (this.rotationStateTimer >= this.stopDuration) {
          // Change direction and start accelerating
          this.rotationDirection *= -1;
          this.rotationCount = 0;
          this.cumulativeRotation = 0; // Reset cumulative rotation
          this.rotationsUntilSwitch = 5 + Math.floor(Math.random() * 6); // 5-10 rotations
          this.rotationState = 'accelerating';
          this.rotationStateTimer = 0;
        }
        break;
      }
        
      case 'accelerating': {
        // Speed back up to full rotation - also longer
        this.rotationStateTimer += dt;
        const accelDuration = 0.6; // 600ms to accelerate - was 300ms
        const accelProgress = Math.min(this.rotationStateTimer / accelDuration, 1);
        
        // Ease in - speed up smoothly
        this.rotationSpeed = this.baseRotationSpeed * accelProgress;
        this.rotation += this.rotationSpeed * this.rotationDirection * dt;
        
        if (accelProgress >= 1) {
          this.rotationState = 'spinning';
          this.rotationSpeed = this.baseRotationSpeed;
        }
        break;
      }
    }
    
    // ENHANCED SEPARATION - Prevent overlapping
    let separationX = 0;
    let separationY = 0;
    
    // CRITICAL: Much larger separation radius for Shredders to prevent overlap
    const shredderSeparationRadius = this.radius * 5; // Increased from 3 to 5
    const birdSeparationRadius = this.radius * 3;
    
    // Avoid other Shredders with STRONG repulsion
    if (otherShredders) {
      for (const other of otherShredders) {
        if (other === this || other.destroyed) continue;
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Check for overlap or near-overlap
        const minSafeDistance = this.radius + other.radius + 20; // Add buffer space
        
        if (dist > 0 && dist < shredderSeparationRadius) {
          // Exponential force for close encounters to prevent overlap
          let force: number;
          if (dist < minSafeDistance) {
            // EMERGENCY SEPARATION - they're overlapping or too close!
            force = 5.0; // Maximum force
          } else {
            // Normal separation with stronger force
            force = Math.pow((shredderSeparationRadius - dist) / shredderSeparationRadius, 2) * 3;
          }
          
          // Apply force in opposite direction
          separationX += (dx / dist) * force * 200; // Doubled from 100
          separationY += (dy / dist) * force * 200;
          
          // Add slight random offset to prevent locked positions
          separationX += (Math.random() - 0.5) * 10;
          separationY += (Math.random() - 0.5) * 10;
        }
      }
    }
    
    // Avoid birds/spaceships (less critical but still important)
    if (boids) {
      for (const boid of boids) {
        if (!boid || !boid.alive) continue;
        const dx = this.x - boid.x;
        const dy = this.y - boid.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0 && dist < birdSeparationRadius) {
          // Gentler force for birds
          const force = (birdSeparationRadius - dist) / birdSeparationRadius;
          separationX += (dx / dist) * force * 80;
          separationY += (dy / dist) * force * 80;
        }
      }
    }
    
    // Behavior-specific target logic
    let targetForceX = 0;
    let targetForceY = 0;
    
    switch (this.behavior) {
      case ShredderBehavior.HUNTER:
        // ENHANCED HUNTER - Aggressive asteroid destroyer with predictive targeting
        if (asteroids && asteroids.length > 0) {
          let bestTarget = null;
          let bestScore = -Infinity;
          const tau = SHREDDER.TOLERANCE || 0.05;
          
          for (const asteroid of asteroids) {
            if (!asteroid || asteroid.destroyed) continue;
            
            // Can we shred it?
            if (asteroid.size < this.radius * (1 - tau)) {
              // Calculate distance to asteroid  
              // const dx = asteroid.x - this.x;
              // const dy = asteroid.y - this.y;
              // const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Predict where asteroid will be (lead the target)
              const futureX = asteroid.x + asteroid.vx * 0.5;
              const futureY = asteroid.y + asteroid.vy * 0.5;
              const futureDist = Math.sqrt((futureX - this.x) ** 2 + (futureY - this.y) ** 2);
              
              // Score based on: size (bigger = better), distance (closer = better), and trajectory
              const sizeScore = asteroid.size / 100;
              const distScore = 1000 / (futureDist + 100); // Closer is better
              const threatScore = asteroid.size * 2; // Prioritize larger threats
              
              const totalScore = sizeScore + distScore + threatScore;
              
              if (totalScore > bestScore) {
                bestScore = totalScore;
                bestTarget = asteroid;
              }
            }
          }
          
          this.targetAsteroid = bestTarget;
        }
        
        if (this.targetAsteroid && !this.targetAsteroid.destroyed) {
          // Predictive targeting - aim where asteroid will be
          const leadTime = 0.3; // Predict 0.3 seconds ahead
          const predictX = this.targetAsteroid.x + this.targetAsteroid.vx * leadTime;
          const predictY = this.targetAsteroid.y + this.targetAsteroid.vy * leadTime;
          
          const dx = predictX - this.x;
          const dy = predictY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            // Aggressive pursuit with acceleration
            const urgency = Math.min(2, 300 / (dist + 50)); // More urgent when close
            targetForceX = (dx / dist) * this.maxSpeed * 60 * urgency;
            targetForceY = (dy / dist) * this.maxSpeed * 60 * urgency;
          }
        } else {
          // Patrol pattern when no target - sweep the field
          const patrolSpeed = this.maxSpeed * 0.6;
          const sweepAngle = this.t * 1.5 + Math.sin(this.t * 0.5) * 0.5;
          targetForceX = Math.cos(sweepAngle) * patrolSpeed;
          targetForceY = Math.sin(sweepAngle * 0.8) * patrolSpeed * 0.7 + patrolSpeed * 0.3;
        }
        break;
        
      case ShredderBehavior.DISRUPTOR:
        // ENHANCED DISRUPTOR - Smart launch area denial with predictive positioning
        if (launchPositions && launchPositions.length > 0) {
          // Calculate weighted average (recent launches count more)
          let weightedX = 0;
          let weightedY = 0;
          let totalWeight = 0;
          
          for (let i = 0; i < launchPositions.length; i++) {
            const weight = (i + 1) / launchPositions.length; // Recent positions weighted more
            weightedX += launchPositions[i].x * weight;
            weightedY += launchPositions[i].y * weight;
            totalWeight += weight;
          }
          
          const predictedX = weightedX / totalWeight;
          const predictedY = weightedY / totalWeight;
          
          // Also consider screen edges where player often launches from
          const edgeBias = 0.3;
          const biasedX = predictedX * (1 - edgeBias) + this.app.screen.width / 2 * edgeBias;
          const biasedY = predictedY * (1 - edgeBias) + this.app.screen.height * 0.8 * edgeBias;
          
          const dx = biasedX - this.x;
          const dy = biasedY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 100) {
            // Move aggressively to intercept point
            targetForceX = (dx / dist) * this.maxSpeed * 55;
            targetForceY = (dy / dist) * this.maxSpeed * 55;
          } else {
            // Disruptive weaving pattern when in position
            const weaveSpeed = this.maxSpeed * 0.8;
            const weavePattern = Math.sin(this.t * 4) * 2;
            const crossPattern = Math.cos(this.t * 3.5);
            
            // Figure-8 pattern to cover more area
            targetForceX = Math.sin(weavePattern) * weaveSpeed * 1.2;
            targetForceY = Math.cos(weavePattern * 0.5) * weaveSpeed * crossPattern;
            
            // Also try to intercept any newly launched asteroids
            if (asteroids && asteroids.length > 0) {
              // Find recently launched asteroid (high speed, coming from bottom)
              for (const asteroid of asteroids) {
                if (!asteroid || asteroid.destroyed) continue;
                const asteroidSpeed = Math.sqrt(asteroid.vx ** 2 + asteroid.vy ** 2);
                if (asteroidSpeed > 200 && asteroid.y > this.app.screen.height * 0.6) {
                  // Try to intercept!
                  const interceptX = asteroid.x + asteroid.vx * 0.2;
                  const interceptY = asteroid.y + asteroid.vy * 0.2;
                  targetForceX += (interceptX - this.x) * 20;
                  targetForceY += (interceptY - this.y) * 20;
                  break;
                }
              }
            }
          }
        } else {
          // Default: Patrol launch zones (bottom area, corners)
          const patrolZones = [
            { x: this.app.screen.width * 0.2, y: this.app.screen.height * 0.8 },
            { x: this.app.screen.width * 0.5, y: this.app.screen.height * 0.85 },
            { x: this.app.screen.width * 0.8, y: this.app.screen.height * 0.8 }
          ];
          
          // Pick zone based on time
          const zoneIndex = Math.floor((this.t * 0.3) % patrolZones.length);
          const targetZone = patrolZones[zoneIndex];
          
          const dx = targetZone.x - this.x;
          const dy = targetZone.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 30) {
            targetForceX = (dx / dist) * this.maxSpeed * 45;
            targetForceY = (dy / dist) * this.maxSpeed * 45;
          }
        }
        break;
        
      case ShredderBehavior.PROTECTOR:
        // ENHANCED PROTECTOR - Dynamic flock guardian with threat interception
        if (flockCenter || (boids && boids.length > 0)) {
          // Calculate flock center if not provided
          let centerX = flockCenter?.x || 0;
          let centerY = flockCenter?.y || 0;
          
          if (!flockCenter && boids && boids.length > 0) {
            let count = 0;
            centerX = 0;
            centerY = 0;
            for (const boid of boids) {
              if (boid && boid.alive) {
                centerX += boid.x;
                centerY += boid.y;
                count++;
              }
            }
            if (count > 0) {
              centerX /= count;
              centerY /= count;
            }
          }
          
          // Check for incoming threats (asteroids heading toward flock)
          let threatDetected = false;
          if (asteroids && asteroids.length > 0) {
            for (const asteroid of asteroids) {
              if (!asteroid || asteroid.destroyed) continue;
              
              // Calculate if asteroid is heading toward flock
              const astToFlockX = centerX - asteroid.x;
              const astToFlockY = centerY - asteroid.y;
              const astToFlockDist = Math.sqrt(astToFlockX ** 2 + astToFlockY ** 2);
              
              // Check if asteroid velocity is pointing toward flock
              const dotProduct = (asteroid.vx * astToFlockX + asteroid.vy * astToFlockY) / astToFlockDist;
              
              if (dotProduct > 50 && astToFlockDist < 300) {
                // THREAT DETECTED! Intercept!
                threatDetected = true;
                
                // Calculate interception point
                const timeToImpact = astToFlockDist / (dotProduct + 0.1);
                const interceptX = asteroid.x + asteroid.vx * timeToImpact * 0.5;
                const interceptY = asteroid.y + asteroid.vy * timeToImpact * 0.5;
                
                const dx = interceptX - this.x;
                const dy = interceptY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // URGENT interception
                if (dist > 0) {
                  targetForceX = (dx / dist) * this.maxSpeed * 80; // Maximum urgency
                  targetForceY = (dy / dist) * this.maxSpeed * 80;
                }
                break;
              }
            }
          }
          
          if (!threatDetected) {
            // No immediate threat - maintain defensive perimeter
            const dx = centerX - this.x;
            const dy = centerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Dynamic optimal distance based on flock size
            const flockSize = boids?.filter(b => b && b.alive).length || 1;
            const optimalDistance = Math.min(200, 100 + flockSize * 5);
            
            if (dist > optimalDistance + 80) {
              // Too far - rush back to protect
              targetForceX = (dx / dist) * this.maxSpeed * 60;
              targetForceY = (dy / dist) * this.maxSpeed * 60;
            } else if (dist < optimalDistance - 40) {
              // Too close - back off
              targetForceX = -(dx / dist) * this.maxSpeed * 30;
              targetForceY = -(dy / dist) * this.maxSpeed * 30;
            } else {
              // Perfect distance - orbit defensively
              // const orbitSpeed = this.maxSpeed * 0.7;
              const orbitAngle = this.t * 2.5 + this.hue * 0.01;
              
              // Elliptical orbit for better coverage
              const ellipseX = Math.cos(orbitAngle) * 1.3;
              const ellipseY = Math.sin(orbitAngle) * 0.8;
              
              // Transform to be relative to flock
              const orbitX = centerX + ellipseX * optimalDistance;
              const orbitY = centerY + ellipseY * optimalDistance;
              
              targetForceX = (orbitX - this.x) * 15;
              targetForceY = (orbitY - this.y) * 15;
              
              // Add slight inward bias to stay protective
              targetForceX += dx * 0.1;
              targetForceY += dy * 0.1;
            }
          }
        } else {
          // No flock to protect - patrol center area
          const centerX = this.app.screen.width / 2;
          const centerY = this.app.screen.height / 3;
          const dx = centerX - this.x;
          const dy = centerY - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 50) {
            targetForceX = (dx / dist) * this.maxSpeed * 35;
            targetForceY = (dy / dist) * this.maxSpeed * 35;
          }
        }
        break;
    }
    
    // WAVY MOVEMENT OVERLAY - Add sine/cosine wave motion
    let waveX = 0;
    let waveY = 0;
    
    // Calculate wave offset based on time and movement direction
    const waveTime = this.t * this.waveFrequency + this.wavePhase;
    
    if (this.usesSineWave) {
      // Sine wave - smooth side-to-side motion
      waveX = Math.sin(waveTime) * this.waveAmplitude;
      // Small vertical oscillation too
      waveY = Math.cos(waveTime * 0.5) * (this.waveAmplitude * 0.3);
    } else {
      // Cosine wave - offset phase for different pattern
      waveX = Math.cos(waveTime) * this.waveAmplitude;
      // Different vertical pattern
      waveY = Math.sin(waveTime * 0.7) * (this.waveAmplitude * 0.25);
    }
    
    // SMOOTH MOVEMENT SYSTEM - Calculate desired velocity WITH WAVE
    this.desiredVx = (separationX + targetForceX + waveX) * dt;
    this.desiredVy = (separationY + targetForceY + waveY) * dt;
    
    // Smooth interpolation to desired velocity (prevents jerky movement)
    this.vx += (this.desiredVx - this.vx) * this.smoothingFactor;
    this.vy += (this.desiredVy - this.vy) * this.smoothingFactor;
    
    // Apply damping for more fluid motion
    const damping = 0.98;
    this.vx *= damping;
    this.vy *= damping;
    
    // Limit speed with smooth capping
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > this.maxSpeed) {
      // Smooth speed limiting - gradually reduce to max
      const limitFactor = this.maxSpeed / currentSpeed;
      const smoothLimit = 0.9 + limitFactor * 0.1; // Gentle limiting
      this.vx *= smoothLimit;
      this.vy *= smoothLimit;
    }
    
    // Update position with velocity
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // NO MOVEMENT-BASED ROTATION! Shredders spin aggressively regardless of movement!
    // The rotation is already updated earlier in the function with the aggressive spinning
    
    // Update sprite
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = this.rotation;

    return !this.isOffScreen(this.app.screen);
  }

  isOffScreen(screen: PIXI.Rectangle): boolean {
    const margin = this.radius * 2;
    return this.x < -margin || this.x > screen.width + margin || this.y < -margin || this.y > screen.height + margin;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    EntityDestroyer.destroyEntity({ sprite: this.sprite, app: this.app });
  }
}
