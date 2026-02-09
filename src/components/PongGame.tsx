"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  checkMatchOver,
  clamp,
  createGameState,
  difficultyParams,
  GameState,
  InputState,
  matchPointTarget,
  Settings,
  step,
} from "@/lib/pong";
import { useLocalStorage } from "@/lib/useLocalStorage";

const DEFAULT_SETTINGS: Settings = {
  mode: "solo",
  difficulty: "classic",
  bestOf: 5,
  sound: false,
  reduceMotion: false,
  showTrail: true,
  controls: "keyboard",
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

function beep(freq = 440, durationMs = 40, type: OscillatorType = "sine") {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.05;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, durationMs);
  } catch {
    // ignore
  }
}

type CanvasSize = { w: number; h: number; dpr: number };

function computeCanvasSize(container: HTMLDivElement): CanvasSize {
  const rect = container.getBoundingClientRect();
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  // keep a nice arcade aspect
  const w = Math.max(320, Math.floor(rect.width));
  const h = Math.max(420, Math.floor(Math.min(rect.height, w * 1.25)));
  return { w, h, dpr };
}

export default function PongGame() {
  const prefersReduced = usePrefersReducedMotion();
  const [settings, setSettings] = useLocalStorage<Settings>("arena:pong:settings", {
    ...DEFAULT_SETTINGS,
    reduceMotion: prefersReduced,
  });

  useEffect(() => {
    // sync reduce motion once
    setSettings((s) => ({ ...s, reduceMotion: prefersReduced || s.reduceMotion }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const inputRef = useRef<InputState>({
    leftUp: false,
    leftDown: false,
    rightUp: false,
    rightDown: false,
    pointerActive: false,
    pointerYNorm: 0.5,
  });

  const [size, setSize] = useState<CanvasSize>({ w: 720, h: 900, dpr: 1 });
  const [state, setState] = useState<GameState>(() =>
    createGameState(720, 900, settings, performance.now())
  );
  const [tick, setTick] = useState(0); // force UI updates

  const roundTarget = useMemo(() => matchPointTarget(settings.bestOf), [settings.bestOf]);

  // resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => setSize(computeCanvasSize(el));
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // rebuild world if size changes
  useEffect(() => {
    setState((prev) => {
      const now = performance.now();
      const next = createGameState(size.w, size.h, settings, now);
      // keep score/settings? fresh start is OK for arena.
      void prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.w, size.h]);

  // key bindings
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") inputRef.current.leftUp = true;
      if (e.key === "s" || e.key === "S") inputRef.current.leftDown = true;
      if (e.key === "ArrowUp") inputRef.current.rightUp = true;
      if (e.key === "ArrowDown") inputRef.current.rightDown = true;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setState((st) => {
          const next = structuredClone(st) as GameState;
          if (next.phase === "ready" || next.phase === "point") {
            const serveTo = next.phase === "point" ? (next.lastPoint === "left" ? "right" : "left") : next.serveTo;
            // serve away from the scorer
            next.serveTo = serveTo;
            // start play
            const { serveSpeed } = difficultyParams(settings.difficulty);
            const dir = serveTo === "left" ? -1 : 1;
            const angle = (Math.random() * 0.6 - 0.3) * Math.PI;
            next.phase = "playing";
            next.world.ballX = next.world.w / 2;
            next.world.ballY = next.world.h / 2;
            next.world.ballVx = Math.cos(angle) * serveSpeed * dir;
            next.world.ballVy = Math.sin(angle) * serveSpeed;
            next.rally = 0;
            if (settings.sound) beep(520, 40, "square");
          } else if (next.phase === "playing") {
            next.phase = "paused";
          } else if (next.phase === "paused") {
            next.phase = "playing";
          } else if (next.phase === "match_over") {
            // restart
            return createGameState(size.w, size.h, settings, performance.now());
          }
          return next;
        });
      }

      if (e.key === "Escape") {
        setState((st) => {
          const next = structuredClone(st) as GameState;
          if (next.phase === "playing") next.phase = "paused";
          else if (next.phase === "paused") next.phase = "playing";
          return next;
        });
      }

      if (e.key === "r" || e.key === "R") {
        setState(() => createGameState(size.w, size.h, settings, performance.now()));
      }
    };

    const up = (e: KeyboardEvent) => {
      if (e.key === "w" || e.key === "W") inputRef.current.leftUp = false;
      if (e.key === "s" || e.key === "S") inputRef.current.leftDown = false;
      if (e.key === "ArrowUp") inputRef.current.rightUp = false;
      if (e.key === "ArrowDown") inputRef.current.rightDown = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [settings, size.h, size.w]);

  // pointer controls for touch mode (left paddle)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setFromEvent = (clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);
      inputRef.current.pointerYNorm = y;
    };

    const onDown = (e: PointerEvent) => {
      if (settings.controls !== "touch") return;
      inputRef.current.pointerActive = true;
      setFromEvent(e.clientY);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!inputRef.current.pointerActive) return;
      setFromEvent(e.clientY);
    };
    const onUp = () => {
      inputRef.current.pointerActive = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [settings.controls]);

  // main loop
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      setState((st) => {
        const next = structuredClone(st) as GameState;

        // step
        const input = inputRef.current;
        step(next, input, settings, dt, now);

        // point state
        if (next.phase === "point") {
          if (settings.sound) beep(220, 60, "sawtooth");
          const winner = checkMatchOver(next.score, settings.bestOf);
          if (winner) {
            next.phase = "match_over";
            next.winner = winner;
          } else {
            // go to ready for next serve
            next.phase = "ready";
            // serve to the player who lost the point
            const serveTo = next.lastPoint === "left" ? "right" : "left";
            next.serveTo = serveTo;
            next.world.ballVx = 0;
            next.world.ballVy = 0;
            next.world.ballX = next.world.w / 2;
            next.world.ballY = next.world.h / 2;
          }
        }

        return next;
      });

      // UI updates at ~30fps
      if (!settings.reduceMotion) {
        setTick((t) => (t + 1) % 1_000_000);
      } else {
        // reduce motion: update UI less often
        if (Math.random() < 0.15) setTick((t) => (t + 1) % 1_000_000);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [settings]);

  // draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = Math.floor(size.w * size.dpr);
    canvas.height = Math.floor(size.h * size.dpr);
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;

    ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);

    const w = state.world;

    // background
    const g = ctx.createLinearGradient(0, 0, 0, w.h);
    g.addColorStop(0, "#070A12");
    g.addColorStop(1, "#05060A");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w.w, w.h);

    // subtle noise grid
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = "#2A2F45";
    for (let y = 0; y <= w.h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w.w, y);
      ctx.stroke();
    }
    for (let x = 0; x <= w.w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, w.h);
      ctx.stroke();
    }
    ctx.restore();

    // center line
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([10, 12]);
    ctx.strokeStyle = "#95A1FF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w.w / 2, 32);
    ctx.lineTo(w.w / 2, w.h - 32);
    ctx.stroke();
    ctx.restore();

    // trail
    if (settings.showTrail && w.trail.length) {
      ctx.save();
      for (let i = 0; i < w.trail.length; i++) {
        const p = w.trail[i]!;
        const a = i / Math.max(1, w.trail.length - 1);
        ctx.globalAlpha = 0.08 + a * 0.12;
        ctx.fillStyle = "#A7B0FF";
        ctx.beginPath();
        ctx.arc(p.x, p.y, w.ballR * (0.5 + a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // paddles
    const paddleGradient = ctx.createLinearGradient(0, 0, 0, w.h);
    paddleGradient.addColorStop(0, "#EAF0FF");
    paddleGradient.addColorStop(1, "#B9C5FF");

    const drawPaddle = (x: number, cy: number) => {
      const y = cy - w.paddleH / 2;
      const r = 10;
      ctx.fillStyle = paddleGradient;
      ctx.beginPath();
      ctx.roundRect(x, y, w.paddleW, w.paddleH, r);
      ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    };

    drawPaddle(w.paddleInset, w.leftY);
    drawPaddle(w.w - w.paddleInset - w.paddleW, w.rightY);

    // ball
    const ballGlow = ctx.createRadialGradient(w.ballX, w.ballY, 2, w.ballX, w.ballY, w.ballR * 5);
    ballGlow.addColorStop(0, "rgba(167,176,255,0.9)");
    ballGlow.addColorStop(1, "rgba(167,176,255,0)");
    ctx.fillStyle = ballGlow;
    ctx.beginPath();
    ctx.arc(w.ballX, w.ballY, w.ballR * 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F4F7FF";
    ctx.beginPath();
    ctx.arc(w.ballX, w.ballY, w.ballR, 0, Math.PI * 2);
    ctx.fill();

    // overlay
    const overlayText = () => {
      if (state.phase === "paused") return "Paused";
      if (state.phase === "ready") return "Press Space / Enter to Serve";
      if (state.phase === "match_over") return "Match Over — Press Space to Restart";
      return "";
    };

    const t = overlayText();
    if (t) {
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "rgba(5,6,10,0.55)";
      ctx.fillRect(0, w.h / 2 - 60, w.w, 120);
      ctx.fillStyle = "#EAF0FF";
      ctx.font = "700 18px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(t, w.w / 2, w.h / 2);
      ctx.font = "500 13px ui-sans-serif, system-ui";
      ctx.fillStyle = "#B9C5FF";
      ctx.fillText("W/S + ↑/↓  •  R reset  •  Esc pause", w.w / 2, w.h / 2 + 24);
      ctx.restore();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, size, state, settings]);

  const winnerLabel = state.winner ? (state.winner === "left" ? "Left" : "Right") : null;

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <div className="flex-1 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_60px_-40px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between gap-3 pb-3">
            <div className="flex flex-col">
              <div className="text-sm font-medium text-white/70">Arena Pong</div>
              <div className="text-lg font-semibold tracking-tight text-white">{settings.mode === "solo" ? "Solo vs AI" : "VS (local)"}</div>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                Best of {settings.bestOf} (to {roundTarget})
              </div>
              <div className="rounded-full bg-indigo-400/15 px-3 py-1 text-xs font-semibold text-indigo-200">
                {settings.difficulty}
              </div>
            </div>
          </div>

          <div ref={containerRef} className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
            <canvas
              ref={canvasRef}
              className="h-full w-full touch-none rounded-2xl border border-white/10"
              aria-label="Pong game canvas"
              role="img"
            />

            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 rounded-2xl bg-black/30 px-3 py-2 backdrop-blur">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-white/60">L</span>
                <span className="text-xl font-bold text-white">{state.score.left}</span>
              </div>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-white/60">R</span>
                <span className="text-xl font-bold text-white">{state.score.right}</span>
              </div>
            </div>

            {winnerLabel && (
              <div className="absolute bottom-4 left-4 rounded-2xl bg-emerald-400/15 px-3 py-2 text-xs font-semibold text-emerald-200 backdrop-blur">
                Winner: {winnerLabel}
              </div>
            )}
          </div>
        </div>

        <aside className="w-full md:w-[340px]">
          <div className="h-full rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Settings</div>
            <div className="mt-3 grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs font-medium text-white/70">Mode</label>
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  value={settings.mode}
                  onChange={(e) => setSettings((s) => ({ ...s, mode: e.target.value as any }))}
                >
                  <option value="solo">Solo vs AI</option>
                  <option value="vs">VS (local)</option>
                </select>

                <label className="text-xs font-medium text-white/70">Difficulty</label>
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  value={settings.difficulty}
                  onChange={(e) => setSettings((s) => ({ ...s, difficulty: e.target.value as any }))}
                >
                  <option value="chill">Chill</option>
                  <option value="classic">Classic</option>
                  <option value="insane">Insane</option>
                </select>

                <label className="text-xs font-medium text-white/70">Best of</label>
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  value={settings.bestOf}
                  onChange={(e) => setSettings((s) => ({ ...s, bestOf: Number(e.target.value) as any }))}
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={7}>7</option>
                </select>

                <label className="text-xs font-medium text-white/70">Controls</label>
                <select
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  value={settings.controls}
                  onChange={(e) => setSettings((s) => ({ ...s, controls: e.target.value as any }))}
                >
                  <option value="keyboard">Keyboard</option>
                  <option value="touch">Touch (left paddle)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white/80">
                  <span>Ball trail</span>
                  <input
                    type="checkbox"
                    checked={settings.showTrail}
                    onChange={(e) => setSettings((s) => ({ ...s, showTrail: e.target.checked }))}
                  />
                </label>

                <label className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white/80">
                  <span>Sound</span>
                  <input
                    type="checkbox"
                    checked={settings.sound}
                    onChange={(e) => setSettings((s) => ({ ...s, sound: e.target.checked }))}
                  />
                </label>

                <label className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-medium text-white/80">
                  <span>Reduce motion</span>
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => setSettings((s) => ({ ...s, reduceMotion: e.target.checked }))}
                  />
                </label>

                <button
                  className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  onClick={() => setState(createGameState(size.w, size.h, settings, performance.now()))}
                >
                  Reset (R)
                </button>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-white/70">
                <div className="font-semibold text-white/80">How to play</div>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>
                    <span className="font-semibold text-white/80">Serve/Resume</span>: Space or Enter
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">Left paddle</span>: W / S (or touch)
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">Right paddle</span>: ↑ / ↓ (VS mode)
                  </li>
                  <li>
                    <span className="font-semibold text-white/80">Pause</span>: Esc
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
