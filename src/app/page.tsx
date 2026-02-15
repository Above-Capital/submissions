"use client";

import { useEffect, useMemo, useState } from "react";

type Partner = {
  id: number;
  name: string;
  style: string;
  level: number;
  vibe: number;
  eta: number;
  avatar: string;
};

const styles = ["Net Ninja", "Baseline Blaster", "Dink Wizard", "Lob Sniper", "Spin Artist"];
const names = ["Riley", "Kai", "Jordan", "Parker", "Avery", "Cameron", "Sage", "Rowan"];

function randomPartner(id: number): Partner {
  return {
    id,
    name: names[Math.floor(Math.random() * names.length)],
    style: styles[Math.floor(Math.random() * styles.length)],
    level: 2 + Math.floor(Math.random() * 4),
    vibe: 55 + Math.floor(Math.random() * 45),
    eta: 2 + Math.floor(Math.random() * 18),
    avatar: ["🏓", "⚡", "🔥", "🎯", "🌀", "💫"][Math.floor(Math.random() * 6)],
  };
}

export default function Home() {
  const [skill, setSkill] = useState(4);
  const [tempo, setTempo] = useState(65);
  const [queuePulse, setQueuePulse] = useState(0);
  const [connected, setConnected] = useState<Partner | null>(null);
  const [candidates, setCandidates] = useState<Partner[]>(() => Array.from({ length: 6 }, (_, i) => randomPartner(i + 1)));

  useEffect(() => {
    const t = setInterval(() => setQueuePulse((p) => (p + 7) % 100), 850);
    return () => clearInterval(t);
  }, []);

  const scored = useMemo(
    () =>
      candidates
        .map((c) => ({
          ...c,
          match: Math.max(40, Math.min(99, 100 - Math.abs(c.level * 15 - skill * 15) - Math.abs(c.vibe - tempo) / 2)),
        }))
        .sort((a, b) => b.match - a.match),
    [candidates, skill, tempo],
  );

  const instantMatch = () => {
    const best = scored[0];
    setConnected(best);
    setCandidates((prev) => prev.map((p) => (p.id === best.id ? { ...p, eta: 0 } : p)));
  };

  const reshuffle = () => {
    setConnected(null);
    setCandidates(Array.from({ length: 6 }, (_, i) => randomPartner(i + 1)));
  };

  return (
    <div className="min-h-screen bg-[#05070f] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
            PicklePulse <span className="text-fuchsia-400">Live Match</span>
          </h1>
          <button
            onClick={reshuffle}
            className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
          >
            New Rally
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1.9fr]">
          <section className="rounded-3xl border border-cyan-300/20 bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-fuchsia-600/20 p-5 shadow-2xl shadow-cyan-900/20">
            <h2 className="mb-4 text-lg font-bold">Right-now finder</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs uppercase text-cyan-100/80">Your skill level</label>
                <input type="range" min={1} max={6} value={skill} onChange={(e) => setSkill(Number(e.target.value))} className="w-full accent-fuchsia-400" />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase text-cyan-100/80">Play tempo</label>
                <input type="range" min={35} max={95} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} className="w-full accent-cyan-300" />
              </div>

              <div className="rounded-2xl border border-white/20 bg-black/30 p-4">
                <div className="mb-2 flex justify-between text-xs uppercase text-white/70">
                  <span>Live queue energy</span>
                  <span>{queuePulse}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-300 transition-all" style={{ width: `${queuePulse}%` }} />
                </div>
              </div>

              <button
                onClick={instantMatch}
                className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 px-4 py-3 font-bold text-white shadow-lg shadow-fuchsia-700/40 transition hover:scale-[1.02]"
              >
                Find My Partner Now
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
            {connected ? (
              <div className="mb-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                <p className="text-sm text-emerald-200">Connected instantly</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-300/20 text-2xl">{connected.avatar}</div>
                  <div>
                    <p className="text-xl font-bold">{connected.name}</p>
                    <p className="text-sm text-emerald-100/80">{connected.style} • Court ready</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scored.map((p) => (
                <article key={p.id} className="group rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-black/45">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl">{p.avatar}</div>
                    <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-xs font-semibold text-cyan-200">ETA {p.eta}m</span>
                  </div>
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-sm text-white/70">{p.style}</p>
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-white/70">
                      <span>compatibility</span>
                      <span>{p.match}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-fuchsia-400 transition-all duration-500"
                        style={{ width: `${p.match}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
