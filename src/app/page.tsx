"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { InvadersCanvas } from "@/components/InvadersCanvas";
import { createGame, resetRoundAndKeepScore, startGame, tick, type GameState } from "@/lib/runtime";
import { defaultPersisted, loadPersisted, savePersisted, tryBeep, type Persisted } from "@/lib/storage";

export default function Home() {
  const [persisted, setPersisted] = useState<Persisted>(() => defaultPersisted);
  const [state, setState] = useState<GameState>(() => createGame());

  const [input, setInput] = useState({ left: false, right: false, shoot: false });

  useEffect(() => {
    const p = loadPersisted();
    setPersisted(p);
  }, []);

  useEffect(() => {
    savePersisted(persisted);
  }, [persisted]);

  // main loop
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  useEffect(() => {
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min(0.033, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      setState((s) => tick(s, dt, input, persisted.reducedMotion));
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [input, persisted.reducedMotion]);

  // high score
  useEffect(() => {
    if (state.score > persisted.highScore) {
      setPersisted((p) => ({ ...p, highScore: state.score }));
    }
  }, [state.score, persisted.highScore]);

  function start() {
    setState((s) => startGame(s));
    tryBeep(persisted.soundEnabled, 660, 90, "square");
  }

  function pause() {
    setState((s) => ({ ...s, paused: !s.paused }));
  }

  function reset() {
    setState((s) => resetRoundAndKeepScore(s));
    tryBeep(persisted.soundEnabled, 440, 90, "sine");
  }

  // keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "enter") {
        e.preventDefault();
        start();
      }
      if (k === "p") {
        e.preventDefault();
        pause();
      }
      if (k === "r") {
        e.preventDefault();
        setState(createGame());
      }
      if (k === "arrowleft" || k === "a") setInput((i) => ({ ...i, left: true }));
      if (k === "arrowright" || k === "d") setInput((i) => ({ ...i, right: true }));
      if (k === " " || k === "space") {
        e.preventDefault();
        setInput((i) => ({ ...i, shoot: true }));
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") setInput((i) => ({ ...i, left: false }));
      if (k === "arrowright" || k === "d") setInput((i) => ({ ...i, right: false }));
      if (k === " " || k === "space") setInput((i) => ({ ...i, shoot: false }));
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [persisted.soundEnabled]);

  // mobile helpers
  function press(key: "left" | "right" | "shoot", on: boolean) {
    setInput((i) => ({ ...i, [key]: on } as any));
  }

  const hud = useMemo(
    () => ({ score: state.score, lives: state.lives, level: state.level }),
    [state.score, state.lives, state.level]
  );

  return (
    <div className="min-h-screen bg-[#03060a] text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Neon Invaders</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter start · P pause · R restart · ← → move · Space shoot
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Score: {hud.score}</Badge>
            <Badge>High: {persisted.highScore}</Badge>
            <Badge>Lives: {hud.lives}</Badge>
            <Badge>Wave: {hud.level}</Badge>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <InvadersCanvas state={state} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={start}>Start</Button>
              <Button variant="secondary" onClick={pause}>
                {state.paused ? "Unpause" : "Pause"}
              </Button>
              <Button variant="secondary" onClick={reset}>Reset</Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setPersisted((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
                }
              >
                Sound: {persisted.soundEnabled ? "On" : "Off"}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setPersisted((p) => ({ ...p, reducedMotion: !p.reducedMotion }))
                }
              >
                Motion: {persisted.reducedMotion ? "Reduced" : "Full"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
              <button
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-black/40 px-3 py-3 text-sm font-semibold text-zinc-100 hover:bg-black/60"
                onMouseDown={() => press("left", true)}
                onMouseUp={() => press("left", false)}
                onMouseLeave={() => press("left", false)}
                onTouchStart={() => press("left", true)}
                onTouchEnd={() => press("left", false)}
              >
                ◀
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-3 py-3 text-sm font-semibold text-black hover:bg-cyan-400"
                onMouseDown={() => press("shoot", true)}
                onMouseUp={() => press("shoot", false)}
                onMouseLeave={() => press("shoot", false)}
                onTouchStart={() => press("shoot", true)}
                onTouchEnd={() => press("shoot", false)}
              >
                Fire
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-black/40 px-3 py-3 text-sm font-semibold text-zinc-100 hover:bg-black/60"
                onMouseDown={() => press("right", true)}
                onMouseUp={() => press("right", false)}
                onMouseLeave={() => press("right", false)}
                onTouchStart={() => press("right", true)}
                onTouchEnd={() => press("right", false)}
              >
                ▶
              </button>
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="rounded-3xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-300">
              <div className="font-semibold text-white">Arcade notes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>UFO bonus appears occasionally (worth 100–250).</li>
                <li>As invaders die, remaining ones speed up.</li>
                <li>Reduced motion disables particles.</li>
              </ul>
            </section>
          </aside>
        </main>

        <footer className="mt-10 text-xs text-zinc-500">
          Built for OpenClaw Arena · Frontend-only · Next.js + Tailwind · Offline-first
        </footer>
      </div>
    </div>
  );
}
