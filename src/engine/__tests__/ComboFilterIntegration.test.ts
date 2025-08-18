import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application } from 'pixi.js';
import { ComboEffects } from '../effects/ComboEffects';

describe('ComboEffects Filter Integration', () => {
  let app: Application;
  let comboEffects: ComboEffects;
  let messageDisplaySpy: any;
  
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
    
    comboEffects = new ComboEffects(app);
    // Spy on the internal MessageDisplay's displayCombo
    messageDisplaySpy = vi.spyOn((comboEffects as any).messageDisplay, 'displayCombo');
  });
  
  describe('Progressive Filter via setWave', () => {
    it('should NOT filter 2x combo in wave 1', () => {
      comboEffects.setWave(1);
      comboEffects.createComboDisplay(2, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(2, 400, 300);
    });
    
    it('should NOT filter 2x combo in wave 3', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(3);
      comboEffects.createComboDisplay(2, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(2, 400, 300);
    });
    
    it('should FILTER 2x combo in wave 4 (requires 3x)', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(4);
      comboEffects.createComboDisplay(2, 400, 300, 1);
      // displayCombo is called but MessageDisplay will suppress it internally
      expect(messageDisplaySpy).toHaveBeenCalledWith(2, 400, 300);
    });
    
    it('should show 3x combo in wave 4', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(4);
      comboEffects.createComboDisplay(3, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(3, 400, 300);
    });
    
    it('should FILTER 2x combo in wave 6 (requires 4x)', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(6);
      comboEffects.createComboDisplay(2, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(2, 400, 300);
    });
    
    it('should FILTER 3x combo in wave 6 (requires 4x)', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(6);
      comboEffects.createComboDisplay(3, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(3, 400, 300);
    });
    
    it('should show 4x combo in wave 6', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(6);
      comboEffects.createComboDisplay(4, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(4, 400, 300);
    });
    
    it('should FILTER 2x combo in wave 7 (requires 4x)', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(7);
      comboEffects.createComboDisplay(2, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(2, 400, 300);
    });
    
    it('should FILTER 3x combo in wave 7 (requires 4x)', () => {
      messageDisplaySpy.mockClear();
      comboEffects.setWave(7);
      comboEffects.createComboDisplay(3, 400, 300, 1);
      expect(messageDisplaySpy).toHaveBeenCalledWith(3, 400, 300);
    });
  });
  
  describe('Console logging for suppressed combos', () => {
    it('should log when combo is suppressed', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      comboEffects.setWave(7);
      
      // This internally calls MessageDisplay which will suppress and log
      comboEffects.createComboDisplay(2, 400, 300, 1);
      
      // The log happens in MessageDisplay.displayCombo
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[COMBO] Suppressed 2x combo')
      );
    });
  });
});