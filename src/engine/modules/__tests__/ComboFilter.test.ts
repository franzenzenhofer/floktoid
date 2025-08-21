import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { MessageDisplay } from '../MessageDisplay';

describe('Combo Filter - Progressive Filtering', () => {
  let app: Application;
  let messageDisplay: MessageDisplay;
  let displayOldStyleMessageSpy: any;
  
  beforeEach(() => {
    app = new Application();
    Object.defineProperty(app, 'screen', {
      value: { width: 800, height: 600 },
      writable: false,
      configurable: true
    });
    
    // Mock ticker
    app.ticker = {
      add: vi.fn(),
      remove: vi.fn()
    } as any;
    
    // Mock stage
    app.stage = {
      addChild: vi.fn(),
      removeChild: vi.fn()
    } as any;
    
    messageDisplay = new MessageDisplay(app);
    // Spy on private method to check if combo is displayed
    displayOldStyleMessageSpy = vi.spyOn(messageDisplay as any, 'displayOldStyleMessage');
  });
  
  describe('Wave 1-3: Show ALL combos (2x and up)', () => {
    it('should show 2x combo in wave 1', () => {
      messageDisplay.setWave(1);
      messageDisplay.displayCombo(2, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should show 3x combo in wave 2', () => {
      messageDisplay.setWave(2);
      messageDisplay.displayCombo(3, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should show 2x combo in wave 3', () => {
      messageDisplay.setWave(3);
      messageDisplay.displayCombo(2, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Wave 4-11: Show 3x and up only (8 waves)', () => {
    it('should NOT show 2x combo in wave 4', () => {
      messageDisplay.setWave(4);
      messageDisplay.displayCombo(2, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 3x combo in wave 4', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(4);
      messageDisplay.displayCombo(3, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should NOT show 2x combo in wave 11', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(11);
      messageDisplay.displayCombo(2, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 3x combo in wave 11', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(11);
      messageDisplay.displayCombo(3, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Wave 12-19: Show 4x and up only (8 waves)', () => {
    it('should NOT show 3x combo in wave 12', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(12);
      messageDisplay.displayCombo(3, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 4x combo in wave 12', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(12);
      messageDisplay.displayCombo(4, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should show 5x combo in wave 19', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(19);
      messageDisplay.displayCombo(5, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Higher waves (every 8 waves)', () => {
    it('should require 5x combo in wave 20', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(20);
      messageDisplay.displayCombo(4, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
      
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.displayCombo(5, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should require 7x combo in wave 28', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(28);
      messageDisplay.displayCombo(6, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
      
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.displayCombo(7, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should require 10x combo in wave 36', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(36);
      messageDisplay.displayCombo(9, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
      
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.displayCombo(10, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should require 30x combo in wave 60+', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(60);
      messageDisplay.displayCombo(29, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
      
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.displayCombo(30, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Console logging', () => {
    it('should log suppressed combos', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      messageDisplay.setWave(10);
      messageDisplay.displayCombo(3, 400, 300); // 3x suppressed in wave 10
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[COMBO] Suppressed 3x combo (min threshold: 5x for wave 10)'
      );
    });
  });
});