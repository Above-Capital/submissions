"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { configFor } from "../lib/config";
import { FACES } from "../lib/faces";
import { loadGameState, saveGameState } from "../lib/storage";
import { Card, Difficulty } from "../lib/types";
import { classNames, formatTime, shuffle, uid } from "../lib/utils";

function useInterval(fn: () => void, ms: number | null) {
  useEffect(() => {
    if (ms == null) return;
    const id = window.setInterval(fn, ms);
    return () => window.clearInterval(id);
  }, [fn, ms]);
}

function makeDeck(pairCount: number) {
  const faces = shuffle(FACES).slice(0, pairCount);
  const cards: Card[] = [];
  for (const f of faces) {
    cards.push({ id: uid("c"), face: f, matched: false });
    cards.push({ id: uid("c"), face: f, matched: false });
  }
  return shuffle(cards);
}

type Status = "ready" | "preview" | "playing" | "won";

export default function MemoryMatchApp() {
  const [prefs, setPrefs] = useState(() => loadGameState());
  const [difficulty, setDifficulty] = useState<Difficulty>(prefs.difficulty);
  const cfg = useMemo(() => configFor(difficulty), [difficulty]);

  const [deck, setDeck] = useState<Card[]>(() => makeDeck(cfg.pairCount));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [status, setStatus] = useState<Status>("ready");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const best = prefs.best[difficulty];

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${cfg.cols}, minmax(0, 1fr))`,
  }), [cfg.cols]);

  useEffect(() => {
    // persist prefs
    saveGameState({ ...prefs, difficulty });
  }, [prefs, difficulty]);

  // timer
  useInterval(
    () => {
      if (status !== "playing" || !startedAt) return;
      setElapsed(Date.now() - startedAt);
    },
    status === "playing" ? 100 : null
  );

  useEffect(() => {
    // reset deck when difficulty changes
    const next = makeDeck(cfg.pairCount);
    setDeck(next);
    setFlipped([]);
    setLocked(false);
    setMoves(0);
    setStatus("ready");
    setStartedAt(null);
    setElapsed(0);
  }, [cfg.pairCount]);

  function startGame() {
    const next = makeDeck(cfg.pairCount);
    setDeck(next);
    setFlipped([]);
    setLocked(false);
    setMoves(0);
    setElapsed(0);
    setStartedAt(Date.now());
    setStatus("preview");

    // preview all cards briefly
    window.setTimeout(() => {
      setStatus("playing");
      setFlipped([]);
    }, cfg.previewMs);

    // during preview, show all
    setFlipped(next.map((c) => c.id));
  }

  function winIfDone(nextDeck: Card[]) {
    if (nextDeck.every((c) => c.matched)) {
      setStatus("won");
      const time = elapsed;
      setToast("Perfect. New run?");
      window.setTimeout(() => setToast(null), 1200);

      setPrefs((p) => {
        const cur = p.best[difficulty];
        const bestTimeMs = cur.bestTimeMs == null ? time : Math.min(cur.bestTimeMs, time);
        const bestMoves = cur.bestMoves == null ? moves : Math.min(cur.bestMoves, moves);
        return {
          ...p,
          best: {
            ...p.best,
            [difficulty]: { bestTimeMs, bestMoves },
          },
        };
      });
    }
  }

  function clickCard(id: string) {
    if (locked) return;
    if (status !== "playing") return;

    const c = deck.find((x) => x.id === id);
    if (!c || c.matched) return;
    if (flipped.includes(id)) return;

    const nextFlipped = [...flipped, id];
    setFlipped(nextFlipped);

    if (nextFlipped.length % 2 === 0) {
      setMoves((m) => m + 1);
      const aId = nextFlipped[nextFlipped.length - 2];
      const bId = nextFlipped[nextFlipped.length - 1];
      const a = deck.find((x) => x.id === aId)!;
      const b = deck.find((x) => x.id === bId)!;

      if (a.face === b.face) {
        // match
        const nextDeck = deck.map((x) => (x.id === aId || x.id === bId ? { ...x, matched: true } : x));
        setDeck(nextDeck);
        setToast("Match!");
        window.setTimeout(() => setToast(null), 500);
        winIfDone(nextDeck);
      } else {
        // mismatch: peek, then flip back
        setLocked(true);
        window.setTimeout(() => {
          setFlipped((cur) => cur.filter((x) => x !== aId && x !== bId));
          setLocked(false);
        }, cfg.allowMismatchPeekMs);
      }
    }
  }

  function toggleSound() {
    setPrefs((p) => ({ ...p, soundOn: !p.soundOn }));
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.20),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">PrismPairs</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Memory match game • smooth flips • best scores saved</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={startGame}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {status === "playing" || status === "preview" ? "Restart" : "Start"}
            </button>
            <button
              onClick={toggleSound}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Sound: {prefs.soundOn ? "On" : "Off"}
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white/60 p-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/5">{toast}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Difficulty</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["easy", "standard", "hard"] as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={classNames(
                    "rounded-full border px-3 py-1 text-[11px] font-semibold",
                    difficulty === d
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                      : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Time</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{formatTime(elapsed)}</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Moves</div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{moves}</div>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
                <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Best</div>
                <div className="mt-2 text-sm font-semibold">
                  Time: <span className="font-mono">{best.bestTimeMs == null ? "—" : formatTime(best.bestTimeMs)}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">
                  Moves: <span className="font-mono">{best.bestMoves ?? "—"}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                Preview: memorize for {Math.round(cfg.previewMs / 100) / 10}s. Mismatches peek for {Math.round(cfg.allowMismatchPeekMs / 10) / 100}s.
              </div>
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="border-b border-black/10 pb-3 dark:border-white/10">
              <div className="text-sm font-semibold tracking-tight">Board</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">
                {status === "preview" ? "Preview…" : status === "won" ? "You won!" : status === "ready" ? "Hit Start" : "Find pairs"}
              </div>
            </div>

            <div className="mt-4 grid gap-3" style={gridStyle as any}>
              {deck.map((c) => {
                const isUp = flipped.includes(c.id) || c.matched;
                return (
                  <button
                    key={c.id}
                    onClick={() => clickCard(c.id)}
                    className={classNames(
                      "group relative aspect-[3/4] w-full rounded-2xl border transition",
                      "[transform-style:preserve-3d]",
                      isUp ? "border-emerald-500/25" : "border-black/10 hover:border-indigo-500/30",
                      locked ? "cursor-not-allowed" : "cursor-pointer",
                      "bg-transparent"
                    )}
                  >
                    <div
                      className={classNames(
                        "absolute inset-0 rounded-2xl transition-transform duration-500",
                        isUp ? "[transform:rotateY(180deg)]" : "[transform:rotateY(0deg)]"
                      )}
                      style={{ transformStyle: "preserve-3d" } as any}
                    >
                      {/* front */}
                      <div
                        className={classNames(
                          "absolute inset-0 grid place-items-center rounded-2xl",
                          "bg-[linear-gradient(135deg,rgba(99,102,241,0.18),rgba(16,185,129,0.14),rgba(244,63,94,0.12))]",
                          "shadow-sm",
                          "[backface-visibility:hidden]"
                        )}
                      >
                        <div className="text-xs font-semibold tracking-widest text-zinc-700/80 dark:text-zinc-200/80">PRISM</div>
                      </div>

                      {/* back */}
                      <div
                        className={classNames(
                          "absolute inset-0 grid place-items-center rounded-2xl border border-black/5 bg-white shadow-sm",
                          "[transform:rotateY(180deg)]",
                          "[backface-visibility:hidden]",
                          "dark:border-white/10 dark:bg-zinc-950"
                        )}
                      >
                        <div className={classNames("text-4xl transition", c.matched ? "scale-110" : "group-hover:scale-105")}>
                          {c.face}
                        </div>
                        {c.matched ? (
                          <div className="absolute bottom-2 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-200">
                            MATCH
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
