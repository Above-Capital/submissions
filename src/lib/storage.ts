import { PickerState } from "./types";

const KEY = "emoji:picker:v1";

export function loadPickerState(): PickerState {
  if (typeof window === "undefined") {
    return { version: 1, favorites: [], recents: [], skinTone: 0 };
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { version: 1, favorites: [], recents: [], skinTone: 0 };
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return { version: 1, favorites: [], recents: [], skinTone: 0 };
    return parsed as PickerState;
  } catch {
    return { version: 1, favorites: [], recents: [], skinTone: 0 };
  }
}

export function savePickerState(st: PickerState) {
  window.localStorage.setItem(KEY, JSON.stringify(st));
}
