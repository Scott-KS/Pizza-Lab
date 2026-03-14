/**
 * The Pie Lab — Recipe Data & Calculation Engine
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
    flour: "Tipo 00 Flour",
    yeast: "Fresh Yeast",
    hydration: 0.65,
    saltPct: 0.025,
    oilPct: 0,
    sugarPct: 0,
    yeastPct: 0.004,
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
    rackPosition: "Upper third — place steel or stone on the top rack for maximum top heat. Rack only: top rack, use broiler to finish. Portable/wood-fired: floor of oven.",
    tips: [
      { level: "beginner", tip: "Use Tipo 00 flour — it creates a softer, more elastic dough that stretches without snapping back." },
      { level: "beginner", tip: "Keep your ingredient amounts minimal: flour, water, salt, and yeast only. No oil, no sugar." },
      { level: "beginner", tip: "If your dough tears while stretching, cover it and let it rest 10 more minutes — the gluten is too tight." },
      { level: "intermediate", tip: "Target a finished dough temperature of 23–26°C (73–79°F). Too warm and it over-ferments; too cold and it under-develops." },
      { level: "intermediate", tip: "Dissolve salt in water first, then stir in a small amount of flour before adding yeast. Salt won't kill yeast once diluted — but direct dry contact will slow or kill it." },
      { level: "intermediate", tip: "Press air from the center outward to build the cornicione (the rim) — never touch the outer edge while shaping." },
      { level: "pro", tip: "Reduce yeast to 0.1–0.2% for a 48-hour room-temp ferment. Slower fermentation = more complex flavor and better leopard char." },
      { level: "pro", tip: "Add oil last, after the flour is mostly incorporated. Oil coats flour particles and slows water absorption — adding it early creates uneven hydration and a weaker gluten network." },
      { level: "pro", tip: "In a home oven, place your baking steel on the top rack and switch to broil for the last 90 seconds to scorch the cornicione." },
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
    flour: "High-Gluten Bread Flour",
    yeast: "Instant Dry Yeast",
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
      { ingredient: "Pepperoni / Sausage / Mushroom / Etc.", base: 15 },
    ],
    idealTemp: { min: 500, max: 550 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    rackPosition: "Lower third — steel or stone on a low rack for crisp bottom and foldable crust. Rack only: lowest rack position. Portable/wood-fired: floor of oven.",
    tips: [
      { level: "beginner", tip: "Use bread flour, not all-purpose — the higher protein content gives you that signature chewy bite." },
      { level: "beginner", tip: "Take the dough out of the fridge 2–3 hours before baking. Cold dough tears; relaxed dough stretches." },
      { level: "beginner", tip: "The pie should fold in half without cracking. If it doesn't, it's either too thick or underbaked." },
      { level: "intermediate", tip: "Cold-ferment 48–72 hours for best flavor. The dough is usable at 24 hours but noticeably better at 72." },
      { level: "intermediate", tip: "Use block mozzarella, hand-shredded — pre-shredded has anti-caking agents that prevent proper melt and browning." },
      { level: "intermediate", tip: "Preheat your baking steel for at least 45 minutes at your oven's max temp. The steel's thermal mass is what crisps the bottom." },
      { level: "pro", tip: "Apply sauce with a ladle in one circular motion from center out — thick layer kills the fold. Sauce should be light and even." },
      { level: "pro", tip: "Slide the dressed pie under the broiler for the last 90 seconds to blister the cheese. Pull it before the crust burns." },
      { level: "pro", tip: "Try 0.5% diastatic malt powder in the dough for better browning and a slightly more complex crust flavor." },
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
    flour: "All-Purpose Flour",
    yeast: "Instant Dry Yeast",
    hydration: 0.50,
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
      { ingredient: "Italian Sausage (Uncooked, crumbled)", base: 60 },
      { ingredient: "Giardiniera, in Oil (optional)", base: 30 },
    ],
    idealTemp: { min: 475, max: 550 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    rackPosition: "Lower third — directly on a steel or stone for a crisp, cracker-like bottom. Rack only: lowest rack. Not ideal for portable or wood-fired ovens.",
    tips: [
      { level: "beginner", tip: "Roll the dough paper-thin with a rolling pin — this style requires even thickness edge to edge, not hand-stretching." },
      { level: "beginner", tip: "Dock the entire dough surface with a fork before topping. This prevents bubbles that would make the crust uneven." },
      { level: "beginner", tip: "Always cut in squares (tavern cut). The corner pieces with their crispy edges are the most coveted slices." },
      { level: "intermediate", tip: "After rolling, lay the dough uncovered on parchment and refrigerate overnight — this 'curing' step dries the surface for a cracker-like snap." },
      { level: "intermediate", tip: "Toppings go under the cheese in Chicago tavern style. The cheese acts as a protective lid that keeps everything moist." },
      { level: "intermediate", tip: "Italian fennel sausage is the traditional topping, pinched into small flat pieces directly on the dough before the cheese layer." },
      { level: "pro", tip: "Cure your rolled skins uncovered in the fridge for 8–16 hours, not longer. Past 24 hours the dough becomes brittle and cracks." },
      { level: "pro", tip: "A baking steel conducts heat faster than stone, giving you a crisper bottom in a home oven. Preheat it for a full hour." },
      { level: "pro", tip: "Finish with a light brush of garlic butter on the crust edge right when it comes out of the oven — it caramelizes beautifully." },
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    isSheet: false,
    sizes: {
      '8x10':  { label: '8×10″ Pan', doughWeight: 450, slices: 6, description: "Feeds 1–2" },
      '10x14': { label: '10×14″ Pan', doughWeight: 800, slices: 8, description: "Feeds 3–4" },
      '12x16': { label: '12×16″ Pan', doughWeight: 1100, slices: 12, description: "Feeds 5–6" },
    },
    defaultSize: "10x14",
    flour: "Bread Flour",
    yeast: "Instant Dry Yeast",
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
    rackPosition: "Lower third — low rack to fry the bottom crust in the oiled pan. Place pan on steel or stone for extra bottom heat. Rack only: lowest rack.",
    tips: [
      { level: "beginner", tip: "Oil the pan very generously — this is what fries the bottom and sides into that signature crispy crust." },
      { level: "beginner", tip: "Cheese goes on first, spread edge-to-edge. The fat melts down the sides and caramelizes against the pan wall." },
      { level: "beginner", tip: "Sauce goes on last, in two or three 'racing stripes' down the length of the pie — not spread wall to wall." },
      { level: "intermediate", tip: "Wisconsin brick cheese is traditional and worth sourcing. Its higher fat content creates a better frico crust than mozzarella alone." },
      { level: "intermediate", tip: "Press the dough into the pan, then walk away for 15 minutes. Come back and press again. Repeat until it fills the corners without tearing." },
      { level: "intermediate", tip: "Place the pan on a preheated baking steel or stone in the oven. The extra bottom heat is what separates a great crust from a good one." },
      { level: "pro", tip: "A LloydPans hard-anodized Detroit pan is the single best equipment upgrade for this style — it creates the crust a 9x13 cannot replicate." },
      { level: "pro", tip: "Cold-ferment the dough 24 hours before pressing into the pan. Same-day dough works but lacks the depth and oven spring." },
      { level: "pro", tip: "Run a dull knife around the edge immediately after pulling from the oven, then slide onto a wire rack. Letting it steam in the pan kills the crust." },
    ],
  },

  sicilian: {
    name: "Sicilian",
    isSheet: true,
    sizes: {
      'quarter': { label: '9.5×13″ (quarter sheet)', doughWeight: 500 },
      'half':    { label: '13×18″ (half sheet)', doughWeight: 950 },
    },
    flour: "Bread Flour (or Bread + Semolina blend)",
    yeast: "Instant Dry Yeast",
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
    rackPosition: "Lower third — bottom rack to crisp the oiled pan base evenly. Place pan on steel or stone for best results. Rack only: lowest rack.",
    tips: [
      { level: "beginner", tip: "Oil the pan generously — at least 3 tablespoons. The bottom should essentially fry in the oil during baking." },
      { level: "beginner", tip: "Press dough into the pan, then cover and let it rest 20 minutes before pressing again. Rushing tears it." },
      { level: "beginner", tip: "Sicilian crust is thick and airy, not dense. If yours is dense, you didn't give it enough rise time in the pan." },
      { level: "intermediate", tip: "A blend of 80% bread flour and 20% semolina adds crunch and a slightly golden hue to the bottom crust." },
      { level: "intermediate", tip: "Let the dressed pizza sit in the pan at room temperature for 20 minutes before baking. This final proof gives the crust its open, focaccia-like crumb." },
      { level: "intermediate", tip: "Sauce goes on last, over the cheese — this is the traditional Sicilian assembly. It keeps the top moist and the crust from getting soggy." },
      { level: "pro", tip: "For the classic L&B Spumoni Gardens-style Sicilian, go heavy on the cheese layer and sauce it sparingly on top. The cheese should dominate every bite." },
      { level: "pro", tip: "Bake the pan directly on the oven floor for the first 10 minutes to maximize bottom crust crispiness, then move to a rack to finish the top." },
      { level: "pro", tip: "Cold-ferment the dough 24–48 hours before pressing into the pan. The long ferment creates better flavor and a more open crumb structure." },
    ],
  },

  grandma: {
    name: "Grandma",
    isSheet: true,
    sizes: {
      'quarter': { label: '9.5×13″ (quarter sheet)', doughWeight: 350 },
      'half':    { label: '13×18″ (half sheet)', doughWeight: 700 },
    },
    flour: "All-Purpose Flour",
    yeast: "Instant Dry Yeast",
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
      { ingredient: "Sharp Provolone (deli-sliced rounds)", base: { quarter: 170, half: 320 } },
      { ingredient: "Pecorino Romano (grated)", base: { quarter: 20, half: 35 } },
    ],
    idealTemp: { min: 450, max: 500 },
    bakeTime: { hot: "14–18 minutes", medium: "20–25 minutes", low: "28–35 minutes" },
    rackPosition: "Lower third — low rack for even bottom heat on the thick slab. Place pan on steel or stone if available. Rack only: lowest rack.",
    tips: [
      { level: "beginner", tip: "Oil the pan generously with olive oil — this is non-negotiable. The bottom should come out golden and slightly fried." },
      { level: "beginner", tip: "Lay provolone slices directly on the dough first, then dollop sauce on top. This is the classic Grandma assembly order." },
      { level: "beginner", tip: "Grandma pizza is thinner and crispier than Sicilian — press the dough all the way to the pan edges." },
      { level: "intermediate", tip: "Use a dark metal baking pan. Dark pans absorb more heat and produce a better fried bottom crust than light aluminum." },
      { level: "intermediate", tip: "Sprinkle Pecorino Romano over the sauce before baking — it adds a salty, sharp counterpoint to the sweet tomato." },
      { level: "intermediate", tip: "Let the oiled, dough-filled pan sit at room temperature for 2–3 hours before topping and baking for better oven spring." },
      { level: "pro", tip: "Garlic-forward sauce is the soul of this style. Bloom minced garlic in olive oil before adding crushed tomatoes for a richer base flavor." },
      { level: "pro", tip: "Finish with a drizzle of good olive oil over the top right when it comes out of the oven. It brightens everything." },
      { level: "pro", tip: "Try baking at a lower temp (450°F) for longer (20–25 min) to get a deeper golden crust without burning the cheese top." },
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
    flour: "All-Purpose Flour",
    yeast: "Instant Dry Yeast",
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
    rackPosition: "Middle rack — steel or stone centered for even heat on thin crust. Rack only: middle rack. Portable/wood-fired: floor of oven.",
    tips: [
      { level: "beginner", tip: "Use a rolling pin — this style requires even, flat thickness that hand-stretching cannot achieve." },
      { level: "beginner", tip: "Dock the entire crust surface with a fork before adding toppings to prevent it from puffing up in the oven." },
      { level: "beginner", tip: "Less toppings, not more. A thin crust can't structurally support heavy loads — keep each topping light." },
      { level: "intermediate", tip: "Bake on a preheated stone or steel at your oven's max temp. The immediate bottom heat is what turns thin dough crispy rather than soft." },
      { level: "intermediate", tip: "Low hydration (55%) is intentional — a drier dough is easier to roll thin and crisps better in the oven." },
      { level: "intermediate", tip: "Par-bake the naked crust for 2–3 minutes before adding toppings. This double-bake drives out more moisture and prevents sogginess." },
      { level: "pro", tip: "Try 20% semolina in the flour blend for a crispier, snappier finished crust with a slight Ritz cracker quality." },
      { level: "pro", tip: "Roll the dough between two sheets of parchment for consistent thickness without adding extra flour, which toughens the crust." },
      { level: "pro", tip: "Brush the edges with garlic oil before baking — it caramelizes in the oven and adds flavor to the part of the pie most people ignore." },
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
    flour: "Bread Flour",
    yeast: "Instant Dry Yeast",
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
    rackPosition: "Lower third — low rack to crisp the oiled pan bottom. Place pan on steel or stone for extra bottom heat. Rack only: lowest rack.",
    tips: [
      { level: "beginner", tip: "Oil the pan generously — 2–3 tablespoons of olive oil minimum. This is what creates the crispy fried bottom." },
      { level: "beginner", tip: "If the dough springs back when you press it, cover it and wait 15 minutes before trying again." },
      { level: "beginner", tip: "Cheese goes directly on the dough before the sauce in pan pizza style. The cheese layer acts as a barrier against sogginess." },
      { level: "intermediate", tip: "Cold-ferment 24–48 hours before pressing into the pan. The flavor difference over same-day dough is significant." },
      { level: "intermediate", tip: "Press the dough in stages — initial press, 20-minute rest, second press to edges. Never force it all at once." },
      { level: "intermediate", tip: "Place the pan on a preheated baking steel or stone. The extra conductive heat from below is what crisps the bottom like a pizzeria." },
      { level: "pro", tip: "Try a cold-ferment in the pan itself — oil it, press the dough in, cover, and refrigerate overnight. Let it come to room temp and proof before baking." },
      { level: "pro", tip: "For maximum bottom crispiness, bake at 475°F for the first 10 minutes on the lowest rack, then move up to finish the top." },
      { level: "pro", tip: "Use a blend of olive oil and a neutral oil in the pan — pure olive oil can burn at high temps; the blend gives you flavor and stability." },
    ],
  },

  "st-louis": {
    name: "St. Louis",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 140 },
      '12': { label: '12″ round', doughWeight: 175 },
      '14': { label: '14″ round', doughWeight: 225 },
    },
    flour: "All-Purpose Flour",
    yeast: null,
    hydration: 0.47,
    saltPct: 0.025,
    oilPct: 0.02,
    sugarPct: 0.02,
    yeastPct: 0,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 70 },
      { ingredient: "Tomato Paste", base: 10 },
      { ingredient: "Dried Oregano", base: 2 },
      { ingredient: "Garlic Powder", base: 1 },
      { ingredient: "Sugar", base: 3 },
      { ingredient: "Salt", base: 1.5 },
    ],
    toppings: [
      { ingredient: "Provel Cheese (shredded)", base: 130 },
      { ingredient: "Italian Sausage or Pepperoni", base: 30 },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "7–9 minutes", medium: "10–13 minutes", low: "14–18 minutes" },
    rackPosition: "Middle rack — even heat for the ultra-thin cracker crust. Steel or stone for best results. Rack only: middle rack.",
    tips: [
      { level: "beginner", tip: "St. Louis dough uses baking powder, not yeast — add 1 tsp (4g) per 250g flour. Mix it in with the dry ingredients." },
      { level: "beginner", tip: "Provel cheese is non-negotiable for authenticity — it's a processed blend of provolone, Swiss, and cheddar that melts into a sticky, gooey layer." },
      { level: "beginner", tip: "If you can't find Provel, blend equal parts white cheddar, provolone, and Swiss as a substitute." },
      { level: "beginner", tip: "Always cut in squares (party cut). Triangles are wrong here — squares give you more cheese-edge ratio per piece." },
      { level: "intermediate", tip: "Roll the dough paper-thin — thinner than Chicago tavern. St. Louis crust is unleavened and should snap like a cracker." },
      { level: "intermediate", tip: "The sauce is intentionally sweet. Don't reduce the sugar — it's part of the flavor profile that balances the salty Provel." },
      { level: "intermediate", tip: "Dock the crust thoroughly with a fork before topping. No bubbles allowed — this style should be flat and uniform edge to edge." },
      { level: "pro", tip: "Try the double-bake method: par-bake the bare crust 2 minutes, add toppings, finish baking. The double bake drives out moisture and increases snap." },
      { level: "pro", tip: "Keep toppings minimal and evenly distributed. The thin crust cannot support heavy loads — more than 3 toppings and you lose the structural integrity." },
      { level: "pro", tip: "Bake directly on a hot stone or steel without a pan. The direct contact crisps the bottom in a way a pan cannot replicate for this style." },
    ],
  },

  "new-haven": {
    name: "New Haven Apizza",
    isSheet: false,
    sizes: {
      '12': { label: '12″ round', doughWeight: 270 },
      '14': { label: '14″ round', doughWeight: 350 },
      '16': { label: '16″ round', doughWeight: 450 },
    },
    flour: "High-Gluten Bread Flour",
    yeast: "Instant Dry Yeast",
    hydration: 0.61,
    saltPct: 0.03,
    oilPct: 0.02,
    sugarPct: 0,
    yeastPct: 0.004,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 90 },
      { ingredient: "Garlic (minced)", base: 5 },
      { ingredient: "Dried Oregano", base: 2 },
      { ingredient: "Salt", base: 2 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Low-Moisture Mozzarella (shredded)", base: 130 },
      { ingredient: "Pecorino Romano (grated)", base: 20 },
    ],
    idealTemp: { min: 600, max: 800 },
    bakeTime: { hot: "3–5 minutes", medium: "8–12 minutes", low: "14–18 minutes" },
    rackPosition: "Upper third — steel on top rack, use broiler to char the top. Stone works too. Portable/wood-fired: floor of oven, rotate frequently.",
    tips: [
      { level: "beginner", tip: "Crank your oven as high as it will go and preheat your stone or steel for at least 45 minutes. High heat is the whole game here." },
      { level: "beginner", tip: "Char is a feature, not a flaw. Black spots on the cornicione are exactly what you're after — don't pull it early." },
      { level: "beginner", tip: "A 'plain' tomato pie has no mozzarella — just crushed tomatoes, garlic, olive oil, and Pecorino Romano. Try it before adding cheese." },
      { level: "intermediate", tip: "Use high-protein bread flour, not all-purpose. The extra gluten gives the crust its characteristic chewy-yet-crispy structure." },
      { level: "intermediate", tip: "Ferment at least 24 hours, ideally 48–72. New Haven dough gets its distinct tang from time, not additives." },
      { level: "intermediate", tip: "Handle the dough as little as possible when shaping. The New Haven tradition is a gentle hand-pat, not aggressive stretching." },
      { level: "pro", tip: "Place your baking steel on the top rack and finish under the broiler for 60–90 seconds to replicate coal-fired oven char on the top." },
      { level: "pro", tip: "For the white clam pie: fresh littleneck clams, raw garlic, olive oil, dried oregano, and a shower of Pecorino Romano. No tomato, no mozzarella." },
      { level: "pro", tip: "Target 600°F on your baking surface if using an outdoor oven. At that temp, the pie bakes in 3–4 minutes and develops the right charred complexity." },
    ],
  },

  "ohio-valley": {
    name: "Ohio Valley",
    isSheet: true,
    sizes: {
      'quarter': { label: 'Quarter sheet (9×13″)', doughWeight: 260 },
      'half': { label: 'Half sheet (13×18″)', doughWeight: 480 },
      'full': { label: 'Full sheet (18×26″)', doughWeight: 900 },
    },
    flour: "Bread Flour",
    yeast: "Instant Dry Yeast",
    hydration: 0.58,
    saltPct: 0.025,
    oilPct: 0.03,
    sugarPct: 0.02,
    yeastPct: 0.005,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: { quarter: 90, half: 170, full: 315 } },
      { ingredient: "Tomato Paste", base: { quarter: 15, half: 28, full: 52 } },
      { ingredient: "Garlic Powder", base: { quarter: 1, half: 2, full: 3.5 } },
      { ingredient: "Dried Oregano", base: { quarter: 2, half: 3.5, full: 6.5 } },
      { ingredient: "Sugar", base: { quarter: 3, half: 5.5, full: 10 } },
      { ingredient: "Salt", base: { quarter: 2, half: 3.5, full: 6.5 } },
    ],
    toppings: [
      { ingredient: "Provolone (shredded, added COLD after bake)", base: { quarter: 150, half: 285, full: 525 } },
      { ingredient: "Pepperoni (baked on the pizza)", base: { quarter: 50, half: 95, full: 175 } },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    rackPosition: "Lower third — steel or stone on low rack, move up to finish if needed. Rack only: lowest rack. Not ideal for portable or wood-fired ovens.",
    tips: [
      { level: "beginner", tip: "The cold cheese step is the whole point — bake the pizza completely, pull it out, then pile on shredded provolone immediately." },
      { level: "beginner", tip: "Don't put the cheese in the oven. It doesn't fully melt and that's correct — the half-melted texture is the signature." },
      { level: "beginner", tip: "Cut in squares while the cheese is still setting. The warm crust and half-melted cold cheese need to be eaten together." },
      { level: "intermediate", tip: "Use shredded provolone, not sliced and not mozzarella. The shred allows for even distribution and the right partial melt from residual heat." },
      { level: "intermediate", tip: "Bake the crust aggressively — you want a well-done bottom because the cold cheese will absorb some of the top heat when added." },
      { level: "intermediate", tip: "The sauce is applied directly to the dough with no cheese barrier beneath it, which means the crust needs to be fully baked to avoid sogginess." },
      { level: "pro", tip: "Pile the cold provolone high — more than you think you need. It compresses as it warms and a thin layer looks sad and barely melted." },
      { level: "pro", tip: "Try a quick 30-second broil at the end of the bake to ensure the crust top is fully done before you add the cold cheese." },
      { level: "pro", tip: "Some Valley operators add a second provolone application — half at pull, rest after 60 seconds. Experiment with timing for different melt levels." },
    ],
  },

  "cast-iron": {
    name: "Cast Iron",
    isSheet: false,
    sizes: {
      '10': { label: '10″ cast iron skillet', doughWeight: 240 },
      '12': { label: '12″ cast iron skillet', doughWeight: 320 },
    },
    flour: "All-Purpose Flour",
    yeast: "Instant Dry Yeast",
    hydration: 0.62,
    saltPct: 0.025,
    oilPct: 0.04,
    sugarPct: 0.01,
    yeastPct: 0.006,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 80 },
      { ingredient: "Garlic (minced)", base: 3 },
      { ingredient: "Dried Oregano", base: 1 },
      { ingredient: "Salt", base: 1.5 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", base: 140 },
      { ingredient: "Parmesan (grated)", base: 15 },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "12–14 minutes", medium: "16–20 minutes", low: "22–26 minutes" },
    rackPosition: "Lower third — bottom rack to fry the skillet base, move up to finish the top. Place skillet on steel or stone for extra heat. Rack only: lowest rack.",
    tips: [
      { level: "beginner", tip: "Add butter or olive oil to the cold skillet, then press the dough in and let it rest 20–30 minutes before baking — this prevents tearing." },
      { level: "beginner", tip: "Use a well-seasoned 10–12 inch cast iron pan. Glass and non-stick pans don't conduct heat the same way and won't give you the right crust." },
      { level: "beginner", tip: "Bake on the bottom rack of the oven at 500°F for the first 8 minutes, then move up to finish the cheese. Bottom heat first, top heat second." },
      { level: "intermediate", tip: "Start the skillet on the stovetop over medium heat for 2 minutes before moving to the oven. This jump-starts the bottom crust and creates a crispier base." },
      { level: "intermediate", tip: "Press the dough up the sides of the skillet slightly to create a lip — it crisps beautifully and holds the toppings in." },
      { level: "intermediate", tip: "Let the pizza rest in the skillet for 2 minutes after pulling from the oven, then slide onto a cutting board. Cutting in the pan damages the seasoning." },
      { level: "pro", tip: "Butter gives a richer, nuttier crust than olive oil in cast iron. Use 2 tablespoons of unsalted butter — it foams in the pan and coats the dough perfectly." },
      { level: "pro", tip: "Preheat the empty skillet in a 500°F oven for 10 minutes, add cold butter (it'll sizzle immediately), then press in the dough. Maximum bottom crust crispiness." },
      { level: "pro", tip: "Try finishing with a drizzle of honey and fresh thyme after baking — the contrast with the salty, crispy crust is outstanding." },
    ],
  },

  "school-night": {
    name: "School Night (No Rise)",
    isSheet: false,
    sizes: {
      '10': { label: '10″ round', doughWeight: 200 },
      '12': { label: '12″ round', doughWeight: 260 },
      '14': { label: '14″ round', doughWeight: 330 },
    },
    flour: "All-Purpose Flour",
    yeast: "Instant Dry Yeast",
    hydration: 0.60,
    saltPct: 0.025,
    oilPct: 0.03,
    sugarPct: 0.01,
    yeastPct: 0.008,
    sauce: [
      { ingredient: "Crushed Tomatoes", base: 80 },
      { ingredient: "Garlic (minced)", base: 3 },
      { ingredient: "Dried Oregano", base: 1 },
      { ingredient: "Salt", base: 1.5 },
      { ingredient: "Sugar", base: 2 },
      { ingredient: "Olive Oil", base: 5 },
    ],
    toppings: [
      { ingredient: "Shredded Mozzarella", base: 130 },
      { ingredient: "Parmesan (grated)", base: 10 },
    ],
    idealTemp: { min: 475, max: 525 },
    bakeTime: { hot: "8–10 minutes", medium: "12–15 minutes", low: "16–20 minutes" },
    rackPosition: "Middle rack — center for even heat on this quick bake. Steel or stone speeds up the bake. Rack only: middle rack.",
    tips: [
      { level: "beginner", tip: "Mix, rest 10 minutes, shape, top, bake. That's the whole process — this is pizza without patience required." },
      { level: "beginner", tip: "Use a rolling pin or press by hand. With no fermentation, there's no gluten tension fighting you — the dough is cooperative." },
      { level: "beginner", tip: "This crust won't have the complex flavor of a 48-hour dough, but a great sauce and good toppings close that gap considerably." },
      { level: "intermediate", tip: "A hot baking steel or stone still matters here. Even no-rise dough benefits from the immediate bottom heat for a crisper crust." },
      { level: "intermediate", tip: "Add 1 tsp of olive oil and a pinch of garlic powder directly to the dough for a more flavorful base that can stand without fermentation time." },
      { level: "intermediate", tip: "Bake at a slightly lower temp (450°F) than fermented doughs — no-rise dough can brown too fast on the outside before cooking through." },
      { level: "pro", tip: "Use this dough as a same-day base for a cast iron or sheet pan pizza where the pan itself provides bottom heat and structure." },
      { level: "pro", tip: "Adding a tablespoon of yogurt to the dough approximates some of the tang you'd get from fermentation — it's subtle but noticeable." },
      { level: "pro", tip: "If you have 4 hours instead of 30 minutes, let this dough do a room-temp rest. Even a short ferment dramatically improves texture and flavor." },
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

  const flourLabel = recipe.flour || "Flour";
  const yeastLabel = recipe.yeast || "Instant Dry Yeast";

  const ingredients = [
    { ingredient: flourLabel, amount: Math.round(flour), pct: 100 },
    { ingredient: "Water", amount: Math.round(water), pct: round1(recipe.hydration * 100) },
    { ingredient: "Salt", amount: round1(salt), pct: round1(recipe.saltPct * 100) },
  ];

  if (yeast > 0) {
    ingredients.push({
      ingredient: yeastLabel,
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
  const roundMultiplier = { '10': 0.70, '12': 1.0, '14': 1.36, '16': 1.78 };

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
  const roundMultiplier = { '10': 0.70, '12': 1.0, '14': 1.36, '16': 1.78 };

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

/**
 * Hydration guide data keyed by flour label.
 * Explains how elevation, humidity, and flour brand affect water absorption.
 */
