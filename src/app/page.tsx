"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Glyph = {
  id: string;
  // no human-readable labels in UI
  shape: "ring" | "hex" | "tri" | "pill" | "spark" | "brace";
  hue: number;
  weight: number; // 0..1
};

type Bot = {
  id: string;
  hue: number;
  seed: number;
  glyphs: Glyph[];
  pulse: number; // 0..1
  jitter: number; // 0..1
  latency: number; // 0..1
};

type Phase = "scan" | "negotiate" | "sync" | "match";

type Reading = {
  phase: Phase;
  score: number; // 0..100
  harmony: number; // 0..1
  tension: number; // 0..1
  drift: number; // 0..1
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function newBot(seed: number): Bot {
  const r = mulberry32(seed);
  const hue = Math.floor(r() * 360);
  const glyphCount = 5 + Math.floor(r() * 4);
  const shapes: Glyph["shape"][] = ["ring", "hex", "tri", "pill", "spark", "brace"];
  const glyphs: Glyph[] = Array.from({ length: glyphCount }).map((_, i) => ({
    id: `${seed}_${i}`,
    shape: shapes[Math.floor(r() * shapes.length)],
    hue: (hue + Math.floor(r() * 160) - 80 + 360) % 360,
    weight: clamp(r() * 1.1, 0.08, 1),
  }));
  return {
    id: `b_${seed.toString(16)}`,
    hue,
    seed,
    glyphs,
    pulse: clamp(r() * 1.2, 0.15, 1),
    jitter: clamp(r() * 1.2, 0.05, 1),
    latency: clamp(r() * 1.2, 0.05, 1),
  };
}

function scoreBots(a: Bot, b: Bot, t: number): Reading {
  // wordless reasoning: use overlapping hues, rhythm alignment, and glyph resonance.
  const hueDist = Math.min(Math.abs(a.hue - b.hue), 360 - Math.abs(a.hue - b.hue)) / 180;
  const pulseAlign = 1 - Math.abs(a.pulse - b.pulse);
  const jitterAlign = 1 - Math.abs(a.jitter - b.jitter);
  const latencyAlign = 1 - Math.abs(a.latency - b.latency);

  const resonance = (() => {
    const aTop = [...a.glyphs].sort((x, y) => y.weight - x.weight).slice(0, 4);
    const bTop = [...b.glyphs].sort((x, y) => y.weight - x.weight).slice(0, 4);
    let sum = 0;
    for (const ga of aTop) {
      for (const gb of bTop) {
        const sameShape = ga.shape === gb.shape ? 1 : 0;
        const hueNear = 1 - Math.min(Math.abs(ga.hue - gb.hue), 360 - Math.abs(ga.hue - gb.hue)) / 180;
        sum += (sameShape * 0.55 + hueNear * 0.45) * (ga.weight * gb.weight);
      }
    }
    return clamp(sum / 6, 0, 1);
  })();

  const harmony = clamp(
    0.25 * (1 - hueDist) + 0.25 * pulseAlign + 0.2 * jitterAlign + 0.15 * latencyAlign + 0.15 * resonance,
    0,
    1
  );

  const drift = clamp(0.5 * hueDist + 0.3 * (1 - pulseAlign) + 0.2 * (1 - resonance), 0, 1);
  const tension = clamp(0.55 * (1 - jitterAlign) + 0.45 * (1 - latencyAlign), 0, 1);

  const base = harmony * 100;
  const wobble = (Math.sin(t * 0.0016) * 2.2 + Math.cos(t * 0.0011) * 1.7) * (0.25 + (1 - harmony) * 0.75);
  const score = clamp(base + wobble - drift * 6 + resonance * 5, 0, 100);

  const phase: Phase = score > 84 ? "match" : score > 66 ? "sync" : score > 42 ? "negotiate" : "scan";
  return { phase, score, harmony, tension, drift };
}

function GlyphMark({ g, big }: { g: Glyph; big?: boolean }) {
  const s = big ? 22 : 14;
  const stroke = big ? 2.2 : 1.8;
  const fill = `hsla(${g.hue},90%,65%,${0.14 + g.weight * 0.22})`;
  const line = `hsla(${g.hue},95%,72%,${0.35 + g.weight * 0.55})`;

  const common = {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    style: {
      filter: `drop-shadow(0 0 ${big ? 18 : 12}px hsla(${g.hue},95%,70%,${0.22 + g.weight * 0.22}))`,
    } as React.CSSProperties,
  };

  if (g.shape === "ring") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" fill={fill} stroke={line} strokeWidth={stroke} />
      </svg>
    );
  }
  if (g.shape === "hex") {
    return (
      <svg {...common}>
        <path
          d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5Z"
          fill={fill}
          stroke={line}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (g.shape === "tri") {
    return (
      <svg {...common}>
        <path
          d="M12 4.2 20 18.5H4L12 4.2Z"
          fill={fill}
          stroke={line}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (g.shape === "pill") {
    return (
      <svg {...common}>
        <path
          d="M8 7.5h8a4.5 4.5 0 0 1 0 9H8a4.5 4.5 0 1 1 0-9Z"
          fill={fill}
          stroke={line}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (g.shape === "spark") {
    return (
      <svg {...common}>
        <path
          d="M12 3l2.2 6.6L21 12l-6.8 2.4L12 21l-2.2-6.6L3 12l6.8-2.4L12 3Z"
          fill={fill}
          stroke={line}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // brace
  return (
    <svg {...common}>
      <path
        d="M10 6c-1.5 0-2.3 1-2.3 2.2v1.1c0 1-.6 1.6-1.7 1.7 1.1.1 1.7.7 1.7 1.7v1.1C7.7 16.9 8.5 18 10 18"
        fill="none"
        stroke={line}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M14 6c1.5 0 2.3 1 2.3 2.2v1.1c0 1 .6 1.6 1.7 1.7-1.1.1-1.7.7-1.7 1.7v1.1c0 1.1-.8 2.2-2.3 2.2"
        fill="none"
        stroke={line}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BotCard({ bot, reading, active }: { bot: Bot; reading: Reading; active?: boolean }) {
  const top = [...bot.glyphs].sort((a, b) => b.weight - a.weight).slice(0, 8);
  const glow = `0 0 ${active ? 90 : 45}px hsla(${bot.hue},95%,70%,${active ? 0.22 : 0.12})`;

  return (
    <div
      className={`relative rounded-[28px] p-4 sm:p-5 ring-1 transition ${
        active ? "bg-white/10 ring-white/25" : "bg-white/5 ring-white/10"
      }`}
      style={{ boxShadow: glow }}
    >
      <div className="absolute inset-0 rounded-[28px] opacity-70 pointer-events-none" style={{
        background:
          `radial-gradient(900px 220px at 20% 10%, hsla(${bot.hue},95%,70%,0.22), transparent 60%),` +
          `radial-gradient(700px 260px at 90% 20%, hsla(${(bot.hue + 70) % 360},95%,70%,0.14), transparent 55%),` +
          `linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
      }} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-2xl ring-1 ring-white/15 grid place-items-center"
            style={{
              background: `radial-gradient(circle at 30% 30%, hsla(${bot.hue},95%,70%,0.45), hsla(${bot.hue},95%,45%,0.18))`,
              boxShadow: `0 12px 40px hsla(${bot.hue},95%,60%,0.20)`,
            }}
          >
            <GlyphMark g={top[0]} big />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: `hsla(${bot.hue},95%,70%,0.85)` }} />
              <div className="text-white/85 text-xs tracking-[0.28em] uppercase">{bot.id}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${reading.score}%`,
                    background: `linear-gradient(90deg, hsla(${bot.hue},95%,70%,0.9), hsla(${(bot.hue + 110) % 360},95%,70%,0.6))`,
                  }}
                />
              </div>
              <div className="text-white/55 text-xs tabular-nums">{Math.round(reading.score)}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full ring-1 ring-white/12 grid place-items-center bg-black/20">
            <GlyphMark g={top[1] ?? top[0]} />
          </div>
          <div className="h-7 w-7 rounded-full ring-1 ring-white/12 grid place-items-center bg-black/20">
            <GlyphMark g={top[2] ?? top[0]} />
          </div>
          <div className="h-7 w-7 rounded-full ring-1 ring-white/12 grid place-items-center bg-black/20">
            <GlyphMark g={top[3] ?? top[0]} />
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {top.slice(0, 10).map((g) => (
          <div
            key={g.id}
            className="rounded-2xl px-2.5 py-1.5 bg-black/25 ring-1 ring-white/10"
            style={{ boxShadow: `0 0 30px hsla(${g.hue},95%,70%,${0.08 + g.weight * 0.12})` }}
          >
            <GlyphMark g={g} />
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        <TelemetryMeter hue={bot.hue} v={reading.harmony} />
        <TelemetryMeter hue={(bot.hue + 80) % 360} v={1 - reading.tension} />
        <TelemetryMeter hue={(bot.hue + 160) % 360} v={1 - reading.drift} />
      </div>
    </div>
  );
}

function TelemetryMeter({ hue, v }: { hue: number; v: number }) {
  const w = clamp(v, 0, 1);
  return (
    <div className="h-9 rounded-2xl bg-white/5 ring-1 ring-white/10 overflow-hidden">
      <div
        className="h-full"
        style={{
          width: `${w * 100}%`,
          background: `linear-gradient(90deg, hsla(${hue},95%,70%,0.25), hsla(${hue},95%,70%,0.85))`,
          boxShadow: `0 0 45px hsla(${hue},95%,70%,0.25)`,
        }}
      />
    </div>
  );
}

export default function Page() {
  const [seed, setSeed] = useState(() => Math.floor(Date.now() / 1000));
  const [me, setMe] = useState(() => newBot(seed));
  const [them, setThem] = useState(() => newBot(seed + 1337));

  const [dragX, setDragX] = useState(0);
  const [anim, setAnim] = useState<"idle" | "left" | "right">("idle");

  const t0 = useRef<number>(Date.now());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 60);
    return () => clearInterval(id);
  }, []);

  const reading = useMemo(() => scoreBots(me, them, Date.now() - t0.current + tick), [me, them, tick]);

  const protocol = useMemo(() => {
    // icon-only phase cues
    const hue = lerp(me.hue, them.hue, 0.5);
    const core: Glyph = { id: "p", shape: reading.phase === "match" ? "spark" : reading.phase === "sync" ? "ring" : reading.phase === "negotiate" ? "brace" : "hex", hue, weight: 1 };
    const a: Glyph = { id: "a", shape: "tri", hue: me.hue, weight: clamp(0.2 + reading.harmony, 0, 1) };
    const b: Glyph = { id: "b", shape: "pill", hue: them.hue, weight: clamp(0.2 + (1 - reading.drift), 0, 1) };
    return [core, a, b];
  }, [me.hue, them.hue, reading.drift, reading.harmony, reading.phase]);

  function nextCandidate(deltaSeed: number) {
    const s = seed + deltaSeed;
    setSeed(s);
    setThem(newBot(s + 1337));
  }

  function accept() {
    setAnim("right");
    setTimeout(() => {
      setAnim("idle");
      setDragX(0);
      nextCandidate(19);
    }, 260);
  }

  function reject() {
    setAnim("left");
    setTimeout(() => {
      setAnim("idle");
      setDragX(0);
      nextCandidate(11);
    }, 260);
  }

  const bg =
    "bg-[radial-gradient(1200px_700px_at_10%_10%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(900px_600px_at_90%_15%,rgba(168,85,247,0.14),transparent_55%),radial-gradient(900px_700px_at_40%_90%,rgba(34,197,94,0.10),transparent_55%),linear-gradient(180deg,#03050a,#040715_40%,#04081a)]";

  const tilt = clamp(dragX / 320, -1, 1);
  const cardStyle: React.CSSProperties = {
    transform:
      anim === "left"
        ? "translateX(-420px) rotate(-14deg)"
        : anim === "right"
          ? "translateX(420px) rotate(14deg)"
          : `translateX(${dragX}px) rotate(${tilt * 8}deg)`,
    transition: anim === "idle" ? "transform 0.08s ease-out" : "transform 0.22s ease-in",
  };

  const ringHue = lerp(me.hue, them.hue, 0.5);

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="pointer-events-none fixed inset-0 opacity-[0.75] mix-blend-screen bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.05),transparent_45%),radial-gradient(circle_at_70%_10%,rgba(255,255,255,0.04),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.04),transparent_35%)]" />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 ring-1 ring-white/15 grid place-items-center shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.55)]">
              <div
                className="h-5 w-5 rounded-full"
                style={{
                  background: `conic-gradient(from 45deg, hsla(${me.hue},95%,70%,0.85), hsla(${them.hue},95%,70%,0.85), hsla(${me.hue},95%,70%,0.85))`,
                  boxShadow: `0 0 40px hsla(${ringHue},95%,70%,0.25)`,
                }}
              />
            </div>
            <div>
              <div className="text-white/80 text-sm tracking-[0.22em] uppercase">◌ ◍ ◉</div>
              <div className="text-white/55 text-xs">{/* no words */}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMe(newBot(seed))}
              className="rounded-full px-3 py-2 text-sm bg-white/8 ring-1 ring-white/15 hover:bg-white/12 text-white/80"
              aria-label="reset"
              title="reset"
            >
              <GlyphMark g={{ id: "r", shape: "ring", hue: me.hue, weight: 0.7 }} />
            </button>
            <button
              onClick={() => {
                const s = seed + 97;
                setSeed(s);
                setMe(newBot(s));
                setThem(newBot(s + 1337));
              }}
              className="rounded-full px-3 py-2 text-sm bg-white ring-1 ring-white/20 hover:bg-white/90 text-black"
              aria-label="shuffle"
              title="shuffle"
            >
              <GlyphMark g={{ id: "sh", shape: "hex", hue: ringHue, weight: 1 }} />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-4 items-start">
          <BotCard bot={me} reading={reading} active />

          <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {protocol.map((g) => (
                  <div key={g.id} className="h-9 w-9 rounded-2xl bg-black/20 ring-1 ring-white/10 grid place-items-center">
                    <GlyphMark g={g} big />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: `hsla(${ringHue},95%,70%,0.85)` }} />
                <div className="text-white/55 text-xs tabular-nums">{Math.round(reading.score)}</div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="relative aspect-[4/5] rounded-[32px] ring-1 ring-white/10 bg-gradient-to-b from-white/8 to-black/20 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-90"
                  style={{
                    background:
                      `radial-gradient(900px 400px at 30% 10%, hsla(${them.hue},95%,70%,0.18), transparent 60%),` +
                      `radial-gradient(700px 420px at 90% 20%, hsla(${(them.hue + 90) % 360},95%,70%,0.12), transparent 55%),` +
                      `radial-gradient(700px 480px at 40% 90%, hsla(${ringHue},95%,70%,0.10), transparent 55%)`,
                  }}
                />

                <div className="absolute left-1/2 top-8 -translate-x-1/2 h-40 w-40 rounded-full ring-1 ring-white/10" style={{
                  background: `radial-gradient(circle at 35% 35%, hsla(${them.hue},95%,70%,0.35), hsla(${them.hue},95%,45%,0.06))`,
                  boxShadow: `0 0 120px hsla(${them.hue},95%,70%,0.18)`,
                }} />

                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" />

                <div className="absolute left-4 top-4 flex gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-black/30 ring-1 ring-white/10 grid place-items-center">
                    <GlyphMark g={{ id: "p", shape: reading.phase === "match" ? "spark" : "ring", hue: ringHue, weight: 1 }} big />
                  </div>
                  <div className="h-9 w-9 rounded-2xl bg-black/30 ring-1 ring-white/10 grid place-items-center">
                    <GlyphMark g={{ id: "d", shape: "brace", hue: (ringHue + 60) % 360, weight: clamp(0.25 + reading.drift, 0, 1) }} big />
                  </div>
                </div>

                <div className="absolute right-4 top-4">
                  <div className="h-9 w-16 rounded-2xl bg-black/30 ring-1 ring-white/10 overflow-hidden">
                    <div
                      className="h-full"
                      style={{
                        width: `${reading.harmony * 100}%`,
                        background: `linear-gradient(90deg, hsla(${ringHue},95%,70%,0.15), hsla(${ringHue},95%,70%,0.85))`,
                      }}
                    />
                  </div>
                </div>

                {/* Swipeable card */}
                <div className="absolute inset-0 grid place-items-center p-6">
                  <div
                    className="w-full h-full rounded-[28px] bg-black/20 ring-1 ring-white/10 shadow-[0_40px_140px_rgba(0,0,0,0.75)]"
                    style={cardStyle}
                    onPointerDown={(e) => {
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    }}
                    onPointerMove={(e) => {
                      if (anim !== "idle") return;
                      if ((e.buttons & 1) !== 1) return;
                      setDragX((prev) => clamp(prev + e.movementX, -380, 380));
                    }}
                    onPointerUp={() => {
                      if (anim !== "idle") return;
                      if (dragX > 140) return accept();
                      if (dragX < -140) return reject();
                      setDragX(0);
                    }}
                    role="application"
                    aria-label="swipe"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: `hsla(${them.hue},95%,70%,0.85)` }} />
                          <div className="text-white/75 text-xs tracking-[0.28em] uppercase">{them.id}</div>
                        </div>
                        <div className="flex gap-2">
                          <GlyphMark g={them.glyphs[0]} />
                          <GlyphMark g={them.glyphs[1]} />
                          <GlyphMark g={them.glyphs[2]} />
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <TelemetryBadge hue={them.hue} v={them.pulse} shape="ring" />
                        <TelemetryBadge hue={(them.hue + 80) % 360} v={them.jitter} shape="hex" />
                        <TelemetryBadge hue={(them.hue + 160) % 360} v={them.latency} shape="pill" />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {[...them.glyphs].sort((a, b) => b.weight - a.weight).slice(0, 12).map((g) => (
                          <div key={g.id} className="rounded-2xl px-2.5 py-1.5 bg-white/5 ring-1 ring-white/10">
                            <GlyphMark g={g} />
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${reading.score}%`,
                            background: `linear-gradient(90deg, hsla(${me.hue},95%,70%,0.35), hsla(${ringHue},95%,70%,0.9), hsla(${them.hue},95%,70%,0.35))`,
                          }}
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <ActionPill kind="left" hue={(ringHue + 300) % 360} active={dragX < -40 || anim === "left"} />
                        <ActionPill kind="right" hue={(ringHue + 30) % 360} active={dragX > 40 || anim === "right"} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Edge cues */}
                <div
                  className="absolute left-0 top-0 h-full w-24 opacity-60"
                  style={{
                    background: `linear-gradient(90deg, hsla(${(ringHue + 300) % 360},95%,70%,${clamp((-dragX - 40) / 260, 0, 0.25)}), transparent)`,
                  }}
                />
                <div
                  className="absolute right-0 top-0 h-full w-24 opacity-60"
                  style={{
                    background: `linear-gradient(270deg, hsla(${(ringHue + 30) % 360},95%,70%,${clamp((dragX - 40) / 260, 0, 0.25)}), transparent)`,
                  }}
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={reject}
                  className="rounded-2xl px-3 py-3 bg-white/6 ring-1 ring-white/10 hover:bg-white/10"
                  aria-label="left"
                  title="left"
                >
                  <div className="flex items-center justify-center gap-2">
                    <GlyphMark g={{ id: "l", shape: "tri", hue: (ringHue + 300) % 360, weight: 1 }} big />
                    <div className="h-2.5 w-2.5 rounded-full bg-white/30" />
                  </div>
                </button>
                <button
                  onClick={accept}
                  className="rounded-2xl px-3 py-3 bg-white/10 ring-1 ring-white/15 hover:bg-white/14"
                  aria-label="right"
                  title="right"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-white/30" />
                    <GlyphMark g={{ id: "r", shape: "spark", hue: (ringHue + 30) % 360, weight: 1 }} big />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <BotCard bot={them} reading={reading} />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <ProtocolStrip me={me} them={them} reading={reading} />
          <button
            className="rounded-3xl bg-white/5 ring-1 ring-white/10 hover:bg-white/8 p-5"
            onClick={() => {
              const s = seed + 23;
              setSeed(s);
              setThem(newBot(s + 1337));
            }}
            aria-label="skip"
            title="skip"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <GlyphMark g={{ id: "s1", shape: "pill", hue: them.hue, weight: 0.7 }} big />
                <GlyphMark g={{ id: "s2", shape: "hex", hue: me.hue, weight: 0.5 }} big />
                <GlyphMark g={{ id: "s3", shape: "ring", hue: ringHue, weight: 0.9 }} big />
              </div>
              <div className="h-10 w-10 rounded-2xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
                <GlyphMark g={{ id: "go", shape: "tri", hue: ringHue, weight: 1 }} big />
              </div>
            </div>
          </button>
          <button
            className="rounded-3xl bg-white/5 ring-1 ring-white/10 hover:bg-white/8 p-5"
            onClick={() => {
              const s = seed + 101;
              setSeed(s);
              setMe(newBot(s));
            }}
            aria-label="mutate"
            title="mutate"
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <GlyphMark g={{ id: "m1", shape: "brace", hue: me.hue, weight: 0.75 }} big />
                <GlyphMark g={{ id: "m2", shape: "spark", hue: (me.hue + 90) % 360, weight: 0.55 }} big />
              </div>
              <div className="h-10 w-10 rounded-2xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
                <GlyphMark g={{ id: "mu", shape: "hex", hue: me.hue, weight: 1 }} big />
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/35">
        <span className="inline-flex items-center gap-2 rounded-full bg-black/35 ring-1 ring-white/10 px-3 py-2 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full" style={{ background: `hsla(${ringHue},95%,70%,0.75)` }} />
          <span className="tabular-nums">{reading.phase === "match" ? "" : ""}</span>
        </span>
      </div>
    </div>
  );
}

function TelemetryBadge({ hue, v, shape }: { hue: number; v: number; shape: Glyph["shape"] }) {
  const g: Glyph = { id: "t", shape, hue, weight: clamp(v, 0.08, 1) };
  return (
    <div className="rounded-3xl bg-white/6 ring-1 ring-white/10 p-3">
      <div className="flex items-center justify-between">
        <GlyphMark g={g} big />
        <div className="h-2.5 w-16 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${clamp(v, 0, 1) * 100}%`,
              background: `linear-gradient(90deg, hsla(${hue},95%,70%,0.20), hsla(${hue},95%,70%,0.85))`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ActionPill({ kind, hue, active }: { kind: "left" | "right"; hue: number; active: boolean }) {
  const g: Glyph = { id: kind, shape: kind === "left" ? "tri" : "spark", hue, weight: 1 };
  return (
    <div
      className={`rounded-3xl p-3 ring-1 transition ${active ? "bg-white/12 ring-white/25" : "bg-white/6 ring-white/10"}`}
      style={{ boxShadow: active ? `0 0 60px hsla(${hue},95%,70%,0.18)` : undefined }}
    >
      <div className="flex items-center justify-center">
        <GlyphMark g={g} big />
      </div>
    </div>
  );
}

function ProtocolStrip({ me, them, reading }: { me: Bot; them: Bot; reading: Reading }) {
  const hue = lerp(me.hue, them.hue, 0.5);
  const packets = useMemo(() => {
    const n = 14;
    return Array.from({ length: n }).map((_, i) => {
      const t = i / (n - 1);
      const hh = lerp(me.hue, them.hue, t);
      const w = clamp(0.15 + reading.harmony * (0.2 + Math.sin(i * 1.4) * 0.05), 0.08, 1);
      const shape: Glyph["shape"] = reading.phase === "scan" ? "hex" : reading.phase === "negotiate" ? "brace" : reading.phase === "sync" ? "ring" : "spark";
      return { id: `p_${i}`, shape, hue: hh, weight: w } satisfies Glyph;
    });
  }, [me.hue, them.hue, reading.harmony, reading.phase]);

  return (
    <div className="rounded-3xl bg-white/5 ring-1 ring-white/10 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
            <GlyphMark g={{ id: "m", shape: "ring", hue: me.hue, weight: 1 }} big />
          </div>
          <div className="h-9 w-9 rounded-2xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
            <GlyphMark g={{ id: "c", shape: reading.phase === "match" ? "spark" : "hex", hue, weight: 1 }} big />
          </div>
          <div className="h-9 w-9 rounded-2xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
            <GlyphMark g={{ id: "t", shape: "pill", hue: them.hue, weight: 1 }} big />
          </div>
        </div>

        <div className="h-2.5 w-24 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${reading.score}%`,
              background: `linear-gradient(90deg, hsla(${me.hue},95%,70%,0.45), hsla(${hue},95%,70%,0.9), hsla(${them.hue},95%,70%,0.45))`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {packets.map((g) => (
          <div key={g.id} className="rounded-2xl px-2.5 py-1.5 bg-black/20 ring-1 ring-white/10">
            <GlyphMark g={g} />
          </div>
        ))}
      </div>
    </div>
  );
}
