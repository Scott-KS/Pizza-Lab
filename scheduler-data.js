/**
 * Dough Scheduler — Backward-Scheduling Engine
 *
 * Data and logic for computing a complete dough schedule
 * by working backward from a target "eat" time.
 * Each pizza style has its own authentic step sequence.
 */

// ══════════════════════════════════════════════════════
// 1. OVEN PREHEAT TIMES (minutes)
// ══════════════════════════════════════════════════════

const OVEN_PREHEAT_MINUTES = {
  steel:        55,  // 45–60 min, 55 for safety
  stone:        60,  // 60 min minimum
  rack:         30,  // standard home oven, no thermal mass
  portable:     20,  // gas portable oven, 15–20 min
  "wood-fired": 90,  // 1–2 hours fire management
};


// ══════════════════════════════════════════════════════
// 2. FERMENTATION METHODS
// ══════════════════════════════════════════════════════

const FERMENT_METHODS = {
  "cold-72": {
    id: "cold-72",
    label: "72-Hour Cold Ferment",
    description: "Maximum flavor development. Three days of cold fermentation produces deep, complex flavor with excellent texture and an open, airy crumb.",
    reason: "You have plenty of time \u2014 let\u2019s use it. A 72-hour cold ferment gives the best possible flavor and texture.",
    minHoursNeeded: 76,
    isColdFerment: true,
    bulkFermentMinutes: 90,
    coldFermentHours: 72,
    pullBeforePreheatMinutes: 120,
  },
  "cold-48": {
    id: "cold-48",
    label: "48-Hour Cold Ferment",
    description: "Great balance of flavor and convenience. Two days in the fridge develops rich, complex taste with good texture.",
    reason: "With about two days available, a 48-hour cold ferment gives excellent results \u2014 noticeably better flavor than same-day.",
    minHoursNeeded: 52,
    isColdFerment: true,
    bulkFermentMinutes: 90,
    coldFermentHours: 48,
    pullBeforePreheatMinutes: 120,
  },
  "cold-24": {
    id: "cold-24",
    label: "24-Hour Cold Ferment",
    description: "The practical choice. One day in the fridge still adds noticeable flavor complexity over same-day dough.",
    reason: "You\u2019ve got about a day \u2014 a 24-hour cold ferment adds real flavor without the multi-day commitment.",
    minHoursNeeded: 28,
    isColdFerment: true,
    bulkFermentMinutes: 90,
    coldFermentHours: 24,
    pullBeforePreheatMinutes: 120,
  },
  "cure-24": {
    id: "cure-24",
    label: "24-Hour Dough Cure",
    description: "Chicago Tavern style. Rolled dough skins are stacked between parchment and refrigerated uncovered for 24 hours. The exposed surface dries out, producing the cracker-snap crust that defines the style.",
    reason: "Chicago Tavern dough must be cured uncovered \u2014 it\u2019s what gives the crust its signature snap.",
    minHoursNeeded: 52,
    isColdFerment: false,
    bulkFermentMinutes: 60,
    coldFermentHours: 0,
    pullBeforePreheatMinutes: 30,
  },
  "same-day": {
    id: "same-day",
    label: "Same-Day Room Temperature",
    description: "When time is short. A full room-temperature rise gives decent texture but less complex flavor than cold ferment.",
    reason: "With less than a day available, a same-day room-temperature rise is your best bet. It\u2019ll still be homemade and delicious.",
    minHoursNeeded: 0,
    isColdFerment: false,
    bulkFermentMinutes: 360,
    coldFermentHours: 0,
    pullBeforePreheatMinutes: 0,
  },
};

// Styles with fixed fermentation paths (not user-selectable)
const NO_RISE_STYLES = ["st-louis", "school-night"];
const CURING_STYLES = ["chicago-tavern"];


// ══════════════════════════════════════════════════════
// 3. SCHEDULE STEP TEMPLATES
// ══════════════════════════════════════════════════════

