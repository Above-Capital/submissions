import { ThemeMode, TodoExport, TodoList } from "./types";

const KEY_LISTS = "todo:list:v1";
const KEY_ACTIVE = "todo:activeListId:v1";
const KEY_THEME = "todo:themeMode:v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadLists(): TodoList[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<TodoList[]>(window.localStorage.getItem(KEY_LISTS));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveLists(lists: TodoList[]) {
  window.localStorage.setItem(KEY_LISTS, JSON.stringify(lists));
}

export function loadActiveListId(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY_ACTIVE);
  return v && v.length ? v : null;
}

export function saveActiveListId(id: string | null) {
  if (id) window.localStorage.setItem(KEY_ACTIVE, id);
  else window.localStorage.removeItem(KEY_ACTIVE);
}

export function loadThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const v = window.localStorage.getItem(KEY_THEME);
  return v === "light" || v === "dark" || v === "system" ? v : "system";
}

export function saveThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(KEY_THEME, mode);
}

export function makeExport(themeMode: ThemeMode, lists: TodoList[], activeListId: string | null): TodoExport {
  return {
    version: 1,
    exportedAt: Date.now(),
    themeMode,
    lists,
    activeListId,
  };
}

export function validateImport(data: unknown): TodoExport | null {
  if (!data || typeof data !== "object") return null;
  const d = data as any;
  if (d.version !== 1) return null;
  if (!Array.isArray(d.lists)) return null;
  return d as TodoExport;
}
