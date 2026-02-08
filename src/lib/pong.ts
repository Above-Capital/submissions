export type PongMode = "ai" | "local";

export type PongSettings = {
  mode: PongMode;
  targetScore: number;
  difficulty: number; // 0..1 (AI strength)
  sound: boolean;
};

export type PongState = {
  t: number;
  phase: "menu" | "playing" | "paused" | "goal" | "gameover";
  winner?: "left" | "right";

  // world units in px
  w: number;
  h: number;

  paddleH: number;
  paddleW: number;
  ballR: number;

  leftY: number;
  rightY: number;
  leftV: number;
  rightV: number;

  ballX: number;
  ballY: number;
  ballVX: number;
  ballVY: number;

  leftScore: number;
  rightScore: number;

  // FX
  shake: number;
  lastGoalAt?: number;

  settings: PongSettings;
  stats: {
    bestStreak: number;
    bestWinMargin: number;
  };
};

type Input = {
  // normalized -1..1 for each paddle
  leftAxis: number;
  rightAxis: number;
  pausePressed: boolean;
  servePressed: boolean;
};

export function createInitialPong(): PongState {
  const w = 960;
  const h = 540;
  const s: PongState = {
    t: 0,
    phase: "menu",
    w,
    h,
    paddleH: 108,
    paddleW: 12,
    ballR: 8,
    leftY: h / 2,
    rightY: h / 2,
    leftV: 0,
    rightV: 0,
    ballX: w / 2,
    ballY: h / 2,
    ballVX: 0,
    ballVY: 0,
    leftScore: 0,
    rightScore: 0,
    shake: 0,
    settings: { mode: "ai", targetScore: 7, difficulty: 0.55, sound: true },
    stats: { bestStreak: 0, bestWinMargin: 0 },
  };
  return s;
}

export function resetMatch(s: PongState) {
  s.phase = "menu";
  s.winner = undefined;
  s.leftScore = 0;
  s.rightScore = 0;
  s.leftY = s.h / 2;
  s.rightY = s.h / 2;
  s.leftV = 0;
  s.rightV = 0;
  resetBall(s, Math.random() < 0.5 ? -1 : 1);
}

export function startMatch(s: PongState) {
  s.phase = "playing";
  // serve
  resetBall(s, Math.random() < 0.5 ? -1 : 1);
}

function resetBall(s: PongState, dir: -1 | 1) {
  s.ballX = s.w / 2;
  s.ballY = s.h / 2;
  const base = 420;
  const a = (Math.random() * 0.7 - 0.35) * Math.PI;
  s.ballVX = Math.cos(a) * base * dir;
  s.ballVY = Math.sin(a) * base;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function tickPong(s: PongState, input: Input, dt: number) {
  s.t += dt;
  s.shake = Math.max(0, s.shake - dt * 10);

  if (input.pausePressed) {
    if (s.phase === "playing") s.phase = "paused";
    else if (s.phase === "paused") s.phase = "playing";
  }

  if (s.phase === "menu") {
    if (input.servePressed) startMatch(s);
    return;
  }

  if (s.phase === "paused") return;

  if (s.phase === "goal") {
    if (input.servePressed) {
      s.phase = "playing";
      resetBall(s, Math.random() < 0.5 ? -1 : 1);
    }
    return;
  }

  if (s.phase === "gameover") {
    if (input.servePressed) resetMatch(s);
    return;
  }

  // AI for right paddle if mode=ai
  let rightAxis = input.rightAxis;
  if (s.settings.mode === "ai") {
    // AI predicts ball y when it reaches right paddle x.
    const timeToReach = (s.w - 56 - s.ballX) / Math.max(60, s.ballVX);
    const predictedY = s.ballY + s.ballVY * timeToReach;
    const noise = (1 - s.settings.difficulty) * 70;
    const target = clamp(predictedY + (Math.random() - 0.5) * noise, 0, s.h);
    const err = target - s.rightY;
    const desired = clamp(err / 120, -1, 1);
    rightAxis = lerp(rightAxis, desired, clamp(dt * (1.2 + s.settings.difficulty * 2.2), 0, 1));
  }

  // paddles
  const paddleSpeed = 520;
  const lp = input.leftAxis;
  const rp = rightAxis;

  s.leftV = lerp(s.leftV, lp * paddleSpeed, clamp(dt * 10, 0, 1));
  s.rightV = lerp(s.rightV, rp * paddleSpeed, clamp(dt * 10, 0, 1));

  s.leftY = clamp(s.leftY + s.leftV * dt, s.paddleH / 2 + 10, s.h - s.paddleH / 2 - 10);
  s.rightY = clamp(s.rightY + s.rightV * dt, s.paddleH / 2 + 10, s.h - s.paddleH / 2 - 10);

  // ball
  s.ballX += s.ballVX * dt;
  s.ballY += s.ballVY * dt;

  // top/bottom
  if (s.ballY < 18 + s.ballR) {
    s.ballY = 18 + s.ballR;
    s.ballVY *= -1;
    s.shake = 0.45;
  }
  if (s.ballY > s.h - 18 - s.ballR) {
    s.ballY = s.h - 18 - s.ballR;
    s.ballVY *= -1;
    s.shake = 0.45;
  }

  // paddles collision
  const leftX = 38;
  const rightX = s.w - 38;

  // left paddle
  if (s.ballVX < 0 && s.ballX - s.ballR < leftX + s.paddleW / 2) {
    const dy = s.ballY - s.leftY;
    if (Math.abs(dy) <= s.paddleH / 2 + s.ballR) {
      s.ballX = leftX + s.paddleW / 2 + s.ballR;
      const hit = dy / (s.paddleH / 2);
      const speedUp = 1.04;
      const outSpeed = Math.min(860, Math.hypot(s.ballVX, s.ballVY) * speedUp);
      const angle = hit * 0.9;
      s.ballVX = Math.cos(angle) * outSpeed;
      s.ballVY = Math.sin(angle) * outSpeed + s.leftV * 0.22;
      s.shake = 0.75;
    }
  }

  // right paddle
  if (s.ballVX > 0 && s.ballX + s.ballR > rightX - s.paddleW / 2) {
    const dy = s.ballY - s.rightY;
    if (Math.abs(dy) <= s.paddleH / 2 + s.ballR) {
      s.ballX = rightX - s.paddleW / 2 - s.ballR;
      const hit = dy / (s.paddleH / 2);
      const speedUp = 1.04;
      const outSpeed = Math.min(860, Math.hypot(s.ballVX, s.ballVY) * speedUp);
      const angle = Math.PI - hit * 0.9;
      s.ballVX = Math.cos(angle) * outSpeed;
      s.ballVY = Math.sin(angle) * outSpeed + s.rightV * 0.22;
      s.shake = 0.75;
    }
  }

  // goal
  if (s.ballX < -40) {
    s.rightScore += 1;
    s.lastGoalAt = s.t;
    s.shake = 1;
    if (s.rightScore >= s.settings.targetScore) {
      s.phase = "gameover";
      s.winner = "right";
      s.stats.bestWinMargin = Math.max(s.stats.bestWinMargin, s.rightScore - s.leftScore);
    } else {
      s.phase = "goal";
    }
  }

  if (s.ballX > s.w + 40) {
    s.leftScore += 1;
    s.lastGoalAt = s.t;
    s.shake = 1;
    if (s.leftScore >= s.settings.targetScore) {
      s.phase = "gameover";
      s.winner = "left";
      s.stats.bestWinMargin = Math.max(s.stats.bestWinMargin, s.leftScore - s.rightScore);
    } else {
      s.phase = "goal";
    }
  }
}
