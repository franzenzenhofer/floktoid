import * as PIXI from 'pixi.js';
import { Boid } from './entities/Boid';
import { EnergyDot } from './entities/EnergyDot';
import { Asteroid } from './entities/Asteroid';
import { ParticleSystem } from './systems/ParticleSystem';
import { FlockingSystem } from './systems/FlockingSystem';
import { InputManager } from './systems/InputManager';
import { CollisionSystem } from './systems/CollisionSystem';
import { GameConfig } from './GameConfig';

export class NeonFlockEngine {
  private app: PIXI.Application;
  private container: HTMLDivElement;
  
  private boids: Boid[] = [];
  private energyDots: EnergyDot[] = [];
  private asteroids: Asteroid[] = [];
  
  private particleSystem: ParticleSystem;
  private flockingSystem: FlockingSystem;
  private inputManager: InputManager;
  private collisionSystem: CollisionSystem;
  
  private score = 0;
  private wave = 1;
  private birdsToSpawn = 0;
  private nextSpawnTime = 0;
  private speedMultiplier = 1;
  
  public onScoreUpdate?: (score: number) => void;
  public onWaveUpdate?: (wave: number) => void;
  public onGameOver?: () => void;
  
  private gridOverlay: PIXI.Graphics;
  private backgroundStars: PIXI.Container;

  constructor(container: HTMLDivElement) {
    this.container = container;
    
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    
    container.appendChild(this.app.view as HTMLCanvasElement);
    
    this.particleSystem = new ParticleSystem(this.app);
    this.flockingSystem = new FlockingSystem();
    this.collisionSystem = new CollisionSystem();
    this.inputManager = new InputManager(this.app, this);
    
    this.setupBackground();
    this.initializeGame();
    
    window.addEventListener('resize', this.handleResize);
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
      star.beginFill(0xffffff, Math.random() * 0.5);
      star.drawCircle(0, 0, Math.random() * 2);
      star.endFill();
      star.x = Math.random() * this.app.screen.width;
      star.y = Math.random() * this.app.screen.height;
      this.backgroundStars.addChild(star);
    }
    this.app.stage.addChild(this.backgroundStars);
  }
  
  private drawGrid() {
    const gridSize = 50;
    this.gridOverlay.clear();
    this.gridOverlay.lineStyle(1, 0x00ffff, 0.1);
    
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
    gradient.beginFill(0x00ffff, 0.05);
    gradient.drawRect(0, baseY - 100, this.app.screen.width, 150);
    gradient.endFill();
    gradient.beginFill(0xff00ff, 0.05);
    gradient.drawRect(0, baseY + 50, this.app.screen.width, 100);
    gradient.endFill();
    this.gridOverlay.addChild(gradient);
  }
  
  private initializeGame() {
    this.spawnEnergyDots();
    this.startWave();
    this.app.ticker.add(this.gameLoop);
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
    const count = Math.floor(
      GameConfig.BIRDS_WAVE_1 * Math.pow(GameConfig.WAVE_GROWTH, this.wave - 1)
    );
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
  
  public launchAsteroid(startX: number, startY: number, targetX: number, targetY: number, size: number) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 20) {
      const speed = Math.min(dist * 3, GameConfig.AST_SPEED);
      const asteroid = new Asteroid(
        this.app,
        startX,
        startY,
        (dx / dist) * speed,
        (dy / dist) * speed,
        size
      );
      this.asteroids.push(asteroid);
      
      // Launch particles
      this.particleSystem.createExplosion(startX, startY, 0x00ffff, 20);
    }
  }
  
  private gameLoop = (delta: number) => {
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
          for (let j = 0; j < GameConfig.SPAWN_BURST; j++) {
            const angle = (j / GameConfig.SPAWN_BURST) * Math.PI * 2;
            const newBoid = new Boid(
              this.app,
              boid.x,
              boid.y,
              this.speedMultiplier
            );
            newBoid.vx = Math.cos(angle) * 150;
            newBoid.vy = Math.sin(angle) * 150;
            this.boids.push(newBoid);
          }
          
          this.particleSystem.createExplosion(boid.x, boid.y, 0xff00ff, 30);
          this.updateScore(10);
          boid.destroy();
          this.boids.splice(i, 1);
          return;
        }
      } else {
        // Flocking behavior
        const forces = this.flockingSystem.calculateForces(
          boid,
          this.boids,
          this.energyDots,
          this.asteroids
        );
        boid.applyForces(forces, dt);
        
        // Check dot pickup
        for (const dot of this.energyDots) {
          if (!dot.stolen && boid.checkDotPickup(dot)) {
            dot.steal();
            boid.hasDot = true;
            boid.targetDot = dot;
            this.particleSystem.createPickup(dot.x, dot.y, dot.hue);
            break;
          }
        }
      }
      
      boid.update(dt);
    });
    
    // Update asteroids
    this.asteroids = this.asteroids.filter(asteroid => {
      asteroid.update(dt);
      if (asteroid.isOffScreen(this.app.screen)) {
        asteroid.destroy();
        return false;
      }
      return true;
    });
    
    // Check collisions
    this.collisionSystem.checkCollisions(
      this.boids,
      this.asteroids,
      this.energyDots,
      (boid) => {
        this.particleSystem.createExplosion(boid.x, boid.y, 0xff0000, 15);
        this.updateScore(5);
      },
      (asteroid) => {
        if (asteroid.size < 10) {
          asteroid.destroy();
          return true;
        }
        asteroid.size *= 0.8;
        asteroid.updateSize();
        return false;
      }
    );
    
    // Update particles
    this.particleSystem.update(dt);
    
    // Check wave complete
    if (this.birdsToSpawn === 0 && this.boids.filter(b => !b.hasDot).length === 0) {
      this.wave++;
      this.startWave();
    }
    
    // Reset dots if all stolen
    if (this.energyDots.filter(d => !d.stolen).length === 0) {
      this.spawnEnergyDots();
    }
  };
  
  private updateScore(points: number) {
    this.score += points;
    this.onScoreUpdate?.(this.score);
  }
  
  private handleResize = () => {
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.drawGrid();
    this.spawnEnergyDots();
  };
  
  public start() {
    this.app.start();
  }
  
  public destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.app.ticker.remove(this.gameLoop);
    this.boids.forEach(b => b.destroy());
    this.energyDots.forEach(d => d.destroy());
    this.asteroids.forEach(a => a.destroy());
    this.inputManager.destroy();
    this.app.destroy(true);
  }
}