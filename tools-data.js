/**
 * Pizza Toolkit — Interactive Tool Data
 *
 * Data for: Fermentation Timer, Hydration Guide,
 * Oven Temperature Guide, and Dough Troubleshooting.
 */

// ══════════════════════════════════════════════════════
// 1. FERMENTATION SCHEDULES
// ══════════════════════════════════════════════════════
// Each step has: label, offsetMinutes (from mix start),
// duration (display text), and description.

const FERMENTATION_SCHEDULES = {
  neapolitan: {
    name: "Neapolitan",
    method: "Room Temperature",
    totalTime: "10–26 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, yeast. Knead until smooth and elastic (10–15 min)." },
      { label: "Bulk Ferment", offsetMin: 30, desc: "Cover and rest at room temperature. The dough should double in size." },
      { label: "Ball the Dough", offsetMin: 480, desc: "Divide and shape into tight balls. This is 8 hours in — adjust to your schedule." },
      { label: "Final Proof", offsetMin: 480, desc: "Let dough balls rest at room temp, covered, for 2 more hours." },
      { label: "Preheat Oven", offsetMin: 540, desc: "Get your oven as hot as possible. Preheat for at least 45–60 minutes." },
      { label: "Ready to Bake", offsetMin: 600, desc: "Stretch, top, and bake. The dough should be puffy, soft, and room temp." },
    ],
  },

  "new-york": {
    name: "New York Style",
    method: "Cold Ferment",
    totalTime: "26–74 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Knead 10–12 minutes until smooth." },
      { label: "Bulk Ferment (RT)", offsetMin: 15, desc: "Rest at room temperature for 1–2 hours until dough relaxes and starts rising." },
      { label: "Ball & Refrigerate", offsetMin: 90, desc: "Divide into balls, oil lightly, place in airtight containers. Refrigerate." },
      { label: "Cold Ferment", offsetMin: 120, desc: "Leave in fridge for 24–72 hours. This is where the flavor develops." },
      { label: "Pull from Fridge", offsetMin: 1560, desc: "Remove dough 2 hours before baking. Let it come to room temperature." },
      { label: "Preheat Oven", offsetMin: 1620, desc: "Preheat oven with steel or stone for at least 1 hour at max temp." },
      { label: "Ready to Bake", offsetMin: 1680, desc: "Stretch thin — it should be foldable. Top lightly and bake." },
    ],
  },

  "chicago-tavern": {
    name: "Chicago Tavern",
    method: "Cold Cure",
    totalTime: "2–4 days",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Mix until smooth — dough will be stiff." },
      { label: "Proof", offsetMin: 15, desc: "Cover and proof at room temperature for 2 hours." },
      { label: "Roll Thin", offsetMin: 135, desc: "Roll dough ¼\" thin on parchment paper." },
      { label: "Cold Cure", offsetMin: 150, desc: "Stack on parchment on a cookie sheet, cover. Refrigerate 2–4 days." },
      { label: "Pull from Fridge", offsetMin: 2880, desc: "Remove 1 hour before baking. Flip over and dress to the edge." },
      { label: "Preheat Oven", offsetMin: 2925, desc: "Preheat oven to 500°F+ with stone or steel for 45 minutes." },
      { label: "Ready to Bake", offsetMin: 2940, desc: "Top edge to edge. Bake until cracker-crisp bottom and bubbly cheese." },
    ],
  },

  detroit: {
    name: "Detroit Deep Dish",
    method: "Pan Proof",
    totalTime: "4–26 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Mix until shaggy, then knead until smooth." },
      { label: "Bulk Ferment", offsetMin: 15, desc: "Cover and rest at room temperature for 1–2 hours." },
      { label: "Pan & Stretch", offsetMin: 90, desc: "Oil the blue steel pan generously. Press dough into pan, pushing to edges." },
      { label: "Pan Proof", offsetMin: 120, desc: "Cover the pan. Let dough proof 2–4 hours at room temp (or overnight in fridge)." },
      { label: "Preheat Oven", offsetMin: 300, desc: "Preheat to 500–550°F for 45 minutes." },
      { label: "Top & Bake", offsetMin: 360, desc: "Push cheese to edges for the frico crust. Add sauce in racing stripes on top. Bake." },
    ],
  },

  sicilian: {
    name: "Sicilian",
    method: "Pan Proof",
    totalTime: "4–6 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Knead until smooth and elastic." },
      { label: "Bulk Ferment", offsetMin: 15, desc: "Cover and rest at room temperature for 1–2 hours." },
      { label: "Pan & Stretch", offsetMin: 90, desc: "Oil the sheet pan generously. Press dough into pan — it may spring back." },
      { label: "Rest & Re-stretch", offsetMin: 110, desc: "Let dough rest 20 minutes, then push it to the edges again." },
      { label: "Pan Proof", offsetMin: 130, desc: "Cover the pan. Let it rise 2–3 hours until thick and airy." },
      { label: "Preheat Oven", offsetMin: 270, desc: "Preheat to 475–525°F for 45 minutes." },
      { label: "Top & Bake", offsetMin: 310, desc: "Add toppings. The dough should be focaccia-like. Bake until golden." },
    ],
  },

  grandma: {
    name: "Grandma",
    method: "Quick Rise",
    totalTime: "1.5–2 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Mix until smooth — no long knead needed." },
      { label: "Brief Rest", offsetMin: 15, desc: "Let dough rest 30 minutes, covered." },
      { label: "Oil Pan & Press", offsetMin: 45, desc: "Oil the sheet pan very generously. Press dough to fill the pan." },
      { label: "Preheat Oven", offsetMin: 50, desc: "Preheat to 450–500°F." },
      { label: "Top & Bake", offsetMin: 90, desc: "Layer provolone, then sauce on top, then Pecorino. Bake until golden and bubbly." },
    ],
  },

  "thin-crust": {
    name: "Thin & Crispy",
    method: "Quick Rest",
    totalTime: "1.5–2 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, yeast. Mix until smooth — no extensive kneading." },
      { label: "Rest", offsetMin: 15, desc: "Cover and rest at room temperature for 1 hour. Gluten needs to relax." },
      { label: "Roll Thin", offsetMin: 75, desc: "Roll as thin as possible with a rolling pin. Dock with a fork to prevent bubbles." },
      { label: "Preheat Oven", offsetMin: 45, desc: "Preheat to 475–525°F with stone or steel for 45 minutes." },
      { label: "Top & Bake", offsetMin: 90, desc: "Keep toppings light — less is more. Bake until cracker-crisp." },
    ],
  },

  pan: {
    name: "Pan Pizza",
    method: "Cold Ferment",
    totalTime: "26–50 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, oil, sugar, yeast. Mix until shaggy, then knead until smooth." },
      { label: "Bulk Ferment (RT)", offsetMin: 15, desc: "Cover and rest at room temperature for 1 hour." },
      { label: "Refrigerate", offsetMin: 75, desc: "Place dough in oiled container. Refrigerate for 24–48 hours." },
      { label: "Pull from Fridge", offsetMin: 1515, desc: "Remove dough from fridge. Let it warm for 30 minutes." },
      { label: "Pan & Proof", offsetMin: 1545, desc: "Oil cast iron pan. Press dough in, let it rest 20 min, press again. Proof 1–2 hours." },
      { label: "Preheat Oven", offsetMin: 1665, desc: "Preheat to 450–500°F for 45 minutes." },
      { label: "Top & Bake", offsetMin: 1725, desc: "Cheese goes under the sauce. Bake until edges are deeply golden." },
    ],
  },

  "st-louis": {
    name: "St. Louis",
    method: "No Rise",
    totalTime: "30 minutes – 1 hour",
    steps: [
      { label: "Mix Dough", offsetMin: 0, desc: "Combine flour, water, salt (no yeast). Mix until a stiff, smooth dough forms — this is a cracker crust." },
      { label: "Rest", offsetMin: 10, desc: "Cover and rest 15–20 minutes. The gluten relaxes for easier rolling." },
      { label: "Roll Very Thin", offsetMin: 30, desc: "Roll the dough as thin as possible — 1/8 inch or less. Use a rolling pin, not hands." },
      { label: "Preheat Oven", offsetMin: 15, desc: "Preheat to 475–525°F with a stone or steel for even bottom heat." },
      { label: "Top & Bake", offsetMin: 45, desc: "Add sweet sauce, Provel cheese, and toppings. Bake until cracker-crisp bottom and bubbly cheese." },
    ],
  },

  "new-haven": {
    name: "New Haven Apizza",
    method: "Room Temperature",
    totalTime: "8–24 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine high-gluten flour, water, salt, yeast. Knead until smooth and elastic (10–15 min)." },
      { label: "Bulk Ferment", offsetMin: 30, desc: "Cover and rest at room temperature for 6–8 hours. The dough should more than double." },
      { label: "Ball the Dough", offsetMin: 480, desc: "Divide into larger balls (New Haven pies tend to be big). Shape tightly." },
      { label: "Final Proof", offsetMin: 510, desc: "Rest dough balls at room temp for 2–4 hours until puffy and relaxed." },
      { label: "Preheat Oven", offsetMin: 600, desc: "Get your oven as hot as possible. Coal-fired ovens hit 600–800°F. Home ovens — max temp with steel." },
      { label: "Ready to Bake", offsetMin: 660, desc: "Stretch into an oblong shape (not a perfect circle). Top sparingly — the crust is the star." },
    ],
  },

  "ohio-valley": {
    name: "Ohio Valley",
    method: "Room Temperature",
    totalTime: "2–3 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine bread flour, water, salt, oil, sugar, yeast. Knead until smooth." },
      { label: "Bulk Ferment", offsetMin: 15, desc: "Cover and rest at room temperature for 1–2 hours until doubled." },
      { label: "Sheet & Rest", offsetMin: 90, desc: "Press dough into an oiled sheet pan. Let rest 20 minutes if it springs back." },
      { label: "Preheat Oven", offsetMin: 75, desc: "Preheat to 475–525°F." },
      { label: "Top & Bake", offsetMin: 120, desc: "Add sauce and pepperoni (baked on). Bake until crust is golden." },
      { label: "Add Cold Cheese", offsetMin: 135, desc: "Immediately after removing from oven, pile on shredded provolone. Serve right away." },
    ],
  },

  "cast-iron": {
    name: "Cast Iron",
    method: "Quick Rise",
    totalTime: "1.5–3 hours",
    steps: [
      { label: "Mix & Knead", offsetMin: 0, desc: "Combine flour, water, salt, yeast, and a touch of sugar. Mix until smooth." },
      { label: "Bulk Ferment", offsetMin: 15, desc: "Cover and rest at room temperature for 1–2 hours until puffy." },
      { label: "Butter the Skillet", offsetMin: 90, desc: "Generously butter a 10 or 12-inch cast iron skillet. Press dough into the pan." },
      { label: "Pan Proof", offsetMin: 100, desc: "Let the dough rest in the buttered skillet for 20–30 minutes." },
      { label: "Stovetop Start", offsetMin: 130, desc: "Place skillet on stovetop over medium heat for 2–3 minutes to start crisping the bottom." },
      { label: "Top & Oven Finish", offsetMin: 135, desc: "Add toppings, transfer to a preheated 475–500°F oven. Bake until cheese is bubbly and crust is golden." },
    ],
  },

  "school-night": {
    name: "School Night (No Rise)",
    method: "No Rise",
    totalTime: "30 minutes",
    steps: [
      { label: "Mix Dough", offsetMin: 0, desc: "Combine flour, water, salt, oil, and extra yeast. Mix just until smooth — don't overwork." },
      { label: "Brief Rest", offsetMin: 8, desc: "Let dough rest 5 minutes while you prep toppings and preheat." },
      { label: "Preheat Oven", offsetMin: 5, desc: "Preheat to 475–500°F. Use a stone or steel if you have one." },
      { label: "Shape & Top", offsetMin: 15, desc: "Press or roll the dough directly on parchment. Add sauce, cheese, and toppings." },
      { label: "Bake", offsetMin: 20, desc: "Bake 8–12 minutes until cheese is melted and crust is golden. Dinner is served." },
    ],
  },
};


