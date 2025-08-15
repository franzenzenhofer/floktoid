import * as PIXI from 'pixi.js';
import { Boid } from './entities/Boid';
import type { BirdProjectile } from './entities/BirdProjectile';
import { EnergyDot } from './entities/EnergyDot';
import { Asteroid } from './entities/Asteroid';
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

const { VISUALS, SIZES, TIMING, ENTITY_LIMITS, PHYSICS, FLOCKING, ERRORS, UI, GAME_CONSTANTS } = CentralConfig;

export class NeonFlockEngine {
  private app!: PIXI.Application;
  private debug = false;
  private frameCount = 0;
  
  private boids: Boid[] = [];
  private projectiles: BirdProjectile[] = [];
  private energyDots: EnergyDot[] = [];
  private asteroids: Asteroid[] = [];
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
  
  private wave = 1;
  private birdsToSpawn = 0;
  private nextSpawnTime = 0;
  private speedMultiplier = 1;
  private waveDotsLost = 0; // Track dots lost in current wave
  private dotRespawnTimers: Map<number, number> = new Map(); // Track individual dot respawn timers
  private DOT_RESPAWN_DELAY = TIMING.DOT_RESPAWN_DELAY_MS;
  
  public onScoreUpdate?: (score: number, combo: number, multiplier: number) => void;
  public onWaveUpdate?: (wave: number) => void;
  public onEnergyStatus?: (critical: boolean) => void;
  public onGameOver?: () => void;
  
  private gridOverlay!: PIXI.Graphics;
  private backgroundStars!: PIXI.Container;
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
      
      // Setup game
      this.setupBackground();
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
  
  private setupBackground() {
    // Neon grid
    this.gridOverlay = new PIXI.Graphics();
    this.drawGrid();
    this.app.stage.addChild(this.gridOverlay);
    
    // Animated stars
    this.backgroundStars = new PIXI.Container();
    for (let i = 0; i < VISUALS.STARS.COUNT; i++) {
      const star = new PIXI.Graphics();
      star.circle(0, 0, VISUALS.STARS.MIN_SIZE + Math.random() * (VISUALS.STARS.MAX_SIZE - VISUALS.STARS.MIN_SIZE));
      star.fill({ color: VISUALS.COLORS.WHITE, alpha: VISUALS.STARS.MIN_ALPHA + Math.random() * (VISUALS.STARS.MAX_ALPHA - VISUALS.STARS.MIN_ALPHA) });
      star.x = Math.random() * this.app.screen.width;
      star.y = Math.random() * this.app.screen.height;
      this.backgroundStars.addChild(star);
    }
    this.app.stage.addChild(this.backgroundStars);
  }
  
  private drawGrid() {
    const gridSize = VISUALS.GRID.SIZE;
    this.gridOverlay.clear();
    this.gridOverlay.stroke({ width: VISUALS.GRID.LINE_WIDTH, color: VISUALS.COLORS.NEON_CYAN, alpha: VISUALS.GRID.LINE_ALPHA });
    
    for (let x = 0; x < this.app.screen.width; x += gridSize) {
      this.gridOverlay.moveTo(x, 0);
      this.gridOverlay.lineTo(x, this.app.screen.height);
    }
    
    for (let y = 0; y < this.app.screen.height; y += gridSize) {
      this.gridOverlay.moveTo(0, y);
      this.gridOverlay.lineTo(this.app.screen.width, y);
    }
    
    // Energy zone glow
    const baseY = this.app.screen.height * GameConfig.BASE_Y;
    const gradient = new PIXI.Graphics();
    gradient.rect(0, baseY - 100, this.app.screen.width, 150);
    gradient.fill({ color: VISUALS.COLORS.NEON_CYAN, alpha: VISUALS.ALPHA.MINIMAL });
    gradient.rect(0, baseY + 50, this.app.screen.width, 100);
    gradient.fill({ color: VISUALS.COLORS.NEON_MAGENTA, alpha: VISUALS.ALPHA.MINIMAL });
    this.gridOverlay.addChild(gradient);
  }
  
