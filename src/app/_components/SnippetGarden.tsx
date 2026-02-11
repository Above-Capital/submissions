"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { clamp, loadGardenState, newId, saveGardenState } from "@/lib/storage";
import type { GardenState, Snippet } from "@/lib/types";

const TAGS = [
  { id: "pattern", label: "Patterns", hue: 210 },
  { id: "bugfix", label: "Bugfix", hue: 350 },
  { id: "tooling", label: "Tooling", hue: 45 },
  { id: "ui", label: "UI", hue: 160 },
  { id: "safety", label: "Safety", hue: 280 },
  { id: "perf", label: "Perf", hue: 12 },
  { id: "text", label: "Text", hue: 95 },
  { id: "http", label: "HTTP", hue: 230 },
  { id: "parser", label: "Parser", hue: 120 },
] as const;

function tagHue(tag: string) {
  const t = TAGS.find((x) => x.id === tag);
  if (t) return t.hue;
  // stable-ish hash → hue
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h % 360;
}

function now() {
  return Date.now();
}

function normalizeSnippet(s: Snippet): Snippet {
  return {
    ...s,
    position: s.position ?? { x: Math.random() * 0.8 + 0.1, y: Math.random() * 0.8 + 0.1 },
    tags: (s.tags ?? []).map((t) => t.trim()).filter(Boolean),
    language: s.language || "txt",
    title: s.title || "Untitled",
    content: s.content || "",
    updatedAt: s.updatedAt || s.createdAt || now(),
    createdAt: s.createdAt || now(),
  };
}

