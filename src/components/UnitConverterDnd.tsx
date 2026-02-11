"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, CategoryDef, convert, getCategory, getUnit } from "../lib/units";
import { classNames, formatNumber, formatTime } from "../lib/utils";
import { ConverterState, loadState, saveState } from "../lib/storage";

type DropTarget = "from" | "to";

function DraggableUnitChip({ unitId }: { unitId: string }) {
  const u = getUnit(unitId)!;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/unit", unitId);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="group flex cursor-grab items-center justify-between gap-2 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm shadow-sm transition hover:bg-white active:cursor-grabbing dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
      title="Drag onto a slot"
    >
      <div className="min-w-0">
        <div className="line-clamp-1 font-semibold tracking-tight">{u.label}</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-300">{u.symbol}</div>
      </div>
      <div className="rounded-lg bg-black/5 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
        {u.id}
      </div>
    </div>
  );
}

function DropSlot({
  label,
  unitId,
  onDropUnit,
  onClick,
}: {
  label: string;
  unitId: string;
  onDropUnit: (unitId: string) => void;
  onClick: () => void;
}) {
  const u = getUnit(unitId);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("text/unit");
        if (id) onDropUnit(id);
      }}
      className="rounded-2xl border border-dashed border-black/20 bg-white/55 p-4 transition hover:bg-white/70 dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">{label}</div>
          <div className="mt-1 text-base font-semibold tracking-tight">
            {u ? (
              <span>
                {u.label} <span className="text-zinc-500 dark:text-zinc-400">({u.symbol})</span>
              </span>
            ) : (
              "Drop a unit"
            )}
          </div>
        </div>
        <button
          onClick={onClick}
          className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          Pick
        </button>
      </div>
      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Drag a unit card here (or tap Pick).</div>
    </div>
  );
}

function PresetPill({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-black/10 bg-white/60 px-3 py-1 text-[11px] font-semibold text-zinc-800 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-zinc-100 dark:hover:bg-white/15"
    >
      {title}
    </button>
  );
}

