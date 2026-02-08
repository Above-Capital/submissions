import type {
  Food,
  GameState,
  PowerupType,
  Snake,
  Vec,
} from "@/lib/types";
import { add, clamp, dist, eq, manhattan, pick, randInt, uid, withinBounds } from "@/lib/utils";

const DIRS: Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function createInitialState(bestScore: number): GameState {
  const arena = {
    w: 34,
    h: 22,
    safeRadius: 20,
    safeCenter: { x: 17, y: 11 },
  };

  const meId = "me";
  const me: Snake = {
    id: meId,
    name: "You",
    color: "#22d3ee",
    segments: [
      { x: 6, y: 11 },
      { x: 5, y: 11 },
      { x: 4, y: 11 },
    ],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    alive: true,
    score: 0,
    isBot: false,
    shieldUntil: 0,
    dashUntil: 0,
    magnetUntil: 0,
  };

  const bots: Snake[] = Array.from({ length: 5 }, (_, i) => {
    const id = `bot_${i}`;
    const x = randInt(10, arena.w - 4);
    const y = randInt(3, arena.h - 4);
    return {
      id,
      name: ["Nova", "Byte", "Koi", "Viper", "Arc"][i] ?? `Bot ${i + 1}`,
      color: ["#a78bfa", "#34d399", "#fb7185", "#fbbf24", "#60a5fa"][i] ?? "#a1a1aa",
      segments: [
        { x, y },
        { x: x - 1, y },
        { x: x - 2, y },
      ],
      dir: pick(DIRS),
      nextDir: pick(DIRS),
      alive: true,
      score: randInt(0, 5),
      isBot: true,
      shieldUntil: 0,
      dashUntil: 0,
      magnetUntil: 0,
    };
  });

  const state: GameState = {
    tick: 0,
    started: false,
    paused: false,
    over: false,
    arena,
    me: meId,
    snakes: [me, ...bots],
    foods: [],
    lastStepAt: 0,
    bestScore,
    lastMessage: "Press Start — or tap to boost.",
  };

  let s = state;
  for (let i = 0; i < 10; i++) s = spawnFood(s);
  for (let i = 0; i < 2; i++) s = spawnPowerup(s);
  return s;
}

export function setDirection(state: GameState, dir: Vec): GameState {
  return {
    ...state,
    snakes: state.snakes.map((sn) =>
      sn.id === state.me
        ? {
            ...sn,
            // prevent reversing
            nextDir:
              sn.dir.x + dir.x === 0 && sn.dir.y + dir.y === 0 ? sn.nextDir : dir,
          }
        : sn
    ),
  };
}

export function activatePower(state: GameState, type: PowerupType): GameState {
  const now = Date.now();
  return {
    ...state,
    snakes: state.snakes.map((sn) => {
      if (sn.id !== state.me) return sn;
      if (type === "dash") return { ...sn, dashUntil: now + 1600 };
      if (type === "shield") return { ...sn, shieldUntil: now + 2500 };
      return { ...sn, magnetUntil: now + 2200 };
    }),
  };
}

function occupied(state: GameState, p: Vec) {
  for (const sn of state.snakes) {
    for (const seg of sn.segments) {
      if (eq(seg, p)) return true;
    }
  }
  return state.foods.some((f) => eq(f.pos, p));
}

export function spawnFood(state: GameState): GameState {
  const { w, h } = state.arena;
  for (let tries = 0; tries < 200; tries++) {
    const p = { x: randInt(0, w - 1), y: randInt(0, h - 1) };
    if (occupied(state, p)) continue;
    // keep inside safe radius bias
    if (dist(p, state.arena.safeCenter) > state.arena.safeRadius + 4) continue;

    const food: Food = {
      id: uid("food"),
      pos: p,
      kind: "food",
      spawnedAt: Date.now(),
    };
    return { ...state, foods: [...state.foods, food] };
  }
  return state;
}

export function spawnPowerup(state: GameState): GameState {
  const { w, h } = state.arena;
  const types: PowerupType[] = ["dash", "magnet", "shield"];
  for (let tries = 0; tries < 200; tries++) {
    const p = { x: randInt(0, w - 1), y: randInt(0, h - 1) };
    if (occupied(state, p)) continue;
    if (dist(p, state.arena.safeCenter) > state.arena.safeRadius) continue;

    const food: Food = {
      id: uid("p"),
      pos: p,
      kind: "powerup",
      powerupType: pick(types),
      spawnedAt: Date.now(),
    };
    return { ...state, foods: [...state.foods, food] };
  }
  return state;
}

