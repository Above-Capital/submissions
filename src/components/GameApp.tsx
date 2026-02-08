"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cameraForPlayer, createInitialState, resetToMenu, setSettings, startGame, tick, worldScaleForScore, worldSize } from "../lib/game";
import type { GameState } from "../lib/gameTypes";
import { clamp, len, norm } from "../lib/math";
import { lsGet, lsSet } from "../lib/storage";

const LS_KEY = "driftworm:v1";

type Persist = {
  hiScore: number;
  settings: GameState["settings"];
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

export default function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [state, setState] = useState<GameState>(() => {
    const s = createInitialState();
    const p = lsGet<Persist>(LS_KEY, { hiScore: 0, settings: s.settings });
    s.hiScore = p.hiScore;
    s.settings = p.settings;
    return s;
  });
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const inputRef = useRef({
    aimVec: { x: 1, y: 0 },
    dashHeld: false,
    pausePressed: false,
  });

  const [hasFocus, setHasFocus] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
  const [tab, setTab] = useState<"play" | "settings">("play");

  const player = state.snakes[state.playerId];
  const running = state.phase === "playing";

  // persist
  useEffect(() => {
    lsSet<Persist>(LS_KEY, { hiScore: state.hiScore, settings: state.settings });
  }, [state.hiScore, state.settings]);

  // main loop
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    const step = 1 / 60;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;

      // clamp input
      const inp = inputRef.current;
      const aim = inp.aimVec;
      if (len(aim) < 0.001) inp.aimVec = { x: 1, y: 0 };

      // tick fixed
      if (acc >= step) {
        const frames = Math.min(5, Math.floor(acc / step));
        acc -= frames * step;
        setState((prev) => {
          const s = structuredClone(prev) as GameState;
          for (let i = 0; i < frames; i++) {
            tick(s, inp, step);
            inp.pausePressed = false;
          }
          return s;
        });
      }

      // render (always use latest)
      draw(canvasRef.current, stateRef.current);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state.settings.quality, state.settings.bloom]);

  // visibility / focus
  useEffect(() => {
    const onVis = () => {
      const ok = document.visibilityState === "visible";
      setHasFocus(ok);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // input handlers
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.code === "Space") {
        inputRef.current.dashHeld = e.type === "keydown";
        e.preventDefault();
      }
      if (e.key === "Escape") {
        inputRef.current.pausePressed = true;
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "h" && e.type === "keydown") {
        setHelpOpen((v) => !v);
      }
    };

    window.addEventListener("keydown", onKey, { passive: false });
    window.addEventListener("keyup", onKey, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const v = { x: e.clientX - cx, y: e.clientY - cy };
      const n = norm(v);
      inputRef.current.aimVec = n;
    };

    const onPointerDown = (e: PointerEvent) => {
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        // ignore
      }
      inputRef.current.dashHeld = true;
    };

    const onPointerUp = () => {
      inputRef.current.dashHeld = false;
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = c.getBoundingClientRect();
      c.width = Math.floor(rect.width * dpr);
      c.height = Math.floor(rect.height * dpr);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const hud = useMemo(() => {
    const p = player;
    if (!p) return null;
    return {
      score: p.score,
      kills: p.kills,
      energy: p.energy,
      magnet: p.magnet,
    };
  }, [player]);

  const showOverlay = state.phase !== "playing";

  return (
    <div className="min-h-screen">
      <div className="relative mx-auto max-w-[1200px] px-4 py-6">
        <Header
          running={running}
          focus={hasFocus}
          hiScore={state.hiScore}
          onHelp={() => setHelpOpen(true)}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-[16/10] w-full">
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full touch-none"
                aria-label="Game canvas"
              />

              <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
                {hud && (
                  <HUD
                    score={hud.score}
                    kills={hud.kills}
                    energy={hud.energy}
                    magnet={hud.magnet}
                    phase={state.phase}
                  />
                )}
              </div>

              {showOverlay && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Overlay
                    s={state}
                    tab={tab}
                    setTab={setTab}
                    onStart={() => setState((prev) => {
                      const n = structuredClone(prev) as GameState;
                      startGame(n);
                      return n;
                    })}
                    onReset={() => setState((prev) => {
                      const n = structuredClone(prev) as GameState;
                      resetToMenu(n);
                      return n;
                    })}
                    onSettings={(patch) => setState((prev) => {
                      const n = structuredClone(prev) as GameState;
                      setSettings(n, patch);
                      return n;
                    })}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/70">
              <div className="flex items-center gap-3">
                <KeyPill>Move: mouse/trackpad</KeyPill>
                <KeyPill>Dash: hold click / Space</KeyPill>
                <KeyPill>Pause: Esc</KeyPill>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setHelpOpen(true)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 hover:bg-white/10"
                >
                  Help
                </button>
                <a
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/80 hover:bg-white/10"
                  href="https://github.com/Above-Capital/submissions"
                  target="_blank"
                  rel="noreferrer"
                >
                  Submissions repo
                </a>
              </div>
            </div>
          </div>

          <SidePanel
            s={state}
            onStart={() => setState((prev) => {
              const n = structuredClone(prev) as GameState;
              startGame(n);
              return n;
            })}
            onReset={() => setState((prev) => {
              const n = structuredClone(prev) as GameState;
              resetToMenu(n);
              return n;
            })}
          />
        </div>

        {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      </div>
    </div>
  );
}

function Header({
  running,
  focus,
  hiScore,
  onHelp,
}: {
  running: boolean;
  focus: boolean;
  hiScore: number;
  onHelp: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 shadow-[0_0_30px_rgba(34,197,94,0.25)]" />
        <div>
          <div className="text-lg font-semibold tracking-tight">DriftWorm Arena</div>
          <div className="text-xs text-white/60">
            Snake.io alternative • dash energy • magnet orbs • stormwall
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75">
          Hi-score: <span className="text-white">{hiScore}</span>
        </div>
        <div
          className={`rounded-full border px-3 py-1.5 text-xs ${
            running
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-white/70"
          }`}
        >
          {running ? "LIVE" : "LOBBY"}
        </div>
        {!focus && (
          <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-100">
            tab unfocused
          </div>
        )}
        <button
          onClick={onHelp}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        >
          H
        </button>
      </div>
    </div>
  );
}

function KeyPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
      {children}
    </span>
  );
}

