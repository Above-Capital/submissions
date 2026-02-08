"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialState,
  resetRun,
  setSettings,
  tick,
  type Difficulty,
  type Settings,
  type State,
} from "../lib/invaders";
import { createSfx } from "../lib/sfx";
import { lsGet, lsSet } from "../lib/storage";

const LS_KEY = "starfall-invaders:v1";

type Persist = {
  hiScore: number;
  settings: Settings;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export default function InvadersApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [s, setS] = useState<State>(() => {
    const st = createInitialState();
    const p = lsGet<Persist>(LS_KEY, { hiScore: 0, settings: st.settings });
    st.hiScore = p.hiScore;
    st.settings = p.settings;
    return st;
  });
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  }, [s]);

  const inputRef = useRef({
    left: false,
    right: false,
    fire: false,
    pausePressed: false,
    restartPressed: false,
  });

  const [helpOpen, setHelpOpen] = useState(false);

  // sfx
  const sfxRef = useRef<ReturnType<typeof createSfx> | null>(null);
  useEffect(() => {
    sfxRef.current = createSfx(() => sRef.current.settings.sound);
  }, []);

  // persist
  useEffect(() => {
    lsSet<Persist>(LS_KEY, { hiScore: s.hiScore, settings: s.settings });
  }, [s.hiScore, s.settings]);

  // resize
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

  // keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") inputRef.current.left = true;
      if (k === "d" || k === "arrowright") inputRef.current.right = true;
      if (k === " " || e.code === "Space") inputRef.current.fire = true;
      if (k === "escape") inputRef.current.pausePressed = true;
      if (k === "r") inputRef.current.restartPressed = true;
      if (k === "h") setHelpOpen((v) => !v);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") inputRef.current.left = false;
      if (k === "d" || k === "arrowright") inputRef.current.right = false;
      if (k === " " || e.code === "Space") inputRef.current.fire = false;
      if (k === "r") inputRef.current.restartPressed = false;
    };
    window.addEventListener("keydown", onKeyDown, { passive: true });
    window.addEventListener("keyup", onKeyUp, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // mobile buttons (pointer)
  const press = <K extends keyof typeof inputRef.current>(key: K, v: (typeof inputRef.current)[K]) => {
    inputRef.current[key] = v;
  };

  // main loop
  useEffect(() => {
    let last = performance.now();
    let acc = 0;
    const step = 1 / 120;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += dt;

      if (acc >= step) {
        const frames = Math.min(10, Math.floor(acc / step));
        acc -= frames * step;

        setS((prev) => {
          const next = structuredClone(prev) as State;
          for (let i = 0; i < frames; i++) {
            // edge-trigger pause/restart
            const inp = inputRef.current;
            tick(next, inp, step);
            inp.pausePressed = false;
            inp.restartPressed = false;

            // sfx hooks: shot/hit are inferred from bullet count deltas in UI effect below.
          }
          return next;
        });
      }

      draw(canvasRef.current, sRef.current);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  // sfx based on state transitions
  const lastRef = useRef({
    bullets: 0,
    invAlive: 0,
    lives: s.lives,
    phase: s.phase,
  });
  useEffect(() => {
    const alive = s.invaders.filter((v) => v.alive).length;
    const last = lastRef.current;
    if (s.bullets.length > last.bullets) sfxRef.current?.shot();
    if (alive < last.invAlive) sfxRef.current?.hit();
    if (s.lives < last.lives) sfxRef.current?.goal();
    if (s.phase === "wave_clear" && last.phase !== "wave_clear") sfxRef.current?.goal();
    lastRef.current = { bullets: s.bullets.length, invAlive: alive, lives: s.lives, phase: s.phase };
  }, [s.bullets.length, s.invaders, s.lives, s.phase]);

  const aliveInvaders = useMemo(() => s.invaders.filter((v) => v.alive).length, [s.invaders]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-emerald-400 shadow-[0_0_45px_rgba(34,211,238,0.22)]" />
            <div>
              <div className="text-lg font-semibold tracking-tight">STARFALL INVADERS</div>
              <div className="text-xs text-white/60">
                Space Invaders remix • combo multiplier • destructible shields
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{s.phase === "playing" ? "LIVE" : s.phase.toUpperCase()}</Badge>
            <button
              onClick={() => setHelpOpen(true)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
            >
              Help (H)
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_60px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-[16/11] w-full">
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
              <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <HudPill label="Score" value={s.score} />
                  <HudPill label="x" value={s.multiplier} accent />
                  <HudPill label="Lives" value={s.lives} />
                  <HudPill label="Wave" value={s.wave} />
                  <HudPill label="Invaders" value={aliveInvaders} />
                  <HudPill label="Hi" value={s.hiScore} />
                </div>
              </div>

              {s.settings.mobileButtons && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4 lg:hidden">
                  <div className="flex gap-2">
                    <MobileBtn
                      label="◀"
                      onDown={() => press("left", true)}
                      onUp={() => press("left", false)}
                    />
                    <MobileBtn
                      label="▶"
                      onDown={() => press("right", true)}
                      onUp={() => press("right", false)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <MobileBtn label="FIRE" onDown={() => press("fire", true)} onUp={() => press("fire", false)} />
                    <MobileBtn label="ESC" onDown={() => press("pausePressed", true)} onUp={() => press("pausePressed", false)} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/70">
              <div className="flex flex-wrap items-center gap-2">
                <Pill>Move: A/D or ←/→</Pill>
                <Pill>Fire: Space (hold)</Pill>
                <Pill>Pause: Esc</Pill>
                <Pill>Reset: R</Pill>
              </div>
              <div className="text-[11px] text-white/45">Pro tip: keep your combo to ramp multiplier.</div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white/90">Run</div>
            <div className="mt-3 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/55">State</div>
                <div className="mt-1 text-sm font-semibold text-white/90">
                  {s.phase === "menu" && "Ready"}
                  {s.phase === "playing" && "Fighting"}
                  {s.phase === "paused" && "Paused"}
                  {s.phase === "wave_clear" && "Wave clear"}
                  {s.phase === "gameover" && "Game over"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setS((prev) => {
                        const n = structuredClone(prev) as State;
                        // start via firing once
                        inputRef.current.fire = true;
                        return n;
                      });
                      setTimeout(() => (inputRef.current.fire = false), 60);
                    }}
                    className="rounded-2xl bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-emerald-400 px-3 py-2 text-xs font-semibold text-black hover:brightness-110"
                  >
                    {s.phase === "paused" ? "Resume" : s.phase === "playing" ? "Fire" : "Start"}
                  </button>
                  <button
                    onClick={() =>
                      setS((prev) => {
                        const n = structuredClone(prev) as State;
                        resetRun(n);
                        return n;
                      })
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <SelectRow
                label="Difficulty"
                value={s.settings.difficulty}
                options={[
                  { value: "chill", label: "Chill" },
                  { value: "classic", label: "Classic" },
                  { value: "panic", label: "Panic" },
                ]}
                onChange={(v) =>
                  setS((prev) => {
                    const n = structuredClone(prev) as State;
                    setSettings(n, { difficulty: v as Difficulty });
                    resetRun(n);
                    return n;
                  })
                }
              />

              <ToggleRow
                label="Sound"
                value={s.settings.sound}
                onToggle={() => {
                  setS((prev) => {
                    const n = structuredClone(prev) as State;
                    setSettings(n, { sound: !n.settings.sound });
                    return n;
                  });
                  sfxRef.current?.toggle();
                }}
              />

              <ToggleRow
                label="Mobile buttons"
                value={s.settings.mobileButtons}
                onToggle={() =>
                  setS((prev) => {
                    const n = structuredClone(prev) as State;
                    setSettings(n, { mobileButtons: !n.settings.mobileButtons });
                    return n;
                  })
                }
              />

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/55">Heat</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-fuchsia-500"
                    style={{ width: `${Math.round(clamp(s.overheat, 0, 1) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-[11px] text-white/45">Hold fire to spray; don’t overheat.</div>
              </div>
            </div>
          </aside>
        </div>

        {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80">
      {children}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
      {children}
    </span>
  );
}

function HudPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border bg-black/30 px-3 py-2 ${
        accent ? "border-cyan-400/20" : "border-white/10"
      }`}
    >
      <div className="text-[10px] text-white/60">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${accent ? "text-cyan-200" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="text-[11px] text-white/55">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#0A0F1F]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] text-white/55">{label}</div>
        <button
          onClick={onToggle}
          className={`h-8 w-14 rounded-full border transition-colors ${
            value ? "border-cyan-400/30 bg-cyan-400/20" : "border-white/10 bg-white/5"
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

function MobileBtn({
  label,
  onDown,
  onUp,
}: {
  label: string;
  onDown: () => void;
  onUp: () => void;
}) {
  return (
    <button
      className="pointer-events-auto select-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs font-semibold text-white/85 active:scale-[0.98]"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}

function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-[720px] rounded-3xl border border-white/10 bg-[#0A0F1F]/95 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">How to play</div>
            <div className="mt-1 text-xs text-white/60">
              Hold Space to fire. Keep your combo to ramp the multiplier.
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
          <Card title="Move">A/D or Arrow Keys</Card>
          <Card title="Fire">Hold Space</Card>
          <Card title="Pause">Esc</Card>
          <Card title="Reset">R (from menu / gameover)</Card>
        </div>

        <div className="mt-4 text-xs text-white/50">
          Pure frontend: high score + settings stored locally on this device.
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs font-semibold text-white/80">{title}</div>
      <div className="mt-2 text-xs text-white/65">{children}</div>
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, s: State) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = canvas.width / rect.width;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = rect.width;
  const H = rect.height;

  // map world -> screen
  const scale = Math.min(W / s.w, H / s.h);
  const ox = (W - s.w * scale) / 2;
  const oy = (H - s.h * scale) / 2;

  const shake = s.shake;
  const sx = (Math.random() - 0.5) * 10 * shake;
  const sy = (Math.random() - 0.5) * 10 * shake;

  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.translate(ox + sx, oy + sy);
  ctx.scale(scale, scale);

  // background
  const bg = ctx.createLinearGradient(0, 0, 0, s.h);
  bg.addColorStop(0, "#070A1A");
  bg.addColorStop(1, "#050614");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s.w, s.h);

  // stars
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "white";
  for (let i = 0; i < 90; i++) {
    const x = ((i * 97) % 1000) / 1000;
    const y = ((i * 233) % 1000) / 1000;
    ctx.fillRect(x * s.w, y * s.h, 2, 2);
  }
  ctx.globalAlpha = 1;

  // frame
  ctx.strokeStyle = "rgba(34,211,238,0.16)";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, s.w - 28, s.h - 28);

  // shields
  for (const sh of s.shields) {
    const cellW = 4;
    const cellH = 4;
    const left = sh.x - (s.shieldCols * cellW) / 2;
    const top = sh.y - (s.shieldRows * cellH) / 2;
    for (let rr = 0; rr < s.shieldRows; rr++) {
      for (let cc = 0; cc < s.shieldCols; cc++) {
        const cell = sh.grid[rr * s.shieldCols + cc];
        if (!cell || cell.hp <= 0) continue;
        ctx.fillStyle = cell.hp === 2 ? "rgba(147,197,253,0.95)" : "rgba(147,197,253,0.55)";
        ctx.fillRect(left + cc * cellW, top + rr * cellH, cellW, cellH);
      }
    }
  }

  // invaders
  for (const v of s.invaders) {
    if (!v.alive) continue;
    const c = v.kind === 2 ? "#22d3ee" : v.kind === 1 ? "#a78bfa" : "#34d399";
    // body
    ctx.fillStyle = c;
    roundRect(ctx, v.x - v.w / 2, v.y - v.h / 2, v.w, v.h, 6);
    ctx.fill();
    // eye glow
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(v.x - 9, v.y - 3, 4, 4);
    ctx.fillRect(v.x + 5, v.y - 3, 4, 4);

    // hp hint
    if (v.hp > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.40)";
      ctx.lineWidth = 2;
      ctx.strokeRect(v.x - v.w / 2 + 2, v.y - v.h / 2 + 2, v.w - 4, v.h - 4);
    }

    // glow
    const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, 56);
    g.addColorStop(0, hexToRgba(c, 0.20));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(v.x, v.y, 56, 0, Math.PI * 2);
    ctx.fill();
  }

  // player ship
  const shipW = 44;
  const shipH = 18;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  roundRect(ctx, s.px - shipW / 2, s.py - shipH / 2, shipW, shipH, 8);
  ctx.fill();
  ctx.fillStyle = "rgba(34,211,238,0.85)";
  ctx.fillRect(s.px - 10, s.py - 14, 20, 8);

  // bullets
  for (const b of s.bullets) {
    ctx.fillStyle = b.from === "player" ? "rgba(34,211,238,0.95)" : "rgba(251,113,133,0.95)";
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // particles
  for (const p of s.particles) {
    const a = clamp(p.life / p.max, 0, 1);
    ctx.fillStyle = p.c;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // overlay text
  if (s.phase !== "playing") {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "700 18px var(--font-geist-sans), ui-sans-serif";
    const msg =
      s.phase === "menu"
        ? "PRESS SPACE TO START"
        : s.phase === "paused"
          ? "PAUSED (ESC)"
          : s.phase === "wave_clear"
            ? `WAVE ${s.wave} CLEAR!`
            : s.phase === "gameover"
              ? "GAME OVER — PRESS SPACE"
              : "";
    ctx.fillText(msg, s.w / 2, s.h / 2);

    ctx.font = "500 12px var(--font-geist-mono), ui-monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("Move: A/D • Fire: Space • Pause: Esc • Reset: R", s.w / 2, s.h / 2 + 24);
  }

  ctx.restore();

  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
