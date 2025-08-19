import * as PIXI from 'pixi.js';
import { Boid } from './entities/Boid';
import { BossBird } from './entities/BossBird';
import type { BirdProjectile } from './entities/BirdProjectile';
import { EnergyDot } from './entities/EnergyDot';
import { Asteroid } from './entities/Asteroid';
import { Shredder, calculateShredderSpawnProbability } from './entities/Shredder';
import { AsteroidSplitter } from './systems/AsteroidSplitter';
import { ParticleSystem } from './systems/ParticleSystem';
import { FlockingSystem } from './systems/FlockingSystem';
import { SuperNavigatorAI } from './systems/SuperNavigatorAI';
import { InputManager } from './systems/InputManager';
import { SafeCollisionSystemExtended } from './systems/SafeCollisionSystemExtended';
import { CollisionDebugger } from './systems/CollisionDebugger';
import { ComboEffects } from './effects/ComboEffects';
import { DevModeDisplay } from './ui/DevModeDisplay';
import { GameConfig } from './GameConfig';
import CentralConfig from './CentralConfig';
import { scoringSystem, ScoringEvent } from './ScoringSystem';
import { hueToRGB } from './utils/ColorUtils';
import { BackgroundRenderer } from './modules/BackgroundRenderer';
import { WaveManager } from './modules/WaveManager';

const { VISUALS, SIZES, ENTITY_LIMITS, PHYSICS, FLOCKING, ERRORS, UI, GAME_CONSTANTS, SHREDDER } = CentralConfig;

export class NeonFlockEngine {
  private app!: PIXI.Application;
  private backgroundRenderer!: BackgroundRenderer;
  private waveManager!: WaveManager;
  private debug = false;
  private frameCount = 0;
  