function botChooseDir(state: GameState, sn: Snake): Vec {
  const head = sn.segments[0];
  const now = Date.now();

  // goal: nearest food inside safe zone; prefer powerups if low score
  const candidates = state.foods
    .filter((f) => dist(f.pos, state.arena.safeCenter) <= state.arena.safeRadius + 0.5)
    .map((f) => ({
      f,
      w:
        f.kind === "powerup"
          ? 0.8
          : 1.0,
    }));

  let target = candidates.sort(
    (a, b) => manhattan(head, a.f.pos) - manhattan(head, b.f.pos)
  )[0]?.f;

  if (!target) {
    // drift toward center if outside
    target = {
      id: "center",
      pos: state.arena.safeCenter,
      kind: "food",
      spawnedAt: now,
    };
  }

  const dirs = DIRS.filter((d) => !(sn.dir.x + d.x === 0 && sn.dir.y + d.y === 0));

  // choose dir with minimal distance to target, but avoid collisions
  let best = sn.dir;
  let bestScore = Infinity;
  for (const d of dirs) {
    const next = add(head, d);
    if (!withinBounds(next, state.arena.w, state.arena.h)) continue;
    // avoid immediate collision with any snake segment
    const blocked = state.snakes.some((s2) =>
      s2.segments.some((seg, idx) =>
        // allow moving into own tail if it will move (approx)
        eq(seg, next) && !(s2.id === sn.id && idx === s2.segments.length - 1)
      )
    );
    if (blocked) continue;

    const centerPenalty = Math.max(
      0,
      dist(next, state.arena.safeCenter) - state.arena.safeRadius
    );
    const score = manhattan(next, target.pos) + centerPenalty * 6;
    if (score < bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

function killSnake(state: GameState, id: string, reason: string): GameState {
  const snakes = state.snakes.map((sn) =>
    sn.id === id ? { ...sn, alive: false } : sn
  );
  const isMe = id === state.me;
  return {
    ...state,
    snakes,
    over: isMe ? true : state.over,
    lastMessage: isMe ? reason : state.lastMessage,
  };
}

function grow(sn: Snake, n: number) {
  const tail = sn.segments[sn.segments.length - 1];
  const extra = Array.from({ length: n }, () => ({ ...tail }));
  return { ...sn, segments: [...sn.segments, ...extra] };
}

export function step(state: GameState): GameState {
  if (!state.started || state.paused || state.over) return state;

  const now = Date.now();
  const level = Math.floor(state.snakes.find((s) => s.id === state.me)?.score ?? 0 / 12);
  const baseMs = 160;
  const ms = clamp(baseMs - level * 6, 85, 160);
  if (state.lastStepAt && now - state.lastStepAt < ms) return state;

  let next: GameState = { ...state, tick: state.tick + 1, lastStepAt: now };

  // shrink safe zone slowly
  if (next.tick % 20 == 0) {
    next = {
      ...next,
      arena: {
        ...next.arena,
        safeRadius: Math.max(7, next.arena.safeRadius - 0.12),
      },
    };
  }

  // occasionally spawn
  if (next.tick % 9 === 0) next = spawnFood(next);
  if (next.tick % 45 === 0) next = spawnPowerup(next);

  // decide bot dirs
  const snakesPre = next.snakes.map((sn) => {
    if (!sn.alive) return sn;
    if (!sn.isBot) return { ...sn, dir: sn.nextDir };
    const d = botChooseDir(next, sn);
    return { ...sn, dir: d, nextDir: d };
  });

  // move snakes
  const moved: Snake[] = snakesPre.map((sn) => {
    if (!sn.alive) return sn;
    const speed = now < sn.dashUntil ? 2 : 1;
    let segments = [...sn.segments];
    for (let i = 0; i < speed; i++) {
      const head = segments[0];
      const newHead = add(head, sn.dir);
      segments = [newHead, ...segments.slice(0, -1)];
    }
    return { ...sn, segments };
  });

  next = { ...next, snakes: moved };

  // check safe zone + bounds
  for (const sn of next.snakes) {
    if (!sn.alive) continue;
    const head = sn.segments[0];
    if (!withinBounds(head, next.arena.w, next.arena.h)) {
      next = killSnake(next, sn.id, "You hit the wall.");
      continue;
    }
    const outside = dist(head, next.arena.safeCenter) > next.arena.safeRadius + 0.25;
    if (outside && now > sn.shieldUntil) {
      next = killSnake(next, sn.id, "The zone closed in.");
    }
  }

  // collisions (snake into any segment)
  for (const sn of next.snakes) {
    if (!sn.alive) continue;
    const head = sn.segments[0];
    for (const other of next.snakes) {
      const start = other.id === sn.id ? 1 : 0;
      for (let i = start; i < other.segments.length; i++) {
        if (eq(head, other.segments[i])) {
          if (now < sn.shieldUntil) break;
          next = killSnake(next, sn.id, "Collision.");
        }
      }
    }
  }

  // eat
  const foodsLeft: Food[] = [];
  const eatenBy: Record<string, Food[]> = {};
  for (const f of next.foods) {
    let eater: Snake | null = null;
    for (const sn of next.snakes) {
      if (!sn.alive) continue;
      const head = sn.segments[0];
      const magnet = now < sn.magnetUntil;
      const d = manhattan(head, f.pos);
      if (eq(head, f.pos) || (magnet && d <= 2)) {
        eater = sn;
        break;
      }
    }
    if (!eater) foodsLeft.push(f);
    else {
      eatenBy[eater.id] = [...(eatenBy[eater.id] ?? []), f];
    }
  }

  next = { ...next, foods: foodsLeft };

  next = {
    ...next,
    snakes: next.snakes.map((sn) => {
      const foods = eatenBy[sn.id] ?? [];
      if (!foods.length || !sn.alive) return sn;
      let out = sn;
      for (const f of foods) {
        if (f.kind === "food") {
          out = grow(out, 1);
          out = { ...out, score: out.score + 1 };
        } else {
          out = { ...out, score: out.score + 2 };
          // effect
          if (f.powerupType === "dash") out = { ...out, dashUntil: now + 1600 };
          if (f.powerupType === "shield") out = { ...out, shieldUntil: now + 2500 };
          if (f.powerupType === "magnet") out = { ...out, magnetUntil: now + 2200 };
          out = grow(out, 1);
        }
      }
      return out;
    }),
  };

  // keep at least some food/powerups
  while (next.foods.filter((f) => f.kind === "food").length < 10) next = spawnFood(next);
  while (next.foods.filter((f) => f.kind === "powerup").length < 2) next = spawnPowerup(next);

  // update best score
  const myScore = next.snakes.find((s) => s.id === next.me)?.score ?? 0;
  if (myScore > next.bestScore) next = { ...next, bestScore: myScore };

  return next;
}
