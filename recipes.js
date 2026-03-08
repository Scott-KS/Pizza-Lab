/**
 * PizzaPro — Recipe Data & Calculation Engine
 *
 * Dough weights are per-pizza/pan in grams.
 * All baker's percentages are relative to flour (flour = 100%).
 * All ingredient amounts are displayed in grams.
 */

const PIZZA_RECIPES = {
  neapolitan: {
    name: "Neapolitan",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 210 },
      '12': { label: '12″ round', doughWeight: 250 },
      '14': { label: '14″ round', doughWeight: 310 },
    },
    hydration: 0.65,
    saltPct: 0.03,
    oilPct: 0,
    sugarPct: 0,
    yeastPct: 0.003,
    sauce: [
      { ingredient: "San Marzano Tomatoes (crushed)", base: 80 },
      { ingredient: "Sea Salt", base: 1 },
      { ingredient: "Fresh Basil Leaves", base: 2 },
      { ingredient: "Extra Virgin Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Fresh Mozzarella", base: 100 },
      { ingredient: "Fresh Basil", base: 3 },
      { ingredient: "Extra Virgin Olive Oil", base: 5 },
    ],
    idealTemp: { min: 800, max: 950 },
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
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 230 },
      '12': { label: '12″ round', doughWeight: 290 },
      '14': { label: '14″ round', doughWeight: 370 },
    },
    hydration: 0.63,
    saltPct: 0.025,
    oilPct: 0.03,
    sugarPct: 0.02,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 100 },
      { ingredient: "Garlic (minced)", base: 3 },
      { ingredient: "Dried Oregano", base: 1 },
      { ingredient: "Salt", base: 2 },
      { ingredient: "Sugar", base: 2 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella (shredded)", base: 150 },
      { ingredient: "Grated Parmesan", base: 15 },
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

  "chicago-tavern": {
    name: "Chicago Tavern",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 200 },
      '12': { label: '12″ round', doughWeight: 250 },
      '14': { label: '14″ round', doughWeight: 320 },
    },
    hydration: 0.55,
    saltPct: 0.025,
    oilPct: 0.03,
    sugarPct: 0.02,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 90 },
      { ingredient: "Tomato Paste", base: 15 },
      { ingredient: "Garlic (minced)", base: 3 },
      { ingredient: "Dried Oregano", base: 2 },
      { ingredient: "Salt", base: 2 },
      { ingredient: "Sugar", base: 3 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella (shredded)", base: 170 },
      { ingredient: "Italian Sausage (cooked, crumbled)", base: 60 },
      { ingredient: "Giardiniera (optional)", base: 30 },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    tips: [
      "Roll the dough thin and crispy — this is NOT deep dish.",
      "Cut in squares (tavern cut / party cut), not wedges.",
      "Use a generous amount of sausage — it's the signature topping.",
      "The crust should be cracker-thin and crispy edge to edge.",
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round pan', doughWeight: 340 },
      '12': { label: '12″ round pan', doughWeight: 420 },
      '14': { label: '10×14″ Detroit pan', doughWeight: 500 },
    },
    hydration: 0.72,
    saltPct: 0.025,
    oilPct: 0.04,
    sugarPct: 0.02,
    yeastPct: 0.006,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 120 },
      { ingredient: "Garlic (minced)", base: 4 },
      { ingredient: "Dried Oregano", base: 1.5 },
      { ingredient: "Red Pepper Flakes", base: 0.5 },
      { ingredient: "Salt", base: 2 },
      { ingredient: "Sugar", base: 3 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Brick Cheese (or Monterey Jack)", base: 180 },
      { ingredient: "Pepperoni (optional)", base: 60 },
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
    isSheet: true,
    sizes: {
      'quarter': { label: '9.5×13″ (quarter sheet)', doughWeight: 500 },
      'half':    { label: '13×18″ (half sheet)', doughWeight: 950 },
    },
    hydration: 0.68,
    saltPct: 0.025,
    oilPct: 0.05,
    sugarPct: 0.02,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: { quarter: 160, half: 300 } },
      { ingredient: "Garlic (minced)", base: { quarter: 4, half: 8 } },
      { ingredient: "Dried Oregano", base: { quarter: 2, half: 4 } },
      { ingredient: "Anchovy Paste (optional)", base: { quarter: 3, half: 6 } },
      { ingredient: "Salt", base: { quarter: 2, half: 4 } },
      { ingredient: "Olive Oil", base: { quarter: 8, half: 15 } },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella", base: { quarter: 180, half: 340 } },
      { ingredient: "Pecorino Romano (grated)", base: { quarter: 25, half: 45 } },
      { ingredient: "Breadcrumbs (toasted)", base: { quarter: 15, half: 25 } },
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

  grandma: {
    name: "Grandma",
    isSheet: true,
    sizes: {
      'quarter': { label: '9.5×13″ (quarter sheet)', doughWeight: 420 },
      'half':    { label: '13×18″ (half sheet)', doughWeight: 800 },
    },
    hydration: 0.65,
    saltPct: 0.025,
    oilPct: 0.06,
    sugarPct: 0.02,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: { quarter: 150, half: 280 } },
      { ingredient: "Garlic (minced)", base: { quarter: 5, half: 10 } },
      { ingredient: "Dried Oregano", base: { quarter: 2, half: 4 } },
      { ingredient: "Salt", base: { quarter: 2, half: 3 } },
      { ingredient: "Sugar", base: { quarter: 2, half: 4 } },
      { ingredient: "Olive Oil", base: { quarter: 10, half: 18 } },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella (shredded)", base: { quarter: 170, half: 320 } },
      { ingredient: "Pecorino Romano (grated)", base: { quarter: 20, half: 35 } },
    ],
    idealTemp: { min: 450, max: 500 },
    bakeTime: { hot: "14–18 minutes", medium: "20–25 minutes", low: "28–35 minutes" },
    tips: [
      "The dough is thinner than Sicilian — press it out to fill the pan.",
      "Sauce goes on TOP of the cheese, spread in dollops or stripes.",
      "Oil the pan very generously — the bottom should fry golden.",
      "No long rise needed — Grandma pizza is meant to be quick and simple.",
      "Use garlic-heavy sauce — it's the heart of this style.",
    ],
  },

  "thin-crust": {
    name: "Thin & Crispy",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 165 },
      '12': { label: '12″ round', doughWeight: 200 },
      '14': { label: '14″ round', doughWeight: 260 },
    },
    hydration: 0.55,
    saltPct: 0.025,
    oilPct: 0.04,
    sugarPct: 0,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 70 },
      { ingredient: "Garlic Powder", base: 1 },
      { ingredient: "Dried Basil", base: 1 },
      { ingredient: "Salt", base: 1.5 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", base: 120 },
      { ingredient: "Parmesan (grated)", base: 15 },
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
    isSheet: false,
    sizes: {
      '10': { label: '10″ cast iron / cake pan', doughWeight: 290 },
      '12': { label: '12″ cast iron / cake pan', doughWeight: 380 },
      '14': { label: '14″ cast iron / cake pan', doughWeight: 490 },
    },
    hydration: 0.70,
    saltPct: 0.025,
    oilPct: 0.05,
    sugarPct: 0.02,
    yeastPct: 0.006,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 100 },
      { ingredient: "Garlic (minced)", base: 3 },
      { ingredient: "Dried Oregano", base: 1 },
      { ingredient: "Salt", base: 2 },
      { ingredient: "Sugar", base: 2 },
      { ingredient: "Butter (melted)", base: 5 },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", base: 160 },
      { ingredient: "Cheddar (shredded)", base: 40 },
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
 * Calculate dough ingredients from baker's percentages.
 * Returns array of { ingredient, amount (g), pct (% of flour) }.
 */
