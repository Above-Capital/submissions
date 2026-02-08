export type Difficulty = "chill" | "classic" | "panic";

export type Settings = {
  difficulty: Difficulty;
  sound: boolean;
  mobileButtons: boolean;
};

export type Phase = "menu" | "playing" | "paused" | "wave_clear" | "gameover";

export type Bullet = { x: number; y: number; vx: number; vy: number; r: number; from: "player" | "enemy" };
export type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; r: number };

export type Invader = {
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  kind: 0 | 1 | 2;
  alive: boolean;
};

export type ShieldCell = { hp: number };

export type State = {
  t: number;
  phase: Phase;

  // world
  w: number;
  h: number;

  // player
  px: number;
  py: number;
  pv: number;
  pr: number;
  lives: number;
  cooldown: number;
  overheat: number; // 0..1

  // invaders
  invaders: Invader[];
  invDir: 1 | -1;
  invSpeed: number;
  invStepDown: number;
  invFireCd: number;
  invMoveAcc: number;

  // bullets / fx
  bullets: Bullet[];
  particles: Particle[];
  shake: number;

  // scoring
  score: number;
  combo: number;
  multiplier: number;
  hiScore: number;
  wave: number;
  waveClearAt: number;

  // shields
  shieldCols: number;
  shieldRows: number;
  shields: { x: number; y: number; grid: ShieldCell[] }[];

  settings: Settings;
};

type Input = {
  left: boolean;
  right: boolean;
  fire: boolean;
  pausePressed: boolean;
  restartPressed: boolean;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function createInitialState(): State {
  const w = 960;
  const h = 640;
  const s: State = {
    t: 0,
    phase: "menu",
    w,
    h,
    px: w / 2,
    py: h - 64,
    pv: 0,
    pr: 14,
    lives: 3,
    cooldown: 0,
    overheat: 0,
    invaders: [],
    invDir: 1,
    invSpeed: 42,
    invStepDown: 18,
    invFireCd: 0.9,
    invMoveAcc: 0,
    bullets: [],
    particles: [],
    shake: 0,
    score: 0,
    combo: 0,
    multiplier: 1,
    hiScore: 0,
    wave: 1,
    waveClearAt: 0,
    shieldCols: 18,
    shieldRows: 10,
    shields: [],
    settings: { difficulty: "classic", sound: true, mobileButtons: true },
  };

  spawnWave(s);
  return s;
}

export function resetRun(s: State) {
  const hi = s.hiScore;
  const settings = s.settings;
  Object.assign(s, createInitialState());
  s.hiScore = hi;
  s.settings = settings;
  s.phase = "menu";
}

export function startRun(s: State) {
  s.phase = "playing";
}

export function togglePause(s: State) {
  if (s.phase === "playing") s.phase = "paused";
  else if (s.phase === "paused") s.phase = "playing";
}

export function setSettings(s: State, patch: Partial<Settings>) {
  s.settings = { ...s.settings, ...patch };
}

function diffTuning(d: Difficulty) {
  if (d === "chill") return { playerSpeed: 420, fireRate: 0.22, enemyFire: 1.25, enemySpeed: 36, overheatGain: 0.34 };
  if (d === "panic") return { playerSpeed: 520, fireRate: 0.16, enemyFire: 0.70, enemySpeed: 56, overheatGain: 0.52 };
  return { playerSpeed: 470, fireRate: 0.19, enemyFire: 0.95, enemySpeed: 44, overheatGain: 0.42 };
}

function spawnWave(s: State) {
  s.invaders = [];
  s.invDir = 1;
  s.invMoveAcc = 0;
  s.invSpeed = diffTuning(s.settings.difficulty).enemySpeed + (s.wave - 1) * 4;
  s.invFireCd = diffTuning(s.settings.difficulty).enemyFire;

  const cols = 11;
  const rows = 5;
  const padX = 54;
  const padY = 70;
  const startX = (s.w - (cols - 1) * padX) / 2;
  const startY = 90;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kind = (r === 0 ? 2 : r < 3 ? 1 : 0) as 0 | 1 | 2;
      s.invaders.push({
        x: startX + c * padX,
        y: startY + r * padY,
        w: 34,
        h: 22,
        hp: kind === 2 ? 2 : 1,
        kind,
        alive: true,
      });
    }
  }

  // shields
  s.shields = [];
  const shieldCount = 4;
  for (let i = 0; i < shieldCount; i++) {
    const x = (s.w * (i + 1)) / (shieldCount + 1);
    const y = s.h - 170;
    const grid = new Array(s.shieldCols * s.shieldRows)
      .fill(0)
      .map(() => ({ hp: 2 }));

    // carve arch
    for (let rr = 0; rr < s.shieldRows; rr++) {
      for (let cc = 0; cc < s.shieldCols; cc++) {
        const idx = rr * s.shieldCols + cc;
        const nx = (cc / (s.shieldCols - 1)) * 2 - 1;
        const ny = rr / (s.shieldRows - 1);
        const hole = ny > 0.55 && Math.abs(nx) < 0.35;
        const corner = ny < 0.2 && (Math.abs(nx) > 0.85);
        if (hole || corner) grid[idx].hp = 0;
      }
    }

    s.shields.push({ x, y, grid });
  }

  // reset bullets/heat but keep score
  s.bullets = [];
  s.cooldown = 0;
  s.overheat = 0;
}

