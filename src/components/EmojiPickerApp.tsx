"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, EMOJI } from "../lib/emojiData";
import { loadPickerState, savePickerState } from "../lib/storage";
import { EmojiCategoryId, EmojiItem, PickerState } from "../lib/types";
import { classNames, copyToClipboard, scoreQuery, uniq } from "../lib/utils";

const SKIN_LABELS = ["Default", "Light", "Med‑Light", "Medium", "Med‑Dark", "Dark"];

function groupKey(e: EmojiItem, tone: number) {
  if (tone === 0) return e.emoji;
  if (!e.tones) return e.emoji;
  return e.tones[tone] ?? e.emoji;
}

function EmojiTile({
  item,
  tone,
  isFav,
  onPick,
  onToggleFav,
}: {
  item: EmojiItem;
  tone: number;
  isFav: boolean;
  onPick: () => void;
  onToggleFav: () => void;
}) {
  const glyph = groupKey(item, tone);
  return (
    <div className="group relative">
      <button
        onClick={onPick}
        className="flex h-12 w-full items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-2xl shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md active:translate-y-0 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
        title={`${item.name}`}
      >
        {glyph}
      </button>
      <button
        onClick={onToggleFav}
        className={classNames(
          "absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-xl border text-[11px] font-bold opacity-0 shadow-sm transition group-hover:opacity-100",
          isFav
            ? "border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200"
            : "border-black/10 bg-white/80 text-zinc-700 hover:bg-white dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-200"
        )}
        title={isFav ? "Unfavorite" : "Favorite"}
      >
        {isFav ? "★" : "☆"}
      </button>
    </div>
  );
}

