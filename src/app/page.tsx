"use client";

import { useMemo, useState } from "react";

type MoodKey = "energy" | "warmth" | "chaos" | "mystery";

type EmojiSeed = {
  emoji: string;
  name: string;
  v: Record<MoodKey, number>;
};

const seeds: EmojiSeed[] = [
  { emoji: "✨", name: "sparkle", v: { energy: 0.8, warmth: 0.7, chaos: 0.2, mystery: 0.5 } },
  { emoji: "🔥", name: "fire", v: { energy: 1, warmth: 0.6, chaos: 0.5, mystery: 0.2 } },
  { emoji: "🥹", name: "teary smile", v: { energy: 0.4, warmth: 1, chaos: 0.1, mystery: 0.3 } },
  { emoji: "😎", name: "cool", v: { energy: 0.6, warmth: 0.4, chaos: 0.2, mystery: 0.5 } },
  { emoji: "🫠", name: "melting", v: { energy: 0.5, warmth: 0.3, chaos: 0.8, mystery: 0.4 } },
  { emoji: "🧠", name: "brain", v: { energy: 0.5, warmth: 0.2, chaos: 0.2, mystery: 0.9 } },
  { emoji: "🧃", name: "juice", v: { energy: 0.5, warmth: 0.8, chaos: 0.3, mystery: 0.1 } },
  { emoji: "🌊", name: "wave", v: { energy: 0.4, warmth: 0.4, chaos: 0.6, mystery: 0.6 } },
  { emoji: "🌈", name: "rainbow", v: { energy: 0.7, warmth: 0.9, chaos: 0.4, mystery: 0.3 } },
  { emoji: "👀", name: "eyes", v: { energy: 0.6, warmth: 0.2, chaos: 0.4, mystery: 0.9 } },
  { emoji: "🤖", name: "robot", v: { energy: 0.6, warmth: 0.1, chaos: 0.2, mystery: 0.8 } },
  { emoji: "🪩", name: "disco", v: { energy: 0.9, warmth: 0.6, chaos: 0.7, mystery: 0.4 } },
  { emoji: "🌙", name: "moon", v: { energy: 0.2, warmth: 0.3, chaos: 0.2, mystery: 1 } },
  { emoji: "🫶", name: "heart hands", v: { energy: 0.5, warmth: 1, chaos: 0.2, mystery: 0.2 } },
  { emoji: "🎭", name: "masks", v: { energy: 0.5, warmth: 0.3, chaos: 0.6, mystery: 0.9 } },
  { emoji: "⚡", name: "zap", v: { energy: 1, warmth: 0.4, chaos: 0.7, mystery: 0.2 } },
  { emoji: "🧘", name: "zen", v: { energy: 0.1, warmth: 0.8, chaos: 0.1, mystery: 0.6 } },
  { emoji: "💫", name: "dizzy", v: { energy: 0.7, warmth: 0.6, chaos: 0.8, mystery: 0.5 } },
  { emoji: "🦄", name: "unicorn", v: { energy: 0.8, warmth: 0.9, chaos: 0.5, mystery: 0.6 } },
  { emoji: "🛰️", name: "satellite", v: { energy: 0.5, warmth: 0.2, chaos: 0.2, mystery: 0.95 } },
  { emoji: "🫡", name: "salute", v: { energy: 0.5, warmth: 0.5, chaos: 0.2, mystery: 0.3 } },
  { emoji: "🤯", name: "mind blown", v: { energy: 0.95, warmth: 0.3, chaos: 0.9, mystery: 0.5 } },
  { emoji: "🥳", name: "party", v: { energy: 0.9, warmth: 0.8, chaos: 0.7, mystery: 0.2 } },
  { emoji: "🧊", name: "ice", v: { energy: 0.2, warmth: 0.1, chaos: 0.2, mystery: 0.6 } },
];

const moodLabels: Record<MoodKey, string> = {
  energy: "Pulse",
  warmth: "Glow",
  chaos: "Glitch",
  mystery: "Depth",
};

export default function Home() {
  const [mood, setMood] = useState<Record<MoodKey, number>>({
    energy: 0.65,
    warmth: 0.62,
    chaos: 0.35,
    mystery: 0.5,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const ranked = useMemo(() => {
    return seeds
      .map((seed) => {
        const dist = Math.sqrt(
          (seed.v.energy - mood.energy) ** 2 +
            (seed.v.warmth - mood.warmth) ** 2 +
            (seed.v.chaos - mood.chaos) ** 2 +
            (seed.v.mystery - mood.mystery) ** 2
        );
        return { ...seed, score: Math.max(0, 1 - dist / 2) };
      })
      .sort((a, b) => b.score - a.score);
  }, [mood]);

  const top = ranked.slice(0, 3);
  const whisper = ranked.slice(3, 9);

  const copy = async (emoji: string) => {
    try {
      await navigator.clipboard.writeText(emoji);
      setCopied(emoji);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      setCopied(null);
    }
  };

  return (
    <main className="nebula min-h-screen text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col p-5 md:p-10">
        <header className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200/90">Emoji Resonance Engine</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Feel it. Then pluck it.</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-indigo-100/80 md:text-base">
            No typing. No grid. Tune your emotional frequencies and let the right emoji surface from the constellation.
          </p>
        </header>

        <section className="panel mb-6 rounded-3xl p-4 md:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(mood) as MoodKey[]).map((key) => (
              <label key={key} className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-widest text-indigo-100/80">
                  <span>{moodLabels[key]}</span>
                  <span>{Math.round(mood[key] * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(mood[key] * 100)}
                  onChange={(e) =>
                    setMood((m) => ({
                      ...m,
                      [key]: Number(e.target.value) / 100,
                    }))
                  }
                  className="w-full accent-fuchsia-400"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="relative mb-6 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-indigo-950/40 to-fuchsia-950/30 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.25),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(129,140,248,0.28),transparent_42%)]" />

          <div className="relative z-10 mx-auto mt-10 h-[22rem] max-w-3xl">
            {top.map((item, idx) => (
              <button
                key={item.emoji}
                onClick={() => copy(item.emoji)}
                className={`orb orb-${idx + 1}`}
                title={`Copy ${item.name}`}
              >
                <span className="text-6xl md:text-7xl">{item.emoji}</span>
                <span className="mt-2 text-xs uppercase tracking-widest text-white/80">
                  {item.name} · {Math.round(item.score * 100)}%
                </span>
              </button>
            ))}
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap justify-center gap-2">
            {whisper.map((item) => (
              <button
                key={item.emoji}
                onClick={() => copy(item.emoji)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/90 backdrop-blur-sm transition hover:scale-105 hover:bg-white/10"
                title={`Copy ${item.name}`}
              >
                {item.emoji} <span className="text-white/60">{Math.round(item.score * 100)}%</span>
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center text-sm text-indigo-100/80">
          {copied ? (
            <p>
              Copied <span className="text-xl align-middle">{copied}</span> to clipboard.
            </p>
          ) : (
            <p>Tap any floating candidate to copy. Adjust sliders to reroute the constellation.</p>
          )}
        </footer>
      </div>
    </main>
  );
}
