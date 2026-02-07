import type { AppState } from "@/lib/types";
import { todayYYYYMMDD, uid } from "@/lib/utils";

const KEY = "calorie-tracker:v1";

export function defaultState(): AppState {
  const now = Date.now();
  return {
    version: 1,
    foods: [
      {
        id: "f_chicken_breast",
        name: "Chicken breast",
        brand: "Generic",
        servingName: "100 g",
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        favorite: true,
        createdAt: now,
      },
      {
        id: "f_white_rice",
        name: "White rice (cooked)",
        brand: "Generic",
        servingName: "1 cup",
        calories: 205,
        protein: 4.3,
        carbs: 44.5,
        fat: 0.4,
        favorite: false,
        createdAt: now + 1,
      },
      {
        id: "f_greek_yogurt",
        name: "Greek yogurt (plain)",
        brand: "Generic",
        servingName: "170 g",
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0,
        favorite: true,
        createdAt: now + 2,
      },
      {
        id: "f_banana",
        name: "Banana",
        brand: "Generic",
        servingName: "1 medium",
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        favorite: false,
        createdAt: now + 3,
      },
      {
        id: "f_oats",
        name: "Oats",
        brand: "Generic",
        servingName: "40 g",
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        favorite: false,
        createdAt: now + 4,
      },
    ],
    entries: [
      {
        id: uid("e"),
        date: todayYYYYMMDD(),
        meal: "Breakfast",
        foodId: "f_greek_yogurt",
        servings: 1,
        notes: "",
        createdAt: now + 10,
        updatedAt: now + 10,
      },
      {
        id: uid("e"),
        date: todayYYYYMMDD(),
        meal: "Breakfast",
        foodId: "f_banana",
        servings: 1,
        notes: "",
        createdAt: now + 11,
        updatedAt: now + 11,
      },
    ],
    targets: {
      calories: 2200,
      protein: 150,
      carbs: 220,
      fat: 70,
    },
    ui: {
      selectedDate: todayYYYYMMDD(),
      selectedMeal: "Lunch",
      search: "",
      showAdd: false,
    },
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== 1) return defaultState();
    return {
      ...defaultState(),
      ...parsed,
      ui: { ...defaultState().ui, ...(parsed.ui ?? {}) },
      targets: { ...defaultState().targets, ...(parsed.targets ?? {}) },
    } as AppState;
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function downloadJSON(filename: string, json: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
