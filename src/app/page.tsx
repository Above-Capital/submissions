"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Txn = {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  category: string;
  amount: number; // positive spend
};

type Insight = {
  title: string;
  story: string;
  aha: string;
  confidence: number; // 0..1
  tags: string[];
};

type Quest = {
  id: string;
  title: string;
  description: string;
  impactLabel: string;
  weeklyImpact: number; // $/wk
  difficulty: "easy" | "medium" | "hard";
  spell: { name: string; glyph: string };
  done?: boolean;
};

const CATS = [
  "Groceries",
  "Dining",
  "Coffee",
  "Transport",
  "Subscriptions",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Other",
] as const;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseDate(s: string) {
  // best-effort YYYY-MM-DD
  const [y, m, d] = s.split("-").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function daysBetween(a: Date, b: Date) {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}

function useLocalState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw));
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

function hueFrom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

function SoftCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.55)] " +
        className
      }
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75">
      {children}
    </span>
  );
}

function Meter({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">{label}</div>
        <div className="text-xs font-semibold text-white/85">{value}</div>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/35">
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

function Glyph({ accent, text }: { accent: string; text: string }) {
  return (
    <div
      className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-black/25"
      style={{ boxShadow: `0 0 40px ${accent}22` }}
      aria-hidden
    >
      <div className="text-lg" style={{ textShadow: `0 0 18px ${accent}55` }}>
        {text}
      </div>
    </div>
  );
}

function sampleTxns(): Txn[] {
  const today = new Date();
  const d = (n: number) => {
    const x = new Date(today);
    x.setDate(x.getDate() - n);
    return x.toISOString().slice(0, 10);
  };

  return [
    { id: uid("t"), date: d(1), merchant: "GROCER", category: "Groceries", amount: 74 },
    { id: uid("t"), date: d(2), merchant: "BEAN & CO", category: "Coffee", amount: 7 },
    { id: uid("t"), date: d(3), merchant: "STREAMFLIX", category: "Subscriptions", amount: 19 },
    { id: uid("t"), date: d(3), merchant: "RIDE", category: "Transport", amount: 18 },
    { id: uid("t"), date: d(4), merchant: "SANDWICH", category: "Dining", amount: 16 },
    { id: uid("t"), date: d(6), merchant: "BEAN & CO", category: "Coffee", amount: 8 },
    { id: uid("t"), date: d(7), merchant: "BEAN & CO", category: "Coffee", amount: 7 },
    { id: uid("t"), date: d(7), merchant: "DINER", category: "Dining", amount: 22 },
    { id: uid("t"), date: d(8), merchant: "APP MARKET", category: "Subscriptions", amount: 12 },
    { id: uid("t"), date: d(9), merchant: "RIDE", category: "Transport", amount: 16 },
    { id: uid("t"), date: d(10), merchant: "GROCER", category: "Groceries", amount: 68 },
    { id: uid("t"), date: d(11), merchant: "TAKEOUT", category: "Dining", amount: 34 },
    { id: uid("t"), date: d(12), merchant: "BEAN & CO", category: "Coffee", amount: 7 },
    { id: uid("t"), date: d(14), merchant: "BEAN & CO", category: "Coffee", amount: 8 },
    { id: uid("t"), date: d(15), merchant: "GADGETS", category: "Shopping", amount: 49 },
    { id: uid("t"), date: d(18), merchant: "STREAMFLIX", category: "Subscriptions", amount: 19 },
    { id: uid("t"), date: d(20), merchant: "BEAN & CO", category: "Coffee", amount: 7 },
    { id: uid("t"), date: d(22), merchant: "RIDE", category: "Transport", amount: 17 },
  ];
}

function parseCSV(text: string): Txn[] {
  // Accepts CSV with headers: date, merchant, category, amount
  // Also tolerates: description, name
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((x) => x.trim().toLowerCase());
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));

  const iDate = idx(["date", "transaction date", "posted", "time"]);
  const iMerch = idx(["merchant", "description", "name", "payee"]);
  const iCat = idx(["category", "type"]);
  const iAmt = idx(["amount", "spent", "debit"]);

  const out: Txn[] = [];
  for (const raw of lines.slice(1)) {
    const parts = raw.split(",").map((x) => x.trim());
    const date = parts[iDate] ?? new Date().toISOString().slice(0, 10);
    const merchant = (parts[iMerch] ?? "UNKNOWN").slice(0, 32).toUpperCase();
    const category = parts[iCat] ?? "Other";
    const amt = parseFloat((parts[iAmt] ?? "0").replace(/[^0-9.-]/g, ""));
    const amount = Math.abs(Number.isFinite(amt) ? amt : 0);
    if (!amount) continue;
    out.push({ id: uid("t"), date: date.slice(0, 10), merchant, category, amount });
  }

  return out;
}

