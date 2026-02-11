"use client";

import { useMemo, useState } from "react";

type Category = "length" | "weight" | "temperature";

type Unit = {
  id: string;
  label: string;
  category: Category;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
};

const UNITS: Unit[] = [
  { id: "m", label: "Meters", category: "length", toBase: (v) => v, fromBase: (v) => v },
  { id: "ft", label: "Feet", category: "length", toBase: (v) => v / 3.28084, fromBase: (v) => v * 3.28084 },
  { id: "km", label: "Kilometers", category: "length", toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },

  { id: "kg", label: "Kilograms", category: "weight", toBase: (v) => v, fromBase: (v) => v },
  { id: "lb", label: "Pounds", category: "weight", toBase: (v) => v / 2.20462, fromBase: (v) => v * 2.20462 },
  { id: "g", label: "Grams", category: "weight", toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },

  {
    id: "c",
    label: "Celsius",
    category: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
  },
  {
    id: "f",
    label: "Fahrenheit",
    category: "temperature",
    toBase: (v) => ((v - 32) * 5) / 9,
    fromBase: (v) => (v * 9) / 5 + 32,
  },
  {
    id: "k",
    label: "Kelvin",
    category: "temperature",
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
  },
];

function byId(id: string) {
  return UNITS.find((u) => u.id === id)!;
}

export default function Home() {
  const [from, setFrom] = useState("m");
  const [to, setTo] = useState("ft");
  const [value, setValue] = useState("100");
  const [dragging, setDragging] = useState<string | null>(null);

  const source = byId(from);
  const target = byId(to);

  const converted = useMemo(() => {
    const num = Number(value);
    if (!Number.isFinite(num)) return "—";
    if (source.category !== target.category) return "Incompatible units";
    const base = source.toBase(num);
    return target.fromBase(base).toFixed(4).replace(/\.?0+$/, "");
  }, [value, source, target]);

  const onDropZone = (zone: "from" | "to", unitId: string) => {
    if (zone === "from") setFrom(unitId);
    else setTo(unitId);
  };

  const suggested = [
    ["m", "ft", "10"],
    ["kg", "lb", "72"],
    ["c", "f", "21"],
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2a44,#09090b_50%)] p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Morph Convert</p>
          <h1 className="text-3xl font-black md:text-4xl">Unit converter with drag-and-drop</h1>
          <p className="mt-2 text-sm text-zinc-300">Drag any unit chip into FROM or TO to instantly remap conversions.</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-2">
              <DropZone
                title="FROM"
                unit={source}
                active={dragging !== null}
                onDrop={(id) => onDropZone("from", id)}
              />
              <DropZone title="TO" unit={target} active={dragging !== null} onDrop={(id) => onDropZone("to", id)} />
            </div>

            <div className="mt-4 rounded-2xl bg-black/25 p-4">
              <label className="text-xs text-zinc-300">Value</label>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-xl font-semibold outline-none focus:border-cyan-300"
              />
              <p className="mt-3 text-sm text-zinc-300">Result</p>
              <p className="text-3xl font-black text-cyan-200">{converted}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {suggested.map(([a, b, v]) => (
                <button
                  key={`${a}-${b}`}
                  onClick={() => {
                    setFrom(a);
                    setTo(b);
                    setValue(v);
                  }}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                >
                  {byId(a).label} → {byId(b).label}
                </button>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl">
            <h2 className="text-lg font-bold">Drag unit chips</h2>
            <p className="mb-3 text-xs text-zinc-300">Drop onto FROM or TO panels.</p>
            <div className="space-y-3">
              {(["length", "weight", "temperature"] as Category[]).map((cat) => (
                <div key={cat}>
                  <p className="mb-2 text-xs uppercase tracking-wider text-zinc-300">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {UNITS.filter((u) => u.category === cat).map((u) => (
                      <button
                        key={u.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", u.id);
                          setDragging(u.id);
                        }}
                        onDragEnd={() => setDragging(null)}
                        className="cursor-grab rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-sm transition hover:scale-105 hover:bg-black/40 active:cursor-grabbing"
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function DropZone({
  title,
  unit,
  active,
  onDrop,
}: {
  title: string;
  unit: Unit;
  active: boolean;
  onDrop: (id: string) => void;
}) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("Text");
        if (id) onDrop(id);
      }}
      onDragEnter={(e) => {
        const text = (e.dataTransfer.types || []).includes("text/plain");
        if (!text) e.dataTransfer.setData("text/plain", "");
      }}
      className={`rounded-2xl border p-4 transition ${active ? "border-cyan-300 bg-cyan-500/10" : "border-white/20 bg-black/20"}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-300">{title}</p>
      <p className="mt-2 text-lg font-bold">{unit.label}</p>
      <p className="text-xs text-zinc-400">{unit.category}</p>
    </div>
  );
}
