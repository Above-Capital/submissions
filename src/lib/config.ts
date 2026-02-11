import { Difficulty, GameConfig } from "./types";

export function configFor(d: Difficulty): GameConfig {
  if (d === "easy") {
    return {
      difficulty: d,
      cols: 4,
      rows: 3,
      pairCount: 6,
      previewMs: 1200,
      allowMismatchPeekMs: 700,
    };
  }
  if (d === "hard") {
    return {
      difficulty: d,
      cols: 6,
      rows: 4,
      pairCount: 12,
      previewMs: 900,
      allowMismatchPeekMs: 450,
    };
  }
  return {
    difficulty: d,
    cols: 5,
    rows: 4,
    pairCount: 10,
    previewMs: 1050,
    allowMismatchPeekMs: 550,
  };
}
