export type ID = string;

export type Vec = { x: number; y: number };

export type PowerupType = "dash" | "magnet" | "shield";

export type Snake = {
  id: ID;
  name: string;
  color: string; // css color
  segments: Vec[]; // head first
  dir: Vec;
  nextDir: Vec;
  alive: boolean;
  score: number;
  isBot: boolean;
  shieldUntil: number;
  dashUntil: number;
  magnetUntil: number;
};

export type Food = {
  id: ID;
  pos: Vec;
  kind: "food" | "powerup";
  powerupType?: PowerupType;
  spawnedAt: number;
};

export type Arena = {
  w: number;
  h: number;
  safeRadius: number; // shrinking circle-ish
  safeCenter: Vec;
};

export type GameState = {
  tick: number;
  started: boolean;
  paused: boolean;
  over: boolean;
  arena: Arena;
  me: ID;
  snakes: Snake[];
  foods: Food[];
  lastStepAt: number;
  bestScore: number;
  lastMessage: string;
};
