import React, { useMemo, useState } from "react";
import type { Entry, Food, ID, Meal } from "@/lib/types";
import { Button, Input, Textarea } from "@/components/ui";
import { clamp, meals, uid } from "@/lib/utils";

export function AddEntryModal({
  open,
  date,
  foods,
  meal,
  onClose,
  onAdd,
  onNewFood,
}: {
  open: boolean;
  date: string;
  foods: Food[];
  meal: Meal;
  onClose: () => void;
  onAdd: (entry: Entry) => void;
  onNewFood: (food: Food) => void;
}) {
  const [q, setQ] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<ID | null>(null);
  const [servings, setServings] = useState(1);
  const [notes, setNotes] = useState("");
  const [mealLocal, setMealLocal] = useState<Meal>(meal);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const base = foods;
    if (!t) return base;
    return base.filter((f) => {
      const hay = `${f.name} ${f.brand ?? ""}`.toLowerCase();
      return hay.includes(t);
    });
  }, [foods, q]);

  const selected = selectedFoodId
    ? foods.find((f) => f.id === selectedFoodId) ?? null
    : null;

  if (!open) return null;

  function reset() {
    setQ("");
    setSelectedFoodId(null);
    setServings(1);
    setNotes("");
    setMealLocal(meal);
  }

  function add() {
    if (!selectedFoodId) return;
    const now = Date.now();
    const entry: Entry = {
      id: uid("e"),
      date,
      meal: mealLocal,
      foodId: selectedFoodId,
      servings: clamp(servings, 0.25, 20),
      notes,
      createdAt: now,
      updatedAt: now,
    };
    onAdd(entry);
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-3xl rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Add entry
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Pick a food, set servings, then add.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={add} disabled={!selectedFoodId}>
              Add
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Food library
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  const name = prompt("Food name?");
                  if (!name) return;
                  const calories = Number(prompt("Calories per serving?", "100") ?? "100");
                  const protein = Number(prompt("Protein (g)?", "0") ?? "0");
                  const carbs = Number(prompt("Carbs (g)?", "0") ?? "0");
                  const fat = Number(prompt("Fat (g)?", "0") ?? "0");
                  const servingName = prompt("Serving name?", "1 serving") ?? "1 serving";
                  const now = Date.now();
                  const food: Food = {
                    id: uid("f"),
                    name: name.trim(),
                    servingName,
                    calories: Math.max(0, calories),
                    protein: Math.max(0, protein),
                    carbs: Math.max(0, carbs),
                    fat: Math.max(0, fat),
                    favorite: true,
                    createdAt: now,
                  };
                  onNewFood(food);
                  setSelectedFoodId(food.id);
                }}
              >
                + Custom food
              </Button>
            </div>

            <div className="mt-3">
              <Input
                value={q}
                onChange={setQ}
                placeholder="Search foods…"
                ariaLabel="Search foods"
              />
            </div>

            <div className="mt-3 max-h-[340px] overflow-auto rounded-2xl border border-zinc-100 dark:border-zinc-900">
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {filtered.map((f) => {
                  const active = f.id === selectedFoodId;
                  return (
                    <li key={f.id}>
                      <button
                        onClick={() => setSelectedFoodId(f.id)}
                        className={
                          "flex w-full items-start justify-between gap-3 px-3 py-2 text-left transition " +
                          (active
                            ? "bg-zinc-50 dark:bg-black/30"
                            : "hover:bg-zinc-50 dark:hover:bg-black/20")
                        }
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {f.name}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {f.servingName}
                            {f.brand ? ` · ${f.brand}` : ""}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            kcal
                          </div>
                          <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                            {Math.round(f.calories)}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Entry
            </div>

            <div className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  Meal
                </span>
                <select
                  value={mealLocal}
                  onChange={(e) => setMealLocal(e.target.value as Meal)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {meals().map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  Servings
                </span>
                <input
                  type="number"
                  value={servings}
                  min={0.25}
                  max={20}
                  step={0.25}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </label>

              {selected ? (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-900 dark:bg-black/30 dark:text-zinc-200">
                  <div className="font-semibold">{selected.name}</div>
                  <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                    Per {selected.servingName}: {Math.round(selected.calories)} kcal · P {Math.round(selected.protein)}g · C {Math.round(selected.carbs)}g · F {Math.round(selected.fat)}g
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-900 dark:bg-black/30 dark:text-zinc-300">
                  Pick a food on the left.
                </div>
              )}

              <label className="grid gap-1">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  Notes
                </span>
                <Textarea
                  value={notes}
                  onChange={setNotes}
                  placeholder="Optional"
                  rows={4}
                />
              </label>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={add} disabled={!selectedFoodId}>
                  Add entry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
