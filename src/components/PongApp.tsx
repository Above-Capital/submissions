"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createInitialPong, resetMatch, tickPong, type PongSettings, type PongState } from "../lib/pong";
import { createSfx } from "../lib/sfx";
import { lsGet, lsSet } from "../lib/storage";

const LS_KEY = "neonpong:v1";

type Persist = {
  settings: PongSettings;
  bestWinMargin: number;
};

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export default function PongApp() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [s, setS] = useState<PongState>(() => {
    const st = createInitialPong();
    const p = lsGet<Persist>(LS_KEY, { settings: st.settings, bestWinMargin: 0 });
    st.settings = p.settings;
    st.stats.bestWinMargin = p.bestWinMargin;
    resetMatch(st);
    return st;
  });
  const sRef = useRef(s);
  useEffect(() => {
    sRef.current = s;
  }, [s]);

  const inputRef = useRef({
    leftAxis: 0,
    rightAxis: 0,
    pausePressed: false,
    servePressed: false,
  });

  const [helpOpen, setHelpOpen] = useState(false);

  // sfx
  const sfxRef = useRef<ReturnType<typeof createSfx> | null>(null);
  useEffect(() => {
    sfxRef.current = createSfx(() => sRef.current.settings.sound);
  }, []);

  useEffect(() => {
    lsSet<Persist>(LS_KEY, {
      settings: s.settings,
      bestWinMargin: s.stats.bestWinMargin,
    });
  }, [s.settings, s.stats.bestWinMargin]);

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

  // controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w") inputRef.current.leftAxis = -1;
      if (k === "s") inputRef.current.leftAxis = 1;
      if (k === "arrowup") inputRef.current.rightAxis = -1;
      if (k === "arrowdown") inputRef.current.rightAxis = 1;
      if (k === "escape") inputRef.current.pausePressed = true;
      if (k === " " || e.code === "Space" || k === "enter") inputRef.current.servePressed = true;
      if (k === "h") setHelpOpen((v) => !v);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "w" || k === "s") inputRef.current.leftAxis = 0;
      if (k === "arrowup" || k === "arrowdown") inputRef.current.rightAxis = 0;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // pointer -> left paddle (and right in local mode on right half)
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const onMove = (e: PointerEvent) => {
      const rect = c.getBoundingClientRect();
      const ny = (e.clientY - rect.top) / rect.height;
      const targetY = clamp(ny, 0, 1);
      const desired = (targetY - 0.5) * 2;
      // this axis is velocity-like; use desired sign only for simplicity
      inputRef.current.leftAxis = clamp(desired * 1.4, -1, 1);

      if (sRef.current.settings.mode === "local") {
        const nx = (e.clientX - rect.left) / rect.width;
        if (nx > 0.52) inputRef.current.rightAxis = clamp(desired * 1.4, -1, 1);
      }
    };
    c.addEventListener("pointermove", onMove);
    return () => c.removeEventListener("pointermove", onMove);
  }, []);

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
          const next = structuredClone(prev) as PongState;
          for (let i = 0; i < frames; i++) {
            tickPong(next, inputRef.current, step);
            inputRef.current.pausePressed = false;
            inputRef.current.servePressed = false;
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

  // play sfx on goals
  const lastScoresRef = useRef({ l: s.leftScore, r: s.rightScore, phase: s.phase });
  useEffect(() => {
    const last = lastScoresRef.current;
    if (s.phase === "goal" && last.phase !== "goal") sfxRef.current?.goal();
    if (s.phase === "playing" && last.phase === "goal") sfxRef.current?.ping();
    if (s.leftScore !== last.l || s.rightScore !== last.r) sfxRef.current?.goal();
    lastScoresRef.current = { l: s.leftScore, r: s.rightScore, phase: s.phase };
  }, [s.leftScore, s.rightScore, s.phase]);

  const title = useMemo(() => {
    if (s.phase === "menu") return "Press Space / Enter to Serve";
    if (s.phase === "paused") return "Paused";
    if (s.phase === "goal") return "Goal! Space to Continue";
    if (s.phase === "gameover") return "Match Over — Space to Rematch";
    return "";
  }, [s.phase]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1100px] px-4 py-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 via-cyan-400 to-emerald-400 shadow-[0_0_40px_rgba(34,211,238,0.25)]" />
            <div>
              <div className="text-lg font-semibold tracking-tight">NEON PONG</div>
              <div className="text-xs text-white/60">
                vs AI or local 2P • responsive canvas • pure frontend
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
            <div className="relative aspect-[16/10] w-full">
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />
              <div className="pointer-events-none absolute inset-x-0 top-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[10px] text-white/60">Left</div>
                    <div className="text-sm font-semibold tabular-nums">{s.leftScore}</div>
                  </div>
                  <div className="text-xs text-white/70">{title}</div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="text-[10px] text-white/60">Right</div>
                    <div className="text-sm font-semibold tabular-nums">{s.rightScore}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-white/70">
              <div className="flex flex-wrap items-center gap-2">
                <Pill>Left: W / S</Pill>
                <Pill>Right: ↑ / ↓ (local)</Pill>
                <Pill>Serve: Space / Enter</Pill>
                <Pill>Pause: Esc</Pill>
              </div>
              <div className="text-[11px] text-white/45">
                Tip: aim for the paddle edge to add curve.
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white/90">Settings</div>
            <div className="mt-3 grid gap-3">
              <SelectRow
                label="Mode"
                value={s.settings.mode}
                options={[
                  { value: "ai", label: "Vs AI" },
                  { value: "local", label: "Local 2P" },
                ]}
                onChange={(v) => setS((prev) => {
                  const n = structuredClone(prev) as PongState;
                  n.settings.mode = v as PongSettings["mode"];
                  resetMatch(n);
                  return n;
                })}
              />

              <SliderRow
                label="Difficulty"
                hint="(AI only)"
                value={s.settings.difficulty}
                disabled={s.settings.mode !== "ai"}
                onChange={(v) => setS((prev) => {
                  const n = structuredClone(prev) as PongState;
                  n.settings.difficulty = v;
                  return n;
                })}
              />

              <SelectRow
                label="Target score"
                value={String(s.settings.targetScore)}
                options={["3", "5", "7", "9", "11"].map((v) => ({ value: v, label: v }))}
                onChange={(v) => setS((prev) => {
                  const n = structuredClone(prev) as PongState;
                  n.settings.targetScore = parseInt(v, 10);
                  resetMatch(n);
                  return n;
                })}
              />

              <ToggleRow
                label="Sound"
                value={s.settings.sound}
                onToggle={() => {
                  setS((prev) => {
                    const n = structuredClone(prev) as PongState;
                    n.settings.sound = !n.settings.sound;
                    return n;
                  });
                  sfxRef.current?.toggle();
                }}
              />

              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="text-[11px] text-white/55">Record</div>
                <div className="mt-1 text-sm font-semibold text-white/85 tabular-nums">
                  Best win margin: {s.stats.bestWinMargin}
                </div>
              </div>

              <button
                onClick={() => setS((prev) => {
                  const n = structuredClone(prev) as PongState;
                  resetMatch(n);
                  return n;
                })}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
              >
                Reset match
              </button>
            </div>
          </aside>
        </div>

        {helpOpen && <Help onClose={() => setHelpOpen(false)} />}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/70">
      {children}
    </span>
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

function SliderRow({
  label,
  hint,
  value,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-black/20 p-3 ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] text-white/55">
          {label} {hint ? <span className="text-white/35">{hint}</span> : null}
        </div>
        <div className="text-[11px] text-white/45 tabular-nums">{Math.round(value * 100)}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-2 w-full"
      />
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
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

function Help({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="w-full max-w-[720px] rounded-3xl border border-white/10 bg-[#0A0F1F]/95 p-5 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white/90">How to play</div>
            <div className="mt-1 text-xs text-white/60">
              Fast, clean Pong with a bit of neon swagger.
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
            <div className="text-xs font-semibold text-white/80">Serve</div>
            <div className="mt-2 text-xs text-white/65">
              Press <span className="text-white">Space</span> or <span className="text-white">Enter</span>.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Controls</div>
            <div className="mt-2 text-xs text-white/65">
              Left paddle: <span className="text-white">W/S</span>. Right paddle: <span className="text-white">↑/↓</span> (local mode).
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Spin</div>
            <div className="mt-2 text-xs text-white/65">
              Hit near paddle edges to change the return angle.
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold text-white/80">Pause</div>
            <div className="mt-2 text-xs text-white/65">
              Press <span className="text-white">Esc</span> anytime.
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-white/50">
          Pure frontend: settings + record stored in localStorage.
        </div>
      </div>
    </div>
  );
}

function draw(canvas: HTMLCanvasElement | null, s: PongState) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const dpr = canvas.width / rect.width;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;

  ctx.clearRect(0, 0, w, h);

  // map world (960x540) into rect preserving aspect
  const scale = Math.min(w / s.w, h / s.h);
  const ox = (w - s.w * scale) / 2;
  const oy = (h - s.h * scale) / 2;

  const shake = s.shake;
  const sx = (Math.random() - 0.5) * 10 * shake;
  const sy = (Math.random() - 0.5) * 10 * shake;

  ctx.save();
  ctx.translate(ox + sx, oy + sy);
  ctx.scale(scale, scale);

  // bg
  const bg = ctx.createLinearGradient(0, 0, 0, s.h);
  bg.addColorStop(0, "#070A1A");
  bg.addColorStop(1, "#050614");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s.w, s.h);

  // glow frame
  ctx.strokeStyle = "rgba(34,211,238,0.18)";
  ctx.lineWidth = 6;
  ctx.strokeRect(14, 14, s.w - 28, s.h - 28);

  // mid line
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = "rgba(255,255,255,0.20)";
  ctx.setLineDash([10, 12]);
  ctx.beginPath();
  ctx.moveTo(s.w / 2, 20);
  ctx.lineTo(s.w / 2, s.h - 20);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // paddles
  const leftX = 38;
  const rightX = s.w - 38;

  drawPaddle(ctx, leftX, s.leftY, s.paddleW, s.paddleH, "#22d3ee");
  drawPaddle(ctx, rightX, s.rightY, s.paddleW, s.paddleH, "#f472b6");

  // ball
  const g = ctx.createRadialGradient(s.ballX, s.ballY, 0, s.ballX, s.ballY, 26);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.4, "rgba(34,211,238,0.35)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(s.ballX, s.ballY, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.arc(s.ballX, s.ballY, s.ballR, 0, Math.PI * 2);
  ctx.fill();

  // score in-world
  ctx.font = "700 40px var(--font-geist-mono), ui-monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText(String(s.leftScore), s.w / 2 - 70, 70);
  ctx.fillText(String(s.rightScore), s.w / 2 + 70, 70);

  if (s.phase !== "playing") {
    ctx.font = "600 16px var(--font-geist-sans), ui-sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.textAlign = "center";
    const msg =
      s.phase === "menu"
        ? "SPACE / ENTER to serve"
        : s.phase === "paused"
          ? "PAUSED (ESC to resume)"
          : s.phase === "goal"
            ? "GOAL! SPACE to continue"
            : s.phase === "gameover"
              ? `WINNER: ${s.winner?.toUpperCase()} — SPACE to rematch`
              : "";
    ctx.fillText(msg, s.w / 2, s.h / 2);
  }

  ctx.restore();

  // vignette
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

function drawPaddle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string
) {
  const r = 10;
  const x0 = x - w / 2;
  const y0 = y - h / 2;

  const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0.75)");

  ctx.fillStyle = g;
  roundRect(ctx, x0, y0, w, h, r);
  ctx.fill();

  // glow
  const glow = ctx.createRadialGradient(x, y, 0, x, y, 80);
  glow.addColorStop(0, hexToRgba(color, 0.18));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, 80, 0, Math.PI * 2);
  ctx.fill();
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
