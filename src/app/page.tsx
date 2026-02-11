"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Sig = "aurora" | "tide" | "ember" | "moss" | "mist" | "dusk" | "bloom" | "echo";

type Card = {
  id: number;
  pairId: number;
  sig: Sig;
  pulse: number;
};

const SIGS: Sig[] = ["aurora", "tide", "ember", "moss", "mist", "dusk", "bloom", "echo"];

const sigStyle: Record<Sig, string> = {
  aurora: "from-fuchsia-400 via-violet-500 to-cyan-300",
  tide: "from-sky-400 via-blue-500 to-indigo-600",
  ember: "from-orange-400 via-rose-500 to-red-600",
  moss: "from-emerald-300 via-teal-500 to-green-700",
  mist: "from-slate-300 via-zinc-400 to-slate-600",
  dusk: "from-violet-700 via-indigo-700 to-fuchsia-700",
  bloom: "from-pink-300 via-rose-400 to-orange-300",
  echo: "from-cyan-300 via-sky-500 to-violet-500",
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeDeck(round = 1): Card[] {
  const used = shuffle(SIGS).slice(0, 8);
  const deck = used.flatMap((sig, pairId) => [
    { id: pairId * 2, pairId, sig, pulse: round + Math.random() },
    { id: pairId * 2 + 1, pairId, sig, pulse: round + Math.random() },
  ]);
  return shuffle(deck);
}

export default function Home() {
  const [round, setRound] = useState(1);
  const [deck, setDeck] = useState<Card[]>(() => makeDeck(1));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [matched, setMatched] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(3);
  const [flash, setFlash] = useState<string>("");
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (matched.length === deck.length) {
      setFlash("Perfect resonance ✨");
      setScore((s) => s + 120 + Math.max(0, 60 - seconds));
      const id = window.setTimeout(() => {
        setRound((r) => r + 1);
        setDeck(makeDeck(round + 1));
        setMatched([]);
        setFlipped([]);
        setHints((h) => Math.min(5, h + 1));
        setFlash("New pattern awakened");
        setSeconds(0);
      }, 1500);
      return () => window.clearTimeout(id);
    }
  }, [matched, deck.length, round, seconds]);

  const visible = useMemo(() => {
    const set = new Set<number>([...flipped, ...matched]);
    return set;
  }, [flipped, matched]);

  const evolveUnmatched = () => {
    setDeck((cards) =>
      cards.map((c) => {
        if (matched.includes(c.id) || visible.has(c.id)) return c;
        const wobble = Math.random() < 0.25 ? 0.25 : -0.1;
        return { ...c, pulse: c.pulse + wobble };
      }),
    );
  };

  const onFlip = (id: number) => {
    if (locked || flipped.includes(id) || matched.includes(id)) return;
    const next = [...flipped, id];
    setFlipped(next);

    if (next.length === 2) {
      setLocked(true);
      const [a, b] = next.map((idx) => deck.find((c) => c.id === idx)!);
      if (a.pairId === b.pairId) {
        setTimeout(() => {
          setMatched((m) => [...m, a.id, b.id]);
          setScore((s) => s + 36 + streak * 8);
          setStreak((s) => s + 1);
          setFlash("Chime match");
          setFlipped([]);
          setLocked(false);
          evolveUnmatched();
        }, 380);
      } else {
        setTimeout(() => {
          setScore((s) => Math.max(0, s - 7));
          setStreak(0);
          setFlash("Memory ripple");
          setFlipped([]);
          setLocked(false);
          setDeck((cards) =>
            cards.map((c) =>
              matched.includes(c.id)
                ? c
                : Math.random() < 0.22
                  ? { ...c, sig: SIGS[(SIGS.indexOf(c.sig) + 1 + Math.floor(Math.random() * 3)) % SIGS.length] }
                  : c,
            ),
          );
        }, 780);
      }
    }
  };

  const useHint = () => {
    if (hints === 0 || locked) return;
    const pool = deck.filter((c) => !matched.includes(c.id));
    const byPair = new Map<number, Card[]>();
    pool.forEach((c) => byPair.set(c.pairId, [...(byPair.get(c.pairId) || []), c]));
    const pick = [...byPair.values()].find((g) => g.length === 2);
    if (!pick) return;
    setHints((h) => h - 1);
    setFlipped([pick[0].id, pick[1].id]);
    setFlash("Clarity pulse");
    setLocked(true);
    setTimeout(() => {
      setFlipped([]);
      setLocked(false);
    }, 650);
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#3b0764_0,#09090b_45%,#020617_100%)] text-white">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <header className="mb-6 rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/60">Round {round} · Living Memory</p>
              <h1 className="text-2xl font-semibold sm:text-3xl">Echo Bloom</h1>
            </div>
            <div className="text-right text-sm text-white/80">
              <p>Score: <span className="font-semibold text-white">{score}</span></p>
              <p>Streak: <span className="font-semibold text-white">{streak}</span> · Time: {seconds}s</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-cyan-100/90">
            <button
              onClick={useHint}
              className="rounded-full border border-cyan-200/50 bg-cyan-400/20 px-3 py-1 hover:bg-cyan-300/30"
            >
              Hint pulse ({hints})
            </button>
            <p>{flash || "Match pairs before they mutate."}</p>
          </div>
        </header>

        <section className="grid grid-cols-4 gap-3 sm:gap-4">
          {deck.map((card) => {
            const isOpen = visible.has(card.id);
            const isMatched = matched.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => onFlip(card.id)}
                className={`group relative aspect-square rounded-2xl border transition duration-300 [transform-style:preserve-3d] ${
                  isOpen ? "rotate-y-180 border-white/30" : "border-white/10 hover:-translate-y-0.5"
                } ${isMatched ? "ring-2 ring-emerald-300/70" : ""}`}
                style={{ transform: isOpen ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/0 backdrop-blur-md" />
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${sigStyle[card.sig]} p-0.5`}
                  style={{
                    filter: `saturate(${1.1 + Math.sin(card.pulse) * 0.2})`,
                    opacity: isOpen ? 1 : 0,
                    transform: "rotateY(180deg)",
                    transition: "opacity .25s ease",
                  }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-black/25 text-lg font-semibold capitalize tracking-wide">
                    {card.sig}
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </div>
    </main>
  );
}