function sortBySerendipity(snips: Snippet[]) {
  // older + less viewed gets a boost, but keep some recency.
  return [...snips].sort((a, b) => {
    const score = (s: Snippet) => {
      const age = (now() - s.createdAt) / (1000 * 60 * 60 * 24);
      const sinceView = (now() - (s.lastViewedAt ?? 0)) / (1000 * 60 * 60);
      const freshness = (now() - s.updatedAt) / (1000 * 60 * 60);
      return age * 0.6 + sinceView * 0.9 + Math.max(0, freshness) * 0.2 + Math.random() * 2;
    };
    return score(b) - score(a);
  });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function SnippetGarden() {
  const [state, setState] = useState<GardenState>(() => ({ version: 1, snippets: [] }));
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mode, setMode] = useState<"garden" | "lens">("garden");

  const gardenRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef<{ id: string; dx: number; dy: number } | null>(null);

  useEffect(() => {
    const s = loadGardenState();
    setState({ ...s, snippets: s.snippets.map(normalizeSnippet) });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveGardenState(state);
  }, [loaded, state]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const s of state.snippets) for (const t of s.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [state.snippets]);

  const selected = useMemo(
    () => state.snippets.find((s) => s.id === state.selectedId) ?? null,
    [state.selectedId, state.snippets]
  );

  const filtered = useMemo(() => {
    const whisper = (state.whisper ?? "").trim().toLowerCase();
    return state.snippets.filter((s) => {
      const okTag = state.activeTag ? s.tags.includes(state.activeTag) : true;
      if (!okTag) return false;
      if (!whisper) return true;
      const hay = `${s.title}\n${s.tags.join(" ")}\n${s.language}\n${s.content}`.toLowerCase();
      return hay.includes(whisper);
    });
  }, [state.activeTag, state.snippets, state.whisper]);

  const connections = useMemo(() => {
    // connect snippets that share a tag (but keep it sparse)
    const ids = new Set(filtered.map((s) => s.id));
    const pairs: Array<{ a: Snippet; b: Snippet; tag: string }> = [];
    for (let i = 0; i < filtered.length; i++) {
      for (let j = i + 1; j < filtered.length; j++) {
        const a = filtered[i];
        const b = filtered[j];
        const tag = a.tags.find((t) => b.tags.includes(t));
        if (!tag) continue;
        // random thinning
        if ((a.id.charCodeAt(0) + b.id.charCodeAt(0)) % 3 === 0) {
          pairs.push({ a, b, tag });
        }
      }
    }
    return pairs;
  }, [filtered]);

  function select(id: string) {
    setState((prev) => {
      const updated = prev.snippets.map((s) => (s.id === id ? { ...s, lastViewedAt: now() } : s));
      return { ...prev, snippets: updated, selectedId: id };
    });
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    const el = gardenRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const s = state.snippets.find((x) => x.id === id);
    if (!s?.position) return;

    const px = s.position.x * rect.width;
    const py = s.position.y * rect.height;

    dragging.current = { id, dx: e.clientX - rect.left - px, dy: e.clientY - rect.top - py };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const el = gardenRef.current;
    const d = dragging.current;
    if (!el || !d) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - d.dx) / rect.width;
    const y = (e.clientY - rect.top - d.dy) / rect.height;
    setState((prev) => ({
      ...prev,
      snippets: prev.snippets.map((s) =>
        s.id === d.id ? { ...s, position: { x: clamp(x, 0.06, 0.94), y: clamp(y, 0.08, 0.92) } } : s
      ),
    }));
  }

  function onPointerUp() {
    dragging.current = null;
  }

  function createSnippet() {
    const id = newId();
    const s: Snippet = normalizeSnippet({
      id,
      title: "New seed",
      language: "ts",
      tags: [],
      content: "// paste something worth remembering\n",
      createdAt: now(),
      updatedAt: now(),
      lastViewedAt: now(),
      vibe: "seed",
      position: { x: Math.random() * 0.6 + 0.2, y: Math.random() * 0.6 + 0.2 },
    });
    setState((prev) => ({ ...prev, snippets: [s, ...prev.snippets], selectedId: id }));
    setToast("Planted.");
  }

  function deleteSelected() {
    if (!selected) return;
    setState((prev) => {
      const next = prev.snippets.filter((s) => s.id !== selected.id);
      return { ...prev, snippets: next, selectedId: next[0]?.id };
    });
    setToast("Composted.");
  }

  function breeze() {
    const picks = sortBySerendipity(filtered);
    const pick = picks[0];
    if (!pick) return;
    select(pick.id);
    setToast("A breeze surfaced something.");
  }

  function updateSelected(patch: Partial<Snippet>) {
    if (!selected) return;
    setState((prev) => ({
      ...prev,
      snippets: prev.snippets.map((s) => (s.id === selected.id ? { ...s, ...patch, updatedAt: now() } : s)),
    }));
  }

  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.55)] grid place-items-center">
          <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-300 via-indigo-300 to-fuchsia-300 blur-[0.2px]" />
        </div>
        <div>
          <div className="text-white/90 text-sm tracking-[0.22em] uppercase">Snippet Garden</div>
          <div className="text-white/70 text-xs">A calm archive that resurface gems when you need them.</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setMode((m) => (m === "garden" ? "lens" : "garden"))}
          className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
        >
          {mode === "garden" ? "Switch: Lens" : "Switch: Garden"}
        </button>
        <button
          onClick={breeze}
          className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
        >
          Breeze
        </button>
        <button
          onClick={createSnippet}
          className="rounded-full px-3 py-2 text-sm bg-white text-black hover:bg-white/90"
        >
          Plant a seed
        </button>
      </div>
    </div>
  );

  const [lensIndex, setLensIndex] = useState(0);

  const lensStack = useMemo(() => sortBySerendipity(filtered), [filtered]);
  const lens = lensStack.length ? lensStack[clamp(lensIndex, 0, lensStack.length - 1)] : null;

  useEffect(() => {
    setLensIndex(0);
  }, [state.activeTag, state.whisper]);

  return mode === "lens" ? (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_10%_10%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(900px_600px_at_85%_15%,rgba(236,72,153,0.25),transparent_55%),radial-gradient(900px_700px_at_40%_90%,rgba(34,211,238,0.18),transparent_55%),linear-gradient(180deg,#05060a, #060812 40%, #070915)]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.7] mix-blend-screen bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_35%)]" />
      <div className="mx-auto max-w-4xl px-4 py-8">
        {header}

        <div className="mt-6 rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setState((p) => ({ ...p, activeTag: undefined }))}
                className={`px-3 py-1 rounded-full text-xs ring-1 ${
                  state.activeTag ? "bg-white/5 ring-white/10 text-white/70" : "bg-white/12 ring-white/20 text-white"
                }`}
              >
                All
              </button>
              {allTags.slice(0, 10).map((t) => (
                <button
                  key={t}
                  onClick={() => setState((p) => ({ ...p, activeTag: p.activeTag === t ? undefined : t }))}
                  className={`px-3 py-1 rounded-full text-xs ring-1 transition ${
                    state.activeTag === t ? "bg-white/14 ring-white/25 text-white" : "bg-white/5 ring-white/10 text-white/70 hover:bg-white/10"
                  }`}
                  style={{ boxShadow: state.activeTag === t ? `0 0 0 1px hsla(${tagHue(t)},90%,70%,0.25), 0 0 35px hsla(${tagHue(t)},90%,70%,0.18)` : undefined }}
                >
                  {t}
                </button>
              ))}
            </div>
            <input
              value={state.whisper ?? ""}
              onChange={(e) => setState((p) => ({ ...p, whisper: e.target.value }))}
              placeholder="whisper a concept…"
              className="w-full sm:w-72 rounded-full bg-black/20 ring-1 ring-white/10 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 outline-none focus:ring-white/25"
            />
          </div>

          <div className="p-5">
            {!lens ? (
              <div className="text-white/55 text-sm">No seeds match that whisper. Try a different vibe.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4 items-start">
                <div className="rounded-3xl bg-black/25 ring-1 ring-white/10 p-4">
                  <div className="text-white/60 text-xs tracking-[0.22em] uppercase">Lens</div>
                  <div className="mt-2 text-white text-2xl font-semibold leading-tight">{lens.title}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(lens.tags.length ? lens.tags : [lens.language]).map((t) => (
                      <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/6 ring-1 ring-white/10 text-white/70">
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        select(lens.id);
                        setToast("Opened.");
                      }}
                      className="rounded-full px-3 py-2 text-sm bg-white text-black hover:bg-white/90"
                    >
                      Open in garden
                    </button>
                    <button
                      onClick={async () => {
                        const ok = await copyText(lens.content);
                        setToast(ok ? "Copied." : "Copy failed.");
                      }}
                      className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setLensIndex((i) => Math.max(0, i - 1))}
                      className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setLensIndex((i) => Math.min(lensStack.length - 1, i + 1))}
                      className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => {
                        setLensIndex(0);
                        setToast("Breezed.");
                      }}
                      className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                    >
                      Breeze
                    </button>
                  </div>

                  <div className="mt-4 text-xs text-white/45">
                    {lensIndex + 1} / {lensStack.length} • curated by age + neglect + a pinch of chaos
                  </div>
                </div>

                <div className="rounded-3xl bg-black/30 ring-1 ring-white/10 overflow-hidden">
                  <pre className="p-4 text-[12px] leading-5 text-white/85 overflow-auto max-h-[520px]">
                    <code>{lens.content}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 ring-1 ring-white/15 px-4 py-2 text-sm text-white/85 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
          {toast}
        </div>
      ) : null}
    </div>
  ) : (
    <div className="min-h-screen bg-[radial-gradient(1200px_700px_at_10%_10%,rgba(99,102,241,0.25),transparent_60%),radial-gradient(900px_600px_at_85%_15%,rgba(236,72,153,0.25),transparent_55%),radial-gradient(900px_700px_at_40%_90%,rgba(34,211,238,0.18),transparent_55%),linear-gradient(180deg,#05060a, #060812 40%, #070915)]">
      <div className="pointer-events-none fixed inset-0 opacity-[0.7] mix-blend-screen bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.05),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.05),transparent_35%)]" />

      <div className="mx-auto max-w-6xl px-4 py-8">
        {header}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="text-white/80 text-sm">Choose a vibe:</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setState((p) => ({ ...p, activeTag: undefined }))}
                    className={`px-3 py-1 rounded-full text-xs ring-1 ${
                      state.activeTag ? "bg-white/5 ring-white/10 text-white/70" : "bg-white/12 ring-white/20 text-white"
                    }`}
                  >
                    All
                  </button>
                  {allTags.slice(0, 8).map((t) => (
                    <button
                      key={t}
                      onClick={() => setState((p) => ({ ...p, activeTag: p.activeTag === t ? undefined : t }))}
                      className={`px-3 py-1 rounded-full text-xs ring-1 transition ${
                        state.activeTag === t ? "bg-white/14 ring-white/25 text-white" : "bg-white/5 ring-white/10 text-white/70 hover:bg-white/10"
                      }`}
                      style={{ boxShadow: state.activeTag === t ? `0 0 0 1px hsla(${tagHue(t)},90%,70%,0.25), 0 0 35px hsla(${tagHue(t)},90%,70%,0.18)` : undefined }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="hidden sm:block">
                <input
                  value={state.whisper ?? ""}
                  onChange={(e) => setState((p) => ({ ...p, whisper: e.target.value }))}
                  placeholder="whisper to the garden…"
                  className="w-56 rounded-full bg-black/20 ring-1 ring-white/10 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 outline-none focus:ring-white/25"
                />
              </div>
            </div>

            <div className="relative aspect-[16/11] min-h-[420px]" ref={gardenRef} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 700" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="mist" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="rgba(255,255,255,0.10)" />
                    <stop offset="1" stopColor="rgba(255,255,255,0.02)" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="1000" height="700" fill="url(#mist)" />
                {connections.map((c, idx) => {
                  const ax = (c.a.position?.x ?? 0.5) * 1000;
                  const ay = (c.a.position?.y ?? 0.5) * 700;
                  const bx = (c.b.position?.x ?? 0.5) * 1000;
                  const by = (c.b.position?.y ?? 0.5) * 700;
                  const hue = tagHue(c.tag);
                  return (
                    <line
                      key={idx}
                      x1={ax}
                      y1={ay}
                      x2={bx}
                      y2={by}
                      stroke={`hsla(${hue},90%,70%,0.15)`}
                      strokeWidth={1}
                    />
                  );
                })}
              </svg>

              {filtered.map((s) => {
                const hue = tagHue(s.tags[0] ?? s.language);
                const isSel = s.id === selected?.id;
                const left = `${(s.position?.x ?? 0.5) * 100}%`;
                const top = `${(s.position?.y ?? 0.5) * 100}%`;
                return (
                  <button
                    key={s.id}
                    onClick={() => select(s.id)}
                    onPointerDown={(e) => onPointerDown(e, s.id)}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-3 py-2 text-left backdrop-blur-md ring-1 transition ${
                      isSel
                        ? "bg-white/12 ring-white/25"
                        : "bg-white/6 ring-white/10 hover:bg-white/10 hover:ring-white/20"
                    }`}
                    style={{ left, top, boxShadow: `0 18px 70px hsla(${hue},90%,65%,${isSel ? 0.22 : 0.10})` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: `hsla(${hue},90%,70%,0.85)`, boxShadow: `0 0 0 1px hsla(${hue},90%,75%,0.25), 0 0 20px hsla(${hue},90%,70%,0.35)` }}
                      />
                      <div className="text-white/90 text-sm font-medium leading-tight max-w-[200px] truncate">
                        {s.title}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(s.tags.length ? s.tags : [s.language]).slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-black/20 ring-1 ring-white/10 text-white/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="pointer-events-none mt-2 text-[11px] text-white/50 opacity-0 group-hover:opacity-100 transition">
                      drag to rearrange • click to open
                    </div>
                  </button>
                );
              })}

              <div className="absolute left-3 bottom-3 text-xs text-white/45">
                {filtered.length} seeds • {connections.length} threads
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="px-4 py-4 border-b border-white/10">
              <div className="flex items-center justify-between gap-2">
                <div className="text-white/85 text-sm">{selected ? "Tend this seed" : "Select a seed"}</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={!selected}
                    onClick={async () => {
                      if (!selected) return;
                      const ok = await copyText(selected.content);
                      setToast(ok ? "Copied." : "Copy failed.");
                    }}
                    className="rounded-full px-3 py-1.5 text-xs bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85 disabled:opacity-40"
                  >
                    Copy
                  </button>
                  <button
                    disabled={!selected}
                    onClick={deleteSelected}
                    className="rounded-full px-3 py-1.5 text-xs bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85 disabled:opacity-40"
                  >
                    Compost
                  </button>
                </div>
              </div>
              <div className="mt-1 text-xs text-white/50">
                Tip: use “Breeze” when you can’t remember what you already know.
              </div>
            </div>

            {!selected ? (
              <div className="p-6 text-white/55 text-sm">
                Click any seed in the garden to open it. Or plant a new one.
              </div>
            ) : (
              <div className="p-4">
                <label className="text-xs text-white/55">Title</label>
                <input
                  value={selected.title}
                  onChange={(e) => updateSelected({ title: e.target.value })}
                  className="mt-1 w-full rounded-2xl bg-black/20 ring-1 ring-white/10 px-3 py-2 text-sm text-white/85 outline-none focus:ring-white/25"
                />

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/55">Language</label>
                    <input
                      value={selected.language}
                      onChange={(e) => updateSelected({ language: e.target.value })}
                      className="mt-1 w-full rounded-2xl bg-black/20 ring-1 ring-white/10 px-3 py-2 text-sm text-white/85 outline-none focus:ring-white/25"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/55">Tags (comma)</label>
                    <input
                      value={selected.tags.join(", ")}
                      onChange={(e) =>
                        updateSelected({
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        })
                      }
                      className="mt-1 w-full rounded-2xl bg-black/20 ring-1 ring-white/10 px-3 py-2 text-sm text-white/85 outline-none focus:ring-white/25"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-xs text-white/55">Code</label>
                  <textarea
                    value={selected.content}
                    onChange={(e) => updateSelected({ content: e.target.value })}
                    className="mt-1 w-full min-h-[220px] rounded-2xl bg-black/30 ring-1 ring-white/10 px-3 py-3 text-sm text-white/85 outline-none focus:ring-white/25 font-mono"
                    spellCheck={false}
                  />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const wrapped = `try {\n${selected.content}\n} catch (e) {\n  console.error(e);\n}`;
                      updateSelected({ content: wrapped, tags: Array.from(new Set([...(selected.tags ?? []), "safety"])) });
                      setToast("Wrapped.");
                    }}
                    className="rounded-2xl px-3 py-2 text-xs bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                  >
                    Remix: try/catch
                  </button>
                  <button
                    onClick={() => {
                      const commented = `/**\n * Why this exists:\n * - \n * When to use:\n * - \n */\n\n${selected.content}`;
                      updateSelected({ content: commented, tags: Array.from(new Set([...(selected.tags ?? []), "docs"])) });
                      setToast("Annotated.");
                    }}
                    className="rounded-2xl px-3 py-2 text-xs bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/85"
                  >
                    Remix: annotate
                  </button>
                </div>

                <div className="mt-4 text-xs text-white/45">
                  Updated {new Date(selected.updatedAt).toLocaleString()} • created {new Date(selected.createdAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/55 ring-1 ring-white/15 px-4 py-2 text-sm text-white/85 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.7)]">
          {toast}
        </div>
      ) : null}

      <div className="fixed right-4 bottom-4 text-xs text-white/35">Garden mode</div>
    </div>
  );
}