const SCHEDULE_STEP_TEMPLATES = {
  // ── Mixing & Development ───────────────────────────
  mix: {
    id: "mix",
    label: "Mix",
    instruction: "Combine all dough ingredients. Mix until fully incorporated, then knead until smooth and elastic.",
    why: "Thorough mixing hydrates the flour and begins developing the gluten network that gives pizza dough its structure and stretch.",
    duration: "~10 min",
  },
  fold: {
    id: "fold",
    label: "Fold the Dough",
    instruction: "Fold the dough like a letter: top edge down to center, then bottom up to overlap. This builds strength and redistributes yeast food.",
    why: "A single fold after the initial rest adds structural strength to the dough without degassing it. It aligns gluten strands and evens out fermentation.",
    duration: "~2 min",
  },
  "stretch-fold": {
    id: "stretch-fold",
    label: "Stretch & Fold",
    instruction: "Wet your hands. Pull one side of the dough up and fold it over the center. Rotate 90\u00B0 and repeat \u2014 4 folds total. Cover and let rest.",
    why: "Stretch and folds align gluten strands without aggressive kneading, building strength while maintaining an open crumb structure.",
    duration: "~5 min",
  },

  // ── Fermentation ───────────────────────────────────
  "bulk-ferment": {
    id: "bulk-ferment",
    label: "Bulk Fermentation",
    instruction: "Cover the dough and let it rest at room temperature until it has roughly doubled in size.",
    why: "Bulk fermentation develops gluten structure through yeast activity and enzymatic action. The dough rises, becomes extensible, and develops complex flavor.",
    duration: null,
  },
  "second-proof": {
    id: "second-proof",
    label: "Proof the Dough Balls",
    instruction: "Place shaped dough balls in proofing boxes or on a lightly floured tray, spaced apart. Cover and let proof at room temperature.",
    why: "The second proof after balling lets the dough relax and develop additional flavor. Properly proofed balls stretch easily without springing back or tearing.",
    duration: null,
  },

  // ── Shaping & Division ─────────────────────────────
  ball: {
    id: "ball",
    label: "Ball the Dough",
    instruction: null,
    why: "Shaping into balls creates surface tension that helps the dough hold its shape during proofing and makes stretching easier later.",
    duration: "~10 min",
  },

  // ── Cold Storage ───────────────────────────────────
  "into-fridge": {
    id: "into-fridge",
    label: "Into the Fridge",
    instruction: "Place each dough ball in a lightly oiled container or on a lightly oiled sheet pan. Cover tightly with plastic wrap and refrigerate.",
    why: "Cold fermentation slows yeast activity, allowing enzymes to develop complex flavors and improve the dough\u2019s texture and extensibility. Time in the fridge = better pizza.",
    duration: null,
    coldFermentOnly: true,
  },
  "pull-from-fridge": {
    id: "pull-from-fridge",
    label: "Pull from Fridge",
    instruction: "Remove dough from the fridge and let it come to room temperature. The dough should feel soft and pliable, not cold and stiff, before you work with it.",
    why: "Cold gluten is tight and elastic \u2014 it\u2019ll spring back and resist stretching. Warming to room temperature lets the gluten relax so the dough stretches smoothly without tearing.",
    duration: "~2 hours",
    coldFermentOnly: true,
  },

  // ── Chicago Tavern Specific ────────────────────────
  "sheet-roll": {
    id: "sheet-roll",
    label: "Sheet / Roll the Dough",
    instruction: "Run each dough ball through a sheeter or roll firmly with a rolling pin, incorporating flour into the surface. Target paper-thin, no more than 1/8\u2033 thick. Trim edges to a clean circle with a pizza cutter.",
    why: "Chicago Tavern dough is mechanically compressed, never hand-stretched. The sheeter/pin incorporates flour into the surface which contributes to crispiness. The thin, even thickness is what produces the cracker-snap texture.",
    duration: "~5 min",
  },
  dock: {
    id: "dock",
    label: "Dock the Dough",
    instruction: "Perforate the entire dough surface with a docker or fork. Cover every inch \u2014 no bubbles allowed.",
    why: "Docking prevents the thin dough from puffing up like pita bread during baking. It keeps the crust flat, even, and cracker-like across the entire surface.",
    duration: "~2 min",
  },
  "cure-uncovered": {
    id: "cure-uncovered",
    label: "Cure Uncovered on Parchment",
    instruction: "Stack the rolled, docked dough discs between sheets of parchment paper. Refrigerate UNCOVERED for approximately 24 hours. Do not wrap in plastic \u2014 the exposed surface must dry out. Do not exceed 24 hours or the dough becomes brittle.",
    why: "This is what makes tavern style unique. The uncovered cure dries the dough surface. When inverted for baking, the dried side becomes the bottom and bakes to an extremely crisp, cracker-like texture. No other pizza style uses this technique.",
    duration: "~24 hours",
  },

  // ── Pan & Sheet Styles ─────────────────────────────
  "oil-pan": {
    id: "oil-pan",
    label: "Oil the Pan",
    instruction: "Generously coat your pan with olive oil \u2014 at least 3\u20134 tablespoons. The oil should pool visibly. This is what fries the bottom of the crust during baking.",
    why: "The generous oil layer essentially shallow-fries the bottom crust during baking, creating the crispy, golden base that defines pan and sheet-pan pizza styles.",
    duration: "~2 min",
  },
  "press-first": {
    id: "press-first",
    label: "First Press into Pan",
    instruction: "Place the dough ball in the oiled pan. Using flat palms, press with 8\u201310 firm presses only. Do NOT try to fill the pan on the first attempt \u2014 the dough will spring back.",
    why: "Detroit-style dough must be pressed in stages. Forcing it to fill the pan in one attempt tears the gluten and creates an uneven crust. The first press starts the process; the rest happens after relaxation.",
    duration: "~2 min",
  },
  "rest-in-pan": {
    id: "rest-in-pan",
    label: "Rest in Pan",
    instruction: "Cover the pan and let the dough relax for 15\u201320 minutes. The gluten needs to de-tension before the second press.",
    why: "After pressing, the gluten is tight and elastic. This rest lets it relax so you can easily push the dough to fill the pan completely on the second attempt.",
    duration: "~20 min",
  },
  "press-to-edges": {
    id: "press-to-edges",
    label: "Press to Edges & Corners",
    instruction: "Press the relaxed dough to fill the pan completely, pushing firmly into all four corners and slightly up the sides. The dough should be even across the entire surface.",
    why: "Full coverage is essential \u2014 the cheese needs to reach the pan walls to create the caramelized frico crust that defines Detroit style.",
    duration: "~2 min",
  },
  "proof-in-pan": {
    id: "proof-in-pan",
    label: "Proof in Pan",
    instruction: null,
    why: "The in-pan proof is what creates the thick, airy interior. Under-proofed dough produces a dense, bready crust. Properly proofed dough rises to fill the pan and creates the signature light, open crumb.",
    duration: null,
  },
  "dimple-rest": {
    id: "dimple-rest",
    label: "Dimple & Stretch in Pan",
    instruction: "Press and dimple the dough with oiled fingertips, working from center outward. When it springs back, stop, cover, and wait 10 minutes. Repeat until the dough fills the pan.",
    why: "Patient dimpling with rests between rounds lets the gluten relax gradually. Forcing the dough tears it and creates an uneven crust. This technique produces an even, well-stretched base.",
    duration: "~30 min",
  },
  parbake: {
    id: "parbake",
    label: "Parbake the Crust",
    instruction: null,
    why: "Parbaking stabilizes a thick crust so it won\u2019t be gummy or doughy under the weight of toppings. It drives out excess moisture and sets the structure before the toppings go on.",
    duration: null,
  },
  "second-bake": {
    id: "second-bake",
    label: "Top & Second Bake",
    instruction: null,
    why: "The second bake with toppings finishes the pizza. The parbaked crust is now stable enough to support heavy toppings without going soggy in the center.",
    duration: null,
  },

  // ── Ohio Valley Specific ───────────────────────────
  "cold-cheese": {
    id: "cold-cheese",
    label: "Add Cold Cheese & Toppings",
    instruction: "Pull the pizza from the oven. Immediately pile on generous cold, freshly grated provolone (never pre-shredded, never mozzarella). Add cold pepperoni and any other toppings now \u2014 uncooked. Cover or close the box for 3\u20135 minutes so residual heat partially melts the cheese.",
    why: "This is what defines Ohio Valley style. The cold cheese intentionally only half-melts from residual heat. The half-melted, half-solid texture IS the signature of the style. Putting cheese in the oven would defeat the entire purpose.",
    duration: "~5 min",
  },

  // ── Cast Iron Specific ─────────────────────────────
  "stovetop-start": {
    id: "stovetop-start",
    label: "Stovetop Start",
    instruction: "Heat your empty cast iron skillet on the stovetop over medium heat for 5 minutes. Add 2 tablespoons of butter (it should sizzle immediately). Press dough into the hot skillet, working quickly. Cook on the stovetop for 2\u20134 minutes until you see bubbles forming on the surface.",
    why: "The stovetop phase is what creates the fried, golden-brown bottom that distinguishes cast iron pizza. The skillet\u2019s direct contact with the burner gets the bottom crisping immediately while the oven finishes the top.",
    duration: "~10 min",
  },

  // ── Final Steps ────────────────────────────────────
  preheat: {
    id: "preheat",
    label: "Preheat Oven",
    instruction: null,
    why: "A fully preheated oven (and stone/steel) is critical for proper bottom crust development, oven spring, and a crispy base. Skipping preheat time = soggy bottom.",
    duration: null,
  },
  "stretch-and-top": {
    id: "stretch-and-top",
    label: "Stretch & Top",
    instruction: "Open the dough balls and stretch to your target size. Work from the center outward, leaving a rim for the cornicione. Add sauce, cheese, and toppings. Launch into the oven.",
    why: "Stretching right before baking ensures the dough stays thin and doesn\u2019t overproof. Topping too early lets moisture soak into the dough and creates a soggy center.",
    duration: "~10\u201315 min",
  },
  "hand-pat": {
    id: "hand-pat",
    label: "Hand-Pat & Top",
    instruction: "Pat the dough out on a well-floured surface using flat hands \u2014 do NOT stretch over knuckles, do NOT roll with a pin. The shape should be deliberately irregular, not perfectly round. Top minimally: for a traditional plain tomato pie, use uncooked sauce, grated Pecorino Romano, and olive oil. Mozzarella is optional, not default.",
    why: "New Haven apizza is hand-patted with minimal handling. Aggressive stretching or rolling produces the wrong texture. The irregularity and minimal topping approach are hallmarks of the Wooster Street tradition.",
    duration: "~10 min",
  },
  "roll-dock-top": {
    id: "roll-dock-top",
    label: "Roll, Dock & Top",
    instruction: "Roll the dough with a rolling pin to your target size \u2014 aim for even, thin coverage edge to edge. Dock the entire surface with a fork. Add sauce, cheese, and toppings. Bake immediately.",
    why: "Rolling produces a uniformly thin crust that bakes evenly. Docking prevents bubbles. These styles rely on a flat, crisp base \u2014 not an airy, hand-stretched one.",
    duration: "~10 min",
  },
  "assemble-tavern": {
    id: "assemble-tavern",
    label: "Assemble & Bake",
    instruction: "Invert the cured dough skin so the dried side faces down. Spread sauce edge-to-edge (no raised rim). Place raw Italian sausage chunks on the sauce. Blanket mozzarella over everything \u2014 the cheese locks toppings in place. Bake until well done with dark, crispy edges.",
    why: "Chicago Tavern assembly is toppings-under-cheese, edge-to-edge with no cornicione. The dried cured side goes down for maximum cracker-snap. Raw sausage renders its fat and flavor directly into the pizza during baking.",
    duration: "~15 min",
  },
  "top-detroit": {
    id: "top-detroit",
    label: "Top & Bake",
    instruction: null,
    why: "Detroit\u2019s layering order is critical: pepperoni on bare dough, then brick cheese pushed to the pan walls for frico, then sauce in racing stripes on top. This upside-down assembly prevents the airy crust from getting soggy.",
    duration: "~15 min",
  },
  "top-upside-down": {
    id: "top-upside-down",
    label: "Top & Bake",
    instruction: null,
    why: "The cheese-under-sauce assembly (sometimes called \u201Cupside-down\u201D) protects the cheese from burning during the long bake and creates a melty, oozy layer underneath.",
    duration: null,
  },
  "rest-no-rise": {
    id: "rest-no-rise",
    label: "Rest the Dough",
    instruction: "Cover the dough loosely and let it rest at room temperature for 10\u201315 minutes. Do not try to shape it right away \u2014 the gluten needs to relax.",
    why: "Even no-rise dough needs a short rest after mixing. The gluten is tight right out of the bowl and will spring back if you try to stretch it immediately.",
    duration: "~10\u201315 min",
  },
  eat: {
    id: "eat",
    label: "Eat!",
    instruction: "Slice, serve, and enjoy your pizza! Let it rest 2\u20133 minutes out of the oven for the cheese to set \u2014 patience pays off.",
    why: "This is your target time \u2014 everything was calculated backward from this moment. You did the work. Now enjoy every bite.",
    duration: null,
  },
};


