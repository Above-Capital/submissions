"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChatThread, ThemeMode } from "../lib/types";
import {
  loadActiveThreadId,
  loadThemeMode,
  loadThreads,
  makeExport,
  saveActiveThreadId,
  saveThemeMode,
  saveThreads,
  validateImport,
} from "../lib/storage";
import { classNames, downloadJson, formatTime, linkify, uid } from "../lib/utils";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("dark");

  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }
  if (mode === "light") {
    return;
  }
  // system
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (mql?.matches) root.classList.add("dark");
}

function defaultThreads(): ChatThread[] {
  const now = Date.now();
  return [
    {
      id: uid("t"),
      title: "Welcome",
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          id: uid("m"),
          role: "assistant",
          text: "This is a local-first chat app. Everything stays in your browser (localStorage).\n\nTips:\n- New thread: ⌘/Ctrl + K\n- Search: ⌘/Ctrl + F\n- Export/Import from Settings",
          createdAt: now,
        },
      ],
    },
  ];
}

export default function ChatApp() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [composer, setComposer] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial load
  useEffect(() => {
    const storedThreads = loadThreads();
    const storedTheme = loadThemeMode();
    setThemeMode(storedTheme);

    const seeded = storedThreads.length ? storedThreads : defaultThreads();
    setThreads(seeded);

    const storedActive = loadActiveThreadId();
    setActiveId(storedActive && seeded.some((t) => t.id === storedActive) ? storedActive : seeded[0]?.id ?? null);
  }, []);

  // Persist threads + active selection
  useEffect(() => {
    if (!threads.length) return;
    saveThreads(threads);
  }, [threads]);

  useEffect(() => {
    saveActiveThreadId(activeId);
  }, [activeId]);

  // Theme
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

  const activeThread = useMemo(() => threads.find((t) => t.id === activeId) ?? null, [threads, activeId]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads
      .map((t) => {
        const hitTitle = t.title.toLowerCase().includes(q);
        const hitMsg = t.messages.some((m) => m.text.toLowerCase().includes(q));
        return { t, score: (hitTitle ? 2 : 0) + (hitMsg ? 1 : 0) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.t.updatedAt - a.t.updatedAt)
      .map((x) => x.t);
  }, [threads, query]);

  function updateThread(threadId: string, updater: (t: ChatThread) => ChatThread) {
    setThreads((prev) => prev.map((t) => (t.id === threadId ? updater(t) : t)));
  }

  function createThread() {
    const now = Date.now();
    const t: ChatThread = {
      id: uid("t"),
      title: `New chat ${new Intl.DateTimeFormat(undefined, { month: "short", day: "2-digit" }).format(new Date(now))}`,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setThreads((prev) => [t, ...prev]);
    setActiveId(t.id);
    setTimeout(() => composerRef.current?.focus(), 0);
  }

  function deleteThread(threadId: string) {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (activeId === threadId) {
      const next = threads.find((t) => t.id !== threadId)?.id ?? null;
      setActiveId(next);
    }
  }

  function renameThread(threadId: string) {
    const t = threads.find((x) => x.id === threadId);
    if (!t) return;
    const next = window.prompt("Rename thread", t.title);
    if (!next) return;
    updateThread(threadId, (cur) => ({ ...cur, title: next.trim().slice(0, 80) || cur.title, updatedAt: Date.now() }));
  }

  function sendMessage() {
    const text = composer.trim();
    if (!text || !activeThread) return;
    const now = Date.now();
    updateThread(activeThread.id, (t) => ({
      ...t,
      updatedAt: now,
      messages: [
        ...t.messages,
        { id: uid("m"), role: "you", text, createdAt: now },
        {
          id: uid("m"),
          role: "assistant",
          text: autoReply(text),
          createdAt: now + 1,
        },
      ],
    }));
    setComposer("");
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }

  function autoReply(text: string) {
    // Offline, deterministic helper replies (no network). This keeps the app "chat-like".
    const t = text.toLowerCase();
    if (t.includes("/help")) {
      return "Commands:\n- /help\n- /summarize\n- /todo\n\nEverything is local: nothing is sent anywhere.";
    }
    if (t.includes("/summarize")) {
      const msgs = activeThread?.messages ?? [];
      const last = msgs.slice(-6).map((m) => `- ${m.role}: ${m.text.replace(/\s+/g, " ").slice(0, 80)}`).join("\n");
      return `Quick summary (local):\n${last || "(no prior messages)"}`;
    }
    if (t.includes("/todo")) {
      return "Local TODOs idea:\n- Write what you need\n- Export for backup\n- Keep one thread per project";
    }
    return "Saved locally. (No network calls here.)";
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        createThread();
      }
      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        (document.getElementById("thread-search") as HTMLInputElement | null)?.focus();
      }
      if (e.key === ",") {
        e.preventDefault();
        setShowSettings(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads, activeId]);

  useEffect(() => {
    // Keep scroll pinned to bottom when active thread changes
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    });
  }, [activeId]);

  function onExport() {
    downloadJson(`localchat-export-${new Date().toISOString().slice(0, 10)}.json`, makeExport(themeMode, threads));
  }

  async function onImportFile(file: File) {
    const raw = await file.text();
    const parsed = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    })();

    const data = validateImport(parsed);
    if (!data) {
      alert("Import failed: not a supported export file.");
      return;
    }
    if (!confirm(`Import ${data.threads.length} thread(s)? This will replace your current data.`)) return;

    setThemeMode(data.themeMode ?? "system");
    setThreads(data.threads);
    setActiveId(data.threads[0]?.id ?? null);
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(16,185,129,0.14),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(80%_60%_at_10%_0%,rgba(99,102,241,0.20),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(16,185,129,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold tracking-tight">LocalChat</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">localStorage • exportable • offline</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-medium hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                Settings
              </button>
              <button
                onClick={createThread}
                className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                New
              </button>
            </div>
          </div>

          <div className="mt-4">
            <input
              id="thread-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search threads & messages (⌘/Ctrl+F)"
              className="w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
            />
          </div>

          <div className="mt-4 space-y-2">
            {filteredThreads.length === 0 ? (
              <div className="rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                No matches.
              </div>
            ) : (
              filteredThreads
                .slice()
                .sort((a, b) => b.updatedAt - a.updatedAt)
                .map((t) => {
                  const isActive = t.id === activeId;
                  const last = t.messages[t.messages.length - 1];
                  return (
                    <div
                      key={t.id}
                      className={classNames(
                        "group rounded-xl border p-3 transition",
                        isActive
                          ? "border-indigo-500/40 bg-indigo-500/10"
                          : "border-black/10 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      )}
                    >
                      <button onClick={() => setActiveId(t.id)} className="block w-full text-left">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="line-clamp-1 text-sm font-semibold">{t.title}</div>
                            <div className="mt-0.5 line-clamp-1 text-xs text-zinc-600 dark:text-zinc-300">
                              {last ? `${last.role === "you" ? "You" : "Local"}: ${last.text.replace(/\s+/g, " ")}` : "No messages yet"}
                            </div>
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatTime(t.updatedAt)}</div>
                        </div>
                      </button>

                      <div className="mt-2 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => renameThread(t.id)}
                          className="rounded-lg border border-black/10 bg-white/60 px-2 py-1 text-[11px] hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${t.title}"?`)) deleteThread(t.id);
                          }}
                          className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-500/15 dark:text-rose-200"
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
            Shortcuts: <span className="font-medium">⌘/Ctrl+K</span> new • <span className="font-medium">⌘/Ctrl+F</span> search • <span className="font-medium">⌘/Ctrl+,</span> settings
          </div>
        </aside>

        <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-3 dark:border-white/10">
            <div className="min-w-0">
              <div className="line-clamp-1 text-sm font-semibold tracking-tight">{activeThread?.title ?? "No thread"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {activeThread ? `${activeThread.messages.length} message(s) • updated ${formatTime(activeThread.updatedAt)}` : "Create a thread to start"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!activeThread) return;
                  if (!confirm("Clear messages in this thread?")) return;
                  updateThread(activeThread.id, (t) => ({ ...t, messages: [], updatedAt: Date.now() }));
                }}
                className="rounded-xl border border-black/10 bg-white/60 px-3 py-1.5 text-xs font-medium hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  const blob = makeExport(themeMode, threads);
                  const justOne = { ...blob, threads: activeThread ? [activeThread] : [] };
                  downloadJson(`thread-${activeThread?.title?.replace(/[^a-z0-9]+/gi, "-").slice(0, 24) || "chat"}.json`, justOne);
                }}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
              >
                Export thread
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="h-[58dvh] overflow-auto px-4 py-4 sm:h-[64dvh]">
            {activeThread?.messages?.length ? (
              <div className="space-y-3">
                {activeThread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={classNames(
                      "flex",
                      m.role === "you" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={classNames(
                        "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                        m.role === "you"
                          ? "bg-indigo-600 text-white"
                          : "bg-white/70 text-zinc-900 dark:bg-white/10 dark:text-zinc-50"
                      )}
                    >
                      <div className="whitespace-pre-wrap leading-6">
                        {linkify(m.text).map((p, i) =>
                          p.url ? (
                            <a
                              key={i}
                              href={p.url}
                              target="_blank"
                              rel="noreferrer"
                              className={classNames(
                                "underline underline-offset-2",
                                m.role === "you" ? "decoration-white/60" : "decoration-zinc-400 dark:decoration-zinc-500"
                              )}
                            >
                              {p.t}
                            </a>
                          ) : (
                            <span key={i}>{p.t}</span>
                          )
                        )}
                      </div>
                      <div className={classNames("mt-2 text-[11px]", m.role === "you" ? "text-white/70" : "text-zinc-500 dark:text-zinc-400")}>
                        {m.role === "you" ? "You" : "Local"} • {formatTime(m.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-black/15 p-6 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                No messages yet. Write something below and hit <span className="font-semibold">Send</span>.
                <div className="mt-3 text-xs">
                  Try: <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono dark:bg-white/10">/help</span> or <span className="rounded bg-black/5 px-1.5 py-0.5 font-mono dark:bg-white/10">/summarize</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-black/10 p-4 dark:border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Message</label>
                <textarea
                  ref={composerRef}
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message… (⌘/Ctrl+Enter to send)"
                  className="mt-1 h-24 w-full resize-none rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setComposer((c) => (c ? c : ""));
                    sendMessage();
                  }}
                  disabled={!activeThread || !composer.trim()}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    if (!activeThread) return;
                    updateThread(activeThread.id, (t) => ({
                      ...t,
                      updatedAt: Date.now(),
                      messages: [
                        ...t.messages,
                        {
                          id: uid("m"),
                          role: "assistant",
                          text: "Draft saved locally. Export from Settings if you want a backup.",
                          createdAt: Date.now(),
                        },
                      ],
                    }));
                    requestAnimationFrame(() => {
                      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                    });
                  }}
                  className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  Nudge
                </button>
              </div>
            </div>

            <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
              Local-only demo assistant replies are deterministic. Nothing leaves your device.
            </div>
          </div>
        </main>
      </div>

      {/* Settings modal */}
      {showSettings ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Settings</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">Theme, export/import, and data tools.</div>
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
                    onClick={onExport}
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
                      if (f) void onImportFile(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                  Import replaces current data. Export is plain JSON.
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Danger zone</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (!confirm("Reset EVERYTHING (threads + settings)?")) return;
                      window.localStorage.clear();
                      const seeded = defaultThreads();
                      setThreads(seeded);
                      setActiveId(seeded[0]?.id ?? null);
                      setThemeMode("system");
                      setShowSettings(false);
                    }}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
                  >
                    Reset all
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
