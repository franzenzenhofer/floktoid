import { useState, useCallback } from 'react';
import { effectMatrix, applyEffect, isWinningState } from '../utils/grid';

export interface SolveResult {
  solution: { row: number; col: number }[];
  statesExplored: number;
}

export const bfsSolve = async (
  initial: number[][],
  power: Set<string>,
  locked: Map<string, number>,
  palette: number,
): Promise<SolveResult> => {
  const visited = new Set<string>();
  const queue = [{ state: initial, path: [] as { row: number; col: number }[] }];
  const gridToString = (g: number[][]) => g.map(r => r.join('')).join('|');
  const MAX_STATES = 10000;
  const MAX_DEPTH = 30;

  while (queue.length && visited.size < MAX_STATES) {
    const { state, path } = queue.shift()!;
    
    if (isWinningState(state)) {
      return { solution: path, statesExplored: visited.size };
    }

    const key = gridToString(state);
    if (visited.has(key) || path.length >= MAX_DEPTH) continue;
    visited.add(key);

    // Try all moves
    for (let r = 0; r < state.length; r++) {
      for (let c = 0; c < state[0].length; c++) {
        if (locked.has(`${r}-${c}`)) continue;
        
        const effect = effectMatrix(r, c, state.length, power.has(`${r}-${c}`));
        const nextState = applyEffect(state, effect, locked, palette);
        const nextKey = gridToString(nextState);
        
        if (!visited.has(nextKey)) {
          queue.push({
            state: nextState,
            path: [...path, { row: r, col: c }]
          });
        }
      }
    }
  }

  return { solution: [], statesExplored: visited.size };
};

// Hook for interactive solution stepping
export const useSolution = (solution: { row: number; col: number }[]) => {
  const [step, setStep] = useState(0);
  const atEnd = step >= solution.length;

  const next = useCallback(() => !atEnd && setStep(s => s + 1), [atEnd]);
  const reset = useCallback(() => setStep(0), []);
  const current = solution[step];

  return { step, atEnd, next, reset, current };
};