"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button } from "@/components/ui";
import { PongCanvas } from "@/components/PongCanvas";
import { createGame, resetRound, serve, tick, type Difficulty, type GameState, type Mode } from "@/lib/game";
import { defaultPersisted, loadPersisted, savePersisted, tryPlay, type Persisted } from "@/lib/storage";

export default function Home() {
  const [persisted, setPersisted] = useState<Persisted>(() => defaultPersisted);
  const [state, setState] = useState<GameState>(() => createGame());

  const [input, setInput] = useState({
    leftUp: false,
    leftDown: false,
    rightUp: false,
    rightDown: false,
  });

  useEffect(() => {
    const p = loadPersisted();
    setPersisted(p);
  }, []);

  useEffect(() => {
    savePersisted(persisted);
  }, [persisted]);

  // loop
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  useEffect(() => {
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (!state.started || state.paused) {
        lastRef.current = ts;
        return;
      }
      if (!lastRef.current) lastRef.current = ts;
      const dt = Math.min(0.033, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      setState((s) =>
        tick(s, dt, {
          ...input,
          mode: persisted.mode,
          difficulty: persisted.difficulty,
        })
      );
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [input, persisted.mode, persisted.difficulty, state.started, state.paused]);

  function start() {
    setState((s) => {
      const started = { ...s, started: true, paused: false };
      // serve if ball is stopped
      if (started.ball.vx === 0 && started.ball.vy === 0) {
        return serve(started, -1);
      }
      return started;
    });
    tryPlay(persisted.soundEnabled, 660, 120);
  }

  function pause() {
    setState((s) => ({ ...s, paused: !s.paused }));
  }

  function reset() {
    setState((s) => resetRound({ ...s, scoreL: 0, scoreR: 0, streakWinsVsAI: 0 }));
    tryPlay(persisted.soundEnabled, 440, 120);
  }

  function setMode(mode: Mode) {
    setPersisted((p) => ({ ...p, mode }));
  }

  function setDifficulty(difficulty: Difficulty) {
    setPersisted((p) => ({ ...p, difficulty }));
  }

  // scoring: treat a win vs AI as getting to 7 first
  useEffect(() => {
    if (persisted.mode !== "ai") return;
    if (state.scoreL >= 7 || state.scoreR >= 7) {
      const won = state.scoreL > state.scoreR;
      setState((s) => resetRound({ ...s, scoreL: 0, scoreR: 0 }));
      if (won) {
        const nextStreak = state.streakWinsVsAI + 1;
        setState((s) => ({ ...s, streakWinsVsAI: nextStreak }));
        if (nextStreak > persisted.highScore) {
          setPersisted((p) => ({ ...p, highScore: nextStreak }));
        }
        tryPlay(persisted.soundEnabled, 880, 140);
      } else {
        setState((s) => ({ ...s, streakWinsVsAI: 0 }));
        tryPlay(persisted.soundEnabled, 220, 200);
      }
    }
  }, [state.scoreL, state.scoreR]);

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
        reset();
      }

      if (k === "w") setInput((i) => ({ ...i, leftUp: true }));
      if (k === "s") setInput((i) => ({ ...i, leftDown: true }));
      if (k === "arrowup") setInput((i) => ({ ...i, rightUp: true }));
      if (k === "arrowdown") setInput((i) => ({ ...i, rightDown: true }));
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w") setInput((i) => ({ ...i, leftUp: false }));
      if (k === "s") setInput((i) => ({ ...i, leftDown: false }));
      if (k === "arrowup") setInput((i) => ({ ...i, rightUp: false }));
      if (k === "arrowdown") setInput((i) => ({ ...i, rightDown: false }));
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [persisted.soundEnabled]);

  const scoreText = `${state.scoreL} : ${state.scoreR}`;

  return (
    <div className="min-h-screen bg-[#03060a] text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Neon Pong</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter: start · P: pause · R: reset · W/S left · ↑/↓ right
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Score: {scoreText}</Badge>
            <Badge>
              Best streak (AI): {persisted.highScore}
            </Badge>
            <Badge>Rally: {state.rally}</Badge>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <PongCanvas state={state} />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={start}>Start</Button>
              <Button variant="secondary" onClick={pause}>
                {state.paused ? "Unpause" : "Pause"}
              </Button>
              <Button variant="secondary" onClick={reset}>Reset</Button>
              <Button
                variant="ghost"
                onClick={() => setPersisted((p) => ({ ...p, soundEnabled: !p.soundEnabled }))}
              >
                Sound: {persisted.soundEnabled ? "On" : "Off"}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:hidden">
              <Button variant="secondary" onClick={() => setInput((i) => ({ ...i, leftUp: true }))}>
                Left ▲
              </Button>
              <Button variant="secondary" onClick={() => setInput((i) => ({ ...i, rightUp: true }))}>
                Right ▲
              </Button>
              <Button variant="secondary" onClick={() => setInput((i) => ({ ...i, leftDown: true }))}>
                Left ▼
              </Button>
              <Button variant="secondary" onClick={() => setInput((i) => ({ ...i, rightDown: true }))}>
                Right ▼
              </Button>
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="rounded-3xl border border-zinc-800 bg-black/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Mode
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant={persisted.mode === "ai" ? "primary" : "secondary"}
                  onClick={() => setMode("ai")}
                >
                  vs AI
                </Button>
                <Button
                  variant={persisted.mode === "local" ? "primary" : "secondary"}
                  onClick={() => setMode("local")}
                >
                  Local 2P
                </Button>
              </div>

              <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Difficulty
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
                  <Button
                    key={d}
                    variant={persisted.difficulty === d ? "primary" : "secondary"}
                    onClick={() => setDifficulty(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-black/30 p-4 text-sm text-zinc-300">
                <div className="font-semibold text-white">How to win</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>First to 7 points wins a round</li>
                  <li>Your AI win streak is saved locally</li>
                  <li>Shots speed up during long rallies</li>
                </ul>
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-300">
              <div className="font-semibold text-white">Polish</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Neon canvas rendering (glow paddles + ball)</li>
                <li>Keyboard + mobile controls</li>
                <li>Sound toggle + persisted settings</li>
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
