/* ══════════════════════════════════════════════════════
   The Pie Lab — Calculator + Results + Settings
   Page: index.html
   ══════════════════════════════════════════════════════ */

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

  if (!type || !sizeKey || !numPizzas) return;

  const usePersonal = document.getElementById("settings-mode-toggle").checked;
  const recipe = PieLabJournal.getEffectiveRecipe(type, usePersonal);
  if (!recipe) return;

  // ── Calculate ──
  const dough = calculateDough(recipe, numPizzas, sizeKey);
  const sauce = calculateSauce(recipe, numPizzas, sizeKey);
  const toppings = calculateToppings(recipe, numPizzas, sizeKey);
  const ovenTempF = recipe.idealTemp.max;
  const bakingInfo = getBakingInfo(recipe, ovenTempF);

  // ── Render title ──
  const sizeLabel = recipe.sizes[sizeKey].label;
  const unitLabel = recipe.isSheet ? "pan" : "pizza";
  const countLabel = numPizzas === 1 ? `1 ${unitLabel}` : `${numPizzas} ${unitLabel}s`;
  document.getElementById("result-title").textContent =
    `${recipe.name} — ${countLabel}`;

  document.getElementById("result-badge").textContent = sizeLabel;

  // Dough table — 3 columns: Ingredient | Grams | % of Flour
  fillTable("dough-table",
    dough.map((d) => {
      const pctCell = d.ingredient === "Water"
        ? `${d.pct}% <button class="hydration-info-btn" type="button" aria-label="Hydration guide">\u24D8</button>`
        : `${d.pct}%`;
      return [d.ingredient, `${d.amount} g`, pctCell];
    })
  );

  // ── Hydration Guide Popover ──
  attachHydrationPopover(recipe);

  // Sauce table — all grams
  fillTable("sauce-table",
    sauce.map((s) => [s.ingredient, `${s.amount} g`])
  );

  // Toppings table — all grams
  fillTable("toppings-table",
    toppings.map((t) => [t.ingredient, `${t.amount} g`])
  );

  // Baking instructions
  const recTempF = bakingInfo.recommendedTemp;
  const recTempC = fToC(recTempF);

  document.getElementById("baking-instructions").innerHTML = `
    <p><strong>Preheat oven to:</strong> ${recTempF}°F / ${recTempC}°C (preheat for at least 45 minutes)</p>
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
    usePersonal,
    doughSnapshot: {
      hydration: recipe.hydration,
      saltPct: recipe.saltPct,
      oilPct: recipe.oilPct,
      sugarPct: recipe.sugarPct,
      yeastPct: recipe.yeastPct,
      doughBallWeight: recipe.sizes[sizeKey].doughWeight,
    },
    bakeTemp: recipe.idealTemp ? recipe.idealTemp.max : null,
  };
  try {
    localStorage.setItem("pielab-last-calc", JSON.stringify(lastCalcData));
  } catch { /* ignore storage errors */ }

  // Show results
  const resultsEl = document.getElementById("results");
  resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
});

// ── "Log This Bake" navigates to journal page ────────
document.getElementById("btn-log-bake").addEventListener("click", () => {
  window.location.href = "journal.html?prefill=1";
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

// ── Hydration Guide Popover ─────────────────────────
function attachHydrationPopover(recipe) {
  const btn = document.querySelector(".hydration-info-btn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    // Close any existing popover
    const existing = document.querySelector(".hydration-popover");
    if (existing) {
      existing.remove();
      return;
    }

    const guide = HYDRATION_GUIDE[recipe.flour];
    if (!guide) return;

    const popover = document.createElement("div");
    popover.className = "hydration-popover";

    let brandsHtml = guide.brandNotes
      .map((b) => `<li><strong>${b.brand}:</strong> ${b.note}</li>`)
      .join("");

    popover.innerHTML = `
      <div class="popover-header">
        <span class="popover-title">Hydration Guide — ${recipe.flour}</span>
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
}


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
