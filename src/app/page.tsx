"use client";

import { useState, useMemo } from "react";
import { Recipe, DietaryPreference, GroceryItem } from "@/types";
import { recipes, dietaryOptions } from "@/data/recipes";

export default function MealPlanner() {
  const [selectedPreferences, setSelectedPreferences] = useState<DietaryPreference[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [activeTab, setActiveTab] = useState<"preferences" | "recipes" | "grocery">("preferences");
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const filteredRecipes = useMemo(() => {
    if (selectedPreferences.length === 0) return recipes;
    return recipes.filter(recipe => 
      selectedPreferences.some(pref => recipe.tags.includes(pref))
    );
  }, [selectedPreferences]);

  const groceryList = useMemo(() => {
    const items = new Map<string, GroceryItem>();
    selectedRecipes.forEach(recipe => {
      recipe.ingredients.forEach(ing => {
        const key = ing.name + "-" + ing.category;
        if (items.has(key)) {
          items.get(key)!.recipeIds.push(recipe.id);
        } else {
          items.set(key, { ...ing, checked: checkedItems.has(key), recipeIds: [recipe.id] });
        }
      });
    });
    return Array.from(items.values()).sort((a, b) => {
      const order = { produce: 0, protein: 1, dairy: 2, pantry: 3, frozen: 4, other: 5 };
      return order[a.category] - order[b.category];
    });
  }, [selectedRecipes, checkedItems]);

  const togglePreference = (pref: DietaryPreference) => {
    setSelectedPreferences(prev => prev.includes(pref) ? prev.filter(p => p !== pref) : [...prev, pref]);
  };

  const toggleRecipe = (recipe: Recipe) => {
    setSelectedRecipes(prev => prev.find(r => r.id === recipe.id) ? prev.filter(r => r.id !== recipe.id) : [...prev, recipe]);
  };

  const toggleGroceryItem = (key: string) => {
    setCheckedItems(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  const categoryLabels: Record<string, string> = {
    produce: "Produce", protein: "Protein", dairy: "Dairy", pantry: "Pantry", frozen: "Frozen", other: "Other"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl">🍽️</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Meal Planner</h1>
                <p className="text-sm text-gray-500">Personalized recipes & grocery lists</p>
              </div>
            </div>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {[{ id: "preferences", label: "Preferences", icon: "🎯" }, { id: "recipes", label: "Recipes (" + filteredRecipes.length + ")", icon: "📖" }, { id: "grocery", label: "Grocery (" + groceryList.length + ")", icon: "🛒" }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={"px-4 py-2 rounded-md text-sm font-medium transition-all " + (activeTab === tab.id ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600 hover:text-gray-900")}>
                  <span className="mr-1">{tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "preferences" && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">What&apos;s your dietary style?</h2>
              <p className="text-gray-600 max-w-md mx-auto">Select your preferences to get personalized recipe recommendations</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dietaryOptions.map(option => {
                const isSelected = selectedPreferences.includes(option.value);
                return (
                  <button key={option.value} onClick={() => togglePreference(option.value)} className={"p-5 rounded-2xl border-2 text-left transition-all duration-200 " + (isSelected ? "border-emerald-500 bg-emerald-50 shadow-md" : "border-gray-200 bg-white hover:border-emerald-200")}>
                    <div className="text-3xl mb-3">{option.emoji}</div>
                    <div className="font-semibold text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{option.description}</div>
                    {isSelected && <div className="mt-3 text-emerald-600 text-sm font-medium">Selected</div>}
                  </button>
                );
              })}
            </div>
            {selectedPreferences.length > 0 && (
              <div className="flex justify-center pt-4">
                <button onClick={() => setActiveTab("recipes")} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg">See {filteredRecipes.length} Recipes →</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "recipes" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Recipes</h2>
                <p className="text-gray-600">{selectedPreferences.length > 0 ? "Based on: " + selectedPreferences.map(p => dietaryOptions.find(o => o.value === p)?.label).join(", ") : "Showing all recipes"}</p>
              </div>
              <div className="text-sm text-gray-500">{selectedRecipes.length} selected</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRecipes.map(recipe => {
                const isSelected = selectedRecipes.find(r => r.id === recipe.id);
                const isExpanded = expandedRecipe === recipe.id;
                return (
                  <div key={recipe.id} className={"bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden " + (isSelected ? "border-emerald-500 shadow-lg" : "border-gray-200 hover:border-emerald-200")}>
                    <div className={"h-32 " + recipe.imageColor + " flex items-center justify-center"}><span className="text-5xl">🍽️</span></div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{recipe.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">{recipe.description}</p>
                        </div>
                        <button onClick={() => toggleRecipe(recipe)} className={"w-8 h-8 rounded-full flex items-center justify-center transition-colors " + (isSelected ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-emerald-100")}>{isSelected ? "✓" : "+"}</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {recipe.tags.map(tag => <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{dietaryOptions.find(o => o.value === tag)?.label}</span>)}
                      </div>
                      <div className="flex gap-4 mt-4 text-sm text-gray-500">
                        <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                        <span>🔥 {recipe.calories} cal</span>
                        <span>👥 {recipe.servings} srv</span>
                      </div>
                      <button onClick={() => setExpandedRecipe(isExpanded ? null : recipe.id)} className="mt-4 text-emerald-600 text-sm font-medium hover:text-emerald-700">{isExpanded ? "Hide details" : "View recipe"}</button>
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Ingredients</h4>
                            <ul className="space-y-1">
                              {recipe.ingredients.map((ing, i) => <li key={i} className="text-sm text-gray-600">• {ing.amount} {ing.name}</li>)}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                            <ol className="space-y-2">
                              {recipe.instructions.map((step, i) => <li key={i} className="text-sm text-gray-600">{i + 1}. {step}</li>)}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {selectedRecipes.length > 0 && (
              <div className="flex justify-center pt-4">
                <button onClick={() => setActiveTab("grocery")} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-lg">Generate Grocery List ({groceryList.length} items) →</button>
              </div>
            )}
          </div>
        )}

        {activeTab === "grocery" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Grocery List</h2>
                <p className="text-gray-600">From {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setCheckedItems(new Set())} className="text-sm text-gray-500 hover:text-gray-700">Clear checked</button>
            </div>
            {groceryList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <div className="text-5xl mb-4">🛒</div>
                <h3 className="text-lg font-semibold text-gray-900">No items yet</h3>
                <button onClick={() => setActiveTab("recipes")} className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Browse Recipes</button>
              </div>
            ) : (
              <div className="space-y-4">
                {["produce", "protein", "dairy", "pantry", "frozen", "other"].map(category => {
                  const items = groceryList.filter(item => item.category === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100"><h3 className="font-semibold text-gray-900">{categoryLabels[category]}</h3></div>
                      <div className="divide-y divide-gray-100">
                        {items.map((item, i) => {
                          const key = item.name + "-" + item.category;
                          const isChecked = checkedItems.has(key);
                          return (
                            <label key={i} className={"flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 " + (isChecked ? "opacity-50" : "")}>
                              <input type="checkbox" checked={isChecked} onChange={() => toggleGroceryItem(key)} className="w-5 h-5 rounded border-gray-300 text-emerald-600" />
                              <div className="flex-1">
                                <span className={isChecked ? "line-through text-gray-400" : "text-gray-900"}>{item.name}</span>
                                <span className="text-gray-500 ml-2">({item.amount})</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-emerald-900">{groceryList.length - checkedItems.size} items remaining</div>
                      <div className="text-sm text-emerald-700">{checkedItems.size} checked off</div>
                    </div>
                    <div className="text-3xl">{checkedItems.size === groceryList.length ? "🎉" : "📝"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
