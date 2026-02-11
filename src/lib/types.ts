export type Difficulty = "easy" | "standard" | "hard";

export type Card = {
  id: string;
  face: string;
  matched: boolean;
};

export type GameConfig = {
  difficulty: Difficulty;
  cols: number;
  rows: number;
  pairCount: number;
  previewMs: number;
  allowMismatchPeekMs: number;
};

export type BestScore = {
  bestTimeMs: number | null;
  bestMoves: number | null;
};

export type GameState = {
  version: 1;
  difficulty: Difficulty;
  best: Record<Difficulty, BestScore>;
  soundOn: boolean;
};
