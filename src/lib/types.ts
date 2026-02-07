export type ID = string;

export type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snacks";

export type Food = {
  id: ID;
  name: string;
  brand?: string;
  // per serving
  servingName: string; // e.g. "1 cup", "100 g"
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  favorite: boolean;
  createdAt: number;
};

export type Entry = {
  id: ID;
  date: string; // YYYY-MM-DD local
  meal: Meal;
  foodId: ID;
  servings: number; // multiplier
  notes: string;
  createdAt: number;
  updatedAt: number;
};

export type Targets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type AppState = {
  version: 1;
  foods: Food[];
  entries: Entry[];
  targets: Targets;
  ui: {
    selectedDate: string; // YYYY-MM-DD
    selectedMeal: Meal;
    search: string;
    showAdd: boolean;
  };
};
