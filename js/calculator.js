/* ══════════════════════════════════════════════════════
   The Pie Lab — Calculator + Results + Settings
   Page: calculator.html
   ══════════════════════════════════════════════════════ */

// ── Module-scoped state ─────────────────────────────
let lastRecipe = null;
let lastCalcContext = null;
let lastDough = null;
let lastSauce = null;
let lastToppings = null;
let lastPreferment = null;   // preferment ingredient split (if active)
let currentUnit = "g";
let currentMode = "quick"; // "quick" or "plan"

// ── Preferment-eligible styles ──────────────────────
const PREFERMENT_STYLES = ["neapolitan", "new-york", "sicilian", "grandma", "new-haven"];

// ── Utility: round to 1 decimal ─────────────────────
function round1(n) { return Math.round(n * 10) / 10; }

// ── Preferment splitter ─────────────────────────────
// Takes calculated dough array, splits flour/water/yeast into preferment + final dough.
function splitPreferment(doughArr, prefType, flourFraction) {
  // Find flour, water, yeast rows
  const flourRow = doughArr.find(d => /flour/i.test(d.ingredient));
  const waterRow = doughArr.find(d => /water/i.test(d.ingredient));
  const yeastRow = doughArr.find(d => /yeast/i.test(d.ingredient));

  if (!flourRow || !waterRow) return null;

  const totalFlour = flourRow.amount;
  const totalWater = waterRow.amount;
  const totalYeast = yeastRow ? yeastRow.amount : 0;

  const prefFlour = round1(totalFlour * flourFraction);
  let prefWater, prefYeast;

  if (prefType === "poolish") {
    prefWater = round1(prefFlour); // 100% hydration
    prefYeast = round1(prefFlour * 0.001); // tiny amount
  } else {
    // biga — 50% hydration
    prefWater = round1(prefFlour * 0.50);
    prefYeast = round1(prefFlour * 0.001);
  }

  // Build preferment ingredients
  const preferment = [
    { ingredient: flourRow.ingredient, amount: prefFlour, pct: round1((prefFlour / prefFlour) * 100) },
    { ingredient: "Water", amount: prefWater, pct: round1((prefWater / prefFlour) * 100) },
    { ingredient: yeastRow ? yeastRow.ingredient : "Instant Dry Yeast", amount: prefYeast, pct: round1((prefYeast / prefFlour) * 100) },
  ];

  // Adjust final dough — subtract preferment amounts
  const finalDough = doughArr.map(d => {
    const row = { ...d };
    if (/flour/i.test(d.ingredient)) {
      row.amount = round1(d.amount - prefFlour);
    } else if (/water/i.test(d.ingredient)) {
      row.amount = round1(d.amount - prefWater);
    } else if (/yeast/i.test(d.ingredient)) {
      row.amount = round1(Math.max(0, d.amount - prefYeast));
    }
    return row;
  });

  return { preferment, finalDough, type: prefType };
}

// ── Flour Substitution Data ─────────────────────────
const FLOUR_ABSORPTION = {
  "Tipo 00 Flour": 0.55,
  "High-Gluten Bread Flour": 0.65,
  "All-Purpose Flour": 0.58,
  "Bread Flour": 0.62,
  "Bread Flour (or Bread + Semolina blend)": 0.62,
  "Whole Wheat Flour": 0.70,
  "Semolina Flour": 0.50,
};

// ── Volume Conversion Data ──────────────────────────
function showScalingMemoryIndicator(styleName) {
  const el = document.getElementById("scaling-memory-indicator");
  if (!el) return;
  el.textContent = `Restored from your last ${styleName} bake`;
  el.classList.remove("hidden", "fade-out");
  el.classList.add("fade-in");
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => { el.classList.add("hidden"); el.classList.remove("fade-in", "fade-out"); }, 500);
  }, 3000);
}

function gramsToOz(grams) {
  const oz = grams / 28.3495;
  if (oz < 0.1) return "< 0.1 oz";
  return (Math.round(oz * 10) / 10) + " oz";
}

function formatAmount(grams, ingredientName) {
  if (currentUnit === "g") return grams + " g";
  return gramsToOz(grams);
}

function unitColumnHeader() {
  return currentUnit === "g" ? "Grams" : "Ounces";
}

