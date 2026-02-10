import { DrumState } from "./types";

const KEY = "drum:state:v1";

export function loadState(): DrumState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as DrumState;
  } catch {
    return null;
  }
}

export function saveState(st: DrumState) {
  window.localStorage.setItem(KEY, JSON.stringify(st));
}
