/**
 * Dough Scheduler — Backward-Scheduling Engine
 *
 * Data and logic for computing a complete dough schedule
 * by working backward from a target "eat" time.
 */

// ══════════════════════════════════════════════════════
// 1. OVEN PREHEAT TIMES (minutes)
// ══════════════════════════════════════════════════════
// Deterministic values derived from OVEN_SETUPS string descriptions.

const OVEN_PREHEAT_MINUTES = {
  stone: 60,        // "60 minutes minimum"
  steel: 55,        // "45–60 minutes" → 55 for safety
  ooni: 20,         // "15–20 minutes" → 20 for safety
  "wood-fired": 90, // "1–2 hours" → 90 as middle ground
  "cast-iron": 15,  // Stovetop preheat + brief oven finish
  pan: 45,          // Standard home oven preheat
};


// ══════════════════════════════════════════════════════
// 2. FERMENTATION METHODS
// ══════════════════════════════════════════════════════

const FERMENT_METHODS = {
  "cold-72": {
    id: "cold-72",
    label: "72-Hour Cold Ferment",
    description: "Maximum flavor development. Three days of cold fermentation produces deep, complex flavor with excellent texture and an open, airy crumb.",
    reason: "You have plenty of time — let's use it. A 72-hour cold ferment gives the best possible flavor and texture.",
    minHoursNeeded: 76,  // 72 + ~4 hrs for other steps
    isColdFerment: true,
    bulkFermentMinutes: 90,
    coldFermentHours: 72,
    pullBeforePreheatMinutes: 120,
  },
  "cold-48": {
    id: "cold-48",
    label: "48-Hour Cold Ferment",
    description: "Great balance of flavor and convenience. Two days in the fridge develops rich, complex taste with good texture.",
    reason: "With about two days available, a 48-hour cold ferment gives excellent results — noticeably better flavor than same-day.",
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
    reason: "You've got about a day — a 24-hour cold ferment adds real flavor without the multi-day commitment.",
    minHoursNeeded: 28,
    isColdFerment: true,
    bulkFermentMinutes: 90,
    coldFermentHours: 24,
    pullBeforePreheatMinutes: 120,
  },
  "cure-24": {
    id: "cure-24",
    label: "24-Hour Dough Cure",
    description: "Chicago Tavern style. The dough balls are wrapped tightly and refrigerated for 24 hours. This curing step relaxes the gluten and produces the thin, crackery crust that defines the style.",
    reason: "Chicago Tavern dough must be cured — it's what gives the crust its signature snap.",
    minHoursNeeded: 28,
    isColdFerment: false,  // curing path, not standard cold ferment
    bulkFermentMinutes: 60,
    coldFermentHours: 0,
    pullBeforePreheatMinutes: 30,
  },
  "same-day": {
    id: "same-day",
    label: "Same-Day Room Temperature",
    description: "When time is short. A full room-temperature rise gives decent texture but less complex flavor than cold ferment.",
    reason: "With less than a day available, a same-day room-temperature rise is your best bet. It'll still be homemade and delicious.",
    minHoursNeeded: 0,
    isColdFerment: false,
    bulkFermentMinutes: 360,  // 6 hours RT
    coldFermentHours: 0,
    pullBeforePreheatMinutes: 0,
  },
};

// Styles that skip autolyse and stretch-and-fold (no-rise / quick styles)
const NO_RISE_STYLES = ["st-louis", "school-night"];

// Styles that use a curing stage instead of standard cold ferment
const CURING_STYLES = ["chicago-tavern"];


// ══════════════════════════════════════════════════════
// 3. SCHEDULE STEP TEMPLATES
// ══════════════════════════════════════════════════════

