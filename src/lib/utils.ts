import type { Entry, Food, ID, Meal, Targets } from "@/lib/types";

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function round0(n: number) {
  return Math.round(n);
}

export function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(date: string, delta: number) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatDateLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function meals(): Meal[] {
  return ["Breakfast", "Lunch", "Dinner", "Snacks"];
}

export function totalsForEntries(entries: Entry[], foodsById: Map<ID, Food>) {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  for (const e of entries) {
    const f = foodsById.get(e.foodId);
    if (!f) continue;
    const mult = e.servings;
    calories += f.calories * mult;
    protein += f.protein * mult;
    carbs += f.carbs * mult;
    fat += f.fat * mult;
  }
  return { calories, protein, carbs, fat };
}

export function macroKcal({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function scoreDay(totals: Targets, targets: Targets) {
  // how close to calorie target (0..1), with soft tolerance
  const diff = Math.abs(totals.calories - targets.calories);
  const tol = Math.max(150, targets.calories * 0.08);
  const score = Math.max(0, 1 - diff / tol);
  return score;
}
