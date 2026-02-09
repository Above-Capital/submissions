export type Vec = { x: number; y: number };

export type Difficulty = "easy" | "normal" | "hard";
export type Mode = "ai" | "local";

export type GameState = {
  w: number;
  h: number;
  paddleH: number;
  paddleW: number;
  ballR: number;
  left: { y: number; vy: number };
  right: { y: number; vy: number };
  ball: { x: number; y: number; vx: number; vy: number };
  scoreL: number;
  scoreR: number;
  started: boolean;
  paused: boolean;
  lastTick: number;
  rally: number;
  streakWinsVsAI: number;
};

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function createGame(w = 820, h = 520): GameState {
  const paddleH = 96;
  const paddleW = 14;
  const ballR = 8;
  return {
    w,
    h,
    paddleH,
    paddleW,
    ballR,
    left: { y: h / 2, vy: 0 },
    right: { y: h / 2, vy: 0 },
    ball: { x: w / 2, y: h / 2, vx: 0, vy: 0 },
    scoreL: 0,
    scoreR: 0,
    started: false,
    paused: false,
    lastTick: 0,
    rally: 0,
    streakWinsVsAI: 0,
  };
}

export function serve(state: GameState, dir: -1 | 1) {
  const speed = 360;
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  return {
    ...state,
    ball: {
      x: state.w / 2,
      y: state.h / 2,
      vx: Math.cos(angle) * speed * dir,
      vy: Math.sin(angle) * speed,
    },
    rally: 0,
  };
}

export function resetRound(state: GameState) {
  return {
    ...state,
    left: { ...state.left, y: state.h / 2, vy: 0 },
    right: { ...state.right, y: state.h / 2, vy: 0 },
    ball: { ...state.ball, x: state.w / 2, y: state.h / 2, vx: 0, vy: 0 },
    started: false,
    paused: false,
    rally: 0,
  };
}

export function aiTargetY(state: GameState, diff: Difficulty) {
  // naive prediction: follow ball y with lag + inaccuracy
  const lag = diff === "easy" ? 0.16 : diff === "hard" ? 0.06 : 0.11;
  const noise = diff === "easy" ? 42 : diff === "hard" ? 14 : 26;
  const target = state.ball.y + (Math.random() - 0.5) * noise;
  return state.right.y + (target - state.right.y) * (1 - lag);
}

export function tick(
  state: GameState,
  dt: number,
  input: {
    leftUp: boolean;
    leftDown: boolean;
    rightUp: boolean;
    rightDown: boolean;
    mode: Mode;
    difficulty: Difficulty;
  }
) {
  if (!state.started || state.paused) return state;

  const paddleSpeed = 520;
  const next = { ...state };

  // paddles
  const leftVy = (input.leftDown ? 1 : 0) - (input.leftUp ? 1 : 0);
  next.left = {
    ...next.left,
    vy: leftVy * paddleSpeed,
    y: clamp(next.left.y + leftVy * paddleSpeed * dt, next.paddleH / 2, next.h - next.paddleH / 2),
  };

  if (input.mode === "local") {
    const rightVy = (input.rightDown ? 1 : 0) - (input.rightUp ? 1 : 0);
    next.right = {
      ...next.right,
      vy: rightVy * paddleSpeed,
      y: clamp(next.right.y + rightVy * paddleSpeed * dt, next.paddleH / 2, next.h - next.paddleH / 2),
    };
  } else {
    // AI
    const maxAI = input.difficulty === "easy" ? 420 : input.difficulty === "hard" ? 640 : 520;
    const ty = aiTargetY(next, input.difficulty);
    const diff = clamp(ty - next.right.y, -maxAI * dt, maxAI * dt);
    next.right = {
      ...next.right,
      vy: diff / dt,
      y: clamp(next.right.y + diff, next.paddleH / 2, next.h - next.paddleH / 2),
    };
  }

  // ball
  let bx = next.ball.x + next.ball.vx * dt;
  let by = next.ball.y + next.ball.vy * dt;
  let vx = next.ball.vx;
  let vy = next.ball.vy;

  // wall bounce
  if (by - next.ballR < 0) {
    by = next.ballR;
    vy *= -1;
  }
  if (by + next.ballR > next.h) {
    by = next.h - next.ballR;
    vy *= -1;
  }

  // paddle collision helpers
  const leftX = 34;
  const rightX = next.w - 34;

  // left paddle
  const lpTop = next.left.y - next.paddleH / 2;
  const lpBot = next.left.y + next.paddleH / 2;
  if (
    vx < 0 &&
    bx - next.ballR <= leftX + next.paddleW / 2 &&
    bx - next.ballR >= leftX - next.paddleW / 2 - 10 &&
    by >= lpTop - 4 &&
    by <= lpBot + 4
  ) {
    bx = leftX + next.paddleW / 2 + next.ballR;
    const t = (by - next.left.y) / (next.paddleH / 2);
    const angle = t * 0.85;
    const speed = Math.min(900, Math.hypot(vx, vy) * 1.05 + 18);
    vx = Math.abs(Math.cos(angle) * speed);
    vy = Math.sin(angle) * speed + next.left.vy * 0.2;
    next.rally += 1;
  }

  // right paddle
  const rpTop = next.right.y - next.paddleH / 2;
  const rpBot = next.right.y + next.paddleH / 2;
  if (
    vx > 0 &&
    bx + next.ballR >= rightX - next.paddleW / 2 &&
    bx + next.ballR <= rightX + next.paddleW / 2 + 10 &&
    by >= rpTop - 4 &&
    by <= rpBot + 4
  ) {
    bx = rightX - next.paddleW / 2 - next.ballR;
    const t = (by - next.right.y) / (next.paddleH / 2);
    const angle = t * 0.85;
    const speed = Math.min(900, Math.hypot(vx, vy) * 1.05 + 18);
    vx = -Math.abs(Math.cos(angle) * speed);
    vy = Math.sin(angle) * speed + next.right.vy * 0.2;
    next.rally += 1;
  }

  // score
  if (bx < -40) {
    next.scoreR += 1;
    return serve({ ...next }, 1);
  }
  if (bx > next.w + 40) {
    next.scoreL += 1;
    return serve({ ...next }, -1);
  }

  next.ball = { x: bx, y: by, vx, vy };
  return next;
}