const SCHEDULE_STEP_TEMPLATES = {
  mix: {
    id: "mix",
    label: "Mix",
    instruction: "Add salt and yeast to your autolysed dough. Mix until fully incorporated, then knead 8–12 minutes until the dough is smooth and elastic.",
    why: "Salt tightens the gluten network and controls fermentation. Adding it after autolyse means the flour is already hydrated and gluten has started forming — you get better structure with less work.",
    duration: "~10 min",
  },
  autolyse: {
    id: "autolyse",
    label: "Autolyse",
    instruction: "Combine flour and water only (no salt or yeast yet). Mix until no dry flour remains. Cover and let rest 20–30 minutes before adding salt and yeast.",
    why: "Autolyse lets flour fully hydrate and gluten begin forming before salt tightens the network. This produces a more extensible dough with better texture and easier handling.",
    duration: "~25 min",
    optional: true,
  },
  "stretch-fold": {
    id: "stretch-fold",
    label: "Stretch & Fold",
    instruction: "Wet your hands. Pull one side of the dough up and fold it over the center. Rotate 90° and repeat — 4 folds total. Cover and let rest.",
    why: "Stretch and folds align gluten strands without aggressive kneading, building strength while maintaining an open crumb structure. This is gentler than kneading and develops great texture.",
    duration: "~5 min",
  },
  "bulk-ferment": {
    id: "bulk-ferment",
    label: "Bulk Fermentation",
    instruction: "Cover the dough with plastic wrap or a damp towel. Let it rest at room temperature until it has roughly doubled in size.",
    why: "Bulk fermentation develops gluten structure through yeast activity and enzymatic action. The dough rises, becomes extensible, and develops the flavor compounds that make great pizza.",
    duration: null, // set dynamically
  },
  ball: {
    id: "ball",
    label: "Ball the Dough",
    instruction: null, // set dynamically: "Divide dough into N pieces of Xg each..."
    why: "Shaping into balls creates surface tension that helps the dough hold its shape during proofing and makes stretching easier later. Tight, smooth balls = easier stretching.",
    duration: "~10 min",
  },
  "into-fridge": {
    id: "into-fridge",
    label: "Into the Fridge",
    instruction: "Place each dough ball in a lightly oiled container or on a lightly oiled sheet pan. Cover tightly with plastic wrap and refrigerate.",
    why: "Cold fermentation slows yeast activity, allowing enzymes to develop complex flavors and improve the dough's texture and extensibility. Time in the fridge = better pizza.",
    duration: null, // set dynamically
    coldFermentOnly: true,
  },
  "pull-from-fridge": {
    id: "pull-from-fridge",
    label: "Pull from Fridge",
    instruction: "Remove dough from the fridge and let it come to room temperature. The dough should feel soft and pliable, not cold and stiff, before you stretch it.",
    why: "Cold gluten is tight and elastic — it'll spring back and resist stretching. Warming to room temperature lets the gluten relax so the dough stretches smoothly without tearing.",
    duration: "~2 hours",
    coldFermentOnly: true,
  },
  preheat: {
    id: "preheat",
    label: "Preheat Oven",
    instruction: null, // set dynamically based on oven type
    why: "A fully preheated oven (and stone/steel) is critical for proper bottom crust development, oven spring, and that satisfying crispy base. Skipping preheat time = soggy bottom.",
    duration: null, // set dynamically
  },
  "stretch-and-top": {
    id: "stretch-and-top",
    label: "Stretch & Top",
    instruction: "Open the dough balls and stretch to your target size. Work from the center outward, leaving a rim for the cornicione. Add sauce, cheese, and toppings. Launch into the oven.",
    why: "Stretching right before baking ensures the dough stays thin and doesn't overproof. Topping too early lets moisture soak into the dough and creates a soggy center.",
    duration: "~10–15 min",
  },
  eat: {
    id: "eat",
    label: "Eat!",
    instruction: "Slice, serve, and enjoy your pizza! Let it rest 2–3 minutes out of the oven for the cheese to set — patience pays off.",
    why: "This is your target time — everything was calculated backward from this moment. You did the work. Now enjoy every bite.",
    duration: null,
  },
  "rest-no-rise": {
    id: "rest-no-rise",
    label: "Rest the Dough",
    instruction: "Cover the dough loosely and let it rest at room temperature for 20–30 minutes. Do not try to stretch it right away — the gluten needs to relax.",
    why: "Even no-rise dough needs a short rest after mixing. The gluten is tight right out of the bowl and will spring back if you try to stretch it immediately. A 20-minute rest makes it pliable and workable.",
    duration: "~20–30 min",
  },
  "curing": {
    id: "curing",
    label: "Cure the Dough",
    instruction: "Divide dough into individual balls, wrap each tightly in plastic wrap, and refrigerate for at least 24 hours. The dough should feel slightly stiff when you unwrap it — that's correct.",
    why: "Chicago Tavern dough requires curing — a cold rest under pressure that relaxes the gluten and produces the distinctive tight, crackery texture. Without this step you'll get a chewy crust, not the thin, crispy snap that defines the style.",
    duration: "24 hours minimum",
    coldFermentOnly: false,
  },
};


