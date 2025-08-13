const API_BASE = import.meta.env.DEV ? '/api' : '/api';

export interface GeneratePuzzleResponse {
  grid: number[][];
  solvedGrid: number[][];
  powerTiles: string[];
  lockedTiles: Record<string, number>;
  solution: { row: number; col: number }[];
  reverseMoves: { row: number; col: number }[];
  verified: boolean;
  difficulty: string;
}

export interface MoveResponse {
  grid: number[][];
  won: boolean;
  changedTiles: Array<{
    row: number;
    col: number;
    oldColor: number;
    newColor: number;
  }>;
}

export interface ScoreSubmission {
  name: string;
  score: number;
  moves: number;
  time: number;
  difficulty: string;
}

export const api = {
  async generatePuzzle(difficulty: string): Promise<GeneratePuzzleResponse> {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    });
    if (!response.ok) throw new Error('Failed to generate puzzle');
    return response.json();
  },

  async makeMove(
    grid: number[][],
    row: number,
    col: number,
    power: Set<string>,
    locked: Map<string, number>,
    colors: number
  ): Promise<MoveResponse> {
    const response = await fetch(`${API_BASE}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grid,
        row,
        col,
        power: Array.from(power),
        locked: Object.fromEntries(locked),
        colors,
      }),
    });
    if (!response.ok) throw new Error('Failed to process move');
    return response.json();
  },

  async submitScore(score: ScoreSubmission): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE}/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(score),
    });
    if (!response.ok) throw new Error('Failed to submit score');
    return response.json();
  },

  async getLeaderboard(difficulty: string): Promise<ScoreSubmission[]> {
    const response = await fetch(`${API_BASE}/leaderboard/${difficulty}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  },
};