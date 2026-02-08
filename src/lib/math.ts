export type Vec2 = { x: number; y: number };

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function len(v: Vec2) {
  return Math.hypot(v.x, v.y);
}

export function norm(v: Vec2): Vec2 {
  const l = len(v);
  if (l <= 1e-9) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function mul(a: Vec2, k: number): Vec2 {
  return { x: a.x * k, y: a.y * k };
}

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function angleTo(v: Vec2) {
  return Math.atan2(v.y, v.x);
}

export function fromAngle(a: number): Vec2 {
  return { x: Math.cos(a), y: Math.sin(a) };
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function wrapAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function rand(seed: number) {
  // Mulberry32-ish
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function pick<T>(arr: T[], r: number) {
  return arr[Math.floor(r * arr.length) % arr.length];
}
