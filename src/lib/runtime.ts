import {
  createGame as create,
  spawnWave,
  tick as tickCore,
  type GameState,
} from "@/lib/game";

export type { GameState };

export function createGame() {
  return create();
}

export function startGame(state: GameState) {
  if (state.over) return create();
  return { ...state, started: true, paused: false, over: false };
}

export function resetRoundAndKeepScore(state: GameState) {
  const fresh = create(state.w, state.h);
  return {
    ...fresh,
    score: state.score,
    level: state.level,
    lives: 3,
  };
}

export function tick(
  state: GameState,
  dt: number,
  input: { left: boolean; right: boolean; shoot: boolean },
  reducedMotion: boolean
) {
  return tickCore(state, dt, { ...input, reducedMotion });
}