// ══════════════════════════════════════════════════════
// 2. HYDRATION RANGES BY STYLE
// ══════════════════════════════════════════════════════

const HYDRATION_RANGES = {
  neapolitan: {
    name: "Neapolitan",
    min: 58, max: 72, default: 65,
    sweet: { low: 62, high: 67 },
    effects: {
      low: "Stiffer dough, easier to handle, denser crumb. Can feel rubbery if too low. Good for beginners.",
      mid: "The sweet spot — soft, pliable dough with open crumb and good oven spring. Classic leopard spotting.",
      high: "Very soft, sticky dough. Beautiful open crumb but hard to handle. Requires strong shaping skills.",
    },
    notes: "Traditional Neapolitan specs (AVPN) call for 55.5–62% hydration, but most modern pizzaiolos push 63–68% for a lighter crumb.",
  },
  "new-york": {
    name: "New York Style",
    min: 56, max: 68, default: 63,
    sweet: { low: 61, high: 65 },
    effects: {
      low: "Stiff, easier to stretch thin. Chewier final texture. More cracker-like crunch.",
      mid: "Classic foldable NY slice. Chewy but with some airiness. Good balance of structure and tenderness.",
      high: "Softer, more bread-like crumb. Harder to stretch thin. Can sag when folded.",
    },
    notes: "NY dough needs enough structure to hold a fold. High-gluten flour can handle more water than AP — start at 63% and adjust.",
  },
  "chicago-tavern": {
    name: "Chicago Tavern",
    min: 42, max: 55, default: 50,
    sweet: { low: 48, high: 52 },
    effects: {
      low: "Very stiff, cracker-like. Easy to roll thin but can be tough. Classic tavern texture.",
      mid: "Perfect cracker-crisp crust. Rolls easily, holds its shape, snaps when you bite.",
      high: "Still crispable but slightly more tender. A bit harder to roll paper-thin.",
    },
    notes: "Tavern-style intentionally runs dry. The low hydration is what creates the cracker crunch. Don't fight it — embrace the stiff dough.",
  },
  detroit: {
    name: "Detroit Deep Dish",
    min: 65, max: 80, default: 72,
    sweet: { low: 70, high: 75 },
    effects: {
      low: "Denser crumb, less airy. Still gets a good frico edge but less open interior.",
      mid: "Light, airy, focaccia-like crumb. Beautiful open holes. Great oven spring in the pan.",
      high: "Very open crumb, almost ciabatta-like. Requires careful handling. Stunning when it works.",
    },
    notes: "Detroit dough loves water. The high hydration creates the signature airy texture. The pan does the shaping work — you just press and wait.",
  },
  sicilian: {
    name: "Sicilian",
    min: 60, max: 75, default: 68,
    sweet: { low: 65, high: 72 },
    effects: {
      low: "Denser, more bread-like. Easier to handle but less of that airy focaccia quality.",
      mid: "Thick, airy crumb with a crispy oiled bottom. Classic Sicilian texture.",
      high: "Very open crumb, almost spongy. Spectacular but needs a long proof to develop structure.",
    },
    notes: "Sicilian is essentially a flavored focaccia. Higher hydration gives that trademark pillowy texture. The olive oil helps keep it manageable.",
  },
  grandma: {
    name: "Grandma",
    min: 58, max: 72, default: 65,
    sweet: { low: 62, high: 68 },
    effects: {
      low: "Thinner, crispier result. Less puff, more crunch. Closer to a bar pizza.",
      mid: "Thin but with some chew. Oiled bottom gets perfectly crispy. Classic Grandma texture.",
      high: "Slightly more airy. Still presses thin but with more tenderness. Nice contrast with crispy bottom.",
    },
    notes: "Grandma is thinner than Sicilian. The generous oil does more for the texture than the hydration does — focus on a well-oiled pan.",
  },
  "thin-crust": {
    name: "Thin & Crispy",
    min: 45, max: 60, default: 55,
    sweet: { low: 52, high: 57 },
    effects: {
      low: "Very stiff, cracker-crisp. Easy to roll but can be tough. Snaps clean.",
      mid: "Crispy but with slight chew. Rolls out easily. Holds toppings without sagging.",
      high: "More tender, less snap. Harder to roll thin. Can get soggy with heavy toppings.",
    },
    notes: "This style is all about the crunch. Keep hydration moderate and roll it thin. Dock with a fork to prevent bubbles.",
  },
  pan: {
    name: "Pan Pizza",
    min: 63, max: 78, default: 70,
    sweet: { low: 68, high: 73 },
    effects: {
      low: "Denser, chewier crumb. Easier to handle. Still gets crispy edges from the oiled pan.",
      mid: "Buttery, tender crumb with great oven spring. Golden fried bottom. Classic pan pizza.",
      high: "Very airy interior, almost brioche-like. Stunning open crumb. Needs careful pan handling.",
    },
    notes: "Pan pizza dough is forgiving — the pan does the work. Higher hydration gives a lighter result, but even 65% makes a great pie.",
  },

  "st-louis": {
    name: "St. Louis",
    min: 40, max: 52, default: 47,
    sweet: { low: 45, high: 49 },
    effects: {
      low: "Extremely stiff and cracker-like. Rolls out paper-thin easily. Snaps like a crisp cracker.",
      mid: "Classic cracker crust. Stiff but workable. Rolls thin without tearing. Perfect snap.",
      high: "Still crispy but slightly more pliable. Easier to roll but less dramatic crunch.",
    },
    notes: "St. Louis crust is intentionally dry — some versions use no yeast at all. The low hydration creates the signature cracker texture. Don't be surprised by how stiff this dough feels.",
  },

  "new-haven": {
    name: "New Haven Apizza",
    min: 58, max: 68, default: 61,
    sweet: { low: 59, high: 64 },
    effects: {
      low: "Slightly denser, easier to stretch into the thin oblong shape. Good char development.",
      mid: "Classic New Haven texture — thin, charred, with just enough airiness in the cornicione. Stretches well.",
      high: "More open crumb, harder to keep thin. Beautiful leopard spotting but can puff more than traditional.",
    },
    notes: "New Haven dough runs leaner than Neapolitan — no oil, no sugar. The high-gluten flour handles the moderate hydration well. The coal-fired oven does the rest.",
  },

  "ohio-valley": {
    name: "Ohio Valley",
    min: 54, max: 64, default: 58,
    sweet: { low: 56, high: 61 },
    effects: {
      low: "Sturdier crust, easier to hold when loaded with cold cheese. More bread-like texture.",
      mid: "Medium-thickness crust with enough structure to support the pile of cold cheese on top.",
      high: "Softer, more tender crumb. The cold cheese can weigh it down — handle carefully.",
    },
    notes: "Ohio Valley crust needs to be sturdy enough to support a pile of cold cheese on top without collapsing. Don't go too high on hydration or you'll have a soggy base.",
  },

  "cast-iron": {
    name: "Cast Iron",
    min: 58, max: 68, default: 62,
    sweet: { low: 60, high: 65 },
    effects: {
      low: "Denser crumb, very easy to press into the skillet. Crispy butter-fried bottom.",
      mid: "Nice balance — enough airiness for a tender crumb with a stellar butter-crisped bottom.",
      high: "More open crumb, almost focaccia-like. The butter in the pan keeps it manageable.",
    },
    notes: "Cast-iron pizza is forgiving because the butter in the hot pan fries the bottom regardless. Focus more on the stovetop-to-oven technique than hydration precision.",
  },

  "school-night": {
    name: "School Night (No Rise)",
    min: 55, max: 65, default: 60,
    sweet: { low: 58, high: 62 },
    effects: {
      low: "Easier to handle and shape quickly. Slightly cracker-like texture since there's no rise.",
      mid: "Workable dough that presses out easily. Tender enough to be enjoyable despite no fermentation.",
      high: "Softer, slightly more bread-like. Harder to shape quickly. Can be sticky without rest time.",
    },
    notes: "Without fermentation, the hydration matters less for flavor and more for workability. Aim for a dough that's easy to press out quickly — you're not going for perfection, you're going for dinner.",
  },
};


