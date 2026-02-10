export type TrackId = "kick" | "snare" | "hat" | "clap" | "tom" | "rim" | "perc" | "crash";

export type Step = {
  on: boolean;
  vel: number; // 0..1
};

export type Pattern = {
  id: string;
  name: string;
  steps: Record<TrackId, Step[]>; // length = 16
};

export type Mixer = Record<TrackId, { gain: number; mute: boolean; solo: boolean }>;

export type DrumState = {
  version: 1;
  bpm: number;
  swing: number; // 0..0.6
  pattern: Pattern;
  mixer: Mixer;
};