// ══════════════════════════════════════════════════════
// 4. ENGINE FUNCTIONS
// ══════════════════════════════════════════════════════

/**
 * Returns available fermentation methods for a given time window.
 * @param {number} availableHours
 * @param {string} styleKey
 * @returns {object[]} array of available FERMENT_METHODS entries, best first
 */
function getAvailableFermentMethods(availableHours, styleKey) {
  if (NO_RISE_STYLES.includes(styleKey)) {
    return [FERMENT_METHODS["same-day"]];
  }
  if (CURING_STYLES.includes(styleKey)) {
    return [FERMENT_METHODS["cure-24"]];
  }
  const available = [];
  if (availableHours >= FERMENT_METHODS["cold-72"].minHoursNeeded) available.push(FERMENT_METHODS["cold-72"]);
  if (availableHours >= FERMENT_METHODS["cold-48"].minHoursNeeded) available.push(FERMENT_METHODS["cold-48"]);
  if (availableHours >= FERMENT_METHODS["cold-24"].minHoursNeeded) available.push(FERMENT_METHODS["cold-24"]);
  available.push(FERMENT_METHODS["same-day"]);
  return available;
}

/**
 * Builds a complete dough schedule by working backward from the eat time.
 * Each pizza style has its own authentic step sequence.
 */
