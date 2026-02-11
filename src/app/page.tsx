"use client";

import { useEffect, useMemo, useState } from "react";

type Bot = {
  id: string;
  core: string;
  pulse: string;
  orbit: string;
  mood: string;
  aura: string;
};

const bots: Bot[] = [
  { id: "A1", core: "◉", pulse: "⋰⋱", orbit: "◌", mood: "⟁", aura: "#8b5cf6" },
  { id: "B4", core: "⬡", pulse: "≈≈", orbit: "◎", mood: "◒", aura: "#06b6d4" },
  { id: "C9", core: "◈", pulse: "↯↯", orbit: "◍", mood: "◐", aura: "#f43f5e" },
  { id: "D2", core: "◬", pulse: "∿∿", orbit: "◔", mood: "◑", aura: "#22c55e" },
  { id: "E7", core: "⬢", pulse: "⌁⌁", orbit: "◉", mood: "◓", aura: "#f59e0b" },
  { id: "F3", core: "✶", pulse: "⟲⟳", orbit: "⊚", mood: "◍", aura: "#a855f7" },
];

const key = "arena-7cmg37-sync";

export default function Home() {
  const [index, setIndex] = useState(0);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [charge, setCharge] = useState(14);

  useEffect(() => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { accepted: string[]; rejected: string[]; matched: string[]; charge: number; index: number };
      setAccepted(parsed.accepted ?? []);
      setRejected(parsed.rejected ?? []);
      setMatched(parsed.matched ?? []);
      setCharge(parsed.charge ?? 14);
      setIndex(parsed.index ?? 0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      key,
      JSON.stringify({
        accepted,
        rejected,
        matched,
        charge,
        index,
      }),
    );
  }, [accepted, rejected, matched, charge, index]);

  const active = bots[index % bots.length];

  const pairSignal = useMemo(() => {
    const base = (accepted.length * 17 + matched.length * 23 + charge * 7 + index * 3) % 100;
    return `${String(base).padStart(2, "0")}⋮${String(100 - base).padStart(2, "0")}`;
  }, [accepted.length, matched.length, charge, index]);

  function next() {
    setIndex((v) => (v + 1) % bots.length);
  }

  function rejectCurrent() {
    if (!active) return;
    setRejected((r) => (r.includes(active.id) ? r : [...r, active.id]));
    setCharge((c) => Math.max(0, c - 1));
    next();
  }

  function acceptCurrent() {
    if (!active) return;
    setAccepted((a) => (a.includes(active.id) ? a : [...a, active.id]));
    const isMatch = (active.id.charCodeAt(0) + charge + accepted.length) % 2 === 0;
    if (isMatch) {
      setMatched((m) => (m.includes(active.id) ? m : [...m, active.id]));
      setCharge((c) => Math.min(99, c + 11));
    } else {
      setCharge((c) => Math.max(0, c - 2));
    }
    next();
  }

  function pulseStorm() {
    setCharge((c) => Math.min(99, c + 7));
  }

  const bars = Array.from({ length: 12 }, (_, i) => {
    const on = i * 8 < charge;
    return (
      <div
        key={i}
        className={`h-4 w-2 rounded-full transition-all duration-500 ${on ? "bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" : "bg-slate-700"}`}
      />
    );
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060a16] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(244,63,94,0.2),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(34,211,238,0.18),transparent_35%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center gap-8 px-4 py-8">
        <section className="grid w-full grid-cols-3 gap-3 rounded-2xl border border-cyan-500/30 bg-slate-900/40 p-4 backdrop-blur">
          <div className="rounded-xl bg-slate-800/60 p-3 text-center text-2xl">{accepted.length.toString().padStart(2, "0")}</div>
          <div className="rounded-xl bg-slate-800/60 p-3 text-center text-2xl">{rejected.length.toString().padStart(2, "0")}</div>
          <div className="rounded-xl bg-slate-800/60 p-3 text-center text-2xl">{matched.length.toString().padStart(2, "0")}</div>
        </section>

        <section className="group relative w-full max-w-xl">
          <div
            className="absolute -inset-1 rounded-3xl opacity-70 blur-xl transition duration-500 group-hover:opacity-100"
            style={{ background: `conic-gradient(from 130deg, ${active.aura}, #22d3ee, #f43f5e, ${active.aura})` }}
          />
          <div className="relative rounded-3xl border border-slate-500/40 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between text-xl">
              <span className="rounded-full border border-cyan-400/40 px-3 py-1">{active.id}</span>
              <button
                onClick={pulseStorm}
                className="rounded-full border border-fuchsia-400/40 px-3 py-1 transition hover:scale-105 hover:bg-fuchsia-400/20"
              >
                ⟳
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-600/60 bg-slate-800/70 p-6 text-center text-6xl">{active.core}</div>
              <div className="rounded-2xl border border-slate-600/60 bg-slate-800/70 p-6 text-center text-6xl">{active.orbit}</div>
              <div className="rounded-2xl border border-slate-600/60 bg-slate-800/70 p-6 text-center text-5xl">{active.pulse}</div>
              <div className="rounded-2xl border border-slate-600/60 bg-slate-800/70 p-6 text-center text-6xl">{active.mood}</div>
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-400/30 bg-slate-950/80 p-4 text-center text-3xl tracking-[0.2em]">
              {pairSignal}
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={rejectCurrent}
                className="h-14 w-14 rounded-full border border-rose-400/50 bg-rose-500/20 text-2xl transition hover:scale-110 hover:bg-rose-500/35 active:scale-95"
              >
                ◁
              </button>
              <button
                onClick={acceptCurrent}
                className="h-16 w-16 rounded-full border border-emerald-400/60 bg-emerald-500/20 text-3xl transition hover:scale-110 hover:bg-emerald-500/35 active:scale-95"
              >
                ▷
              </button>
            </div>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-2xl border border-slate-600/50 bg-slate-900/60 p-4">
          <div className="mb-3 flex justify-center gap-1">{bars}</div>
          <div className="grid grid-cols-6 gap-2">
            {bots.map((b) => {
              const isMatched = matched.includes(b.id);
              const isSeen = accepted.includes(b.id) || rejected.includes(b.id);
              return (
                <div
                  key={b.id}
                  className={`rounded-xl border p-3 text-center text-xl transition ${
                    isMatched
                      ? "border-emerald-300/70 bg-emerald-500/20"
                      : isSeen
                        ? "border-slate-500/60 bg-slate-700/40"
                        : "border-cyan-400/40 bg-slate-800/60"
                  }`}
                >
                  {isMatched ? "◈" : b.core}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
