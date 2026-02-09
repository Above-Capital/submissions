export type Side = "left" | "right";

export type Difficulty = "chill" | "classic" | "insane";

export type GameMode = "solo" | "vs";

export type Controls = "keyboard" | "touch";

export type Settings = {
  mode: GameMode;
  difficulty: Difficulty;
  bestOf: 3 | 5 | 7;
  sound: boolean;
  reduceMotion: boolean;
  showTrail: boolean;
  controls: Controls;
};

export type InputState = {
  leftUp: boolean;
  leftDown: boolean;
  rightUp: boolean;
  rightDown: boolean;
  pointerActive: boolean;
  pointerYNorm: number; // 0..1
};

export type Score = { left: number; right: number };

export type GamePhase = "ready" | "playing" | "paused" | "point" | "match_over";

export type World = {
  w: number;
  h: number;

  paddleW: number;
  paddleH: number;
  paddleInset: number;

  ballR: number;

  // entities
  leftY: number;
  rightY: number;
  leftVy: number;
  rightVy: number;

  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;

  // visuals
  trail: Array<{ x: number; y: number; t: number }>;
};

export type GameState = {
  phase: GamePhase;
  world: World;
  score: Score;
  lastPoint?: Side;
  serveTo: Side;
  rally: number;
  maxBallSpeed: number;
  paddleSpeed: number;
  aiStrength: number;
  startedAtMs: number;
  updatedAtMs: number;
  winner?: Side;
};

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function createInitialWorld(w: number, h: number): World {
  const paddleW = Math.max(10, Math.floor(w * 0.02));
  const paddleH = Math.max(72, Math.floor(h * 0.18));
  const paddleInset = Math.max(14, Math.floor(w * 0.04));
  const ballR = Math.max(7, Math.floor(Math.min(w, h) * 0.015));

  const leftY = h / 2;
  const rightY = h / 2;

  return {
    w,
    h,
    paddleW,
    paddleH,
    paddleInset,
    ballR,
    leftY,
    rightY,
    leftVy: 0,
    rightVy: 0,
    ballX: w / 2,
    ballY: h / 2,
    ballVx: 0,
    ballVy: 0,
    trail: [],
  };
}

export function difficultyParams(difficulty: Difficulty) {
  switch (difficulty) {
    case "chill":
      return { paddleSpeed: 640, maxBallSpeed: 900, aiStrength: 0.65, serveSpeed: 420 };
    case "classic":
      return { paddleSpeed: 820, maxBallSpeed: 1250, aiStrength: 0.82, serveSpeed: 520 };
    case "insane":
      return { paddleSpeed: 1020, maxBallSpeed: 1650, aiStrength: 0.93, serveSpeed: 640 };
  }
}

export function createGameState(
  worldW: number,
  worldH: number,
  settings: Settings,
  nowMs: number
): GameState {
  const world = createInitialWorld(worldW, worldH);
  const { paddleSpeed, maxBallSpeed, aiStrength } = difficultyParams(settings.difficulty);

  return {
    phase: "ready",
    world,
    score: { left: 0, right: 0 },
    serveTo: "left",
    rally: 0,
    maxBallSpeed,
    paddleSpeed,
    aiStrength,
    startedAtMs: nowMs,
    updatedAtMs: nowMs,
  };
}

export function resetForServe(state: GameState, serveTo: Side, settings: Settings) {
  const w = state.world;
  w.ballX = w.w / 2;
  w.ballY = w.h / 2;

  const { serveSpeed } = difficultyParams(settings.difficulty);
  const dir = serveTo === "left" ? -1 : 1;
  // slight randomness
  const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
  w.ballVx = Math.cos(angle) * serveSpeed * dir;
  w.ballVy = Math.sin(angle) * serveSpeed;

  state.rally = 0;
  state.phase = "playing";
  state.serveTo = serveTo;
}