// ══════════════════════════════════════════════════════
// 3. OVEN TEMPERATURE GUIDE
// ══════════════════════════════════════════════════════

const OVEN_SETUPS = [
  {
    id: "steel",
    name: "Home Oven \u2014 Pizza Steel",
    icon: "\uD83D\uDD29",
    tempRange: "450\u2013550\u00B0F (230\u2013290\u00B0C)",
    preheatTime: "45\u201360 minutes",
    heatTransfer: "High \u2014 steel conducts heat 18\u00D7 faster than stone. Fastest bottom crust in a home oven.",
    bestStyles: ["neapolitan", "new-york", "thin-crust", "chicago-tavern", "new-haven", "cast-iron", "school-night"],
    limitations: "Heavy (15\u201325 lbs). Expensive ($70\u2013150). Takes up oven space. Not needed for pan/sheet styles.",
    styleBakeTimes: {
      neapolitan: { time: "5\u20138 min", note: "Best home oven option for Neapolitan. Use broiler method \u2014 steel on top rack, broiler on." },
      "new-york": { time: "6\u20139 min", note: "Excellent results. Steel gives that classic pizzeria bottom char." },
      "chicago-tavern": { time: "8\u201312 min", note: "Cracker crust crisps fast on steel. Watch closely." },
      detroit: { time: "12\u201316 min", note: "Bake in pan \u2014 steel underneath helps but isn\u2019t essential." },
      sicilian: { time: "16\u201322 min", note: "Pan on steel. Helps with bottom crispness but stone works too." },
      grandma: { time: "14\u201320 min", note: "Steel gives excellent bottom fry. Great for Grandma style." },
      "thin-crust": { time: "5\u20137 min", note: "Fast! The steel crisps thin crust incredibly well. Don\u2019t walk away." },
      pan: { time: "12\u201318 min", note: "Cast iron + steel = double the bottom heat. Excellent." },
      "st-louis": { time: "6\u201310 min", note: "Steel crisps the thin cracker crust fast. Watch closely." },
      "new-haven": { time: "5\u20138 min", note: "Steel + broiler gets closest to coal-fired char at home." },
      "ohio-valley": { time: "10\u201314 min", note: "Good bottom crisp from the steel. Add cold cheese when it comes out." },
      "cast-iron": { time: "10\u201314 min", note: "Stovetop start + transfer to steel. Double the bottom-crisping power." },
      "school-night": { time: "6\u201310 min", note: "Steel gets dinner done even faster. 6 minutes on a hot steel." },
    },
    tips: [
      "The broiler method: steel on top rack + broiler = closest to a pizza oven at home.",
      "Steel recovers heat between pizzas much faster than stone.",
      "Clean with a scraper while warm. Season with oil occasionally.",
      "A \u00BC\u2033 steel is minimum \u2014 \u215C\u2033 is better for heat storage.",
    ],
  },
  {
    id: "stone",
    name: "Home Oven \u2014 Pizza Stone",
    icon: "\uD83E\uDEA8",
    tempRange: "450\u2013550\u00B0F (230\u2013290\u00B0C)",
    preheatTime: "60 minutes minimum",
    heatTransfer: "Moderate \u2014 stone absorbs then radiates heat. Good heat retention once hot.",
    bestStyles: ["new-york", "chicago-tavern", "sicilian", "grandma", "thin-crust", "ohio-valley", "school-night", "st-louis"],
    limitations: "Takes longer to recover heat between pizzas. Can crack with thermal shock \u2014 always preheat gradually.",
    styleBakeTimes: {
      neapolitan: { time: "8\u201312 min", note: "Won\u2019t get true leopard charring, but still great. Use broiler for last 2 min." },
      "new-york": { time: "8\u201312 min", note: "Works well. Get the stone on a high rack close to the broiler." },
      "chicago-tavern": { time: "10\u201314 min", note: "Place on stone directly. Cracker crust develops nicely." },
      detroit: { time: "12\u201318 min", note: "Bake in the pan on the stone. The stone helps crisp the bottom." },
      sicilian: { time: "18\u201325 min", note: "Pan on stone. Move to higher rack for the last few minutes." },
      grandma: { time: "16\u201322 min", note: "Pan on stone gives great bottom crust. Watch the edges." },
      "thin-crust": { time: "7\u201310 min", note: "Quick bake. Watch carefully \u2014 thin crust goes from done to burnt fast." },
      pan: { time: "14\u201320 min", note: "Cast iron on stone. Great combo for bottom heat." },
      "st-louis": { time: "8\u201312 min", note: "Cracker crust bakes fast. Watch for browning \u2014 it goes quick on stone." },
      "new-haven": { time: "7\u201310 min", note: "Get the stone screaming hot. Use broiler for char if your oven maxes at 550\u00B0F." },
      "ohio-valley": { time: "12\u201316 min", note: "Bake with sauce and pepperoni. Add cold cheese immediately after pulling." },
      "cast-iron": { time: "12\u201316 min", note: "Start on stovetop, then skillet on stone to finish. Great bottom heat." },
      "school-night": { time: "8\u201312 min", note: "Fast bake \u2014 no need for long preheating if you\u2019re in a rush." },
    },
    tips: [
      "Place stone on lowest rack for maximum preheat.",
      "Use parchment paper to slide pizza on \u2014 remove parchment after 2 minutes.",
      "Let stone cool completely in the oven to avoid cracking.",
      "Lightly flour or use semolina on the peel for easy sliding.",
    ],
  },
  {
    id: "rack",
    name: "Home Oven \u2014 Rack Only",
    icon: "\uD83C\uDF73",
    tempRange: "400\u2013550\u00B0F (205\u2013290\u00B0C)",
    preheatTime: "20\u201330 minutes",
    heatTransfer: "Low \u2014 air convection only. No thermal mass for bottom crust. Best for pan and sheet-pan styles where the pan provides heat transfer.",
    bestStyles: ["detroit", "sicilian", "grandma", "pan", "ohio-valley", "cast-iron"],
    limitations: "No stone or steel means weaker bottom crust for free-form pizzas. Best reserved for styles baked in a pan.",
    styleBakeTimes: {
      neapolitan: { time: "12\u201318 min", note: "Not ideal \u2014 the bottom will be pale. Use a sheet pan inverted as a makeshift steel if possible." },
      "new-york": { time: "12\u201318 min", note: "Workable on a sheet pan but won\u2019t get pizzeria-quality bottom. Consider an inverted sheet pan as a baking surface." },
      "chicago-tavern": { time: "12\u201316 min", note: "Sheet pan works well. The thin crust crisps adequately on a hot pan." },
      detroit: { time: "14\u201320 min", note: "The heavy pan does the work \u2014 rack only is fine for Detroit style." },
      sicilian: { time: "20\u201328 min", note: "Sheet pan on the rack. The pan\u2019s oil fries the bottom." },
      grandma: { time: "18\u201325 min", note: "Dark metal pan on lower rack works well for Grandma." },
      "thin-crust": { time: "10\u201314 min", note: "Use a preheated sheet pan. Results are acceptable but not ideal." },
      pan: { time: "16\u201322 min", note: "Cast iron on rack works great \u2014 the pan provides its own heat mass." },
      "st-louis": { time: "10\u201314 min", note: "Sheet pan works. The cracker crust doesn\u2019t need intense bottom heat." },
      "new-haven": { time: "10\u201315 min", note: "Not ideal \u2014 won\u2019t get proper char. A steel or portable oven is strongly recommended." },
      "ohio-valley": { time: "14\u201318 min", note: "Sheet pan on rack is the traditional method. Works perfectly." },
      "cast-iron": { time: "14\u201318 min", note: "Stovetop start compensates for no stone. The skillet does the heavy lifting." },
      "school-night": { time: "10\u201315 min", note: "Works fine for a quick weeknight bake. Use a sheet pan." },
    },
    tips: [
      "Place a heavy sheet pan or cast iron in the oven during preheat for better bottom heat.",
      "Lower rack position helps compensate for the lack of a stone or steel.",
      "For pan styles (Detroit, Sicilian, Grandma), rack-only is perfectly fine \u2014 the pan does the work.",
      "Convection mode (if available) improves results by circulating hot air more evenly.",
    ],
  },
  {
    id: "portable",
    name: "Portable Pizza Oven (Gas)",
    icon: "\uD83D\uDD25",
    tempRange: "750\u2013950\u00B0F (400\u2013510\u00B0C)",
    preheatTime: "15\u201320 minutes",
    heatTransfer: "Very high \u2014 direct flame + stone floor. Closest to wood-fired performance in a compact package.",
    bestStyles: ["neapolitan", "new-york", "thin-crust", "new-haven"],
    limitations: "Small opening \u2014 max 12\u201313\u2033 pizza. Learning curve for flame management. Not ideal for pan/sheet styles.",
    styleBakeTimes: {
      neapolitan: { time: "60\u201390 sec", note: "This is what portable ovens are built for. Rotate every 15\u201320 seconds." },
      "new-york": { time: "3\u20135 min", note: "Back off the temp to ~650\u00B0F. NY dough needs a bit longer to crisp." },
      "chicago-tavern": { time: "3\u20135 min", note: "Lower temp (~600\u00B0F). The thin crust chars fast \u2014 watch carefully." },
      detroit: { time: "Not ideal", note: "Pan won\u2019t fit most portable ovens. Use your home oven instead." },
      sicilian: { time: "Not ideal", note: "Sheet pans don\u2019t fit. Use your home oven for Sicilian." },
      grandma: { time: "Not ideal", note: "Sheet pans don\u2019t fit. Use your home oven for Grandma." },
      "thin-crust": { time: "90 sec\u20133 min", note: "Lower temp (~600\u00B0F). Thin crust can scorch in seconds at full heat." },
      pan: { time: "Not ideal", note: "Cast iron can fit some portable ovens, but bottom heat is tricky. Home oven is better." },
      "st-louis": { time: "2\u20134 min", note: "Lower temp (~600\u00B0F). Paper-thin crust chars in seconds at full heat." },
      "new-haven": { time: "90 sec\u20133 min", note: "Portable ovens can replicate coal-oven intensity well." },
      "ohio-valley": { time: "3\u20135 min", note: "Bake the base in the portable oven, then add cold cheese outside." },
      "cast-iron": { time: "Not ideal", note: "Skillet may fit smaller portable ovens but the stovetop step is lost. Use home oven." },
      "school-night": { time: "2\u20134 min", note: "Quick dough + quick oven = dinner in 20 minutes total." },
    },
    tips: [
      "Turn pizza every 15\u201320 seconds for even charring.",
      "Use a small turning peel \u2014 essential for portable oven cooking.",
      "Let the stone floor fully heat \u2014 the top of the oven heats first.",
      "Gas models give the most consistent, controllable heat output.",
    ],
  },
  {
    id: "wood-fired",
    name: "Wood-Fired Pizza Oven",
    icon: "\uD83E\uDEB5",
    tempRange: "800\u20131,000\u00B0F (425\u2013540\u00B0C)",
    preheatTime: "1\u20132 hours (fire management)",
    heatTransfer: "Extreme \u2014 radiant heat from dome + conductive heat from floor. Unmatched char and flavor.",
    bestStyles: ["neapolitan", "new-york", "thin-crust", "new-haven"],
    limitations: "Expensive ($500\u2013$5,000+). Requires fire-building skill. Weather dependent. Space needed. Long preheat.",
    styleBakeTimes: {
      neapolitan: { time: "60\u201390 sec", note: "The gold standard. A well-built fire gives the authentic leopard-spotted cornicione." },
      "new-york": { time: "3\u20135 min", note: "Let the fire die down slightly (~700\u00B0F). NY needs lower, slower heat." },
      "chicago-tavern": { time: "4\u20136 min", note: "Moderate fire. The smokiness adds character to tavern-style." },
      detroit: { time: "10\u201314 min", note: "Possible with a cooled-down oven. Pan goes on the floor." },
      sicilian: { time: "12\u201318 min", note: "Works with moderate fire. Sheet pan on the floor. Beautiful smoky crust." },
      grandma: { time: "10\u201315 min", note: "Moderate fire works well. The wood flavor elevates Grandma pizza." },
      "thin-crust": { time: "90 sec\u20133 min", note: "Moderate fire. Thin crust chars fast \u2014 be ready with your peel." },
      pan: { time: "10\u201315 min", note: "Cast iron on the oven floor with moderate fire. Smoky, crispy, incredible." },
      "st-louis": { time: "3\u20135 min", note: "Moderate fire. The smokiness is a nice bonus for the cracker crust." },
      "new-haven": { time: "90 sec\u20132 min", note: "Wood-fired is the closest substitute for coal. Get it ripping hot." },
      "ohio-valley": { time: "6\u201310 min", note: "Moderate fire. Bake the base, pull, pile cold cheese. Smoky contrast." },
      "cast-iron": { time: "8\u201312 min", note: "Skillet on the oven floor. Skip the stovetop step \u2014 the fire does the work." },
      "school-night": { time: "3\u20135 min", note: "Moderate fire. Quick dough in a wood-fired oven is underrated." },
    },
    tips: [
      "Build the fire 1\u20132 hours ahead. Push coals to the side when ready.",
      "The floor is ready when flour tossed on it browns in 2\u20133 seconds.",
      "Rotate pizza 90\u00B0 every 15\u201320 seconds for even bake.",
      "Hardwoods (oak, maple, cherry) burn hotter and longer than softwoods.",
    ],
  },
];


