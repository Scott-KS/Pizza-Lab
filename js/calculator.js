/* ══════════════════════════════════════════════════════
   The Pie Lab — Calculator + Results + Settings
   Page: index.html
   ══════════════════════════════════════════════════════ */

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
}

// ── Module-scoped state for delegated popover ────────
let lastRecipe = null;

// ── Flour Substitution Data ──────────────────────────
const FLOUR_ABSORPTION = {
  "Tipo 00 Flour": 0.55,
  "High-Gluten Bread Flour": 0.65,
  "All-Purpose Flour": 0.58,
  "Bread Flour": 0.62,
  "Bread Flour (or Bread + Semolina blend)": 0.62,
  "Whole Wheat Flour": 0.70,
  "Semolina Flour": 0.50,
};

let lastCalcContext = null;

// ── Dynamic Size Selector ────────────────────────────
const typeSelect = document.getElementById("pizza-type");
const sizeSelect = document.getElementById("pizza-size");

typeSelect.addEventListener("change", () => {
  const recipe = PIZZA_RECIPES[typeSelect.value];
  if (!recipe) return;

  sizeSelect.innerHTML = "";
  for (const [key, info] of Object.entries(recipe.sizes)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = info.label;
    sizeSelect.appendChild(opt);
  }

  // Default to middle option for round (12″), or half for sheet
  const keys = Object.keys(recipe.sizes);
  if (recipe.isSheet) {
    sizeSelect.value = keys.includes("half") ? "half" : keys[0];
  } else {
    sizeSelect.value = keys.includes("12") ? "12" : keys[0];
  }
});

