export type DietaryPreference = 
  | "vegan" 
  | "vegetarian" 
  | "keto" 
  | "paleo" 
  | "gluten-free" 
  | "dairy-free" 
  | "low-carb" 
  | "mediterranean";

export interface Ingredient {
  name: string;
  amount: string;
  category: "produce" | "protein" | "dairy" | "pantry" | "frozen" | "other";
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  calories: number;
  tags: DietaryPreference[];
  ingredients: Ingredient[];
  instructions: string[];
  imageColor: string;
}

export interface MealPlan {
  recipes: Recipe[];
  groceryList: GroceryItem[];
}

export interface GroceryItem extends Ingredient {
  checked: boolean;
  recipeIds: string[];
}
