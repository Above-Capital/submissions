"use client";

import { useMemo, useState } from "react";

type Tx = {
  name: string;
  amount: number;
  category: "Food" | "Transit" | "Subscriptions" | "Shopping" | "Wellness";
  day: string;
};

const transactions: Tx[] = [
  { name: "Morning Brew", amount: 8, category: "Food", day: "Mon" },
  { name: "Metro Tap", amount: 6, category: "Transit", day: "Mon" },
  { name: "StreamPlus", amount: 19, category: "Subscriptions", day: "Tue" },
  { name: "Impulse Cart", amount: 42, category: "Shopping", day: "Wed" },
  { name: "Lunch Dash", amount: 17, category: "Food", day: "Thu" },
  { name: "Taxi Boost", amount: 21, category: "Transit", day: "Fri" },
  { name: "Night Scroll Buy", amount: 33, category: "Shopping", day: "Sat" },
  { name: "Yoga Drop-in", amount: 24, category: "Wellness", day: "Sun" },
  { name: "Snack Loop", amount: 11, category: "Food", day: "Sun" },
];

const categoryColor: Record<Tx["category"], string> = {
  Food: "from-amber-300/80 to-orange-400/90",
  Transit: "from-sky-300/80 to-cyan-400/90",
  Subscriptions: "from-violet-300/80 to-fuchsia-400/90",
  Shopping: "from-rose-300/80 to-pink-400/90",
  Wellness: "from-emerald-300/80 to-teal-400/90",
};

const personalityMap: Record<Tx["category"], string> = {
  Food: "Comfort Seeker",
  Transit: "Speed Chaser",
  Subscriptions: "Convenience Collector",
  Shopping: "Mood Buyer",
  Wellness: "Reset Investor",
};

export default function Home() {
  const [goal, setGoal] = useState(200);
  const [intensity, setIntensity] = useState(35);

  const total = useMemo(
    () => transactions.reduce((sum, tx) => sum + tx.amount, 0),
    []
  );

  const byCategory = useMemo(() => {
    const map = new Map<Tx["category"], number>();
    for (const tx of transactions) {
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, []);

  const topCategory = byCategory[0][0];
  const topSpend = byCategory[0][1];
  const wastedDrift = Math.round((topSpend * intensity) / 100);
  const monthlySave = Math.round(wastedDrift * 3.8);
  const daysToGoal = Math.max(1, Math.ceil(goal / Math.max(1, monthlySave / 30)));

  const progress = Math.min(100, Math.round((monthlySave / goal) * 100));

  return (
    <div className="min-h-screen bg-[#060910] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.2),transparent_40%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.2),transparent_45%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,0.18),transparent_50%)]" />

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-teal-200/80">Budget Familiar</p>
          <h1 className="mt-2 text-3xl font-semibold md:text-5xl">Your money has a personality. Talk to it.</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Instead of shaming spending, this wizard reveals your hidden behavior loop and shows how a tiny shift unlocks real savings.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-300">Weekly spend sampled</p>
            <p className="mt-1 text-4xl font-bold">${total}</p>
            <div className="mt-5 space-y-3">
              {transactions.map((tx, i) => (
                <div key={`${tx.name}-${i}`} className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 transition hover:bg-white/[0.08]">
                  <div>
                    <p className="text-sm font-medium">{tx.name}</p>
                    <p className="text-xs text-slate-400">{tx.day} · {tx.category}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-200">-${tx.amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
            <p className="text-sm text-slate-300">Behavior fingerprint</p>
            <h2 className="mt-1 text-2xl font-semibold">Primary pattern: {personalityMap[topCategory]}</h2>
            <p className="mt-2 text-slate-300">
              Your <span className="font-semibold text-white">{topCategory}</span> spending is about <span className="font-semibold text-white">${topSpend}/week</span>. That is where your easiest win lives.
            </p>

            <div className="mt-5 space-y-3">
              {byCategory.map(([cat, amount]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{cat}</span>
                    <span>${amount}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${categoryColor[cat]}`}
                      style={{ width: `${Math.min(100, Math.round((amount / total) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:grid-cols-2">
          <div>
            <p className="text-sm text-slate-300">Savings alchemy</p>
            <h3 className="mt-1 text-2xl font-semibold">Tune habit intensity</h3>
            <p className="mt-2 text-slate-300">Drag to simulate how much of your top-spend pattern you trim. Watch your future recalculate in real time.</p>

            <div className="mt-6">
              <label className="mb-2 flex items-center justify-between text-sm">
                <span>Trim strength</span>
                <span className="font-semibold">{intensity}%</span>
              </label>
              <input
                type="range"
                min={5}
                max={80}
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                className="w-full accent-teal-300"
              />
            </div>

            <div className="mt-5">
              <label className="mb-2 flex items-center justify-between text-sm">
                <span>Goal</span>
                <span className="font-semibold">${goal}</span>
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={goal}
                onChange={(e) => setGoal(Number(e.target.value))}
                className="w-full accent-violet-300"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-emerald-100/90">Your aha moment</p>
            <p className="mt-3 text-lg leading-relaxed text-emerald-50">
              You don’t need to become “frugal.” If you only interrupt your <span className="font-semibold">{topCategory.toLowerCase()}</span> loop by <span className="font-semibold">{intensity}%</span>, you unlock about <span className="font-semibold">${monthlySave}/month</span> — enough to hit <span className="font-semibold">${goal}</span> in roughly <span className="font-semibold">{daysToGoal} days</span>.
            </p>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm text-emerald-100">
                <span>Goal momentum</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-emerald-950/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
