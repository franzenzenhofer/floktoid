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
  }> = [];
  private deferredBirdSpawns: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  
  private particleSystem!: ParticleSystem;
  private flockingSystem!: FlockingSystem;
  private inputManager!: InputManager;
  private collisionSystem!: SafeCollisionSystem;
  private collisionDebugger!: CollisionDebugger;
  private collisionEffects!: CollisionEffects;
  
  private score = 0;
  private wave = 1;
  private birdsToSpawn = 0;
  private nextSpawnTime = 0;
  private speedMultiplier = 1;
  private comboCount = 0;
  private comboTimer = 0;
  private COMBO_WINDOW = 2000; // 2 seconds to maintain combo
  private dotRespawnTimers: Map<number, number> = new Map(); // Track individual dot respawn timers
  private DOT_RESPAWN_DELAY = 15000; // 15 seconds per dot respawn
  
  public onScoreUpdate?: (score: number) => void;
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
      
      // Initialize with settings
      await this.app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        background: '#000000',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
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
      console.error('[NEON FLOCK] Failed to initialize engine:', error);
      throw error;
    }
  }
  
  private setupBackground() {
    // Neon grid
    this.gridOverlay = new PIXI.Graphics();
    this.drawGrid();
    this.app.stage.addChild(this.gridOverlay);
    
    // Animated stars
    this.backgroundStars = new PIXI.Container();
    for (let i = 0; i < 100; i++) {
      const star = new PIXI.Graphics();
      star.circle(0, 0, Math.random() * 2);
      star.fill({ color: 0xffffff, alpha: Math.random() * 0.5 });
      star.x = Math.random() * this.app.screen.width;
      star.y = Math.random() * this.app.screen.height;
      this.backgroundStars.addChild(star);
    }
    this.app.stage.addChild(this.backgroundStars);
  }
  
  private drawGrid() {
    const gridSize = 50;
    this.gridOverlay.clear();
    this.gridOverlay.stroke({ width: 1, color: 0x00ffff, alpha: 0.1 });
    
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
    gradient.fill({ color: 0x00ffff, alpha: 0.05 });
    gradient.rect(0, baseY + 50, this.app.screen.width, 100);
    gradient.fill({ color: 0xff00ff, alpha: 0.05 });
    this.gridOverlay.addChild(gradient);
  }
  
  private initializeGame() {
    this.spawnEnergyDots();
    this.startWave();
    this.app.ticker.add(() => this.gameLoop(this.app.ticker.deltaTime));
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
    const boid = new Boid(
      this.app,
      x ?? Math.random() * this.app.screen.width,
      y ?? -20,
      this.speedMultiplier
    );
    this.boids.push(boid);
  }
  
  public launchAsteroid(
    startX: number, 
    startY: number, 
    targetX: number, 
    targetY: number, 
    size: number, 
    slownessFactor = 1,
    shapeData?: { vertices: number[], roughness: number[] } | null
  ) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 20) {
      const speed = Math.min(dist * 3, GameConfig.AST_SPEED) * slownessFactor;
      const asteroid = new Asteroid(
        this.app,
        startX,
        startY,
        (dx / dist) * speed,
        (dy / dist) * speed,
        size,
        shapeData || undefined
      );
      this.asteroids.push(asteroid);
      
      // No launch effect - clean launch
    }
  }
  
  private gameLoop = (delta: number) => {
    if (!this.initialized) return;
    
    this.frameCount++;
    
    const dt = delta / 60; // Convert to seconds at 60fps
    const time = performance.now() / 1000;
    
    // Spawn birds
    if (this.birdsToSpawn > 0 && time > this.nextSpawnTime) {
      this.spawnBird();
      this.birdsToSpawn--;
      this.nextSpawnTime = time + 0.5;
    }
    
    // Update boids
    this.boids.forEach((boid, i) => {
      if (!boid.alive) return;
      
      if (boid.hasDot) {
        // Carrying dot to top
        boid.moveToTop(dt);
        
        if (boid.y < 20) {
          // Reached top - spawn burst
          const burstCount = this.wave; // Dynamic: wave 1 = 1 bird, wave 10 = 10 birds, etc.
          console.log(`[GAME] Bird reached top on wave ${this.wave}! Spawning ${burstCount} birds...`);
          
          // Start 15-second respawn timer for this dot
          if (boid.targetDot) {
            const dotIndex = this.energyDots.indexOf(boid.targetDot);
            if (dotIndex >= 0) {
              this.dotRespawnTimers.set(dotIndex, 0);
              console.log(`[GAME] Starting 15s respawn timer for dot ${dotIndex}`);
            }
            boid.targetDot = null;
          }
          
          // DEFER bird spawning to prevent array mutation during iteration
          for (let j = 0; j < burstCount; j++) {
            const angle = (j / burstCount) * Math.PI * 2;
            this.deferredBirdSpawns.push({
              x: boid.x,
              y: boid.y,
              vx: Math.cos(angle) * 150,
              vy: Math.sin(angle) * 150
            });
          }
          
          // Visual feedback - more particles for higher waves
          this.particleSystem.createExplosion(boid.x, boid.y, 0xff00ff, 20 + burstCount);
          
          // Penalty for letting bird reach top
          this.updateScore(-GameConfig.SCORE_DOT_SAVED);
          
          // Remove the original bird
          boid.destroy();
          this.boids.splice(i, 1);
          return;
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
        
        // Check if bird can catch a falling dot
        for (let j = this.fallingDots.length - 1; j >= 0; j--) {
          const fallingDot = this.fallingDots[j];
          const dist = Math.hypot(fallingDot.x - boid.x, fallingDot.y - boid.y);
          
          // Bird catches falling dot if close enough
          if (dist < 30 && !boid.hasDot) {
            // Bird catches the falling dot!
            boid.hasDot = true;
            
            // Create pickup effect
            this.particleSystem.createPickup(fallingDot.x, fallingDot.y, 120);
            
            // Remove the falling dot's sprite
            this.app.stage.removeChild(fallingDot.sprite);
            fallingDot.sprite.destroy();
            
            // Remove from falling dots array
            this.fallingDots.splice(j, 1);
            
            // Bonus points for catching a falling dot!
            this.updateScore(GameConfig.SCORE_DOT_SAVED);
            break;
          }
        }
      }
      
      boid.update(dt);
    });
    
    // Process deferred bird spawns AFTER boid iteration is complete
    if (this.deferredBirdSpawns.length > 0) {
      const maxNewBirds = 50; // Safety limit to prevent performance issues
      const maxTotalBirds = 200; // Maximum total birds to prevent performance issues
      const currentBirdCount = this.boids.filter(b => b.alive).length;
      const availableSlots = Math.max(0, maxTotalBirds - currentBirdCount);
      const spawnsToProcess = Math.min(this.deferredBirdSpawns.length, maxNewBirds, availableSlots);
      
      if (this.debug) {
        console.log(`[SPAWN] Processing ${spawnsToProcess} deferred bird spawns (current: ${currentBirdCount}, max: ${maxTotalBirds})`);
      }
      
      if (spawnsToProcess === 0 && this.deferredBirdSpawns.length > 0) {
        console.warn(`[SPAWN] Bird limit reached (${currentBirdCount}/${maxTotalBirds}), discarding ${this.deferredBirdSpawns.length} spawns`);
        this.deferredBirdSpawns = [];
        return;
      }
      
      for (let i = 0; i < spawnsToProcess; i++) {
        const spawn = this.deferredBirdSpawns[i];
        const newBoid = new Boid(
          this.app,
          spawn.x,
          spawn.y,
          this.speedMultiplier
        );
        newBoid.vx = spawn.vx;
        newBoid.vy = spawn.vy;
        this.boids.push(newBoid);
      }
      
      // Clear processed spawns
      this.deferredBirdSpawns = this.deferredBirdSpawns.slice(spawnsToProcess);
      
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
            // Deferred visual effects - won't freeze!
            requestAnimationFrame(() => {
              try {
                // Add crash lines animation showing bird was hit
                this.collisionEffects.createCrashLines(boid.x, boid.y, boid.hue);
                // Simple particle explosion too
                this.particleSystem.createExplosion(boid.x, boid.y, boid.hue, 10);
                this.updateScore(GameConfig.SCORE_HIT);
                
                // If bird had a dot, make it fall
                if (boid.hasDot && boid.targetDot) {
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
              if (asteroid.size < 10) {
                return true; // Destroy
              }
              asteroid.size *= 0.8;
              asteroid.updateSize();
              return false; // Keep
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
        if (this.asteroids.length > 20) {
          const toRemove = this.asteroids.splice(0, 5);
          toRemove.forEach(ast => ast.destroy());
        }
      }
    }
    
    // Update falling dots
    this.fallingDots = this.fallingDots.filter(dot => {
      // Apply physics with ultra slow fall
      const birdSpeed = GameConfig.BASE_SPEED * this.speedMultiplier;
      const maxFallSpeed = birdSpeed * 0.1; // Cap at 10% of bird speed
      
      dot.vy += 50 * dt; // Very gentle gravity
      if (dot.vy > maxFallSpeed) {
        dot.vy = maxFallSpeed; // Cap fall speed
      }
      dot.vx *= 0.95; // Air resistance
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
      for (const boid of this.boids) {
        if (!boid.hasDot && boid.alive) {
          const dist = Math.hypot(boid.x - dot.x, boid.y - dot.y);
          if (dist < GameConfig.BOID_SIZE + GameConfig.ENERGY_RADIUS) {
            // Bird catches falling dot!
            boid.hasDot = true;
            boid.targetDot = dot.originalDot;
            this.particleSystem.createPickup(dot.x, dot.y, dot.originalDot.hue);
            
            // Remove falling dot and trail
            this.app.stage.removeChild(dot.sprite);
            dot.sprite.destroy();
            dot.trail.forEach(t => {
              this.app.stage.removeChild(t);
              t.destroy();
            });
            return false;
          }
        }
      }
      
      // Check if dot reached bottom
      const targetY = this.app.screen.height * GameConfig.BASE_Y;
      if (dot.y >= targetY - 10) {
        // Restore the energy dot
        dot.originalDot.restore();
        this.particleSystem.createPickup(dot.x, targetY, dot.originalDot.hue);
        
        // Remove falling dot and trail
        this.app.stage.removeChild(dot.sprite);
        dot.sprite.destroy();
        dot.trail.forEach(t => {
          this.app.stage.removeChild(t);
          t.destroy();
        });
        return false;
      }
      
      // Remove if off-screen
      if (dot.y > this.app.screen.height + 100) {
        this.app.stage.removeChild(dot.sprite);
        dot.sprite.destroy();
        return false;
      }
      
      return true;
    });
    
    // Update particles
    this.particleSystem.update(dt);
    
    // Update combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt * 1000;
      if (this.comboTimer <= 0) {
        this.comboCount = 0; // Reset combo
      }
    }
    
    // Check wave complete
    if (this.birdsToSpawn === 0 && this.boids.filter(b => !b.hasDot).length === 0) {
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
    
    // Check for game over - all dots stolen, no falling dots, and no birds carrying dots
    const finalAvailableDots = this.energyDots.filter(d => !d.stolen);
    const finalBirdsWithDots = this.boids.filter(b => b.hasDot).length;
    
    if (finalAvailableDots.length === 0 && this.fallingDots.length === 0 && finalBirdsWithDots === 0) {
      console.log('[GAME] GAME OVER - All energy lost! No dots available, falling, or carried by birds!');
      this.onGameOver?.();
      return;
    }
  };
  
  private updateScore(points: number) {
    // Apply combo multiplier
    const comboMultiplier = Math.min(1 + this.comboCount * 0.5, 5); // Max 5x multiplier
    const finalPoints = Math.floor(points * comboMultiplier);
    
    // Visual feedback for combo
    if (this.comboCount > 0) {
      // Create combo text effect
      const comboText = new PIXI.Text(`COMBO x${this.comboCount + 1}!`, {
        fontFamily: 'Arial',
        fontSize: 24 + this.comboCount * 2,
        fill: [0x00ffff, 0xff00ff],
        stroke: { color: 0x000000, width: 4 },
        dropShadow: {
          color: 0x00ffff,
          blur: 4,
          distance: 2,
          angle: Math.PI / 4,
          alpha: 0.8
        }
      });
      
      comboText.anchor.set(0.5);
      comboText.x = this.app.screen.width / 2;
      comboText.y = this.app.screen.height * 0.3;
      this.app.stage.addChild(comboText);
      
      // Animate and remove safely
      let alpha = 1;
      let scale = 1;
      const ticker = () => {
        if (!comboText || comboText.destroyed) {
          this.app.ticker.remove(ticker);
          return;
        }
        
        alpha -= 0.02;
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
      };
      this.app.ticker.add(ticker);
    }
    
    this.score += finalPoints;
    this.onScoreUpdate?.(this.score);
    
    // Increase combo
    this.comboCount++;
    this.comboTimer = this.COMBO_WINDOW;
    
    // Show combo feedback
    if (this.comboCount > 1) {
      const comboX = this.app.screen.width / 2;
      const comboY = this.app.screen.height * 0.3;
      this.particleSystem.createComboText(comboX, comboY, `${this.comboCount}x COMBO!`, comboMultiplier);
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