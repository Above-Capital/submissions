import { Recipe, DietaryPreference } from "@/types";

export const dietaryOptions = [
  { value: "vegan" as DietaryPreference, label: "Vegan", emoji: "🌱", description: "Plant-based, no animal products" },
  { value: "vegetarian" as DietaryPreference, label: "Vegetarian", emoji: "🥗", description: "No meat, may include dairy and eggs" },
  { value: "keto" as DietaryPreference, label: "Keto", emoji: "🥑", description: "Low carb, high fat" },
  { value: "paleo" as DietaryPreference, label: "Paleo", emoji: "🍖", description: "Whole foods, no processed ingredients" },
  { value: "gluten-free" as DietaryPreference, label: "Gluten-Free", emoji: "🌾", description: "No wheat, barley, or rye" },
  { value: "dairy-free" as DietaryPreference, label: "Dairy-Free", emoji: "🥛", description: "No milk or dairy products" },
  { value: "low-carb" as DietaryPreference, label: "Low-Carb", emoji: "🥩", description: "Reduced carbohydrate intake" },
  { value: "mediterranean" as DietaryPreference, label: "Mediterranean", emoji: "🫒", description: "Heart-healthy fats, lean proteins" },
];

export const recipes: Recipe[] = [
  {
    id: "v1",
    name: "Quinoa Buddha Bowl",
    description: "Nutrient-packed bowl with roasted vegetables and tahini dressing",
    prepTime: 15, cookTime: 25, servings: 2, calories: 420,
    tags: ["vegan", "gluten-free"],
    ingredients: [
      { name: "Quinoa", amount: "1 cup", category: "pantry" },
      { name: "Sweet potato", amount: "1 large", category: "produce" },
      { name: "Chickpeas", amount: "1 can", category: "pantry" },
      { name: "Avocado", amount: "1", category: "produce" },
      { name: "Spinach", amount: "2 cups", category: "produce" },
      { name: "Tahini", amount: "3 tbsp", category: "pantry" },
      { name: "Lemon", amount: "1", category: "produce" },
    ],
    instructions: ["Cook quinoa", "Roast sweet potato and chickpeas", "Make tahini dressing", "Assemble bowl"],
    imageColor: "bg-orange-100"
  },
  {
    id: "v2",
    name: "Lentil Curry",
    description: "Hearty red lentil curry with coconut milk",
    prepTime: 10, cookTime: 30, servings: 4, calories: 380,
    tags: ["vegan", "gluten-free", "dairy-free"],
    ingredients: [
      { name: "Red lentils", amount: "1.5 cups", category: "pantry" },
      { name: "Coconut milk", amount: "1 can", category: "pantry" },
      { name: "Onion", amount: "1", category: "produce" },
      { name: "Garlic", amount: "4 cloves", category: "produce" },
      { name: "Curry powder", amount: "2 tbsp", category: "pantry" },
      { name: "Tomatoes", amount: "1 can", category: "pantry" },
      { name: "Spinach", amount: "2 cups", category: "produce" },
    ],
    instructions: ["Sauté aromatics", "Add spices", "Simmer lentils", "Add spinach"],
    imageColor: "bg-yellow-100"
  },
  {
    id: "k1",
    name: "Garlic Butter Salmon",
    description: "Pan-seared salmon with herb garlic butter",
    prepTime: 10, cookTime: 15, servings: 2, calories: 450,
    tags: ["keto", "low-carb", "gluten-free"],
    ingredients: [
      { name: "Salmon fillets", amount: "2", category: "protein" },
      { name: "Butter", amount: "4 tbsp", category: "dairy" },
      { name: "Garlic", amount: "4 cloves", category: "produce" },
      { name: "Lemon", amount: "1", category: "produce" },
      { name: "Asparagus", amount: "1 bunch", category: "produce" },
    ],
    instructions: ["Season salmon", "Sear skin-side down", "Make garlic butter", "Serve with asparagus"],
    imageColor: "bg-red-100"
  },
  {
    id: "k2",
    name: "Zucchini Noodle Alfredo",
    description: "Creamy alfredo over spiralized zucchini",
    prepTime: 15, cookTime: 10, servings: 2, calories: 280,
    tags: ["keto", "low-carb", "vegetarian"],
    ingredients: [
      { name: "Zucchini", amount: "3 large", category: "produce" },
      { name: "Heavy cream", amount: "1/2 cup", category: "dairy" },
      { name: "Parmesan", amount: "1/2 cup", category: "dairy" },
      { name: "Garlic", amount: "3 cloves", category: "produce" },
      { name: "Butter", amount: "2 tbsp", category: "dairy" },
    ],
    instructions: ["Spiralize zucchini", "Make cream sauce", "Sauté noodles", "Toss together"],
    imageColor: "bg-green-100"
  },
  {
    id: "p1",
    name: "Grilled Chicken Chimichurri",
    description: "Juicy grilled chicken with fresh herb sauce",
    prepTime: 15, cookTime: 20, servings: 4, calories: 320,
    tags: ["paleo", "gluten-free", "dairy-free", "low-carb"],
    ingredients: [
      { name: "Chicken thighs", amount: "4", category: "protein" },
      { name: "Parsley", amount: "1 cup", category: "produce" },
      { name: "Olive oil", amount: "1/2 cup", category: "pantry" },
      { name: "Red wine vinegar", amount: "3 tbsp", category: "pantry" },
      { name: "Garlic", amount: "4 cloves", category: "produce" },
    ],
    instructions: ["Season chicken", "Grill 8-10 min per side", "Blend chimichurri", "Serve together"],
    imageColor: "bg-emerald-100"
  },
  {
    id: "p2",
    name: "Sweet Potato Hash",
    description: "Savory breakfast hash with peppers",
    prepTime: 10, cookTime: 25, servings: 3, calories: 290,
    tags: ["paleo", "vegan", "gluten-free", "dairy-free"],
    ingredients: [
      { name: "Sweet potatoes", amount: "3", category: "produce" },
      { name: "Bell peppers", amount: "2", category: "produce" },
      { name: "Onion", amount: "1", category: "produce" },
      { name: "Olive oil", amount: "3 tbsp", category: "pantry" },
    ],
    instructions: ["Dice potatoes", "Sauté until brown", "Add peppers", "Season and serve"],
    imageColor: "bg-orange-100"
  },
  {
    id: "gf1",
    name: "Spanish Rice Bowl",
    description: "Flavorful rice with black beans",
    prepTime: 10, cookTime: 25, servings: 4, calories: 380,
    tags: ["gluten-free", "vegetarian", "dairy-free"],
    ingredients: [
      { name: "Rice", amount: "1.5 cups", category: "pantry" },
      { name: "Black beans", amount: "1 can", category: "pantry" },
      { name: "Tomatoes", amount: "1 can", category: "pantry" },
      { name: "Bell pepper", amount: "1", category: "produce" },
      { name: "Avocado", amount: "2", category: "produce" },
      { name: "Lime", amount: "2", category: "produce" },
    ],
    instructions: ["Toast rice with cumin", "Add tomatoes", "Simmer 20 min", "Top with avocado"],
    imageColor: "bg-red-100"
  },
  {
    id: "m1",
    name: "Greek Chicken Bowls",
    description: "Mediterranean chicken with tzatziki",
    prepTime: 15, cookTime: 20, servings: 4, calories: 420,
    tags: ["mediterranean", "low-carb", "gluten-free"],
    ingredients: [
      { name: "Chicken breast", amount: "1.5 lbs", category: "protein" },
      { name: "Cucumber", amount: "1", category: "produce" },
      { name: "Greek yogurt", amount: "1 cup", category: "dairy" },
      { name: "Cherry tomatoes", amount: "2 cups", category: "produce" },
      { name: "Kalamata olives", amount: "1/2 cup", category: "pantry" },
      { name: "Lemon", amount: "2", category: "produce" },
    ],
    instructions: ["Marinate chicken", "Grill until done", "Make tzatziki", "Serve with veggies"],
    imageColor: "bg-blue-100"
  },
  {
    id: "m2",
    name: "Mediterranean Lentil Soup",
    description: "Hearty soup with vegetables",
    prepTime: 15, cookTime: 40, servings: 6, calories: 280,
    tags: ["mediterranean", "vegan", "dairy-free", "gluten-free"],
    ingredients: [
      { name: "Brown lentils", amount: "1.5 cups", category: "pantry" },
      { name: "Carrots", amount: "3", category: "produce" },
      { name: "Celery", amount: "3 stalks", category: "produce" },
      { name: "Vegetable broth", amount: "6 cups", category: "pantry" },
      { name: "Spinach", amount: "2 cups", category: "produce" },
      { name: "Lemon", amount: "1", category: "produce" },
    ],
    instructions: ["Sauté vegetables", "Add lentils and broth", "Simmer 30 min", "Add spinach"],
    imageColor: "bg-yellow-100"
  },
  {
    id: "lc1",
    name: "Egg Roll in a Bowl",
    description: "Egg roll flavors without the wrapper",
    prepTime: 10, cookTime: 15, servings: 4, calories: 260,
    tags: ["low-carb", "keto", "gluten-free", "dairy-free"],
    ingredients: [
      { name: "Ground pork", amount: "1 lb", category: "protein" },
      { name: "Coleslaw mix", amount: "14 oz", category: "produce" },
      { name: "Garlic", amount: "3 cloves", category: "produce" },
      { name: "Soy sauce", amount: "3 tbsp", category: "pantry" },
      { name: "Sesame oil", amount: "1 tbsp", category: "pantry" },
    ],
    instructions: ["Brown pork", "Add garlic", "Stir-fry cabbage", "Add sauces"],
    imageColor: "bg-amber-100"
  },
  {
    id: "df1",
    name: "Thai Coconut Soup",
    description: "Creamy soup with lemongrass",
    prepTime: 15, cookTime: 20, servings: 4, calories: 240,
    tags: ["dairy-free", "gluten-free", "paleo"],
    ingredients: [
      { name: "Shrimp", amount: "1 lb", category: "protein" },
      { name: "Coconut milk", amount: "2 cans", category: "pantry" },
      { name: "Lemongrass", amount: "2 stalks", category: "produce" },
      { name: "Lime", amount: "2", category: "produce" },
      { name: "Chili", amount: "1", category: "produce" },
    ],
    instructions: ["Simmer coconut milk", "Add aromatics", "Add shrimp", "Finish with lime"],
    imageColor: "bg-teal-100"
  },
  {
    id: "veg1",
    name: "Mushroom Risotto",
    description: "Creamy risotto with mixed mushrooms",
    prepTime: 10, cookTime: 35, servings: 4, calories: 380,
    tags: ["vegetarian", "gluten-free"],
    ingredients: [
      { name: "Arborio rice", amount: "1.5 cups", category: "pantry" },
      { name: "Mixed mushrooms", amount: "1 lb", category: "produce" },
      { name: "Parmesan", amount: "1/2 cup", category: "dairy" },
      { name: "White wine", amount: "1/2 cup", category: "pantry" },
      { name: "Vegetable broth", amount: "4 cups", category: "pantry" },
      { name: "Butter", amount: "3 tbsp", category: "dairy" },
    ],
    instructions: ["Sauté mushrooms", "Toast rice", "Add wine", "Stir in broth gradually"],
    imageColor: "bg-stone-100"
  },
];
