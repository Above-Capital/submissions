export type Vec = { x: number; y: number };

export type Bullet = {
  id: string;
  pos: Vec;
  vel: Vec;
  from: "player" | "invader";
  r: number;
};

export type Invader = {
  id: string;
  pos: Vec;
  type: 0 | 1 | 2; // for score
  alive: boolean;
};

export type Particle = {
  id: string;
  pos: Vec;
  vel: Vec;
  life: number;
  color: string;
  size: number;
};

export type GameState = {
  w: number;
  h: number;
  started: boolean;
  paused: boolean;
  over: boolean;
  level: number;
  score: number;
  lives: number;
  waveCleared: boolean;
  player: { x: number; y: number; vx: number; cooldown: number };
  invaders: Invader[];
  invaderDir: 1 | -1;
  invaderSpeed: number;
  invaderStepDown: number;
  invaderBoundsPad: number;
  bullets: Bullet[];
  particles: Particle[];
  ufo: { active: boolean; x: number; y: number; vx: number; t: number };
  lastTick: number;
};

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function createGame(w = 860, h = 560): GameState {
  const playerY = h - 56;
  const base = {
    w,
    h,
    started: false,
    paused: false,
    over: false,
    level: 1,
    score: 0,
    lives: 3,
    waveCleared: false,
    player: { x: w / 2, y: playerY, vx: 0, cooldown: 0 },
    invaders: [],
    invaderDir: 1 as const,
    invaderSpeed: 26,
    invaderStepDown: 18,
    invaderBoundsPad: 70,
    bullets: [],
    particles: [],
    ufo: { active: false, x: -80, y: 64, vx: 140, t: 0 },
    lastTick: 0,
  };
  return spawnWave(base);
}

export function spawnWave(state: GameState): GameState {
  const cols = 11;
  const rows = 5;
  const spacingX = 54;
  const spacingY = 42;
  const startX = state.w / 2 - ((cols - 1) * spacingX) / 2;
  const startY = 110;

  const invaders: Invader[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const type: 0 | 1 | 2 = r === 0 ? 2 : r <= 2 ? 1 : 0;
      invaders.push({
        id: uid("inv"),
        pos: { x: startX + c * spacingX, y: startY + r * spacingY },
        type,
        alive: true,
      });
    }
  }

  const speed = 26 + (state.level - 1) * 6;

  return {
    ...state,
    started: false,
    paused: false,
    over: false,
    waveCleared: false,
    invaders,
    invaderDir: 1,
    invaderSpeed: speed,
    bullets: state.bullets.filter((b) => b.from === "player"),
    ufo: { active: false, x: -80, y: 64, vx: 140 + state.level * 6, t: 0 },
  };
}

function invaderScore(t: Invader["type"]) {
  return t === 2 ? 40 : t === 1 ? 20 : 10;
}

