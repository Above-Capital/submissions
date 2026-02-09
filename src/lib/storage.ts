import { ChatExport, ChatThread, ThemeMode } from "./types";

const KEY_THREADS = "localchat:threads";
const KEY_ACTIVE = "localchat:activeThreadId";
const KEY_THEME = "localchat:themeMode";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadThreads(): ChatThread[] {
  if (typeof window === "undefined") return [];
  const parsed = safeJsonParse<ChatThread[]>(window.localStorage.getItem(KEY_THREADS));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveThreads(threads: ChatThread[]) {
  window.localStorage.setItem(KEY_THREADS, JSON.stringify(threads));
}

export function loadActiveThreadId(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY_ACTIVE);
  return v && v.length ? v : null;
}

export function saveActiveThreadId(id: string | null) {
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

export function makeExport(themeMode: ThemeMode, threads: ChatThread[]): ChatExport {
  return {
    version: 1,
    exportedAt: Date.now(),
    themeMode,
    threads,
  };
}

export function validateImport(data: unknown): ChatExport | null {
  if (!data || typeof data !== "object") return null;
  const d = data as any;
  if (d.version !== 1) return null;
  if (!Array.isArray(d.threads)) return null;
  return d as ChatExport;
}