function HUD({
  score,
  kills,
  energy,
  magnet,
  phase,
}: {
  score: number;
  kills: number;
  energy: number;
  magnet: number;
  phase: GameState["phase"];
}) {
  const e = clamp(energy, 0, 1);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-2">
        <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
          <div className="text-[10px] text-white/60">Score</div>
          <div className="text-sm font-semibold tabular-nums">{score}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
          <div className="text-[10px] text-white/60">Kills</div>
          <div className="text-sm font-semibold tabular-nums">{kills}</div>
        </div>
      </div>

      <div className="flex min-w-[230px] flex-1 items-center gap-3">
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-[10px] text-white/60">
            <span>Dash energy</span>
            <span className="tabular-nums">{Math.round(e * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-300"
              style={{ width: `${Math.round(e * 100)}%` }}
            />
          </div>
        </div>
        <div className="w-[120px]">
          <div className="mb-1 text-[10px] text-white/60">Magnet</div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
              style={{ width: `${Math.round(clamp(magnet / 7.5, 0, 1) * 100)}%` }}
            />
          </div>
        </div>
        {phase === "paused" && (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70">
            paused
          </div>
        )}
      </div>
    </div>
  );
}

function Overlay({
  s,
  tab,
  setTab,
  onStart,
  onReset,
  onSettings,
}: {
  s: GameState;
  tab: "play" | "settings";
  setTab: (t: "play" | "settings") => void;
  onStart: () => void;
  onReset: () => void;
  onSettings: (p: Partial<GameState["settings"]>) => void;
}) {
  const reason = s.lastDeathReason;

  return (
    <div className="mx-4 w-full max-w-[560px] rounded-3xl border border-white/10 bg-[#0A0F1F]/90 p-5 shadow-[0_40px_90px_rgba(0,0,0,0.65)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">
            {s.phase === "menu" && "Lobby"}
            {s.phase === "paused" && "Paused"}
            {s.phase === "gameover" && "Wiped"}
          </div>
          <div className="text-xs text-white/60">
            {s.phase === "menu" && "Aim with your cursor. Hold Space/click to dash."}
            {s.phase === "paused" && "Esc to resume. Or tweak settings."}
            {s.phase === "gameover" && (reason ? `Cause: ${reason}` : "Try again.")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("play")}
            className={`rounded-full px-3 py-1 text-xs ${
              tab === "play" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
            }`}
          >
            Play
          </button>
          <button
            onClick={() => setTab("settings")}
            className={`rounded-full px-3 py-1 text-xs ${
              tab === "settings" ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {tab === "play" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">How you win</div>
            <ul className="mt-2 space-y-1 text-xs text-white/65">
              <li>• Eat orbs to grow and rack score.</li>
              <li>• Dash through gaps (drains energy).</li>
              <li>• Clip opponents’ bodies — head collision wipes you.</li>
              <li>• Stay inside the stormwall as it closes.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Orbs</div>
            <ul className="mt-2 space-y-1 text-xs text-white/65">
              <li>• Green: growth</li>
              <li>• Yellow: quick energy</li>
              <li>• Blue: magnet (pulls orbs to you)</li>
            </ul>
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            <button
              onClick={onStart}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(34,197,94,0.25)] hover:brightness-110"
            >
              {s.phase === "paused" ? "Resume" : "Start"}
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              New run
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Glow"
            hint="Bloom-style lighting (cosmetic)."
            value={s.settings.bloom}
            onChange={(v) => onSettings({ bloom: v })}
          />
          <Toggle
            label="Screen shake"
            hint="Subtle shake on impacts."
            value={s.settings.screenShake}
            onChange={(v) => onSettings({ screenShake: v })}
          />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
            <div className="text-xs font-semibold text-white/80">Quality</div>
            <div className="mt-2 flex gap-2">
              {(["high", "low"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => onSettings({ quality: q })}
                  className={`rounded-full px-3 py-1.5 text-xs ${
                    s.settings.quality === q
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            <button
              onClick={onStart}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 px-4 py-2.5 text-sm font-semibold text-black hover:brightness-110"
            >
              {s.phase === "paused" ? "Resume" : "Start"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-white/80">{label}</div>
          <div className="text-[11px] text-white/55">{hint}</div>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`h-8 w-14 rounded-full border transition-colors ${
            value
              ? "border-emerald-400/30 bg-emerald-400/20"
              : "border-white/10 bg-white/5"
          }`}
          aria-pressed={value}
        >
          <div
            className={`h-7 w-7 translate-x-0.5 rounded-full bg-white transition-transform ${
              value ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function SidePanel({ s, onStart, onReset }: { s: GameState; onStart: () => void; onReset: () => void }) {
  const p = s.snakes[s.playerId];
  const alive = p?.alive;

  const scoreboard = Object.values(s.snakes)
    .filter((x) => x.alive)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-white/90">Match</div>
        <div className="text-xs text-white/60">
          arena {worldSize().w}×{worldSize().h}
        </div>
      </div>

      <div className="mt-3 grid gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] text-white/55">Status</div>
          <div className="mt-1 text-sm font-semibold">
            {s.phase === "menu" && "Lobby"}
            {s.phase === "playing" && (alive ? "Alive" : "…")}
            {s.phase === "paused" && "Paused"}
            {s.phase === "gameover" && "Game over"}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={onStart}
              className="rounded-2xl bg-gradient-to-br from-emerald-400 to-lime-300 px-3 py-2 text-xs font-semibold text-black hover:brightness-110"
            >
              {s.phase === "paused" ? "Resume" : "Start"}
            </button>
            <button
              onClick={onReset}
              className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              New run
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-white/55">Top alive</div>
            <div className="text-[11px] text-white/40">{formatTime(s.t)}</div>
          </div>
          <div className="mt-2 space-y-2">
            {scoreboard.map((sn) => (
              <div key={sn.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: sn.colorA }}
                  />
                  <span className={sn.id === s.playerId ? "text-white" : "text-white/70"}>
                    {sn.name}
                    {sn.id === s.playerId ? " (you)" : ""}
                  </span>
                </div>
                <div className="tabular-nums text-white/70">{sn.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="text-[11px] text-white/55">Tips</div>
          <ul className="mt-2 space-y-1 text-xs text-white/65">
            <li>• Dash is strongest when you drift—don’t hold it forever.</li>
            <li>• Magnet is a score multiplier. Chain it with energy orbs.</li>
            <li>• Bait bots into your trail near the stormwall.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[720px] rounded-3xl border border-white/10 bg-[#0A0F1F]/95 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">Controls</div>
            <div className="mt-1 text-xs text-white/60">
              Designed for mouse + keyboard, but mobile works too.
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Aim</div>
            <div className="mt-2 text-xs text-white/65">
              Move your pointer around the canvas. Your worm turns toward it.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Dash</div>
            <div className="mt-2 text-xs text-white/65">
              Hold <span className="text-white">Space</span> or press/hold on the
              screen. Drains energy; regenerates when you stop.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Pause</div>
            <div className="mt-2 text-xs text-white/65">
              Press <span className="text-white">Esc</span>. Useful if your tab
              loses focus.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Strategy</div>
            <div className="mt-2 text-xs text-white/65">
              Don’t tunnel-vision on pellets—use the stormwall to force collisions.
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-white/50">
          This is a pure frontend demo (no backend). Scores persist locally on this
          device.
        </div>
      </div>
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, s: GameState) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = canvas.width / canvas.getBoundingClientRect().width;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;

  // background
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, "#070A12");
  bg.addColorStop(1, "#050713");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const p = s.snakes[s.playerId];
  const cam = cameraForPlayer(s);
  const zoom = worldScaleForScore(p?.score ?? 0);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cam.x, -cam.y);

  // arena grid
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  const grid = 80;
  for (let x = 0; x <= s.arena.w; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, s.arena.h);
    ctx.stroke();
  }
  for (let y = 0; y <= s.arena.h; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s.arena.w, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // stormwall
  const shrinkPx = s.arena.shrink * 280;
  ctx.strokeStyle = "rgba(56,189,248,0.25)";
  ctx.lineWidth = 10;
  ctx.strokeRect(shrinkPx, shrinkPx, s.arena.w - shrinkPx * 2, s.arena.h - shrinkPx * 2);
  ctx.strokeStyle = "rgba(34,197,94,0.10)";
  ctx.lineWidth = 1;
  ctx.strokeRect(shrinkPx, shrinkPx, s.arena.w - shrinkPx * 2, s.arena.h - shrinkPx * 2);

  // pellets
  for (const pel of Object.values(s.pellets)) {
    const c =
      pel.kind === "food"
        ? "rgba(34,197,94,0.95)"
        : pel.kind === "energy"
          ? "rgba(250,204,21,0.95)"
          : "rgba(34,211,238,0.95)";

    ctx.beginPath();
    ctx.fillStyle = c;
    ctx.arc(pel.p.x, pel.p.y, pel.r, 0, Math.PI * 2);
    ctx.fill();

    if (s.settings.bloom) {
      const g = ctx.createRadialGradient(pel.p.x, pel.p.y, 0, pel.p.x, pel.p.y, pel.r * 6);
      g.addColorStop(0, c.replace("0.95", "0.30"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pel.p.x, pel.p.y, pel.r * 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // snakes
  const snakes = Object.values(s.snakes)
    .filter((x) => x.alive)
    .sort((a, b) => (a.id === s.playerId ? 1 : 0) - (b.id === s.playerId ? 1 : 0));

  for (const sn of snakes) {
    // body
    for (let i = sn.body.length - 1; i >= 0; i--) {
      const bp = sn.body[i];
      const t = i / Math.max(1, sn.body.length - 1);
      const r = 9 - t * 4;
      const col = lerpColor(sn.colorA, sn.colorB, 1 - t);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // head glow
    if (s.settings.bloom) {
      const g = ctx.createRadialGradient(sn.head.x, sn.head.y, 0, sn.head.x, sn.head.y, 60);
      g.addColorStop(0, hexToRgba(sn.colorA, 0.22));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sn.head.x, sn.head.y, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    // head
    ctx.fillStyle = sn.id === s.playerId ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(sn.head.x, sn.head.y, 6.2, 0, Math.PI * 2);
    ctx.fill();

    // nameplate
    ctx.font = "12px var(--font-geist-mono), ui-monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(sn.name, sn.head.x, sn.head.y - 14);
  }

  ctx.restore();

  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);

  // pause hint
  if (s.phase === "playing") {
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.font = "12px var(--font-geist-mono), ui-monospace";
    ctx.textAlign = "right";
    ctx.fillText("Esc to pause", w - 16, h - 14);
  }
}

function lerpColor(a: string, b: string, t: number) {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bb = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bb})`;
}

function hexToRgba(hex: string, a: number) {
  const p = parseHex(hex);
  return `rgba(${p.r},${p.g},${p.b},${a})`;
}

function parseHex(hex: string) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
