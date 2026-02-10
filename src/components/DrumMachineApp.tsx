"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DrumEngine } from "../lib/audioEngine";
import { loadState, saveState } from "../lib/storage";
import { DrumState, Mixer, Pattern, Step, TrackId } from "../lib/types";
import { classNames, clamp, round, uid } from "../lib/utils";

const TRACKS: Array<{ id: TrackId; name: string; key: string; color: string }> = [
  { id: "kick", name: "Kick", key: "A", color: "from-rose-500 to-orange-400" },
  { id: "snare", name: "Snare", key: "S", color: "from-indigo-500 to-sky-400" },
  { id: "hat", name: "Hat", key: "D", color: "from-emerald-500 to-lime-400" },
  { id: "clap", name: "Clap", key: "F", color: "from-fuchsia-500 to-pink-400" },
  { id: "tom", name: "Tom", key: "G", color: "from-amber-500 to-yellow-300" },
  { id: "rim", name: "Rim", key: "H", color: "from-cyan-500 to-teal-300" },
  { id: "perc", name: "Perc", key: "J", color: "from-violet-500 to-purple-400" },
  { id: "crash", name: "Crash", key: "K", color: "from-slate-500 to-zinc-300" },
];

function emptySteps(len = 16): Step[] {
  return Array.from({ length: len }, () => ({ on: false, vel: 0.9 }));
}

function seedPattern(name = "Neon Beat"): Pattern {
  const p: Pattern = {
    id: uid("pat"),
    name,
    steps: {
      kick: emptySteps(),
      snare: emptySteps(),
      hat: emptySteps(),
      clap: emptySteps(),
      tom: emptySteps(),
      rim: emptySteps(),
      perc: emptySteps(),
      crash: emptySteps(),
    },
  };

  // tasteful default groove
  p.steps.kick[0].on = true;
  p.steps.kick[8].on = true;
  p.steps.snare[4].on = true;
  p.steps.snare[12].on = true;
  for (let i = 0; i < 16; i += 2) {
    p.steps.hat[i].on = true;
    p.steps.hat[i].vel = i % 4 === 0 ? 0.65 : 0.45;
  }
  p.steps.clap[12].on = true;
  p.steps.crash[0].on = true;
  return p;
}

function seedMixer(): Mixer {
  return {
    kick: { gain: 1.0, mute: false, solo: false },
    snare: { gain: 0.9, mute: false, solo: false },
    hat: { gain: 0.6, mute: false, solo: false },
    clap: { gain: 0.7, mute: false, solo: false },
    tom: { gain: 0.7, mute: false, solo: false },
    rim: { gain: 0.55, mute: false, solo: false },
    perc: { gain: 0.65, mute: false, solo: false },
    crash: { gain: 0.55, mute: false, solo: false },
  };
}

function computeAudible(mixer: Mixer, trackId: TrackId) {
  const anySolo = Object.values(mixer).some((m) => m.solo);
  if (anySolo) return mixer[trackId].solo;
  if (mixer[trackId].mute) return false;
  return true;
}

