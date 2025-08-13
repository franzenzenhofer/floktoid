import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintManager, ConstraintType } from '../ConstraintManager';

describe('ConstraintManager', () => {
  let constraintManager: ConstraintManager;
  
  beforeEach(() => {
    // Reset singleton instance
    // @ts-expect-error - accessing private for testing
    ConstraintManager.instance = undefined;
    constraintManager = ConstraintManager.getInstance();
  });
  
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConstraintManager.getInstance();
      const instance2 = ConstraintManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('getConstraintsForLevel', () => {
    it('should return no constraints for levels 1-30', () => {
      for (let level = 1; level <= 30; level++) {
        const constraints = constraintManager.getConstraintsForLevel(level, 10);
        expect(constraints.moveLimit).toBeUndefined();
        expect(constraints.timeLimit).toBeUndefined();
        expect(constraints.showTimer).toBe(false);
        expect(constraints.hintsHaveCost).toBe(false);
      }
    });
    
    it('should introduce soft move limit at level 31', () => {
      const constraints = constraintManager.getConstraintsForLevel(31, 10);
      expect(constraints.moveLimit).toBe(30); // 10 * 3.0
      expect(constraints.tutorialMessage).toContain('experts solve this');
    });
    
    it('should tighten move limit at level 35', () => {
      const constraints = constraintManager.getConstraintsForLevel(35, 10);
      expect(constraints.moveLimit).toBe(25); // 10 * 2.5
      expect(constraints.tutorialMessage).toContain('getting efficient');
    });
    
    it('should show timer at level 41', () => {
      const constraints = constraintManager.getConstraintsForLevel(41, 10);
      expect(constraints.showTimer).toBe(true);
      expect(constraints.timeLimit).toBeUndefined();
      expect(constraints.tutorialMessage).toContain('how fast');
    });
    
    it('should add time bonus at level 45', () => {
      const constraints = constraintManager.getConstraintsForLevel(45, 10);
      expect(constraints.timeBonus).toEqual({ under60s: 500, under120s: 250 });
      expect(constraints.showTimer).toBe(true);
    });
    
    it('should combine constraints at higher levels', () => {
      const constraints = constraintManager.getConstraintsForLevel(91, 10);
      expect(constraints.moveLimit).toBe(15); // 10 * 1.5
      expect(constraints.showTimer).toBe(true);
      expect(constraints.timeBonus).toBeDefined();
    });
    
    it('should add undo limit at level 101', () => {
      const constraints = constraintManager.getConstraintsForLevel(101, 10);
      expect(constraints.undoLimit).toBe(5);
    });
  });
  
  describe('hasNewConstraint', () => {
    it('should return true for milestone levels', () => {
      expect(constraintManager.hasNewConstraint(31)).toBe(true);
      expect(constraintManager.hasNewConstraint(35)).toBe(true);
      expect(constraintManager.hasNewConstraint(41)).toBe(true);
      expect(constraintManager.hasNewConstraint(45)).toBe(true);
      expect(constraintManager.hasNewConstraint(91)).toBe(true);
      expect(constraintManager.hasNewConstraint(101)).toBe(true);
    });
    
    it('should return false for non-milestone levels', () => {
      expect(constraintManager.hasNewConstraint(1)).toBe(false);
      expect(constraintManager.hasNewConstraint(30)).toBe(false);
      expect(constraintManager.hasNewConstraint(32)).toBe(false);
      expect(constraintManager.hasNewConstraint(50)).toBe(false);
    });
  });
  
  describe('getNextMilestone', () => {
    it('should return next milestone', () => {
      const next = constraintManager.getNextMilestone(30);
      expect(next?.level).toBe(31);
      expect(next?.type).toBe(ConstraintType.MOVE_LIMIT_SOFT);
    });
    
    it('should return null after all milestones', () => {
      const next = constraintManager.getNextMilestone(200);
      expect(next).toBeNull();
    });
  });
  
  describe('updatePerformance and adaptive difficulty', () => {
    it('should track player performance', () => {
      constraintManager.updatePerformance({
        level: 35,
        attempts: 1,
        completed: true,
        movesUsed: 12,
        optimalMoves: 10,
        timeUsed: 45,
        hintsUsed: false
      });
      
      // Performance is tracked internally
      // Would need to expose for testing or test through constraint adjustments
    });
    
    it('should ease constraints for struggling players', () => {
      // Simulate struggling performance
      for (let i = 0; i < 5; i++) {
        constraintManager.updatePerformance({
          level: 35 + i,
          attempts: 4,
          completed: false,
          movesUsed: 30,
          optimalMoves: 10,
          timeUsed: 180,
          hintsUsed: true
        });
      }
      
      // Get constraints - should be eased
      const constraints = constraintManager.getConstraintsForLevel(40, 10);
      expect(constraints.moveLimit).toBeGreaterThan(25); // Normal would be 25
      expect(constraints.tutorialMessage).toContain('Take your time');
    });
  });
});