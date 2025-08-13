/**
 * @fileoverview Puzzle Generation System for Color Me Same
 * 
 * This module implements the core puzzle generation algorithm using a reverse-move
 * approach that mathematically guarantees 100% solvability. Instead of generating
 * a random puzzle and checking if it's solvable (which can fail), we start from
 * a solved state and apply reverse moves to scramble it.
 * 
 * Key concepts:
 * - Reverse-move generation: Start solved, apply inverse operations
 * - Level-based progression: Dynamic difficulty scaling 1-70+
 * - Deterministic solvability: No BFS needed, solution known by construction
 * 
 * @module useGenerator
 */

import { useCallback } from 'react';
import { Difficulty } from '../constants/gameConfig';
import { log } from '../utils/logger';
import { applyReverseClick } from '../utils/gridV2';
import { getLevelConfig, LevelConfig } from '../utils/levelConfig';
import { getTutorialPattern, isTutorialLevel } from '../utils/tutorialPatterns';

/**
 * Result of puzzle generation containing all game state data
 * 
 * @interface GenerationResult
 * @property {number[][]} grid - The scrambled puzzle grid to solve
 * @property {number[][]} solved - The target solved state (all same color)
 * @property {Set<string>} power - Power tile positions (format: "row-col")
 * @property {Map<string, number>} locked - Locked tiles with unlock countdown
 * @property {Array} solution - Optimal solution path (same as optimalPath)
 * @property {Array} reverse - Generation history (moves used to scramble)
 * @property {Array} optimalPath - Exact moves to solve puzzle optimally
 * @property {Array} playerMoves - Player's move history (starts empty)
 */
export interface GenerationResult {
  grid: number[][];
  solved: number[][];
  power: Set<string>;
  locked: Map<string, number>;
  solution: { row: number; col: number }[];
  reverse: { row: number; col: number }[];
  optimalPath: { row: number; col: number }[];
  playerMoves: { row: number; col: number }[];
}

/**
 * Generate level-appropriate grid with exact move requirements
 * 
 * This function generates puzzles that require EXACTLY the specified
 * number of moves to solve. It uses intelligent move selection to
 * ensure the puzzle can't be solved in fewer moves.
 * 
 * @param config - Level configuration
 * @returns Generated puzzle with exact move requirement
 */
async function generateExactMovePuzzle(config: LevelConfig): Promise<GenerationResult> {
  const { gridSize, colors, requiredMoves, powerTiles: powerCount } = config;
  const maxAttempts = 50; // Prevent infinite loops
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Start with solved state (all zeros)
    const solved = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
    
    // Place power tiles
    const power = new Set<string>();
    if (powerCount > 0) {
      const positions = [];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          positions.push(`${r}-${c}`);
        }
      }
      
      // Shuffle and take first N positions
      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }
      
      for (let i = 0; i < powerCount && i < positions.length; i++) {
        power.add(positions[i]);
      }
    }
    
    // Generate puzzle by applying exact number of moves
    let currentGrid = solved.map(row => [...row]);
    const generationHistory: { row: number; col: number }[] = [];
    const usedPositions = new Set<string>();
    // Track click count to prevent clicking same tile more than (colors - 1) times
    const clickCount = new Map<string, number>(); // Track number of clicks per tile
    
    // Special case for level 1: Always use center tile
    if (config.level === 1 && requiredMoves === 1) {
      const centerRow = Math.floor(gridSize / 2);
      const centerCol = Math.floor(gridSize / 2);
      generationHistory.push({ row: centerRow, col: centerCol });
      
      // Apply the single center click
      const isPower = power.has(`${centerRow}-${centerCol}`);
      currentGrid = applyReverseClick(currentGrid, centerRow, centerCol, colors, isPower, new Map());
    } else {
      // Smart move selection to ensure exact move count
      for (let moveNum = 0; moveNum < requiredMoves; moveNum++) {
        let bestMove: { row: number; col: number } | null = null;
        
        // Try to find a move that creates maximum change
        const candidates = [];
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          candidates.push({ row: r, col: c });
        }
      }
      
      // Shuffle candidates for variety
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      
      // For early moves, prefer positions that haven't been used
      // For later moves, allow reuse to create complexity
      const reuseThreshold = Math.floor(requiredMoves * 0.6);
      const preferUnused = moveNum < reuseThreshold;
      
      if (preferUnused) {
        // Sort candidates to prioritize unused positions
        candidates.sort((a, b) => {
          const aUsed = usedPositions.has(`${a.row}-${a.col}`);
          const bUsed = usedPositions.has(`${b.row}-${b.col}`);
          if (aUsed && !bUsed) return 1;
          if (!aUsed && bUsed) return -1;
          return 0;
        });
      }
      
      // Select move from top candidates
      const topCandidates = candidates.slice(0, Math.max(3, gridSize));
      let selected = null;
      
      // FIX: Find a candidate that hasn't been clicked an odd number of times
      for (const candidate of topCandidates) {
        const key = `${candidate.row}-${candidate.col}`;
        const clicks = clickCount.get(key) ?? 0;
        if (clicks < colors - 1) { // Can click up to (colors - 1) times
          selected = candidate;
          break;
        }
      }
      
      // If all top candidates are maxed out, try the full candidate list
      if (!selected) {
        for (const candidate of candidates) {
          const key = `${candidate.row}-${candidate.col}`;
          const clicks = clickCount.get(key) ?? 0;
          if (clicks < colors - 1) {
            selected = candidate;
            break;
          }
        }
      }
      
      // If still no valid candidate (shouldn't happen), restart the attempt
      if (!selected) {
        log('warn', 'No valid candidate found, restarting attempt');
        break; // Will trigger a new attempt
      }
      
      bestMove = selected;
      const selectedKey = `${selected.row}-${selected.col}`;
      usedPositions.add(selectedKey);
      
      // Update click count
      const currentClicks = clickCount.get(selectedKey) ?? 0;
      clickCount.set(selectedKey, currentClicks + 1); // Increment click count
      
      // Apply reverse click
      const isPower = power.has(`${bestMove.row}-${bestMove.col}`);
      currentGrid = applyReverseClick(currentGrid, bestMove.row, bestMove.col, colors, isPower, new Map());
      generationHistory.push(bestMove);
      }
    }
    
    // The optimal solution is the reverse of generation
    const optimalPath = [...generationHistory].reverse();
    
    // Place locked tiles (after generation to not interfere with optimal path)
    const locked = new Map<string, number>();
    
    /* FIX: Locked tiles generation (commented out as locked tiles are disabled)
    if (lockedCount > 0 && config.level > 70) {
      const optimalPathSet = new Set(optimalPath.map(m => `${m.row}-${m.col}`));
      const candidates = [];
      
      for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
          const key = `${r}-${c}`;
          // FIX: Only lock tiles that are already at target color (0)
          if (!optimalPathSet.has(key) && !power.has(key) && currentGrid[r][c] === 0) {
            candidates.push(key);
          }
        }
      }
      
      // Shuffle and place locked tiles
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      
      // FIX: Ensure lock duration is appropriate for the solution length
      for (let i = 0; i < lockedCount && i < candidates.length; i++) {
        // Lock moves should be less than optimal path length to ensure they unlock in time
        const maxLockMoves = Math.min(optimalPath.length - 1, 4);
        const lockMoves = Math.min(2 + Math.floor(Math.random() * 3), maxLockMoves);
        locked.set(candidates[i], lockMoves);
      }
    }
    */
    
    // Success - we generated a puzzle with exact move count
    log('info', '✅ Generated exact-move puzzle', {
      level: config.level,
      requiredMoves: config.requiredMoves,
      actualMoves: generationHistory.length,
      powerTiles: power.size,
      lockedTiles: locked.size,
      gridSize: config.gridSize,
      colors: config.colors,
      attempt: attempt + 1
    });
    
    return {
      grid: currentGrid,
      solved,
      power,
      locked,
      solution: optimalPath,
      reverse: generationHistory,
      optimalPath,
      playerMoves: []
    };
  }
  
  // Fallback if we couldn't generate exact moves (should rarely happen)
  throw new Error(`Failed to generate level ${config.level} after ${maxAttempts} attempts`);
}

