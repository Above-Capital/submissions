"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

import { Note, ThemeMode } from "../lib/types";
import {
  loadActiveId,
  loadNotes,
  loadThemeMode,
  makeExport,
  saveActiveId,
  saveNotes,
  saveThemeMode,
  validateImport,
} from "../lib/storage";
import { classNames, downloadJson, formatDateTime, parseTags, uid } from "../lib/utils";

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

function seedNotes(): Note[] {
  const now = Date.now();
  return [
    {
      id: uid("n"),
      title: "Welcome to Inkboard",
      body:
        "# Inkboard\n\nA fast, local-first markdown notebook with **live preview**.\n\n## Shortcuts\n- **⌘/Ctrl + K**: New note\n- **⌘/Ctrl + F**: Search\n- **⌘/Ctrl + /**: Toggle preview\n- **⌘/Ctrl + ,**: Settings\n\n## Tips\n- Add tags: `productivity, journal, ideas`\n- Export for backups (JSON)\n\n> Everything stays in your browser (localStorage).",
      tags: ["welcome", "tips"],
      createdAt: now,
      updatedAt: now,
      pinned: true,
    },
  ];
}

function noteTitleFromBody(body: string) {
  const firstLine = body
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  if (!firstLine) return "Untitled";
  return firstLine.replace(/^#+\s*/, "").slice(0, 64) || "Untitled";
}

export default function MarkdownNotesApp() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [splitView, setSplitView] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  const [draftTags, setDraftTags] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  // load
  useEffect(() => {
    const storedNotes = loadNotes();
    const storedTheme = loadThemeMode();
    setThemeMode(storedTheme);

    const seeded = storedNotes.length ? storedNotes : seedNotes();
    setNotes(seeded);

    const storedActive = loadActiveId();
    const first = seeded[0]?.id ?? null;
    setActiveId(storedActive && seeded.some((n) => n.id === storedActive) ? storedActive : first);
  }, []);

  // persist
  useEffect(() => {
    if (!notes.length) return;
    saveNotes(notes);
  }, [notes]);
  useEffect(() => {
    saveActiveId(activeId);
  }, [activeId]);

  // theme
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveThemeMode(themeMode);
    applyTheme(themeMode);
    if (themeMode !== "system") return;
    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql) return;
    const handler = () => applyTheme("system");
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, [themeMode]);

  const activeNote = useMemo(() => notes.find((n) => n.id === activeId) ?? null, [notes, activeId]);

  useEffect(() => {
    if (!activeNote) return;
    setDraftTags(activeNote.tags.join(", "));
  }, [activeNote?.id]);

  const allTags = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of notes) {
      for (const t of n.tags) map.set(t, (map.get(t) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => (tagFilter ? n.tags.includes(tagFilter) : true))
      .filter((n) => {
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .slice()
      .sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return b.updatedAt - a.updatedAt;
      });
  }, [notes, query, tagFilter]);

  function updateNote(id: string, updater: (n: Note) => Note) {
    setNotes((prev) => prev.map((n) => (n.id === id ? updater(n) : n)));
  }

  function createNote() {
    const now = Date.now();
    const n: Note = {
      id: uid("n"),
      title: "Untitled",
      body: "# New note\n\nStart writing…",
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
    setTimeout(() => editorRef.current?.focus(), 0);
  }

  function deleteNote(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) {
      const next = notes.find((n) => n.id !== id)?.id ?? null;
      setActiveId(next);
    }
  }

  function togglePin(id: string) {
    updateNote(id, (n) => ({ ...n, pinned: !n.pinned, updatedAt: Date.now() }));
  }

  function onBodyChange(v: string) {
    if (!activeNote) return;
    const now = Date.now();
    updateNote(activeNote.id, (n) => ({
      ...n,
      body: v,
      title: n.title === "Untitled" ? noteTitleFromBody(v) : n.title,
      updatedAt: now,
    }));
  }

  function onRename() {
    if (!activeNote) return;
    const next = window.prompt("Rename note", activeNote.title);
    if (!next) return;
    updateNote(activeNote.id, (n) => ({ ...n, title: next.trim().slice(0, 80) || n.title, updatedAt: Date.now() }));
  }

  function onApplyTags() {
    if (!activeNote) return;
    const tags = parseTags(draftTags).map((t) => t.toLowerCase());
    updateNote(activeNote.id, (n) => ({ ...n, tags, updatedAt: Date.now() }));
  }

  function exportAll() {
    downloadJson(`inkboard-export-${new Date().toISOString().slice(0, 10)}.json`, makeExport(themeMode, notes, activeId));
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
    if (!confirm(`Import ${data.notes.length} notes? This will replace your current notebook.`)) return;
    setThemeMode(data.themeMode ?? "system");
    setNotes(data.notes);
    setActiveId(data.activeId ?? (data.notes[0]?.id ?? null));
    setTagFilter(null);
    setQuery("");
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
        createNote();
      }
      if (k === "f") {
        e.preventDefault();
        (document.getElementById("note-search") as HTMLInputElement | null)?.focus();
      }
      if (e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
      }
      if (e.key === "/") {
        e.preventDefault();
        setSplitView((s) => !s);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, activeId]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_10%_0%,rgba(244,63,94,0.14),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(99,102,241,0.16),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(16,185,129,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(80%_60%_at_10%_0%,rgba(244,63,94,0.20),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(16,185,129,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">Inkboard</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Markdown notes • live preview • localStorage</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Settings
            </button>
            <button
              onClick={() => setFocusMode((f) => !f)}
              className={classNames(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                focusMode
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
                  : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              )}
            >
              Focus
            </button>
            <button
              onClick={() => setSplitView((s) => !s)}
              className={classNames(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                splitView
                  ? "border-indigo-500/30 bg-indigo-500/10"
                  : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              )}
              title="Toggle split view (⌘/Ctrl+/)"
            >
              {splitView ? "Split" : "Preview"}
            </button>
            <button onClick={createNote} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
              New
            </button>
          </div>
        </header>

        <div className={classNames("grid gap-4 sm:gap-6", focusMode ? "grid-cols-1" : "lg:grid-cols-[360px_1fr]")}> 
          {!focusMode ? (
            <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
              <input
                id="note-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes (⌘/Ctrl+F)"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => setTagFilter(null)}
                  className={classNames(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold",
                    !tagFilter
                      ? "border-indigo-500/35 bg-indigo-500/10"
                      : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  )}
                >
                  All
                </button>
                {allTags.slice(0, 10).map(([t, count]) => (
                  <button
                    key={t}
                    onClick={() => setTagFilter(t)}
                    className={classNames(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      tagFilter === t
                        ? "border-emerald-500/35 bg-emerald-500/10"
                        : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    )}
                    title={`${count} note(s)`}
                  >
                    #{t}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {filteredNotes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    No matches.
                  </div>
                ) : (
                  filteredNotes.map((n) => {
                    const isActive = n.id === activeId;
                    const snippet = n.body.replace(/\s+/g, " ").slice(0, 80);
                    return (
                      <div
                        key={n.id}
                        className={classNames(
                          "group rounded-xl border p-3 transition",
                          isActive
                            ? "border-indigo-500/40 bg-indigo-500/10"
                            : "border-black/10 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                        )}
                      >
                        <button onClick={() => setActiveId(n.id)} className="block w-full text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="line-clamp-1 text-sm font-semibold">{n.pinned ? "📌 " : ""}{n.title}</div>
                              <div className="mt-0.5 line-clamp-1 text-xs text-zinc-600 dark:text-zinc-300">{snippet || "(empty)"}</div>
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatDateTime(n.updatedAt)}</div>
                          </div>
                        </button>
                        <div className="mt-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                          <button
                            onClick={() => togglePin(n.id)}
                            className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-[11px] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                          >
                            {n.pinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete \"${n.title}\"?`)) deleteNote(n.id);
                            }}
                            className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-2 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Shortcuts: <span className="font-semibold">⌘/Ctrl+K</span> new • <span className="font-semibold">⌘/Ctrl+F</span> search • <span className="font-semibold">⌘/Ctrl+/</span> preview • <span className="font-semibold">⌘/Ctrl+,</span> settings
              </div>
            </aside>
          ) : null}

          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="min-w-0">
                <div className="line-clamp-1 text-sm font-semibold tracking-tight">{activeNote?.title ?? "No note selected"}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                  {activeNote ? `Updated ${formatDateTime(activeNote.updatedAt)}` : "Create a note to begin"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onRename}
                  disabled={!activeNote}
                  className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    if (!activeNote) return;
                    navigator.clipboard?.writeText(activeNote.body);
                  }}
                  disabled={!activeNote}
                  className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    if (!activeNote) return;
                    downloadJson(`${activeNote.title.replace(/[^a-z0-9]+/gi, "-").slice(0, 24) || "note"}.json`, makeExport(themeMode, [activeNote], activeNote.id));
                  }}
                  disabled={!activeNote}
                  className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  Export
                </button>
              </div>
            </div>

            {activeNote ? (
              <div className={classNames("grid", splitView ? "lg:grid-cols-2" : "grid-cols-1")}>
                <section className="border-b border-black/10 p-4 dark:border-white/10 lg:border-b-0 lg:border-r">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Editor</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={draftTags}
                        onChange={(e) => setDraftTags(e.target.value)}
                        placeholder="tags: work, ideas"
                        className="w-56 rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
                      />
                      <button
                        onClick={onApplyTags}
                        className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={editorRef}
                    value={activeNote.body}
                    onChange={(e) => onBodyChange(e.target.value)}
                    className="h-[62dvh] w-full resize-none rounded-2xl border border-black/10 bg-white/60 px-3 py-3 font-mono text-[13px] leading-6 outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/5"
                    placeholder="# Title\n\nWrite markdown…"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    {activeNote.tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => setTagFilter(t)}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 hover:bg-emerald-500/15 dark:text-emerald-200"
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={classNames("p-4", splitView ? "block" : "hidden lg:block")}>
                  <div className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">Preview</div>
                  <article className="prose prose-zinc max-w-none rounded-2xl border border-black/10 bg-white/60 p-4 prose-headings:tracking-tight prose-pre:bg-zinc-950 prose-pre:text-zinc-50 dark:prose-invert dark:border-white/10 dark:bg-white/5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                      {activeNote.body}
                    </ReactMarkdown>
                  </article>
                </section>
              </div>
            ) : (
              <div className="p-6">
                <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                  No note selected. Create one with <span className="font-semibold">New</span>.
                </div>
              </div>
            )}
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
                  <button
                    onClick={exportAll}
                    className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
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
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Import replaces current notebook.</div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Danger zone</div>
                <button
                  onClick={() => {
                    if (!confirm("Reset everything (notes + settings)?")) return;
                    window.localStorage.clear();
                    const seeded = seedNotes();
                    setNotes(seeded);
                    setActiveId(seeded[0]?.id ?? null);
                    setThemeMode("system");
                    setTagFilter(null);
                    setQuery("");
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
