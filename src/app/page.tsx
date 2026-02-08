"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArenaCanvas } from "@/components/ArenaCanvas";
import { Badge, Button } from "@/components/ui";
import { createInitialState, setDirection, step } from "@/lib/game";
import type { GameState, Vec } from "@/lib/types";
import { defaultPersisted, loadPersisted, savePersisted, type Persisted } from "@/lib/storage";
import { formatCompact, tryPlayTone } from "@/lib/utils";

const DIR_KEYS: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

export default function Home() {
  const [persisted, setPersisted] = useState<Persisted>(() => defaultPersisted);
  const [state, setState] = useState<GameState>(() => createInitialState(0));

  useEffect(() => {
    const p = loadPersisted();
    setPersisted(p);
    setState(createInitialState(p.bestScore));
  }, []);

  useEffect(() => {
    savePersisted(persisted);
  }, [persisted]);

  // main loop
  const rafRef = useRef<number>(0);
  useEffect(() => {
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      setState((s) => step(s));
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // keep best score persisted
  useEffect(() => {
    if (state.bestScore > persisted.bestScore) {
      setPersisted((p) => ({ ...p, bestScore: state.bestScore }));
    }
  }, [state.bestScore, persisted.bestScore]);

  const me = useMemo(() => state.snakes.find((s) => s.id === state.me) ?? null, [state.snakes, state.me]);

  function start() {
    setState((s) => ({ ...s, started: true, paused: false, over: false, lastMessage: "" }));
    tryPlayTone(persisted.soundEnabled, 660, 140);
  }

  function reset() {
    setState(createInitialState(persisted.bestScore));
    tryPlayTone(persisted.soundEnabled, 440, 120);
  }

  function togglePause() {
    setState((s) => ({ ...s, paused: !s.paused }));
  }

  function boost() {
    // boost = dash powerup effect
    setState((s) => ({
      ...s,
      snakes: s.snakes.map((sn) =>
        sn.id === s.me ? { ...sn, dashUntil: Date.now() + 500 } : sn
      ),
    }));
    tryPlayTone(persisted.soundEnabled, 880, 60);
    if (navigator.vibrate) navigator.vibrate(10);
  }

  // keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key;
      if (k === " ") {
        e.preventDefault();
        if (!state.started) start();
        else boost();
        return;
      }
      if (k.toLowerCase() === "p") {
        e.preventDefault();
        togglePause();
        return;
      }
      if (k.toLowerCase() === "r") {
        e.preventDefault();
        reset();
        return;
      }
      const dir = DIR_KEYS[k] ?? DIR_KEYS[k.toLowerCase()];
      if (dir) {
        e.preventDefault();
        setState((s) => setDirection(s, dir));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.started, persisted.soundEnabled]);

  // click/tap
  function onTap() {
    if (!state.started) start();
    else boost();
  }

  const leaderboard = useMemo(() => {
    return [...state.snakes]
      .filter((s) => s.alive)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [state.snakes]);

  return (
    <div className="min-h-screen bg-[#03060a] text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Neon Serpent
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Snake.io-ish arena: bots + shrinking zone + powerups. Space/tap = boost.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Score: {me ? me.score : 0}</Badge>
            <Badge>Best: {persisted.bestScore}</Badge>
            <Badge>Zone: {state.arena.safeRadius.toFixed(1)}</Badge>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div onClick={onTap} className="cursor-pointer select-none">
              <ArenaCanvas state={state} />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Button onClick={start}>{state.started ? "Resume" : "Start"}</Button>
              <Button variant="secondary" onClick={togglePause}>
                {state.paused ? "Unpause" : "Pause"}
              </Button>
              <Button variant="secondary" onClick={boost}>
                Boost
              </Button>
              <Button variant="secondary" onClick={reset}>
                Reset
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setPersisted((p) => ({ ...p, soundEnabled: !p.soundEnabled }))
                }
              >
                Sound: {persisted.soundEnabled ? "On" : "Off"}
              </Button>
            </div>

            <div className="mt-4 rounded-3xl border border-zinc-800 bg-black/40 p-4 text-sm text-zinc-300">
              <div className="font-semibold text-white">Controls</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>WASD / Arrow keys: steer</li>
                <li>Space / Tap: boost (short dash)</li>
                <li>P: pause · R: reset</li>
              </ul>
              <div className="mt-3 text-xs text-zinc-400">
                Powerups: ⚡ dash · 🛡 shield · 🧲 magnet
              </div>
            </div>
          </section>

          <aside className="grid gap-6">
            <section className="rounded-3xl border border-zinc-800 bg-black/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Live leaderboard
              </div>
              <div className="mt-3 grid gap-2">
                {leaderboard.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-black/30 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">
                        {i + 1}. {s.name}
                      </div>
                      <div className="mt-0.5 text-xs text-zinc-400">
                        {s.isBot ? "Bot" : "You"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold" style={{ color: s.color }}>
                      {formatCompact(s.score)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-zinc-800 bg-black/40 p-5 text-sm text-zinc-300">
              <div className="font-semibold text-white">IO twist</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  The safe zone shrinks over time. Outside it, you die unless shielded.
                </li>
                <li>
                  Bots hunt food/powerups, but can be baited into collisions.
                </li>
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
