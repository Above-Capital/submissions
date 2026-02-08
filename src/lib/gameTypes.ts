import type { Vec2 } from "./math";

export type SnakeId = string;

export type Pellet = {
  id: string;
  p: Vec2;
  v: Vec2;
  r: number;
  value: number;
  kind: "food" | "magnet" | "energy";
};

export type Snake = {
  id: SnakeId;
  name: string;
  colorA: string;
  colorB: string;
  alive: boolean;

  // continuous head
  head: Vec2;
  vel: Vec2;
  aim: number;
  speed: number;

  // body points are in world coords, spaced by `segmentSpacing`
  body: Vec2[];
  length: number; // desired length in segments

  // energy / dash
  energy: number; // 0..1
  dash: number; // 0..1 (cooldown)
  magnet: number; // seconds remaining

  score: number;
  kills: number;
  isBot: boolean;
};

export type Arena = {
  w: number;
  h: number;
  shrink: number; // 0..1
};

export type GameState = {
  seed: number;
  t: number;
  arena: Arena;
  snakes: Record<SnakeId, Snake>;
  pellets: Record<string, Pellet>;
  playerId: SnakeId;

  phase: "menu" | "playing" | "paused" | "gameover";
  lastDeathReason?: string;

  hiScore: number;
  settings: {
    bloom: boolean;
    screenShake: boolean;
    quality: "high" | "low";
  };
};
