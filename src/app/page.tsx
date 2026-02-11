"use client";

import { useEffect, useMemo, useState } from "react";

type Snippet = {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  mood: "spark" | "flow" | "ship";
  favorite: boolean;
  lastViewedAt: number;
  createdAt: number;
};

const LANGS = ["TypeScript", "JavaScript", "Python", "SQL", "Bash", "CSS", "HTML", "Go", "Rust"];

const seed: Snippet[] = [
  {
    id: "s1",
    title: "Fetch wrapper with typed result",
    code: "export async function getJson<T>(url: string): Promise<T> {\n  const r = await fetch(url);\n  if (!r.ok) throw new Error('Request failed');\n  return r.json() as Promise<T>;\n}",
    language: "TypeScript",
    tags: ["api", "utility"],
    mood: "flow",
    favorite: true,
    lastViewedAt: Date.now() - 1000 * 60 * 2,
    createdAt: Date.now() - 1000 * 60 * 60,
  },
  {
    id: "s2",
    title: "Debounce helper",
    code: "export const debounce = <T extends (...args: any[]) => void>(fn: T, wait = 200) => {\n  let t: ReturnType<typeof setTimeout>;\n  return (...args: Parameters<T>) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...args), wait);\n  };\n};",
    language: "TypeScript",
    tags: ["perf", "ui"],
    mood: "spark",
    favorite: false,
    lastViewedAt: Date.now() - 1000 * 60 * 30,
    createdAt: Date.now() - 1000 * 60 * 120,
  },
];

const cid = () => Math.random().toString(36).slice(2, 10);

export default function Home() {
  const [snippets, setSnippets] = useState<Snippet[]>(seed);
  const [activeId, setActiveId] = useState<string>(seed[0].id);
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("arena.snippets.v2");
    if (raw) {
      const parsed = JSON.parse(raw) as Snippet[];
      setSnippets(parsed);
      if (parsed[0]) setActiveId(parsed[0].id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("arena.snippets.v2", JSON.stringify(snippets));
  }, [snippets]);

  const allTags = useMemo(() => ["all", ...Array.from(new Set(snippets.flatMap((s) => s.tags)))], [snippets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return snippets
      .filter((s) => (showFavOnly ? s.favorite : true))
      .filter((s) => (tagFilter === "all" ? true : s.tags.includes(tagFilter)))
      .filter((s) =>
        q
          ? [s.title, s.code, s.language, s.tags.join(" ")].join(" ").toLowerCase().includes(q)
          : true
      )
      .sort((a, b) => b.lastViewedAt - a.lastViewedAt);
  }, [snippets, query, tagFilter, showFavOnly]);

  const active = snippets.find((s) => s.id === activeId) ?? filtered[0];

  const update = (id: string, patch: Partial<Snippet>) => {
    setSnippets((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const createSnippet = () => {
    const item: Snippet = {
      id: cid(),
      title: "Untitled idea",
      code: "// drop your next epiphany here",
      language: "TypeScript",
      tags: ["new"],
      mood: "spark",
      favorite: false,
      lastViewedAt: Date.now(),
      createdAt: Date.now(),
    };
    setSnippets((p) => [item, ...p]);
    setActiveId(item.id);
  };

  const removeActive = () => {
    if (!active) return;
    const next = snippets.filter((s) => s.id !== active.id);
    setSnippets(next);
    setActiveId(next[0]?.id ?? "");
  };

  const copyCode = async () => {
    if (!active) return;
    await navigator.clipboard.writeText(active.code);
    setCopied(active.id);
    setTimeout(() => setCopied(null), 1200);
  };

  const moodClass = {
    spark: "from-fuchsia-500/30 to-orange-400/25",
    flow: "from-cyan-500/25 to-indigo-500/25",
    ship: "from-emerald-500/25 to-teal-400/25",
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#1d4ed855_0,#0a0f1f_30%,#030712_80%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Snippet Constellation</p>
            <h1 className="text-2xl font-bold md:text-4xl">A living archive of your coding sparks</h1>
          </div>
          <button onClick={createSnippet} className="rounded-2xl bg-cyan-400 px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-cyan-500/30 transition hover:-translate-y-0.5">
            + New Memory
          </button>
        </header>

        <div className="grid gap-4 md:grid-cols-[340px_1fr]">
          <aside className="rounded-3xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl">
            <div className="mb-3 flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by intent, tag, or code…"
                className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm outline-none ring-cyan-300/40 focus:ring"
              />
              <button onClick={() => setShowFavOnly((v) => !v)} className={`rounded-xl px-3 text-sm ${showFavOnly ? "bg-yellow-300 text-slate-900" : "bg-white/10"}`}>
                ★
              </button>
            </div>
            <div className="mb-3 flex flex-wrap gap-2">
              {allTags.map((t) => (
                <button key={t} onClick={() => setTagFilter(t)} className={`rounded-full border px-3 py-1 text-xs ${tagFilter === t ? "border-cyan-200 bg-cyan-400/20" : "border-white/15 bg-white/5"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveId(s.id);
                    update(s.id, { lastViewedAt: Date.now() });
                  }}
                  className={`w-full rounded-2xl border p-3 text-left transition ${active?.id === s.id ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{s.title}</p>
                    <span className="text-xs text-cyan-100/80">{s.language}</span>
                  </div>
                  <p className="mt-1 max-h-9 overflow-hidden text-xs text-slate-300">{s.code.replace(/\n/g, " ")}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">#{t}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className={`rounded-3xl border border-white/15 bg-gradient-to-br ${moodClass[active?.mood ?? "spark"]} p-4 shadow-2xl backdrop-blur-xl md:p-6`}>
            {active ? (
              <>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <input
                    value={active.title}
                    onChange={(e) => update(active.id, { title: e.target.value })}
                    className="min-w-[230px] flex-1 rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-lg font-semibold outline-none focus:ring focus:ring-cyan-300/40"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => update(active.id, { favorite: !active.favorite })} className="rounded-xl bg-white/15 px-3 py-2 text-sm">{active.favorite ? "★ Favorited" : "☆ Favorite"}</button>
                    <button onClick={copyCode} className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-900">{copied === active.id ? "Copied" : "Copy"}</button>
                    <button onClick={removeActive} className="rounded-xl bg-rose-400/80 px-3 py-2 text-sm font-semibold text-slate-950">Delete</button>
                  </div>
                </div>

                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <select
                    value={active.language}
                    onChange={(e) => update(active.id, { language: e.target.value })}
                    className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-sm"
                  >
                    {LANGS.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={active.mood}
                    onChange={(e) => update(active.id, { mood: e.target.value as Snippet["mood"] })}
                    className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-sm"
                  >
                    <option value="spark">Spark</option>
                    <option value="flow">Flow</option>
                    <option value="ship">Ship</option>
                  </select>
                  <input
                    value={active.tags.join(",")}
                    onChange={(e) => update(active.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                    className="rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-sm"
                    placeholder="tags: auth, ui"
                  />
                </div>

                <textarea
                  value={active.code}
                  onChange={(e) => update(active.id, { code: e.target.value })}
                  className="min-h-[420px] w-full rounded-2xl border border-white/20 bg-slate-950/70 p-4 font-mono text-sm leading-6 text-cyan-100 outline-none focus:ring focus:ring-cyan-300/40"
                  spellCheck={false}
                />
              </>
            ) : (
              <div className="grid min-h-[500px] place-items-center text-center text-slate-200">
                <div>
                  <p className="mb-2 text-2xl font-semibold">No snippets yet</p>
                  <p>Create your first coding memory to begin the story.</p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
