/**
 * PizzaPro — Recipe Data & Calculation Engine
 *
 * All weights are per-pizza base values in grams/ml.
 * Hydration, fermentation, and bake instructions adjust based on oven temp.
 */

const PIZZA_RECIPES = {
  neapolitan: {
    name: "Neapolitan",
    ballWeight: 250, // g total dough ball
    hydration: 0.65,
    saltPct: 0.03,
    oilPct: 0,
    sugarPct: 0,
    yeastPct: 0.003,
    diameter: '10–12 inches',
    sauce: [
      { ingredient: "San Marzano Tomatoes (crushed)", base: 80, unit: "g" },
      { ingredient: "Sea Salt", base: 1, unit: "g" },
      { ingredient: "Fresh Basil Leaves", base: 3, unit: "leaves" },
      { ingredient: "Extra Virgin Olive Oil", base: 5, unit: "ml" },
    ],
    toppings: [
      { ingredient: "Fresh Mozzarella", amount: "100 g" },
      { ingredient: "Fresh Basil", amount: "4–5 leaves" },
      { ingredient: "Extra Virgin Olive Oil", amount: "drizzle" },
    ],
    idealTemp: { min: 800, max: 950 }, // °F
    bakeTime: { hot: "60–90 seconds", medium: "4–6 minutes", low: "8–12 minutes" },
    tips: [
      "Use Tipo 00 flour for the most authentic texture.",
      "Let the dough ferment 8–24 hours at room temperature for best flavor.",
      "Stretch by hand — never use a rolling pin for Neapolitan.",
      "The center should be soft and slightly charred on the edges.",
    ],
  },

  "new-york": {
    name: "New York Style",
    ballWeight: 310,
    hydration: 0.63,
    saltPct: 0.025,
    oilPct: 0.03,
    sugarPct: 0.02,
    yeastPct: 0.005,
    diameter: '14–16 inches',
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 100, unit: "g" },
      { ingredient: "Garlic (minced)", base: 3, unit: "g" },
      { ingredient: "Dried Oregano", base: 1, unit: "g" },
      { ingredient: "Salt", base: 2, unit: "g" },
      { ingredient: "Sugar", base: 2, unit: "g" },
      { ingredient: "Olive Oil", base: 5, unit: "ml" },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella (shredded)", amount: "150 g" },
      { ingredient: "Grated Parmesan", amount: "15 g" },
    ],
    idealTemp: { min: 500, max: 550 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    tips: [
      "Use high-gluten bread flour for that classic chewy bite.",
      "Cold-ferment the dough 24–72 hours for deep flavor.",
      "Stretch the dough thin — it should be foldable when done.",
      "Bake on a preheated pizza steel for best results.",
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    ballWeight: 380,
    hydration: 0.72,
    saltPct: 0.025,
    oilPct: 0.04,
    sugarPct: 0.02,
    yeastPct: 0.006,
    diameter: '10×14 inch pan',
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 120, unit: "g" },
      { ingredient: "Garlic (minced)", base: 4, unit: "g" },
      { ingredient: "Dried Oregano", base: 1.5, unit: "g" },
      { ingredient: "Red Pepper Flakes", base: 0.5, unit: "g" },
      { ingredient: "Salt", base: 2, unit: "g" },
      { ingredient: "Sugar", base: 3, unit: "g" },
      { ingredient: "Olive Oil", base: 5, unit: "ml" },
    ],
    toppings: [
      { ingredient: "Brick Cheese (or Monterey Jack)", amount: "180 g" },
      { ingredient: "Pepperoni (optional)", amount: "60 g" },
    ],
    idealTemp: { min: 500, max: 550 },
    bakeTime: { hot: "10–12 minutes", medium: "14–18 minutes", low: "20–25 minutes" },
    tips: [
      "Use a well-oiled blue steel pan for crispy edges.",
      "Push cheese all the way to the edges — the caramelized cheese crust is the signature.",
      "Sauce goes on TOP of the cheese in racing stripes.",
      "Let dough proof in the pan 2–4 hours before topping.",
    ],
  },

  sicilian: {
    name: "Sicilian",
    ballWeight: 400,
    hydration: 0.68,
    saltPct: 0.025,
    oilPct: 0.05,
    sugarPct: 0.02,
    yeastPct: 0.005,
    diameter: '12×17 inch sheet pan',
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 110, unit: "g" },
      { ingredient: "Garlic (minced)", base: 4, unit: "g" },
      { ingredient: "Dried Oregano", base: 2, unit: "g" },
      { ingredient: "Anchovy Paste (optional)", base: 3, unit: "g" },
      { ingredient: "Salt", base: 2, unit: "g" },
      { ingredient: "Olive Oil", base: 8, unit: "ml" },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella", amount: "140 g" },
      { ingredient: "Pecorino Romano (grated)", amount: "20 g" },
      { ingredient: "Breadcrumbs (toasted)", amount: "10 g" },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "12–15 minutes", medium: "18–22 minutes", low: "25–30 minutes" },
    tips: [
      "Generously oil the sheet pan for a fried bottom crust.",
      "Use a mix of semolina and bread flour for extra crunch.",
      "Let the dough rise in the pan for at least 2 hours.",
      "Thick, airy, and focaccia-like — don't press it too thin.",
    ],
  },

  "thin-crust": {
    name: "Thin & Crispy",
    ballWeight: 200,
    hydration: 0.55,
    saltPct: 0.025,
    oilPct: 0.04,
    sugarPct: 0,
    yeastPct: 0.005,
    diameter: '12–14 inches',
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 70, unit: "g" },
      { ingredient: "Garlic Powder", base: 1, unit: "g" },
      { ingredient: "Dried Basil", base: 1, unit: "g" },
      { ingredient: "Salt", base: 1.5, unit: "g" },
      { ingredient: "Olive Oil", base: 5, unit: "ml" },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", amount: "120 g" },
      { ingredient: "Parmesan (grated)", amount: "15 g" },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "6–8 minutes", medium: "10–13 minutes", low: "15–18 minutes" },
    tips: [
      "Roll the dough as thin as possible — use a rolling pin here.",
      "Dock the dough with a fork to prevent bubbles.",
      "Preheat your baking sheet or stone for extra crispiness.",
      "Less is more with toppings — keep it light.",
    ],
  },

  pan: {
    name: "Pan Pizza",
    ballWeight: 340,
    hydration: 0.70,
    saltPct: 0.025,
    oilPct: 0.05,
    sugarPct: 0.02,
    yeastPct: 0.006,
    diameter: '12 inch cast iron or cake pan',
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 100, unit: "g" },
      { ingredient: "Garlic (minced)", base: 3, unit: "g" },
      { ingredient: "Dried Oregano", base: 1, unit: "g" },
      { ingredient: "Salt", base: 2, unit: "g" },
      { ingredient: "Sugar", base: 2, unit: "g" },
      { ingredient: "Butter (melted)", base: 5, unit: "g" },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", amount: "160 g" },
      { ingredient: "Cheddar (shredded)", amount: "40 g" },
    ],
    idealTemp: { min: 450, max: 500 },
    bakeTime: { hot: "12–15 minutes", medium: "18–22 minutes", low: "25–30 minutes" },
    tips: [
      "Oil the pan generously — it fries the bottom for a golden crust.",
      "Cold-ferment 24–48 hours for the best texture and flavor.",
      "Press the dough into the pan, let it relax 20 min, then press again.",
      "Cheese goes under the sauce for a classic pan pizza.",
    ],
  },
};

