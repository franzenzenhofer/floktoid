import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';
import { EnergyDot } from './EnergyDot';
import CentralConfig from '../CentralConfig';

const { FLOCKING, VISUALS, SIZES, PHYSICS } = CentralConfig;

// Bird personality types - each bird has unique behavior!
export enum BirdPersonality {
  AGGRESSIVE = 'aggressive',  // Seeks targets more strongly
  DEFENSIVE = 'defensive',    // Better at avoiding asteroids
  SPEEDY = 'speedy',          // Flies faster
  SLUGGISH = 'sluggish',      // Flies slower
  LEADER = 'leader',          // Others follow more
  LONER = 'loner',            // Less flocking behavior
  NORMAL = 'normal'           // Standard behavior
}

export class Boid {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public maxSpeed: number;
  public maxForce: number;
  public hue: number;
  public originalHue: number;
  public alive = true;
  public hasDot = false;
  public targetDot: EnergyDot | null = null;
  public shimmerTime = 0;
  
  // PERSONALITY SYSTEM - Each bird is unique!
  public personality: BirdPersonality;
  public personalityWeights: {
    separation: number;
    alignment: number;
    cohesion: number;
    targetSeek: number;
    avoidance: number;
    speedModifier: number;
  };
  
  protected sprite: PIXI.Graphics;
  protected trail: { x: number; y: number }[] = [];
  protected trailGraphics: PIXI.Graphics;
  protected app: PIXI.Application;

  constructor(
    app: PIXI.Application, 
    x: number, 
    y: number, 
    speedMultiplier: number,
    initialVelocity?: { vx: number; vy: number }
  ) {
    this.app = app;
    this.x = x;
    this.y = y;
    
    // ASSIGN RANDOM PERSONALITY
    const personalities = Object.values(BirdPersonality);
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
    
    // SET PERSONALITY WEIGHTS
    this.personalityWeights = this.getPersonalityWeights(this.personality);
    
    // Use provided velocity or generate based on personality
    if (initialVelocity) {
      this.vx = initialVelocity.vx;
      this.vy = initialVelocity.vy;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = GameConfig.BASE_SPEED * (0.8 + Math.random() * 0.4);
      const speed = baseSpeed * this.personalityWeights.speedModifier;
      this.vx = Math.cos(angle) * speed;
      this.vy = Math.sin(angle) * speed;
    }
    
    this.maxSpeed = GameConfig.BASE_SPEED * speedMultiplier * this.personalityWeights.speedModifier;
    this.maxForce = GameConfig.BASE_FORCE;
    this.hue = this.getPersonalityHue(); // Different colors for different personalities!
    this.originalHue = this.hue;
    
    this.sprite = new PIXI.Graphics();
    this.trailGraphics = new PIXI.Graphics();
    app.stage.addChild(this.trailGraphics);
    app.stage.addChild(this.sprite);
    
    this.draw();
  }
  
  private getPersonalityWeights(personality: BirdPersonality) {
    switch (personality) {
      case BirdPersonality.AGGRESSIVE:
        return {
          separation: FLOCKING.PERSONALITY_MULTIPLIERS.MIN + 0.5,      // Less personal space
          alignment: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,       // Normal alignment
          cohesion: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT - 0.1,        // Slightly less cohesion
          targetSeek: 1.5,      // STRONG target seeking
          avoidance: 0.7,       // Less careful about asteroids
          speedModifier: 1.1    // Slightly faster
        };
      
      case BirdPersonality.DEFENSIVE:
        return {
          separation: 1.3,      // More personal space
          alignment: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,       // Normal alignment
          cohesion: 1.1,        // Stick together more
          targetSeek: 0.8,      // Less aggressive
          avoidance: 1.5,       // VERY good at avoiding asteroids
          speedModifier: 0.95   // Slightly slower but careful
        };
        
      case BirdPersonality.SPEEDY:
        return {
          separation: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,      // Normal
          alignment: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,       // Normal
          cohesion: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT - 0.1,        // Less cohesion (too fast to keep up)
          targetSeek: 1.2,      // Faster to targets
          avoidance: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,       // Normal avoidance
          speedModifier: 1.4    // MUCH faster!
        };
        
      case BirdPersonality.SLUGGISH:
        return {
          separation: 1.0,      // Normal
          alignment: 1.0,       // Normal
          cohesion: 1.2,        // Needs to stick closer
          targetSeek: 0.9,      // Slower to targets
          avoidance: 1.1,       // Slightly better avoidance (more time to react)
          speedModifier: 0.7    // MUCH slower
        };
        
      case BirdPersonality.LEADER:
        return {
          separation: 1.4,      // Needs more space
          alignment: 0.7,       // Less following others
          cohesion: 0.6,        // Less need to join groups
          targetSeek: 1.3,      // Good at finding targets
          avoidance: 1.2,       // Good survival
          speedModifier: 1.15   // Slightly faster
        };
        
      case BirdPersonality.LONER:
        return {
          separation: 2.0,      // LOTS of personal space
          alignment: 0.5,       // Doesn't follow others much
          cohesion: 0.3,        // Avoids groups
          targetSeek: 1.1,      // Still seeks targets
          avoidance: 1.3,       // Good at avoiding
          speedModifier: 1.05   // Slightly faster (no crowd)
        };
        
      case BirdPersonality.NORMAL:
      default:
        return {
          separation: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,
          alignment: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,
          cohesion: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,
          targetSeek: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,
          avoidance: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT,
          speedModifier: FLOCKING.PERSONALITY_MULTIPLIERS.DEFAULT
        };
    }
  }
  
