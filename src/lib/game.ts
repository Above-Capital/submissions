import { add, clamp, dist, fromAngle, mul, norm, rand, sub, wrapAngle } from "./math";
import type { GameState, Pellet, Snake, SnakeId } from "./gameTypes";

const segmentSpacing = 10;
const baseTurnRate = 6.5; // rad/s
const baseSpeed = 140;
const dashSpeed = 260;
const dashDrainPerSec = 0.65;
const energyRegenPerSec = 0.22;
const magnetRadius = 140;

function uid(prefix: string, n: number) {
  return `${prefix}_${n.toString(36)}`;
}

function botNames() {
  return [
    "Mint",
    "Cobalt",
    "Vanta",
    "Saffron",
    "Rook",
    "Kite",
    "Nova",
    "Pixel",
    "Echo",
    "Glitch",
    "Basil",
  ];
}

function palette() {
  return [
    ["#22c55e", "#a3e635"],
    ["#60a5fa", "#22d3ee"],
    ["#fb7185", "#f472b6"],
    ["#f59e0b", "#facc15"],
    ["#a78bfa", "#818cf8"],
    ["#34d399", "#2dd4bf"],
  ] as const;
}

export type InputState = {
  aimVec: { x: number; y: number };
  dashHeld: boolean;
  pausePressed: boolean;
};

export function createInitialState(seed = (Date.now() >>> 0) % 1_000_000): GameState {
  const arena = { w: 2200, h: 1400, shrink: 0 };
  const s: GameState = {
    seed,
    t: 0,
    arena,
    snakes: {},
    pellets: {},
    playerId: "player",
    phase: "menu",
    hiScore: 0,
    settings: { bloom: true, screenShake: true, quality: "high" },
  };

  s.snakes[s.playerId] = spawnSnake(s, {
    id: s.playerId,
    isBot: false,
    name: "You",
    colorPair: ["#22c55e", "#a3e635"],
  });

  for (let i = 0; i < 8; i++) {
    const r = rand(seed + i * 77);
    const name = botNames()[Math.floor(r * botNames().length)];
    const cp = palette()[Math.floor(rand(seed + i * 1234) * palette().length)];
    const id = `bot_${i}`;
    s.snakes[id] = spawnSnake(s, {
      id,
      isBot: true,
      name,
      colorPair: cp,
    });
  }

  // pellets
  let k = 0;
  for (let i = 0; i < 220; i++) {
    const p = randomPointInArena(s, seed + i * 19);
    const rr = rand(seed + i * 991);
    const kind: Pellet["kind"] = rr < 0.83 ? "food" : rr < 0.92 ? "energy" : "magnet";
    s.pellets[uid("pel", k++)] = {
      id: uid("pel", k),
      p,
      v: { x: 0, y: 0 },
      r: kind === "food" ? 5 : 6,
      value: kind === "food" ? 1 : kind === "energy" ? 2 : 2,
      kind,
    };
  }

  return s;
}

function spawnSnake(
  s: GameState,
  opts: { id: SnakeId; isBot: boolean; name: string; colorPair: readonly [string, string] }
): Snake {
  const p = randomPointInArena(s, s.seed + opts.id.length * 999);
  const aim = rand(s.seed + opts.id.length * 222) * Math.PI * 2;
  const body: { x: number; y: number }[] = [];
  for (let i = 0; i < 22; i++) body.push({ x: p.x - i * segmentSpacing, y: p.y });

  return {
    id: opts.id,
    name: opts.name,
    colorA: opts.colorPair[0],
    colorB: opts.colorPair[1],
    alive: true,
    head: { ...p },
    vel: { x: 0, y: 0 },
    aim,
    speed: baseSpeed,
    body,
    length: 22,
    energy: 0.85,
    dash: 1,
    magnet: 0,
    score: 0,
    kills: 0,
    isBot: opts.isBot,
  };
}

function randomPointInArena(s: GameState, seed: number) {
  const r1 = rand(seed + 1);
  const r2 = rand(seed + 2);
  const pad = 120;
  return {
    x: pad + r1 * (s.arena.w - pad * 2),
    y: pad + r2 * (s.arena.h - pad * 2),
  };
}