// ══════════════════════════════════════════════════════
// 4. ENGINE FUNCTIONS
// ══════════════════════════════════════════════════════

/**
 * Returns available fermentation methods for a given time window.
 * Methods are ordered best-first. The UI uses this to let the user choose.
 * @param {number} availableHours — hours between now and target eat time
 * @param {string} styleKey — recipe key (school-night and chicago-tavern have fixed paths)
 * @returns {object[]} array of available FERMENT_METHODS entries, best first
 */
function getAvailableFermentMethods(availableHours, styleKey) {
  // School Night is always same-day — no choice to offer
  if (NO_RISE_STYLES.includes(styleKey)) {
    return [FERMENT_METHODS["same-day"]];
  }
  // Chicago Tavern always cures — minimum 28 hours needed (24h cure + other steps)
  if (CURING_STYLES.includes(styleKey)) {
    return [FERMENT_METHODS["cure-24"]];
  }

  const available = [];
  if (availableHours >= FERMENT_METHODS["cold-72"].minHoursNeeded) available.push(FERMENT_METHODS["cold-72"]);
  if (availableHours >= FERMENT_METHODS["cold-48"].minHoursNeeded) available.push(FERMENT_METHODS["cold-48"]);
  if (availableHours >= FERMENT_METHODS["cold-24"].minHoursNeeded) available.push(FERMENT_METHODS["cold-24"]);
  available.push(FERMENT_METHODS["same-day"]); // always available as fallback
  return available;
}

/**
 * Builds a complete dough schedule by working backward from the eat time.
 *
 * @param {Date}   eatTime        — target eat time
 * @param {string} ovenType       — key into OVEN_PREHEAT_MINUTES
 * @param {object} method         — FERMENT_METHODS entry
 * @param {number} numPizzas      — number of pizzas
 * @param {number} doughBallWeight — grams per dough ball
 * @param {string} styleKey       — recipe key (for filtering steps)
 * @returns {object} { steps: [], mixTime: Date, isValid: bool, validationMsg: string }
 */