function circleRectCollide(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function reflectFromPaddle(
  state: GameState,
  side: Side,
  paddleCenterY: number,
  contactY: number
) {
  const w = state.world;
  const rel = clamp((contactY - paddleCenterY) / (w.paddleH / 2), -1, 1);
  const speed = clamp(Math.hypot(w.ballVx, w.ballVy) * 1.05, 420, state.maxBallSpeed);

  // Max bounce angle ~60 deg
  const maxAngle = (60 * Math.PI) / 180;
  const theta = rel * maxAngle;
  const dir = side === "left" ? 1 : -1;

  w.ballVx = Math.cos(theta) * speed * dir;
  w.ballVy = Math.sin(theta) * speed;

  state.rally += 1;
}

export function step(state: GameState, input: InputState, settings: Settings, dt: number, nowMs: number) {
  const w = state.world;
  state.updatedAtMs = nowMs;

  // paddles
  const speed = state.paddleSpeed;
  const leftTargetVy = (input.leftUp ? -1 : 0) + (input.leftDown ? 1 : 0);
  w.leftVy = leftTargetVy * speed;

  let rightVy = (input.rightUp ? -1 : 0) + (input.rightDown ? 1 : 0);

  // touch controls: move left paddle to pointer
  if (settings.controls === "touch" && input.pointerActive) {
    const ty = input.pointerYNorm * w.h;
    const diff = ty - w.leftY;
    w.leftVy = clamp(diff * 8, -speed, speed);
  }

  // AI for solo: control right paddle
  if (settings.mode === "solo") {
    // predictive-ish: aim slightly toward ball with smoothing
    const aimY = w.ballY + w.ballVy * 0.12;
    const err = aimY - w.rightY;
    const ai = state.aiStrength;
    const desired = clamp(err * 6 * ai, -speed, speed);
    w.rightVy = lerp(w.rightVy, desired, 0.18);
  } else {
    w.rightVy = rightVy * speed;
    if (settings.controls === "touch" && input.pointerActive) {
      // two-player touch: right side follows pointer too, but only when pointer on right half
      const ty = input.pointerYNorm * w.h;
      // we cannot reliably detect x in a generic input, so keep keyboard for vs-touch.
      // (UI will recommend keyboard for VS mode.)
      void ty;
    }
  }

  w.leftY = clamp(w.leftY + w.leftVy * dt, w.paddleH / 2, w.h - w.paddleH / 2);
  w.rightY = clamp(w.rightY + w.rightVy * dt, w.paddleH / 2, w.h - w.paddleH / 2);

  if (state.phase !== "playing") return;

  // ball
  w.ballX += w.ballVx * dt;
  w.ballY += w.ballVy * dt;

  // trail
  if (settings.showTrail) {
    w.trail.push({ x: w.ballX, y: w.ballY, t: nowMs });
    const cutoff = nowMs - 250;
    while (w.trail.length && w.trail[0]!.t < cutoff) w.trail.shift();
  } else {
    w.trail = [];
  }

  // wall collisions
  if (w.ballY - w.ballR <= 0) {
    w.ballY = w.ballR;
    w.ballVy = Math.abs(w.ballVy);
  } else if (w.ballY + w.ballR >= w.h) {
    w.ballY = w.h - w.ballR;
    w.ballVy = -Math.abs(w.ballVy);
  }

  // paddle rects
  const leftRect = {
    x: w.paddleInset,
    y: w.leftY - w.paddleH / 2,
    w: w.paddleW,
    h: w.paddleH,
  };
  const rightRect = {
    x: w.w - w.paddleInset - w.paddleW,
    y: w.rightY - w.paddleH / 2,
    w: w.paddleW,
    h: w.paddleH,
  };

  // left paddle
  if (w.ballVx < 0 && circleRectCollide(w.ballX, w.ballY, w.ballR, leftRect.x, leftRect.y, leftRect.w, leftRect.h)) {
    w.ballX = leftRect.x + leftRect.w + w.ballR + 0.5;
    reflectFromPaddle(state, "left", w.leftY, w.ballY);
  }

  // right paddle
  if (w.ballVx > 0 && circleRectCollide(w.ballX, w.ballY, w.ballR, rightRect.x, rightRect.y, rightRect.w, rightRect.h)) {
    w.ballX = rightRect.x - w.ballR - 0.5;
    reflectFromPaddle(state, "right", w.rightY, w.ballY);
  }

  // score
  if (w.ballX + w.ballR < 0) {
    state.score.right += 1;
    state.lastPoint = "right";
    state.phase = "point";
  } else if (w.ballX - w.ballR > w.w) {
    state.score.left += 1;
    state.lastPoint = "left";
    state.phase = "point";
  }
}

export function matchPointTarget(bestOf: 3 | 5 | 7) {
  return Math.floor(bestOf / 2) + 1;
}

export function checkMatchOver(score: Score, bestOf: 3 | 5 | 7): Side | null {
  const target = matchPointTarget(bestOf);
  if (score.left >= target) return "left";
  if (score.right >= target) return "right";
  return null;
}