function arenaBounds(s: GameState) {
  // subtle shrink over time to encourage conflict
  const shrinkPx = s.arena.shrink * 280;
  const minX = 0 + shrinkPx;
  const minY = 0 + shrinkPx;
  const maxX = s.arena.w - shrinkPx;
  const maxY = s.arena.h - shrinkPx;
  return { minX, minY, maxX, maxY };
}

function stepSnakeBody(sn: Snake) {
  // Keep body spaced; body[0] is at head-ish.
  sn.body[0] = { ...sn.head };
  for (let i = 1; i < sn.body.length; i++) {
    const prev = sn.body[i - 1];
    const cur = sn.body[i];
    const d = dist(prev, cur);
    if (d > segmentSpacing) {
      const dir = norm(sub(cur, prev));
      // pull segment toward prev
      sn.body[i] = add(prev, mul(dir, segmentSpacing));
    }
  }
  // trim/extend to desired length
  if (sn.body.length > sn.length) sn.body.length = sn.length;
  while (sn.body.length < sn.length) sn.body.push({ ...sn.body[sn.body.length - 1] });
}

function killSnake(s: GameState, victimId: SnakeId, reason: string, killerId?: SnakeId) {
  const v = s.snakes[victimId];
  if (!v || !v.alive) return;
  v.alive = false;

  // drop pellets from body
  let n = 0;
  for (let i = 2; i < v.body.length; i += 2) {
    const bp = v.body[i];
    const rr = rand(s.seed + (s.t * 1000 + i) | 0);
    const kind: Pellet["kind"] = rr < 0.9 ? "food" : rr < 0.97 ? "energy" : "magnet";
    const id = uid("drop", ((s.t * 1000) | 0) + i);
    s.pellets[id] = {
      id,
      p: { x: bp.x + (rr - 0.5) * 10, y: bp.y + (rand(s.seed + i * 13) - 0.5) * 10 },
      v: { x: (rr - 0.5) * 28, y: (rand(s.seed + i * 17) - 0.5) * 28 },
      r: 5,
      value: 1,
      kind,
    };
    n++;
    if (n > 60) break;
  }

  if (killerId && s.snakes[killerId]) {
    s.snakes[killerId].kills += 1;
    s.snakes[killerId].score += 10;
  }

  if (victimId === s.playerId) {
    s.phase = "gameover";
    s.lastDeathReason = reason;
  } else {
    // respawn bots after a delay by scheduling via time-flag on snake
    // We'll piggyback on negative energy as a respawn timer.
    v.energy = -2.0;
  }
}

function applyPelletMagnet(s: GameState, sn: Snake, dt: number) {
  if (sn.magnet <= 0) return;
  const head = sn.head;
  for (const pel of Object.values(s.pellets)) {
    const d = dist(head, pel.p);
    if (d < magnetRadius) {
      const pull = clamp(1 - d / magnetRadius, 0, 1);
      const dir = norm(sub(head, pel.p));
      pel.v = add(pel.v, mul(dir, (120 + pull * 300) * dt));
    }
  }
}

function eatPellets(s: GameState, sn: Snake) {
  const head = sn.head;
  for (const id of Object.keys(s.pellets)) {
    const pel = s.pellets[id];
    const d = dist(head, pel.p);
    if (d < pel.r + 10) {
      delete s.pellets[id];
      sn.score += pel.value;
      if (pel.kind === "food") sn.length += 1;
      if (pel.kind === "energy") sn.energy = clamp(sn.energy + 0.22, 0, 1);
      if (pel.kind === "magnet") sn.magnet = Math.min(7.5, sn.magnet + 3.0);

      // spawn replacement
      const seed = (s.seed + ((s.t * 1000) | 0) + id.length * 31) >>> 0;
      const p = randomPointInArena(s, seed);
      const rr = rand(seed + 9);
      const kind: Pellet["kind"] = rr < 0.84 ? "food" : rr < 0.93 ? "energy" : "magnet";
      const nid = uid("pel", ((s.t * 1000) | 0) + seed);
      s.pellets[nid] = {
        id: nid,
        p,
        v: { x: 0, y: 0 },
        r: kind === "food" ? 5 : 6,
        value: kind === "food" ? 1 : 2,
        kind,
      };
    }
  }
}