export default function DrumMachineApp() {
  const engineRef = useRef<DrumEngine | null>(null);
  const schedRef = useRef<number | null>(null);
  const stepRef = useRef(0);
  const nextTimeRef = useRef(0);
  const playingRef = useRef(false);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [bpm, setBpm] = useState(122);
  const [swing, setSwing] = useState(0.12);
  const [pattern, setPattern] = useState<Pattern>(() => seedPattern());
  const [mixer, setMixer] = useState<Mixer>(() => seedMixer());

  const [activeStep, setActiveStep] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // load saved state
  useEffect(() => {
    const st = loadState();
    if (!st) return;
    setBpm(st.bpm);
    setSwing(st.swing);
    setPattern(st.pattern);
    setMixer(st.mixer);
  }, []);

  // persist
  useEffect(() => {
    const st: DrumState = { version: 1, bpm, swing, pattern, mixer };
    saveState(st);
  }, [bpm, swing, pattern, mixer]);

  const stepMs = useMemo(() => (60_000 / bpm) / 4, [bpm]); // 16th note in ms

  function ensureEngine() {
    if (engineRef.current) return engineRef.current;
    const eng = new DrumEngine();
    engineRef.current = eng;
    return eng;
  }

  async function armAudio() {
    const eng = ensureEngine();
    await eng.ensureRunning();

    // apply mixer gains
    for (const t of TRACKS) {
      eng.setTrackGain(t.id, mixer[t.id].gain);
    }

    setReady(true);
    setToast("Audio armed. Hit Play.");
    window.setTimeout(() => setToast(null), 1200);
  }

  function schedule() {
    const eng = engineRef.current;
    if (!eng) return;

    const lookahead = 0.12; // seconds
    const interval = 25; // ms

    const tick = () => {
      if (!playingRef.current) return;
      const now = eng.now();

      while (nextTimeRef.current < now + lookahead) {
        const step = stepRef.current;

        // swing on odd 16ths
        const swingOffset = step % 2 === 1 ? (stepMs / 1000) * swing : 0;
        const t = nextTimeRef.current + swingOffset;

        for (const tr of TRACKS) {
          const s = pattern.steps[tr.id][step];
          if (!s?.on) continue;
          if (!computeAudible(mixer, tr.id)) continue;

          const vel = clamp(s.vel, 0.1, 1);
          eng.trigger(tr.id, t, vel);
        }

        // UI update
        const uiStep = step;
        window.setTimeout(() => {
          setActiveStep(uiStep);
        }, Math.max(0, (t - eng.now()) * 1000));

        stepRef.current = (step + 1) % 16;
        nextTimeRef.current += stepMs / 1000;
      }

      schedRef.current = window.setTimeout(tick, interval);
    };

    tick();
  }

  async function togglePlay() {
    if (!ready) {
      await armAudio();
    }
    const eng = ensureEngine();
    await eng.ensureRunning();

    if (playingRef.current) {
      playingRef.current = false;
      setPlaying(false);
      setToast("Paused");
      window.setTimeout(() => setToast(null), 900);
      if (schedRef.current) window.clearTimeout(schedRef.current);
      return;
    }

    playingRef.current = true;
    setPlaying(true);

    // start scheduling from next audio time
    stepRef.current = 0;
    nextTimeRef.current = eng.now() + 0.05;

    schedule();
  }

  function tap(trackId: TrackId) {
    const eng = ensureEngine();
    void eng.ensureRunning();
    if (!computeAudible(mixer, trackId)) return;
    eng.trigger(trackId, eng.now() + 0.001, 0.95);
  }

  function toggleCell(trackId: TrackId, step: number, alt = false) {
    setPattern((p) => {
      const steps = p.steps[trackId].slice();
      const cur = steps[step];
      const next = { ...cur };
      if (alt) {
        next.vel = clamp(round(next.vel - 0.15, 2), 0.1, 1);
      } else {
        next.on = !next.on;
        if (next.on && next.vel < 0.2) next.vel = 0.9;
      }
      steps[step] = next;
      return { ...p, steps: { ...p.steps, [trackId]: steps } };
    });
  }

  function nudgeVelocity(trackId: TrackId, step: number, delta: number) {
    setPattern((p) => {
      const steps = p.steps[trackId].slice();
      const cur = steps[step];
      steps[step] = { ...cur, vel: clamp(round(cur.vel + delta, 2), 0.1, 1) };
      return { ...p, steps: { ...p.steps, [trackId]: steps } };
    });
  }

  function randomize() {
    setPattern((p) => {
      const next: Pattern = { ...p, id: uid("pat"), name: "Random Spark" };
      const out: any = {};
      for (const tr of TRACKS) {
        out[tr.id] = p.steps[tr.id].map((s, idx) => {
          const chance = tr.id === "hat" ? 0.55 : tr.id === "kick" ? 0.22 : 0.18;
          const on = Math.random() < chance;
          const vel = on ? clamp(0.35 + Math.random() * 0.65, 0.1, 1) : s.vel;
          const beat = idx % 4 === 0;
          return { on: beat ? on || Math.random() < 0.35 : on, vel };
        });
      }
      return { ...next, steps: out };
    });
    setToast("Pattern randomized");
    window.setTimeout(() => setToast(null), 900);
  }

  function clearPattern() {
    if (!confirm("Clear all steps?")) return;
    setPattern((p) => {
      const out: any = {};
      for (const tr of TRACKS) out[tr.id] = emptySteps();
      return { ...p, steps: out };
    });
  }

  // update engine mixer gains
  useEffect(() => {
    const eng = engineRef.current;
    if (!eng) return;
    for (const t of TRACKS) {
      eng.setTrackGain(t.id, mixer[t.id].gain);
    }
  }, [mixer]);

  // keyboard: tap pads + space play
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const k = e.key.toUpperCase();
      const t = TRACKS.find((x) => x.key === k);
      if (t) {
        e.preventDefault();
        tap(t.id);
      }
      if (e.key === " ") {
        e.preventDefault();
        void togglePlay();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mixer, ready, pattern, bpm, swing]);

  return (
    <div className="min-h-dvh bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(90%_70%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(70%_60%_at_90%_10%,rgba(16,185,129,0.20),transparent_55%),radial-gradient(90%_80%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">NeonDrum</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Virtual drum machine • synth drums • 16-step sequencer • Space = play/pause</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void armAudio()}
              className={classNames(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold",
                ready
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                  : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
              )}
              title="Required on some browsers that block autoplay"
            >
              {ready ? "Armed" : "Arm Audio"}
            </button>
            <button
              onClick={() => void togglePlay()}
              className={classNames(
                "rounded-xl px-4 py-1.5 text-xs font-semibold text-white shadow-sm",
                playing ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"
              )}
            >
              {playing ? "Stop" : "Play"}
            </button>
            <button
              onClick={randomize}
              className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              Randomize
            </button>
            <button
              onClick={clearPattern}
              className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-500/15 dark:text-rose-200"
            >
              Clear
            </button>
          </div>
        </header>

        {toast ? (
          <div className="mb-4 rounded-2xl border border-black/10 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">{toast}</div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Transport</div>
            <div className="mt-3 grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/10">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">BPM</span>
                  <span className="font-semibold">{bpm}</span>
                </div>
                <input type="range" min={60} max={180} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="mt-2 w-full" />
              </div>
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-200">Swing</span>
                  <span className="font-semibold">{Math.round(swing * 100)}%</span>
                </div>
                <input type="range" min={0} max={60} value={Math.round(swing * 100)} onChange={(e) => setSwing(Number(e.target.value) / 100)} className="mt-2 w-full" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Mixer</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Mute / Solo</div>
            </div>

            <div className="mt-2 space-y-2">
              {TRACKS.map((t) => {
                const m = mixer[t.id];
                return (
                  <div key={t.id} className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/10">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => tap(t.id)}
                        className={classNames("rounded-xl bg-gradient-to-br px-3 py-2 text-left text-xs font-semibold text-white shadow-sm", t.color)}
                        title={`Tap (${t.key})`}
                      >
                        {t.name}
                        <div className="text-[10px] font-semibold text-white/80">{t.key}</div>
                      </button>
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={120}
                          value={Math.round(m.gain * 100)}
                          onChange={(e) =>
                            setMixer((prev) => ({
                              ...prev,
                              [t.id]: { ...prev[t.id], gain: Number(e.target.value) / 100 },
                            }))
                          }
                          className="w-full"
                        />
                        <div className="w-10 text-right text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">{Math.round(m.gain * 100)}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => setMixer((prev) => ({ ...prev, [t.id]: { ...prev[t.id], mute: !prev[t.id].mute } }))}
                        className={classNames(
                          "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                          m.mute
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                            : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                        )}
                      >
                        Mute
                      </button>
                      <button
                        onClick={() => setMixer((prev) => ({ ...prev, [t.id]: { ...prev[t.id], solo: !prev[t.id].solo } }))}
                        className={classNames(
                          "rounded-xl border px-3 py-1.5 text-[11px] font-semibold",
                          m.solo
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                            : "border-black/10 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                        )}
                      >
                        Solo
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Keys A S D F G H J K tap drums. Space toggles play.
            </div>
          </aside>

          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold tracking-tight">Step sequencer</div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-300">{pattern.name}</div>
                </div>
                <div className="rounded-2xl border border-black/10 bg-white/60 px-3 py-2 text-sm font-semibold dark:border-white/10 dark:bg-white/10">
                  Step <span className="text-indigo-600 dark:text-indigo-200">{activeStep + 1}</span>/16
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="grid gap-2">
                {TRACKS.map((t) => {
                  const row = pattern.steps[t.id];
                  return (
                    <div key={t.id} className="grid grid-cols-[90px_1fr] gap-3">
                      <div className="flex items-center gap-2">
                        <div className={classNames("h-8 w-8 rounded-xl bg-gradient-to-br", t.color)} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{t.name}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.key}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-16 gap-1.5">
                        {row.map((s, idx) => {
                          const isBeat = idx % 4 === 0;
                          const isActive = idx === activeStep && playing;
                          const on = s.on;
                          const vel = s.vel;
                          return (
                            <div key={idx} className="relative">
                              <button
                                onClick={(e) => toggleCell(t.id, idx, (e as any).shiftKey)}
                                className={classNames(
                                  "relative h-10 w-full rounded-xl border transition",
                                  isActive ? "ring-4 ring-indigo-500/20" : "",
                                  on
                                    ? "border-indigo-500/35 bg-indigo-500/10"
                                    : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15",
                                  isBeat && !on ? "bg-white/70" : ""
                                )}
                                title={on ? `vel ${Math.round(vel * 100)}% (shift-click lowers)` : "off"}
                              >
                                {on ? (
                                  <div className={classNames("absolute inset-0 rounded-xl bg-gradient-to-br", t.color)} style={{ opacity: 0.22 + vel * 0.68 }} />
                                ) : null}
                                <div className="relative z-10 text-[10px] font-semibold text-zinc-600 dark:text-zinc-200">
                                  {isBeat ? idx / 4 + 1 : ""}
                                </div>
                              </button>
                              {on ? (
                                <div className="mt-1 flex gap-1">
                                  <button
                                    onClick={() => nudgeVelocity(t.id, idx, -0.1)}
                                    className="flex-1 rounded-lg border border-black/10 bg-white/70 px-1 py-0.5 text-[10px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
                                    title="Lower velocity"
                                  >
                                    −
                                  </button>
                                  <button
                                    onClick={() => nudgeVelocity(t.id, idx, 0.1)}
                                    className="flex-1 rounded-lg border border-black/10 bg-white/70 px-1 py-0.5 text-[10px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
                                    title="Raise velocity"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-black/10 bg-white/60 p-4 text-xs dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold text-zinc-700 dark:text-zinc-200">Presets</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Pattern is saved automatically</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setPattern(seedPattern("Neon Beat"));
                      setToast("Loaded preset: Neon Beat");
                      window.setTimeout(() => setToast(null), 900);
                    }}
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    Neon Beat
                  </button>
                  <button
                    onClick={() => {
                      const p = seedPattern("Half-time Crush");
                      p.steps.kick = emptySteps();
                      p.steps.kick[0].on = true;
                      p.steps.kick[10].on = true;
                      p.steps.snare[8].on = true;
                      p.steps.snare[12].on = true;
                      for (let i = 0; i < 16; i++) {
                        p.steps.hat[i].on = i % 2 === 0;
                        p.steps.hat[i].vel = i % 4 === 0 ? 0.55 : 0.35;
                      }
                      p.steps.crash[0].on = true;
                      setPattern(p);
                      setToast("Loaded preset: Half-time Crush");
                      window.setTimeout(() => setToast(null), 900);
                    }}
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    Half-time
                  </button>
                  <button
                    onClick={() => {
                      const p = seedPattern("Tech Minimal");
                      for (const tr of TRACKS) p.steps[tr.id] = emptySteps();
                      p.steps.kick[0].on = true;
                      p.steps.kick[8].on = true;
                      p.steps.hat[4].on = true;
                      p.steps.hat[12].on = true;
                      p.steps.rim[10].on = true;
                      p.steps.perc[14].on = true;
                      setPattern(p);
                      setToast("Loaded preset: Tech Minimal");
                      window.setTimeout(() => setToast(null), 900);
                    }}
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-[11px] font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    Minimal
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
