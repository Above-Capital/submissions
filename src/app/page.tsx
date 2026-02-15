"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Mode = "idle" | "calibrating" | "searching" | "matched";

type SkillKey = "control" | "power" | "speed" | "spin" | "vibes";

type Profile = {
  id: string;
  name: string;
  avatarSeed: string;
  tags: string[];
  skill: Record<SkillKey, number>; // 0..100
  pace: number; // 0..100
  reliability: number; // 0..100
  proximityMin: number; // minutes away, 1..30
};

type Court = {
  id: string;
  name: string;
  vibe: "neon" | "sunset" | "warehouse" | "park";
  etaMin: number;
  occupancy: number; // 0..100
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function fmtMin(m: number) {
  if (m <= 1) return "~1 min";
  return `${m} min`;
}

function hashToHue(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

function scoreMatch(me: Record<SkillKey, number>, other: Record<SkillKey, number>) {
  // Complementary match: prefer slightly different strengths, but close on vibes.
  const diff = (k: SkillKey, w: number) => Math.abs(me[k] - other[k]) * w;
  const complement = (
    (100 - Math.abs(me.control - other.power)) * 0.18 +
      (100 - Math.abs(me.power - other.control)) * 0.18 +
      (100 - Math.abs(me.speed - other.spin)) * 0.14 +
      (100 - Math.abs(me.spin - other.speed)) * 0.14 +
      (100 - Math.abs(me.vibes - other.vibes)) * 0.22
  );
  const penalty =
    diff("vibes", 0.12) +
    (Math.abs(me.control - other.control) + Math.abs(me.power - other.power)) * 0.02;

  const raw = complement - penalty;
  return clamp(Math.round(raw), 0, 100);
}

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v != null) setValue(JSON.parse(v));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);

  return [value, setValue] as const;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/80">
      {children}
    </span>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const w = 120;
  const h = 32;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const t = (v - min) / (max - min || 1);
      const y = h - t * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline
        fill="none"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

