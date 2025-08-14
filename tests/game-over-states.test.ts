import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * GAME OVER STATE TESTS
 * Energy dots exist in 4 states:
 * 1. Mine (visible below, not stolen)
 * 2. Stolen (carried by birds)
 * 3. Falling (slowly returning after bird killed)
 * 4. Removed/Transformed (converted to birds - game over)
 * 
 * Game Over = Mine + Stolen + Falling = 0
 */

describe('Game Over State Logic', () => {
  let mockEngine: any;
  
  beforeEach(() => {
    // Mock the engine state
    mockEngine = {
      energyDots: [],
      boids: [],
      fallingDots: [],
      onGameOver: vi.fn(),
      checkGameOver: function() {
        const dotsInPlayerControl = this.energyDots.filter((d: any) => !d.stolen).length;
        const dotsStolen = this.boids.filter((b: any) => b.hasDot).length;
        const dotsFalling = this.fallingDots.length;
        const totalDotsInPlay = dotsInPlayerControl + dotsStolen + dotsFalling;
        
        if (totalDotsInPlay === 0) {
          this.onGameOver();
          return true;
        }
        return false;
      }
    };
  });
  
  describe('Non-Game Over States', () => {
    it('should NOT end game when dots are in player control', () => {
      // Setup: 3 dots visible below (mine)
      mockEngine.energyDots = [
        { stolen: false },
        { stolen: false },
        { stolen: false }
      ];
      mockEngine.boids = [];
      mockEngine.fallingDots = [];
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(false);
      expect(mockEngine.onGameOver).not.toHaveBeenCalled();
    });
    
    it('should NOT end game when dots are stolen by birds', () => {
      // Setup: All dots stolen but carried by birds
      mockEngine.energyDots = [
        { stolen: true },
        { stolen: true },
        { stolen: true }
      ];
      mockEngine.boids = [
        { hasDot: true },
        { hasDot: true },
        { hasDot: true }
      ];
      mockEngine.fallingDots = [];
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(false);
      expect(mockEngine.onGameOver).not.toHaveBeenCalled();
    });
    
    it('should NOT end game when dots are falling', () => {
      // Setup: All dots falling back down
      mockEngine.energyDots = [
        { stolen: true },
        { stolen: true },
        { stolen: true }
      ];
      mockEngine.boids = [];
      mockEngine.fallingDots = [
        { x: 100, y: 200 },
        { x: 200, y: 300 },
        { x: 300, y: 400 }
      ];
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(false);
      expect(mockEngine.onGameOver).not.toHaveBeenCalled();
    });
    
    it('should NOT end game with mixed states', () => {
      // Setup: 1 mine, 1 stolen, 1 falling
      mockEngine.energyDots = [
        { stolen: false }, // Mine
        { stolen: true },  // Stolen (but no bird yet)
        { stolen: true }   // Will be falling
      ];
      mockEngine.boids = [
        { hasDot: true }   // Has one stolen dot
      ];
      mockEngine.fallingDots = [
        { x: 300, y: 400 } // One falling
      ];
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(false);
      expect(mockEngine.onGameOver).not.toHaveBeenCalled();
    });
  });
  
  describe('Game Over State', () => {
    it('should end game when all dots are transformed (none in play)', () => {
      // Setup: All dots transformed to birds (removed from play)
      mockEngine.energyDots = [
        { stolen: true },
        { stolen: true },
        { stolen: true }
      ];
      mockEngine.boids = [];  // No birds carrying dots
      mockEngine.fallingDots = [];  // No falling dots
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(true);
      expect(mockEngine.onGameOver).toHaveBeenCalled();
    });
    
    it('should end game when no dots exist at all', () => {
      // Setup: Empty game state
      mockEngine.energyDots = [];
      mockEngine.boids = [];
      mockEngine.fallingDots = [];
      
      const isGameOver = mockEngine.checkGameOver();
      
      expect(isGameOver).toBe(true);
      expect(mockEngine.onGameOver).toHaveBeenCalled();
    });
  });
  
  describe('State Transitions', () => {
    it('should track dot state: mine -> stolen -> falling -> mine', () => {
      // Start: Dot is mine
      mockEngine.energyDots = [{ stolen: false }];
      mockEngine.boids = [];
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // Bird steals dot
      mockEngine.energyDots[0].stolen = true;
      mockEngine.boids.push({ hasDot: true });
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // Bird killed, dot falls
      mockEngine.boids = [];
      mockEngine.fallingDots.push({ x: 100, y: 200 });
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // Dot lands, back to mine
      mockEngine.energyDots[0].stolen = false;
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(false);
    });
    
    it('should allow falling dots to be re-stolen', () => {
      // Start: Dot is falling
      mockEngine.energyDots = [{ stolen: true }];
      mockEngine.boids = [];
      mockEngine.fallingDots = [{ x: 100, y: 200 }];
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // Bird catches falling dot
      mockEngine.boids.push({ hasDot: true });
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(false);
    });
    
    it('should track progression to game over', () => {
      // Start: 3 dots mine
      mockEngine.energyDots = [
        { stolen: false },
        { stolen: false },
        { stolen: false }
      ];
      mockEngine.boids = [];
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // All stolen
      mockEngine.energyDots.forEach(d => d.stolen = true);
      mockEngine.boids = [
        { hasDot: true },
        { hasDot: true },
        { hasDot: true }
      ];
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // Birds reach top and transform (dots removed)
      mockEngine.boids = [];  // Birds transformed, dots gone
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(true);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle partial transformations', () => {
      // 2 dots transformed, 1 still in play
      mockEngine.energyDots = [
        { stolen: true },  // Transformed
        { stolen: true },  // Transformed
        { stolen: false }  // Still mine
      ];
      mockEngine.boids = [];
      mockEngine.fallingDots = [];
      
      expect(mockEngine.checkGameOver()).toBe(false);
    });
    
    it('should handle multiple dots falling simultaneously', () => {
      mockEngine.energyDots = [
        { stolen: true },
        { stolen: true },
        { stolen: true }
      ];
      mockEngine.boids = [];
      mockEngine.fallingDots = [
        { x: 100, y: 200 },
        { x: 200, y: 300 },
        { x: 300, y: 400 }
      ];
      
      expect(mockEngine.checkGameOver()).toBe(false);
      
      // All dots land
      mockEngine.energyDots.forEach(d => d.stolen = false);
      mockEngine.fallingDots = [];
      expect(mockEngine.checkGameOver()).toBe(false);
    });
  });
});