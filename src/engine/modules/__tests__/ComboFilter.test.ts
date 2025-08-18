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
  
  describe('Wave 4-5: Show 3x and up only', () => {
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
    
    it('should NOT show 2x combo in wave 5', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(5);
      messageDisplay.displayCombo(2, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 4x combo in wave 5', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(5);
      messageDisplay.displayCombo(4, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Wave 6-8: Show 4x and up only', () => {
    it('should NOT show 3x combo in wave 6', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(6);
      messageDisplay.displayCombo(3, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 4x combo in wave 6', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(6);
      messageDisplay.displayCombo(4, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should show 5x combo in wave 8', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(8);
      messageDisplay.displayCombo(5, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
  });
  
  describe('Higher waves', () => {
    it('should NOT show 6x combo in wave 13 (requires 7x)', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(13);
      messageDisplay.displayCombo(6, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
    });
    
    it('should show 7x combo in wave 13', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(13);
      messageDisplay.displayCombo(7, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should require 20x combo in wave 40', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(40);
      messageDisplay.displayCombo(19, 400, 300);
      expect(displayOldStyleMessageSpy).not.toHaveBeenCalled();
      
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.displayCombo(20, 400, 300);
      expect(displayOldStyleMessageSpy).toHaveBeenCalled();
    });
    
    it('should require 30x combo in wave 51+', () => {
      displayOldStyleMessageSpy.mockClear();
      messageDisplay.setWave(51);
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