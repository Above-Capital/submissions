export type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
};

export type NotesState = {
  notes: Note[];
  selectedId: string | null;
};

export const STORAGE_KEY = "arena:mdnotes:v1";

export function uid() {
  // short, url-safe id
  return Math.random().toString(36).slice(2, 8) + "-" + Math.random().toString(36).slice(2, 8);
}

export function now() {
  return Date.now();
}

export function newNote(partial?: Partial<Note>): Note {
  const t = now();
  const n: Note = {
    id: uid(),
    title: partial?.title ?? "Untitled",
    body: partial?.body ?? "# New note\n\nStart typing…",
    tags: partial?.tags ?? [],
    createdAt: partial?.createdAt ?? t,
    updatedAt: partial?.updatedAt ?? t,
  };
  return n;
}

export function sortNotes(notes: Note[]) {
  return [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function normalizeTags(raw: string) {
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export function filenameSafe(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-\s_]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readTextFile(file: File) {
  return await file.text();
}