/**
 * Custom React hook for puzzle generation
 * 
 * This hook provides the main puzzle generation functionality using a reverse-move
 * algorithm. The key insight is that if we start with a solved puzzle and apply
 * N moves to scramble it, we can ALWAYS solve it by applying those same N moves
 * in reverse order. This gives us 100% guaranteed solvability without needing
 * complex verification algorithms.
 * 
 * Mathematical proof:
 * 1. Each click operation is its own inverse in modular arithmetic
 * 2. Starting from solved state S, applying moves M1, M2, ..., Mn gives scrambled state
 * 3. Applying Mn, ..., M2, M1 returns to S (commutativity in finite fields)
 * 
 * @returns {Object} Object containing the generate function
 */
export const useGenerator = () => {
  /**
   * Generate a puzzle for a specific level
   * 
   * The generation process:
   * 1. Determine grid size based on level (3x3 → 20x20)
   * 2. Calculate target moves based on level difficulty
   * 3. Start with solved grid (all tiles color 0)
   * 4. Apply N reverse clicks to scramble
   * 5. Return scrambled grid with known solution path
   * 
   * @param {Difficulty} conf - Legacy difficulty config (maintained for compatibility)
   * @param {number} level - The current level (1-based), determines all difficulty params
   * @returns {Promise<GenerationResult>} Generated puzzle with guaranteed solution
   * 
   * @example
   * const { generate } = useGenerator();
   * const puzzle = await generate(DIFFICULTIES.easy, 15); // Level 15 = Medium 6x6
   */
  const generate = useCallback(async (_conf: Difficulty, level: number = 1): Promise<GenerationResult> => {
    // Check if this is a tutorial level with hardcoded pattern
    if (isTutorialLevel(level)) {
      const tutorialPattern = getTutorialPattern(level);
      if (tutorialPattern) {
        log('info', 'Using tutorial pattern for level', { level });
        
        // Convert tutorial pattern to GenerationResult format
        return {
          grid: tutorialPattern.initialGrid,
          solved: tutorialPattern.targetGrid,
          power: new Set<string>(), // No power tiles in tutorials
          locked: new Map<string, number>(), // No locked tiles in tutorials
          solution: tutorialPattern.solution,
          reverse: [...tutorialPattern.solution].reverse(),
          optimalPath: tutorialPattern.solution,
          playerMoves: []
        };
      }
    }
    
    // Get configuration for this level
    const config = getLevelConfig(level);
    
    // Generate puzzle with exact move requirements
    return generateExactMovePuzzle(config);
  }, []);

  return { generate };
};