// ══════════════════════════════════════════════════════
// 4. DOUGH TROUBLESHOOTING TREE
// ══════════════════════════════════════════════════════
// Each problem has a series of questions. Each question
// has options that lead to a fix or another question.

const TROUBLESHOOTING_TREE = {
  sticky: {
    symptom: "Dough is Sticky",
    icon: "🫠",
    initial: "q1",
    questions: {
      q1: {
        text: "When is it sticky?",
        options: [
          { label: "During mixing / kneading", next: "fix-mixing" },
          { label: "After fermentation", next: "q2" },
          { label: "When stretching", next: "fix-stretching-sticky" },
        ],
      },
      q2: {
        text: "Did you measure the water accurately?",
        options: [
          { label: "I may have added too much", next: "fix-too-much-water" },
          { label: "I measured carefully", next: "fix-flour-humidity" },
        ],
      },
    },
    fixes: {
      "fix-mixing": {
        title: "Normal — Gluten Hasn't Developed Yet",
        steps: [
          "This is completely normal! Dough starts sticky and becomes smooth as gluten develops.",
          "Continue kneading for 8–12 minutes. The dough will pull away from the counter.",
          "If using a stand mixer, mix on speed 2 for 8–10 minutes. It'll wrap around the hook.",
          "Try the 'slap and fold' technique — pick up the dough, slap it on the counter, fold it over. Repeat.",
          "Resist adding extra flour during mixing. It will come together.",
        ],
      },
      "fix-too-much-water": {
        title: "Too Much Water — Adjust the Dough",
        steps: [
          "Add flour 1 tablespoon at a time, kneading after each addition.",
          "Stop when the dough feels tacky (sticks slightly) but not wet.",
          "For next time: hold back 5–10% of the water and add gradually.",
          "Use a kitchen scale — water measurement by volume can be off by 5–10%.",
          "Some flour absorbs more than others. High-protein flour can handle more water.",
        ],
      },
      "fix-flour-humidity": {
        title: "Flour or Humidity Issue",
        steps: [
          "Your flour may have absorbed ambient moisture, especially in humid climates (60%+ RH).",
          "Add 1–2 tablespoons of flour and knead in. Wait 10 minutes to reassess.",
          "Try the 'autolyse' method: let the dough rest 20–30 minutes. Gluten develops and it becomes less sticky.",
          "Lower-protein flour (like AP) absorbs less water — reduce hydration by 2–3% next time.",
          "In very humid weather, reduce your recipe's water by 2–3% preemptively.",
          "Store flour in an airtight container to prevent moisture absorption.",
        ],
      },
      "fix-stretching-sticky": {
        title: "Sticky When Stretching",
        steps: [
          "Generously flour your work surface and the top of the dough ball.",
          "Use semolina or a 50/50 mix of semolina and flour — it prevents sticking better.",
          "If the dough is warm and sticky, refrigerate it for 20–30 minutes to firm up.",
          "Oil your hands instead of using flour for a different approach (especially for high-hydration doughs).",
          "The dough may be over-proofed — check if it's very slack and tears easily.",
        ],
      },
    },
  },

  tight: {
    symptom: "Dough is Too Tight",
    icon: "💪",
    initial: "q1",
    questions: {
      q1: {
        text: "When is it resisting?",
        options: [
          { label: "Right after mixing", next: "fix-fresh-mix" },
          { label: "After refrigeration", next: "fix-cold-dough" },
          { label: "After balling", next: "fix-post-ball" },
        ],
      },
    },
    fixes: {
      "fix-fresh-mix": {
        title: "Over-Developed Gluten from Mixing",
        steps: [
          "The gluten is tight from kneading. This is normal — it just needs time to relax.",
          "Cover the dough and let it rest 15–20 minutes. The gluten will relax significantly.",
          "After resting, try shaping again. It should be noticeably more cooperative.",
          "If it's still very tight, your hydration may be too low. Next time, add 2–3% more water.",
          "For very stiff doughs (like tavern-style), a short rest is essential before rolling.",
        ],
      },
      "fix-cold-dough": {
        title: "Cold Dough — Needs to Warm Up",
        steps: [
          "Cold gluten is tight gluten. This is physics, not a problem with your dough.",
          "Let the dough sit at room temperature for 1.5–2 hours before stretching.",
          "Place the container in a warm spot (near the oven, in sunlight) to speed warming.",
          "Don't try to force cold dough — you'll tear it or fight it the whole time.",
          "The dough is ready when it feels soft, pliable, and slightly puffy.",
        ],
      },
      "fix-post-ball": {
        title: "Freshly Balled — Needs to Relax",
        steps: [
          "Balling creates tension in the dough. It needs 30–60 minutes to relax.",
          "Cover the dough balls with a damp towel or plastic wrap to prevent drying.",
          "The dough is ready to stretch when a gentle poke leaves an indentation that slowly springs back (but doesn't snap).",
          "If it's been over an hour and it's still tight, hydration may be too low.",
          "Tight dough can also mean the yeast is sluggish — check that it's active and the dough has risen.",
        ],
      },
    },
  },

  stretch: {
    symptom: "Won't Stretch / Shrinks Back",
    icon: "🔄",
    initial: "q1",
    questions: {
      q1: {
        text: "What happens when you try to stretch?",
        options: [
          { label: "It springs back to a smaller size", next: "q2" },
          { label: "It stretches but slowly returns", next: "fix-gluten-tension" },
          { label: "The center stretches but edges are thick", next: "fix-thick-edges" },
        ],
      },
      q2: {
        text: "Is the dough cold?",
        options: [
          { label: "Yes, from the fridge", next: "fix-cold-stretch" },
          { label: "No, it's room temperature", next: "fix-underproofed" },
        ],
      },
    },
    fixes: {
      "fix-cold-stretch": {
        title: "Cold Dough Won't Stretch",
        steps: [
          "Let the dough warm to room temperature for 1.5–2 hours.",
          "Cold gluten is elastic — it will fight you until it warms up.",
          "Don't try to stretch cold dough by force. You'll create uneven thickness and potentially tear it.",
          "If you're in a rush, place the covered dough near a warm oven (not on it) for 30–45 minutes.",
          "The dough is ready when it feels soft and a poke slowly fills back in.",
        ],
      },
      "fix-gluten-tension": {
        title: "Gluten Tension — Rest More",
        steps: [
          "The gluten needs more time to relax. Put the dough down and wait 10–15 minutes.",
          "Stretching in stages works: stretch a bit, rest 5 min, stretch more.",
          "Very strong flour (high-gluten, bread flour) creates more tension and needs more rest.",
          "If you over-handled the dough, it's fighting back. Walk away for 15 minutes.",
          "Gently press from center outward rather than pulling the edges.",
        ],
      },
      "fix-thick-edges": {
        title: "Thick Edges — Technique Adjustment",
        steps: [
          "This is a shaping technique issue, not a dough problem.",
          "Press from the center outward, leaving the last ½ inch for the crust (cornicione).",
          "Try the 'steering wheel' method: hold the dough vertically and rotate, letting gravity stretch it.",
          "For Neapolitan, the cornicione should be puffy and thick — that's intentional.",
          "For NY and thin-crust, use your fingertips to press the edges thinner.",
          "Never use a rolling pin for Neapolitan or NY — it deflates the air bubbles.",
        ],
      },
      "fix-underproofed": {
        title: "Possibly Under-Proofed",
        steps: [
          "If the dough hasn't fermented enough, the gluten hasn't relaxed and gas hasn't developed.",
          "Check: does the dough feel dense and heavy? It probably needs more time.",
          "Give it another 30–60 minutes at room temperature, covered.",
          "The 'poke test': press a floured finger into the dough. If it springs back quickly, it needs more time. If it fills back slowly, it's ready.",
          "Temperature matters — in a cold kitchen (below 68°F), fermentation slows dramatically.",
        ],
      },
    },
  },

  tearing: {
    symptom: "Dough is Tearing",
    icon: "😫",
    initial: "q1",
    questions: {
      q1: {
        text: "When does it tear?",
        options: [
          { label: "During initial stretch", next: "fix-weak-gluten" },
          { label: "At thin spots or edges", next: "fix-thin-spots" },
          { label: "It rips apart immediately", next: "fix-overproofed" },
        ],
      },
    },
    fixes: {
      "fix-weak-gluten": {
        title: "Under-Developed Gluten",
        steps: [
          "The dough wasn't kneaded enough to build gluten structure.",
          "Try the 'windowpane test': stretch a small piece thin. If it tears before going translucent, knead more.",
          "Fold the dough over itself a few times and let it rest 15–20 minutes, then try again.",
          "Next time, knead for a full 10–12 minutes, or use the stretch-and-fold method over 2 hours.",
          "High-hydration doughs benefit from the stretch-and-fold technique rather than traditional kneading.",
        ],
      },
      "fix-thin-spots": {
        title: "Uneven Stretching",
        steps: [
          "You've stretched some spots too thin while others are still thick.",
          "Work from the center outward with even, gentle pressure.",
          "Rotate the dough 90° frequently while stretching.",
          "If a thin spot develops, avoid that area and work the thicker parts.",
          "Patch small tears by folding a tiny bit of dough from the edge over the hole and pressing to seal.",
          "A small hole in the center is fine — it won't matter once topped.",
        ],
      },
      "fix-overproofed": {
        title: "Over-Proofed Dough",
        steps: [
          "If the dough tears apart easily and feels extremely slack, the gluten has broken down from over-fermentation.",
          "Signs: very flat dough ball, smells strongly of alcohol, large uneven bubbles on surface.",
          "Unfortunately, severely over-proofed dough can't be fully rescued.",
          "You can try: gently reshape it and bake it as a flatbread or focaccia.",
          "For next time: watch the clock and temperature. Warmer = faster fermentation.",
          "Use the poke test: if the dough doesn't spring back at all, it's over-proofed.",
          "Cold-fermenting (in the fridge) gives you a much wider window and more flavor.",
        ],
      },
    },
  },
};

// ══════════════════════════════════════════════════════
// 5. DDT (Desired Dough Temperature) PRESETS
// ══════════════════════════════════════════════════════
const DDT_PRESETS = {
  "":            { ddt: 76, friction: 28, label: "General (default)" },
  neapolitan:    { ddt: 75, friction: 25, label: "Neapolitan" },
  "new-york":    { ddt: 78, friction: 28, label: "New York" },
  "new-haven":   { ddt: 76, friction: 25, label: "New Haven" },
  sicilian:      { ddt: 78, friction: 28, label: "Sicilian" },
  detroit:       { ddt: 78, friction: 28, label: "Detroit" },
  grandma:       { ddt: 76, friction: 25, label: "Grandma" },
  pan:           { ddt: 78, friction: 28, label: "Pan" },
};
