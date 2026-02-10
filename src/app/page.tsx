"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DrumKey = {
  id: string;
  label: string;
  key: string;
  color: string;
  freq: number;
  noise: boolean;
};

const DRUMS: DrumKey[] = [
  { id: "kick", label: "Kick", key: "Q", color: "from-pink-500 to-rose-500", freq: 60, noise: false },
  { id: "snare", label: "Snare", key: "W", color: "from-cyan-400 to-blue-500", freq: 210, noise: true },
  { id: "hat", label: "Hi-Hat", key: "E", color: "from-amber-300 to-yellow-500", freq: 340, noise: true },
  { id: "clap", label: "Clap", key: "A", color: "from-violet-500 to-purple-600", freq: 280, noise: true },
  { id: "tom", label: "Tom", key: "S", color: "from-emerald-400 to-teal-500", freq: 140, noise: false },
  { id: "ride", label: "Ride", key: "D", color: "from-orange-400 to-red-500", freq: 420, noise: true },
  { id: "cowbell", label: "Cowbell", key: "Z", color: "from-lime-400 to-green-500", freq: 520, noise: false },
  { id: "laser", label: "Laser", key: "X", color: "from-fuchsia-500 to-indigo-500", freq: 640, noise: false },
];

const STEPS = 16;

const emptyPattern = () =>
  DRUMS.reduce((acc, d) => {
    acc[d.id] = Array(STEPS).fill(false);
    return acc;
  }, {} as Record<string, boolean[]>);

export default function Home() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [activePad, setActivePad] = useState<string | null>(null);
  const [tempo, setTempo] = useState(112);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [pattern, setPattern] = useState<Record<string, boolean[]>>(emptyPattern());

  const playPad = (pad: DrumKey) => {
    const ctx = audioCtxRef.current ?? new AudioContext();
    audioCtxRef.current = ctx;

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    if (pad.noise) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = pad.freq;
      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gain);
      gain.gain.setValueAtTime(0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.start(now);
      noise.stop(now + 0.13);
    } else {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(pad.freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, pad.freq * 0.45), now + 0.14);
      osc.connect(oscGain);
      oscGain.connect(gain);
      oscGain.gain.setValueAtTime(0.8, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.start(now);
      osc.stop(now + 0.18);
    }

    setActivePad(pad.id);
    setTimeout(() => setActivePad((curr) => (curr === pad.id ? null : curr)), 120);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const found = DRUMS.find((d) => d.key.toLowerCase() === e.key.toLowerCase());
      if (found) playPad(found);
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const interval = (60_000 / tempo) / 4;
    const timer = setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % STEPS;
        DRUMS.forEach((d) => {
          if (pattern[d.id]?.[next]) playPad(d);
        });
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [playing, tempo, pattern]);

  const toggleCell = (drumId: string, idx: number) => {
    setPattern((prev) => {
      const clone = { ...prev, [drumId]: [...prev[drumId]] };
      clone[drumId][idx] = !clone[drumId][idx];
      return clone;
    });
  };

  const energy = useMemo(() => Object.values(pattern).flat().filter(Boolean).length, [pattern]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#171a3f,#09090b_45%)] p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h1 className="text-3xl font-black md:text-4xl">Neon Grid Drummer</h1>
          <p className="text-sm text-zinc-300">Space = Play/Stop • QWE ASD ZX keys • 16-step sequencer</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className={`rounded-xl px-4 py-2 font-semibold ${playing ? "bg-rose-500" : "bg-emerald-500 text-black"}`}
            >
              {playing ? "Stop" : "Play"}
            </button>
            <label className="flex items-center gap-2 text-sm">
              BPM {tempo}
              <input type="range" min={70} max={170} value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
            </label>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Energy: {energy}</span>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DRUMS.map((d) => (
            <button
              key={d.id}
              onClick={() => playPad(d)}
              className={`group rounded-2xl border border-white/20 bg-gradient-to-br ${d.color} p-4 text-left shadow-xl transition hover:scale-[1.02] ${activePad === d.id ? "ring-4 ring-white/50" : ""}`}
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-black/70">{d.key}</p>
              <p className="text-xl font-black text-black">{d.label}</p>
            </button>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-4 backdrop-blur-xl">
          <h2 className="mb-3 text-lg font-bold">Sequencer</h2>
          <div className="space-y-2 overflow-x-auto">
            {DRUMS.map((d) => (
              <div key={d.id} className="grid grid-cols-[90px_repeat(16,minmax(22px,1fr))] items-center gap-1">
                <span className="text-xs text-zinc-300">{d.label}</span>
                {Array.from({ length: STEPS }).map((_, idx) => {
                  const on = pattern[d.id][idx];
                  const current = idx === step && playing;
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleCell(d.id, idx)}
                      className={`h-7 rounded-md border transition ${
                        on ? "bg-cyan-400 border-cyan-200" : "bg-white/5 border-white/10"
                      } ${current ? "ring-2 ring-fuchsia-400" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