  private boids: Boid[] = [];
  private projectiles: BirdProjectile[] = [];
  private energyDots: EnergyDot[] = [];
  private asteroids: Asteroid[] = [];
  private shredders: Shredder[] = [];
  private recentLaunchPositions: { x: number; y: number }[] = []; // Track last 10 launch positions
  private fallingDots: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetSlot: number;
    sprite: PIXI.Graphics;
    glowSprite: PIXI.Graphics;
    pulsePhase: number;
    originalDot: EnergyDot;
    trail: PIXI.Graphics[];
    trailPositions: { x: number, y: number }[];
    toRemove?: boolean;
  }> = [];
  private deferredBirdSpawns: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  
  private particleSystem!: ParticleSystem;
  private flockingSystem!: FlockingSystem;
  private superNavigatorAI!: SuperNavigatorAI;
  private comboEffects!: ComboEffects;
  private devModeDisplay!: DevModeDisplay;
  private inputManager!: InputManager;
  private collisionSystem!: SafeCollisionSystemExtended;
  private collisionDebugger!: CollisionDebugger;
  private asteroidSplitter!: AsteroidSplitter;
  
  private dotRespawnTimers: Map<number, number> = new Map(); // Track individual dot respawn timers
  
  // Autopilot mode for testing
  private autopilotEnabled = false;
  private lastAutopilotShot = 0;
  
  public onScoreUpdate?: (score: number, combo: number, multiplier: number) => void;
  public onWaveUpdate?: (wave: number) => void;
  public onEnergyStatus?: (critical: boolean) => void;
  public onGameOver?: () => void;
  
  public getScore(): number {
    return scoringSystem.getScore();
  }
  
  public getWave(): number {
    return this.waveManager.getWave();
  }
  
  public isBossWave(): boolean {
    return this.waveManager.isBossWave();
  }
  
  private container: HTMLDivElement;
  private initialized = false;

  constructor(container: HTMLDivElement, debugMode = false) {
    this.container = container;
    this.debug = debugMode;
    if (debugMode) {
      console.log('[ENGINE] Debug mode enabled - collision logging active');
    }
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      console.log('[NEON FLOCK] Initializing Pixi.js...');
      
      // Create application
      this.app = new PIXI.Application();
      
      // iOS-friendly initialization settings
      const isIOS = GAME_CONSTANTS.PLATFORM.IOS_USER_AGENT_REGEX.test(navigator.userAgent);
      
      // Initialize with settings
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: GAME_CONSTANTS.CANVAS.BACKGROUND_COLOR,
        antialias: !isIOS, // Disable antialiasing on iOS for performance
        resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap resolution on iOS
        autoDensity: true,
        // Force WebGL 1 on iOS for better compatibility
        preferWebGLVersion: isIOS ? 1 : 2,
        powerPreference: isIOS ? 'low-power' : 'high-performance'
      });
      
      // Append canvas to container
      this.container.appendChild(this.app.canvas);
      
      // Initialize systems
      this.particleSystem = new ParticleSystem(this.app);
      this.flockingSystem = new FlockingSystem();
      this.superNavigatorAI = new SuperNavigatorAI();
      this.collisionSystem = new SafeCollisionSystemExtended();
      this.comboEffects = new ComboEffects(this.app);
      this.devModeDisplay = new DevModeDisplay(this.app, this.debug);
      this.collisionDebugger = new CollisionDebugger();
      this.asteroidSplitter = new AsteroidSplitter(this.app);
      this.inputManager = new InputManager(this.app, this);
      this.backgroundRenderer = new BackgroundRenderer(this.app);
      this.waveManager = new WaveManager();
      
      // Setup wave callbacks - bind to preserve context
      this.waveManager.onWaveUpdate = (wave: number) => {
        // CRITICAL FIX: Update ComboEffects with current wave for filter logic!
        this.comboEffects.setWave(wave);
        this.onWaveUpdate?.(wave);
      };
      
      // Setup game
      this.backgroundRenderer.setupBackground();
      this.initializeGame();
      
      // Setup resize handler
      window.addEventListener('resize', this.handleResize);
      
      this.initialized = true;
      console.log('[NEON FLOCK] Engine initialized successfully');
      
    } catch (error) {
      // FAIL LOUD! FAIL HARD! FAIL FAST! FAIL EARLY!
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'NO STACK';
      
      console.error('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
      console.error('ENGINE INITIALIZATION FAILED!!!');
      console.error('MESSAGE:', errorMsg);
      console.error('STACK:', errorStack);
      console.error('USER AGENT:', navigator.userAgent);
      console.error('SCREEN:', `${window.innerWidth}x${window.innerHeight}`);
      console.error('PIXEL RATIO:', window.devicePixelRatio);
      console.error('FULL ERROR:', error);
      console.error('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
      
      // DISPLAY GIANT RED ERROR ON SCREEN!
      document.body.style.backgroundColor = '#FF0000';
      document.body.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #FF0000;
          color: white;
          font-size: 24px;
          font-family: monospace;
          padding: 20px;
          overflow: auto;
        ">
          <h1>🔥 ENGINE INITIALIZATION FAILED 🔥</h1>
          <pre>${errorMsg}</pre>
          <pre>${errorStack}</pre>
          <p>Device: ${navigator.userAgent}</p>
          <p>Screen: ${window.innerWidth}x${window.innerHeight}</p>
        </div>
      `;
      
      // CRASH HARD!
      throw new Error(`${ERRORS.ENGINE.INIT_FAILED}: ${errorMsg}`);
    }
  }
  
  private initializeGame() {
    try {
      scoringSystem.reset(); // Reset scoring system
      this.waveManager.reset(); // Reset wave manager
      this.spawnEnergyDots();
      this.waveManager.startWave();
      // CRITICAL FIX: Set initial wave on ComboEffects!
      this.comboEffects.setWave(1);
      
      // SAFE: Wrap game loop with error recovery
      let consecutiveErrors = 0;
      const MAX_CONSECUTIVE_ERRORS = 10;
      
      const safeGameLoop = (ticker: PIXI.Ticker) => {
        try {
          this.gameLoop(ticker.deltaTime);
          // Reset error count on successful frame
          consecutiveErrors = 0;
        } catch (gameLoopError) {
          consecutiveErrors++;
          console.error(`[GAME LOOP ERROR ${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}]:`, gameLoopError);
          console.error('Stack trace:', (gameLoopError as Error).stack);
          
          // Only trigger game over after multiple consecutive failures
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error('[CRITICAL] Too many consecutive errors, ending game');
            try {
              this.onGameOver?.();
            } catch (gameOverError) {
              console.error('[GAME OVER ERROR]:', gameOverError);
            }
          } else {
            console.warn(`[RECOVERY] Attempting to continue (${MAX_CONSECUTIVE_ERRORS - consecutiveErrors} attempts remaining)`);
          }
        }
      };
      
      this.app.ticker.add(safeGameLoop);
    } catch (initError) {
      console.error('[GAME INITIALIZATION ERROR]:', initError);
      throw initError;
    }
  }
  
  private createFallingDot(x: number, y: number, originalDot: EnergyDot) {
    // Create sprites for falling dot - same structure as original!
    const glowSprite = new PIXI.Graphics();
    const sprite = new PIXI.Graphics();
    const pulsePhase = Math.random() * Math.PI * 2;
    
    const targetSlot = this.energyDots.indexOf(originalDot);
    const targetX = (this.app.screen.width / (GameConfig.ENERGY_COUNT + 1)) * (targetSlot + 1);
    const targetY = this.app.screen.height * GameConfig.BASE_Y;
    
    // Calculate initial velocity toward target with some randomness
    const dx = targetX - x;
    const angle = Math.atan2(targetY - y, dx);
    
    // Add sprites to stage
    this.app.stage.addChild(glowSprite);
    this.app.stage.addChild(sprite);
    
    // 75% of bird speed as requested!
    const birdSpeed = GameConfig.BASE_SPEED * this.waveManager.getSpeedMultiplier();
    const fallSpeed = birdSpeed * 0.75; // 75% of bird speed
    
    // Create trail graphics for falling dot
    const trail: PIXI.Graphics[] = [];
    for (let i = 0; i < 5; i++) {
      const trailSegment = new PIXI.Graphics();
      trailSegment.alpha = 0.3 * (1 - i / 5);
      this.app.stage.addChild(trailSegment);
      trail.push(trailSegment);
    }
    
    this.fallingDots.push({
      x,
      y,
      vx: Math.cos(angle) * fallSpeed * 0.3 + (Math.random() - 0.5) * 5,
      vy: fallSpeed, // 75% of bird speed
      targetSlot,
      sprite,
      glowSprite,
      pulsePhase,
      originalDot,
      trail,
      trailPositions: []
    });
  }
  
  private spawnEnergyDots() {
    this.energyDots.forEach(dot => dot.destroy());
    this.energyDots = [];
    
    const spacing = this.app.screen.width / (GameConfig.ENERGY_COUNT + 1);
    for (let i = 0; i < GameConfig.ENERGY_COUNT; i++) {
      const dot = new EnergyDot(
        this.app,
        spacing * (i + 1),
        this.app.screen.height * GameConfig.BASE_Y,
        (i * 360 / GameConfig.ENERGY_COUNT) % 360
      );
      this.energyDots.push(dot);
    }
  }
  
  
  public spawnBird(x?: number, y?: number) {
    try {
      let boid: Boid;
      
      // Check if we should spawn a boss (like we check for shooters/navigators)
      if (this.waveManager.getBossesToSpawn() > 0) {
        // Spawn boss bird with configured health
        boid = new BossBird(
          this.app,
          x ?? Math.random() * this.app.screen.width,
          y ?? -20,
          this.waveManager.getSpeedMultiplier(),
          this.waveManager.getBossHealthForWave(),
          false // No shooting for first bosses
        );
        this.waveManager.decrementBossesToSpawn();
        console.log(`[SPAWN] Boss bird spawned with ${this.waveManager.getBossHealthForWave()} HP, ${this.waveManager.getBossesToSpawn()} bosses left`);
      } else {
        // Spawn normal bird (might be shooter/navigator)
        boid = new Boid(
          this.app,
          x ?? Math.random() * this.app.screen.width,
          y ?? -20,
          this.waveManager.getSpeedMultiplier()
        );
      }
      
      // Validate the boid is properly initialized
      if (boid && typeof boid.applyForces === 'function' && typeof boid.destroy === 'function') {
        this.boids.push(boid);
        
        // Dev mode spawn notifications
        if (this.devModeDisplay && this.devModeDisplay.isEnabled()) {
          if (boid instanceof BossBird) {
            this.devModeDisplay.addSpawnMessage('BOSS');
          } else if (boid.isSuperNavigator) {
            this.devModeDisplay.addSpawnMessage('super');
          } else if (boid.isShooter) {
            this.devModeDisplay.addSpawnMessage('shooter');
          }
        }
        
        // Boss announcement for all players (not just dev mode)
        if (boid instanceof BossBird) {
          console.log('[BOSS] Creating boss announcement!');
          this.comboEffects.createBossAnnouncement();
          console.log('[BOSS] Boss announcement created');
        }
      } else {
        console.error('[SPAWN ERROR] Invalid Boid instance in spawnBird!');
      }
    } catch (error) {
      console.error('[SPAWN ERROR] Failed to spawn bird:', error);
    }
  }

  private maybeSpawnShredder() {
    const A = this.asteroids.length;
    const P = calculateShredderSpawnProbability(A);
    if (this.shredders.length >= SHREDDER.MAX_CONCURRENT) return;
    if (Math.random() < P) {
      // Just spawn it like any other ship - no special effects!
      const shredder = new Shredder(this.app);
      this.shredders.push(shredder);
    }
  }
  
  public launchAsteroid(
    startX: number, 
    startY: number, 
    targetX: number, 
    targetY: number, 
    size: number, 
    slownessFactor = 1,
    shapeData?: { vertices: number[], roughness: number[] } | null,
    hue?: number // The exact hue that was shown during charging
  ) {
    // Check if player can afford the asteroid
    if (!scoringSystem.canAffordAsteroid(size)) {
      console.log('[SCORING] Cannot afford asteroid of size', size);
      // Show visual feedback that you can't afford it
      this.showNoPointsWarning();
      return;
    }
    
    // Charge points for launching asteroid
    scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size });
    this.updateScoreDisplay();
    
    const dx = targetX - startX;
    const dy = targetY - startY;
    
    // CRITICAL FIX: Safety check before Math.hypot to prevent NaN/freeze
    if (!isFinite(dx) || !isFinite(dy) || !isFinite(startX) || !isFinite(startY) || !isFinite(targetX) || !isFinite(targetY)) {
      console.warn('[ASTEROID LAUNCH] Invalid coordinates detected, aborting launch:', {startX, startY, targetX, targetY});
      return;
    }
    
    const dist = Math.hypot(dx, dy);
    
    // SAFETY: Validate distance calculation result
    if (!isFinite(dist)) {
      console.warn('[ASTEROID LAUNCH] Invalid distance calculated, aborting launch');
      return;
    }
    
    if (dist > 20) {
      const speed = Math.min(dist * 3, GameConfig.AST_SPEED) * slownessFactor;
      const asteroid = new Asteroid(
        this.app,
        startX,
        startY,
        (dx / dist) * speed,
        (dy / dist) * speed,
        size,
        shapeData || undefined,
        hue // Pass the exact hue to maintain consistency!
      );
      this.asteroids.push(asteroid);
      
      // Track launch position for Shredder DISRUPTOR behavior
      this.recentLaunchPositions.push({ x: startX, y: startY });
      if (this.recentLaunchPositions.length > 10) {
        this.recentLaunchPositions.shift(); // Keep only last 10
      }
      
      // No launch effect - clean launch
    }
  }
  
  private gameLoop = (delta: number) => {
    if (!this.initialized) return;
    
    this.frameCount++;
    
    // Update combo timer
    scoringSystem.updateComboTimer(delta * 16.67); // Convert delta to milliseconds
    
    // EMERGENCY ENTITY COUNT PROTECTION - Prevent performance freeze with too many entities
    const MAX_TOTAL_ENTITIES = ENTITY_LIMITS.TOTAL_ENTITIES.MAX;
    const totalEntityCount = this.boids.length + this.asteroids.length + this.fallingDots.length + this.shredders.length;
    
    if (totalEntityCount > MAX_TOTAL_ENTITIES) {
      console.warn(`[PERFORMANCE WARNING] Too many entities (${totalEntityCount}/${MAX_TOTAL_ENTITIES}), performing emergency cleanup`);
      
      // Emergency cleanup - remove oldest entities
      if (this.asteroids.length > ENTITY_LIMITS.ASTEROIDS.MAX_TOTAL) {
        const toRemove = this.asteroids.splice(0, ENTITY_LIMITS.ASTEROIDS.MAX_PER_FRAME);
        toRemove.forEach(ast => {
          if (ast && typeof ast.destroy === 'function') {
            try {
              ast.destroy();
            } catch (e) {
              console.error('[EMERGENCY CLEANUP] Failed to destroy asteroid:', e);
            }
          }
        });
        console.warn(`[EMERGENCY] Removed ${toRemove.length} asteroids`);
      }
      
      if (this.boids.length > ENTITY_LIMITS.BIRDS.WARNING_THRESHOLD) {
        const toRemove = this.boids.splice(0, ENTITY_LIMITS.BIRDS.MAX_PER_FRAME);
        toRemove.forEach(boid => {
          if (boid && typeof boid.destroy === 'function') {
            try {
              boid.destroy();
            } catch (e) {
              console.error('[EMERGENCY CLEANUP] Failed to destroy boid:', e);
            }
          }
        });
        console.warn(`[EMERGENCY] Removed ${toRemove.length} boids`);
      }
      
      if (this.fallingDots.length > ENTITY_LIMITS.FALLING_DOTS.MAX_TOTAL) {
        const toRemove = this.fallingDots.splice(0, 10);
        toRemove.forEach(dot => {
          try {
            if (dot.sprite && dot.sprite.parent) {
              this.app.stage.removeChild(dot.sprite);
            }
            if (dot.sprite && !dot.sprite.destroyed) {
              dot.sprite.destroy();
            }
            if (dot.glowSprite && dot.glowSprite.parent) {
              this.app.stage.removeChild(dot.glowSprite);
            }
            if (dot.glowSprite && !dot.glowSprite.destroyed) {
              dot.glowSprite.destroy();
            }
          } catch (e) {
            console.error('[EMERGENCY CLEANUP] Failed to destroy falling dot:', e);
          }
        });
        console.warn(`[EMERGENCY] Removed ${toRemove.length} falling dots`);
      }
    }
    
    const dt = delta / 60; // Convert to seconds at 60fps
    const time = performance.now() / 1000;
    
    // Spawn birds and maybe Shredder on spawn tick
    if (time > this.waveManager.getNextSpawnTime()) {
      if (this.waveManager.getBirdsToSpawn() > 0) {
        this.spawnBird();
        this.waveManager.decrementBirdsToSpawn();
      }
      this.maybeSpawnShredder();
      this.waveManager.setNextSpawnTime(time + 0.5);
    }
    
    // Update boids - SAFE: Use traditional for loop to avoid array mutation issues
    const boidsToRemove: number[] = [];
    
    for (let i = 0; i < this.boids.length; i++) {
      const boid = this.boids[i];
      if (!boid || !boid.alive) {
        boidsToRemove.push(i);
        continue;
      }
      
      if (boid.hasDot) {
        // Carrying dot to top
        boid.moveToTop(dt);
        
        if (boid.y < SIZES.BIRD.BASE * 2) {
          // Reached top - spawn burst
          const burstCount = this.waveManager.getWave(); // Dynamic: wave 1 = 1 bird, wave 10 = 10 birds, etc.
          console.log(`[GAME] Bird reached top on wave ${this.waveManager.getWave()}! Spawning ${burstCount} birds...`);
          
          // Start respawn timer for this dot
          if (boid.targetDot) {
            const dotIndex = this.energyDots.indexOf(boid.targetDot);
            if (dotIndex >= 0) {
              this.dotRespawnTimers.set(dotIndex, 0);
              console.log(`[GAME] Starting ${this.waveManager.getDotRespawnDelay() / 1000}s respawn timer for dot ${dotIndex} (wave ${this.waveManager.getWave()})`);
            }
            boid.targetDot = null;
          }
          
          // CRITICAL FIX: Limit deferred spawns to prevent unbounded memory growth
          const MAX_DEFERRED_SPAWNS = ENTITY_LIMITS.BIRDS.MAX_TOTAL * 5;
          
          // DEFER bird spawning to prevent array mutation during iteration
          for (let j = 0; j < burstCount && this.deferredBirdSpawns.length < MAX_DEFERRED_SPAWNS; j++) {
            const angle = (j / burstCount) * Math.PI * 2;
            this.deferredBirdSpawns.push({
              x: boid.x,
              y: boid.y,
              vx: Math.cos(angle) * PHYSICS.SPEED.BASE_BIRD_SPEED * 3.75, // 150
              vy: Math.sin(angle) * PHYSICS.SPEED.BASE_BIRD_SPEED * 3.75  // 150
            });
          }
          
          if (this.deferredBirdSpawns.length >= MAX_DEFERRED_SPAWNS) {
            console.warn('[SPAWN] Deferred bird spawn limit reached, some birds not spawned');
          }
          
          // Visual feedback - more particles for higher waves
          this.particleSystem.createExplosion(boid.x, boid.y, VISUALS.COLORS.NEON_MAGENTA, 20 + burstCount);
          
          // Penalty for letting bird reach top
          scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_LOST);
          this.waveManager.trackDotLost(); // Track dots lost in this wave
          this.updateScoreDisplay();
          
          // Mark for removal instead of immediate splice
          boid.destroy();
          boidsToRemove.push(i);
          continue;
        }
      } else {
        // Super navigators use their own AI!
        let forces: { x: number; y: number };
        
        if (boid.isSuperNavigator) {
          // SUPER NAVIGATOR AI - Advanced movement algorithm!
          forces = this.superNavigatorAI.calculateSuperForces(
            boid,
            this.boids,
            this.energyDots,
            this.asteroids,
            this.fallingDots
          );
        } else {
          // Regular flocking behavior - now with falling dot awareness!
          forces = this.flockingSystem.calculateForces(
            boid,
            this.boids,
            this.energyDots,
            this.asteroids,
            this.fallingDots
          );
        }
        
        boid.applyForces(forces, dt);
        
        // SHOOTER BIRDS - Check if they should shoot!
        if (boid.isShooter && boid.canShoot() && this.asteroids.length > 0) {
          console.log('[SHOOTER] Attempting to shoot! Asteroids:', this.asteroids.length);
          const projectile = boid.shoot(this.asteroids);
          if (projectile) {
            this.projectiles.push(projectile);
            console.log('[SHOOTER] Shot fired! Projectiles:', this.projectiles.length);
            // NO visual feedback for shooting - laser beam is enough!
          }
        }
        
        // Check dot pickup - both stationary and falling dots
        for (const dot of this.energyDots) {
          if (!dot.stolen && boid.checkDotPickup(dot)) {
            dot.steal();
            boid.hasDot = true;
            boid.targetDot = dot;
            this.particleSystem.createPickup(dot.x, dot.y, dot.hue);
            break;
          }
        }
        
        // Check if bird can catch a falling dot - DEFERRED to avoid array mutation
        for (let j = 0; j < this.fallingDots.length; j++) {
          const fallingDot = this.fallingDots[j];
          if (!fallingDot) continue;
          
          // CRITICAL FIX: Safety check before Math.hypot to prevent NaN/freeze
          if (!isFinite(fallingDot.x) || !isFinite(fallingDot.y) || !isFinite(boid.x) || !isFinite(boid.y)) {
            console.warn('[COLLISION] Invalid positions in falling dot pickup, skipping');
            continue;
          }
          
          const dist = Math.hypot(fallingDot.x - boid.x, fallingDot.y - boid.y);
          
          // SAFETY: Validate distance result
          if (!isFinite(dist)) {
            console.warn('[COLLISION] Invalid distance in falling dot pickup');
            continue;
          }
          
          // Bird catches falling dot if close enough
          if (dist < FLOCKING.RADIUS.FALLING_DOT_CATCH && !boid.hasDot) {
            // Bird catches the falling dot!
            boid.hasDot = true;
            boid.targetDot = fallingDot.originalDot; // CRITICAL: Set the target dot!
            
            // CRITICAL: Ensure original dot stays stolen (it should already be)
            if (!fallingDot.originalDot.stolen) {
              fallingDot.originalDot.steal();
            }
            
            // Create pickup effect
            this.particleSystem.createPickup(fallingDot.x, fallingDot.y, 120);
            
            // Remove the falling dot's sprite safely
            if (fallingDot.sprite.parent) {
              this.app.stage.removeChild(fallingDot.sprite);
            }
            if (!fallingDot.sprite.destroyed) {
              fallingDot.sprite.destroy();
            }
            
            // Clean up falling dot's glow sprite too!
            if (fallingDot.glowSprite && fallingDot.glowSprite.parent) {
              this.app.stage.removeChild(fallingDot.glowSprite);
            }
            if (fallingDot.glowSprite && !fallingDot.glowSprite.destroyed) {
              fallingDot.glowSprite.destroy();
            }
            
            // Clean up trail
            if (fallingDot.trail) {
              fallingDot.trail.forEach(t => {
                if (t.parent) {
                  this.app.stage.removeChild(t);
                }
                if (!t.destroyed) {
                  t.destroy();
                }
              });
            }
            
            // Mark falling dot for removal (will be cleaned up later)
            fallingDot.toRemove = true;
            
            // Bonus points for catching a falling dot!
            scoringSystem.addEvent(ScoringEvent.ENERGY_DOT_CAUGHT_FALLING);
            this.updateScoreDisplay();
            break;
          }
        }
      }
      
      if (boid && boid.alive) {
        boid.update(dt);
      }
    }
    
    // SAFE: Remove boids in reverse order to maintain indices
    for (let i = boidsToRemove.length - 1; i >= 0; i--) {
      const index = boidsToRemove[i];
      if (this.boids[index]) {
        this.boids.splice(index, 1);
      }
    }
    
    // Process deferred bird spawns AFTER boid iteration is complete
    if (this.deferredBirdSpawns.length > 0) {
      const maxNewBirds = ENTITY_LIMITS.BIRDS.MAX_PER_FRAME; // Safety limit to prevent performance issues
      const maxTotalBirds = ENTITY_LIMITS.BIRDS.MAX_TOTAL; // Maximum total birds to prevent performance issues
      const currentBirdCount = this.boids.filter(b => b && b.alive).length;
      const availableSlots = Math.max(0, maxTotalBirds - currentBirdCount);
      
      // SAFE: Prevent infinite loop with NaN/negative values
      const spawnsToProcess = Math.max(0, Math.min(
        Math.floor(this.deferredBirdSpawns.length) || 0,
        Math.floor(maxNewBirds) || 0,
        Math.floor(availableSlots) || 0
      ));
      
      if (this.debug) {
        console.log(`[SPAWN] Processing ${spawnsToProcess} deferred bird spawns (current: ${currentBirdCount}, max: ${maxTotalBirds})`);
      }
      
      // SAFE: Clear spawns if calculation failed or no slots available
      if (!isFinite(spawnsToProcess) || spawnsToProcess <= 0) {
        if (this.deferredBirdSpawns.length > 0) {
          console.warn(`[SPAWN] Bird limit reached or calculation error (${currentBirdCount}/${maxTotalBirds}), discarding ${this.deferredBirdSpawns.length} spawns`);
          this.deferredBirdSpawns = [];
        }
        return;
      }
      
      // SAFE: Process spawns with loop counter protection
      let processed = 0;
      const maxIterations = Math.min(spawnsToProcess, ENTITY_LIMITS.BIRDS.MAX_TOTAL * 0.5); // Hard limit to prevent infinite loops
      
      for (let i = 0; i < maxIterations && processed < spawnsToProcess && i < this.deferredBirdSpawns.length; i++) {
        const spawn = this.deferredBirdSpawns[i];
        if (!spawn || !isFinite(spawn.x) || !isFinite(spawn.y) || !isFinite(spawn.vx) || !isFinite(spawn.vy)) {
          console.warn('[SPAWN ERROR] Invalid spawn data, skipping:', spawn);
          continue;
        }
        
        try {
          const newBoid = new Boid(
            this.app,
            spawn.x,
            spawn.y,
            this.waveManager.getSpeedMultiplier(),
            { vx: spawn.vx, vy: spawn.vy }  // Pass velocity properly to constructor
          );
          
          // Validate the boid is properly initialized
          if (newBoid && typeof newBoid.applyForces === 'function' && typeof newBoid.destroy === 'function') {
            this.boids.push(newBoid);
            processed++;
          } else {
            console.error('[SPAWN ERROR] Invalid Boid instance created!');
          }
        } catch (error) {
          console.error('[SPAWN ERROR] Failed to create Boid:', error);
        }
      }
      
      // Clear processed spawns safely
      const newLength = Math.max(0, this.deferredBirdSpawns.length - processed);
      this.deferredBirdSpawns = this.deferredBirdSpawns.slice(processed).slice(0, newLength);
      
      if (this.deferredBirdSpawns.length > 0) {
        console.warn(`[SPAWN] ${this.deferredBirdSpawns.length} bird spawns deferred to next frame due to limit`);
      }
    }
    
    // Update projectiles
    this.projectiles = this.projectiles.filter(projectile => {
      const keepProjectile = projectile.update(dt);
      if (!keepProjectile || projectile.isOffScreen(this.app.screen) || projectile.isExpired()) {
        projectile.destroy();
        return false;
      }
      return true;
    });
    
    // Update asteroids and detect zombies
    this.asteroids = this.asteroids.filter(asteroid => {
      // ZOMBIE CHECK: Detect asteroids that aren't moving or updating properly
      const prevX = asteroid.x;
      const prevY = asteroid.y;
      
      // Try to update
      let keepAsteroid = false;
      try {
        keepAsteroid = asteroid.update(dt);
      } catch (error) {
        console.warn('[ASTEROID] Update error, removing zombie:', error);
        asteroid.destroy();
        return false;
      }
      
      // Check if asteroid is actually moving (zombie detection)
      const moved = Math.abs(asteroid.x - prevX) > 0.001 || Math.abs(asteroid.y - prevY) > 0.001;
      
      // Check for zombie conditions:
      // 1. Marked as destroyed but still in array
      // 2. Not moving when it should be (has velocity but position unchanged)
      // 3. Missing sprite or sprite destroyed
      const hasVelocity = Math.abs(asteroid.vx) > 0.1 || Math.abs(asteroid.vy) > 0.1;
      const isZombie = asteroid.destroyed || 
                       (hasVelocity && !moved && dt > 0) ||
                       !asteroid.sprite || 
                       asteroid.sprite.destroyed;
      
      if (isZombie) {
        console.warn('[ASTEROID] Zombie detected, removing:', {
          destroyed: asteroid.destroyed,
          moved,
          hasVelocity,
          hasSprite: !!asteroid.sprite
        });
        if (!asteroid.destroyed) {
          asteroid.destroy();
        }
        return false;
      }
      
      // Normal removal conditions
      if (!keepAsteroid || asteroid.isOffScreen(this.app.screen)) {
        asteroid.destroy();
        return false;
      }
      
      return true;
    });

    // Calculate flock center for PROTECTOR Shredders
    let flockCenter: { x: number; y: number } | undefined = undefined;
    if (this.boids.length > 0) {
      let centerX = 0;
      let centerY = 0;
      let count = 0;
      for (const boid of this.boids) {
        if (boid.alive) {
          centerX += boid.x;
          centerY += boid.y;
          count++;
        }
      }
      if (count > 0) {
        flockCenter = { x: centerX / count, y: centerY / count };
      }
    }
    
    // Track kills per asteroid for proper combo counting
    const asteroidKills = new Map<Asteroid, { birds: Boid[], score: number }>();
    
    // Track shredder kills per asteroid for combo counting
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asteroidShredderKills = new Map<Asteroid, { shredders: any[], x: number, y: number }>();
    
    // Update shredders and handle collisions with asteroids
    this.shredders = this.shredders.filter(shredder => {
      // Pass asteroids, other shredders, boids, launch positions, and flock center
      const keep = shredder.update(dt, this.asteroids, this.shredders, this.boids, 
                                  this.recentLaunchPositions, flockCenter);
      if (!keep) {
        // Off-screen - just remove it
        shredder.destroy();
        return false;
      }
      for (let i = this.asteroids.length - 1; i >= 0; i--) {
        const asteroid = this.asteroids[i];
        const dx = asteroid.x - shredder.x;
        const dy = asteroid.y - shredder.y;
        const distSq = dx * dx + dy * dy;
        const threshold = (asteroid.size + shredder.radius) * (asteroid.size + shredder.radius);
        if (distSq < threshold) {
          const rS = shredder.radius;
          const rA = asteroid.size;
          const tau = SHREDDER.TOLERANCE;
          if (rA < rS * (1 - tau)) {
            asteroid.destroy();
            this.asteroids.splice(i, 1);
            this.particleSystem.createExplosion(asteroid.x, asteroid.y, 0xFF0000, 15); // Red explosion for bad!
            
            // LOSE points for getting shredded!
            scoringSystem.addEvent(ScoringEvent.SHREDDER_SHRED);
            this.updateScoreDisplay();
          } else if (rA > rS * (1 + tau)) {
            // Big asteroid destroys shredder - Track for combos!
            shredder.destroy();
            this.particleSystem.createExplosion(shredder.x, shredder.y, 0x00FF00, 30); // Green explosion for good!
            
            // INCREMENT LIFETIME KILL COUNT FOR SHREDDER!
            asteroid.killCount++;
            asteroid.lastKillTime = Date.now();
            console.log(`[LIFETIME COMBO] Asteroid killed shredder! Total kills: ${asteroid.killCount}`);
            
            // Track this shredder kill for combo counting
            if (!asteroidShredderKills.has(asteroid)) {
              asteroidShredderKills.set(asteroid, { shredders: [], x: 0, y: 0 });
            }
            const kills = asteroidShredderKills.get(asteroid)!;
            kills.shredders.push(shredder);
            kills.x = shredder.x;
            kills.y = shredder.y;
            
            return false;
          } else {
            asteroid.destroy();
            this.asteroids.splice(i, 1);
            shredder.destroy();
            this.particleSystem.createExplosion(shredder.x, shredder.y, 0xFFFFFF, 20);
            return false;
          }
        }
      }
      return true;
    });
    
    // Process shredder kills - add them to the main asteroid kills tracking
    for (const [asteroid, shredderKills] of asteroidShredderKills) {
      if (!asteroidKills.has(asteroid)) {
        asteroidKills.set(asteroid, { birds: [], score: 0 });
      }
      const kills = asteroidKills.get(asteroid)!;
      // Add shredders as "special birds" for combo purposes
      for (let i = 0; i < shredderKills.shredders.length; i++) {
        // Create a pseudo-bird object for combo counting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        kills.birds.push({ 
          x: shredderKills.x, 
          y: shredderKills.y, 
          isShredder: true,
          hasDot: false,
          isShooter: false,
          isSuperNavigator: false
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    }
    
    // WRAP ENTIRE COLLISION SYSTEM IN TRY-CATCH
    try {
      // Start collision performance tracking
      if (this.debug) {
        this.collisionDebugger.startFrame();
        this.collisionDebugger.logCollisionCheck('asteroid-boid', this.asteroids.length, this.boids.length);
        console.log(`[COLLISION] Frame ${this.frameCount}: ${this.asteroids.length} asteroids, ${this.boids.length} boids`);
      }
      
      // Use extended collision system with projectiles
      const newFragments = this.collisionSystem.handleCollisionsWithProjectiles(
        this.boids,
        this.asteroids,
        this.energyDots,
        this.projectiles,
        {
          onBossShieldHit: (asteroid, boss) => {
            // BOSS SHIELD HIT - Split asteroid and push fragments away!
            console.log('[BOSS SHIELD] Splitting asteroid and pushing fragments away from boss!');
            
            // Split the asteroid with push-away from boss position
            const fragments = this.asteroidSplitter.split(asteroid, this.asteroids.length, { 
              x: boss.x, 
              y: boss.y 
            });
            
            // Visual effect for shield hit
            this.particleSystem.createExplosion(asteroid.x, asteroid.y, 0x00FFFF, 20);
            
            // Score for shield hit
            scoringSystem.addEvent(ScoringEvent.ASTEROID_SPLIT);
            this.updateScoreDisplay();
            
            return fragments;
          },
          onProjectileHit: (_projectile, asteroid) => {
            // Split asteroid when hit by projectile
            // AUTHENTIC ASTEROIDS: Pass current count for 26 asteroid limit
            const fragments = this.asteroidSplitter.split(asteroid, this.asteroids.length);
            
            // Visual effect for split - just explosion, no annoying lines
            this.particleSystem.createExplosion(asteroid.x, asteroid.y, asteroid.hue, 15);
            
            // Score for shooting asteroid
            scoringSystem.addEvent(ScoringEvent.ASTEROID_SPLIT);
            this.updateScoreDisplay();
            
            return fragments;
          },
          onBoidHit: (boid, asteroid) => {
            // SAFE: Validate boid before processing
            if (!boid || typeof boid.x !== 'number' || typeof boid.y !== 'number' || !isFinite(boid.x) || !isFinite(boid.y)) {
              console.warn('[COLLISION] Invalid boid in onBoidHit callback:', boid);
              return;
            }
            
            // CRITICAL: Capture bird state BEFORE async operations!
            const hadDot = boid.hasDot;
            const targetDot = boid.targetDot;
            const boidX = boid.x;
            const boidY = boid.y;
            const boidHue = boid.hue;
            
            // Check if it's a boss bird (special case like shooters)
            if (boid instanceof BossBird) {
              const bossBird = boid as BossBird;
              const destroyed = bossBird.takeDamage();
              
              // CRITICAL: Boss shield should split asteroids like a laser!
              // This is handled in the collision processing phase now
              
              if (destroyed) {
                // Boss destroyed - big explosion
                this.particleSystem.createExplosion(boidX, boidY, 0xFF00FF, 30);
                this.particleSystem.createBirdExplosion(boidX, boidY, 0xFF00FF, 0, 0);
                scoringSystem.addEvent(ScoringEvent.BOSS_DEFEATED);
                
                // If boss had a dot, make it fall
                if (hadDot && targetDot) {
                  this.createFallingDot(boidX, boidY, targetDot);
                }
                return true; // Destroy the boss
              } else {
                // Boss damaged but not destroyed
                this.particleSystem.createExplosion(boidX, boidY, 0xFFFF00, 10);
                scoringSystem.addEvent(ScoringEvent.BOSS_HIT);
                this.updateScoreDisplay();
                return false; // Don't destroy yet
              }
            }
            
            // If bird had a dot, make it fall IMMEDIATELY (before bird is destroyed)
            if (hadDot && targetDot) {
              // The dot WAS stolen by this bird, now it falls
              this.createFallingDot(boidX, boidY, targetDot);
              boid.targetDot = null;
              boid.hasDot = false;
            }
            
            // LIFETIME COMBO TRACKING - count this kill for the asteroid!
            if (asteroid) {
              // Increment the asteroid's lifetime kill count
              asteroid.killCount++;
              asteroid.lastKillTime = Date.now();
              
              // Track for scoring in this frame
              if (!asteroidKills.has(asteroid)) {
                asteroidKills.set(asteroid, { birds: [], score: 0 });
              }
              const kills = asteroidKills.get(asteroid)!;
              kills.birds.push(boid);
              
              // Calculate score for this kill (but don't add it yet)
              let scoreValue = 0;
              if (hadDot) {
                scoreValue = 120; // Triple points for birds with stolen energy dots
              } else if (boid.isShooter) {
                scoreValue = 80; // Double points for shooters
              } else if (boid.isSuperNavigator) {
                scoreValue = 80; // Double points for super navigators
              } else {
                scoreValue = 40; // Regular bird hit
              }
              kills.score += scoreValue;
              
              // SIMPLE COMBO: If asteroid has 2+ kills in its lifetime, show combo!
              if (asteroid.killCount >= 2) {
                console.log(`[LIFETIME COMBO] Asteroid has ${asteroid.killCount} total kills!`);
              }
            } else {
              // No asteroid (shouldn't happen), just add score normally
              let event: ScoringEvent;
              if (hadDot) {
                event = ScoringEvent.BIRD_WITH_ENERGY_HIT;
              } else if (boid.isShooter) {
                event = ScoringEvent.SHOOTER_HIT;
              } else if (boid.isSuperNavigator) {
                event = ScoringEvent.SUPER_NAVIGATOR_HIT;
              } else {
                event = ScoringEvent.BIRD_HIT;
              }
              scoringSystem.addEvent(event);
              this.updateScoreDisplay();
            }
            
            // Deferred visual effects - won't freeze!
            requestAnimationFrame(() => {
              try {
                // Use the new spaceship explosion animation
                // Note: boid might be destroyed already, so we use captured values
                this.particleSystem.createExplosion(boidX, boidY, boidHue, 15);
                this.particleSystem.createBirdExplosion(boidX, boidY, boidHue, 0, 0);
                // NO annoying crash lines - just the explosions are enough!
              } catch (e) {
                console.error('[VISUAL EFFECT ERROR]:', e);
              }
            });
            
            // CRITICAL FIX: Return true to destroy the bird!
            return true;
          },
          onAsteroidHit: (asteroid) => {
            try {
              // SAFE: Validate asteroid before processing
              if (!asteroid || typeof asteroid.size !== 'number' || !isFinite(asteroid.size)) {
                console.warn('[COLLISION] Invalid asteroid in onAsteroidHit callback:', asteroid);
                return true; // Destroy invalid asteroids
              }
              
              if (asteroid.size < 10) {
                return true; // Destroy
              }
              
              const newSize = asteroid.size * 0.8;
              if (!isFinite(newSize) || newSize <= 0) {
                return true; // Destroy if size calculation failed
              }
              
              asteroid.size = newSize;
              
              // SAFE: Try to update size, destroy if it fails
              try {
                asteroid.updateSize();
                return false; // Keep
              } catch (updateError) {
                console.error('[ASTEROID UPDATE ERROR]:', updateError);
                return true; // Destroy if update failed
              }
            } catch (e) {
              console.error('[ASTEROID HIT ERROR]:', e);
              return true; // Destroy on error
            }
          }
        }
      );
      
      // Add new asteroid fragments from projectile hits
      if (newFragments && newFragments.length > 0) {
        this.asteroids.push(...newFragments);
      }
      
      // LIFETIME COMBO LOGIC - show combo based on asteroid's total kills!
      for (const [asteroid, kills] of asteroidKills) {
        const frameKillCount = kills.birds.length;
        
        if (frameKillCount > 0) {
          // Add score for each kill
          for (const bird of kills.birds) {
            let event: ScoringEvent;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((bird as any).isShredder) {
              event = ScoringEvent.SHREDDER_DESTROYED;
            } else if (bird.hasDot) {
              event = ScoringEvent.BIRD_WITH_ENERGY_HIT;
            } else if (bird.isShooter) {
              event = ScoringEvent.SHOOTER_HIT;
            } else if (bird.isSuperNavigator) {
              event = ScoringEvent.SUPER_NAVIGATOR_HIT;
            } else {
              event = ScoringEvent.BIRD_HIT;
            }
            scoringSystem.addEvent(event);
          }
          
          // Check LIFETIME kills for combo display!
          const lifetimeKills = asteroid.killCount;
          
          // Show combo when asteroid reaches 2, 3, 4+ lifetime kills
          if (lifetimeKills >= 2) {
            // Position at the latest kill location
            const avgX = kills.birds.reduce((sum, b) => sum + b.x, 0) / frameKillCount;
            const avgY = kills.birds.reduce((sum, b) => sum + b.y, 0) / frameKillCount;
            
            // Display combo based on LIFETIME kills!
            this.comboEffects.createComboDisplay(
              lifetimeKills,  // Use lifetime kill count!
              avgX,
              avgY,
              1.0
            );
            
            console.log(`[LIFETIME COMBO] ${lifetimeKills}x combo! Asteroid has destroyed ${lifetimeKills} enemies total!`);
          }
        }
      }
      this.updateScoreDisplay();
      
      // End collision performance tracking  
      if (this.debug) {
        this.collisionDebugger.mark('collisions_done');
        this.collisionDebugger.endFrame();
        
        // Log stats every 60 frames
        if (this.frameCount % 60 === 0) {
          const stats = this.collisionSystem.getStats();
          console.log('[COLLISION STATS]:', stats);
        }
      }
    } catch (collisionError) {
      console.error('[CRITICAL COLLISION ERROR]:', collisionError);
      console.error('Stack trace:', (collisionError as Error).stack);
      
      // Emergency cleanup to prevent freeze
      if (this.debug) {
        console.warn('[EMERGENCY] Clearing some entities to prevent freeze');
        // Remove oldest asteroids if too many
        if (this.asteroids.length > ENTITY_LIMITS.ASTEROIDS.MAX_PER_FRAME) {
          const toRemove = this.asteroids.splice(0, 5);
          toRemove.forEach(ast => ast.destroy());
        }
      }
    }
    
    // Update falling dots - SAFE: Process all first, then remove marked ones
    const fallingDotsToRemove: number[] = [];
    
    for (let i = 0; i < this.fallingDots.length; i++) {
      const dot = this.fallingDots[i];
      if (!dot || dot.toRemove) {
        fallingDotsToRemove.push(i);
        continue;
      }
      // Apply physics - 75% of bird speed
      const birdSpeed = GameConfig.BASE_SPEED * this.waveManager.getSpeedMultiplier();
      const maxFallSpeed = birdSpeed * 0.75; // Cap at 75% of bird speed
      
      dot.vy += PHYSICS.GRAVITY.BASE * dt; // Very gentle gravity
      if (dot.vy > maxFallSpeed) {
        dot.vy = maxFallSpeed; // Cap fall speed
      }
      dot.vx *= PHYSICS.FRICTION.AIR_RESISTANCE; // Air resistance
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
      
      // DRY: Draw falling dot EXACTLY like original energy dot!
      const color = hueToRGB(dot.originalDot.hue);
      
      // Pulsing animation - same as original!
      const pulse = Math.sin(performance.now() / 1000 * 5 + dot.pulsePhase) * 
        (SIZES.ENERGY_DOT.PULSE_MAX_SCALE - SIZES.ENERGY_DOT.PULSE_MIN_SCALE) / 2 + 
        (SIZES.ENERGY_DOT.PULSE_MIN_SCALE + SIZES.ENERGY_DOT.PULSE_MAX_SCALE) / 2;
      
      // Draw glow - EXACT same as original
      dot.glowSprite.clear();
      dot.glowSprite.circle(dot.x, dot.y, SIZES.ENERGY_DOT.RADIUS * SIZES.ENERGY_DOT.GLOW_RADIUS_MULTIPLIER * pulse);
      dot.glowSprite.fill({ color, alpha: VISUALS.ALPHA.LOW * pulse });
      
      // Draw main dot - EXACT same as original
      dot.sprite.clear();
      dot.sprite.circle(dot.x, dot.y, SIZES.ENERGY_DOT.RADIUS * pulse);
      dot.sprite.fill({ color, alpha: VISUALS.ALPHA.FULL });
      
      // White core - EXACT same as original
      dot.sprite.circle(dot.x, dot.y, SIZES.ENERGY_DOT.RADIUS * 0.3);
      dot.sprite.fill({ color: VISUALS.COLORS.WHITE, alpha: VISUALS.ALPHA.FULL });
      
      // Update trail positions
      dot.trailPositions.unshift({ x: dot.x, y: dot.y });
      if (dot.trailPositions.length > 5) {
        dot.trailPositions.pop();
      }
      
      // Draw glowing trail
      dot.trail.forEach((segment, i) => {
        segment.clear();
        if (i < dot.trailPositions.length) {
          const pos = dot.trailPositions[i];
          const size = GameConfig.ENERGY_RADIUS * (1 - i * 0.15);
          const color = dot.originalDot.hue;
          
          // Outer glow
          segment.circle(pos.x, pos.y, size * 1.5);
          segment.fill({ color, alpha: 0.1 * (1 - i / 5) });
          
          // Inner core
          segment.circle(pos.x, pos.y, size);
          segment.fill({ color, alpha: 0.3 * (1 - i / 5) });
        }
      });
      
      // Check if birds can catch falling dot
      let caught = false;
      for (const boid of this.boids) {
        if (!boid.hasDot && boid.alive) {
          // CRITICAL FIX: Safety check before Math.hypot to prevent NaN/freeze
          if (!isFinite(boid.x) || !isFinite(boid.y) || !isFinite(dot.x) || !isFinite(dot.y)) {
            console.warn('[FALLING DOT] Invalid positions in boid catch, skipping');
            continue;
          }
          
          const dist = Math.hypot(boid.x - dot.x, boid.y - dot.y);
          
          // SAFETY: Validate distance result
          if (!isFinite(dist)) {
            console.warn('[FALLING DOT] Invalid distance in boid catch');
            continue;
          }
          
          if (dist < SIZES.BIRD.BASE + SIZES.ENERGY_DOT.RADIUS) {
            // Bird catches falling dot! CRITICAL: Ensure state consistency
            boid.hasDot = true;
            boid.targetDot = dot.originalDot;
            
            // CRITICAL FIX: Only steal if not already stolen
            // Prevents double-steal which causes zombie dots
            if (!dot.originalDot.stolen) {
              dot.originalDot.steal();
            }
            
            this.particleSystem.createPickup(dot.x, dot.y, dot.originalDot.hue);
            
            // Remove falling dot and trail safely
            if (dot.sprite.parent) {
              this.app.stage.removeChild(dot.sprite);
            }
            if (!dot.sprite.destroyed) {
              dot.sprite.destroy();
            }
            if (dot.glowSprite.parent) {
              this.app.stage.removeChild(dot.glowSprite);
            }
            if (!dot.glowSprite.destroyed) {
              dot.glowSprite.destroy();
            }
            dot.trail.forEach(t => {
              if (t.parent) {
                this.app.stage.removeChild(t);
              }
              if (!t.destroyed) {
                t.destroy();
              }
            });
            fallingDotsToRemove.push(i);
            caught = true;
            break;
          }
        }
      }
      
      if (caught) continue;
      
      // Check if dot reached bottom
      const targetY = this.app.screen.height * GameConfig.BASE_Y;
      if (dot.y >= targetY - 10) {
        // Restore the energy dot
        dot.originalDot.restore();
        this.particleSystem.createPickup(dot.x, targetY, dot.originalDot.hue);
        
        // Remove falling dot and trail safely
        if (dot.sprite.parent) {
          this.app.stage.removeChild(dot.sprite);
        }
        if (!dot.sprite.destroyed) {
          dot.sprite.destroy();
        }
        if (dot.glowSprite.parent) {
          this.app.stage.removeChild(dot.glowSprite);
        }
        if (!dot.glowSprite.destroyed) {
          dot.glowSprite.destroy();
        }
        dot.trail.forEach(t => {
          if (t.parent) {
            this.app.stage.removeChild(t);
          }
          if (!t.destroyed) {
            t.destroy();
          }
        });
        fallingDotsToRemove.push(i);
        continue;
      }
      
      // Remove if off-screen
      if (dot.y > this.app.screen.height + 100) {
        if (dot.sprite.parent) {
          this.app.stage.removeChild(dot.sprite);
        }
        if (!dot.sprite.destroyed) {
          dot.sprite.destroy();
        }
        if (dot.glowSprite.parent) {
          this.app.stage.removeChild(dot.glowSprite);
        }
        if (!dot.glowSprite.destroyed) {
          dot.glowSprite.destroy();
        }
        fallingDotsToRemove.push(i);
        continue;
      }
    }
    
    // SAFE: Remove falling dots in reverse order to maintain indices
    for (let i = fallingDotsToRemove.length - 1; i >= 0; i--) {
      const index = fallingDotsToRemove[i];
      if (this.fallingDots[index]) {
        this.fallingDots.splice(index, 1);
      }
    }
    
    // Update particles - SAFE: Wrap in try-catch to prevent graphics freezes
    try {
      this.particleSystem.update(dt);
    } catch (particleError) {
      console.error('[PARTICLE SYSTEM ERROR]:', particleError);
      console.error('Stack trace:', (particleError as Error).stack);
      
      // Try to recover by creating new particle system
      try {
        this.particleSystem = new ParticleSystem(this.app);
        console.warn('[RECOVERY] Created new particle system after error');
      } catch (recoveryError) {
        console.error('[CRITICAL] Failed to recover particle system:', recoveryError);
      }
    }
    
    // Update combo timer in scoring system
    scoringSystem.updateComboTimer(dt * 1000);
    
    // Update combo effects (screen shake, animations, etc.)
    if (this.comboEffects) {
      this.comboEffects.update(dt);
    }
    
    // Update dev mode display
    if (this.devModeDisplay) {
      this.devModeDisplay.update(dt);
    }
    
    // Run autopilot if enabled
    this.runAutopilot(dt);
    
    // KISS: Wave ends when ALL birds are gone and none left to spawn
    // Simple rule: No birds = next wave
    if (this.waveManager.shouldCompleteWave(this.boids.length)) {
      this.waveManager.completeWave();
      this.updateScoreDisplay();
    }
    
    // Check if all dots are stolen - if so, pause respawn
    const availableDots = this.energyDots.filter(d => !d.stolen);
    const allDotsStolen = availableDots.length === 0;
    
    // Report critical energy status
    const birdsWithDots = this.boids.filter(b => b.hasDot).length;
    const criticalState = allDotsStolen && this.fallingDots.length === 0 && birdsWithDots === 0;
    this.onEnergyStatus?.(criticalState);
    
    // Only process respawn timers if not all dots are stolen
    if (!allDotsStolen) {
      // Process individual dot respawn timers
      this.dotRespawnTimers.forEach((timer, dotIndex) => {
        const newTimer = timer + dt * 1000;
        if (newTimer >= this.waveManager.getDotRespawnDelay()) {
          // Respawn this specific dot after 15 seconds
          const dot = this.energyDots[dotIndex];
          if (dot && dot.stolen) {
            dot.restore();
            console.log(`[GAME] Dot ${dotIndex} respawned after 15 seconds`);
            this.particleSystem.createPickup(dot.x, dot.y, dot.hue);
          }
          this.dotRespawnTimers.delete(dotIndex);
        } else {
          this.dotRespawnTimers.set(dotIndex, newTimer);
        }
      });
    }
    
    // PROPER GAME OVER CHECK: Game ends only when NO dots exist in any state
    // Energy dots can be in 4 states:
    // 1. Mine (visible below, not stolen)
    // 2. Stolen (carried by birds)
    // 3. Falling (slowly returning to position after bird killed)
    // 4. Removed (transformed to birds - these don't count)
    
    const dotsInPlayerControl = this.energyDots.filter(d => !d.stolen).length; // Mine
    const dotsStolen = this.boids.filter(b => b.hasDot).length; // Stolen by birds
    const dotsFalling = this.fallingDots.length; // Falling back down
    
    const totalDotsInPlay = dotsInPlayerControl + dotsStolen + dotsFalling;
    
    if (totalDotsInPlay === 0) {
      console.log('[GAME] GAME OVER - No energy dots remain in any state!');
      console.log(`  Mine: ${dotsInPlayerControl}, Stolen: ${dotsStolen}, Falling: ${dotsFalling}`);
      this.onGameOver?.();
      return;
    }
  };
  
  private updateScoreDisplay() {
    // Get current score info from scoring system
    const scoreInfo = scoringSystem.getScoreBreakdown();
    
    // DON'T CREATE COMBO DISPLAY HERE! 
    // Combo display is already handled properly in the collision processing
    // Creating it here causes multiple overlapping texts since this is called for EVERY score event
    
    // Update score display with combo info
    this.onScoreUpdate?.(scoreInfo.score, scoreInfo.combo, scoreInfo.multiplier);
  }
  
  private showNoPointsWarning() {
    // Create warning text effect - MOBILE RESPONSIVE!
    const screenWidth = this.app.screen.width;
    const isMobile = screenWidth < 768;
    
    // Limit font size for mobile visibility
    const maxFontSize = isMobile ? 40 : 60;
    const fontSize = Math.min(UI.FONTS.SIZES.LARGE, maxFontSize);
    
    const warningText = new PIXI.Text('NOT ENOUGH POINTS!', {
      fontFamily: UI.FONTS.PRIMARY,
      fontSize: fontSize,
      fill: VISUALS.COLORS.NEON_RED,
      stroke: { color: VISUALS.COLORS.BLACK, width: VISUALS.STROKE.VERY_THICK },
      dropShadow: {
        color: VISUALS.COLORS.NEON_RED,
        blur: VISUALS.GLOW.BLUR_AMOUNT,
        distance: 2,
        angle: Math.PI / 4,
        alpha: VISUALS.ALPHA.HIGH
      }
    });
    
    warningText.anchor.set(0.5);
    warningText.x = this.app.screen.width / 2;
    warningText.y = this.app.screen.height * 0.5;
    this.app.stage.addChild(warningText);
    
    // Shake animation
    let shakeTime = 0;
    let animationFrames = 0;
    const maxFrames = 60; // 1 second at 60fps
    
    const ticker = () => {
      animationFrames++;
      
      if (!warningText || warningText.destroyed || animationFrames > maxFrames) {
        try {
          this.app.ticker.remove(ticker);
          if (warningText && !warningText.destroyed) {
            warningText.destroy();
          }
        } catch (cleanupError) {
          console.error('[WARNING TEXT CLEANUP ERROR]:', cleanupError);
        }
        return;
      }
      
      try {
        shakeTime += 0.3;
        warningText.x = this.app.screen.width / 2 + Math.sin(shakeTime) * 10;
        warningText.alpha = 1 - (animationFrames / maxFrames);
        
        if (animationFrames >= maxFrames) {
          this.app.ticker.remove(ticker);
          if (!warningText.destroyed) {
            warningText.destroy();
          }
        }
      } catch (animationError) {
        console.error('[WARNING TEXT ANIMATION ERROR]:', animationError);
        try {
          this.app.ticker.remove(ticker);
          if (warningText && !warningText.destroyed) {
            warningText.destroy();
          }
        } catch (emergencyError) {
          console.error('[WARNING TEXT EMERGENCY CLEANUP ERROR]:', emergencyError);
        }
      }
    };
    
    try {
      this.app.ticker.add(ticker);
    } catch (addError) {
      console.error('[WARNING TEXT ADD TICKER ERROR]:', addError);
      if (warningText && !warningText.destroyed) {
        warningText.destroy();
      }
    }
  }
  
  private handleResize = () => {
    if (!this.app) return;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.backgroundRenderer.drawGrid();
    this.spawnEnergyDots();
  };
  
  public start() {
    if (!this.initialized) {
      console.warn('[NEON FLOCK] Engine not initialized yet');
      return;
    }
    this.app.start();
  }
  
  // Autopilot mode for testing
  public enableAutopilot() {
    this.autopilotEnabled = true;
    console.log('[AUTOPILOT] Enabled - will automatically shoot at birds');
  }
  
  public disableAutopilot() {
    this.autopilotEnabled = false;
    console.log('[AUTOPILOT] Disabled');
  }
  
  public isAutopilotEnabled(): boolean {
    return this.autopilotEnabled;
  }
  
  private runAutopilot(_dt: number) {
    if (!this.autopilotEnabled) return;
    
    // Shoot every 200ms if there are birds (more aggressive)
    const now = Date.now();
    if (now - this.lastAutopilotShot < 200) return;
    
    if (this.boids.length > 0) {
      // Find closest bird to any energy dot
      let closestBird: Boid | null = null;
      let minDistance = Infinity;
      
      for (const bird of this.boids) {
        for (const dot of this.energyDots) {
          if (!dot.stolen) {
            const dx = bird.x - dot.x;
            const dy = bird.y - dot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDistance) {
              minDistance = dist;
              closestBird = bird;
            }
          }
        }
      }
      
      if (closestBird) {
        // Shoot asteroid at the bird with prediction
        const power = 1.0; // Always full power for testing
        const startX = this.app.screen.width / 2;
        const startY = this.app.screen.height - 100;
        
        // Predict where bird will be (simple lead calculation)
        const timeToHit = 0.3; // Estimate time to hit
        const predictedX = closestBird.x + closestBird.vx * timeToHit;
        const predictedY = closestBird.y + closestBird.vy * timeToHit;
        
        // Calculate trajectory to hit predicted position
        const dx = predictedX - startX;
        const dy = predictedY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const vx = (dx / distance) * power * 600; // Faster projectiles
        const vy = (dy / distance) * power * 600;
        
        const asteroid = new Asteroid(this.app, startX, startY, vx, vy, power);
        this.asteroids.push(asteroid);
        
        this.lastAutopilotShot = now;
        console.log(`[AUTOPILOT] Shot at bird - Wave ${this.waveManager.getWave()}, Birds: ${this.boids.length}`);
      }
    }
  }
  
  /**
   * Get current game state for saving (KISS: just the essentials)
   */
  public getGameStateForSave(): { 
    stolenDots: number[];
  } {
    // Get which dots are stolen (by index)
    const stolenDots: number[] = [];
    this.energyDots.forEach((dot, index) => {
      if (dot.stolen) {
        stolenDots.push(index);
      }
    });
    
    return {
      stolenDots  // That's all we need!
    };
  }
  
  /**
   * Restore game from saved state (KISS: restart wave with saved progress)
   */
  public restoreGameState(
    score: number,
    wave: number,
    stolenDots: number[]
  ): void {
    // Restore score
    scoringSystem.setScore(score);
    
    // KISS: Set wave and reset birds to FULL count for this wave
    this.waveManager.setWave(wave);
    const totalBirdsForWave = this.waveManager.getTotalBirdsForWave(wave);
    this.waveManager.setBirdsToSpawn(totalBirdsForWave); // FULL bird count!
    this.waveManager.setWaveDotsLost(stolenDots.length); // Dots lost = stolen dots count
    
    // Set spawn time to start spawning soon
    this.waveManager.setNextSpawnTime(performance.now() + 2000); // Start spawning in 2 seconds
    
    if (this.onWaveUpdate) {
      this.onWaveUpdate(wave);
    }
    
    // Update combo effects with current wave
    this.comboEffects.setWave(wave);
    
    // Clear existing entities
    this.boids.forEach(b => b.destroy());
    this.boids = [];
    this.energyDots.forEach(d => d.destroy());
    this.energyDots = [];
    
    // Restore energy dots in proper formation
    const spacing = this.app.screen.width / (GameConfig.ENERGY_COUNT + 1);
    for (let i = 0; i < GameConfig.ENERGY_COUNT; i++) {
      const hue = (360 / GameConfig.ENERGY_COUNT) * i;
      const dot = new EnergyDot(
        this.app,
        spacing * (i + 1),
        this.app.screen.height * GameConfig.BASE_Y,
        hue
      );
      
      // KEEP stolen dots status!
      if (stolenDots.includes(i)) {
        dot.stolen = true;
      }
      
      this.energyDots.push(dot);
    }
    
    // KISS: Don't spawn any birds initially - let wave manager handle it
    // Player gets a fresh start at the wave with their score/dots preserved
    
    console.log(`[ENGINE] KISS Restore - Wave ${wave}, Score ${score}, Birds to spawn: ${totalBirdsForWave}, Stolen dots: ${stolenDots.length}`);
  }
  
  public destroy() {
    if (!this.initialized) return;
    
    window.removeEventListener('resize', this.handleResize);
    this.app.ticker.stop();
    // Clean up super navigator memory
    this.boids.forEach(b => {
      if (b.isSuperNavigator) {
        this.superNavigatorAI.cleanupMemory(b);
      }
      b.destroy();
    });
    this.energyDots.forEach(d => d.destroy());
    this.asteroids.forEach(a => a.destroy());
    this.inputManager?.destroy();
    this.app.destroy(true);
    this.initialized = false;
  }
}