/**
 * Calculate dough ingredients from a recipe's baker's percentages.
 * Returns array of { ingredient, amount, unit }.
 */
function calculateDough(recipe, numPizzas) {
  const totalDough = recipe.ballWeight * numPizzas;
  // Baker's percentages: flour = 100%, everything else relative to flour
  // totalDough = flour + water + salt + oil + sugar + yeast
  // totalDough = flour * (1 + hydration + salt% + oil% + sugar% + yeast%)
  const totalPct =
    1 + recipe.hydration + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct;
  const flour = totalDough / totalPct;
  const water = flour * recipe.hydration;
  const salt = flour * recipe.saltPct;
  const oil = flour * recipe.oilPct;
  const sugar = flour * recipe.sugarPct;
  const yeast = flour * recipe.yeastPct;

  const ingredients = [
    { ingredient: "Flour", amount: Math.round(flour), unit: "g" },
    { ingredient: "Water", amount: Math.round(water), unit: "ml" },
    { ingredient: "Salt", amount: round1(salt), unit: "g" },
  ];

  if (yeast > 0) {
    ingredients.push({
      ingredient: "Instant Dry Yeast",
      amount: round1(yeast),
      unit: "g",
    });
  }
  if (oil > 0) {
    ingredients.push({
      ingredient: "Olive Oil",
      amount: round1(oil),
      unit: "ml",
    });
  }
  if (sugar > 0) {
    ingredients.push({
      ingredient: "Sugar",
      amount: round1(sugar),
      unit: "g",
    });
  }

  return ingredients;
}

/**
 * Calculate total sauce ingredients scaled by number of pizzas.
 */
function calculateSauce(recipe, numPizzas) {
  return recipe.sauce.map((s) => ({
    ingredient: s.ingredient,
    amount: round1(s.base * numPizzas),
    unit: s.unit,
  }));
}

/**
 * Determine baking instructions based on oven temp (°F).
 */
function getBakingInfo(recipe, ovenTempF) {
  const idealMin = recipe.idealTemp.min;
  let bakeTime;
  let tempCategory;

  if (ovenTempF >= idealMin) {
    bakeTime = recipe.bakeTime.hot;
    tempCategory = "optimal";
  } else if (ovenTempF >= idealMin - 75) {
    bakeTime = recipe.bakeTime.medium;
    tempCategory = "moderate";
  } else {
    bakeTime = recipe.bakeTime.low;
    tempCategory = "low";
  }

  return { bakeTime, tempCategory, recommendedTemp: Math.min(ovenTempF, recipe.idealTemp.max) };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function fToC(f) {
  return Math.round(((f - 32) * 5) / 9);
}

function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}
