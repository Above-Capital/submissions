"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeMode, TodoItem, TodoList } from "../lib/types";
import {
  loadActiveListId,
  loadLists,
  loadThemeMode,
  makeExport,
  saveActiveListId,
  saveLists,
  saveThemeMode,
  validateImport,
} from "../lib/storage";
import { classNames, downloadJson, formatDate, formatTime, parseTags, uid } from "../lib/utils";

function applyTheme(mode: ThemeMode) {
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

function seed(): TodoList[] {
  const now = Date.now();
  const item = (text: string, extra?: Partial<TodoItem>): TodoItem => ({
    id: uid("t"),
    text,
    createdAt: now,
    doneAt: null,
    dueAt: null,
    priority: 2,
    tags: [],
    ...extra,
  });

  return [
    {
      id: uid("l"),
      title: "Today",
      createdAt: now,
      updatedAt: now,
      items: [
        item("Win the duel", { priority: 3, tags: ["arena"] }),
        item("Add a few tasks and try search", { tags: ["tip"] }),
        item("Export JSON for backup", { tags: ["tip"], priority: 1 }),
      ],
    },
    {
      id: uid("l"),
      title: "Someday",
      createdAt: now,
      updatedAt: now,
      items: [item("Build something weird with time", { tags: ["ideas"], priority: 1 })],
    },
  ];
}

function scoreItem(i: TodoItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  let s = 0;
  if (i.text.toLowerCase().includes(q)) s += 2;
  if (i.tags.some((t) => t.toLowerCase().includes(q))) s += 1;
  return s;
}

export default function TodoDuelApp() {
  const seeded = useRef(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  const [lists, setLists] = useState<TodoList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "done">("open");
  const [composer, setComposer] = useState("");
  const [tagsDraft, setTagsDraft] = useState("");
  const [dueDraft, setDueDraft] = useState<string>("");
  const [priorityDraft, setPriorityDraft] = useState<1 | 2 | 3>(2);

  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const storedTheme = loadThemeMode();
    setThemeMode(storedTheme);

    const storedLists = loadLists();
    const seededLists = storedLists.length ? storedLists : seed();
    setLists(seededLists);

    const storedActive = loadActiveListId();
    setActiveListId(storedActive && seededLists.some((l) => l.id === storedActive) ? storedActive : seededLists[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (!lists.length) return;
    saveLists(lists);
  }, [lists]);

  useEffect(() => {
    saveActiveListId(activeListId);
  }, [activeListId]);

  useEffect(() => {
    saveThemeMode(themeMode);
    applyTheme(themeMode);
    if (themeMode !== "system") return;
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;
    const handler = () => applyTheme("system");
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [themeMode]);

  const activeList = useMemo(() => lists.find((l) => l.id === activeListId) ?? null, [lists, activeListId]);

  const visibleItems = useMemo(() => {
    const items = activeList?.items ?? [];
    const q = query.trim();
    return items
      .map((i) => ({ i, s: scoreItem(i, q) }))
      .filter(({ i, s }) => {
        if (q && s <= 0) return false;
        if (filter === "open") return !i.doneAt;
        if (filter === "done") return !!i.doneAt;
        return true;
      })
      .sort((a, b) => {
        // priority then recency
        if (a.i.doneAt && !b.i.doneAt) return 1;
        if (!a.i.doneAt && b.i.doneAt) return -1;
        if (b.i.priority !== a.i.priority) return b.i.priority - a.i.priority;
        return b.i.createdAt - a.i.createdAt;
      })
      .map(({ i }) => i);
  }, [activeList?.items, query, filter]);

  function updateList(id: string, updater: (l: TodoList) => TodoList) {
    setLists((prev) => prev.map((l) => (l.id === id ? updater(l) : l)));
  }

  function createList() {
    const now = Date.now();
    const title = prompt("List name", "New list")?.trim();
    if (!title) return;
    const l: TodoList = { id: uid("l"), title: title.slice(0, 50), createdAt: now, updatedAt: now, items: [] };
    setLists((prev) => [l, ...prev]);
    setActiveListId(l.id);
  }

  function deleteList(id: string) {
    if (!confirm("Delete this list?")) return;
    setLists((prev) => prev.filter((l) => l.id !== id));
    if (activeListId === id) setActiveListId(lists.find((l) => l.id !== id)?.id ?? null);
  }

  function addItem() {
    if (!activeList) return;
    const text = composer.trim();
    if (!text) return;

    const dueAt = dueDraft ? new Date(dueDraft).getTime() : null;
    const tags = parseTags(tagsDraft).map((t) => t.toLowerCase());
    const now = Date.now();
    const item: TodoItem = {
      id: uid("t"),
      text,
      createdAt: now,
      doneAt: null,
      dueAt,
      priority: priorityDraft,
      tags,
    };

    updateList(activeList.id, (l) => ({ ...l, updatedAt: now, items: [item, ...l.items] }));
    setComposer("");
  }

  function toggleDone(itemId: string) {
    if (!activeList) return;
    const now = Date.now();
    updateList(activeList.id, (l) => ({
      ...l,
      updatedAt: now,
      items: l.items.map((i) => (i.id === itemId ? { ...i, doneAt: i.doneAt ? null : now } : i)),
    }));
  }

  function editItem(itemId: string) {
    if (!activeList) return;
    const cur = activeList.items.find((i) => i.id === itemId);
    if (!cur) return;
    const next = prompt("Edit task", cur.text);
    if (!next) return;
    const now = Date.now();
    updateList(activeList.id, (l) => ({
      ...l,
      updatedAt: now,
      items: l.items.map((i) => (i.id === itemId ? { ...i, text: next.trim().slice(0, 140) || i.text } : i)),
    }));
  }

  function removeItem(itemId: string) {
    if (!activeList) return;
    if (!confirm("Delete this task?")) return;
    const now = Date.now();
    updateList(activeList.id, (l) => ({ ...l, updatedAt: now, items: l.items.filter((i) => i.id !== itemId) }));
  }

  function exportAll() {
    downloadJson(`todo-export-${new Date().toISOString().slice(0, 10)}.json`, makeExport(themeMode, lists, activeListId));
  }

  async function importFile(file: File) {
    const raw = await file.text();
    const parsed = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();
    const data = validateImport(parsed);
    if (!data) return alert("Import failed: unsupported file.");
    if (!confirm(`Import ${data.lists.length} list(s)? This will replace your current data.`)) return;

    setThemeMode(data.themeMode ?? "system");
    setLists(data.lists);
    setActiveListId(data.activeListId ?? (data.lists[0]?.id ?? null));
    setShowSettings(false);
  }

  // shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "k") {
        e.preventDefault();
        createList();
      }
      if (k === "f") {
        e.preventDefault();
        (document.getElementById("todo-search") as HTMLInputElement | null)?.focus();
      }
      if (e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lists, activeListId]);

  const stats = useMemo(() => {
    const items = activeList?.items ?? [];
    const done = items.filter((i) => !!i.doneAt).length;
    const open = items.length - done;
    return { open, done, total: items.length };
  }, [activeList?.items]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_10%_0%,rgba(16,185,129,0.14),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(99,102,241,0.18),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(80%_60%_at_10%_0%,rgba(16,185,129,0.20),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(99,102,241,0.24),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Tally</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Local-first todo lists • fast search • export/import</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Settings
            </button>
            <button
              onClick={createList}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              title="New list (⌘/Ctrl+K)"
            >
              New list
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Lists</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">⌘/Ctrl+K</div>
            </div>
            <div className="mt-3 space-y-2">
              {lists
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((l) => {
                  const isActive = l.id === activeListId;
                  const open = l.items.filter((i) => !i.doneAt).length;
                  return (
                    <div
                      key={l.id}
                      className={classNames(
                        "group rounded-xl border p-3 transition",
                        isActive
                          ? "border-indigo-500/40 bg-indigo-500/10"
                          : "border-black/10 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      )}
                    >
                      <button onClick={() => setActiveListId(l.id)} className="block w-full text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-semibold">{l.title}</div>
                            <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">{open} open</div>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatTime(l.updatedAt)}</div>
                        </div>
                      </button>
                      <div className="mt-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => {
                            const next = prompt("Rename list", l.title)?.trim();
                            if (!next) return;
                            const now = Date.now();
                            updateList(l.id, (x) => ({ ...x, title: next.slice(0, 50) || x.title, updatedAt: now }));
                          }}
                          className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-[11px] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => deleteList(l.id)}
                          className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Shortcuts: <span className="font-semibold">⌘/Ctrl+F</span> search • <span className="font-semibold">⌘/Ctrl+K</span> new list • <span className="font-semibold">⌘/Ctrl+,</span> settings
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-semibold tracking-tight">{activeList?.title ?? "No list"}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                  {activeList ? `${stats.open} open • ${stats.done} done • ${stats.total} total` : "Create a list to begin"}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="todo-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tasks (⌘/Ctrl+F)"
                  className="w-56 rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
                />
                {(["open", "all", "done"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={classNames(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      filter === f
                        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                        : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Add task</div>
                <input
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                  placeholder="What needs doing? (⌘/Ctrl+Enter to add)"
                  className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-sm font-semibold outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input
                    value={tagsDraft}
                    onChange={(e) => setTagsDraft(e.target.value)}
                    placeholder="tags: work, home"
                    className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                  />
                  <input
                    value={dueDraft}
                    onChange={(e) => setDueDraft(e.target.value)}
                    type="date"
                    className="rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                  />
                  <div className="flex items-center gap-2">
                    <select
                      value={priorityDraft}
                      onChange={(e) => setPriorityDraft(Number(e.target.value) as 1 | 2 | 3)}
                      className="flex-1 rounded-2xl border border-black/10 bg-white/70 px-3 py-2 text-xs font-semibold outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                    >
                      <option value={1}>Priority 1</option>
                      <option value={2}>Priority 2</option>
                      <option value={3}>Priority 3</option>
                    </select>
                    <button
                      onClick={addItem}
                      disabled={!activeList || !composer.trim()}
                      className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Everything is localStorage. Export from Settings for backups.</div>
              </div>

              <div className="mt-4 space-y-2">
                {activeList ? (
                  visibleItems.length ? (
                    visibleItems.map((i) => (
                      <div
                        key={i.id}
                        className={classNames(
                          "group rounded-2xl border p-3 transition",
                          i.doneAt
                            ? "border-black/10 bg-white/40 opacity-80 dark:border-white/10 dark:bg-white/5"
                            : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => toggleDone(i.id)}
                            className={classNames(
                              "mt-1 grid h-6 w-6 place-items-center rounded-lg border",
                              i.doneAt
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                                : "border-black/15 bg-white/70 hover:bg-white dark:border-white/15 dark:bg-white/10"
                            )}
                            title={i.doneAt ? "Mark open" : "Mark done"}
                          >
                            {i.doneAt ? "✓" : ""}
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className={classNames("text-sm font-semibold leading-6", i.doneAt ? "line-through text-zinc-500 dark:text-zinc-400" : "")}>{i.text}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                              <span className={classNames("rounded-full border px-2 py-0.5 font-semibold", i.priority === 3 ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200" : i.priority === 2 ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200")}
                              >
                                P{i.priority}
                              </span>
                              <span>Due: <span className="font-semibold">{formatDate(i.dueAt)}</span></span>
                              {i.tags.map((t) => (
                                <span key={t} className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-semibold text-indigo-900 dark:text-indigo-200">#{t}</span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => editItem(i.id)}
                              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeItem(i.id)}
                              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                      No tasks match your filters.
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    Create a list to start.
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Settings</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Theme, export/import, reset.</div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Theme</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setThemeMode(m)}
                      className={classNames(
                        "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                        themeMode === m
                          ? "border-indigo-500/40 bg-indigo-500/10"
                          : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Export / Import</div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button onClick={exportAll} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
                    Export all
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    Import…
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void importFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Danger zone</div>
                <button
                  onClick={() => {
                    if (!confirm("Reset everything (lists + tasks + settings)?")) return;
                    window.localStorage.clear();
                    const seededLists = seed();
                    setLists(seededLists);
                    setActiveListId(seededLists[0]?.id ?? null);
                    setThemeMode("system");
                    setQuery("");
                    setFilter("open");
                    setShowSettings(false);
                  }}
                  className="mt-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                >
                  Reset all
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
