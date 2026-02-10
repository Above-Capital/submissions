import { Note, NotesExport, ThemeMode } from "./types";

const KEY_NOTES = "mdnotes:notes";
const KEY_ACTIVE = "mdnotes:activeId";
const KEY_THEME = "mdnotes:themeMode";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Note[]>(window.localStorage.getItem(KEY_NOTES));
  return Array.isArray(parsed) ? parsed : [];
}

export function saveNotes(notes: Note[]) {
  window.localStorage.setItem(KEY_NOTES, JSON.stringify(notes));
}

export function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY_ACTIVE);
  return v && v.length ? v : null;
}

export function saveActiveId(id: string | null) {
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

export function makeExport(themeMode: ThemeMode, notes: Note[], activeId: string | null): NotesExport {
  return {
    version: 1,
    exportedAt: Date.now(),
    themeMode,
    notes,
    activeId,
  };
}

export function validateImport(data: unknown): NotesExport | null {
  if (!data || typeof data !== "object") return null;
  const d = data as any;
  if (d.version !== 1) return null;
  if (!Array.isArray(d.notes)) return null;
  return d as NotesExport;
}