function Gauge({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">{label}</div>
        <div className="text-xs font-semibold text-white/85">{value}</div>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/30">
        <div
          className="h-full rounded-full"
          style={{
            width: `${clamp(value, 0, 100)}%`,
            background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.35))`,
            boxShadow: `0 0 18px ${accent}55`,
          }}
        />
      </div>
    </div>
  );
}

function Avatar({ seed, size = 44 }: { seed: string; size?: number }) {
  const hue = hashToHue(seed);
  const bg = `conic-gradient(from 180deg at 50% 50%, hsla(${hue}, 95%, 62%, 1), hsla(${(hue + 70) % 360}, 95%, 62%, 1), hsla(${(hue + 140) % 360}, 95%, 62%, 1), hsla(${hue}, 95%, 62%, 1))`;

  return (
    <div
      className="relative grid place-items-center overflow-hidden rounded-2xl border border-white/10"
      style={{ width: size, height: size, background: bg }}
      aria-hidden
    >
      <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), transparent 55%)" }} />
      <div className="h-3 w-3 rounded-full bg-white/80 shadow-[0_0_18px_rgba(255,255,255,0.65)]" />
    </div>
  );
}

function CourtChip({ court, selected, onClick }: { court: Court; selected: boolean; onClick: () => void }) {
  const vibeGrad: Record<Court["vibe"], string> = {
    neon: "from-fuchsia-500/30 via-cyan-400/20 to-emerald-400/20",
    sunset: "from-orange-500/25 via-pink-500/20 to-violet-500/20",
    warehouse: "from-slate-200/10 via-sky-300/10 to-lime-200/10",
    park: "from-emerald-500/20 via-teal-400/20 to-cyan-300/20",
  };

  return (
    <button
      onClick={onClick}
      className={
        "group relative w-full rounded-2xl border p-3 text-left transition " +
        (selected
          ? "border-white/25 bg-white/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8")
      }
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${vibeGrad[court.vibe]} opacity-70`} />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white/90">{court.name}</div>
          <div className="mt-0.5 text-xs text-white/60">ETA {fmtMin(court.etaMin)} · occupancy {court.occupancy}%</div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-black/25 ring-1 ring-white/10 grid place-items-center">
          <div className="h-2 w-2 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.5)]" />
        </div>
      </div>
    </button>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("idle");
  const [seed, setSeed] = useLocalState<string>("pb.seed", "atlas");
  const [mySkill, setMySkill] = useLocalState<Record<SkillKey, number>>("pb.skill", {
    control: 62,
    power: 44,
    speed: 70,
    spin: 55,
    vibes: 76,
  });
  const [tempo, setTempo] = useLocalState<number>("pb.tempo", 64); // how fast you want it
  const [risk, setRisk] = useLocalState<number>("pb.risk", 42); // how weird you tolerate
  const [selectedCourt, setSelectedCourt] = useLocalState<string>("pb.court", "c-neon");

  const [feed, setFeed] = useState<{ t: number; kind: "ping" | "lock" | "hint"; text: string }[]>([]);
  const [pulse, setPulse] = useState(0);
  const [energy, setEnergy] = useState(35);
  const [pings, setPings] = useState<number[]>([10, 22, 16, 28, 19, 31, 24, 40]);

  const [candidate, setCandidate] = useState<Profile | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [matchCourtEta, setMatchCourtEta] = useState<number>(7);

  const startedAt = useRef<number | null>(null);

  const courts: Court[] = useMemo(
    () => [
      { id: "c-neon", name: "Court // Neon Alley", vibe: "neon", etaMin: 6, occupancy: 28 },
      { id: "c-sunset", name: "Court // Sunset Roof", vibe: "sunset", etaMin: 10, occupancy: 44 },
      { id: "c-warehouse", name: "Court // Warehouse Echo", vibe: "warehouse", etaMin: 14, occupancy: 19 },
      { id: "c-park", name: "Court // Park Loop", vibe: "park", etaMin: 8, occupancy: 62 },
    ],
    []
  );

  const selectedCourtObj = useMemo(() => courts.find((c) => c.id === selectedCourt) ?? courts[0], [courts, selectedCourt]);

  const candidates: Profile[] = useMemo(
    () => [
      {
        id: "p-arc",
        name: "ARC-17",
        avatarSeed: "arc",
        tags: ["lefty", "fast hands", "counter"],
        skill: { control: 58, power: 64, speed: 72, spin: 49, vibes: 71 },
        pace: 78,
        reliability: 86,
        proximityMin: 7,
      },
      {
        id: "p-foam",
        name: "FOAM-2",
        avatarSeed: "foam",
        tags: ["spin lab", "soft game", "angles"],
        skill: { control: 80, power: 36, speed: 56, spin: 83, vibes: 77 },
        pace: 52,
        reliability: 74,
        proximityMin: 11,
      },
      {
        id: "p-vx",
        name: "VX-9",
        avatarSeed: "vx",
        tags: ["banger", "serve heat", "drive"],
        skill: { control: 45, power: 86, speed: 66, spin: 40, vibes: 63 },
        pace: 84,
        reliability: 68,
        proximityMin: 9,
      },
      {
        id: "p-lumen",
        name: "LUMEN",
        avatarSeed: "lumen",
        tags: ["calm", "placement", "resets"],
        skill: { control: 78, power: 42, speed: 60, spin: 62, vibes: 85 },
        pace: 58,
        reliability: 92,
        proximityMin: 8,
      },
      {
        id: "p-rift",
        name: "RIFT",
        avatarSeed: "rift",
        tags: ["chaos", "trick shots", "laughs"],
        skill: { control: 52, power: 55, speed: 74, spin: 71, vibes: 91 },
        pace: 76,
        reliability: 62,
        proximityMin: 6,
      },
    ],
    []
  );

  function pushFeed(kind: "ping" | "lock" | "hint", text: string) {
    setFeed((f) => [{ t: Date.now(), kind, text }, ...f].slice(0, 8));
  }

  function resetSession() {
    setMode("idle");
    setCandidate(null);
    setMatchScore(0);
    setEnergy(35);
    setPings([10, 22, 16, 28, 19, 31, 24, 40]);
    setFeed([]);
    startedAt.current = null;
    pushFeed("hint", "ready");
  }

  function calibrate() {
    setMode("calibrating");
    pushFeed("hint", "calibrating");
    // Quick animation phase.
    setTimeout(() => {
      setMode("searching");
      pushFeed("ping", "search");
      startedAt.current = Date.now();
    }, 900);
  }

  function lockMatch(profile: Profile) {
    const s = scoreMatch(mySkill, profile.skill);
    setCandidate(profile);
    setMatchScore(s);
    const eta = Math.max(3, Math.round((profile.proximityMin + selectedCourtObj.etaMin) / 2));
    setMatchCourtEta(eta);
    setMode("matched");
    pushFeed("lock", `lock ${profile.name}`);
  }

  // Pulse + simulated realtime pings.
  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 1000), 40);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (mode !== "searching") return;

    let alive = true;

    const tick = () => {
      if (!alive) return;

      // Energy rises with time, tempo, and a little chaos.
      const base = (tempo / 100) * 1.2 + 0.25;
      const chaos = (risk / 100) * 1.0;
      setEnergy((e) => clamp(e + base + (Math.random() - 0.45) * chaos * 2.2, 0, 100));

      // Emit ping spikes.
      setPings((arr) => {
        const next = [...arr.slice(1), clamp(arr[arr.length - 1] + (Math.random() * 18 - 8) + tempo / 18, 6, 98)];
        return next;
      });

      // Every so often, pick a candidate and maybe lock.
      if (Math.random() < 0.22) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const s = scoreMatch(mySkill, pick.skill);
        pushFeed("ping", `${pick.name} ${s}`);

        // Lock if it feels “right”.
        const rightness = s + (energy - 50) * 0.35 + (Math.random() * 8 - 4);
        if (rightness > 84) {
          lockMatch(pick);
          return;
        }
      }

      // Auto-lock after some time.
      const elapsed = startedAt.current ? Date.now() - startedAt.current : 0;
      if (elapsed > lerp(16000, 9000, tempo / 100)) {
        const sorted = [...candidates]
          .map((p) => ({ p, s: scoreMatch(mySkill, p.skill) }))
          .sort((a, b) => b.s - a.s);
        lockMatch(sorted[0].p);
        return;
      }

      setTimeout(tick, 650);
    };

    const t0 = setTimeout(tick, 300);
    return () => {
      alive = false;
      clearTimeout(t0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tempo, risk, selectedCourtObj.id, seed, JSON.stringify(mySkill)]);

  useEffect(() => {
    // On first load, add a quiet hint.
    pushFeed("hint", "tap to rally");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgShift = useMemo(() => {
    const t = pulse / 1000;
    const hueA = (hashToHue(seed) + t * 360) % 360;
    const hueB = (hueA + 120) % 360;
    return {
      background: `radial-gradient(900px circle at 20% 20%, hsla(${hueA}, 90%, 60%, 0.22), transparent 55%),
                   radial-gradient(900px circle at 80% 30%, hsla(${hueB}, 90%, 60%, 0.18), transparent 55%),
                   radial-gradient(1200px circle at 50% 90%, hsla(${(hueA + 200) % 360}, 90%, 60%, 0.16), transparent 55%),
                   linear-gradient(180deg, rgba(7,10,18,1) 0%, rgba(6,7,12,1) 55%, rgba(2,3,6,1) 100%)`,
    } as React.CSSProperties;
  }, [pulse, seed]);

  const energyAccent = useMemo(() => {
    const hue = (hashToHue(seed) + energy * 1.4) % 360;
    return `hsla(${hue}, 95%, 62%, 1)`;
  }, [seed, energy]);

  const statusLabel = useMemo(() => {
    if (mode === "idle") return "idle";
    if (mode === "calibrating") return "calibrating";
    if (mode === "searching") return "rally";
    return "match";
  }, [mode]);

  const bigButtonLabel = useMemo(() => {
    if (mode === "idle") return "RALLY";
    if (mode === "calibrating") return "...";
    if (mode === "searching") return "HOLD";
    return "REMATCH";
  }, [mode]);

  const bigButtonAction = () => {
    if (mode === "idle") calibrate();
    else if (mode === "matched") resetSession();
  };

  return (
    <div className="min-h-dvh text-white" style={bgShift}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar seed={seed} size={46} />
              <div
                className="pointer-events-none absolute -inset-1 rounded-3xl opacity-70 blur-[10px]"
                style={{ background: `radial-gradient(circle, ${energyAccent}55, transparent 65%)` }}
              />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">PicklePulse</div>
              <div className="text-xs text-white/55">instant partner · electric waiting · no awkward texts</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill>
              <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: energyAccent, boxShadow: `0 0 18px ${energyAccent}aa` }} />
              {statusLabel}
            </Pill>
            <Pill>eta {fmtMin(mode === "matched" ? matchCourtEta : selectedCourtObj.etaMin)}</Pill>
            <Pill>energy {Math.round(energy)}</Pill>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Left: Control surface */}
          <section className="md:col-span-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white/85">calibration</div>
                <button
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                  onClick={() => setSeed((s) => (s === "atlas" ? "sean" : "atlas"))}
                  title="toggle seed"
                >
                  seed
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <Gauge label="tempo" value={tempo} accent={energyAccent} />
                <Gauge label="risk" value={risk} accent={energyAccent} />
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3">
                {(
                  [
                    ["control", mySkill.control],
                    ["power", mySkill.power],
                    ["speed", mySkill.speed],
                    ["spin", mySkill.spin],
                    ["vibes", mySkill.vibes],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/60">{k}</div>
                      <div className="text-xs font-semibold text-white/85">{v}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={v}
                      onChange={(e) =>
                        setMySkill((s) => ({ ...s, [k]: clamp(parseInt(e.target.value, 10), 0, 100) }))
                      }
                      className="mt-2 w-full accent-white"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/60">tempo</div>
                      <div className="text-xs font-semibold text-white/85">{tempo}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={tempo}
                      onChange={(e) => setTempo(parseInt(e.target.value, 10))}
                      className="mt-2 w-full accent-white"
                    />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/60">risk</div>
                      <div className="text-xs font-semibold text-white/85">{risk}</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={risk}
                      onChange={(e) => setRisk(parseInt(e.target.value, 10))}
                      className="mt-2 w-full accent-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div className="text-xs font-semibold text-white/70">court</div>
                <div className="grid grid-cols-1 gap-2">
                  {courts.map((c) => (
                    <CourtChip
                      key={c.id}
                      court={c}
                      selected={c.id === selectedCourt}
                      onClick={() => setSelectedCourt(c.id)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={bigButtonAction}
                  disabled={mode === "calibrating" || mode === "searching"}
                  className={
                    "relative w-full overflow-hidden rounded-2xl border border-white/15 px-4 py-3 text-sm font-semibold tracking-wide transition " +
                    (mode === "calibrating" || mode === "searching"
                      ? "bg-white/5 text-white/40"
                      : "bg-white/10 hover:bg-white/15")
                  }
                >
                  <span className="relative z-10">{bigButtonLabel}</span>
                  <div
                    className="absolute inset-0 opacity-70"
                    style={{
                      background: `radial-gradient(450px circle at 30% 20%, ${energyAccent}33, transparent 60%)`,
                    }}
                  />
                </button>

                <button
                  onClick={resetSession}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 hover:bg-white/10"
                >
                  reset
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white/70">pingline</div>
                  <div className="text-xs text-white/55">simulated realtime</div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Sparkline values={pings} />
                  <div className="text-right">
                    <div className="text-2xl font-semibold" style={{ textShadow: `0 0 22px ${energyAccent}55` }}>
                      {Math.round(energy)}
                    </div>
                    <div className="text-[11px] text-white/55">court energy</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Match + feed */}
          <section className="md:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white/85">match</div>
                  <div className="mt-1 text-xs text-white/55">waiting should feel like a rally.</div>
                </div>
                <Pill>
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: energyAccent, boxShadow: `0 0 18px ${energyAccent}aa` }} />
                  {mode}
                </Pill>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs font-semibold text-white/70">you</div>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar seed={seed + "-me"} size={54} />
                    <div>
                      <div className="text-sm font-semibold text-white/90">YOU</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Pill>tempo {tempo}</Pill>
                        <Pill>risk {risk}</Pill>
                        <Pill>court {selectedCourtObj.name.replace("Court // ", "")}</Pill>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(
                      [
                        ["control", mySkill.control],
                        ["power", mySkill.power],
                        ["speed", mySkill.speed],
                        ["spin", mySkill.spin],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className="rounded-xl border border-white/10 bg-white/5 p-2">
                        <div className="text-[11px] text-white/55">{k}</div>
                        <div className="text-sm font-semibold text-white/85">{v}</div>
                      </div>
                    ))}
                    <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-2">
                      <div className="text-[11px] text-white/55">vibes</div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-white/85">{mySkill.vibes}</div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${mySkill.vibes}%`, background: `linear-gradient(90deg, ${energyAccent}, rgba(255,255,255,0.3))` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs font-semibold text-white/70">partner</div>

                  {candidate ? (
                    <>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar seed={candidate.avatarSeed} size={54} />
                          <div>
                            <div className="text-sm font-semibold text-white/90">{candidate.name}</div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {candidate.tags.slice(0, 3).map((t) => (
                                <Pill key={t}>{t}</Pill>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-semibold" style={{ textShadow: `0 0 24px ${energyAccent}66` }}>
                            {matchScore}
                          </div>
                          <div className="text-[11px] text-white/55">compat</div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                          <div className="text-[11px] text-white/55">pace</div>
                          <div className="text-sm font-semibold text-white/85">{candidate.pace}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-2">
                          <div className="text-[11px] text-white/55">reliability</div>
                          <div className="text-sm font-semibold text-white/85">{candidate.reliability}</div>
                        </div>
                        <div className="col-span-2 rounded-xl border border-white/10 bg-white/5 p-2">
                          <div className="text-[11px] text-white/55">sync</div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/30">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${matchScore}%`,
                                background: `linear-gradient(90deg, ${energyAccent}, rgba(255,255,255,0.25))`,
                                boxShadow: `0 0 24px ${energyAccent}55`,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-white/75">connection</div>
                          <Pill>ETA {fmtMin(matchCourtEta)}</Pill>
                        </div>
                        <div className="mt-2 text-xs text-white/60">
                          {mode === "matched" ? "locked. meet at" : "buffering…"}
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white/90">{selectedCourtObj.name}</div>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ background: energyAccent, boxShadow: `0 0 18px ${energyAccent}aa` }}
                            />
                            <div className="text-xs text-white/60">{selectedCourtObj.vibe}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mt-6 grid place-items-center">
                      <div className="relative">
                        <div
                          className="h-44 w-44 rounded-[40px] border border-white/10 bg-white/5"
                          style={{
                            boxShadow: `0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 60px ${energyAccent}22`,
                          }}
                        />
                        <div
                          className="pointer-events-none absolute inset-0 grid place-items-center"
                          style={{
                            transform: `rotate(${(pulse / 1000) * 20 - 10}deg)`,
                          }}
                        >
                          <div
                            className="h-20 w-20 rounded-[28px]"
                            style={{
                              background: `conic-gradient(from 180deg, ${energyAccent}, rgba(255,255,255,0.3), ${energyAccent})`,
                              filter: "blur(0px)",
                              opacity: 0.9,
                              boxShadow: `0 0 50px ${energyAccent}55`,
                            }}
                          />
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                          <div className="text-sm font-semibold text-white/85">tap RALLY</div>
                          <div className="mt-1 text-xs text-white/55">to start the volley</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-12">
                <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-white/70">event feed</div>
                    <div className="text-xs text-white/55">last 8</div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {feed.length === 0 ? (
                      <div className="text-xs text-white/50">—</div>
                    ) : (
                      feed.map((e) => (
                        <div
                          key={e.t}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                "inline-block h-2 w-2 rounded-full " +
                                (e.kind === "lock" ? "bg-emerald-400" : e.kind === "ping" ? "bg-cyan-300" : "bg-white/60")
                              }
                              style={{ boxShadow: `0 0 16px ${energyAccent}44` }}
                            />
                            <div className="text-xs text-white/75">{e.text}</div>
                          </div>
                          <div className="text-[11px] tabular-nums text-white/40">
                            {new Date(e.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="text-xs font-semibold text-white/70">how it works</div>
                  <div className="mt-2 space-y-2 text-xs text-white/55">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-white/75 font-semibold">1 · calibrate</div>
                      <div className="mt-1">sliders tune your play style and how weird the matching can get.</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-white/75 font-semibold">2 · rally</div>
                      <div className="mt-1">waiting = volleys: pings spike, energy climbs, candidates flash by.</div>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-white/75 font-semibold">3 · lock</div>
                      <div className="mt-1">when it’s right, it locks — no chat. just meet.</div>
                    </div>
                  </div>
                </div>
              </div>

              {mode === "matched" && candidate && (
                <div className="mt-4 rounded-2xl border border-white/15 bg-gradient-to-br from-white/10 via-white/5 to-black/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar seed={candidate.avatarSeed + "-lock"} size={46} />
                        <div
                          className="pointer-events-none absolute -inset-2 rounded-3xl opacity-70 blur-[14px]"
                          style={{ background: `radial-gradient(circle, ${energyAccent}66, transparent 62%)` }}
                        />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white/90">connection established</div>
                        <div className="mt-0.5 text-xs text-white/55">{candidate.name} · {selectedCourtObj.name} · ETA {fmtMin(matchCourtEta)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMode("searching")}
                        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/15"
                      >
                        run again
                      </button>
                      <button
                        onClick={resetSession}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70 hover:bg-white/10"
                      >
                        clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>

        <footer className="mt-6 text-center text-xs text-white/35">
          static client demo · no backend · vibes only
        </footer>
      </div>
    </div>
  );
}
