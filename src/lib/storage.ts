import { GameState } from "./types";

const KEY = "match:state:v1";

const DEFAULT: GameState = {
  version: 1,
  difficulty: "standard",
  soundOn: true,
  best: {
    easy: { bestMoves: null, bestTimeMs: null },
    standard: { bestMoves: null, bestTimeMs: null },
    hard: { bestMoves: null, bestTimeMs: null },
  },
};

export function loadGameState(): GameState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return DEFAULT;
    return { ...DEFAULT, ...parsed } as GameState;
  } catch {
    return DEFAULT;
  }
}

export function saveGameState(st: GameState) {
  window.localStorage.setItem(KEY, JSON.stringify(st));
}
