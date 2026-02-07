import type { TodoDB } from "@/lib/todoTypes";
import { uid } from "@/lib/todoUtils";

const KEY = "todoapp:v1";

export function defaultDB(): TodoDB {
  const now = Date.now();
  const inboxProjectId = uid("proj");
  return {
    version: 1,
    todos: [
      {
        id: uid("todo"),
        title: "Try quick add (press N)",
        notes: "This app is offline-first — everything is stored in localStorage.",
        completedAt: null,
        createdAt: now,
        updatedAt: now,
        dueAt: null,
        priority: 1,
        projectId: inboxProjectId,
        tagIds: [],
        order: 1000,
      },
      {
        id: uid("todo"),
        title: "Edit a todo inline",
        notes: "Click a task to open details. Double-click the title to rename.",
        completedAt: null,
        createdAt: now + 1,
        updatedAt: now + 1,
        dueAt: null,
        priority: 0,
        projectId: inboxProjectId,
        tagIds: [],
        order: 2000,
      },
    ],
    projects: [
      {
        id: inboxProjectId,
        name: "Personal",
        color: "zinc",
        createdAt: now,
        order: 1000,
      },
    ],
    tags: [
      { id: uid("tag"), name: "Deep work", color: "indigo", createdAt: now },
      { id: uid("tag"), name: "Errands", color: "emerald", createdAt: now },
    ],
    ui: {
      selectedView: { kind: "inbox" },
      selectedTodoId: null,
      sidebarCollapsed: false,
    },
    settings: {
      showCompletedByDefault: false,
    },
  };
}

export function loadDB(): TodoDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultDB();
    const parsed = JSON.parse(raw) as Partial<TodoDB>;
    if (parsed.version !== 1) return defaultDB();
    // minimal validation
    return {
      ...defaultDB(),
      ...parsed,
      ui: { ...defaultDB().ui, ...(parsed.ui ?? {}) },
      settings: { ...defaultDB().settings, ...(parsed.settings ?? {}) },
    } as TodoDB;
  } catch {
    return defaultDB();
  }
}

export function saveDB(db: TodoDB) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(db));
}

export function downloadJSON(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