export function tick(
  state: GameState,
  dt: number,
  input: {
    left: boolean;
    right: boolean;
    shoot: boolean;
    reducedMotion: boolean;
  }
) {
  if (!state.started || state.paused || state.over) return state;

  let next: GameState = { ...state };

  // player
  const accel = 1400;
  const maxV = 520;
  let vx = next.player.vx;
  if (input.left) vx -= accel * dt;
  if (input.right) vx += accel * dt;
  vx *= 0.88;
  vx = clamp(vx, -maxV, maxV);

  const x = clamp(next.player.x + vx * dt, 48, next.w - 48);
  let cooldown = Math.max(0, next.player.cooldown - dt);

  next.player = { ...next.player, x, vx, cooldown };

  // shoot
  if (input.shoot && cooldown === 0) {
    next.bullets = [
      ...next.bullets,
      {
        id: uid("b"),
        pos: { x: next.player.x, y: next.player.y - 14 },
        vel: { x: 0, y: -620 },
        from: "player",
        r: 3,
      },
    ];
    next.player = { ...next.player, cooldown: 0.22 };
  }

  // invader movement
  const aliveInv = next.invaders.filter((i) => i.alive);
  if (aliveInv.length === 0) {
    next.waveCleared = true;
    next.level += 1;
    return spawnWave(next);
  }

  const leftMost = Math.min(...aliveInv.map((i) => i.pos.x));
  const rightMost = Math.max(...aliveInv.map((i) => i.pos.x));
  const pad = next.invaderBoundsPad;

  let dir = next.invaderDir;
  let shouldStepDown = false;

  if (dir === 1 && rightMost > next.w - pad) {
    dir = -1;
    shouldStepDown = true;
  } else if (dir === -1 && leftMost < pad) {
    dir = 1;
    shouldStepDown = true;
  }

  const speed = next.invaderSpeed + Math.max(0, (55 - aliveInv.length)) * 0.3;

  next.invaders = next.invaders.map((inv) => {
    if (!inv.alive) return inv;
    return {
      ...inv,
      pos: {
        x: inv.pos.x + dir * speed * dt,
        y: inv.pos.y + (shouldStepDown ? next.invaderStepDown : 0),
      },
    };
  });
  next.invaderDir = dir;

  // invader shoot (random from bottom-most columns)
  const shootChance = 0.9 + next.level * 0.18;
  if (Math.random() < dt * shootChance) {
    const columns = new Map<number, Invader>();
    for (const inv of next.invaders) {
      if (!inv.alive) continue;
      const key = Math.round(inv.pos.x / 10);
      const cur = columns.get(key);
      if (!cur || inv.pos.y > cur.pos.y) columns.set(key, inv);
    }
    const candidates = [...columns.values()];
    const shooter = candidates[Math.floor(Math.random() * candidates.length)];
    if (shooter) {
      next.bullets = [
        ...next.bullets,
        {
          id: uid("eb"),
          pos: { x: shooter.pos.x, y: shooter.pos.y + 16 },
          vel: { x: 0, y: 360 + next.level * 20 },
          from: "invader",
          r: 3,
        },
      ];
    }
  }

  // UFO spawn
  next.ufo = { ...next.ufo, t: next.ufo.t + dt };
  if (!next.ufo.active && next.ufo.t > 8 + Math.random() * 6) {
    next.ufo = {
      active: true,
      x: -80,
      y: 72,
      vx: 160 + next.level * 10,
      t: 0,
    };
  }
  if (next.ufo.active) {
    next.ufo = { ...next.ufo, x: next.ufo.x + next.ufo.vx * dt };
    if (next.ufo.x > next.w + 80) {
      next.ufo = { ...next.ufo, active: false, t: 0 };
    }
  }

  // move bullets
  next.bullets = next.bullets
    .map((b) => ({ ...b, pos: { x: b.pos.x + b.vel.x * dt, y: b.pos.y + b.vel.y * dt } }))
    .filter((b) => b.pos.y > -40 && b.pos.y < next.h + 40);

  // collisions
  const hitR = (a: Vec, ar: number, b: Vec, br: number) => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const rr = ar + br;
    return dx * dx + dy * dy <= rr * rr;
  };

  // bullets vs invaders
  for (const b of next.bullets) {
    if (b.from !== "player") continue;
    for (const inv of next.invaders) {
      if (!inv.alive) continue;
      if (hitR(b.pos, b.r, inv.pos, 16)) {
        inv.alive = false;
        next.score += invaderScore(inv.type);
        b.pos.y = -9999;
        // particles
        if (!input.reducedMotion) {
          next.particles.push(
            ...spawnBurst(inv.pos, inv.type === 2 ? "#fbbf24" : inv.type === 1 ? "#a78bfa" : "#22d3ee")
          );
        }
        break;
      }
    }
  }

  // bullets vs ufo
  if (next.ufo.active) {
    for (const b of next.bullets) {
      if (b.from !== "player") continue;
      if (hitR(b.pos, b.r, { x: next.ufo.x, y: next.ufo.y }, 18)) {
        next.ufo.active = false;
        b.pos.y = -9999;
        const bonus = 100 + Math.floor(Math.random() * 150);
        next.score += bonus;
        if (!input.reducedMotion) {
          next.particles.push(...spawnBurst({ x: next.ufo.x, y: next.ufo.y }, "#fb7185"));
        }
      }
    }
  }

  // enemy bullets vs player
  for (const b of next.bullets) {
    if (b.from !== "invader") continue;
    if (hitR(b.pos, b.r, { x: next.player.x, y: next.player.y }, 16)) {
      b.pos.y = 9999;
      next.lives -= 1;
      if (!input.reducedMotion) {
        next.particles.push(...spawnBurst({ x: next.player.x, y: next.player.y }, "#fb7185"));
      }
      if (next.lives <= 0) {
        next.over = true;
        next.started = false;
      } else {
        // reset ball-like: brief pause by stopping bullets
        next.bullets = next.bullets.filter((bb) => bb.from === "player");
        next.player = { ...next.player, cooldown: 0.4 };
      }
      break;
    }
  }

  // invaders reach player
  const lowest = Math.max(...next.invaders.filter((i) => i.alive).map((i) => i.pos.y));
  if (lowest > next.player.y - 70) {
    next.over = true;
    next.started = false;
  }

  // particles
  if (!input.reducedMotion) {
    next.particles = next.particles
      .map((p) => ({
        ...p,
        pos: { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt },
        vel: { x: p.vel.x * 0.98, y: p.vel.y * 0.98 },
        life: p.life - dt,
      }))
      .filter((p) => p.life > 0);
  } else {
    next.particles = [];
  }

  // cleanup bullets flagged
  next.bullets = next.bullets.filter((b) => b.pos.y > -2000 && b.pos.y < 2000);

  return next;
}

function spawnBurst(pos: Vec, color: string): Particle[] {
  const n = 14;
  const out: Particle[] = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const sp = 60 + Math.random() * 220;
    out.push({
      id: `${Math.random()}`,
      pos: { ...pos },
      vel: { x: Math.cos(a) * sp, y: Math.sin(a) * sp },
      life: 0.35 + Math.random() * 0.35,
      color,
      size: 2 + Math.random() * 2.5,
    });
  }
  return out;
}