function buildScheduleBackward(eatTime, ovenType, method, numPizzas, doughBallWeight, styleKey) {
  const eatMs = eatTime.getTime();
  const min = (m) => m * 60000;

  const preheatMinutes = OVEN_PREHEAT_MINUTES[ovenType] || 45;
  const ovenLabel = (typeof OVEN_TYPES !== "undefined" && OVEN_TYPES[ovenType]) || ovenType;
  const steps = [];

  // Helper: finalize and validate steps
  function finalize() {
    steps.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    steps.forEach((s) => { s.checked = false; });
    const earliest = steps[0];
    const isValid = earliest.dateTime > new Date();
    let validationMsg = "";
    if (!isValid) {
      const t = earliest.dateTime.toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
      validationMsg = `Not enough time! "${earliest.label}" would need to start at ${t}, which has already passed. Push your dinner time later or pick a shorter method.`;
    }
    return { steps, mixTime: earliest.dateTime, isValid, validationMsg };
  }

  // Helper: push preheat + eat steps (shared by all styles)
  function addPreheatAndEat(preheatT) {
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.preheat,
      dateTime: new Date(preheatT),
      duration: `${preheatMinutes} min`,
      instruction: `Preheat your ${ovenLabel} for at least ${preheatMinutes} minutes.`,
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.eat,
      dateTime: new Date(eatMs),
    });
  }

  const ballInstr = `Divide dough into ${numPizzas} equal piece${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Shape into tight, smooth balls by tucking the edges underneath.`;

  // ══════════════════════════════════════════════════════
  // NEAPOLITAN — direct method (no autolyse), room-temp default
  // Mix → Bulk (2h) → Ball (mozzatura) → Second Proof (4-6h) → Preheat → Shape & Top → Eat
  // Cold ferment variant: Ball → Fridge → Pull → Preheat → Shape & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "neapolitan") {
    const stretchTopT = eatMs - min(15);
    const preheatT = stretchTopT - min(preheatMinutes);

    if (method.isColdFerment) {
      const pullT = preheatT - min(method.pullBeforePreheatMinutes);
      const fridgeT = pullT - min(method.coldFermentHours * 60);
      const ballT = fridgeT - min(10);
      const bulkStartT = ballT - min(120);
      const mixT = bulkStartT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Dissolve salt in water, add 10% of the flour as a buffer, then add yeast, then remaining flour. Mix by hand or low-speed mixer until smooth and elastic. No autolyse \u2014 Tipo 00 flour hydrates rapidly with the direct method." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~2 hours",
        instruction: "Cover with a damp cloth (not plastic wrap). Let rest at room temperature (~25\u00B0C / 77\u00B0F) for about 2 hours." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT),
        instruction: `Divide into ${numPizzas} ball${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each using the mozzatura technique \u2014 tuck the dough under itself in a rotating motion, building surface tension into a tight, smooth ball.` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours`,
        instruction: "Place balls in lightly oiled proofing boxes, spaced apart. Cover tightly and refrigerate." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~2 hours" });
    } else {
      // Room-temp path (traditional AVPN)
      const proofT = preheatT - min(300); // 5h second proof
      const ballT = proofT - min(10);
      const bulkStartT = ballT - min(120);
      const mixT = bulkStartT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Dissolve salt in water, add 10% of the flour as a buffer, then add yeast, then remaining flour. Mix by hand or low-speed mixer until smooth and elastic. No autolyse \u2014 Tipo 00 flour hydrates rapidly with the direct method." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~2 hours",
        instruction: "Cover with a damp cloth (not plastic wrap). Let rest at room temperature (~25\u00B0C / 77\u00B0F) for about 2 hours." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT),
        instruction: `Divide into ${numPizzas} ball${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each using the mozzatura technique \u2014 tuck the dough under itself in a rotating motion, building surface tension into a tight, smooth ball.` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["second-proof"], dateTime: new Date(proofT), duration: "~5 hours",
        instruction: "Place balls in proofing boxes, spaced apart, covered. Proof at room temperature for 4\u20136 hours until soft and pillowy." });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], dateTime: new Date(stretchTopT),
      instruction: "Shape by hand only \u2014 never use a rolling pin. Press from the center outward, pushing air to the edges to form the cornicione. The center should be no more than 3mm thick. Top sparingly and launch into the oven." });
    addPreheatAndEat(preheatT);
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // NEW YORK — oil after gluten, letter fold, cold ferment default
  // Mix (oil last) → Bulk Rest (1h) → Fold → Ball → Fridge → Warm Up → Preheat → Stretch & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "new-york") {
    const stretchTopT = eatMs - min(15);
    const preheatT = stretchTopT - min(preheatMinutes);

    if (method.isColdFerment) {
      const warmUpT = preheatT - min(150); // 2.5h warm-up
      const fridgeT = warmUpT - min(method.coldFermentHours * 60);
      const ballT = fridgeT - min(10);
      const foldT = ballT - min(5);
      const bulkStartT = foldT - min(60);
      const mixT = bulkStartT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine flour, salt, sugar, and yeast. Add cold water and mix until shaggy. Knead 2\u20133 minutes, then drizzle in the oil and continue kneading until the dough passes the windowpane test (~6 min total). Oil goes in AFTER initial gluten development." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~1 hour",
        instruction: "Place in a lightly oiled bowl, cover, and rest at room temperature for about 1 hour." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.fold, dateTime: new Date(foldT), subStep: true });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT), instruction: ballInstr });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours`,
        instruction: "Place balls in individual oiled deli containers or on an oiled sheet pan. Cover tightly and refrigerate." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(warmUpT), duration: "~2.5 hours",
        instruction: "Remove dough balls from the fridge. Let them come to room temperature (target ~65\u00B0F / 18\u00B0C). The dough should stretch without snapping back \u2014 if it resists, give it more time." });
    } else {
      const ballT = preheatT - min(30);
      const foldT = ballT - min(5);
      const bulkStartT = foldT - min(method.bulkFermentMinutes);
      const mixT = bulkStartT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine flour, salt, sugar, and yeast. Add cold water and mix until shaggy. Knead 2\u20133 minutes, then drizzle in the oil and continue kneading until the dough passes the windowpane test (~6 min total). Oil goes in AFTER initial gluten development." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Place in a lightly oiled bowl, cover, and rest at room temperature until roughly doubled." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.fold, dateTime: new Date(foldT), subStep: true });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT), instruction: ballInstr });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], dateTime: new Date(stretchTopT),
      instruction: "Hand-stretch each ball to your target size (knuckle method). Aim for a uniformly thin center with a modest edge. Sauce in a spiral from center out, grated low-moisture mozzarella, toppings. Launch onto your preheated steel or stone." });
    addPreheatAndEat(preheatT);
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // CHICAGO TAVERN — sheet, dock, cure uncovered, then assemble
  // Mix → Bulk (1h) → Ball → Cold Ferment (24h) → Pull → Sheet/Roll → Dock → Cure Uncovered (24h) → Preheat → Assemble & Bake → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "chicago-tavern") {
    const assembleT = eatMs - min(20);
    const preheatT = assembleT - min(preheatMinutes);
    const pullCureT = preheatT - min(30);
    const cureStartT = pullCureT - min(24 * 60);
    const dockT = cureStartT - min(5);
    const sheetT = dockT - min(10);
    const pullFermentT = sheetT - min(30);
    const fermentStartT = pullFermentT - min(24 * 60);
    const ballT = fermentStartT - min(10);
    const bulkStartT = ballT - min(60);
    const mixT = bulkStartT - min(10);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
      instruction: "Combine AP flour, water (50\u201355% hydration), salt, oil, sugar, and yeast. Mix until smooth \u2014 this is a stiff, low-hydration dough. It should feel firm and not sticky." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~1 hour",
      instruction: "Cover and rest at room temperature for about 1 hour. It won\u2019t double \u2014 just needs to relax before balling." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT),
      instruction: `Divide into ${numPizzas} equal piece${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Shape into tight balls.` });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fermentStartT), duration: "24 hours",
      instruction: "Place balls in lightly oiled containers. Cover tightly and refrigerate for 24 hours to develop flavor." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullFermentT), duration: "~30 min",
      instruction: "Pull dough balls from the fridge. Let them warm slightly for 30 minutes before sheeting." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["sheet-roll"], dateTime: new Date(sheetT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.dock, dateTime: new Date(dockT), subStep: true });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["cure-uncovered"], dateTime: new Date(cureStartT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], id: "pull-cure", dateTime: new Date(pullCureT), duration: "~30 min",
      instruction: "Pull the cured skins from the fridge. They should feel dry on the surface and slightly stiff \u2014 that\u2019s correct." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["assemble-tavern"], dateTime: new Date(assembleT) });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // DETROIT — two-stage press, proof in pan, brick cheese frico
  // Mix → Cold Ferment (24h) → Oil Pan → First Press → Rest → Second Press → Proof in Pan (2h) → Preheat → Top & Bake → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "detroit") {
    const topBakeT = eatMs - min(15);
    const preheatT = topBakeT - min(preheatMinutes);
    const proofEndT = preheatT;
    const proofStartT = proofEndT - min(120);
    const press2T = proofStartT - min(5);
    const restPanT = press2T - min(20);
    const press1T = restPanT - min(5);
    const oilPanT = press1T - min(5);

    let pullT, fridgeT, mixT;
    if (method.isColdFerment) {
      pullT = oilPanT - min(30);
      fridgeT = pullT - min(method.coldFermentHours * 60);
      mixT = fridgeT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine bread flour, water (70%+ hydration), salt, sugar, oil, and yeast. Mix until combined \u2014 no heavy kneading needed. The dough will be wet and sticky." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours`,
        instruction: "Oil the dough ball, place in a covered container, and refrigerate. Cold ferment as a ball \u2014 do NOT press into the pan before refrigerating." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~30 min",
        instruction: "Remove dough ball from fridge. Let it warm slightly (~30 min) before pressing into the pan." });
    } else {
      const bulkStartT = oilPanT - min(method.bulkFermentMinutes);
      mixT = bulkStartT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine bread flour, water (70%+ hydration), salt, sugar, oil, and yeast. Mix until combined \u2014 no heavy kneading needed. The dough will be wet and sticky." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["oil-pan"], dateTime: new Date(oilPanT),
      instruction: "Generously oil your Detroit-style blue steel pan (or heavy rectangular pan) with 2\u20133 tablespoons of olive oil. Coat the bottom and sides completely." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["press-first"], dateTime: new Date(press1T) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["rest-in-pan"], dateTime: new Date(restPanT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["press-to-edges"], dateTime: new Date(press2T) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["proof-in-pan"], dateTime: new Date(proofStartT), duration: "~2 hours",
      instruction: "Cover the pan and let the dough proof at room temperature for 1.5\u20132.5 hours. The dough should rise to about one-third of the way up the pan sides." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["top-detroit"], dateTime: new Date(topBakeT),
      instruction: `Place pepperoni directly on the bare dough. Spread brick cheese (or 50/50 brick and low-moisture mozzarella) edge-to-edge, pushing into all corners and against the pan walls \u2014 this creates the caramelized frico crust. Ladle sauce in 2\u20133 racing stripes on top. Bake 12\u201315 min at 500\u2013550\u00B0F.` });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // SICILIAN — dimple-rest in pan, parbake, upside-down assembly
  // Mix → Cold Ferment → Oil Pan → Dimple & Rest → Proof in Pan (3-4h) → Preheat → Parbake → Top Upside-Down → Second Bake → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "sicilian") {
    const secondBakeT = eatMs - min(18);
    const topT = secondBakeT - min(5);
    const parbakeEndT = topT;
    const parbakeT = parbakeEndT - min(12);
    const preheatT = parbakeT - min(preheatMinutes);
    const proofEndT = preheatT;
    const proofStartT = proofEndT - min(210); // 3.5h proof
    const dimpleT = proofStartT - min(30);
    const oilPanT = dimpleT - min(5);

    let pullT, fridgeT, mixT;
    if (method.isColdFerment) {
      pullT = oilPanT - min(30);
      fridgeT = pullT - min(method.coldFermentHours * 60);
      mixT = fridgeT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine bread flour (optionally 80/20 with semolina), water (65\u201370%), salt, sugar, oil, and yeast. Mix until combined." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~30 min" });
    } else {
      const bulkStartT = oilPanT - min(method.bulkFermentMinutes);
      mixT = bulkStartT - min(15);
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine bread flour (optionally 80/20 with semolina), water (65\u201370%), salt, sugar, oil, and yeast. Mix until combined." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["oil-pan"], dateTime: new Date(oilPanT),
      instruction: "Coat a heavy sheet pan with at least 3\u20134 tablespoons of olive oil. The oil should pool visibly \u2014 this is what fries the bottom crust." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["dimple-rest"], dateTime: new Date(dimpleT),
      instruction: "Place dough in oiled pan. Dimple with oiled fingertips for 1\u20132 minutes, rest 10 minutes. Repeat 3\u20134 rounds until dough fills the entire pan." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["proof-in-pan"], dateTime: new Date(proofStartT), duration: "~3.5 hours",
      instruction: "Cover and let the dough proof in the pan at room temperature for 3\u20134 hours. The dough should visibly rise and become bubbly \u2014 this creates the thick, airy, focaccia-like crumb." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.parbake, dateTime: new Date(parbakeT), duration: "~12 min",
      instruction: "Bake the naked dough (no toppings) at 475\u2013500\u00B0F for 10\u201312 minutes until barely golden. This stabilizes the thick crust so it won\u2019t be gummy under toppings." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["top-upside-down"], dateTime: new Date(topT), duration: "~15\u201320 min",
      instruction: "Lay sliced mozzarella directly on the parbaked crust. Ladle sauce on top of the cheese. Dust with grated Pecorino Romano and drizzle with olive oil. Return to oven at 450\u2013475\u00B0F for 10\u201320 minutes until sauce bubbles and edges are golden-brown." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // GRANDMA — minimal proof, single bake, cheese first, sauce dolloped
  // Mix → Cold Ferment → Oil Pan → Press into Pan (minimal rest) → Preheat → Top & Bake → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "grandma") {
    const topBakeT = eatMs - min(20);
    const preheatT = topBakeT - min(preheatMinutes);
    const pressT = preheatT - min(20); // brief rest only
    const oilPanT = pressT - min(5);

    let pullT, fridgeT, mixT;
    if (method.isColdFerment) {
      pullT = oilPanT - min(30);
      fridgeT = pullT - min(method.coldFermentHours * 60);
      mixT = fridgeT - min(15);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine AP flour, water (64\u201365%), salt, sugar, oil, and yeast. Standard mix." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~30 min" });
    } else {
      const bulkStartT = oilPanT - min(method.bulkFermentMinutes);
      mixT = bulkStartT - min(15);
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~15 min",
        instruction: "Combine AP flour, water (64\u201365%), salt, sugar, oil, and yeast. Standard mix." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["oil-pan"], dateTime: new Date(oilPanT),
      instruction: "Coat a dark metal sheet pan with 4+ tablespoons of olive oil, including the sides. Dark pans absorb more heat for a better fried bottom." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["dimple-rest"], id: "press-grandma", dateTime: new Date(pressT), duration: "~15\u201320 min",
      label: "Press into Pan",
      instruction: "Press cold dough directly into the oiled pan, stretching to all edges. Brief rest only (15\u201320 min) \u2014 do NOT let it rise like a Sicilian. The crust should stay thin and dense." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["top-upside-down"], dateTime: new Date(topBakeT), duration: "~16\u201320 min",
      instruction: "Lay sliced mozzarella or provolone rounds directly on the raw dough. Dollop chunky, raw, garlic-forward sauce over the cheese \u2014 leave gaps, don\u2019t spread edge-to-edge. Dust with Pecorino Romano. Bake at 450\u00B0F for 16\u201320 minutes (rotate halfway). Finish with an olive oil drizzle." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // NEW HAVEN APIZZA — long cold ferment, hand-pat, minimal handling
  // Mix → Cold Ferment (48-96h) → Warm Up → Preheat → Hand-Pat & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "new-haven") {
    const handPatT = eatMs - min(15);
    const preheatT = handPatT - min(preheatMinutes);

    if (method.isColdFerment) {
      const warmUpT = preheatT - min(120);
      const fridgeT = warmUpT - min(method.coldFermentHours * 60);
      const mixT = fridgeT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine high-gluten bread flour, water (68\u201370%), salt, and yeast. NO oil, NO sugar. Keep mixing minimal \u2014 just until combined. The dough will be wet and sticky." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours`,
        instruction: "Place dough in a lightly oiled container, cover tightly, and refrigerate. The long cold ferment is fundamental to New Haven apizza \u2014 it develops the distinct tang and complex flavor." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(warmUpT), duration: "~2 hours" });
    } else {
      const ballT = preheatT - min(30);
      const bulkStartT = ballT - min(method.bulkFermentMinutes);
      const mixT = bulkStartT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine high-gluten bread flour, water (68\u201370%), salt, and yeast. NO oil, NO sugar. Keep mixing minimal." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["hand-pat"], dateTime: new Date(handPatT) });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // OHIO VALLEY — parbake naked, sauce bake, cold cheese after
  // Mix → Bulk (1-2h) → Oil Pan & Press → Preheat → First Bake (naked) → Add Sauce & Second Bake → Cold Cheese → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "ohio-valley") {
    const coldCheeseT = eatMs - min(5); // 5 min before eat for steaming
    const secondBakeT = coldCheeseT - min(10);
    const sauceT = secondBakeT - min(3);
    const firstBakeT = sauceT - min(9);
    const preheatT = firstBakeT - min(preheatMinutes);
    const pressT = preheatT - min(10);
    const bulkStartT = pressT - min(120);
    const mixT = bulkStartT - min(10);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
      instruction: "Combine bread flour, water (58%), salt, sugar, oil, and yeast. Standard bread-style dough." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~2 hours",
      instruction: "Cover and rest at room temperature until roughly doubled." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["oil-pan"], id: "press-ov", dateTime: new Date(pressT), duration: "~10 min",
      label: "Oil Pan & Press Dough",
      instruction: "Oil a sheet pan generously. Press and stretch dough to fill the pan. Dock the entire surface with a fork." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.parbake, dateTime: new Date(firstBakeT), duration: "~8 min",
      instruction: "Bake the plain dough (no toppings) at 500\u00B0F for 7\u20139 minutes. This parbake is essential." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["second-bake"], dateTime: new Date(sauceT), duration: "~10 min",
      instruction: "Pull from oven. Add a light layer of sauce only (leave edges bare). Return to oven and bake at 425\u00B0F for 7\u201310 minutes until golden brown." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["cold-cheese"], dateTime: new Date(coldCheeseT) });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // CAST IRON — stovetop start, then oven finish
  // Mix → Ferment → Preheat Oven → Stovetop Start → Transfer to Oven → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "cast-iron") {
    const ovenFinishT = eatMs - min(15);
    const stovetopT = ovenFinishT - min(10);
    const preheatT = stovetopT - min(preheatMinutes);

    if (method.isColdFerment) {
      const pullT = preheatT - min(120);
      const fridgeT = pullT - min(method.coldFermentHours * 60);
      const mixT = fridgeT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine AP flour, water (62%), salt, sugar, oil, and yeast. Mix until smooth." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~2 hours" });
    } else {
      const bulkStartT = preheatT - min(method.bulkFermentMinutes);
      const mixT = bulkStartT - min(10);
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine AP flour, water (62%), salt, sugar, oil, and yeast. Mix until smooth." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT),
        duration: "~6 hours", instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stovetop-start"], dateTime: new Date(stovetopT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], id: "oven-finish", dateTime: new Date(ovenFinishT),
      label: "Top & Oven Finish",
      instruction: "Add sauce, cheese, and toppings while still on the burner. Transfer skillet to the preheated oven and bake 10\u201315 minutes until cheese is bubbly. Rest 2 minutes in skillet, then slide onto a cutting board (don\u2019t cut in the pan)." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // PAN PIZZA — no-knead, dimple-rest in oiled pan
  // Mix (no knead) → Ferment → Oil Pan → Dimple & Rest → Preheat → Top & Bake → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "pan") {
    const topBakeT = eatMs - min(15);
    const preheatT = topBakeT - min(preheatMinutes);
    const dimpleT = preheatT - min(40);
    const oilPanT = dimpleT - min(5);

    if (method.isColdFerment) {
      const pullT = oilPanT - min(30);
      const fridgeT = pullT - min(method.coldFermentHours * 60);
      const mixT = fridgeT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~5 min",
        instruction: "Combine bread flour, water (70%), salt, sugar, oil, and yeast. Mix by hand until no dry flour remains. No kneading needed." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~30 min" });
    } else {
      const bulkStartT = oilPanT - min(method.bulkFermentMinutes);
      const mixT = bulkStartT - min(10);
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~5 min",
        instruction: "Combine bread flour, water (70%), salt, sugar, oil, and yeast. Mix by hand until no dry flour remains. No kneading needed." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~6 hours",
        instruction: "Cover and rest at room temperature until roughly doubled." });
    }

    steps.push({ ...SCHEDULE_STEP_TEMPLATES["oil-pan"], dateTime: new Date(oilPanT),
      instruction: "Pour 1\u20132 tablespoons of olive oil into each cast iron skillet or cake pan." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["dimple-rest"], dateTime: new Date(dimpleT),
      instruction: "Turn dough into oiled pan to coat. Press outward from center with oiled fingertips. When it springs back, stop, wait 10 minutes, try again. Repeat until dough fills the pan." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], dateTime: new Date(topBakeT),
      instruction: "Spread sauce with the back of a spoon. Add aged low-moisture mozzarella (block, grated) all the way to the edges. Bake at 550\u00B0F for 12\u201315 minutes. If the bottom needs more color, place the pan on a burner over medium heat for 1\u20132 minutes." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // ST. LOUIS — baking powder (no yeast), roll, dock, Provel
  // Mix → Brief Rest (10 min) → Preheat → Roll, Dock & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "st-louis") {
    const rollDockTopT = eatMs - min(12);
    const preheatT = rollDockTopT - min(preheatMinutes);
    const restT = preheatT - min(10);
    const mixT = restT - min(5);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~5 min",
      instruction: "Combine AP flour, baking powder (1 tsp per 250g flour \u2014 NO yeast), salt, oil, water, and a touch of corn syrup. Stir together until combined. No kneading needed." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["rest-no-rise"], dateTime: new Date(restT), duration: "~10 min",
      instruction: "Let the dough rest 10 minutes. This is NOT a rise \u2014 there\u2019s no yeast. Just letting the gluten relax for easier rolling." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["roll-dock-top"], dateTime: new Date(rollDockTopT), duration: "~12 min",
      instruction: "Roll the dough cracker-thin (thinner than Chicago tavern) \u2014 target 1/8\u2033 or less, edge to edge with no rim. Dock the entire surface with a fork. Spread sweet tomato sauce, distribute toppings, then blanket Provel cheese on top. Bake at 425\u2013475\u00B0F for 9\u201311 minutes. Square cut only." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // SCHOOL NIGHT — no rise, quick path
  // Mix → Brief Rest → Preheat → Shape & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "school-night") {
    const shapeTopT = eatMs - min(12);
    const preheatT = shapeTopT - min(preheatMinutes);
    const restT = preheatT - min(5);
    const mixT = restT - min(5);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~5 min",
      instruction: "Combine AP flour, water (60%), salt, oil, sugar, and yeast. Mix until smooth, 3\u20135 minutes. For extra tang, add a splash of vinegar or a tablespoon of yogurt." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["rest-no-rise"], dateTime: new Date(restT), duration: "~10\u201315 min",
      instruction: "Cover and rest 10\u201315 minutes. Not a rise \u2014 just gluten relaxation. The dough will be cooperative and easy to shape." });
    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], dateTime: new Date(shapeTopT),
      instruction: "Roll or press to desired size. Top with sauce, cheese, and toppings. Bake immediately at 475\u2013525\u00B0F for 8\u201312 minutes." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // THIN & CRISPY — roll, dock, optional parbake
  // Mix → Ferment → Ball & Rest → Preheat → Roll, Dock & Top → Eat
  // ══════════════════════════════════════════════════════
  if (styleKey === "thin-crust") {
    const rollDockTopT = eatMs - min(12);
    const preheatT = rollDockTopT - min(preheatMinutes);

    if (method.isColdFerment) {
      const pullT = preheatT - min(30);
      const fridgeT = pullT - min(method.coldFermentHours * 60);
      const ballT = fridgeT - min(10);
      const bulkStartT = ballT - min(60);
      const mixT = bulkStartT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine AP flour, water (55%), salt, oil, and yeast. This is a stiff, low-hydration dough designed for rolling." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT), duration: "~1 hour",
        instruction: "Cover and rest at room temperature for about 1 hour." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT),
        instruction: `Divide into ${numPizzas} ball${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Let rest 10\u201315 minutes.` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT), duration: "~30 min",
        instruction: "Pull dough balls from fridge. Let warm slightly before rolling." });
    } else {
      const ballT = preheatT - min(15);
      const bulkStartT = ballT - min(method.bulkFermentMinutes);
      const mixT = bulkStartT - min(10);

      steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT), duration: "~10 min",
        instruction: "Combine AP flour, water (55%), salt, oil, and yeast. This is a stiff, low-hydration dough designed for rolling." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT),
        duration: "~6 hours", instruction: "Cover and rest at room temperature until roughly doubled." });
      steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT),
        instruction: `Divide into ${numPizzas} ball${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Let rest 10\u201315 minutes.` });
    }

    addPreheatAndEat(preheatT);
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["roll-dock-top"], dateTime: new Date(rollDockTopT),
      instruction: "Roll each ball with a rolling pin to ~1/8\u2033 thick, even edge to edge. Dock the entire surface with a fork. Top lightly \u2014 thin crust can\u2019t support heavy loads. Bake at 475\u2013525\u00B0F for 6\u201310 minutes." });
    return finalize();
  }

  // ══════════════════════════════════════════════════════
  // FALLBACK — standard path for any unlisted style
  // Uses the traditional: Mix → Bulk → Ball → Fridge → Pull → Preheat → Stretch & Top → Eat
  // ══════════════════════════════════════════════════════
  const stretchTopT = eatMs - min(15);
  const preheatT = stretchTopT - min(preheatMinutes);

  if (method.isColdFerment) {
    const pullT = preheatT - min(method.pullBeforePreheatMinutes);
    const fridgeT = pullT - min(method.coldFermentHours * 60);
    const ballT = fridgeT - min(10);
    const bulkStartT = ballT - min(method.bulkFermentMinutes);
    const mixT = bulkStartT - min(10);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT),
      duration: "~1.5 hours",
      instruction: "Cover and rest at room temperature for about 1.5 hours." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT), instruction: ballInstr });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["into-fridge"], dateTime: new Date(fridgeT), duration: `${method.coldFermentHours} hours` });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"], dateTime: new Date(pullT) });
  } else {
    const ballT = preheatT - min(30);
    const bulkStartT = ballT - min(method.bulkFermentMinutes);
    const mixT = bulkStartT - min(10);

    steps.push({ ...SCHEDULE_STEP_TEMPLATES.mix, dateTime: new Date(mixT) });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"], dateTime: new Date(bulkStartT),
      duration: "~6 hours",
      instruction: "Cover and rest at room temperature until roughly doubled." });
    steps.push({ ...SCHEDULE_STEP_TEMPLATES.ball, dateTime: new Date(ballT), instruction: ballInstr });
  }

  steps.push({ ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"], dateTime: new Date(stretchTopT) });
  addPreheatAndEat(preheatT);
  return finalize();
}