function buildScheduleBackward(eatTime, ovenType, method, numPizzas, doughBallWeight, styleKey) {
  const eatMs = eatTime.getTime();
  const min = (m) => m * 60000; // minutes to ms

  const preheatMinutes = OVEN_PREHEAT_MINUTES[ovenType] || 60;
  const ovenLabel = OVEN_TYPES[ovenType] || ovenType;
  const isNoRise = NO_RISE_STYLES.includes(styleKey);
  const isCuring = CURING_STYLES.includes(styleKey);

  const steps = [];

  // ══════════════════════════════════════════════════════
  // SCHOOL NIGHT — short path: mix → rest → shape → preheat → bake
  // ══════════════════════════════════════════════════════
  if (isNoRise) {
    const eatT = eatMs;
    const stretchTopT = eatMs - min(15);
    const preheatT = stretchTopT - min(preheatMinutes);
    const shapeT = preheatT - min(5);  // shape right as oven starts preheating
    const restT = shapeT - min(25);    // 25 min rest before shaping
    const mixT = restT - min(10);      // mix takes ~10 min

    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.mix,
      dateTime: new Date(mixT),
      instruction: "Combine flour, water, salt, oil, and yeast. Mix until smooth — about 3–5 minutes. This is a no-rise dough, so just get it to a uniform, slightly tacky consistency.",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["rest-no-rise"],
      dateTime: new Date(restT),
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.preheat,
      dateTime: new Date(preheatT),
      duration: `${preheatMinutes} min`,
      instruction: `Preheat your ${ovenLabel} for at least ${preheatMinutes} minutes. You can start shaping while the oven heats up.`,
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"],
      dateTime: new Date(stretchTopT),
      instruction: "Roll or press the rested dough to your target size — this dough responds well to a rolling pin. Keep it thin. Add sauce, cheese, and toppings and bake immediately.",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.eat,
      dateTime: new Date(eatT),
    });

    steps.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    steps.forEach((s) => { s.checked = false; });

    const earliestStep = steps[0];
    const now = new Date();
    const isValid = earliestStep.dateTime > now;
    let validationMsg = "";
    if (!isValid) {
      const earlyTime = earliestStep.dateTime.toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
      validationMsg = `Not enough time! Mix would need to start at ${earlyTime}, which has already passed. Push your dinner time later.`;
    }
    return { steps, mixTime: earliestStep.dateTime, isValid, validationMsg };
  }

  // ══════════════════════════════════════════════════════
  // CHICAGO TAVERN — curing path: mix → bulk → ball → cure 24h → pull → preheat → bake
  // ══════════════════════════════════════════════════════
  if (isCuring) {
    const eatT = eatMs;
    const stretchTopT = eatMs - min(15);
    const preheatT = stretchTopT - min(preheatMinutes);
    const pullT = preheatT - min(30);          // pull from fridge 30 min before preheat
    const cureEndT = pullT;
    const cureStartT = cureEndT - min(24 * 60); // 24h minimum cure
    const ballT = cureStartT - min(10);          // ball 10 min before cure begins
    const bulkStartT = ballT - min(60);         // 1hr bulk ferment (short — low hydration dough)
    const mixT = bulkStartT - min(10);          // mix takes ~10 min before bulk starts
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.mix,
      dateTime: new Date(mixT),
      instruction: "Combine flour, water, salt, oil, sugar, and yeast. Mix until smooth — this is a stiff, low-hydration dough (50%). It should feel firm and not sticky.",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"],
      dateTime: new Date(bulkStartT),
      duration: "~1 hour",
      instruction: "Cover the dough and let it rest at room temperature for about 1 hour. It won't double — just needs to relax slightly before balling.",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.ball,
      dateTime: new Date(ballT),
      instruction: `Divide dough into ${numPizzas} equal piece${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Shape into tight, smooth balls.`,
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["curing"],
      dateTime: new Date(cureStartT),
      duration: "24 hours",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"],
      dateTime: new Date(pullT),
      instruction: "Pull the cured dough balls from the fridge. They should feel stiff — that's expected. Let them sit at room temperature for 30 minutes before rolling.",
      duration: "~30 min",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.preheat,
      dateTime: new Date(preheatT),
      duration: `${preheatMinutes} min`,
      instruction: `Preheat your ${ovenLabel} for at least ${preheatMinutes} minutes.`,
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"],
      dateTime: new Date(stretchTopT),
      instruction: "Use a rolling pin to roll each cured dough ball into a thin round — this dough is meant to be rolled, not hand-stretched. Dock thoroughly with a fork to prevent bubbles. Add sauce and toppings and bake.",
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES.eat,
      dateTime: new Date(eatT),
    });

    steps.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    steps.forEach((s) => { s.checked = false; });

    const earliestStep = steps[0];
    const now = new Date();
    const isValid = earliestStep.dateTime > now;
    let validationMsg = "";
    if (!isValid) {
      const earlyTime = earliestStep.dateTime.toLocaleString(undefined, {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
      });
      validationMsg = `Not enough time! Chicago Tavern dough requires at least 26 hours. The first step would need to start at ${earlyTime}. Push your dinner time to tomorrow at the earliest.`;
    }
    return { steps, mixTime: earliestStep.dateTime, isValid, validationMsg };
  }

  // ══════════════════════════════════════════════════════
  // STANDARD PATH — all other styles
  // ══════════════════════════════════════════════════════
  const eatT = eatMs;
  const stretchTopT = eatMs - min(15);
  const preheatT = stretchTopT - min(preheatMinutes);

  let pullT, fridgeT, ballT, bulkStartT, stretchFoldT, autolyseT, mixT;

  if (method.isColdFerment) {
    pullT = preheatT - min(method.pullBeforePreheatMinutes);
    fridgeT = pullT - min(method.coldFermentHours * 60);
    ballT = fridgeT - min(10);           // balling takes ~10 min before fridge
    bulkStartT = ballT - min(method.bulkFermentMinutes);
  } else {
    pullT = null;
    fridgeT = null;
    ballT = preheatT - min(30);
    bulkStartT = ballT - min(method.bulkFermentMinutes);
  }

  mixT = bulkStartT - min(10);            // mix takes ~10 min before bulk starts
  stretchFoldT = bulkStartT + min(30);
  autolyseT = mixT - min(25);

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES.autolyse,
    dateTime: new Date(autolyseT),
  });

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES.mix,
    dateTime: new Date(mixT),
  });

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES["stretch-fold"],
    dateTime: new Date(stretchFoldT),
    subStep: true,
  });

  const bulkDurLabel = method.isColdFerment ? "~1.5 hours" : "~6 hours";
  steps.push({
    ...SCHEDULE_STEP_TEMPLATES["bulk-ferment"],
    dateTime: new Date(bulkStartT),
    duration: bulkDurLabel,
    instruction: method.isColdFerment
      ? "Cover the dough and let it rest at room temperature for about 1.5 hours. It should start to puff up but doesn't need to double."
      : "Cover the dough and let it rest at room temperature for about 6 hours until roughly doubled in size.",
  });

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES.ball,
    dateTime: new Date(ballT),
    instruction: `Divide dough into ${numPizzas} equal piece${numPizzas > 1 ? "s" : ""} of ~${doughBallWeight}g each. Shape into tight, smooth balls by tucking the edges underneath.`,
    subStep: true,
  });

  if (method.isColdFerment) {
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["into-fridge"],
      dateTime: new Date(fridgeT),
      duration: `${method.coldFermentHours} hours`,
    });
    steps.push({
      ...SCHEDULE_STEP_TEMPLATES["pull-from-fridge"],
      dateTime: new Date(pullT),
    });
  }

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES.preheat,
    dateTime: new Date(preheatT),
    duration: `${preheatMinutes} min`,
    instruction: `Preheat your ${ovenLabel} for at least ${preheatMinutes} minutes. Make sure your stone or steel is in the oven before you turn it on.`,
  });

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES["stretch-and-top"],
    dateTime: new Date(stretchTopT),
  });

  steps.push({
    ...SCHEDULE_STEP_TEMPLATES.eat,
    dateTime: new Date(eatT),
  });

  steps.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  steps.forEach((s) => { s.checked = false; });

  const earliestStep = steps[0];
  const now = new Date();
  const isValid = earliestStep.dateTime > now;
  let validationMsg = "";
  if (!isValid) {
    const earlyLabel = earliestStep.label;
    const earlyTime = earliestStep.dateTime.toLocaleString(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
    validationMsg = `Not enough time! "${earlyLabel}" would need to start at ${earlyTime}, which has already passed. Push your dinner time later or pick a shorter method.`;
  }

  return { steps, mixTime: earliestStep.dateTime, isValid, validationMsg };
}