  private getPersonalityHue(): number {
    // Different personality types have color tendencies
    switch (this.personality) {
      case BirdPersonality.AGGRESSIVE:
        return 0 + Math.random() * 30;        // Red-ish
      case BirdPersonality.DEFENSIVE:
        return 200 + Math.random() * 40;      // Blue-ish
      case BirdPersonality.SPEEDY:
        return 60 + Math.random() * 30;       // Yellow-ish
      case BirdPersonality.SLUGGISH:
        return 270 + Math.random() * 30;      // Purple-ish
      case BirdPersonality.LEADER:
        return 30 + Math.random() * 30;       // Orange-ish
      case BirdPersonality.LONER:
        return 180 + Math.random() * 30;      // Cyan-ish
      default:
        return Math.random() * 360;           // Any color
    }
  }
  
  private draw() {
    // Use normal bird color for fill
    const fillColor = Math.floor(
      (Math.cos(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 16 | Math.floor(
      (Math.sin(this.hue * Math.PI / 180) * 0.5 + 0.5) * 255
    ) << 8 | Math.floor(
      (Math.cos((this.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
    );
    
    // If carrying dot, shimmer outline between orange and red
    let strokeColor = fillColor;
    if (this.hasDot) {
      const shimmerPhase = Math.sin(this.shimmerTime * 10) * 0.5 + 0.5;
      const shimmerHue = 30 * (1 - shimmerPhase); // 30 to 0 (orange to red)
      strokeColor = Math.floor(
        (Math.cos(shimmerHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(shimmerHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((shimmerHue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
    }
    
    this.sprite.clear();
    
    // Draw triangle with shimmer on outline only
    this.sprite.poly([
      SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER, 0,
      -SIZES.BIRD.BASE, SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER,
      -SIZES.BIRD.BASE, -SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER
    ]);
    this.sprite.stroke({ width: this.hasDot ? VISUALS.STROKE.THICK : VISUALS.STROKE.NORMAL, color: strokeColor, alpha: VISUALS.ALPHA.FULL });
    this.sprite.fill({ color: fillColor, alpha: this.hasDot ? VISUALS.ALPHA.HIGH : VISUALS.ALPHA.MEDIUM });
    
    // Dot indicator - show stolen dot color
    if (this.hasDot && this.targetDot) {
      const dotColor = Math.floor(
        (Math.cos(this.targetDot.hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(this.targetDot.hue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((this.targetDot.hue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
      this.sprite.circle(0, 0, SIZES.BIRD.DOT_INDICATOR_RADIUS);
      this.sprite.fill({ color: dotColor, alpha: VISUALS.ALPHA.FULL });
    }
  }
  
  public applyForces(forces: { x: number; y: number }, dt: number) {
    const ax = Math.max(-this.maxForce, Math.min(this.maxForce, forces.x));
    const ay = Math.max(-this.maxForce, Math.min(this.maxForce, forces.y));
    
    this.vx += ax * dt;
    this.vy += ay * dt;
    
    // CRITICAL FIX: Prevent NaN/Infinity freeze from Math.hypot division by zero
    const speed = Math.hypot(this.vx, this.vy);
    
    // SAFETY: Check for NaN/Infinity that could cause freeze
    if (!isFinite(speed) || speed === 0 || !isFinite(this.vx) || !isFinite(this.vy)) {
      console.warn('[BOID] Invalid speed/velocity detected, resetting:', {speed, vx: this.vx, vy: this.vy});
      this.vx = 0;
      this.vy = -PHYSICS.SPEED.BASE_BIRD_SPEED * 1.25; // Default upward movement
      return;
    }
    
    if (speed > this.maxSpeed) {
      this.vx = (this.vx / speed) * this.maxSpeed;
      this.vy = (this.vy / speed) * this.maxSpeed;
    }
  }
  
  public moveToTop(_dt: number) {
    this.vy = -PHYSICS.SPEED.BASE_BIRD_SPEED * 1.5 * (this.maxSpeed / PHYSICS.SPEED.BASE_BIRD_SPEED);
    this.vx *= PHYSICS.FRICTION.AIR_RESISTANCE;
  }
  
  public checkDotPickup(dot: EnergyDot): boolean {
    // SAFETY: Check for valid positions before distance calculation
    if (!isFinite(dot.x) || !isFinite(dot.y) || !isFinite(this.x) || !isFinite(this.y)) {
      console.warn('[BOID] Invalid positions in checkDotPickup, skipping');
      return false;
    }
    
    const dist = Math.hypot(dot.x - this.x, dot.y - this.y);
    
    // SAFETY: Validate distance result
    if (!isFinite(dist)) {
      console.warn('[BOID] Invalid distance calculated in checkDotPickup');
      return false;
    }
    
    return dist < FLOCKING.RADIUS.DOT_DETECTION;
  }
  
  public update(dt: number) {
    // Update shimmer animation
    if (this.hasDot) {
      this.shimmerTime += dt;
    } else {
      this.shimmerTime = 0;
    }
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Soft bounds
    const margin = SIZES.BIRD.BASE * 2;
    if (this.x < margin) this.vx += PHYSICS.FRICTION.BOUNDARY_BOUNCE * dt;
    if (this.x > this.app.screen.width - margin) this.vx -= PHYSICS.FRICTION.BOUNDARY_BOUNCE * dt;
    if (this.y < margin && !this.hasDot) this.vy += PHYSICS.FRICTION.BOUNDARY_BOUNCE * dt;
    if (this.y > this.app.screen.height - margin) this.vy -= PHYSICS.FRICTION.BOUNDARY_BOUNCE * dt;
    
    // CRITICAL FIX: Update trail with strict size limit to prevent memory leak
    this.trail.push({ x: this.x, y: this.y });
    
    // SAFETY: Strict trail limit with extra protection against edge cases
    const maxTrailLength = VISUALS.TRAIL.MAX_LENGTH;
    while (this.trail.length > maxTrailLength) {
      this.trail.shift(); // Remove from front until within limit
    }
    
    // PARANOID: If trail somehow gets corrupted, rebuild it
    if (!Array.isArray(this.trail)) {
      console.warn('[BOID] Trail corrupted, rebuilding');
      this.trail = [{ x: this.x, y: this.y }];
    }
    
    // Draw trail
    this.trailGraphics.clear();
    if (this.trail.length > 1) {
      // Use shimmer color for trail if carrying dot
      let trailHue = this.hue;
      if (this.hasDot) {
        const shimmerPhase = Math.sin(this.shimmerTime * 10) * 0.5 + 0.5;
        trailHue = 30 * (1 - shimmerPhase);
      }
      
      const color = Math.floor(
        (Math.cos(trailHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 16 | Math.floor(
        (Math.sin(trailHue * Math.PI / 180) * 0.5 + 0.5) * 255
      ) << 8 | Math.floor(
        (Math.cos((trailHue + 120) * Math.PI / 180) * 0.5 + 0.5) * 255
      );
      
      for (let i = 1; i < this.trail.length; i++) {
        const alpha = (i / this.trail.length) * VISUALS.ALPHA.MEDIUM;
        const width = (i / this.trail.length) * VISUALS.STROKE.NORMAL;
        this.trailGraphics.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
        this.trailGraphics.lineTo(this.trail[i].x, this.trail[i].y);
        this.trailGraphics.stroke({ width, color, alpha });
      }
    }
    
    // Update sprite position and rotation
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    this.sprite.rotation = Math.atan2(this.vy, this.vx);
    
    // Redraw if state changed
    this.draw();
  }
  
  public destroy() {
    // Prevent double destruction
    if (!this.alive) return;
    
    this.alive = false;
    
    // Safely remove and destroy sprites
    if (this.sprite.parent) {
      this.app.stage.removeChild(this.sprite);
    }
    if (this.trailGraphics.parent) {
      this.app.stage.removeChild(this.trailGraphics);
    }
    
    // Destroy only if not already destroyed
    if (!this.sprite.destroyed) {
      this.sprite.destroy();
    }
    if (!this.trailGraphics.destroyed) {
      this.trailGraphics.destroy();
    }
  }
}