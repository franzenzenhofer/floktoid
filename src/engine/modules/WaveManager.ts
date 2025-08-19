/**
 * WaveManager - Handles wave progression, boss spawning, and wave-related logic
 * Extracted from NeonFlockEngine to reduce file size
 */

import { GameConfig } from '../GameConfig';
import CentralConfig from '../CentralConfig';
import { scoringSystem, ScoringEvent } from '../ScoringSystem';

const { TIMING } = CentralConfig;

export interface BossConfig {
  count: number;
  health: number;
}

export class WaveManager {
  private wave = 1;
  private birdsToSpawn = 0;
  private nextSpawnTime = 0;
  private speedMultiplier = 1;
  private waveDotsLost = 0;
  private waveStartTime = 0;
  private bossesToSpawn = 0;
  private bossHealthForWave = 0;
  
  // Callbacks
  public onWaveUpdate?: (wave: number) => void;
  
  constructor() {
    this.reset();
  }
  
  /**
   * Reset wave manager to initial state
   */
  reset(): void {
    this.wave = 1;
    this.birdsToSpawn = 0;
    this.nextSpawnTime = 0;
    this.speedMultiplier = 1;
    this.waveDotsLost = 0;
    this.waveStartTime = 0;
    this.bossesToSpawn = 0;
    this.bossHealthForWave = 0;
  }
  
  /**
   * Get current wave number
   */
  getWave(): number {
    return this.wave;
  }
  
  /**
   * Set wave directly (for restoring saved games)
   */
  setWave(wave: number): void {
    this.wave = Math.max(1, wave);
    // Recalculate speed multiplier for this wave
    this.speedMultiplier = 1 + (wave - 1) * GameConfig.SPEED_GROWTH;
    // Trigger update callback
    if (this.onWaveUpdate) {
      this.onWaveUpdate(this.wave);
    }
  }
  
  /**
   * Get current speed multiplier
   */
  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }
  
  /**
   * Get birds left to spawn
   */
  getBirdsToSpawn(): number {
    return this.birdsToSpawn;
  }
  
  /**
   * Set birds to spawn (for restore)
   */
  setBirdsToSpawn(count: number): void {
    this.birdsToSpawn = Math.max(0, count);
  }
  
  /**
   * Decrement birds to spawn
   */
  decrementBirdsToSpawn(): void {
    if (this.birdsToSpawn > 0) {
      this.birdsToSpawn--;
    }
  }
  
  /**
   * Get bosses left to spawn
   */
  getBossesToSpawn(): number {
    return this.bossesToSpawn;
  }
  
  /**
   * Decrement bosses to spawn
   */
  decrementBossesToSpawn(): void {
    if (this.bossesToSpawn > 0) {
      this.bossesToSpawn--;
    }
  }
  
  /**
   * Get boss health for current wave
   */
  getBossHealthForWave(): number {
    return this.bossHealthForWave;
  }
  
  /**
   * Get next spawn time
   */
  getNextSpawnTime(): number {
    return this.nextSpawnTime;
  }
  
  /**
   * Set next spawn time
   */
  setNextSpawnTime(time: number): void {
    this.nextSpawnTime = time;
  }
  
  /**
   * Track dot lost in current wave
   */
  trackDotLost(): void {
    this.waveDotsLost++;
  }
  
  /**
   * Get dots lost in current wave
   */
  getWaveDotsLost(): number {
    return this.waveDotsLost;
  }
  
  /**
   * Set dots lost (for restore)
   */
  setWaveDotsLost(count: number): void {
    this.waveDotsLost = Math.max(0, count);
  }
  
  /**
   * Get wave start time
   */
  getWaveStartTime(): number {
    return this.waveStartTime;
  }
  
  /**
   * Calculate dynamic respawn delay based on wave
   */
  getDotRespawnDelay(): number {
    return TIMING.DOT_RESPAWN_DELAY_MS + (this.wave * 1000); // 35s + 1s per wave
  }
  
  /**
   * Calculate boss configuration for wave
   * Uses same pattern as described: 5hp, 10hp, 15hp cycling
   */
  private getBossConfig(wave: number): BossConfig {
    if (wave % 5 !== 0) return { count: 0, health: 0 };
    
    const bossWaveNumber = Math.floor(wave / 5);
    const cycleNumber = Math.floor((bossWaveNumber - 1) / 3);
    const positionInCycle = (bossWaveNumber - 1) % 3;
    
    const count = Math.min(cycleNumber + 1, 5); // 1, 2, 3, 4, 5 bosses max
    const healthValues = [5, 10, 15];
    const health = healthValues[positionInCycle];
    
    return { count, health };
  }
  
  /**
   * Start a new wave
   */
  startWave(): void {
    console.log(`[WAVE] Starting wave ${this.wave}`);
    
    // Check for perfect wave from previous wave
    if (this.wave > 1 && this.waveDotsLost === 0) {
      scoringSystem.addEvent(ScoringEvent.PERFECT_WAVE);
    }
    
    // Reset wave tracking
    this.waveDotsLost = 0;
    this.waveStartTime = Date.now();
    
    // Check if this is a boss wave
    const bossConfig = this.getBossConfig(this.wave);
    if (bossConfig.count > 0) {
      this.bossesToSpawn = bossConfig.count;
      this.bossHealthForWave = bossConfig.health;
      console.log(`[WAVE] Boss wave ${this.wave}: ${bossConfig.count} bosses with ${bossConfig.health} HP each`);
    } else {
      this.bossesToSpawn = 0;
      this.bossHealthForWave = 0;
    }
    
    // Spawn the normal number of birds for this wave
    const waveIndex = this.wave - 1;
    const count = waveIndex < GameConfig.BIRDS_PER_WAVE.length 
      ? GameConfig.BIRDS_PER_WAVE[waveIndex]
      : GameConfig.BIRDS_PER_WAVE[GameConfig.BIRDS_PER_WAVE.length - 1] + 
        (waveIndex - GameConfig.BIRDS_PER_WAVE.length + 1) * 10;
    this.birdsToSpawn = count;
    
    console.log(`[WAVE] Wave ${this.wave}: birdsToSpawn=${this.birdsToSpawn}, bossesQueued=${this.bossesToSpawn}`);
    
    this.speedMultiplier = Math.pow(GameConfig.SPEED_GROWTH, this.wave - 1);
    this.nextSpawnTime = 0;
    this.onWaveUpdate?.(this.wave);
  }
  
  /**
   * Complete current wave and advance to next
   */
  completeWave(): void {
    const timeSinceWaveStart = Date.now() - this.waveStartTime;
    if (timeSinceWaveStart > 100) { // 100ms minimum to prevent double-trigger
      console.log(`[WAVE] Completing wave ${this.wave} -> ${this.wave + 1}`);
      scoringSystem.addEvent(ScoringEvent.WAVE_COMPLETE);
      this.wave++;
      this.waveStartTime = Date.now();
      this.startWave();
    }
  }
  
  /**
   * Check if wave should complete
   */
  shouldCompleteWave(boidCount: number): boolean {
    return this.birdsToSpawn === 0 && boidCount === 0;
  }
}