function calculateDough(recipe, numPizzas, sizeKey) {
  const doughPerUnit = recipe.sizes[sizeKey].doughWeight;
  const totalDough = doughPerUnit * numPizzas;

  const totalPct =
    1 + recipe.hydration + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct;
  const flour = totalDough / totalPct;
  const water = flour * recipe.hydration;
  const salt = flour * recipe.saltPct;
  const oil = flour * recipe.oilPct;
  const sugar = flour * recipe.sugarPct;
  const yeast = flour * recipe.yeastPct;

  const ingredients = [
    { ingredient: "Flour", amount: Math.round(flour), pct: 100 },
    { ingredient: "Water", amount: Math.round(water), pct: round1(recipe.hydration * 100) },
    { ingredient: "Salt", amount: round1(salt), pct: round1(recipe.saltPct * 100) },
  ];

  if (yeast > 0) {
    ingredients.push({
      ingredient: "Instant Dry Yeast",
      amount: round1(yeast),
      pct: round1(recipe.yeastPct * 100),
    });
  }
  if (oil > 0) {
    ingredients.push({
      ingredient: "Olive Oil",
      amount: round1(oil),
      pct: round1(recipe.oilPct * 100),
    });
  }
  if (sugar > 0) {
    ingredients.push({
      ingredient: "Sugar",
      amount: round1(sugar),
      pct: round1(recipe.sugarPct * 100),
    });
  }

  return ingredients;
}

/**
 * Calculate sauce ingredients scaled by number of pizzas/pans.
 * For sheet-pan styles, base is an object keyed by size.
 * For round styles, base is a number that scales with size.
 */
function calculateSauce(recipe, numPizzas, sizeKey) {
  // Size multiplier for round pizzas (12″ is baseline)
  const roundMultiplier = { '10': 0.70, '12': 1.0, '14': 1.36 };

  return recipe.sauce.map((s) => {
    let perUnit;
    if (typeof s.base === "object") {
      perUnit = s.base[sizeKey] || s.base.quarter;
    } else {
      perUnit = s.base * (roundMultiplier[sizeKey] || 1);
    }
    return {
      ingredient: s.ingredient,
      amount: round1(perUnit * numPizzas),
    };
  });
}

/**
 * Calculate topping ingredients scaled by number of pizzas/pans.
 */
function calculateToppings(recipe, numPizzas, sizeKey) {
  const roundMultiplier = { '10': 0.70, '12': 1.0, '14': 1.36 };

  return recipe.toppings.map((t) => {
    let perUnit;
    if (typeof t.base === "object") {
      perUnit = t.base[sizeKey] || t.base.quarter;
    } else {
      perUnit = t.base * (roundMultiplier[sizeKey] || 1);
    }
    return {
      ingredient: t.ingredient,
      amount: round1(perUnit * numPizzas),
    };
  });
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
