import * as PIXI from 'pixi.js';
import { Boid } from './entities/Boid';
import { EnergyDot } from './entities/EnergyDot';
import { Asteroid } from './entities/Asteroid';
import { ParticleSystem } from './systems/ParticleSystem';
import { FlockingSystem } from './systems/FlockingSystem';
import { InputManager } from './systems/InputManager';
import { SafeCollisionSystem } from './systems/SafeCollisionSystem';
import { CollisionDebugger } from './systems/CollisionDebugger';
import { CollisionEffects } from './effects/CollisionEffects';
import { GameConfig } from './GameConfig';
import CentralConfig from './CentralConfig';
import { scoringSystem, ScoringEvent } from './ScoringSystem';

const { VISUALS, SIZES, TIMING, ENTITY_LIMITS, PHYSICS, FLOCKING, ERRORS, UI, GAME_CONSTANTS } = CentralConfig;

export class NeonFlockEngine {
  private app!: PIXI.Application;
  private debug = false;
  private frameCount = 0;
  
  private boids: Boid[] = [];
  private energyDots: EnergyDot[] = [];
  private asteroids: Asteroid[] = [];
  private fallingDots: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    targetSlot: number;
    sprite: PIXI.Graphics;
    originalDot: EnergyDot;
    trail: PIXI.Graphics[];
    trailPositions: { x: number, y: number }[];
    toRemove?: boolean;
  }> = [];
  private deferredBirdSpawns: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  
  private particleSystem!: ParticleSystem;
  private flockingSystem!: FlockingSystem;
  private inputManager!: InputManager;
  private collisionSystem!: SafeCollisionSystem;
  private collisionDebugger!: CollisionDebugger;
  private collisionEffects!: CollisionEffects;
  
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
      this.collisionSystem = new SafeCollisionSystem();
      this.collisionDebugger = new CollisionDebugger();
      this.collisionEffects = new CollisionEffects(this.app);
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
      const safeGameLoop = (ticker: PIXI.Ticker) => {
        try {
          this.gameLoop(ticker.deltaTime);
        } catch (gameLoopError) {
          console.error('[CRITICAL GAME LOOP ERROR]:', gameLoopError);
          console.error('Stack trace:', (gameLoopError as Error).stack);
          
          // Try to continue with reduced functionality
          try {
            this.onGameOver?.();
          } catch (gameOverError) {
            console.error('[GAME OVER ERROR]:', gameOverError);
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
    const sprite = new PIXI.Graphics();
    const targetSlot = this.energyDots.indexOf(originalDot);
    const targetX = (this.app.screen.width / (GameConfig.ENERGY_COUNT + 1)) * (targetSlot + 1);
    const targetY = this.app.screen.height * GameConfig.BASE_Y;
    
    // Calculate initial velocity toward target with some randomness
    const dx = targetX - x;
    const angle = Math.atan2(targetY - y, dx);
    
    sprite.circle(0, 0, GameConfig.ENERGY_RADIUS);
    sprite.fill({ color: originalDot.hue, alpha: 1 });
    this.app.stage.addChild(sprite);
    
    // Ultra slow falling speed - 10% of bird speed
    const birdSpeed = GameConfig.BASE_SPEED * this.speedMultiplier;
    const fallSpeed = birdSpeed * 0.1; // Only 10% of bird speed
    
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
      vy: fallSpeed, // Ultra slow fall speed
      targetSlot,
      sprite,
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
        // Flocking behavior - now with falling dot awareness!
        const forces = this.flockingSystem.calculateForces(
          boid,
          this.boids,
          this.energyDots,
          this.asteroids,
          this.fallingDots
        );
        boid.applyForces(forces, dt);
        
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
            
            // Create pickup effect
            this.particleSystem.createPickup(fallingDot.x, fallingDot.y, 120);
            
            // Remove the falling dot's sprite safely
            if (fallingDot.sprite.parent) {
              this.app.stage.removeChild(fallingDot.sprite);
            }
            if (!fallingDot.sprite.destroyed) {
              fallingDot.sprite.destroy();
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
      
      // Use new safe collision system
      this.collisionSystem.handleCollisions(
        this.boids,
        this.asteroids,
        this.energyDots,
        {
          onBoidHit: (boid) => {
            // SAFE: Validate boid before processing
            if (!boid || typeof boid.x !== 'number' || typeof boid.y !== 'number' || !isFinite(boid.x) || !isFinite(boid.y)) {
              console.warn('[COLLISION] Invalid boid in onBoidHit callback:', boid);
              return;
            }
            
            // Deferred visual effects - won't freeze!
            requestAnimationFrame(() => {
              try {
                // Double-check boid still valid after async delay
                if (!boid || !boid.alive || !isFinite(boid.x) || !isFinite(boid.y)) {
                  return;
                }
                
                // Add crash lines animation showing bird was hit
                this.collisionEffects.createCrashLines(boid.x, boid.y, boid.hue);
                // Simple particle explosion too
                this.particleSystem.createExplosion(boid.x, boid.y, boid.hue, 10);
                // Check if bird had energy for bonus points
                const event = boid.hasDot ? ScoringEvent.BIRD_WITH_ENERGY_HIT : ScoringEvent.BIRD_HIT;
                scoringSystem.addEvent(event);
                this.updateScoreDisplay();
                
                // If bird had a dot, make it fall
                if (boid.hasDot && boid.targetDot && !boid.targetDot.stolen) {
                  this.createFallingDot(boid.x, boid.y, boid.targetDot);
                  boid.targetDot = null;
                }
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
      // Apply physics with ultra slow fall
      const birdSpeed = GameConfig.BASE_SPEED * this.speedMultiplier;
      const maxFallSpeed = birdSpeed * 0.1; // Cap at 10% of bird speed
      
      dot.vy += PHYSICS.GRAVITY.BASE * dt; // Very gentle gravity
      if (dot.vy > maxFallSpeed) {
        dot.vy = maxFallSpeed; // Cap fall speed
      }
      dot.vx *= PHYSICS.FRICTION.AIR_RESISTANCE; // Air resistance
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
      
      // Update visual
      dot.sprite.x = dot.x;
      dot.sprite.y = dot.y;
      
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
            // Bird catches falling dot!
            boid.hasDot = true;
            boid.targetDot = dot.originalDot;
            this.particleSystem.createPickup(dot.x, dot.y, dot.originalDot.hue);
            
            // Remove falling dot and trail safely
            if (dot.sprite.parent) {
              this.app.stage.removeChild(dot.sprite);
            }
            if (!dot.sprite.destroyed) {
              dot.sprite.destroy();
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
    
    // SIMPLE GAME OVER CHECK: Game ends when ALL energy dots are stolen (no visible dots below)
    const visibleDots = this.energyDots.filter(d => !d.stolen);
    
    if (visibleDots.length === 0) {
      console.log('[GAME] GAME OVER - All energy dots stolen! No dots visible below!');
      this.onGameOver?.();
      return;
    }
  };
  
  private updateScoreDisplay() {
    // Get current score info from scoring system
    const scoreInfo = scoringSystem.getScoreBreakdown();
    
    // Visual feedback for combo
    if (scoreInfo.combo > 1) {
      // Create combo text effect
      const comboText = new PIXI.Text(`COMBO x${scoreInfo.combo}!`, {
        fontFamily: UI.FONTS.PRIMARY,
        fontSize: UI.FONTS.SIZES.LARGE + scoreInfo.combo * 2,
        fill: [VISUALS.COLORS.NEON_CYAN, VISUALS.COLORS.NEON_MAGENTA],
        stroke: { color: VISUALS.COLORS.BLACK, width: VISUALS.STROKE.VERY_THICK },
        dropShadow: {
          color: VISUALS.COLORS.NEON_CYAN,
          blur: VISUALS.GLOW.BLUR_AMOUNT,
          distance: 2,
          angle: Math.PI / 4,
          alpha: VISUALS.ALPHA.HIGH
        }
      });
      
      comboText.anchor.set(0.5);
      comboText.x = this.app.screen.width / 2;
      comboText.y = this.app.screen.height * 0.3;
      this.app.stage.addChild(comboText);
      
      // Animate and remove safely
      let alpha = VISUALS.ALPHA.FULL;
      let scale = 1;
      let animationFrames = 0;
      const maxFrames = 100;
      
      const ticker = () => {
        animationFrames++;
        
        if (!comboText || comboText.destroyed || animationFrames > maxFrames) {
          try {
            this.app.ticker.remove(ticker);
            if (comboText && !comboText.destroyed) {
              comboText.destroy();
            }
          } catch (cleanupError) {
            console.error('[COMBO TEXT CLEANUP ERROR]:', cleanupError);
          }
          return;
        }
        
        try {
          alpha -= VISUALS.TRAIL.FADE_RATE;
          scale += 0.01;
          comboText.alpha = alpha;
          comboText.scale.set(scale);
          comboText.y -= 2;
          
          if (alpha <= 0) {
            this.app.ticker.remove(ticker);
            if (!comboText.destroyed) {
              comboText.destroy();
            }
          }
        } catch (animationError) {
          console.error('[COMBO TEXT ANIMATION ERROR]:', animationError);
          try {
            this.app.ticker.remove(ticker);
            if (comboText && !comboText.destroyed) {
              comboText.destroy();
            }
          } catch (emergencyError) {
            console.error('[COMBO TEXT EMERGENCY CLEANUP ERROR]:', emergencyError);
          }
        }
      };
      
      try {
        this.app.ticker.add(ticker);
      } catch (addError) {
        console.error('[COMBO TEXT ADD TICKER ERROR]:', addError);
        if (comboText && !comboText.destroyed) {
          comboText.destroy();
        }
      }
      
      // Show additional combo feedback
      const comboX = this.app.screen.width / 2;
      const comboY = this.app.screen.height * 0.3;
      this.particleSystem.createComboText(comboX, comboY, `${scoreInfo.combo}x COMBO!`, scoreInfo.multiplier);
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
    this.boids.forEach(b => b.destroy());
    this.energyDots.forEach(d => d.destroy());
    this.asteroids.forEach(a => a.destroy());
    this.inputManager?.destroy();
    this.app.destroy(true);
    this.initialized = false;
  }
}