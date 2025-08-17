import * as PIXI from 'pixi.js';
import CentralConfig from '../CentralConfig';
import { GameConfig } from '../GameConfig';
import { EntityDestroyer } from '../utils/EntityDestroyer';

const { SHREDDER, SIZES, VISUALS } = CentralConfig;

export type ShredderPath = 'SINE' | 'COSINE' | 'LISSAJOUS';

export function calculateShredderSpawnProbability(A: number): number {
  let P = A <= 10 ? SHREDDER.SPAWN.BASE_PROBABILITY : SHREDDER.SPAWN.BASE_PROBABILITY + A * SHREDDER.SPAWN.EXTRA_PER_ASTEROID;
  if (SHREDDER.SPAWN.MAX_PROBABILITY !== undefined) {
    P = Math.min(P, SHREDDER.SPAWN.MAX_PROBABILITY);
  }
  return P;
}

const OUTER = [
  [-0.3545, 0.6136], [0.0, 1.0], [0.3545, 0.6136],
  [0.3545, -0.6136], [0.0, -1.0], [-0.3545, -0.6136],
  [-0.8864, 0.0], [-0.8218, 0.1418], [-0.7127, 0.2509],
  [-0.6136, 0.3545], [-0.3545, 0.6136]
];

const HUB = [
  [0.0, 0.1636], [0.1418, -0.0818],
  [-0.1418, -0.0818], [0.0, 0.1636]
];

export class Shredder {
  public x: number;
  public y: number;
  public radius: number;
  public destroyed = false;

  private sprite: PIXI.Graphics;
  private rotation = 0;
  private rotationSpeed: number;
  private direction: number;
  private t = 0;
  private app: PIXI.Application;
  private motionType: ShredderPath;
  private amplitude: number;
  private omega: number;
  private phase: number;
  private startX: number;
  private startY: number;
  private forwardSpeed: number;

  constructor(app: PIXI.Application, spawnSide: 'left' | 'right') {
    this.app = app;
    const scale = SHREDDER.SCALE.MIN + Math.random() * (SHREDDER.SCALE.MAX - SHREDDER.SCALE.MIN);
    const baseTip = SIZES.BIRD.BASE * SIZES.BIRD.TRIANGLE_FRONT_MULTIPLIER;
    this.radius = baseTip * scale;

    this.rotationSpeed = (SHREDDER.SPIN.MIN + Math.random() * (SHREDDER.SPIN.MAX - SHREDDER.SPIN.MIN)) * (Math.random() < 0.5 ? -1 : 1);

    const motionTypes: ShredderPath[] = ['SINE', 'COSINE', 'LISSAJOUS'];
    this.motionType = motionTypes[Math.floor(Math.random() * motionTypes.length)];
    this.amplitude = (SHREDDER.AMPLITUDE.MIN + Math.random() * (SHREDDER.AMPLITUDE.MAX - SHREDDER.AMPLITUDE.MIN)) * app.screen.height;
    this.omega = 0.6 + Math.random() * 0.6; // 0.6 to 1.2
    this.phase = Math.random() * Math.PI * 2;
    this.forwardSpeed = GameConfig.BASE_SPEED * (1 - SHREDDER.SPEED_JITTER + Math.random() * SHREDDER.SPEED_JITTER * 2);

    this.direction = spawnSide === 'left' ? 1 : -1;
    this.startX = spawnSide === 'left' ? -this.radius : app.screen.width + this.radius;
    this.startY = Math.random() * app.screen.height;
    this.x = this.startX;
    this.y = this.startY;

    this.sprite = new PIXI.Graphics();
    this.draw();
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    app.stage.addChild(this.sprite);
  }

  private draw() {
    this.sprite.clear();
    const strokeWidth = Math.max(1.5, this.radius * 0.03);
    const outer = OUTER.flatMap(p => [p[0] * this.radius, p[1] * this.radius]);
    this.sprite.poly(outer);
    this.sprite.stroke({ width: strokeWidth, color: VISUALS.COLORS.WHITE, alpha: VISUALS.ALPHA.FULL });
    const hub = HUB.flatMap(p => [p[0] * this.radius, p[1] * this.radius]);
    this.sprite.poly(hub);
    this.sprite.stroke({ width: strokeWidth, color: VISUALS.COLORS.WHITE, alpha: VISUALS.ALPHA.FULL });
  }

  update(dt: number): boolean {
    this.t += dt;
    const t = this.t;
    if (this.motionType === 'SINE') {
      this.x = this.startX + this.direction * this.forwardSpeed * t;
      this.y = this.startY + this.amplitude * Math.sin(this.omega * t + this.phase);
    } else if (this.motionType === 'COSINE') {
      this.x = this.startX + this.direction * this.forwardSpeed * t;
      this.y = this.startY + this.amplitude * Math.cos(this.omega * t + this.phase);
    } else {
      this.x = this.startX + this.direction * this.forwardSpeed * t + 0.3 * this.app.screen.width * Math.sin(this.omega * t + this.phase);
      this.y = this.startY + this.amplitude * Math.sin(2 * this.omega * t + 0.5 * this.phase);
    }
    this.rotation += this.rotationSpeed * dt;
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