function groupBy<T extends string>(items: Txn[], key: (t: Txn) => T) {
  const m = new Map<T, Txn[]>();
  for (const t of items) {
    const k = key(t);
    m.set(k, [...(m.get(k) ?? []), t]);
  }
  return m;
}

function computeInsight(txns: Txn[]): { insight: Insight | null; quests: Quest[] } {
  if (txns.length < 6) return { insight: null, quests: [] };

  const byMerchant = groupBy(txns, (t) => t.merchant);
  const byCat = groupBy(txns, (t) => t.category);

  const now = new Date();
  const txSorted = [...txns].sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());
  const spanDays = Math.max(1, daysBetween(parseDate(txSorted[0].date), parseDate(txSorted[txSorted.length - 1].date)));

  const perWeekFactor = 7 / spanDays;

  // Find a repeating merchant (coffee/ride/etc) that is small but frequent.
  let best: { merchant: string; count: number; total: number; avg: number; weekly: number } | null = null;
  for (const [merchant, list] of byMerchant.entries()) {
    const count = list.length;
    const total = list.reduce((s, t) => s + t.amount, 0);
    const avg = total / count;
    const weekly = total * perWeekFactor;

    const score = count * 2 + Math.min(weekly / 10, 10) - Math.min(avg / 20, 5);
    if (!best || score > (best.count * 2 + best.weekly / 10 - best.avg / 20)) {
      best = { merchant, count, total, avg, weekly };
    }
  }

  // Find category “leak”: second-largest category that could be optimized.
  const catTotals = [...byCat.entries()].map(([cat, list]) => ({
    cat,
    total: list.reduce((s, t) => s + t.amount, 0),
    weekly: list.reduce((s, t) => s + t.amount, 0) * perWeekFactor,
    count: list.length,
  }));
  catTotals.sort((a, b) => b.total - a.total);

  const topCat = catTotals[0];
  const secondCat = catTotals[1] ?? topCat;

  const merchantAha = best
    ? `Your "${best.merchant}" habit is quietly costing ~${money(best.weekly)}/week — it’s not big per hit (~${money(best.avg)}), it’s the *frequency* (${best.count} times in ~${spanDays} days).`
    : null;

  const catAha = secondCat
    ? `Your second-biggest stream is ${secondCat.cat}. A tiny constraint here tends to free up the most painless cash.`
    : null;

  const confidence = clamp((txns.length / 22) * 0.6 + 0.25, 0.25, 0.92);
  const insight: Insight = {
    title: best ? `The ${best.merchant} Loop` : "A Hidden Loop",
    story:
      "Instead of judging every transaction, I look for repeating paths — little trails you walk without noticing.",
    aha: merchantAha ?? catAha ?? "A pattern is forming — give me a few more steps and I’ll name it.",
    confidence,
    tags: ["pattern", "frequency", "gentle-nudge"],
  };

  const quests: Quest[] = [];

  if (best) {
    quests.push({
      id: uid("q"),
      title: "Swap 2 repeats/week",
      description: `Pick 2 ${best.merchant} visits and replace them with a stash / alternative. Same joy, less leak.`,
      impactLabel: "weekly",
      weeklyImpact: Math.max(5, Math.round((best.weekly * 0.28) / 1) ),
      difficulty: "easy",
      spell: { name: "Redirect", glyph: "↺" },
    });

    quests.push({
      id: uid("q"),
      title: "Add a cooldown rune",
      description: `When ${best.merchant} pings your brain, wait 12 minutes. If you still want it, go. Most cravings dissolve.`,
      impactLabel: "weekly",
      weeklyImpact: Math.max(4, Math.round((best.weekly * 0.18) / 1)),
      difficulty: "medium",
      spell: { name: "Cooldown", glyph: "⏳" },
    });
  }

  if (secondCat) {
    quests.push({
      id: uid("q"),
      title: `Cap ${secondCat.cat} with a “soft wall”`,
      description: `Set a gentle weekly cap. When you hit it, you can still spend — but you’ll see the trade-off spell first.`,
      impactLabel: "weekly",
      weeklyImpact: Math.max(6, Math.round(secondCat.weekly * 0.12)),
      difficulty: "easy",
      spell: { name: "Soft Wall", glyph: "⛉" },
    });
  }

  // A “subscription sweep” quest
  const subs = byCat.get("Subscriptions") ?? [];
  if (subs.length) {
    const weekly = subs.reduce((s, t) => s + t.amount, 0) * perWeekFactor;
    quests.push({
      id: uid("q"),
      title: "One subscription duel",
      description: "Pick two subscriptions. Keep only one this month. (Yes, you can rotate next month.)",
      impactLabel: "weekly",
      weeklyImpact: Math.max(3, Math.round(weekly * 0.3)),
      difficulty: "hard",
      spell: { name: "Duel", glyph: "⚔" },
    });
  }

  return { insight, quests: quests.slice(0, 4) };
}

