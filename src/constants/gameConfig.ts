export const COLOR_PALETTE = [
  '#EF4444', // Red - vibrant and accessible
  '#10B981', // Green - good contrast
  '#3B82F6', // Blue - clear distinction
  '#F59E0B', // Amber - warm and visible
  '#8B5CF6', // Purple - distinct hue
  '#06B6D4', // Cyan - cool tone
  '#F97316', // Orange - energetic
  '#EC4899', // Pink - playful
] as const;

export type DifficultyKey = 'easy' | 'medium' | 'hard';

export interface Difficulty {
  size: number;
  colors: number;
  reverseSteps: number;
  maxMoves: number;
  maxLockedTiles: number;
  powerTileChance: number;
  timeLimit: number;     // seconds (0 = no timer)
  tutorial: boolean;
  description: string;
}

export const DIFFICULTIES: Record<DifficultyKey, Difficulty> = {
  easy: { 
    size: 3, 
    colors: 3, 
    reverseSteps: 3, 
    maxMoves: 0, 
    maxLockedTiles: 0,
    powerTileChance: 0, // Disabled - power tiles stashed for now
    timeLimit: 0, 
    tutorial: false,
    description: 'Perfect for learning! No limits.' 
  },
  medium: { 
    size: 6, // Changed from 4 to 6x6 
    colors: 4, 
    reverseSteps: 5, 
    maxMoves: 25, 
    maxLockedTiles: 0, // Disabled - locked tiles stashed for now
    powerTileChance: 0, // Disabled - power tiles stashed for now
    timeLimit: 0, 
    tutorial: false,
    description: 'Larger 6x6 board with more colors.' 
  },
  hard: { 
    size: 10, // Changed from 5 to 10x10
    colors: 4, 
    reverseSteps: 7, 
    maxMoves: 35, 
    maxLockedTiles: 0, // Disabled - locked tiles stashed for now
    powerTileChance: 0, // Disabled - power tiles stashed for now
    timeLimit: 600, 
    tutorial: false,
    description: 'Massive 10x10 board & timer challenge.' 
  },
};

// Progression system constants
export const BELT_COLORS = {
  white: { name: 'White', color: '#FFFFFF', minXP: 0 },
  yellow: { name: 'Yellow', color: '#FFAA00', minXP: 500 },
  orange: { name: 'Orange', color: '#FF6B35', minXP: 1500 },
  green: { name: 'Green', color: '#44DD44', minXP: 3000 },
  blue: { name: 'Blue', color: '#4444FF', minXP: 5000 },
  purple: { name: 'Purple', color: '#AA44FF', minXP: 8000 },
  black: { name: 'Black', color: '#000000', minXP: 15000 }, // Master level
} as const;

export const ACHIEVEMENTS = [
  { id: 'first_win', name: 'First Victory', description: 'Complete your first puzzle', xp: 100 },
  { id: 'perfect_solve', name: 'Perfect Solution', description: 'Solve a puzzle optimally', xp: 200 },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Solve a puzzle in under 30 seconds', xp: 150 },
  { id: 'streak_5', name: 'On Fire', description: '5 day streak', xp: 250 },
  { id: 'streak_30', name: 'Dedication', description: '30 day streak', xp: 1000 },
] as const;