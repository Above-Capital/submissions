import { FinanceState, ThemeMode } from "./types";

const KEY = "fin:state:v1";

export function loadState(): FinanceState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as FinanceState;
  } catch {
    return null;
  }
}

export function saveState(st: FinanceState) {
  window.localStorage.setItem(KEY, JSON.stringify(st));
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("dark");
  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }
  if (mode === "light") return;
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (mql?.matches) root.classList.add("dark");
}