function Ring({ accent, value }: { accent: string; value: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const v = clamp(value, 0, 100);
  const dash = (v / 100) * c;
  return (
    <svg width={90} height={90} viewBox="0 0 90 90" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} />
          <stop offset="1" stopColor="rgba(255,255,255,0.45)" />
        </linearGradient>
      </defs>
      <circle cx="45" cy="45" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="10" fill="none" />
      <circle
        cx="45"
        cy="45"
        r={r}
        stroke="url(#g)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 45 45)"
        style={{ filter: `drop-shadow(0 0 10px ${accent}55)` }}
      />
      <text x="45" y="51" textAnchor="middle" className="fill-white/80" fontSize="18" fontWeight="700">
        {Math.round(v)}
      </text>
    </svg>
  );
}

export default function Page() {
  const [seed, setSeed] = useLocalState<string>("bw.seed", "budgetwand");
  const [txns, setTxns] = useLocalState<Txn[]>("bw.txns", sampleTxns());
  const [quests, setQuests] = useLocalState<Quest[]>("bw.quests", []);
  const [csv, setCsv] = useState<string>("date,merchant,category,amount\n2026-03-01,BEAN & CO,Coffee,7\n2026-03-01,RIDE,Transport,18");
  const [focus, setFocus] = useState<"map" | "quests" | "journal">("map");
  const [note, setNote] = useLocalState<string>("bw.note", "");
  const [spark, setSpark] = useState(0);
  const t0 = useRef<number>(Date.now());

  const accent = useMemo(() => {
    const h = hueFrom(seed);
    return `hsla(${h}, 92%, 62%, 1)`;
  }, [seed]);

  const bg = useMemo(() => {
    const h = hueFrom(seed);
    const a = (h + (spark % 360)) % 360;
    const b = (a + 140) % 360;
    const c = (a + 240) % 360;
    return {
      background: `radial-gradient(900px circle at 15% 20%, hsla(${a}, 92%, 60%, 0.24), transparent 55%),
                   radial-gradient(900px circle at 85% 30%, hsla(${b}, 92%, 60%, 0.18), transparent 55%),
                   radial-gradient(1200px circle at 55% 95%, hsla(${c}, 92%, 60%, 0.14), transparent 55%),
                   linear-gradient(180deg, rgba(7,9,17,1) 0%, rgba(7,8,14,1) 60%, rgba(3,3,7,1) 100%)`,
    } as React.CSSProperties;
  }, [seed, spark]);

  useEffect(() => {
    const id = setInterval(() => setSpark((s) => (s + 1) % 10000), 40);
    return () => clearInterval(id);
  }, []);

  const totals = useMemo(() => {
    const total = txns.reduce((s, t) => s + t.amount, 0);
    const byCat = new Map<string, number>();
    for (const t of txns) byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    const top = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { total, byCat, top };
  }, [txns]);

  const wizard = useMemo(() => computeInsight(txns), [txns]);

  useEffect(() => {
    // seed quests once if empty
    if (!quests.length && wizard.quests.length) setQuests(wizard.quests);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.quests.length]);

  const clarity = useMemo(() => {
    const c = wizard.insight ? wizard.insight.confidence * 100 : 15;
    return clamp(Math.round(c + (Math.sin((Date.now() - t0.current) / 1100) * 3)), 0, 100);
  }, [wizard.insight, spark]);

  const weeklyPotential = useMemo(() => {
    return quests.filter((q) => !q.done).reduce((s, q) => s + q.weeklyImpact, 0);
  }, [quests]);

  function addTxn(t: Omit<Txn, "id">) {
    setTxns((x) => [{ ...t, id: uid("t") }, ...x]);
  }

  function loadCSV() {
    const parsed = parseCSV(csv);
    if (!parsed.length) return;
    setTxns((x) => [...parsed, ...x]);
  }

  const [newMerchant, setNewMerchant] = useState("COFFEE");
  const [newCategory, setNewCategory] = useState<string>("Coffee");
  const [newAmount, setNewAmount] = useState(7);

  return (
    <div className="min-h-dvh text-white" style={bg}>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/5">
              <div className="text-xl" style={{ textShadow: `0 0 18px ${accent}66` }}>
                ✦
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold tracking-tight">BudgetWand</div>
              <div className="text-xs text-white/55">a warm financial wizard that reveals your hidden loops</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent, boxShadow: `0 0 18px ${accent}aa` }} />
              clarity
            </Pill>
            <Pill>
              <span className="font-semibold text-white/90">{clarity}</span>
              /100
            </Pill>
            <Pill>
              <span className="text-white/60">potential</span>
              <span className="font-semibold text-white/90">{money(weeklyPotential)}</span>
              <span className="text-white/60">/wk</span>
            </Pill>
            <button
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
              onClick={() => setSeed((s) => (s === "budgetwand" ? "wizard" : "budgetwand"))}
              title="toggle aura"
            >
              aura
            </button>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-12">
          <section className="md:col-span-5">
            <SoftCard>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white/85">your ledger (gentle)</div>
                  <div className="mt-1 text-xs text-white/55">quick add + paste csv. no shame. only patterns.</div>
                </div>
                <Ring accent={accent} value={clarity} />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <Meter label="transactions" value={clamp(txns.length * 5, 0, 100)} accent={accent} />
                <Meter label="categories" value={clamp(totals.byCat.size * 12, 0, 100)} accent={accent} />
                <Meter label="signal" value={clamp(Math.round(clarity * 0.9), 0, 100)} accent={accent} />
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs font-semibold text-white/75">quick add</div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                  <input
                    value={newMerchant}
                    onChange={(e) => setNewMerchant(e.target.value.toUpperCase().slice(0, 18))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/35 outline-none focus:border-white/25"
                    placeholder="MERCHANT"
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25"
                  >
                    {CATS.map((c) => (
                      <option key={c} value={c} className="bg-[#0b0d18]">
                        {c}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(Math.max(0, parseFloat(e.target.value))) }
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25"
                    />
                    <button
                      onClick={() =>
                        addTxn({
                          date: new Date().toISOString().slice(0, 10),
                          merchant: newMerchant || "UNKNOWN",
                          category: newCategory,
                          amount: Math.max(1, Math.round(newAmount)),
                        })
                      }
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/15"
                    >
                      add
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-white/75">paste csv</div>
                  <button
                    onClick={loadCSV}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10"
                  >
                    ingest
                  </button>
                </div>
                <textarea
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  className="mt-2 h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/85 outline-none focus:border-white/25"
                />
                <div className="mt-2 text-[11px] text-white/45">
                  headers: date,merchant,category,amount · amount can be $7 or 7
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <div className="text-xs font-semibold text-white/70">top streams</div>
                <div className="grid grid-cols-1 gap-2">
                  {totals.top.map(([cat, val]) => (
                    <div key={cat} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-white/90">{cat}</div>
                        <div className="text-sm font-semibold text-white/80">{money(val)}</div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/35">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(val / Math.max(totals.total, 1)) * 100}%`,
                            background: `linear-gradient(90deg, ${accent}, rgba(255,255,255,0.25))`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </SoftCard>
          </section>

          <section className="md:col-span-7">
            <SoftCard>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/85">the wizard’s mirror</div>
                  <div className="mt-1 text-xs text-white/55">patterns → spells → quests. no yelling numbers at you.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setFocus("map")}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs transition " +
                      (focus === "map" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                    }
                  >
                    map
                  </button>
                  <button
                    onClick={() => setFocus("quests")}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs transition " +
                      (focus === "quests" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                    }
                  >
                    quests
                  </button>
                  <button
                    onClick={() => setFocus("journal")}
                    className={
                      "rounded-full border px-3 py-1.5 text-xs transition " +
                      (focus === "journal" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10")
                    }
                  >
                    journal
                  </button>
                </div>
              </div>

              {focus === "map" && (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white/70">spell card</div>
                      <Pill>
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />
                        aha
                      </Pill>
                    </div>

                    {wizard.insight ? (
                      <>
                        <div className="mt-3 text-lg font-semibold tracking-tight">{wizard.insight.title}</div>
                        <div className="mt-2 text-sm text-white/70">{wizard.insight.story}</div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                          <div className="text-xs font-semibold text-white/75">mirror</div>
                          <div className="mt-1 text-sm text-white/85">{wizard.insight.aha}</div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill>
                            confidence <span className="font-semibold text-white/90">{Math.round(wizard.insight.confidence * 100)}%</span>
                          </Pill>
                          {wizard.insight.tags.map((t) => (
                            <Pill key={t}>{t}</Pill>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="mt-6 text-sm text-white/60">
                        Add a few more transactions and I’ll name your hidden loop.
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-white/70">forest path</div>
                      <div className="text-xs text-white/55">your recent steps</div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {txns.slice(0, 8).map((t) => (
                        <div key={t.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                          <div className="flex items-center gap-3">
                            <Glyph accent={accent} text={t.category === "Coffee" ? "☕" : t.category === "Dining" ? "✶" : t.category === "Subscriptions" ? "∞" : "✦"} />
                            <div>
                              <div className="text-sm font-semibold text-white/85">{t.merchant}</div>
                              <div className="text-[11px] text-white/50">{t.date} · {t.category}</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-white/75">{money(t.amount)}</div>
                        </div>
                      ))}
                      <div className="text-[11px] text-white/45">tip: paste more csv to increase clarity.</div>
                    </div>
                  </div>
                </div>
              )}

              {focus === "quests" && (
                <div className="mt-4">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs font-semibold text-white/70">saving quests</div>
                      <div className="mt-2 text-xs text-white/55">mark done to “bank” the weekly impact</div>

                      <div className="mt-3 space-y-2">
                        {quests.map((q) => (
                          <button
                            key={q.id}
                            onClick={() => setQuests((xs) => xs.map((x) => (x.id === q.id ? { ...x, done: !x.done } : x)))}
                            className={
                              "w-full rounded-3xl border p-4 text-left transition " +
                              (q.done ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8")
                            }
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <Glyph accent={accent} text={q.spell.glyph} />
                                <div>
                                  <div className="text-sm font-semibold text-white/90">{q.title}</div>
                                  <div className="mt-1 text-xs text-white/60">{q.description}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill>{q.spell.name}</Pill>
                                    <Pill>{q.difficulty}</Pill>
                                    <Pill>
                                      impact <span className="font-semibold text-white/90">{money(q.weeklyImpact)}</span>/wk
                                    </Pill>
                                  </div>
                                </div>
                              </div>
                              <div
                                className={
                                  "mt-1 h-6 w-6 rounded-full border grid place-items-center " +
                                  (q.done ? "border-emerald-300/40 bg-emerald-300/20" : "border-white/15 bg-white/5")
                                }
                              >
                                <span className="text-xs">{q.done ? "✓" : ""}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                      <div className="text-xs font-semibold text-white/70">banked potential</div>
                      <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                        <div className="text-xs text-white/60">if you complete the selected quests</div>
                        <div className="mt-1 text-3xl font-semibold" style={{ textShadow: `0 0 22px ${accent}55` }}>
                          {money(quests.filter((q) => q.done).reduce((s, q) => s + q.weeklyImpact, 0))}
                          <span className="text-sm font-semibold text-white/55">/wk</span>
                        </div>
                        <div className="mt-2 text-xs text-white/55">~{money(quests.filter((q) => q.done).reduce((s, q) => s + q.weeklyImpact, 0) * 52)}/yr (rough, but motivating)</div>
                      </div>

                      <div className="mt-3 text-xs font-semibold text-white/70">add a custom quest</div>
                      <div className="mt-2 grid grid-cols-1 gap-2">
                        <input
                          placeholder="title"
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25"
                          onChange={() => {}}
                          value={""}
                          disabled
                        />
                        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60">
                          (kept simple for the arena build — but the wizard approves your ambition)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {focus === "journal" && (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs font-semibold text-white/70">journal</div>
                    <div className="mt-2 text-xs text-white/55">write the trade-offs you’re willing to make (or not). the wizard remembers.</div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-3 h-44 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white/85 outline-none focus:border-white/25"
                      placeholder="e.g. I’m fine cutting subscriptions but I refuse to touch groceries."
                    />
                    <div className="mt-2 text-[11px] text-white/45">stored locally · no backend</div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/25 p-4">
                    <div className="text-xs font-semibold text-white/70">reveal</div>
                    <div className="mt-2 rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">your mirror sentence</div>
                      <div className="mt-2 text-lg font-semibold text-white/90">
                        {wizard.insight?.aha ?? "Add transactions and I’ll craft your aha."}
                      </div>
                      <div className="mt-3 text-xs text-white/55">
                        This is the moment the app is built to provoke: “oh — *that’s* what I’ve been doing.”
                      </div>
                    </div>
                    <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs font-semibold text-white/70">gentle next move</div>
                      <div className="mt-2 text-sm text-white/75">
                        Pick one quest. Not all of them. The game is consistency, not punishment.
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Pill>
                          choose <span className="font-semibold text-white/90">1</span>
                        </Pill>
                        <Pill>repeat</Pill>
                        <Pill>bank the win</Pill>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SoftCard>
          </section>
        </main>

        <footer className="mt-6 text-center text-xs text-white/35">
          frontend-only demo · local storage · wizardry ≠ financial advice
        </footer>
      </div>
    </div>
  );
}
