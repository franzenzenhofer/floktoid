import * as PIXI from 'pixi.js';
import { GameConfig } from '../GameConfig';
import { EnergyDot } from './EnergyDot';
import CentralConfig from '../CentralConfig';
import { hueToRGB } from '../utils/ColorUtils';
import { EntityDestroyer } from '../utils/EntityDestroyer';
import { clearGraphics } from '../utils/SpriteFactory';
import { VectorUtils } from '../utils/VectorUtils';
import { BirdProjectile } from './BirdProjectile';
import { Asteroid } from './Asteroid';

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

// SUPER DRY: Shared spawn chance for special birds
const SPECIAL_BIRD_CHANCE = 0.1; // 10% chance

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
  
  // SUPER NAVIGATOR - 10% chance of being elite!
  public isSuperNavigator: boolean;
  private superShimmerTime = 0;
  
  // SHOOTER - 10% chance of being a shooter!
  public isShooter: boolean;
  public shootCooldown = 0;
  public maxShootCooldown = 60; // 1 second at 60fps
  private shooterGlowTime = 0;
  
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
    
    // SUPER DRY: Use EXACT SAME logic for both special types!
    const superNavigatorRoll = Math.random();
    const shooterRoll = Math.random();
    
    // SUPER NAVIGATOR - 10% chance!
    this.isSuperNavigator = superNavigatorRoll < SPECIAL_BIRD_CHANCE;
    
    // SHOOTER - 10% chance (EXACT SAME LOGIC AS SUPER NAVIGATOR!)
    this.isShooter = shooterRoll < SPECIAL_BIRD_CHANCE;
    
    // Debug logging for verification
    if (this.isSuperNavigator) {
      console.log('[SPECIAL BIRD] Super Navigator spawned!');
    }
    if (this.isShooter) {
      console.log('[SPECIAL BIRD] Shooter spawned!');
    }
    
    // ASSIGN RANDOM PERSONALITY
    const personalities = Object.values(BirdPersonality);
    this.personality = personalities[Math.floor(Math.random() * personalities.length)];
    
    // SET PERSONALITY WEIGHTS
    this.personalityWeights = this.getPersonalityWeights(this.personality);
    
    // SUPER NAVIGATORS GET ENHANCED ABILITIES!
    if (this.isSuperNavigator) {
      this.personalityWeights.speedModifier *= 1.3;  // 30% faster
      this.personalityWeights.avoidance *= 1.5;      // 50% better at avoiding asteroids
      this.personalityWeights.targetSeek *= 1.2;     // 20% better at finding targets
    }
    
    // SHOOTERS GET DIFFERENT ABILITIES!
    if (this.isShooter) {
      this.personalityWeights.speedModifier *= 0.8;  // 20% slower than wave (was 0.9)
      this.personalityWeights.avoidance *= 1.3;      // Better at staying alive to shoot
      this.maxShootCooldown = 75;                    // MORE delay between shots (was 45)
      if (this.isSuperNavigator) {
        this.maxShootCooldown = 60;                  // Elite shooters still slower (was 30)
      }
    }
    
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
    let fillColor = hueToRGB(this.hue);
    
    // Super navigators have a subtle blue tint
    if (this.isSuperNavigator) {
      // Blend with blue (hue 200-220)
      const blueHue = 210;
      const blendFactor = 0.3; // 30% blue blend
      const targetHue = this.hue * (1 - blendFactor) + blueHue * blendFactor;
      fillColor = hueToRGB(targetHue);
    }
    
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
    
    clearGraphics(this.sprite);
    
    // SUPER DRY: Shared glow effect for special birds!
    const drawSpecialGlow = (glowTime: number, glowColor: number) => {
      const shimmerPhase = Math.sin(glowTime * 8) * 0.5 + 0.5;
      const shimmerAlpha = 0.3 + shimmerPhase * 0.3; // Oscillate between 0.3 and 0.6
      
      // Draw outer glow polygon (SAME FOR BOTH!)
      this.sprite.poly([
        SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER * 1.3, 0,
        -SIZES.BIRD.BASE * 1.3, SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER * 1.3,
        -SIZES.BIRD.BASE * 1.3, -SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER * 1.3
      ]);
      this.sprite.fill({ color: glowColor, alpha: shimmerAlpha });
    };
    
    // Super Navigator blueish shimmer effect
    if (this.isSuperNavigator) {
      drawSpecialGlow(this.superShimmerTime, 0x00AAFF); // Bright blue glow
    }
    
    // Shooter bird red shimmer effect (EXACT SAME AS SUPER NAVIGATOR!)
    if (this.isShooter) {
      drawSpecialGlow(this.shooterGlowTime, 0xFF0000); // Bright red glow
      // NO clown nose dot - shooters are identified by red glow and stroke only
    }
    
    // Draw triangle with shimmer on outline only
    this.sprite.poly([
      SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER, 0,
      -SIZES.BIRD.BASE, SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER,
      -SIZES.BIRD.BASE, -SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_BACK_MULTIPLIER
    ]);
    
    // Super navigators get a blue-tinted stroke
    let finalStrokeColor = strokeColor;
    if (this.isSuperNavigator) {
      finalStrokeColor = 0x00CCFF; // Cyan-blue stroke
    }
    // Shooters get a red-tinted stroke
    if (this.isShooter) {
      finalStrokeColor = 0xFF0000; // BRIGHT RED stroke
    }
    
    this.sprite.stroke({ width: this.hasDot ? VISUALS.STROKE.THICK : VISUALS.STROKE.NORMAL, color: finalStrokeColor, alpha: VISUALS.ALPHA.FULL });
    this.sprite.fill({ color: fillColor, alpha: this.hasDot ? VISUALS.ALPHA.HIGH : VISUALS.ALPHA.MEDIUM });
    
    // Dot indicator - show stolen dot color
    if (this.hasDot && this.targetDot) {
      const dotColor = hueToRGB(this.targetDot.hue);
      this.sprite.circle(0, 0, SIZES.BIRD.DOT_INDICATOR_RADIUS);
      this.sprite.fill({ color: dotColor, alpha: VISUALS.ALPHA.FULL });
    }
  }
  
  public applyForces(forces: { x: number; y: number }, dt: number) {
    // DRY: Use VectorUtils for clamping
    const clamped = VectorUtils.clampVector(forces, -this.maxForce, this.maxForce);
    
    this.vx += clamped.x * dt;
    this.vy += clamped.y * dt;
    
    // DRY: Use VectorUtils for speed limiting and safety
    const velocity = { x: this.vx, y: this.vy };
    const limited = VectorUtils.limitMagnitude(velocity, this.maxSpeed);
    
    // Ensure valid velocity
    const safe = VectorUtils.ensureValid(limited, { 
      x: 0, 
      y: -PHYSICS.SPEED.BASE_BIRD_SPEED * 1.25 
    });
    
    this.vx = safe.x;
    this.vy = safe.y;
  }
  
  public moveToTop(_dt: number) {
    this.vy = -PHYSICS.SPEED.BASE_BIRD_SPEED * 1.5 * (this.maxSpeed / PHYSICS.SPEED.BASE_BIRD_SPEED);
    this.vx *= PHYSICS.FRICTION.AIR_RESISTANCE;
  }
  
  public checkDotPickup(dot: EnergyDot): boolean {
    // DRY: Use VectorUtils for safe distance calculation
    const dist = VectorUtils.distance(
      { x: this.x, y: this.y },
      { x: dot.x, y: dot.y }
    );
    
    return dist < FLOCKING.RADIUS.DOT_DETECTION;
  }
  
  public update(dt: number) {
    // Update shimmer animation
    if (this.hasDot) {
      this.shimmerTime += dt;
    } else {
      this.shimmerTime = 0;
    }
    
    // Update super navigator shimmer
    if (this.isSuperNavigator) {
      this.superShimmerTime += dt;
    }
    
    // Update shooter mechanics
    if (this.isShooter) {
      this.shooterGlowTime += dt;
      if (this.shootCooldown > 0) {
        this.shootCooldown -= 1; // Frame-based cooldown
      }
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
      // Super navigators have blue-tinted trails
      else if (this.isSuperNavigator) {
        // Blend with blue for trail
        const blueHue = 210;
        const blendFactor = 0.5; // 50% blue blend for trail
        trailHue = this.hue * (1 - blendFactor) + blueHue * blendFactor;
      }
      
      const color = hueToRGB(trailHue);
      
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
    
    // Calculate target rotation
    const targetRotation = Math.atan2(this.vy, this.vx);
    
    // Shooters rotate more slowly for authentic Asteroids feel
    if (this.isShooter) {
      // Smooth rotation for shooters - lerp towards target
      const rotationSpeed = 0.15; // Lower = slower rotation
      let currentRotation = this.sprite.rotation;
      
      // Handle angle wrapping for shortest path
      let diff = targetRotation - currentRotation;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      
      this.sprite.rotation = currentRotation + diff * rotationSpeed;
    } else {
      // Normal birds rotate instantly
      this.sprite.rotation = targetRotation;
    }
    
    // Redraw if state changed
    this.draw();
  }
  
  public explode(particleSystem?: { 
    createExplosion: (x: number, y: number, color: number, count: number) => void;
    createBirdExplosion: (x: number, y: number, hue: number, vx: number, vy: number) => void;
  }) {
    // Create spaceship explosion animation
    if (particleSystem && this.alive) {
      // Create multi-stage explosion effect
      const baseColor = hueToRGB(this.hue);
      
      // Stage 1: Initial burst
      particleSystem.createExplosion(this.x, this.y, baseColor, 15);
      
      // Stage 2: Delayed secondary explosions
      setTimeout(() => {
        if (!this.sprite.destroyed) {
          particleSystem.createExplosion(this.x + 10, this.y - 5, 0xFFFF00, 8);
          particleSystem.createExplosion(this.x - 10, this.y + 5, 0xFF00FF, 8);
        }
      }, 50);
      
      // Stage 3: Final shockwave
      setTimeout(() => {
        if (!this.sprite.destroyed) {
          particleSystem.createBirdExplosion(this.x, this.y, this.hue, this.vx, this.vy);
        }
      }, 100);
    }
    
    // Then destroy the boid
    this.destroy();
  }

  /**
   * Shoot a projectile at the nearest asteroid
   */
  public shoot(_asteroids?: Asteroid[]): BirdProjectile | null {
    // Check if can shoot
    if (!this.isShooter || this.shootCooldown > 0 || !this.alive) {
      return null;
    }
    
    // ALWAYS shoot in the bird's flying direction - like original Asteroids!
    // No smart targeting, just pure direction shooting
    const shootRange = 500; // How far ahead to aim
    const velocity = VectorUtils.normalize({ x: this.vx, y: this.vy });
    const targetX = this.x + velocity.x * shootRange;
    const targetY = this.y + velocity.y * shootRange;
    
    // Calculate nose position based on bird direction
    const noseOffset = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    const angle = Math.atan2(this.vy, this.vx);
    const noseX = this.x + Math.cos(angle) * noseOffset;
    const noseY = this.y + Math.sin(angle) * noseOffset;
    
    // Create projectile from nose position
    const projectile = BirdProjectile.createAimed(
      this.app,
      noseX,
      noseY,
      targetX,
      targetY
    );
    
    // Set cooldown with RANDOM VARIABILITY (±30%)
    const variability = 0.7 + Math.random() * 0.6;  // 0.7 to 1.3
    this.shootCooldown = this.maxShootCooldown * variability;
    
    return projectile;
  }
  
  /**
   * Check if ready to shoot
   */
  public canShoot(): boolean {
    return this.isShooter && this.shootCooldown <= 0 && this.alive;
  }
  
  public destroy() {
    // Prevent double destruction
    if (!this.alive) return;
    
    this.alive = false;
    
    EntityDestroyer.destroyEntity(
      {
        sprite: this.sprite,
        trailSprite: this.trailGraphics,
        app: this.app
      },
      {
        markAsDestroyed: false // Already marked alive=false above
      }
    );
  }
}