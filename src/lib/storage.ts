import { Location, ThemeMode } from "./types";

const KEY_FAVS = "wx:favs:v1";
const KEY_LAST = "wx:last:v1";
const KEY_THEME = "wx:theme:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadFavs(): Location[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Location[]>(window.localStorage.getItem(KEY_FAVS));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveFavs(favs: Location[]) {
  window.localStorage.setItem(KEY_FAVS, JSON.stringify(favs));
}

export function loadLast(): Location | null {
  if (typeof window === "undefined") return null;
  return safeParse<Location>(window.localStorage.getItem(KEY_LAST));
}

export function saveLast(loc: Location | null) {
  if (loc) window.localStorage.setItem(KEY_LAST, JSON.stringify(loc));
  else window.localStorage.removeItem(KEY_LAST);
}

export function loadTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY_THEME);
  return v === "system" || v === "light" || v === "dark" ? v : "system";
}

export function saveTheme(t: ThemeMode) {
  window.localStorage.setItem(KEY_THEME, t);
}