// ── Form Submit ──────────────────────────────────────
document.getElementById("pizza-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const type = document.getElementById("pizza-type").value;
  const sizeKey = sizeSelect.value;
  const numPizzas = parseInt(document.getElementById("num-pizzas").value, 10);
  const ovenType = ovenSelect ? ovenSelect.value : "stone";

  if (!type || !sizeKey || !numPizzas) return;

  const usePersonal = document.getElementById("settings-mode-toggle").checked;
  const recipe = PieLabJournal.getEffectiveRecipe(type, usePersonal);
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

  // ── Calculate ──
  lastRecipe = adjustedRecipe;
  const dough    = calculateDough(adjustedRecipe, numPizzas, sizeKey);
  const sauce    = calculateSauce(adjustedRecipe, numPizzas, sizeKey);
  const toppings = calculateToppings(adjustedRecipe, numPizzas, sizeKey);
  const ovenTempF  = adjustedRecipe.idealTemp.max;
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
      `Hydration ${elevAdj.hydrationDelta > 0 ? "+" : ""}${(elevAdj.hydrationDelta * 100).toFixed(0)}% for ${profile.elevation.toLocaleString()} ft elevation`
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
      `Yeast \u2212${reduction}% for ${profile.elevation.toLocaleString()} ft elevation`
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

  // Dough table — 3 columns: Ingredient | Grams | % of Flour
  renderDoughTable(dough);

  // Sauce table — all grams
  fillTable("sauce-table",
    sauce.map((s) => [s.ingredient, `${s.amount} g`])
  );

  // Toppings table — all grams
  fillTable("toppings-table",
    toppings.map((t) => [t.ingredient, `${t.amount} g`])
  );

  // Baking instructions — dynamic preheat from oven type
  const recTempF = bakingInfo.recommendedTemp;
  const recTempC = fToC(recTempF);
  const preheatMinutes = (typeof OVEN_PREHEAT_MINUTES !== "undefined" && OVEN_PREHEAT_MINUTES[ovenType])
    ? OVEN_PREHEAT_MINUTES[ovenType]
    : 45;

  document.getElementById("baking-instructions").innerHTML = `
    <p><strong>Preheat oven to:</strong> ${recTempF}°F / ${recTempC}°C (preheat for at least ${preheatMinutes} minutes)</p>
    <p><strong>Bake time:</strong> ${bakingInfo.bakeTime}</p>
  `;

  // Pro tips
  const tipsList = document.getElementById("pro-tips");
  tipsList.innerHTML = "";
  recipe.tips.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    tipsList.appendChild(li);
  });

  // ── Contextual "Learn More" link (cross-page) ──
  const learnMoreEl = document.getElementById("results-learn-more");
  if (typeof STYLE_LIBRARY !== "undefined" && STYLE_LIBRARY[type]) {
    const styleName = STYLE_LIBRARY[type].name;
    learnMoreEl.innerHTML = `<a href="learn.html?style=${type}#styles" class="learn-more-link">Learn more about ${styleName} \u2192</a>`;
  } else {
    learnMoreEl.innerHTML = "";
  }

  // ── Store last calculation in localStorage (for journal pre-fill) ──
  const lastCalcData = {
    styleKey: type,
    styleName: recipe.name,
    sizeKey,
    numPizzas,
    ovenType,
    usePersonal,
    doughSnapshot: {
      hydration: adjustedRecipe.hydration,
      saltPct: adjustedRecipe.saltPct,
      oilPct: adjustedRecipe.oilPct,
      sugarPct: adjustedRecipe.sugarPct,
      yeastPct: adjustedRecipe.yeastPct,
      doughBallWeight: adjustedRecipe.sizes[sizeKey].doughWeight,
    },
    bakeTemp: recipe.idealTemp ? recipe.idealTemp.max : null,
  };
  try {
    localStorage.setItem("pielab-last-calc", JSON.stringify(lastCalcData));
  } catch { /* ignore storage errors */ }

  // ── Flour substitution row ──
  lastCalcContext = { adjustedRecipe, numPizzas, sizeKey };

  const flourSubRow = document.getElementById("flour-sub-row");
  const flourSubSelect = document.getElementById("flour-sub-select");
  const flourSubNote = document.getElementById("flour-sub-note");

  if (adjustedRecipe.flour && adjustedRecipe.flour !== "All-Purpose Flour" &&
      FLOUR_ABSORPTION[adjustedRecipe.flour] != null) {
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
    renderDoughTable(dough);
    noteEl.className = "flour-sub-note hidden";
    noteEl.innerHTML = "";
    return;
  }

  const recipeFlour = adjustedRecipe.flour;
  const origAbsorption = FLOUR_ABSORPTION[recipeFlour];
  const subAbsorption = FLOUR_ABSORPTION[selectedFlour];

  if (origAbsorption == null || subAbsorption == null) return;

  // Higher absorption flour needs more water → positive delta when subbing to lower absorption
  const hydrationDelta = origAbsorption - subAbsorption;
  const absDelta = Math.abs(hydrationDelta);

  // Create substituted recipe with adjusted hydration
  const subRecipe = { ...adjustedRecipe };
  subRecipe.hydration = Math.min(1.00, Math.max(0.40,
    adjustedRecipe.hydration + hydrationDelta));

  // Recalculate and re-render dough table only
  const dough = calculateDough(subRecipe, numPizzas, sizeKey);
  renderDoughTable(dough);

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
  fillTable("dough-table",
    dough.map((d) => {
      const pctCell = d.ingredient === "Water"
        ? `${d.pct}% <button class="hydration-info-btn" type="button" aria-label="Hydration guide">\u24D8</button>`
        : `${d.pct}%`;
      return [d.ingredient, `${d.amount} g`, pctCell];
    })
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
  const labelPersonal = document.getElementById("toggle-label-personal");
  const editor = document.getElementById("personal-settings-editor");
  const styleSelect = document.getElementById("pizza-type");
  const personalStyleLabel = document.getElementById("personal-style-label");

  const fields = {
    hydration: document.getElementById("ps-hydration"),
    saltPct: document.getElementById("ps-salt"),
    oilPct: document.getElementById("ps-oil"),
    sugarPct: document.getElementById("ps-sugar"),
    yeastPct: document.getElementById("ps-yeast"),
    doughBallWeight: document.getElementById("ps-dough-weight"),
  };

  function updateToggleLabels() {
    const isPersonal = toggle.checked;
    labelRec.classList.toggle("active", !isPersonal);
    labelPersonal.classList.toggle("active", isPersonal);
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

    personalStyleLabel.textContent = `\u2014 ${recipe.name}`;

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

  document.getElementById("btn-reset-personal").addEventListener("click", () => {
    const styleKey = styleSelect.value;
    if (styleKey) {
      PieLabJournal.deletePersonalSettings(styleKey);
      showEditor();
    }
  });

  // Init labels
  updateToggleLabels();
})();
