import { describe, it, expect, beforeEach } from 'vitest';
import { MilestoneManager, Belt } from '../MilestoneManager';

describe('MilestoneManager', () => {
  let milestoneManager: MilestoneManager;
  
  beforeEach(() => {
    // Reset singleton instance
    // @ts-expect-error - accessing private for testing
    MilestoneManager.instance = undefined;
    milestoneManager = MilestoneManager.getInstance();
  });
  
  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = MilestoneManager.getInstance();
      const instance2 = MilestoneManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('checkMilestones', () => {
    it('should unlock level milestones', () => {
      const stats = {
        currentLevel: 10,
        completedLevels: Array.from({ length: 10 }, (_, i) => i + 1),
        totalPoints: 5000,
        currentStreak: 3,
        bestStreak: 5,
        perfectGames: 2,
        fastestTime: 45,
        totalGamesPlayed: 10,
        hintsUsed: 3,
        averageEfficiency: 0.8
      };
      
      const unlocked = milestoneManager.checkMilestones(stats);
      
      expect(unlocked.length).toBeGreaterThan(0);
      const levelMilestone = unlocked.find(m => m.id === 'level_10');
      expect(levelMilestone).toBeDefined();
      expect(levelMilestone?.name).toBe('Getting Started');
      expect(levelMilestone?.reward?.belt).toBe(Belt.YELLOW);
    });
    
    it('should unlock streak milestones', () => {
      const stats = {
        currentLevel: 5,
        completedLevels: [1, 2, 3, 4, 5],
        totalPoints: 2000,
        currentStreak: 5,
        bestStreak: 5,
        perfectGames: 0,
        fastestTime: 60,
        totalGamesPlayed: 5,
        hintsUsed: 0,
        averageEfficiency: 0.7
      };
      
      const unlocked = milestoneManager.checkMilestones(stats);
      
      const streakMilestone = unlocked.find(m => m.id === 'streak_5');
      expect(streakMilestone).toBeDefined();
      expect(streakMilestone?.name).toBe('Hot Streak');
    });
    
    it('should unlock perfect game milestones', () => {
      const stats = {
        currentLevel: 3,
        completedLevels: [1, 2, 3],
        totalPoints: 1000,
        currentStreak: 1,
        bestStreak: 1,
        perfectGames: 1,
        fastestTime: 40,
        totalGamesPlayed: 3,
        hintsUsed: 0,
        averageEfficiency: 1.0
      };
      
      const unlocked = milestoneManager.checkMilestones(stats);
      
      const perfectMilestone = unlocked.find(m => m.id === 'perfect_1');
      expect(perfectMilestone).toBeDefined();
      expect(perfectMilestone?.name).toBe('Perfectionist');
    });
    
    it('should unlock speed milestones', () => {
      const stats = {
        currentLevel: 2,
        completedLevels: [1, 2],
        totalPoints: 500,
        currentStreak: 1,
        bestStreak: 1,
        perfectGames: 0,
        fastestTime: 25, // Under 30 seconds
        totalGamesPlayed: 2,
        hintsUsed: 1,
        averageEfficiency: 0.6
      };
      
      const unlocked = milestoneManager.checkMilestones(stats);
      
      const speedMilestone = unlocked.find(m => m.id === 'speed_30s');
      expect(speedMilestone).toBeDefined();
      expect(speedMilestone?.name).toBe('Speed Demon');
    });
    
    it('should not unlock already unlocked milestones', () => {
      const stats = {
        currentLevel: 10,
        completedLevels: Array.from({ length: 10 }, (_, i) => i + 1),
        totalPoints: 5000,
        currentStreak: 3,
        bestStreak: 5,
        perfectGames: 2,
        fastestTime: 45,
        totalGamesPlayed: 10,
        hintsUsed: 3,
        averageEfficiency: 0.8
      };
      
      // First check
      const firstUnlock = milestoneManager.checkMilestones(stats);
      expect(firstUnlock.length).toBeGreaterThan(0);
      
      // Second check with same stats
      const secondUnlock = milestoneManager.checkMilestones(stats);
      expect(secondUnlock).toHaveLength(0);
    });
  });
  
  describe('getNextMilestone', () => {
    it('should return closest milestone to achieve', () => {
      const stats = {
        currentLevel: 8,
        completedLevels: Array.from({ length: 8 }, (_, i) => i + 1),
        totalPoints: 4000,
        currentStreak: 3,
        bestStreak: 3,
        perfectGames: 0,
        fastestTime: 60,
        totalGamesPlayed: 8,
        hintsUsed: 2,
        averageEfficiency: 0.7
      };
      
      const next = milestoneManager.getNextMilestone(stats);
      
      expect(next).toBeDefined();
      expect(next?.id).toBe('level_10'); // 80% progress
    });
    
    it('should return null if all milestones unlocked', () => {
      // Unlock all milestones first
      const maxStats = {
        currentLevel: 200,
        completedLevels: Array.from({ length: 200 }, (_, i) => i + 1),
        totalPoints: 200000,
        currentStreak: 50,
        bestStreak: 50,
        perfectGames: 100,
        fastestTime: 10,
        totalGamesPlayed: 200,
        hintsUsed: 0,
        averageEfficiency: 1.0
      };
      
      milestoneManager.checkMilestones(maxStats);
      const next = milestoneManager.getNextMilestone(maxStats);
      
      expect(next).toBeNull();
    });
  });
  
  describe('getMilestoneProgress', () => {
    it('should calculate level milestone progress', () => {
      const stats = {
        currentLevel: 15,
        completedLevels: [],
        totalPoints: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectGames: 0,
        fastestTime: 0,
        totalGamesPlayed: 0,
        hintsUsed: 0,
        averageEfficiency: 0
      };
      
      const progress = milestoneManager.getMilestoneProgress('level_25', stats);
      expect(progress).toBeCloseTo(0.6); // 15/25
    });
    
    it('should calculate streak milestone progress', () => {
      const stats = {
        currentLevel: 1,
        completedLevels: [],
        totalPoints: 0,
        currentStreak: 3,
        bestStreak: 7,
        perfectGames: 0,
        fastestTime: 0,
        totalGamesPlayed: 0,
        hintsUsed: 0,
        averageEfficiency: 0
      };
      
      const progress = milestoneManager.getMilestoneProgress('streak_10', stats);
      expect(progress).toBeCloseTo(0.7); // 7/10
    });
    
    it('should return 0 for invalid milestone', () => {
      const stats = {
        currentLevel: 1,
        completedLevels: [],
        totalPoints: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectGames: 0,
        fastestTime: 0,
        totalGamesPlayed: 0,
        hintsUsed: 0,
        averageEfficiency: 0
      };
      
      const progress = milestoneManager.getMilestoneProgress('invalid_id', stats);
      expect(progress).toBe(0);
    });
  });
  
  describe('getCurrentBelt', () => {
    it('should return white belt by default', () => {
      const stats = {
        currentLevel: 1,
        completedLevels: [],
        totalPoints: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectGames: 0,
        fastestTime: 0,
        totalGamesPlayed: 0,
        hintsUsed: 0,
        averageEfficiency: 0
      };
      
      const belt = milestoneManager.getCurrentBelt(stats);
      expect(belt).toBe(Belt.WHITE);
    });
    
    it('should return highest unlocked belt', () => {
      const stats = {
        currentLevel: 50,
        completedLevels: Array.from({ length: 50 }, (_, i) => i + 1),
        totalPoints: 25000,
        currentStreak: 10,
        bestStreak: 15,
        perfectGames: 10,
        fastestTime: 30,
        totalGamesPlayed: 50,
        hintsUsed: 5,
        averageEfficiency: 0.8
      };
      
      milestoneManager.checkMilestones(stats);
      const belt = milestoneManager.getCurrentBelt(stats);
      
      expect(belt).toBe(Belt.GREEN); // Level 50 milestone
    });
  });
  
  describe('getCelebrationData', () => {
    it('should return appropriate celebration data', () => {
      const stats = {
        currentLevel: 100,
        completedLevels: [],
        totalPoints: 0,
        currentStreak: 0,
        bestStreak: 0,
        perfectGames: 0,
        fastestTime: 0,
        totalGamesPlayed: 0,
        hintsUsed: 0,
        averageEfficiency: 0
      };
      
      const unlocked = milestoneManager.checkMilestones(stats);
      const centuryMilestone = unlocked.find(m => m.id === 'level_100');
      
      expect(centuryMilestone).toBeDefined();
      
      const celebration = milestoneManager.getCelebrationData(centuryMilestone!);
      
      expect(celebration.title).toBe('Century Club');
      expect(celebration.icon).toBe('💯');
      expect(celebration.duration).toBe(7000); // Epic celebration
      expect(celebration.effects).toContain('confetti-large');
    });
  });
  
  describe('serialize/deserialize', () => {
    it('should save and restore milestone state', () => {
      const stats = {
        currentLevel: 10,
        completedLevels: Array.from({ length: 10 }, (_, i) => i + 1),
        totalPoints: 10000,
        currentStreak: 5,
        bestStreak: 5,
        perfectGames: 1,
        fastestTime: 45,
        totalGamesPlayed: 10,
        hintsUsed: 3,
        averageEfficiency: 0.8
      };
      
      // Unlock some milestones
      milestoneManager.checkMilestones(stats);
      
      // Serialize
      const saved = milestoneManager.serialize();
      expect(saved.unlockedMilestones).toContain('level_10');
      expect(saved.unlockedMilestones).toContain('streak_5');
      expect(saved.unlockedMilestones).toContain('points_10k');
      
      // Create new instance and deserialize
      // @ts-expect-error - accessing private for testing
      MilestoneManager.instance = undefined;
      const newManager = MilestoneManager.getInstance();
      newManager.deserialize(saved);
      
      // Check milestones are still unlocked
      const unlocked = newManager.getUnlockedMilestones();
      const unlockedIds = unlocked.map(m => m.id);
      
      expect(unlockedIds).toContain('level_10');
      expect(unlockedIds).toContain('streak_5');
      expect(unlockedIds).toContain('points_10k');
    });
  });
});