function checkCollisions(s: GameState) {
  // head -> wall
  const b = arenaBounds(s);
  for (const sn of Object.values(s.snakes)) {
    if (!sn.alive) continue;
    const h = sn.head;
    const r = 9;
    if (h.x < b.minX + r || h.x > b.maxX - r || h.y < b.minY + r || h.y > b.maxY - r) {
      killSnake(s, sn.id, "Hit the stormwall", undefined);
    }
  }

  // head -> body (including self)
  const snakes = Object.values(s.snakes).filter((x) => x.alive);
  for (const a of snakes) {
    for (const bsn of snakes) {
      const same = a.id === bsn.id;
      const body = bsn.body;
      for (let i = same ? 8 : 2; i < body.length; i++) {
        const p = body[i];
        if (dist(a.head, p) < 8.5) {
          const killer = same ? undefined : bsn.id;
          const reason = same ? "Clipped your own trail" : `Hit ${bsn.name}`;
          killSnake(s, a.id, reason, killer);
          break;
        }
      }
    }
  }
}

function botBrain(s: GameState, sn: Snake): { aimVec: { x: number; y: number }; dashHeld: boolean } {
  // Simple: seek nearest pellet with slight avoidance of walls and bodies
  const head = sn.head;
  let best: Pellet | null = null;
  let bestScore = -1e9;
  const wantEnergy = sn.energy < 0.35;

  for (const pel of Object.values(s.pellets)) {
    const d = dist(head, pel.p);
    const bias = pel.kind === "magnet" ? 2.5 : pel.kind === "energy" ? (wantEnergy ? 4.0 : 1.8) : 1.0;
    const score = bias * 800 - d;
    if (score > bestScore) {
      bestScore = score;
      best = pel;
    }
  }

  let target = best ? sub(best.p, head) : fromAngle(sn.aim);

  // Avoid walls
  const b = arenaBounds(s);
  const margin = 110;
  if (head.x < b.minX + margin) target = add(target, { x: 400, y: 0 });
  if (head.x > b.maxX - margin) target = add(target, { x: -400, y: 0 });
  if (head.y < b.minY + margin) target = add(target, { x: 0, y: 400 });
  if (head.y > b.maxY - margin) target = add(target, { x: 0, y: -400 });

  // light repulsion from nearby bodies
  for (const other of Object.values(s.snakes)) {
    if (!other.alive || other.id === sn.id) continue;
    for (let i = 4; i < other.body.length; i += 4) {
      const p = other.body[i];
      const d = dist(head, p);
      if (d < 85) {
        const away = norm(sub(head, p));
        target = add(target, mul(away, (1 - d / 85) * 520));
      }
    }
  }

  const dashHeld = sn.energy > 0.55 && rand(s.seed + ((s.t * 10) | 0) + sn.id.length * 55) < 0.035;
  return { aimVec: target, dashHeld };
}