// ── All DOM-dependent code runs after DOMContentLoaded ──
document.addEventListener("DOMContentLoaded", () => {

  // ── Populate Pizza Style Selector ────────────────────
  const typeSelectEl = document.getElementById("pizza-type");
  if (typeSelectEl) populateStyleSelect(typeSelectEl);

  // ── Populate Oven-Type Selector ──────────────────────
  const ovenSelect = document.getElementById("calc-oven-type");
  if (ovenSelect) {
    populateOvenSelect(ovenSelect);

    // Default to user's preferred oven from My Kitchen profile
    const kitchenProfile = PieLabProfile.getProfile();
    if (kitchenProfile.preferredOven &&
        ovenSelect.querySelector(`option[value="${kitchenProfile.preferredOven}"]`)) {
      ovenSelect.value = kitchenProfile.preferredOven;
    }

    // Set measurement unit from Kitchen profile
    currentUnit = PieLabProfile.isMetricWeight() ? "g" : "oz";
  }

  // ── Mode Toggle (Quick Calculate / Plan My Bake) ───
  const modeToggleEl = document.getElementById("mode-toggle");
  const planFieldsEl = document.getElementById("plan-fields");
  const eatTimeInput = document.getElementById("eat-time");
  const fermentSelect = document.getElementById("ferment-method");

  // Restore mode from localStorage
  try {
    const savedMode = localStorage.getItem("pielab-calc-mode");
    if (savedMode === "plan") currentMode = "plan";
  } catch { /* ignore */ }

  function setMode(mode) {
    currentMode = mode;
    modeToggleEl.querySelectorAll(".mode-btn").forEach((b) =>
      b.classList.toggle("active", b.dataset.mode === mode)
    );
    planFieldsEl.classList.toggle("hidden", mode !== "plan");

    // Show/hide yeast scaling controls based on mode
    const yeastControls = document.getElementById("yeast-scaling-controls");
    if (yeastControls) yeastControls.classList.toggle("hidden", mode !== "plan");

    if (mode === "plan" && !eatTimeInput.value) {
      // Default to tomorrow 6:30 PM local
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 30, 0, 0);
      eatTimeInput.value = toLocalDateTimeString(tomorrow);
      updateFermentOptions();
    }

    try {
      localStorage.setItem("pielab-calc-mode", mode);
    } catch { /* ignore */ }
  }

  function toLocalDateTimeString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${min}`;
  }

  function updateFermentOptions() {
    const eatTime = new Date(eatTimeInput.value);
    const now = new Date();
    const availableHours = (eatTime - now) / 3600000;
    const styleKey = document.getElementById("pizza-type").value || "";

    const methods = (typeof getAvailableFermentMethods === "function")
      ? getAvailableFermentMethods(availableHours, styleKey)
      : [{ id: "same-day", label: "Same-Day Room Temperature" }];

    fermentSelect.innerHTML = "";
    methods.forEach((m, i) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = m.label;
      if (i === 0) opt.selected = true;
      fermentSelect.appendChild(opt);
    });
  }

  modeToggleEl.addEventListener("click", (e) => {
    const btn = e.target.closest(".mode-btn");
    if (!btn) return;
    setMode(btn.dataset.mode);
  });

  eatTimeInput.addEventListener("change", updateFermentOptions);

  // ── Sync Fermentation Tuning sliders when method dropdown changes ──
  fermentSelect.addEventListener("change", () => {
    const methodId = fermentSelect.value;
    if (!fermentHoursSlider || !fermentTempSlider) return;

    // Map method to default hours and temp
    const methodDefaults = {
      "cold-72": { hours: 72, tempF: 38 },
      "cold-48": { hours: 48, tempF: 38 },
      "cold-24": { hours: 24, tempF: 38 },
      "same-day": { hours: 6,  tempF: 72 },
      "cure-24":  { hours: 24, tempF: 38 },
    };
    const defaults = methodDefaults[methodId];
    if (!defaults) return;

    fermentHoursSlider.value = Math.max(
      parseInt(fermentHoursSlider.min),
      Math.min(parseInt(fermentHoursSlider.max), defaults.hours)
    );
    fermentHoursLabel.textContent = fermentHoursSlider.value + " hours";

    fermentTempSlider.value = defaults.tempF;
    if (typeof updateFermentTempLabel === "function") updateFermentTempLabel();
    else {
      const valF = parseFloat(fermentTempSlider.value);
      const metricTemp = typeof PieLabProfile !== "undefined" && PieLabProfile.isMetricTemp();
      fermentTempLabel.textContent = metricTemp
        ? fToC(valF) + "°C"
        : valF + "°F";
    }
  });

  // Apply saved mode on load
  if (currentMode === "plan") setMode("plan");

  // ── URL params (used for style pre-select after handler is bound) ──
  const urlParams = new URLSearchParams(window.location.search);

  // ── Dynamic Size Selector ────────────────────────────
  const sizeSelect = document.getElementById("pizza-size");

  typeSelectEl.addEventListener("change", () => {
    const recipe = PIZZA_RECIPES[typeSelectEl.value];
    if (!recipe) return;

    sizeSelect.innerHTML = "";
    for (const [key, info] of Object.entries(recipe.sizes)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = info.label;
      sizeSelect.appendChild(opt);
    }

    // Default to recipe-specified default, or middle option for round (12″), or half for sheet
    const keys = Object.keys(recipe.sizes);
    if (recipe.defaultSize && keys.includes(recipe.defaultSize)) {
      sizeSelect.value = recipe.defaultSize;
    } else if (recipe.isSheet) {
      sizeSelect.value = keys.includes("half") ? "half" : keys[0];
    } else {
      sizeSelect.value = keys.includes("12") ? "12" : keys[0];
    }

    // Restore scaling memory for this style (skip if explicit load/style URL)
    if (!urlParams.get("load") && !urlParams.get("style")) {
      try {
        const mem = JSON.parse(localStorage.getItem("pielab-scaling-memory") || "{}");
        const saved = mem[typeSelectEl.value];
        if (saved) {
          if (saved.sizeKey && sizeSelect.querySelector(`option[value="${saved.sizeKey}"]`)) {
            sizeSelect.value = saved.sizeKey;
          }
          if (saved.numPizzas) {
            document.getElementById("num-pizzas").value = saved.numPizzas;
          }
          // Restore oven only if no preferred oven in kitchen profile
          const profile = (typeof PieLabProfile !== "undefined") ? PieLabProfile.getProfile() : {};
          const hasPreferred = profile.preferredOven && ovenSelect.querySelector(`option[value="${profile.preferredOven}"]`);
          if (saved.ovenType && !hasPreferred && ovenSelect.querySelector(`option[value="${saved.ovenType}"]`)) {
            ovenSelect.value = saved.ovenType;
          }
          showScalingMemoryIndicator(recipe.name);
        }
      } catch { /* ignore */ }
    }

    // Refresh ferment options when style changes in plan mode
    if (currentMode === "plan" && eatTimeInput.value) updateFermentOptions();

    // Show/hide preferment controls based on style eligibility
    const prefControls = document.getElementById("preferment-controls");
    if (prefControls) {
      const eligible = PREFERMENT_STYLES.includes(typeSelectEl.value);
      prefControls.classList.toggle("hidden", !eligible);
      // Reset preferment toggle when switching to ineligible style
      if (!eligible) {
        const prefToggle = document.getElementById("preferment-toggle");
        if (prefToggle) prefToggle.checked = false;
        const prefOptions = document.getElementById("preferment-options");
        if (prefOptions) prefOptions.classList.add("hidden");
      }
    }
  });

  // ── Pre-select style (from URL or Kitchen profile) ────
  // Must come AFTER the change handler is bound so sizes populate.
  const presetStyle = urlParams.get("style");
  if (presetStyle && typeSelectEl &&
      typeSelectEl.querySelector(`option[value="${presetStyle}"]`)) {
    typeSelectEl.value = presetStyle;
    typeSelectEl.dispatchEvent(new Event("change"));
  } else {
    const kitchenProfile = (typeof PieLabProfile !== "undefined") ? PieLabProfile.getProfile() : {};
    if (kitchenProfile.favoriteStyle && typeSelectEl &&
        typeSelectEl.querySelector(`option[value="${kitchenProfile.favoriteStyle}"]`)) {
      typeSelectEl.value = kitchenProfile.favoriteStyle;
      typeSelectEl.dispatchEvent(new Event("change"));
    }
  }

  // ── Preferment Toggle Handler ─────────────────────────
  const prefermentToggle = document.getElementById("preferment-toggle");
  const prefermentOptions = document.getElementById("preferment-options");
  const prefermentPctSlider = document.getElementById("preferment-pct");
  const prefermentPctLabel = document.getElementById("preferment-pct-label");

  if (prefermentToggle) {
    prefermentToggle.addEventListener("change", () => {
      if (prefermentToggle.checked) {
        PieLabPremium.gate(() => {
          prefermentOptions.classList.remove("hidden");
        });
        // If gate denied, uncheck
        if (!PieLabPremium.canUse()) {
          prefermentToggle.checked = false;
        }
      } else {
        prefermentOptions.classList.add("hidden");
      }
    });
  }

  if (prefermentPctSlider && prefermentPctLabel) {
    prefermentPctSlider.addEventListener("input", () => {
      prefermentPctLabel.textContent = prefermentPctSlider.value + "%";
    });
  }

  // ── Yeast Scaling Slider Labels ──────────────────────
  const fermentHoursSlider = document.getElementById("ferment-hours");
  const fermentHoursLabel = document.getElementById("ferment-hours-label");
  const fermentTempSlider = document.getElementById("ferment-temp");
  const fermentTempLabel = document.getElementById("ferment-temp-label");
  let yeastScalingGated = false;

  if (fermentHoursSlider && fermentHoursLabel) {
    fermentHoursSlider.addEventListener("input", () => {
      fermentHoursLabel.textContent = fermentHoursSlider.value + " hours";
      if (!yeastScalingGated) {
        yeastScalingGated = true;
        PieLabPremium.gate(() => { /* access granted */ });
      }
    });
  }
  function updateFermentTempLabel() {
    if (!fermentTempSlider || !fermentTempLabel) return;
    const valF = parseFloat(fermentTempSlider.value);
    const metricTemp = typeof PieLabProfile !== "undefined" && PieLabProfile.isMetricTemp();
    fermentTempLabel.textContent = metricTemp
      ? fToC(valF) + "°C"
      : valF + "°F";
  }
  if (fermentTempSlider && fermentTempLabel) {
    fermentTempSlider.addEventListener("input", updateFermentTempLabel);
    updateFermentTempLabel(); // set initial label
  }

  // ── Form Submit ──────────────────────────────────────
  document.getElementById("pizza-form").addEventListener("submit", (e) => {
    e.preventDefault();

    const type = document.getElementById("pizza-type").value;
    const sizeKey = sizeSelect.value;
    const numPizzas = parseInt(document.getElementById("num-pizzas").value, 10);
    const ovenType = ovenSelect ? ovenSelect.value : "stone";

    // Inline validation
    const errType = document.getElementById("err-pizza-type");
    const errSize = document.getElementById("err-pizza-size");
    if (errType) errType.classList.toggle("hidden", !!type);
    if (errSize) errSize.classList.toggle("hidden", !!sizeKey);
    if (!type || !sizeKey) return;
    if (!numPizzas || numPizzas < 1) {
      alert("Please enter at least 1 pizza.");
      return;
    }

    const useCustom = document.getElementById("settings-mode-toggle").checked;
    const recipe = PieLabJournal.getEffectiveRecipe(type, useCustom);
    if (!recipe) return;

    // ── Apply kitchen profile adjustments ──
    const profile = PieLabProfile.getProfile();
    const elevAdj  = PieLabProfile.getElevationAdjustments(profile.elevation);
    const humidAdj = PieLabProfile.getHumidityAdjustments(profile.humidity);

    const totalHydrationDelta = elevAdj.hydrationDelta + humidAdj.hydrationDelta;
    const yeastMultiplier     = elevAdj.yeastMultiplier;

    const adjustedRecipe = { ...recipe };
    if (totalHydrationDelta !== 0 || yeastMultiplier !== 1.0) {
      adjustedRecipe.hydration = Math.min(1.00, Math.max(0.40,
        recipe.hydration + totalHydrationDelta));
      adjustedRecipe.yeastPct = Math.min(0.05, Math.max(0.001,
        recipe.yeastPct * yeastMultiplier));
    }

    // ── Dynamic Yeast Scaling (Exponential Q10 model, Plan mode + premium) ──
    let dynamicYeastActive = false;
    let fermentHoursVal = null;
    let fermentTempVal = null;
    let yeastTypeLabel = "Instant Dry Yeast";
    if (currentMode === "plan" && PieLabPremium.canUse()) {
      const fhSlider = document.getElementById("ferment-hours");
      const ftSlider = document.getElementById("ferment-temp");
      const ytSelect = document.getElementById("yeast-type");
      if (fhSlider && ftSlider && !document.getElementById("yeast-scaling-controls").classList.contains("hidden")) {
        fermentHoursVal = parseFloat(fhSlider.value);
        fermentTempVal = parseFloat(ftSlider.value);

        // Exponential Q10 model: fermentation rate doubles every 15°F (8.3°C)
        // Reference: 0.5% IDY at 24h / 72°F as baseline
        const refYeastPct = 0.005;
        const refHours = 24;
        const refTempF = 72;
        const q10DeltaF = 15; // rate doubles per this many °F
        const tempExponent = (refTempF - fermentTempVal) / q10DeltaF;
        const tempFactor = Math.pow(2, tempExponent);
        const timeFactor = fermentHoursVal / refHours;
        const rawIdyPct = (refYeastPct / timeFactor) * tempFactor;

        // Yeast type conversion: ADY has ~75% activity, Fresh ~40% vs IDY
        const yeastType = ytSelect ? ytSelect.value : "idy";
        const yeastMultiplier = { idy: 1, ady: 1.33, fresh: 2.5 };
        const multiplier = yeastMultiplier[yeastType] || 1;
        const yeastTypeLabels = { idy: "Instant Dry Yeast", ady: "Active Dry Yeast", fresh: "Fresh Yeast" };
        yeastTypeLabel = yeastTypeLabels[yeastType] || "Instant Dry Yeast";

        // Clamp after multiplier with per-type maximums
        const maxPct = { idy: 0.02, ady: 0.027, fresh: 0.05 };
        const clampMax = maxPct[yeastType] || 0.02;
        adjustedRecipe.yeastPct = Math.max(0.0005, Math.min(clampMax, rawIdyPct * multiplier));
        dynamicYeastActive = true;
      }
    }

    // ── Calculate ──
    lastRecipe = adjustedRecipe;
    const dough    = calculateDough(adjustedRecipe, numPizzas, sizeKey);
    const sauce    = calculateSauce(adjustedRecipe, numPizzas, sizeKey);
    const toppings = calculateToppings(adjustedRecipe, numPizzas, sizeKey);

    // ── Bowl Residue Compensation (+1.5%) ──
    const residueOn = document.getElementById("bowl-residue-toggle")?.checked || false;
    if (residueOn) {
      dough.forEach(d => { d.amount = round1(d.amount * 1.015); });
    }

    // ── Preferment Split ──
    const prefEnabled = prefermentToggle?.checked && PREFERMENT_STYLES.includes(type) && PieLabPremium.canUse();
    lastPreferment = null;
    if (prefEnabled) {
      const prefType = document.getElementById("preferment-type")?.value || "poolish";
      const prefPct = (parseInt(document.getElementById("preferment-pct")?.value || "25", 10)) / 100;
      lastPreferment = splitPreferment(dough, prefType, prefPct);
    }
    const ovenTempF  = adjustedRecipe.idealTemp ? adjustedRecipe.idealTemp.max : 500;
    const bakingInfo = getBakingInfo(adjustedRecipe, ovenTempF);

    // ── Render title ──
    const sizeLabel = recipe.sizes[sizeKey].label;
    const unitLabel = recipe.isSheet ? "pan" : "pizza";
    const countLabel = numPizzas === 1 ? `1 ${unitLabel}` : `${numPizzas} ${unitLabel}s`;
    document.getElementById("result-title").textContent =
      `${recipe.name} — ${countLabel}`;

    document.getElementById("result-badge").textContent = sizeLabel;

    // ── Adjustment notice ──
    let noticeEl = document.getElementById("adjustment-notice");
    if (!noticeEl) {
      noticeEl = document.createElement("div");
      noticeEl.id = "adjustment-notice";
      const grid = document.querySelector(".results-grid");
      grid.parentNode.insertBefore(noticeEl, grid);
    }

    const adjustments = [];
    if (elevAdj.hydrationDelta !== 0) {
      adjustments.push(
        `Hydration ${elevAdj.hydrationDelta > 0 ? "+" : ""}${(elevAdj.hydrationDelta * 100).toFixed(0)}% for ${(profile.elevation != null ? profile.elevation.toLocaleString() : "your elevation")} ft elevation`
      );
    }
    if (humidAdj.hydrationDelta !== 0) {
      adjustments.push(
        `Hydration ${humidAdj.hydrationDelta > 0 ? "+" : ""}${(humidAdj.hydrationDelta * 100).toFixed(0)}% for ${profile.humidity} climate`
      );
    }
    if (yeastMultiplier !== 1.0) {
      const reduction = Math.round((1 - yeastMultiplier) * 100);
      adjustments.push(
        `Yeast \u2212${reduction}% for ${(profile.elevation != null ? profile.elevation.toLocaleString() : "your elevation")} ft elevation`
      );
    }

    if (adjustments.length > 0) {
      noticeEl.className = "adjustment-notice";
      noticeEl.innerHTML =
        `<strong>Adjusted for your kitchen:</strong> ${adjustments.join(" \u00B7 ")}`;
    } else {
      noticeEl.className = "adjustment-notice hidden";
      noticeEl.innerHTML = "";
    }

    // Cache raw gram data for unit toggle re-rendering
    lastDough = dough;
    lastSauce = sauce;
    lastToppings = toppings;

    // Render tables (unit-aware — driven by Kitchen measurement setting)
    // If preferment active, render both preferment table and modified final dough
    const prefResultEl = document.getElementById("preferment-result");
    const doughTitle = document.getElementById("dough-section-title");
    const prefTypeBadge = document.getElementById("preferment-type-badge");

    if (lastPreferment) {
      // Show preferment section
      prefResultEl.classList.remove("hidden");
      prefTypeBadge.textContent = lastPreferment.type === "poolish" ? "Poolish" : "Biga";
      renderPrefermentTable(lastPreferment.preferment);

      // Render final dough (with preferment subtracted)
      doughTitle.textContent = "Final Dough";
      lastDough = lastPreferment.finalDough;
      renderDoughTable(lastPreferment.finalDough);
    } else {
      prefResultEl.classList.add("hidden");
      doughTitle.textContent = "Dough";
      renderDoughTable(dough);
    }

    // Bowl residue note
    const residueNote = document.getElementById("residue-note");
    if (residueNote) {
      residueNote.textContent = "Includes +1.5% for bowl/mixer residue";
      residueNote.classList.toggle("hidden", !residueOn);
    }

    // Yeast scaling note
    const yeastNote = document.getElementById("yeast-note");
    if (yeastNote) {
      if (dynamicYeastActive) {
        const pct = (adjustedRecipe.yeastPct * 100).toFixed(2);
        const metricTempYeast = typeof PieLabProfile !== "undefined" && PieLabProfile.isMetricTemp();
        const tempStr = metricTempYeast ? `${fToC(fermentTempVal)}°C` : `${fermentTempVal}°F`;
        yeastNote.textContent = `${yeastTypeLabel} scaled to ${pct}% — ${fermentHoursVal}h at ${tempStr}`;
        yeastNote.classList.remove("hidden");
      } else {
        yeastNote.classList.add("hidden");
      }
    }

    renderSimpleTable("sauce-table", sauce);
    renderSimpleTable("toppings-table", toppings);

    // Baking instructions — dynamic preheat from oven type
    const recTempF = bakingInfo.recommendedTemp;
    const recTempC = fToC(recTempF);
    const preheatMinutes = (typeof OVEN_PREHEAT_MINUTES !== "undefined" && OVEN_PREHEAT_MINUTES[ovenType])
      ? OVEN_PREHEAT_MINUTES[ovenType]
      : 45;

    const metricTempBake = typeof PieLabProfile !== "undefined" && PieLabProfile.isMetricTemp();
    const tempDisplay = metricTempBake
      ? `${recTempC}°C`
      : `${recTempF}°F`;
    // Oven temp
    document.getElementById("baking-instructions").innerHTML = `
      <p><strong>Preheat oven to:</strong> ${tempDisplay} (preheat for at least ${preheatMinutes} minutes)</p>
    `;

    // Rack position
    const rackEl = document.getElementById("baking-rack");
    if (rackEl) {
      rackEl.innerHTML = recipe.rackPosition
        ? `<p><strong>Rack position:</strong> ${recipe.rackPosition}</p>`
        : "";
    }

    // Tiered tips — init slider for this style (sets level from profile/bakes), then render
    window._currentTips   = recipe.tips || [];
    window._currentStyleKey = type;
    if (window.initTipsSlider) window.initTipsSlider(type);
    if (window.renderTips)    window.renderTips();

    // Bake time (below tips)
    const bakeTimeEl = document.getElementById("baking-time");
    if (bakeTimeEl) {
      bakeTimeEl.innerHTML = `<p><strong>Bake time:</strong> ${bakingInfo.bakeTime}</p>`;
    }

    // ── Contextual "Learn More" link (cross-page) ──
    const learnMoreEl = document.getElementById("results-learn-more");
    if (typeof STYLE_LIBRARY !== "undefined" && STYLE_LIBRARY[type]) {
      const styleName = STYLE_LIBRARY[type].name;
      learnMoreEl.innerHTML = `<a href="learn.html?style=${type}#styles" class="learn-more-link">Learn more about ${styleName} \u2192</a>`;
    } else {
      learnMoreEl.innerHTML = "";
    }

    // ── Store last calculation in localStorage (for journal pre-fill) ──
    const doughBallWeight = adjustedRecipe.sizes[sizeKey].doughWeight;
    const lastCalcData = {
      styleKey: type,
      styleName: recipe.name,
      sizeKey,
      numPizzas,
      ovenType,
      useCustom,
      doughSnapshot: {
        hydration: adjustedRecipe.hydration,
        saltPct: adjustedRecipe.saltPct,
        oilPct: adjustedRecipe.oilPct,
        sugarPct: adjustedRecipe.sugarPct,
        yeastPct: adjustedRecipe.yeastPct,
        doughBallWeight,
      },
      bakeTemp: recipe.idealTemp ? recipe.idealTemp.max : null,
      totalDoughWeight: Math.round(doughBallWeight * numPizzas),
      timestamp: Date.now(),
      // Premium feature state
      bowlResidue: residueOn,
      prefermentEnabled: prefEnabled,
      prefermentType: prefEnabled ? (document.getElementById("preferment-type")?.value || null) : null,
      prefermentFlourPct: prefEnabled ? parseInt(document.getElementById("preferment-pct")?.value || "25", 10) : null,
      dynamicYeast: dynamicYeastActive,
      fermentHours: fermentHoursVal,
      fermentTemp: fermentTempVal,
      yeastType: dynamicYeastActive ? (document.getElementById("yeast-type")?.value || "idy") : null,
    };

    // Preserve derivedFromId if user arrived via "Use as Starting Point"
    // and is still working with the same pizza style
    try {
      const existing = JSON.parse(localStorage.getItem("pielab-last-calc") || "{}");
      if (existing.derivedFromId && existing.styleKey === type) {
        lastCalcData.derivedFromId = existing.derivedFromId;
      }
    } catch { /* ignore */ }

    try {
      localStorage.setItem("pielab-last-calc", JSON.stringify(lastCalcData));
      localStorage.setItem("pielab-pending-bake", JSON.stringify(lastCalcData));
    } catch { /* ignore storage errors */ }

    // Save scaling memory for this style
    try {
      const mem = JSON.parse(localStorage.getItem("pielab-scaling-memory") || "{}");
      mem[type] = { sizeKey, numPizzas, ovenType };
      localStorage.setItem("pielab-scaling-memory", JSON.stringify(mem));
    } catch { /* ignore */ }

    // ── Plan preview (Plan My Bake mode) ──
    const planPreviewEl = document.getElementById("plan-preview");
    const planStepsEl = document.getElementById("plan-preview-steps");

    if (currentMode === "plan" && eatTimeInput.value) {
      const eatTime = new Date(eatTimeInput.value);
      const methodKey = fermentSelect.value || "same-day";
      const method = (typeof FERMENT_METHODS !== "undefined") ? FERMENT_METHODS[methodKey] : null;
      const doughBallWeight = adjustedRecipe.sizes[sizeKey].doughWeight;
      const ovenType = ovenSelect ? ovenSelect.value : "stone";

      if (method && typeof buildScheduleBackward === "function") {
        const schedule = buildScheduleBackward(eatTime, ovenType, method, numPizzas, doughBallWeight, type);

        // Render preview steps
        const fmtOpts = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
        planStepsEl.innerHTML = schedule.steps.map((s) => {
          const time = s.dateTime.toLocaleString(undefined, fmtOpts);
          return `<div class="plan-step">
            <span class="plan-step-time">${time}</span>
            <span class="plan-step-label">${s.label}</span>
          </div>`;
        }).join("");

        if (!schedule.isValid) {
          planStepsEl.innerHTML += `<p class="plan-warning">${schedule.validationMsg}</p>`;
        }

        // Save to localStorage for schedule page prefill
        try {
          const planData = {
            styleKey: type,
            quantity: numPizzas,
            eatTime: eatTimeInput.value,
            fermentMethodKey: methodKey,
            calcResult: { doughBallWeight },
          };
          localStorage.setItem("pielab-plan-prefill", JSON.stringify(planData));
        } catch { /* ignore */ }

        planPreviewEl.classList.remove("hidden");
      } else {
        planPreviewEl.classList.add("hidden");
      }
    } else {
      planPreviewEl.classList.add("hidden");
    }

    // ── Flour substitution row ──
    lastCalcContext = { adjustedRecipe, numPizzas, sizeKey };

    const flourSubRow = document.getElementById("flour-sub-row");
    const flourSubSelect = document.getElementById("flour-sub-select");
    const flourSubNote = document.getElementById("flour-sub-note");

    if (adjustedRecipe.flour && FLOUR_ABSORPTION[adjustedRecipe.flour] != null) {
      // Populate select with flour options (excluding recipe's own flour)
      flourSubSelect.innerHTML = '<option value="">— Use recommended flour —</option>';
      for (const flour of Object.keys(FLOUR_ABSORPTION)) {
        if (flour === adjustedRecipe.flour) continue;
        const opt = document.createElement("option");
        opt.value = flour;
        opt.textContent = flour;
        flourSubSelect.appendChild(opt);
      }
      flourSubRow.classList.remove("hidden");
    } else {
      flourSubRow.classList.add("hidden");
    }

    // Reset any previous flour substitution
    flourSubSelect.value = "";
    if (flourSubNote) {
      flourSubNote.className = "flour-sub-note hidden";
      flourSubNote.innerHTML = "";
    }

    // Show results
    const resultsEl = document.getElementById("results");
    resultsEl.classList.remove("hidden");
    resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ── "Log This Bake" navigates to journal page ────────
  document.getElementById("btn-log-bake").addEventListener("click", () => {
    window.location.href = "journal.html?prefill=1";
  });

  // ── Flour Substitution Handler ───────────────────────
  document.getElementById("flour-sub-select").addEventListener("change", () => {
    if (!lastCalcContext) return;

    const select = document.getElementById("flour-sub-select");
    const selectedFlour = select.value;
    const { adjustedRecipe, numPizzas, sizeKey } = lastCalcContext;

    // Manage the flour-sub-note element (above dough table)
    let noteEl = document.getElementById("flour-sub-note");
    if (!noteEl) {
      noteEl = document.createElement("div");
      noteEl.id = "flour-sub-note";
      const doughTable = document.getElementById("dough-table");
      doughTable.parentNode.insertBefore(noteEl, doughTable);
    }

    // Reset: restore original dough table
    if (!selectedFlour) {
      const dough = calculateDough(adjustedRecipe, numPizzas, sizeKey);
      lastDough = dough;
      renderDoughTable(dough);
      noteEl.className = "flour-sub-note hidden";
      noteEl.innerHTML = "";
      return;
    }

    const recipeFlour = adjustedRecipe.flour;
    const origAbsorption = FLOUR_ABSORPTION[recipeFlour];
    const subAbsorption = FLOUR_ABSORPTION[selectedFlour];

    if (origAbsorption == null || subAbsorption == null) return;

    // Subbing to a higher-absorption flour needs more water (positive delta); lower-absorption needs less (negative delta)
    const hydrationDelta = subAbsorption - origAbsorption;
    const absDelta = Math.abs(hydrationDelta);

    // Create substituted recipe with adjusted hydration and flour name
    const subRecipe = { ...adjustedRecipe };
    subRecipe.flour = selectedFlour;
    subRecipe.hydration = Math.min(1.00, Math.max(0.40,
      adjustedRecipe.hydration + hydrationDelta));

    // Recalculate and re-render dough table only
    const dough = calculateDough(subRecipe, numPizzas, sizeKey);
    lastDough = dough;
    renderDoughTable(dough);

    // If Custom mode is active, update the hydration field and save
    const toggle = document.getElementById("settings-mode-toggle");
    if (toggle && toggle.checked) {
      const hydField = document.getElementById("ps-hydration");
      if (hydField) hydField.value = (subRecipe.hydration * 100).toFixed(1);

      const styleKey = document.getElementById("pizza-type").value;
      if (styleKey) {
        const current = PieLabJournal.getPersonalSettings(styleKey) || {};
        current.hydration = subRecipe.hydration;
        PieLabJournal.savePersonalSettings(styleKey, current);
      }
    }

    // Compatibility badge
    let badgeClass, badgeText, noteClass;
    if (absDelta <= 0.04) {
      badgeClass = "badge-great";
      badgeText = "Works great";
      noteClass = "compat-great";
    } else if (absDelta <= 0.08) {
      badgeClass = "badge-workable";
      badgeText = "Workable";
      noteClass = "compat-workable";
    } else {
      badgeClass = "badge-significant";
      badgeText = "Significant difference \u2014 result will vary";
      noteClass = "compat-significant";
    }

    const origPct = (adjustedRecipe.hydration * 100).toFixed(1);
    const adjPct = (subRecipe.hydration * 100).toFixed(1);

    noteEl.className = `flour-sub-note ${noteClass}`;
    noteEl.innerHTML =
      `Using <strong>${selectedFlour}</strong> instead of <strong>${recipeFlour}</strong>. ` +
      `Hydration adjusted from ${origPct}% to ${adjPct}% to compensate for absorption difference. ` +
      `<span class="compat-badge ${badgeClass}">${badgeText}</span>`;
  });

  // ── Helpers ──────────────────────────────────────────
  function fillTable(tableId, rows) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = "";
    rows.forEach((cols) => {
      const tr = document.createElement("tr");
      tr.innerHTML = cols.map((c) => `<td>${c}</td>`).join("");
      tbody.appendChild(tr);
    });
  }

  function renderDoughTable(dough) {
    const th = document.querySelector("#dough-table thead th:nth-child(2)");
    if (th) th.textContent = unitColumnHeader();

    fillTable("dough-table",
      dough.map((d) => {
        const nameCell = d.ingredient === "Water"
          ? `Water <button class="hydration-info-btn" type="button" aria-label="Hydration guide">\u24D8</button>`
          : d.ingredient;
        return [nameCell, formatAmount(d.amount, d.ingredient), `${d.pct}%`];
      })
    );

    // Total batch weight
    const totalGrams = dough.reduce((sum, d) => sum + d.amount, 0);
    const totalEl = document.getElementById("dough-total-amount");
    if (totalEl) totalEl.textContent = formatAmount(Math.round(totalGrams), "Total");
  }

  function renderPrefermentTable(prefIngredients) {
    const th = document.querySelector("#preferment-table thead th:nth-child(2)");
    if (th) th.textContent = unitColumnHeader();

    fillTable("preferment-table",
      prefIngredients.map((d) => [d.ingredient, formatAmount(d.amount, d.ingredient), `${d.pct}%`])
    );
  }

  function renderSimpleTable(tableId, rows) {
    const th = document.querySelector(`#${tableId} thead th:nth-child(2)`);
    if (th) th.textContent = unitColumnHeader();

    fillTable(tableId,
      rows.map((r) => [r.ingredient, formatAmount(r.amount, r.ingredient)])
    );
  }

  // ── Hydration Guide Popover (delegated) ─────────────
  document.getElementById("dough-table").addEventListener("click", (e) => {
    const btn = e.target.closest(".hydration-info-btn");
    if (!btn || !lastRecipe) return;

    e.stopPropagation();

    // Close any existing popover
    const existing = document.querySelector(".hydration-popover");
    if (existing) {
      existing.remove();
      return;
    }

    const guide = HYDRATION_GUIDE[lastRecipe.flour];
    if (!guide) return;

    const popover = document.createElement("div");
    popover.className = "hydration-popover";

    let brandsHtml = guide.brandNotes
      .map((b) => `<li><strong>${b.brand}:</strong> ${b.note}</li>`)
      .join("");

    popover.innerHTML = `
      <div class="popover-header">
        <span class="popover-title">Hydration Guide — ${lastRecipe.flour}</span>
        <button class="popover-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="popover-body">
        <p class="popover-absorption"><strong>Absorption:</strong> ${guide.absorption}</p>
        <div class="popover-section">
          <h4>Elevation</h4>
          <p>${guide.elevationNote}</p>
        </div>
        <div class="popover-section">
          <h4>Humidity</h4>
          <p>${guide.humidityNote}</p>
        </div>
        <div class="popover-section">
          <h4>Brand Differences</h4>
          <ul>${brandsHtml}</ul>
        </div>
      </div>
    `;

    // Position relative to the Water row's cell
    const cell = btn.closest("td");
    cell.style.position = "relative";
    cell.appendChild(popover);

    // Close handlers
    popover.querySelector(".popover-close").addEventListener("click", (ev) => {
      ev.stopPropagation();
      popover.remove();
    });

    document.addEventListener("click", function closeOnOutside(ev) {
      if (!popover.contains(ev.target) && ev.target !== btn) {
        popover.remove();
        document.removeEventListener("click", closeOnOutside);
      }
    });
  });


  // ══════════════════════════════════════════════════════
  // ── Settings Toggle ─────────────────────────────────
  // ══════════════════════════════════════════════════════
  (() => {
    const toggle = document.getElementById("settings-mode-toggle");
    const labelRec = document.getElementById("toggle-label-rec");
    const labelCustom = document.getElementById("toggle-label-custom");
    const editor = document.getElementById("custom-settings-editor");
    const styleSelect = document.getElementById("pizza-type");
    const customStyleLabel = document.getElementById("custom-style-label");

    const fields = {
      hydration: document.getElementById("ps-hydration"),
      saltPct: document.getElementById("ps-salt"),
      oilPct: document.getElementById("ps-oil"),
      sugarPct: document.getElementById("ps-sugar"),
      yeastPct: document.getElementById("ps-yeast"),
      doughBallWeight: document.getElementById("ps-dough-weight"),
    };

    function updateToggleLabels() {
      const isCustom = toggle.checked;
      labelRec.classList.toggle("active", !isCustom);
      labelCustom.classList.toggle("active", isCustom);
    }

    function showEditor() {
      const styleKey = styleSelect.value;
      if (!toggle.checked || !styleKey) {
        editor.classList.add("hidden");
        return;
      }

      const recipe = PIZZA_RECIPES[styleKey];
      if (!recipe) { editor.classList.add("hidden"); return; }

      const personal = PieLabJournal.getPersonalSettings(styleKey);
      const sizeKeys = Object.keys(recipe.sizes);
      const defaultDoughWeight = recipe.sizes[sizeKeys[0]].doughWeight;

      customStyleLabel.textContent = `\u2014 ${recipe.name}`;

      fields.hydration.value = personal?.hydration != null
        ? (personal.hydration * 100).toFixed(1)
        : (recipe.hydration * 100).toFixed(1);
      fields.saltPct.value = personal?.saltPct != null
        ? (personal.saltPct * 100).toFixed(1)
        : (recipe.saltPct * 100).toFixed(1);
      fields.oilPct.value = personal?.oilPct != null
        ? (personal.oilPct * 100).toFixed(1)
        : (recipe.oilPct * 100).toFixed(1);
      fields.sugarPct.value = personal?.sugarPct != null
        ? (personal.sugarPct * 100).toFixed(1)
        : (recipe.sugarPct * 100).toFixed(1);
      fields.yeastPct.value = personal?.yeastPct != null
        ? (personal.yeastPct * 100).toFixed(2)
        : (recipe.yeastPct * 100).toFixed(2);
      fields.doughBallWeight.value = personal?.doughBallWeight != null
        ? personal.doughBallWeight
        : defaultDoughWeight;

      editor.classList.remove("hidden");
    }

    function saveCurrentSettings() {
      const styleKey = styleSelect.value;
      if (!styleKey || !toggle.checked) return;

      PieLabJournal.savePersonalSettings(styleKey, {
        hydration: parseFloat(fields.hydration.value) / 100,
        saltPct: parseFloat(fields.saltPct.value) / 100,
        oilPct: parseFloat(fields.oilPct.value) / 100,
        sugarPct: parseFloat(fields.sugarPct.value) / 100,
        yeastPct: parseFloat(fields.yeastPct.value) / 100,
        doughBallWeight: parseFloat(fields.doughBallWeight.value),
      });
    }

    // Events
    toggle.addEventListener("change", () => {
      updateToggleLabels();
      showEditor();
    });

    styleSelect.addEventListener("change", showEditor);

    Object.values(fields).forEach((input) => {
      input.addEventListener("blur", saveCurrentSettings);
      input.addEventListener("change", saveCurrentSettings);
    });

    document.getElementById("btn-reset-custom").addEventListener("click", () => {
      const styleKey = styleSelect.value;
      if (styleKey) {
        PieLabJournal.deletePersonalSettings(styleKey);
        showEditor();
      }
    });

    // Init labels
    updateToggleLabels();
  })();

  // ── "Cook This Again" / "Use as Starting Point" loader (?load=1) ──
  (() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("load") !== "1") return;

    try {
      const raw = localStorage.getItem("pielab-last-calc");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.styleKey) return;

      // 1. Set pizza style (triggers size selector population)
      const typeSelect = document.getElementById("pizza-type");
      if (typeSelect) {
        typeSelect.value = data.styleKey;
        typeSelect.dispatchEvent(new Event("change"));
      }

      // 2. Set oven type
      if (data.ovenType) {
        const ovenSelect = document.getElementById("calc-oven-type");
        if (ovenSelect && ovenSelect.querySelector(`option[value="${data.ovenType}"]`)) {
          ovenSelect.value = data.ovenType;
        }
      }

      // 3. Set number of pizzas
      if (data.numPizzas) {
        const numInput = document.getElementById("num-pizzas");
        if (numInput) numInput.value = data.numPizzas;
      }

      // 4. Set pizza size if we have one
      if (data.sizeKey) {
        const sizeSelect = document.getElementById("pizza-size");
        if (sizeSelect && sizeSelect.querySelector(`option[value="${data.sizeKey}"]`)) {
          sizeSelect.value = data.sizeKey;
        }
      }

      // 5. If we have a doughSnapshot (from "Use as Starting Point"),
      //    switch to Custom mode and populate the fields
      if (data.doughSnapshot) {
        const snap = data.doughSnapshot;
        const toggle = document.getElementById("settings-mode-toggle");
        const editor = document.getElementById("custom-settings-editor");
        const labelRec = document.getElementById("toggle-label-rec");
        const labelCustom = document.getElementById("toggle-label-custom");
        const customStyleLabel = document.getElementById("custom-style-label");

        // Switch toggle to Custom
        if (toggle && !toggle.checked) {
          toggle.checked = true;
          labelRec.classList.remove("active");
          labelCustom.classList.add("active");
        }

        // Save the snapshot values as custom settings for this style
        // so getEffectiveRecipe() picks them up on Calculate
        const customSettings = {};
        if (snap.hydration != null)      customSettings.hydration = snap.hydration;
        if (snap.saltPct != null)        customSettings.saltPct = snap.saltPct;
        if (snap.oilPct != null)         customSettings.oilPct = snap.oilPct;
        if (snap.sugarPct != null)       customSettings.sugarPct = snap.sugarPct;
        if (snap.yeastPct != null)       customSettings.yeastPct = snap.yeastPct;
        if (snap.doughBallWeight != null) customSettings.doughBallWeight = snap.doughBallWeight;

        PieLabJournal.savePersonalSettings(data.styleKey, customSettings);

        // Populate the visible editor fields
        const fieldMap = {
          hydration:       { el: document.getElementById("ps-hydration"),    mult: 100, dec: 1 },
          saltPct:         { el: document.getElementById("ps-salt"),         mult: 100, dec: 1 },
          oilPct:          { el: document.getElementById("ps-oil"),          mult: 100, dec: 1 },
          sugarPct:        { el: document.getElementById("ps-sugar"),        mult: 100, dec: 1 },
          yeastPct:        { el: document.getElementById("ps-yeast"),        mult: 100, dec: 2 },
          doughBallWeight: { el: document.getElementById("ps-dough-weight"), mult: 1,   dec: 0 },
        };

        for (const [key, cfg] of Object.entries(fieldMap)) {
          if (snap[key] != null && cfg.el) {
            cfg.el.value = (snap[key] * cfg.mult).toFixed(cfg.dec);
          }
        }

        // Show editor panel with style label
        const recipe = PIZZA_RECIPES[data.styleKey];
        if (customStyleLabel && recipe) {
          customStyleLabel.textContent = `\u2014 ${recipe.name}`;
        }
        if (editor) editor.classList.remove("hidden");
      }

      // Scroll to calculator
      const calcCard = document.querySelector(".calculator-card");
      if (calcCard) {
        setTimeout(() => calcCard.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }

      // Clean URL so reload doesn't re-trigger
      history.replaceState(null, "", window.location.pathname);
    } catch {
      // Silently ignore malformed data
    }
  })();

  // ── Print & New Recipe buttons (no inline handlers) ──
  const btnPrint = document.getElementById("btn-print");
  if (btnPrint) btnPrint.addEventListener("click", () => window.print());

  const btnReset = document.getElementById("btn-reset");
  if (btnReset) btnReset.addEventListener("click", () => {
    document.getElementById("results").classList.add("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Clear validation errors when user changes selection
  const typeSelect = document.getElementById("pizza-type");
  const sizeSelect2 = document.getElementById("pizza-size");
  if (typeSelect) typeSelect.addEventListener("change", () => {
    const err = document.getElementById("err-pizza-type");
    if (err) err.classList.add("hidden");
    // Style change auto-populates size, so clear that error too
    const errSize = document.getElementById("err-pizza-size");
    if (errSize) errSize.classList.add("hidden");
  });
  if (sizeSelect2) sizeSelect2.addEventListener("change", () => {
    const err = document.getElementById("err-pizza-size");
    if (err) err.classList.add("hidden");
  });

}); // end DOMContentLoaded

// ── Tiered Tips & Skill Level Slider ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

  const LEVEL_LABELS = ["beginner", "intermediate", "pro"];
  const LEVEL_DISPLAY = { beginner: "Beginner", intermediate: "Intermediate", pro: "Pro" };

  const slider   = document.getElementById("tips-level-slider");
  const badge    = document.getElementById("tips-level-badge");
  const tipsList = document.getElementById("pro-tips");

  // ── Helpers ────────────────────────────────────────────────────────────

  function getActiveLevel() {
    return LEVEL_LABELS[parseInt(slider?.value ?? 0)];
  }

  function setSliderToLevel(level) {
    const idx = LEVEL_LABELS.indexOf(level);
    if (slider && idx !== -1) {
      slider.value = idx;
      updateBadge(level);
    }
  }

  function updateBadge(level) {
    if (!badge) return;
    badge.textContent = LEVEL_DISPLAY[level] || "Beginner";
    badge.className = "tips-level-badge tips-level-badge--" + level;
  }

  function renderTips() {
    if (!tipsList) return;
    const level = getActiveLevel();
    const tips  = (window._currentTips || []).filter(t => t.level === level);
    tipsList.innerHTML = "";
    if (!tips.length) {
      const li = document.createElement("li");
      li.textContent = "Calculate a recipe to see tips.";
      li.style.color = "var(--clr-text-muted, #9a9690)";
      tipsList.appendChild(li);
      return;
    }
    tips.forEach(({ tip }) => {
      const li = document.createElement("li");
      li.textContent = tip;
      tipsList.appendChild(li);
    });
  }

  // Expose globally so the calculate() function can call it
  window.renderTips = renderTips;

  // ── Initialize slider from saved profile (or bake count) ───────────────
  // Called each time a style is calculated so the default updates per style.
  window.initTipsSlider = function(styleKey) {
    if (!styleKey || !slider) return;

    // 1. Check for a manually saved level
    const saved = (typeof PieLabProfile !== "undefined")
      ? PieLabProfile.getStyleLevel(styleKey)
      : null;

    if (saved) {
      setSliderToLevel(saved);
      return;
    }

    // 2. Fall back to computing from bake count
    const bakeCount = (typeof PieLabJournal !== "undefined")
      ? PieLabJournal.getBakesCountByStyle(styleKey)
      : 0;

    const computed = (typeof PieLabProfile !== "undefined")
      ? PieLabProfile.levelFromBakeCount(bakeCount)
      : "beginner";

    setSliderToLevel(computed);
  };

  // ── Slider interaction ─────────────────────────────────────────────────
  slider?.addEventListener("input", () => {
    const level = getActiveLevel();
    updateBadge(level);
    renderTips();

    // Persist the manual choice against the current style
    const styleKey = window._currentStyleKey;
    if (styleKey && typeof PieLabProfile !== "undefined") {
      PieLabProfile.setStyleLevel(styleKey, level);
    }
  });

  // ══════════════════════════════════════════════════════
  //  BAKE TIMER
  // ══════════════════════════════════════════════════════
  const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // matches SVG r=88
  const timerOverlay = document.getElementById("timer-overlay");
  const timerTimeEl  = document.getElementById("timer-time");
  const timerStatusEl = document.getElementById("timer-status");
  const timerRingFg  = document.getElementById("timer-ring-fg");
  const timerPauseBtn = document.getElementById("timer-pause");

  if (timerRingFg) {
    timerRingFg.style.strokeDasharray = RING_CIRCUMFERENCE;
    timerRingFg.style.strokeDashoffset = 0;
  }

  const timer = { running: false, paused: false, total: 0, remaining: 0, startedAt: 0, pauseOffset: 0, intervalId: null };

  function parseBakeTimeString(str) {
    const m = str.match(/(\d+)[–\u2013-](\d+)\s*(seconds?|minutes?)/i);
    if (!m) return 300; // fallback 5 min
    const lo = parseInt(m[1], 10);
    const hi = parseInt(m[2], 10);
    const multiplier = m[3].toLowerCase().startsWith("minute") ? 60 : 1;
    return Math.round(((lo + hi) / 2) * multiplier);
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function updateTimerDisplay() {
    const secs = Math.max(0, timer.remaining);
    timerTimeEl.textContent = formatTime(secs);
    const frac = timer.total > 0 ? secs / timer.total : 0;
    timerRingFg.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - frac);
  }

  function saveTimerState() {
    try {
      localStorage.setItem("pielab-bake-timer", JSON.stringify({
        total: timer.total, startedAt: timer.startedAt, pauseOffset: timer.pauseOffset,
        paused: timer.paused, pausedAt: timer.paused ? Date.now() : 0
      }));
    } catch { /* ignore */ }
  }

  function clearTimerState() {
    localStorage.removeItem("pielab-bake-timer");
  }

  /* ── Looping alarm sound ── */
  let alarmCtx = null;
  let alarmIntervalId = null;

  function startAlarmSound() {
    stopAlarmSound(); // clean up any previous
    try {
      alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return; }
    function beepBurst() {
      if (!alarmCtx) return;
      [0, 0.25, 0.5].forEach(offset => {
        const osc = alarmCtx.createOscillator();
        const gain = alarmCtx.createGain();
        osc.connect(gain); gain.connect(alarmCtx.destination);
        osc.frequency.value = 880;
        gain.gain.value = 0.35;
        osc.start(alarmCtx.currentTime + offset);
        osc.stop(alarmCtx.currentTime + offset + 0.15);
      });
    }
    beepBurst(); // play immediately
    alarmIntervalId = setInterval(beepBurst, 1500); // repeat every 1.5s
  }

  function stopAlarmSound() {
    if (alarmIntervalId) { clearInterval(alarmIntervalId); alarmIntervalId = null; }
    if (alarmCtx) { try { alarmCtx.close(); } catch {} alarmCtx = null; }
  }

  function timerComplete() {
    timer.running = false;
    clearInterval(timer.intervalId);
    timer.remaining = 0;
    updateTimerDisplay();
    clearTimerState();
    // Swap to done controls (Stop Alarm button)
    document.getElementById("timer-running-controls").classList.add("hidden");
    document.getElementById("timer-done-controls").classList.remove("hidden");
    timerStatusEl.textContent = "Pizza is done! 🍕";
    // Start looping alarm
    startAlarmSound();
    // Browser notification
    if (typeof PieNotifications !== "undefined") {
      PieNotifications.requestPermission().then(ok => {
        if (ok) PieNotifications.schedule({ id: 9999, title: "Pizza is done! 🍕", body: "Your bake timer has finished.", at: new Date(Date.now() + 100) });
      });
    }
  }

  function timerTick() {
    if (timer.paused) return;
    const elapsed = (Date.now() - timer.startedAt - timer.pauseOffset) / 1000;
    timer.remaining = Math.round(timer.total - elapsed);
    if (timer.remaining <= 0) { timerComplete(); return; }
    updateTimerDisplay();
    // Save state every 5 seconds
    if (timer.remaining % 5 === 0) saveTimerState();
  }

  function resetTimerControls() {
    document.getElementById("timer-running-controls").classList.remove("hidden");
    document.getElementById("timer-done-controls").classList.add("hidden");
    timerPauseBtn.textContent = "Pause";
    timerPauseBtn.disabled = false;
  }

  function startTimer(seconds) {
    stopAlarmSound();
    resetTimerControls();
    timer.total = seconds;
    timer.remaining = seconds;
    timer.startedAt = Date.now();
    timer.pauseOffset = 0;
    timer.running = true;
    timer.paused = false;
    timerPauseBtn.disabled = false;
    timerStatusEl.textContent = `Total: ${formatTime(seconds)}`;
    updateTimerDisplay();
    saveTimerState();
    clearInterval(timer.intervalId);
    timer.intervalId = setInterval(timerTick, 1000);
    timerOverlay.classList.remove("hidden");
  }

  function resumeTimer(saved) {
    timer.total = saved.total;
    timer.startedAt = saved.startedAt;
    timer.pauseOffset = saved.pauseOffset || 0;
    timer.paused = saved.paused || false;
    if (timer.paused && saved.pausedAt) {
      // Add time spent while page was closed during pause
      timer.pauseOffset += Date.now() - saved.pausedAt;
    }
    const elapsed = (Date.now() - timer.startedAt - timer.pauseOffset) / 1000;
    timer.remaining = Math.round(timer.total - elapsed);
    if (timer.remaining <= 0) { timerComplete(); timerOverlay.classList.remove("hidden"); return; }
    timer.running = true;
    timerPauseBtn.textContent = timer.paused ? "Resume" : "Pause";
    timerPauseBtn.disabled = false;
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    updateTimerDisplay();
    if (!timer.paused) {
      clearInterval(timer.intervalId);
      timer.intervalId = setInterval(timerTick, 1000);
    }
    timerOverlay.classList.remove("hidden");
  }

  // Start button
  document.getElementById("btn-start-timer").addEventListener("click", () => {
    const instrEl = document.getElementById("baking-time");
    const bakeTimeText = instrEl ? instrEl.textContent : "";
    const seconds = parseBakeTimeString(bakeTimeText);
    startTimer(seconds);
  });

  // Pause / Resume
  timerPauseBtn.addEventListener("click", () => {
    if (!timer.running) return;
    if (timer.paused) {
      timer.pauseOffset += Date.now() - timer._pausedAt;
      timer.paused = false;
      timerPauseBtn.textContent = "Pause";
      timer.intervalId = setInterval(timerTick, 1000);
    } else {
      timer.paused = true;
      timer._pausedAt = Date.now();
      timerPauseBtn.textContent = "Resume";
      clearInterval(timer.intervalId);
    }
    saveTimerState();
  });

  // ±30s adjustments
  document.getElementById("timer-plus").addEventListener("click", () => {
    if (!timer.running) return;
    timer.total += 30;
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    timerTick();
    saveTimerState();
  });
  document.getElementById("timer-minus").addEventListener("click", () => {
    if (!timer.running) return;
    timer.total = Math.max(timer.total - 30, 1);
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    timerTick();                       // timerTick calls timerComplete() if remaining <= 0
    if (timer.running) saveTimerState(); // only save if timer is still running
  });

  // Cancel (X button)
  document.getElementById("timer-cancel").addEventListener("click", () => {
    timer.running = false;
    timer.paused = false;
    clearInterval(timer.intervalId);
    stopAlarmSound();
    clearTimerState();
    resetTimerControls();
    timerOverlay.classList.add("hidden");
  });

  // Stop Alarm
  document.getElementById("timer-stop").addEventListener("click", () => {
    stopAlarmSound();
    resetTimerControls();
    timerOverlay.classList.add("hidden");
  });

  // Resume timer on page load
  try {
    const saved = JSON.parse(localStorage.getItem("pielab-bake-timer"));
    if (saved && saved.startedAt) resumeTimer(saved);
  } catch { /* ignore */ }

});