  private initializeGame() {
    try {
      scoringSystem.reset(); // Reset scoring system
      this.spawnEnergyDots();
      this.startWave();
      
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
    const birdSpeed = GameConfig.BASE_SPEED * this.speedMultiplier;
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
  
  private startWave() {
    // Check for perfect wave from previous wave
    if (this.wave > 1 && this.waveDotsLost === 0) {
      scoringSystem.addEvent(ScoringEvent.PERFECT_WAVE);
      this.updateScoreDisplay();
    }
    
    // Reset wave tracking
    this.waveDotsLost = 0;
    
    // Use fixed sequence or calculate if beyond array
    const waveIndex = this.wave - 1;
    const count = waveIndex < GameConfig.BIRDS_PER_WAVE.length 
      ? GameConfig.BIRDS_PER_WAVE[waveIndex]
      : GameConfig.BIRDS_PER_WAVE[GameConfig.BIRDS_PER_WAVE.length - 1] + (waveIndex - GameConfig.BIRDS_PER_WAVE.length + 1) * 10;
    
    this.birdsToSpawn = count;
    this.speedMultiplier = Math.pow(GameConfig.SPEED_GROWTH, this.wave - 1);
    this.nextSpawnTime = 0;
    this.onWaveUpdate?.(this.wave);
  }
  
  public spawnBird(x?: number, y?: number) {
    try {
      const boid = new Boid(
        this.app,
        x ?? Math.random() * this.app.screen.width,
        y ?? -20,
        this.speedMultiplier
        // No initial velocity - let personality determine it
      );
      
      // Validate the boid is properly initialized
      if (boid && typeof boid.applyForces === 'function' && typeof boid.destroy === 'function') {
        this.boids.push(boid);
        
        // Dev mode spawn notifications
        if (this.devModeDisplay && this.devModeDisplay.isEnabled()) {
          if (boid.isSuperNavigator) {
            this.devModeDisplay.addSpawnMessage('super');
          }
          if (boid.isShooter) {
            this.devModeDisplay.addSpawnMessage('shooter');
          }
        }
      } else {
        console.error('[SPAWN ERROR] Invalid Boid instance in spawnBird!');
      }
    } catch (error) {
      console.error('[SPAWN ERROR] Failed to spawn bird:', error);
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
    const totalEntityCount = this.boids.length + this.asteroids.length + this.fallingDots.length;
    
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
    
    // Spawn birds
    if (this.birdsToSpawn > 0 && time > this.nextSpawnTime) {
      this.spawnBird();
      this.birdsToSpawn--;
      this.nextSpawnTime = time + 0.5;
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
          const burstCount = this.wave; // Dynamic: wave 1 = 1 bird, wave 10 = 10 birds, etc.
          console.log(`[GAME] Bird reached top on wave ${this.wave}! Spawning ${burstCount} birds...`);
          
          // Start respawn timer for this dot
          if (boid.targetDot) {
            const dotIndex = this.energyDots.indexOf(boid.targetDot);
            if (dotIndex >= 0) {
              this.dotRespawnTimers.set(dotIndex, 0);
              console.log(`[GAME] Starting ${TIMING.DOT_RESPAWN_DELAY_MS / 1000}s respawn timer for dot ${dotIndex}`);
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
          this.waveDotsLost++; // Track dots lost in this wave
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
            this.speedMultiplier,
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
    
    // Update asteroids
    this.asteroids = this.asteroids.filter(asteroid => {
      const keepAsteroid = asteroid.update(dt);
      if (!keepAsteroid || asteroid.isOffScreen(this.app.screen)) {
        asteroid.destroy();
        return false;
      }
      return true;
    });
    
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
          onBoidHit: (boid) => {
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
            
            // If bird had a dot, make it fall IMMEDIATELY (before bird is destroyed)
            if (hadDot && targetDot) {
              // The dot WAS stolen by this bird, now it falls
              this.createFallingDot(boidX, boidY, targetDot);
              boid.targetDot = null;
              boid.hasDot = false;
            }
            
            // Check if bird had energy for bonus points (do this sync too)
            const event = hadDot ? ScoringEvent.BIRD_WITH_ENERGY_HIT : ScoringEvent.BIRD_HIT;
            scoringSystem.addEvent(event);
            this.updateScoreDisplay();
            
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
      const birdSpeed = GameConfig.BASE_SPEED * this.speedMultiplier;
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
    
    // Check wave complete
    if (this.birdsToSpawn === 0 && this.boids.filter(b => !b.hasDot).length === 0) {
      scoringSystem.addEvent(ScoringEvent.WAVE_COMPLETE);
      this.updateScoreDisplay();
      this.wave++;
      this.startWave();
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
        if (newTimer >= this.DOT_RESPAWN_DELAY) {
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
    
    // Use new advanced combo effects system with game designer improvements
    if (scoreInfo.combo > 1) {
      const comboX = this.app.screen.width / 2;
      const comboY = this.app.screen.height * 0.25; // Higher up for better visibility
      
      // Update wave for combo threshold and create display
      this.comboEffects.setWave(this.wave);
      this.comboEffects.createComboDisplay(
        scoreInfo.combo,
        comboX,
        comboY,
        scoreInfo.multiplier
      );
    }
    
    // Update score display with combo info
    this.onScoreUpdate?.(scoreInfo.score, scoreInfo.combo, scoreInfo.multiplier);
  }
  
  private showNoPointsWarning() {
    // Create warning text effect
    const warningText = new PIXI.Text('NOT ENOUGH POINTS!', {
      fontFamily: UI.FONTS.PRIMARY,
      fontSize: UI.FONTS.SIZES.LARGE,
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
    this.drawGrid();
    this.spawnEnergyDots();
  };
  
  public start() {
    if (!this.initialized) {
      console.warn('[NEON FLOCK] Engine not initialized yet');
      return;
    }
    this.app.start();
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