export function tick(s: GameState, input: InputState, dt: number) {
  s.t += dt;

  if (input.pausePressed) {
    if (s.phase === "playing") s.phase = "paused";
    else if (s.phase === "paused") s.phase = "playing";
  }

  if (s.phase !== "playing") {
    // still drift pellets a bit
    for (const pel of Object.values(s.pellets)) {
      pel.p = add(pel.p, mul(pel.v, dt));
      pel.v = mul(pel.v, Math.pow(0.2, dt));
    }
    return;
  }

  s.arena.shrink = clamp(s.arena.shrink + dt * 0.004, 0, 1);

  // update snakes
  for (const sn of Object.values(s.snakes)) {
    // respawn bots
    if (!sn.alive) {
      if (sn.isBot) {
        sn.energy += dt;
        if (sn.energy >= 0) {
          const fresh = spawnSnake(s, {
            id: sn.id,
            isBot: true,
            name: sn.name,
            colorPair: [sn.colorA, sn.colorB],
          });
          s.snakes[sn.id] = { ...fresh, score: Math.max(0, sn.score - 8), kills: sn.kills };
        }
      }
      continue;
    }

    const isPlayer = sn.id === s.playerId;
    const brain = sn.isBot ? botBrain(s, sn) : null;
    const aimVec = isPlayer ? input.aimVec : brain!.aimVec;
    const dashHeld = isPlayer ? input.dashHeld : brain!.dashHeld;

    // aim smoothing
    const desired = Math.atan2(aimVec.y, aimVec.x);
    const delta = wrapAngle(desired - sn.aim);
    const maxTurn = baseTurnRate * dt;
    sn.aim += clamp(delta, -maxTurn, maxTurn);

    // speed / dash
    const wantDash = dashHeld && sn.energy > 0.05;
    sn.speed = wantDash ? dashSpeed : baseSpeed;

    if (wantDash) sn.energy = clamp(sn.energy - dashDrainPerSec * dt, 0, 1);
    else sn.energy = clamp(sn.energy + energyRegenPerSec * dt, 0, 1);

    // magnet timer
    sn.magnet = Math.max(0, sn.magnet - dt);

    // velocity + integrate
    const dir = fromAngle(sn.aim);
    const targetV = mul(dir, sn.speed);
    sn.vel = add(mul(sn.vel, Math.pow(0.04, dt)), mul(targetV, 1 - Math.pow(0.04, dt)));
    sn.head = add(sn.head, mul(sn.vel, dt));

    // apply magnet after movement
    applyPelletMagnet(s, sn, dt);

    stepSnakeBody(sn);
    eatPellets(s, sn);

    if (sn.score > s.hiScore && sn.id === s.playerId) s.hiScore = sn.score;
  }

  // drift pellets
  for (const pel of Object.values(s.pellets)) {
    pel.p = add(pel.p, mul(pel.v, dt));
    pel.v = mul(pel.v, Math.pow(0.18, dt));
  }

  checkCollisions(s);

  // ensure pellet count
  const count = Object.keys(s.pellets).length;
  if (count < 200) {
    for (let i = 0; i < 6; i++) {
      const seed = (s.seed + ((s.t * 1000) | 0) + i * 997) >>> 0;
      const p = randomPointInArena(s, seed);
      const rr = rand(seed + 3);
      const kind: Pellet["kind"] = rr < 0.84 ? "food" : rr < 0.93 ? "energy" : "magnet";
      const id = uid("pel", seed + i);
      s.pellets[id] = { id, p, v: { x: 0, y: 0 }, r: kind === "food" ? 5 : 6, value: 1, kind };
    }
  }
}

export function resetToMenu(s: GameState) {
  const seed = ((s.seed + 1337 + (s.t * 1000) | 0) >>> 0) % 1_000_000;
  const fresh = createInitialState(seed);
  // preserve hi score + settings
  fresh.hiScore = s.hiScore;
  fresh.settings = s.settings;
  Object.assign(s, fresh);
}

export function startGame(s: GameState) {
  s.phase = "playing";
  s.lastDeathReason = undefined;
  // small shrink reset
  s.arena.shrink = 0;
}

export function setSettings(
  s: GameState,
  patch: Partial<GameState["settings"]>
) {
  s.settings = { ...s.settings, ...patch };
}

export function cameraForPlayer(s: GameState) {
  const p = s.snakes[s.playerId]?.head ?? { x: s.arena.w / 2, y: s.arena.h / 2 };
  return p;
}

export function worldScaleForScore(score: number) {
  // zoom out slightly as you grow
  return clamp(1.0 - Math.log2(1 + score / 18) * 0.08, 0.72, 1.0);
}

export function worldSize() {
  return { w: 2200, h: 1400 };
}

export { segmentSpacing, magnetRadius };
