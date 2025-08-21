  private updateShield() {
    // Clear both shield sprites
    this.outerShieldSprite.clear();
    this.innerShieldSprite.clear();
    
    // Always position sprites
    this.outerShieldSprite.x = this.x;
    this.outerShieldSprite.y = this.y;
    this.innerShieldSprite.x = this.x;
    this.innerShieldSprite.y = this.y;
    
    // Shield only visible when health > 1 (last HP is core without shield)
    if (this.health <= 1 || !this.alive) return;
    
    // Calculate shield states
    const shieldHitsTaken = this.maxHealth - this.health;
    const outerShieldActive = shieldHitsTaken < 2; // First 2 hits go to outer shield
    const innerShieldActive = shieldHitsTaken < (this.maxHealth - 2); // Inner shield until only core remains
    
    // Shield radii
    const outerShieldRadius = this.size * 1.5;
    const innerShieldRadius = this.size * 1.2;
    
    // Calculate shield health percentage for color
    const shieldHealth = this.health - 1; // -1 for core
    const maxShieldHealth = this.maxHealth - 1;
    const healthPercent = shieldHealth / maxShieldHealth;
    
    // Color based on health: Green -> Yellow -> Orange -> Red
    let activeShieldColor: number;
    if (healthPercent > 0.75) {
      activeShieldColor = 0x00FF00; // Green
    } else if (healthPercent > 0.5) {
      const t = (healthPercent - 0.5) * 4;
      activeShieldColor = (Math.floor(255 * (1 - t)) << 16) | (255 << 8); // Green to Yellow
    } else if (healthPercent > 0.25) {
      const t = (healthPercent - 0.25) * 4;
      activeShieldColor = (255 << 16) | (Math.floor(255 * t) << 8); // Yellow to Orange
    } else {
      const t = healthPercent * 4;
      activeShieldColor = (255 << 16) | (Math.floor(128 * t) << 8); // Orange to Red
    }
    
    // OUTER SHIELD DRAWING
    if (outerShieldActive) {
      // Draw active outer shield
      const outerVertices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        outerVertices.push(
          Math.cos(angle) * outerShieldRadius,
          Math.sin(angle) * outerShieldRadius
        );
      }
      
      this.outerShieldSprite.poly(outerVertices);
      this.outerShieldSprite.stroke({ 
        width: 3, 
        color: activeShieldColor, 
        alpha: 0.8 + healthPercent * 0.2 
      });
      
      // Pulsing glow effect
      const pulseAlpha = Math.sin(this.timeAlive * 3) * 0.1 + 0.1;
      this.outerShieldSprite.circle(0, 0, outerShieldRadius);
      this.outerShieldSprite.fill({ color: activeShieldColor, alpha: pulseAlpha });
    } else {
      // Draw destroyed outer shield (broken fragments)
      for (let i = 0; i < 6; i++) {
        const angle1 = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        const angle2 = ((i + 1) % 6 * Math.PI * 2) / 6 + this.rotation * 0.5;
        
        // Only draw some segments to show it's broken
        if (i % 2 === 0) {
          const x1 = Math.cos(angle1) * outerShieldRadius;
          const y1 = Math.sin(angle1) * outerShieldRadius;
          const x2 = Math.cos(angle2) * outerShieldRadius;
          const y2 = Math.sin(angle2) * outerShieldRadius;
          
          // Draw partial segment
          const segmentStart = 0.1;
          const segmentEnd = 0.4;
          
          this.outerShieldSprite.moveTo(
            x1 + (x2 - x1) * segmentStart,
            y1 + (y2 - y1) * segmentStart
          );
          this.outerShieldSprite.lineTo(
            x1 + (x2 - x1) * segmentEnd,
            y1 + (y2 - y1) * segmentEnd
          );
          this.outerShieldSprite.stroke({ 
            width: 1, 
            color: 0x444444, // Dark gray for destroyed
            alpha: 0.3 
          });
        }
      }
    }
    
    // INNER SHIELD DRAWING
    if (innerShieldActive && this.health > 1) {
      const innerVertices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        innerVertices.push(
          Math.cos(angle) * innerShieldRadius,
          Math.sin(angle) * innerShieldRadius
        );
      }
      
      // Inner shield is the active collision zone when outer is destroyed
      const innerIsActiveCollisionZone = !outerShieldActive;
      
      this.innerShieldSprite.poly(innerVertices);
      this.innerShieldSprite.stroke({ 
        width: innerIsActiveCollisionZone ? 3 : 2, 
        color: activeShieldColor, 
        alpha: innerIsActiveCollisionZone ? (0.8 + healthPercent * 0.2) : 0.5
      });
      
      // Add detail lines
      const detailVertices: number[] = [];
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 + this.rotation * 0.5;
        detailVertices.push(
          Math.cos(angle) * innerShieldRadius * 0.9,
          Math.sin(angle) * innerShieldRadius * 0.9
        );
      }
      this.innerShieldSprite.poly(detailVertices);
      this.innerShieldSprite.stroke({ 
        width: 1, 
        color: activeShieldColor, 
        alpha: 0.3 
      });
      
      // Pulsing effect if this is the active collision zone
      if (innerIsActiveCollisionZone) {
        const pulseAlpha = Math.sin(this.timeAlive * 3) * 0.1 + 0.1;
        this.innerShieldSprite.circle(0, 0, innerShieldRadius);
        this.innerShieldSprite.fill({ color: activeShieldColor, alpha: pulseAlpha });
      }
    }
  }