export default function EmojiPickerApp() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<EmojiCategoryId>("smileys");
  const [mode, setMode] = useState<"emoji" | "shortcode">("emoji");

  const [st, setSt] = useState<PickerState>({ version: 1, favorites: [], recents: [], skinTone: 0 });
  const [toast, setToast] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setSt(loadPickerState());
  }, []);

  useEffect(() => {
    savePickerState(st);
  }, [st]);

  const favSet = useMemo(() => new Set(st.favorites), [st.favorites]);
  const recentSet = useMemo(() => new Set(st.recents), [st.recents]);

  const emojiById = useMemo(() => {
    const m = new Map<string, EmojiItem>();
    for (const e of EMOJI) m.set(e.id, e);
    return m;
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim();
    const list = query
      ? EMOJI.map((e) => {
          const hay = `${e.name} ${e.keywords.join(" ")} ${e.id}`;
          return { e, s: scoreQuery(query, hay) };
        })
          .filter((x) => x.s > 0)
          .sort((a, b) => b.s - a.s)
          .slice(0, 120)
          .map((x) => x.e)
      : EMOJI.filter((e) => e.category === cat);

    return list;
  }, [q, cat]);

  const favorites = useMemo(() => st.favorites.map((id) => emojiById.get(id)).filter(Boolean) as EmojiItem[], [st.favorites, emojiById]);
  const recents = useMemo(() => st.recents.map((id) => emojiById.get(id)).filter(Boolean) as EmojiItem[], [st.recents, emojiById]);

  function shortcode(e: EmojiItem) {
    return `:${e.id}:`;
  }

  async function pick(e: EmojiItem) {
    const glyph = groupKey(e, st.skinTone);
    const text = mode === "emoji" ? glyph : shortcode(e);
    const ok = await copyToClipboard(text);

    setSt((prev) => {
      const nextRecents = [e.id, ...prev.recents.filter((x) => x !== e.id)].slice(0, 24);
      return { ...prev, recents: nextRecents };
    });

    setToast(ok ? `Copied ${mode === "emoji" ? glyph : shortcode(e)}` : "Copy failed");
    window.setTimeout(() => setToast(null), 900);
  }

  function toggleFav(id: string) {
    setSt((prev) => {
      const on = prev.favorites.includes(id);
      const next = on ? prev.favorites.filter((x) => x !== id) : [id, ...prev.favorites].slice(0, 48);
      return { ...prev, favorites: next };
    });
  }

  // keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setQ("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.20),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">GlyphGrid</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Emoji search engine + picker • fast • offline • keyboard-first</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode((m) => (m === "emoji" ? "shortcode" : "emoji"))}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              title="Toggle copy mode"
            >
              Copy: {mode === "emoji" ? "Emoji" : ":shortcode:"}
            </button>
            <div className="hidden sm:block h-6 w-px bg-black/10 dark:bg-white/10" />
            <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold dark:border-white/10 dark:bg-white/10">
              Tone
              <select
                value={st.skinTone}
                onChange={(e) => setSt((p) => ({ ...p, skinTone: Number(e.target.value) as any }))}
                className="rounded-lg border border-black/10 bg-white/70 px-2 py-1 text-xs font-semibold dark:border-white/10 dark:bg-zinc-950/60"
              >
                {SKIN_LABELS.map((l, i) => (
                  <option key={l} value={i}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {toast ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white/60 p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">
            {toast}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Search</div>
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (Ctrl/⌘+K) e.g. party, fire, wave"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
            />

            <div className="mt-4">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Categories</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCat(c.id);
                      setQ("");
                    }}
                    className={classNames(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      c.id === cat && !q
                        ? "border-indigo-500/35 bg-indigo-500/10"
                        : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Favorites</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{favorites.length}</div>
              </div>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {favorites.length ? (
                  favorites.slice(0, 24).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => void pick(e)}
                      className="grid h-10 w-full place-items-center rounded-2xl border border-black/10 bg-white/60 text-xl hover:bg-white dark:border-white/10 dark:bg-white/10"
                      title={e.name}
                    >
                      {groupKey(e, st.skinTone)}
                    </button>
                  ))
                ) : (
                  <div className="col-span-8 rounded-xl border border-dashed border-black/15 p-3 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    Star emojis to pin them here.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Recents</div>
                <button
                  onClick={() => setSt((p) => ({ ...p, recents: [] }))}
                  className="rounded-xl border border-black/10 bg-white/60 px-2 py-1 text-[11px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
                >
                  Clear
                </button>
              </div>
              <div className="mt-2 grid grid-cols-8 gap-2">
                {recents.length ? (
                  recents.slice(0, 24).map((e) => (
                    <button
                      key={e.id}
                      onClick={() => void pick(e)}
                      className={classNames(
                        "grid h-10 w-full place-items-center rounded-2xl border text-xl",
                        recentSet.has(e.id)
                          ? "border-emerald-500/25 bg-emerald-500/10"
                          : "border-black/10 bg-white/60",
                        "dark:border-white/10 dark:bg-white/10"
                      )}
                      title={e.name}
                    >
                      {groupKey(e, st.skinTone)}
                    </button>
                  ))
                ) : (
                  <div className="col-span-8 rounded-xl border border-dashed border-black/15 p-3 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    Click an emoji to copy it and add it here.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Shortcuts: <span className="font-semibold">Ctrl/⌘+K</span> focus search • <span className="font-semibold">Esc</span> clear query
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="flex items-end justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10">
              <div>
                <div className="text-sm font-semibold tracking-tight">{q.trim() ? "Search results" : CATEGORIES.find((c) => c.id === cat)?.label}</div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300">{filtered.length} emoji</div>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Click to copy • star to favorite</div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
              {filtered.map((e) => (
                <EmojiTile
                  key={e.id}
                  item={e}
                  tone={st.skinTone}
                  isFav={favSet.has(e.id)}
                  onPick={() => void pick(e)}
                  onToggleFav={() => toggleFav(e.id)}
                />
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-black/10 bg-white/60 p-4 text-xs dark:border-white/10 dark:bg-white/5">
              <div className="font-semibold">Notes</div>
              <div className="mt-1 text-zinc-600 dark:text-zinc-300">
                This is a compact offline dataset for speed. Copy mode toggles between the emoji glyph and a convenient <span className="font-mono">:shortcode:</span>.
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
