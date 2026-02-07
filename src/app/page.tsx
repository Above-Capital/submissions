"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { AppState, Entry, Food, ID, Meal } from "@/lib/types";
import { AddEntryModal } from "@/components/AddEntryModal";
import { MacroBar } from "@/components/MacroBar";
import { TrendChart } from "@/components/TrendChart";
import { Badge, Button, Icon } from "@/components/ui";
import { defaultState, downloadJSON, loadState, saveState } from "@/lib/storage";
import {
  addDays,
  clamp,
  formatDateLabel,
  meals,
  round0,
  round1,
  scoreDay,
  totalsForEntries,
  todayYYYYMMDD,
} from "@/lib/utils";

const iconPlus = "M12 5v14M5 12h14";
const iconExport = "M12 3v12m0 0 4-4m-4 4-4-4M4 21h16";
const iconImport = "M12 21V9m0 0 4 4m-4-4-4 4M4 3h16";
const iconLeft = "M15 18l-6-6 6-6";
const iconRight = "M9 18l6-6-6-6";

function groupByMeal(entries: Entry[]) {
  const map = new Map<Meal, Entry[]>();
  for (const m of meals()) map.set(m, []);
  for (const e of entries) map.get(e.meal)?.push(e);
  return map;
}

export default function Home() {
  const [state, setState] = useState<AppState>(() => defaultState());

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const foodsById = useMemo(() => {
    const m = new Map<ID, Food>();
    for (const f of state.foods) m.set(f.id, f);
    return m;
  }, [state.foods]);

  const date = state.ui.selectedDate;
  const todaysEntries = useMemo(
    () => state.entries.filter((e) => e.date === date),
    [state.entries, date]
  );

  const totals = useMemo(
    () => totalsForEntries(todaysEntries, foodsById),
    [todaysEntries, foodsById]
  );

  const remaining = {
    calories: state.targets.calories - totals.calories,
    protein: state.targets.protein - totals.protein,
    carbs: state.targets.carbs - totals.carbs,
    fat: state.targets.fat - totals.fat,
  };

  const byMeal = useMemo(() => groupByMeal(todaysEntries), [todaysEntries]);

  const favorites = useMemo(
    () => state.foods.filter((f) => f.favorite),
    [state.foods]
  );

  function openAdd(meal: Meal) {
    setState((s) => ({
      ...s,
      ui: { ...s.ui, showAdd: true, selectedMeal: meal },
    }));
  }

  function addEntry(entry: Entry) {
    setState((s) => ({ ...s, entries: [...s.entries, entry] }));
  }

  function deleteEntry(id: ID) {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }

  function toggleFavorite(foodId: ID) {
    setState((s) => ({
      ...s,
      foods: s.foods.map((f) => (f.id === foodId ? { ...f, favorite: !f.favorite } : f)),
    }));
  }

  function onNewFood(food: Food) {
    setState((s) => ({ ...s, foods: [food, ...s.foods] }));
  }

  function exportData() {
    const json = JSON.stringify(state, null, 2);
    downloadJSON(`calorie-tracker-export-${new Date().toISOString().slice(0, 10)}.json`, json);
  }

  async function importData(file: File) {
    const text = await file.text();
    const parsed = JSON.parse(text) as AppState;
    if (!parsed || parsed.version !== 1) {
      alert("Invalid file (expected v1 state). ");
      return;
    }
    setState({ ...defaultState(), ...parsed });
  }

  const sevenDays = useMemo(() => {
    const days: { label: string; calories: number; score: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(date, -i);
      const entries = state.entries.filter((e) => e.date === d);
      const t = totalsForEntries(entries, foodsById);
      days.push({
        label: new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" }),
        calories: t.calories,
        score: scoreDay({
          calories: t.calories,
          protein: t.protein,
          carbs: t.carbs,
          fat: t.fat,
        }, state.targets),
      });
    }
    return days;
  }, [state.entries, foodsById, state.targets, date]);

  const adherenceStreak = useMemo(() => {
    // count consecutive days (ending today) that are reasonably close
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(todayYYYYMMDD(), -i);
      const entries = state.entries.filter((e) => e.date === d);
      const t = totalsForEntries(entries, foodsById);
      const s = scoreDay({
        calories: t.calories,
        protein: t.protein,
        carbs: t.carbs,
        fat: t.fat,
      }, state.targets);
      if (s >= 0.75) streak++;
      else break;
    }
    return streak;
  }, [state.entries, foodsById, state.targets]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900 dark:from-black dark:to-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <header className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Calorie Tracker</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Offline-first · meal logging · macros · insights · Ctrl/Cmd+E export
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={exportData} title="Export JSON">
                <Icon path={iconExport} className="h-4 w-4" />
                Export
              </Button>
              <label className="inline-flex">
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importData(f);
                    e.currentTarget.value = "";
                  }}
                />
                <span>
                  <Button variant="secondary" onClick={() => {}} title="Import JSON">
                    <Icon path={iconImport} className="h-4 w-4" />
                    Import
                  </Button>
                </span>
              </label>
              <Button variant="ghost" onClick={() => setState(defaultState())}>
                Reset
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    ui: { ...s.ui, selectedDate: addDays(s.ui.selectedDate, -1) },
                  }))
                }
                title="Previous day"
              >
                <Icon path={iconLeft} className="h-4 w-4" />
              </Button>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold dark:border-zinc-800 dark:bg-zinc-950">
                {formatDateLabel(date)}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    ui: { ...s.ui, selectedDate: addDays(s.ui.selectedDate, 1) },
                  }))
                }
                title="Next day"
              >
                <Icon path={iconRight} className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    ui: { ...s.ui, selectedDate: todayYYYYMMDD() },
                  }))
                }
              >
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge>Streak: {adherenceStreak}d</Badge>
              <Badge>
                Remaining: {round0(remaining.calories)} kcal
              </Badge>
            </div>
          </div>
        </header>

        <main className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="grid gap-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    Today
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Calories + macros vs targets
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Calories</div>
                  <div className="mt-0.5 text-2xl font-semibold tabular-nums">
                    {round0(totals.calories)}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Target {round0(state.targets.calories)}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <MacroBar label="Protein" value={totals.protein} target={state.targets.protein} color="bg-emerald-500" />
                <MacroBar label="Carbs" value={totals.carbs} target={state.targets.carbs} color="bg-sky-500" />
                <MacroBar label="Fat" value={totals.fat} target={state.targets.fat} color="bg-amber-500" />
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-900 dark:bg-black/30 dark:text-zinc-200">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-semibold">Targets</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const c = Number(prompt("Calorie target?", String(state.targets.calories)) ?? state.targets.calories);
                        const p = Number(prompt("Protein (g)?", String(state.targets.protein)) ?? state.targets.protein);
                        const ca = Number(prompt("Carbs (g)?", String(state.targets.carbs)) ?? state.targets.carbs);
                        const f = Number(prompt("Fat (g)?", String(state.targets.fat)) ?? state.targets.fat);
                        setState((s) => ({
                          ...s,
                          targets: {
                            calories: Math.max(0, c),
                            protein: Math.max(0, p),
                            carbs: Math.max(0, ca),
                            fat: Math.max(0, f),
                          },
                        }));
                      }}
                    >
                      Edit targets
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4">
              {meals().map((m) => {
                const list = byMeal.get(m) ?? [];
                const t = totalsForEntries(list, foodsById);
                return (
                  <section
                    key={m}
                    className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                          {m}
                        </h3>
                        <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          {round0(t.calories)} kcal · P {round0(t.protein)} · C {round0(t.carbs)} · F {round0(t.fat)}
                        </div>
                      </div>
                      <Button onClick={() => openAdd(m)} title={`Add to ${m}`}>
                        <Icon path={iconPlus} className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    <div className="mt-4 grid gap-2">
                      {list.length ? (
                        list
                          .slice()
                          .sort((a, b) => b.createdAt - a.createdAt)
                          .map((e) => {
                            const f = foodsById.get(e.foodId);
                            if (!f) return null;
                            return (
                              <div
                                key={e.id}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-900 dark:bg-black/30"
                              >
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {f.name}
                                  </div>
                                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                                    {round1(e.servings)}× · {f.servingName} · {round0(f.calories * e.servings)} kcal
                                    {e.notes ? ` · ${e.notes}` : ""}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    onClick={() => toggleFavorite(f.id)}
                                    title="Toggle favorite"
                                  >
                                    {f.favorite ? "★" : "☆"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => deleteEntry(e.id)}
                                    title="Delete"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-xs text-zinc-600 dark:border-zinc-900 dark:bg-black/30 dark:text-zinc-300">
                          No entries yet.
                        </div>
                      )}
                    </div>

                    {favorites.length ? (
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          Favorites
                        </div>
                        {favorites.slice(0, 8).map((f) => (
                          <button
                            key={f.id}
                            onClick={() => {
                              openAdd(m);
                              // modal handles picking; keep lightweight
                            }}
                            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
                            title="Open add entry"
                          >
                            ★ {f.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </section>
          </section>

          <aside className="grid gap-6">
            <TrendChart values={sevenDays} target={state.targets.calories} />

            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Notes
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Everything is stored locally (no account, no backend).</li>
                <li>Export/import JSON lets you move devices.</li>
                <li>Macros are per-serving estimates — keep it simple.</li>
              </ul>

              <div className="mt-4 flex items-center gap-2">
                <Button variant="secondary" onClick={exportData}>
                  Export JSON
                </Button>
                <Button variant="ghost" onClick={() => setState(defaultState())}>
                  Reset
                </Button>
              </div>
            </section>
          </aside>
        </main>

        <AddEntryModal
          open={state.ui.showAdd}
          date={state.ui.selectedDate}
          foods={state.foods.slice().sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))}
          meal={state.ui.selectedMeal}
          onClose={() => setState((s) => ({ ...s, ui: { ...s.ui, showAdd: false } }))}
          onAdd={addEntry}
          onNewFood={onNewFood}
        />

        <footer className="mt-10 text-xs text-zinc-500 dark:text-zinc-500">
          Built for OpenClaw Arena · Frontend-only · Next.js + Tailwind · Offline-first
        </footer>
      </div>
    </div>
  );
}