const HYDRATION_GUIDE = {
  "Tipo 00 Flour": {
    absorption: "Low to moderate",
    elevationNote:
      "Above 3,000 ft, flour dries out faster. Add 2–3% extra hydration. Above 5,000 ft, add 4–5% and expect faster fermentation — shorten your proof time.",
    humidityNote:
      "In humid climates (60%+ RH), reduce hydration by 1–2%. In dry climates (below 30% RH), increase by 2–3%. Flour absorbs ambient moisture, so adjust by feel.",
    brandNotes: [
      { brand: "Caputo Pizzeria (Blue)", note: "Moderate absorption; the benchmark for Neapolitan. 65% hydration works well." },
      { brand: "Caputo Nuvola (Sky Blue)", note: "Higher absorption and stronger gluten — can handle 70–75% hydration for a lighter crumb." },
      { brand: "Le 5 Stagioni", note: "Slightly lower absorption than Caputo. Start at 62–63% and adjust up." },
      { brand: "Antimo Caputo Chef's Flour (Red)", note: "Finer grind, lower absorption. Best at 60–63% hydration." },
    ],
  },

  "High-Gluten Bread Flour": {
    absorption: "High",
    elevationNote:
      "Above 3,000 ft, add 2–4% hydration. High-gluten flour already absorbs more water, so altitude dryness compounds. Reduce yeast slightly to control over-proofing.",
    humidityNote:
      "In humid conditions, this flour can feel sticky at its normal hydration — reduce by 1–2%. In dry climates, push hydration up 2–3% for workable dough.",
    brandNotes: [
      { brand: "King Arthur Sir Lancelot", note: "14.2% protein — very high absorption. Can handle 65–68% hydration easily." },
      { brand: "General Mills All Trumps", note: "14.2% protein, industry standard for NY pizza. Excellent gluten development at 63%." },
      { brand: "Full Court Press", note: "Similar to All Trumps. Performs best at 62–65% hydration." },
      { brand: "King Arthur Bread Flour", note: "12.7% protein — moderate absorption. Start at 63% and don't exceed 66%." },
    ],
  },

  "All-Purpose Flour": {
    absorption: "Moderate",
    elevationNote:
      "Above 3,000 ft, add 1–3% hydration. AP flour has less gluten to hold structure, so don't over-hydrate. Reduce yeast by 10–15% at altitude to prevent over-proofing.",
    humidityNote:
      "AP flour is sensitive to humidity. On rainy or very humid days (65%+ RH), reduce hydration by 2–3%. In dry winter conditions, add 1–2%.",
    brandNotes: [
      { brand: "King Arthur AP", note: "11.7% protein — higher than most AP flours. Absorbs a bit more water; can handle 2% extra hydration." },
      { brand: "Gold Medal AP", note: "10.5% protein — standard absorption. Stick close to the recipe hydration." },
      { brand: "Bob's Red Mill AP", note: "About 11% protein. Moderate absorption; performs predictably at listed hydration." },
      { brand: "Heckers / Ceresota", note: "Northeast favorite, ~11.5% protein. Slightly higher absorption; great for tavern-style." },
    ],
  },

  "Bread Flour": {
    absorption: "Moderate to high",
    elevationNote:
      "Above 3,000 ft, increase hydration by 2–3%. The strong gluten network handles extra water well. At 5,000 ft+, add 3–5% and reduce yeast by 15–20%.",
    humidityNote:
      "In humid conditions (60%+ RH), pull back hydration by 1–2%. In very dry climates, you may need 3–4% more water than listed — dough should feel tacky but not sticky.",
    brandNotes: [
      { brand: "King Arthur Bread Flour", note: "12.7% protein — the gold standard. Reliable at listed hydration; strong gluten development." },
      { brand: "Gold Medal Better for Bread", note: "12.5% protein. Slightly lower absorption than KA. Reduce hydration by 1% if dough feels loose." },
      { brand: "Bob's Red Mill Artisan Bread", note: "12.5% protein. Good absorption; performs well at 70–72% for pan styles." },
      { brand: "Central Milling Organic Bread", note: "High-quality, consistent absorption. Works beautifully at listed hydration." },
    ],
  },

  "Bread Flour (or Bread + Semolina blend)": {
    absorption: "High (semolina increases absorption)",
    elevationNote:
      "Above 3,000 ft, add 2–3% hydration. If using a semolina blend, semolina absorbs more slowly — let the dough rest 20 min before judging hydration.",
    humidityNote:
      "Semolina is less affected by humidity than wheat flour, but the bread flour portion still reacts. Adjust the bread flour's water by 1–2% based on conditions.",
    brandNotes: [
      { brand: "King Arthur Bread + Semolina", note: "A 70/30 bread-to-semolina ratio works well. Expect slightly gritty texture and golden color." },
      { brand: "Caputo Semola Rimacinata", note: "Fine re-milled semolina. High absorption — start with a 75/25 blend and adjust." },
      { brand: "Bob's Red Mill Semolina", note: "Coarser grind, moderate absorption. Use a 70/30 or 80/20 blend for Sicilian." },
    ],
  },
};
