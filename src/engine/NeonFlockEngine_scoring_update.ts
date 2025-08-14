// This file contains the updated methods for NeonFlockEngine to use the new scoring system

// Replace the old updateScore method with this:
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

// Update launchAsteroid to charge points:
public launchAsteroid(
  startX: number, 
  startY: number, 
  targetX: number, 
  targetY: number, 
  size: number, 
  slownessFactor = 1,
  shapeData?: { vertices: number[], roughness: number[] } | null,
  hue?: number
) {
  // Charge points for launching asteroid
  scoringSystem.addEvent(ScoringEvent.ASTEROID_LAUNCH, { size });
  this.updateScoreDisplay();
  
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
      shapeData || undefined,
      hue
    );
    this.asteroids.push(asteroid);
  }
}

// Add special scoring events:
private checkSpecialScoringEvents() {
  // Check for multi-kills
  const simultaneousKills = this.getSimultaneousKills();
  if (simultaneousKills > 1) {
    scoringSystem.addEvent(ScoringEvent.MULTI_KILL, { count: simultaneousKills });
    this.updateScoreDisplay();
  }
  
  // Check for perfect wave
  if (this.wave > 1 && this.waveDotsLost === 0) {
    scoringSystem.addEvent(ScoringEvent.PERFECT_WAVE);
    this.updateScoreDisplay();
  }
  
  // Check for wave complete
  if (this.birdsToSpawn === 0 && this.boids.filter(b => !b.hasDot).length === 0) {
    scoringSystem.addEvent(ScoringEvent.WAVE_COMPLETE);
    this.updateScoreDisplay();
  }
}

// Initialize scoring system on game start:
private initializeGame() {
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
      // Emergency recovery - try to continue game
      try {
        this.onGameOver?.();
      } catch (recoveryError) {
        console.error('[RECOVERY FAILED]:', recoveryError);
      }
    }
  };
  
  this.app.ticker.add(safeGameLoop);
}