function CategoryTabs({ categoryId, setCategoryId }: { categoryId: string; setCategoryId: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => setCategoryId(c.id)}
          className={classNames(
            "rounded-full border px-3 py-1 text-[11px] font-semibold",
            c.id === categoryId
              ? "border-indigo-500/35 bg-indigo-500/10"
              : "border-black/10 bg-white/60 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function UnitPickerModal({
  open,
  category,
  onPick,
  onClose,
}: {
  open: boolean;
  category: CategoryDef;
  onPick: (unitId: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return category.units;
    return category.units.filter((u) => u.label.toLowerCase().includes(s) || u.id.includes(s) || u.symbol.toLowerCase().includes(s));
  }, [category.units, q]);

  useEffect(() => {
    if (!open) return;
    setQ("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-zinc-950/80">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Pick a unit</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">{category.label}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10"
          >
            Close
          </button>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search units…"
          className="mt-3 w-full rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-sm outline-none ring-indigo-500/20 placeholder:text-zinc-500 focus:ring-4 dark:border-white/10 dark:bg-white/5 dark:placeholder:text-zinc-400"
        />

        <div className="mt-3 grid max-h-[60dvh] grid-cols-1 gap-2 overflow-auto pr-1 sm:grid-cols-2">
          {list.map((u) => (
            <button
              key={u.id}
              onClick={() => onPick(u.id)}
              className="rounded-xl border border-black/10 bg-white/60 p-3 text-left hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <div className="text-sm font-semibold">{u.label}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">{u.symbol} • {u.id}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function UnitConverterDnd() {
  const seeded = useRef(false);

  const [categoryId, setCategoryId] = useState("length");
  const [fromUnitId, setFromUnitId] = useState("m");
  const [toUnitId, setToUnitId] = useState("ft");
  const [value, setValue] = useState("1");
  const [history, setHistory] = useState<ConverterState["history"]>([]);

  const [picker, setPicker] = useState<{ open: boolean; target: DropTarget | null }>({ open: false, target: null });

  const category = getCategory(categoryId) ?? CATEGORIES[0];

  // Load persisted state once
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const st = loadState();
    if (!st) return;

    setCategoryId(st.categoryId || "length");
    setFromUnitId(st.fromUnitId || "m");
    setToUnitId(st.toUnitId || "ft");
    setValue(st.value ?? "1");
    setHistory(Array.isArray(st.history) ? st.history.slice(0, 20) : []);
  }, []);

  // Ensure units stay within category
  useEffect(() => {
    const cat = getCategory(categoryId);
    if (!cat) return;
    const ids = new Set(cat.units.map((u) => u.id));
    if (!ids.has(fromUnitId)) setFromUnitId(cat.baseUnitId);
    if (!ids.has(toUnitId)) setToUnitId(cat.units.find((u) => u.id !== cat.baseUnitId)?.id ?? cat.baseUnitId);
  }, [categoryId]);

  // Persist
  useEffect(() => {
    const v = Number(value);
    const res = convert(v, fromUnitId, toUnitId);
    const st: ConverterState = {
      categoryId,
      fromUnitId,
      toUnitId,
      value,
      history,
    };
    // Avoid saving NaNs in history updates; state still persists.
    void res;
    saveState(st);
  }, [categoryId, fromUnitId, toUnitId, value, history]);

  const numericValue = Number(value);
  const result = useMemo(() => convert(numericValue, fromUnitId, toUnitId), [numericValue, fromUnitId, toUnitId]);

  const compatibleUnits = useMemo(() => category.units.map((u) => u.id), [category.id]);

  function setUnit(target: DropTarget, unitId: string) {
    const u = getUnit(unitId);
    if (!u) return;
    if (u.category !== categoryId) {
      // Switch category to match the dropped unit
      setCategoryId(u.category);
    }
    if (target === "from") setFromUnitId(unitId);
    else setToUnitId(unitId);
  }

  function commitToHistory() {
    if (!Number.isFinite(result)) return;
    if (!Number.isFinite(numericValue)) return;
    setHistory((prev) => [{ at: Date.now(), categoryId, from: fromUnitId, to: toUnitId, value: numericValue, result }, ...prev].slice(0, 20));
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(80%_60%_at_10%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(244,63,94,0.12),transparent_55%)] px-3 py-4 text-zinc-900 dark:bg-[radial-gradient(80%_60%_at_10%_0%,rgba(99,102,241,0.24),transparent_60%),radial-gradient(60%_50%_at_80%_10%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(80%_70%_at_50%_100%,rgba(244,63,94,0.18),transparent_55%)] dark:text-zinc-50 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold tracking-tight">DragUnits</div>
            <div className="text-xs text-zinc-600 dark:text-zinc-300">Unit converter • drag & drop units into slots</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PresetPill
              title="1 km → mi"
              onClick={() => {
                setCategoryId("length");
                setFromUnitId("km");
                setToUnitId("mi");
                setValue("1");
              }}
            />
            <PresetPill
              title="72 °F → °C"
              onClick={() => {
                setCategoryId("temp");
                setFromUnitId("f");
                setToUnitId("c");
                setValue("72");
              }}
            />
            <PresetPill
              title="5 gal → L"
              onClick={() => {
                setCategoryId("volume");
                setFromUnitId("gal");
                setToUnitId("l");
                setValue("5");
              }}
            />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[360px_1fr]">
          {/* Palette */}
          <aside className="rounded-2xl border border-white/20 bg-white/70 p-4 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Categories</div>
            <div className="mt-2">
              <CategoryTabs categoryId={categoryId} setCategoryId={setCategoryId} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Units</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Drag to slots</div>
            </div>

            <div className="mt-2 space-y-2">
              {category.units.map((u) => (
                <DraggableUnitChip key={u.id} unitId={u.id} />
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-black/10 bg-white/40 p-3 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
              Tip: drop any unit on either slot. If it’s from a different category, we’ll switch categories automatically.
            </div>
          </aside>

          {/* Canvas */}
          <main className="rounded-2xl border border-white/20 bg-white/70 shadow-[0_20px_80px_-30px_rgba(0,0,0,0.35)] backdrop-blur dark:border-white/10 dark:bg-zinc-900/60">
            <div className="border-b border-black/10 px-4 py-3 dark:border-white/10">
              <div className="text-sm font-semibold tracking-tight">Conversion canvas</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">Build a conversion by dragging units into the slots.</div>
            </div>

            <div className="p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
                <DropSlot
                  label="From"
                  unitId={fromUnitId}
                  onDropUnit={(id) => setUnit("from", id)}
                  onClick={() => setPicker({ open: true, target: "from" })}
                />

                <div className="flex items-center justify-center">
                  <button
                    onClick={() => {
                      setFromUnitId(toUnitId);
                      setToUnitId(fromUnitId);
                    }}
                    className="rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm font-semibold shadow-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                    title="Swap"
                  >
                    ⇄
                  </button>
                </div>

                <DropSlot
                  label="To"
                  unitId={toUnitId}
                  onDropUnit={(id) => setUnit("to", id)}
                  onClick={() => setPicker({ open: true, target: "to" })}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Value</div>
                  <div className="mt-2 flex items-end gap-3">
                    <input
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      inputMode="decimal"
                      className="w-full rounded-2xl border border-black/10 bg-white/70 px-3 py-3 text-lg font-semibold outline-none ring-indigo-500/20 focus:ring-4 dark:border-white/10 dark:bg-white/10"
                      placeholder="0"
                    />
                    <button
                      onClick={commitToHistory}
                      className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                    Category: <span className="font-semibold">{category.label}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">Result</div>
                  <div className="mt-2 rounded-2xl bg-black/5 p-4 dark:bg-white/10">
                    <div className="text-3xl font-semibold tracking-tight">{formatNumber(result)}</div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                      {getUnit(fromUnitId)?.symbol} → {getUnit(toUnitId)?.symbol}
                    </div>
                  </div>
                  {!Number.isFinite(result) ? (
                    <div className="mt-2 text-xs text-rose-700 dark:text-rose-200">Pick units from the same category.</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-black/10 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">History</div>
                  <button
                    onClick={() => setHistory([])}
                    className="rounded-xl border border-black/10 bg-white/70 px-3 py-1.5 text-xs font-semibold hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                  >
                    Clear
                  </button>
                </div>

                {history.length ? (
                  <div className="mt-3 space-y-2">
                    {history.map((h) => (
                      <button
                        key={h.at}
                        onClick={() => {
                          setCategoryId(h.categoryId);
                          setFromUnitId(h.from);
                          setToUnitId(h.to);
                          setValue(String(h.value));
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-black/10 bg-white/60 px-3 py-2 text-left text-sm hover:bg-white dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                      >
                        <div className="min-w-0">
                          <div className="line-clamp-1 font-semibold">
                            {h.value} {getUnit(h.from)?.symbol} → {formatNumber(h.result)} {getUnit(h.to)?.symbol}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-300">{getCategory(h.categoryId)?.label}</div>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{formatTime(h.at)}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 rounded-xl border border-dashed border-black/15 p-4 text-sm text-zinc-600 dark:border-white/15 dark:text-zinc-300">
                    No saved conversions yet. Hit <span className="font-semibold">Save</span> to add one.
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Accessibility fallback: use the Pick buttons (drag & drop works best on desktop).
              </div>
            </div>
          </main>
        </div>
      </div>

      <UnitPickerModal
        open={picker.open}
        category={getCategory(categoryId) ?? CATEGORIES[0]}
        onPick={(id) => {
          if (picker.target) setUnit(picker.target, id);
          setPicker({ open: false, target: null });
        }}
        onClose={() => setPicker({ open: false, target: null })}
      />
    </div>
  );
}