function aabbCircleHit(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
  const x = clamp(cx, rx - rw / 2, rx + rw / 2);
  const y = clamp(cy, ry - rh / 2, ry + rh / 2);
  const dx = cx - x;
  const dy = cy - y;
  return dx * dx + dy * dy <= r * r;
}

function spawnParticles(s: State, x: number, y: number, c: string, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 70 + Math.random() * 260;
    s.particles.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.25 + Math.random() * 0.35,
      max: 0.6,
      c,
      r: 1 + Math.random() * 2.4,
    });
  }
}

function invaderColor(kind: 0 | 1 | 2) {
  if (kind === 2) return "#22d3ee";
  if (kind === 1) return "#a78bfa";
  return "#34d399";
}

export function tick(s: State, input: Input, dt: number) {
  s.t += dt;
  s.shake = Math.max(0, s.shake - dt * 8);

  if (input.pausePressed) togglePause(s);
  if (input.restartPressed && (s.phase === "menu" || s.phase === "gameover")) resetRun(s);

  if (s.phase === "menu") {
    if (input.fire) startRun(s);
    return;
  }
  if (s.phase === "paused") return;

  if (s.phase === "wave_clear") {
    // brief intermission
    if (s.t - s.waveClearAt > 0.75) {
      s.wave += 1;
      spawnWave(s);
      s.phase = "playing";
    }
    return;
  }

  if (s.phase === "gameover") {
    if (input.fire) resetRun(s);
    return;
  }

  // player
  const tune = diffTuning(s.settings.difficulty);
  const ax = (input.left ? -1 : 0) + (input.right ? 1 : 0);
  const targetV = ax * tune.playerSpeed;
  s.pv += (targetV - s.pv) * (1 - Math.pow(0.001, dt));
  s.px = clamp(s.px + s.pv * dt, 40, s.w - 40);

  s.cooldown = Math.max(0, s.cooldown - dt);
  // overheat cools
  s.overheat = clamp(s.overheat - dt * 0.28, 0, 1);

  const canShoot = s.cooldown <= 0 && s.overheat < 0.96;
  if (input.fire && canShoot) {
    s.bullets.push({ x: s.px, y: s.py - 18, vx: 0, vy: -680, r: 4, from: "player" });
    s.cooldown = tune.fireRate;
    s.overheat = clamp(s.overheat + tune.overheatGain * tune.fireRate, 0, 1);
  }

  // invader movement
  const aliveInv = s.invaders.filter((v) => v.alive);
  if (aliveInv.length === 0) {
    s.phase = "wave_clear";
    s.waveClearAt = s.t;
    s.multiplier = Math.min(6, s.multiplier + 1);
    return;
  }

  const minX = Math.min(...aliveInv.map((v) => v.x - v.w / 2));
  const maxX = Math.max(...aliveInv.map((v) => v.x + v.w / 2));
  const edgePad = 30;

  const speed = s.invSpeed + (1 - aliveInv.length / (11 * 5)) * 90;
  for (const v of aliveInv) v.x += s.invDir * speed * dt;

  if (minX < edgePad || maxX > s.w - edgePad) {
    s.invDir = (s.invDir === 1 ? -1 : 1) as 1 | -1;
    for (const v of aliveInv) v.y += s.invStepDown;
    s.shake = 0.25;
  }

  // enemy fire
  s.invMoveAcc += dt;
  const fireRate = s.invFireCd * (0.8 + aliveInv.length / (11 * 5));
  if (s.invMoveAcc > fireRate) {
    s.invMoveAcc = 0;

    // pick a random column bottommost
    const cols = new Map<number, Invader>();
    for (const v of aliveInv) {
      const key = Math.round(v.x / 10);
      const prev = cols.get(key);
      if (!prev || v.y > prev.y) cols.set(key, v);
    }
    const choices = Array.from(cols.values());
    const shooter = choices[Math.floor(Math.random() * choices.length)];
    if (shooter) {
      s.bullets.push({ x: shooter.x, y: shooter.y + 18, vx: 0, vy: 420 + s.wave * 8, r: 4, from: "enemy" });
    }
  }

  // bullets update
  for (const b of s.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // particles
  for (const p of s.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(0.12, dt);
    p.vy *= Math.pow(0.12, dt);
  }
  s.particles = s.particles.filter((p) => p.life > 0);

  // collisions
  const nextBullets: Bullet[] = [];
  for (const b of s.bullets) {
    if (b.y < -60 || b.y > s.h + 60) continue;

    let consumed = false;

    // shield hit
    for (const sh of s.shields) {
      if (consumed) break;
      const cellW = 4;
      const cellH = 4;
      const left = sh.x - (s.shieldCols * cellW) / 2;
      const top = sh.y - (s.shieldRows * cellH) / 2;
      // quick reject
      if (b.x < left - 8 || b.x > left + s.shieldCols * cellW + 8) continue;
      if (b.y < top - 8 || b.y > top + s.shieldRows * cellH + 8) continue;

      const cx = Math.floor((b.x - left) / cellW);
      const cy = Math.floor((b.y - top) / cellH);
      if (cx >= 0 && cx < s.shieldCols && cy >= 0 && cy < s.shieldRows) {
        const idx = cy * s.shieldCols + cx;
        const cell = sh.grid[idx];
        if (cell && cell.hp > 0) {
          cell.hp = Math.max(0, cell.hp - 1);
          spawnParticles(s, b.x, b.y, "#93c5fd", 6);
          s.shake = 0.25;
          consumed = true;
        }
      }
    }

    if (consumed) continue;

    if (b.from === "player") {
      for (const v of s.invaders) {
        if (!v.alive) continue;
        if (aabbCircleHit(b.x, b.y, b.r, v.x, v.y, v.w, v.h)) {
          v.hp -= 1;
          spawnParticles(s, v.x, v.y, invaderColor(v.kind), 14);
          s.shake = 0.45;
          consumed = true;

          if (v.hp <= 0) {
            v.alive = false;
            s.combo += 1;
            s.multiplier = clamp(1 + Math.floor(s.combo / 6), 1, 6);
            const base = v.kind === 2 ? 25 : v.kind === 1 ? 15 : 10;
            s.score += base * s.multiplier;
            s.hiScore = Math.max(s.hiScore, s.score);
          }
          break;
        }
      }
    } else {
      // enemy bullet hits player
      if (aabbCircleHit(b.x, b.y, b.r, s.px, s.py, 42, 22)) {
        spawnParticles(s, s.px, s.py, "#fb7185", 22);
        s.shake = 1;
        consumed = true;
        s.lives -= 1;
        s.combo = 0;
        s.multiplier = 1;
        // clear nearby enemy bullets
        s.bullets = s.bullets.filter((bb) => bb.from !== "enemy");
        if (s.lives <= 0) {
          s.phase = "gameover";
        }
      }
    }

    if (!consumed) nextBullets.push(b);
  }
  s.bullets = nextBullets;

  // lose if invaders reach player line
  const deepest = Math.max(...aliveInv.map((v) => v.y + v.h / 2));
  if (deepest > s.h - 130) {
    s.phase = "gameover";
  }
}
