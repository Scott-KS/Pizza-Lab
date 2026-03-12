/* ══════════════════════════════════════════════════════
   The Pie Lab — Pizza Toolkit UI
   Page: learn.html
   ══════════════════════════════════════════════════════ */

// ── Toolkit Tab Navigation ───────────────────────────
// Tab click handlers and activateTab() are in knowledge.js,
// which manages all 8 tabs in the unified toolkit section.

(function initPizzaToolkit() {
  populateHydrationGuide();
  populateOvenGuide();
  populateTroubleshooting();
  populateDDTCalculator();
})();

// ── Hydration Guide ──────────────────────────────────

function populateHydrationGuide() {
  const panel = document.getElementById("tool-hydration");
  if (!panel) return;

  const styleOptions = Object.entries(HYDRATION_RANGES)
    .map(([key, h]) => `<option value="${key}">${h.name}</option>`)
    .join("");

  panel.innerHTML = `
    <div class="hydration-tool-controls">
      <div class="ferment-field">
        <label for="hydration-style">Pizza Style</label>
        <select id="hydration-style">
          <option value="" disabled selected>Select a style\u2026</option>
          ${styleOptions}
        </select>
      </div>
    </div>
    <div id="hydration-tool-content" class="hydration-tool-content hidden"></div>
  `;

  const select = panel.querySelector("#hydration-style");
  const content = panel.querySelector("#hydration-tool-content");

  select.addEventListener("change", () => {
    const range = HYDRATION_RANGES[select.value];
    if (!range) return;
    renderHydrationGuide(range, select.value, content);
    content.classList.remove("hidden");
  });
}

function renderHydrationGuide(range, styleKey, container) {
  const recipe = PIZZA_RECIPES[styleKey];
  const currentHydration = range.default;

  container.innerHTML = `
    <div class="hydration-range-header">
      <h3>${range.name} Hydration</h3>
      <span class="hydration-range-badge">${range.min}%\u2013${range.max}%</span>
    </div>

    <div class="hydration-slider-row">
      <span class="hydration-label-min">${range.min}%</span>
      <div class="hydration-slider-wrapper">
        <div class="hydration-sweet-spot" style="left: ${((range.sweet.low - range.min) / (range.max - range.min)) * 100}%; width: ${((range.sweet.high - range.sweet.low) / (range.max - range.min)) * 100}%"></div>
        <input type="range" class="hydration-slider" id="hydration-slider"
          min="${range.min}" max="${range.max}" value="${currentHydration}" step="1" />
      </div>
      <span class="hydration-label-max">${range.max}%</span>
    </div>

    <div class="hydration-value-display">
      <span class="hydration-current-value" id="hydration-value">${currentHydration}%</span>
      <span class="hydration-sweet-label">Sweet spot: ${range.sweet.low}\u2013${range.sweet.high}%</span>
    </div>

    <div class="hydration-effect" id="hydration-effect">
      <h4>What to Expect</h4>
      <p>${range.effects.mid}</p>
    </div>

    <div class="hydration-recipe-preview" id="hydration-preview"></div>

    <div class="hydration-notes">
      <h4>Notes</h4>
      <p>${range.notes}</p>
    </div>
  `;

  const slider = container.querySelector("#hydration-slider");
  const valueDisplay = container.querySelector("#hydration-value");
  const effectDisplay = container.querySelector("#hydration-effect");
  const previewDisplay = container.querySelector("#hydration-preview");

  function updateHydration() {
    const val = parseInt(slider.value);
    valueDisplay.textContent = `${val}%`;

    // Color coding
    const isSweet = val >= range.sweet.low && val <= range.sweet.high;
    const isLow = val < range.sweet.low;
    valueDisplay.className = "hydration-current-value " +
      (isSweet ? "hydration-sweet" : isLow ? "hydration-low" : "hydration-high");

    // Effect text
    let effectText;
    if (val < range.sweet.low) {
      effectText = range.effects.low;
    } else if (val > range.sweet.high) {
      effectText = range.effects.high;
    } else {
      effectText = range.effects.mid;
    }
    effectDisplay.innerHTML = `<h4>What to Expect</h4><p>${effectText}</p>`;

    // Recipe preview — recalculate with new hydration
    if (recipe) {
      const sizeKey = Object.keys(recipe.sizes)[1] || Object.keys(recipe.sizes)[0];
      const doughWeight = recipe.sizes[sizeKey].doughWeight;
      const hydration = val / 100;
      const totalPct = 1 + hydration + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct;
      const flour = doughWeight / totalPct;
      const water = flour * hydration;

      // Simpler calculation — just show flour and water for 1 pizza
      const defaultTotalPct = 1 + (range.default / 100) + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct;
      const defaultFlour = doughWeight / defaultTotalPct;
      const defaultWater = defaultFlour * (range.default / 100);

      const waterDiff = Math.round(water) - Math.round(defaultWater);
      const diffLabel = waterDiff > 0 ? `+${waterDiff}g` : waterDiff < 0 ? `${waterDiff}g` : "\u2014";

      previewDisplay.innerHTML = `
        <h4>Recipe Preview <span class="preview-note">(1 ${recipe.isSheet ? "pan" : "pizza"}, ${recipe.sizes[sizeKey].label})</span></h4>
        <div class="preview-grid">
          <div class="preview-item">
            <span class="preview-label">Flour</span>
            <span class="preview-amount">${Math.round(flour)}g</span>
          </div>
          <div class="preview-item ${waterDiff !== 0 ? "preview-changed" : ""}">
            <span class="preview-label">Water</span>
            <span class="preview-amount">${Math.round(water)}g</span>
            ${waterDiff !== 0 ? `<span class="preview-diff">${diffLabel} vs default</span>` : ""}
          </div>
        </div>
      `;
    }
  }

  slider.addEventListener("input", updateHydration);
  updateHydration();
}

// ── Oven Temperature Guide ───────────────────────────

function populateOvenGuide() {
  const panel = document.getElementById("tool-oven");
  if (!panel) return;

  // Style filter
  const styleOptions = Object.entries(PIZZA_RECIPES)
    .map(([key, r]) => `<option value="${key}">${r.name}</option>`)
    .join("");

  panel.innerHTML = `
    <div class="oven-controls">
      <div class="ferment-field">
        <label for="oven-style-filter">Filter by Pizza Style</label>
        <select id="oven-style-filter">
          <option value="all">All Styles</option>
          ${styleOptions}
        </select>
      </div>
    </div>
    <div class="oven-cards" id="oven-cards"></div>
  `;

  const styleFilter = panel.querySelector("#oven-style-filter");
  const cardsContainer = panel.querySelector("#oven-cards");

  function renderOvenCards(filterStyle) {
    cardsContainer.innerHTML = OVEN_SETUPS.map((setup) => {
      const isRecommended = filterStyle !== "all" && setup.bestStyles.includes(filterStyle);

      // Build bake time rows
      let bakeRows;
      if (filterStyle === "all") {
        // Show best styles only
        bakeRows = setup.bestStyles.map((key) => {
          const bt = setup.styleBakeTimes[key];
          const name = PIZZA_RECIPES[key] ? PIZZA_RECIPES[key].name : key;
          return `<tr><td>${name}</td><td>${bt.time}</td><td class="bake-note">${bt.note}</td></tr>`;
        }).join("");
      } else {
        // Show just the selected style
        const bt = setup.styleBakeTimes[filterStyle];
        const name = PIZZA_RECIPES[filterStyle] ? PIZZA_RECIPES[filterStyle].name : filterStyle;
        if (bt) {
          bakeRows = `<tr><td>${name}</td><td>${bt.time}</td><td class="bake-note">${bt.note}</td></tr>`;
        } else {
          bakeRows = `<tr><td colspan="3">No data for this style</td></tr>`;
        }
      }

      const tipsHtml = setup.tips.map((t) => `<li>${t}</li>`).join("");

      return `
        <div class="oven-card ${isRecommended ? "oven-recommended" : ""}">
          ${isRecommended ? '<span class="oven-rec-badge">\u2605 Recommended</span>' : ""}
          <div class="oven-card-header">
            <span class="oven-icon">${setup.icon}</span>
            <div>
              <h3>${setup.name}</h3>
              <span class="oven-temp-range">${setup.tempRange}</span>
            </div>
          </div>
          <div class="oven-card-body">
            <div class="oven-stat">
              <span class="oven-stat-label">Preheat</span>
              <span class="oven-stat-value">${setup.preheatTime}</span>
            </div>
            <div class="oven-stat">
              <span class="oven-stat-label">Heat Transfer</span>
              <span class="oven-stat-value">${setup.heatTransfer}</span>
            </div>
            <div class="oven-stat">
              <span class="oven-stat-label">Limitations</span>
              <span class="oven-stat-value">${setup.limitations}</span>
            </div>

            <h4>Bake Times</h4>
            <div class="oven-bake-table-wrapper">
              <table class="oven-bake-table">
                <thead><tr><th>Style</th><th>Time</th><th>Notes</th></tr></thead>
                <tbody>${bakeRows}</tbody>
              </table>
            </div>

            <h4>Tips</h4>
            <ul class="oven-tips">${tipsHtml}</ul>
          </div>
        </div>
      `;
    }).join("");
  }

  styleFilter.addEventListener("change", () => renderOvenCards(styleFilter.value));
  renderOvenCards("all");
}

// ── Dough Troubleshooting ────────────────────────────

function populateTroubleshooting() {
  const panel = document.getElementById("tool-troubleshoot");
  if (!panel) return;

  const symptomsHtml = Object.entries(TROUBLESHOOTING_TREE)
    .map(([key, problem]) => `
      <button class="symptom-btn" data-problem="${key}">
        <span class="symptom-icon">${problem.icon}</span>
        <span class="symptom-label">${problem.symptom}</span>
      </button>
    `)
    .join("");

  panel.innerHTML = `
    <div class="troubleshoot-intro">
      <p>What's going wrong with your dough? Select a symptom and we'll walk you to the fix.</p>
    </div>
    <div class="symptom-grid">${symptomsHtml}</div>
    <div id="troubleshoot-flow" class="troubleshoot-flow hidden"></div>
  `;

  const flowEl = panel.querySelector("#troubleshoot-flow");

  panel.querySelectorAll(".symptom-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Highlight selected
      panel.querySelectorAll(".symptom-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      const problem = TROUBLESHOOTING_TREE[btn.dataset.problem];
      if (problem) {
        renderDiagnosticStep(problem, problem.initial, flowEl);
        flowEl.classList.remove("hidden");
        flowEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

function renderDiagnosticStep(problem, stepId, container) {
  // Check if it's a question or a fix
  if (problem.questions[stepId]) {
    const q = problem.questions[stepId];
    const optionsHtml = q.options
      .map((opt) => `<button class="diag-option" data-next="${opt.next}">${opt.label}</button>`)
      .join("");

    container.innerHTML = `
      <div class="diag-card">
        <div class="diag-breadcrumb">
          <span class="diag-symptom">${problem.icon} ${problem.symptom}</span>
        </div>
        <h3 class="diag-question">${q.text}</h3>
        <div class="diag-options">${optionsHtml}</div>
        <button class="diag-restart" data-initial="${problem.initial}">\u2190 Start Over</button>
      </div>
    `;

    container.querySelectorAll(".diag-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        renderDiagnosticStep(problem, btn.dataset.next, container);
        container.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    container.querySelector(".diag-restart").addEventListener("click", () => {
      renderDiagnosticStep(problem, problem.initial, container);
    });

  } else if (problem.fixes[stepId]) {
    const fix = problem.fixes[stepId];
    const stepsHtml = fix.steps
      .map((s, i) => `<li><span class="fix-num">${i + 1}</span> ${s}</li>`)
      .join("");

    container.innerHTML = `
      <div class="diag-card diag-fix">
        <div class="diag-breadcrumb">
          <span class="diag-symptom">${problem.icon} ${problem.symptom}</span>
          <span class="diag-arrow">\u2192</span>
          <span class="diag-fix-badge">Fix Found</span>
        </div>
        <h3 class="fix-title">\u2705 ${fix.title}</h3>
        <ol class="fix-steps">${stepsHtml}</ol>
        <button class="diag-restart" data-initial="${problem.initial}">\u2190 Try Again</button>
      </div>
    `;

    container.querySelector(".diag-restart").addEventListener("click", () => {
      renderDiagnosticStep(problem, problem.initial, container);
    });
  }
}

// ── DDT Water Temperature Calculator ─────────────────

function populateDDTCalculator() {
  const panel = document.getElementById("tool-ddt");
  if (!panel) return;
  if (typeof DDT_PRESETS === "undefined") return;

  const presetOptions = Object.entries(DDT_PRESETS)
    .map(([key, p]) => `<option value="${key}">${p.label}</option>`)
    .join("");

  panel.innerHTML = `
    <p style="font-size:0.92rem;color:var(--clr-text-light);margin-bottom:1rem;line-height:1.5">
      Calculate the ideal water temperature to hit your Desired Dough Temperature (DDT).
      Consistent DDT leads to predictable fermentation.
    </p>
    <div class="ddt-tool-controls">
      <div class="ddt-field">
        <label for="ddt-preset">Style Preset</label>
        <select id="ddt-preset">${presetOptions}</select>
      </div>
      <div class="ddt-field">
        <label for="ddt-target">DDT Target (°F)</label>
        <input type="number" id="ddt-target" value="76" min="65" max="90" step="1">
        <div class="field-hint">Most doughs: 75–80°F</div>
      </div>
      <div class="ddt-field">
        <label for="ddt-room">Room Temp (°F)</label>
        <input type="number" id="ddt-room" value="72" min="50" max="100" step="1">
      </div>
      <div class="ddt-field">
        <label for="ddt-flour">Flour Temp (°F)</label>
        <input type="number" id="ddt-flour" value="70" min="40" max="100" step="1">
      </div>
      <div class="ddt-field">
        <label for="ddt-friction">Friction Factor (°F)</label>
        <input type="number" id="ddt-friction" value="28" min="0" max="60" step="1">
        <div class="field-hint">Home mixer ≈ 25–30 · Commercial ≈ 35–45</div>
      </div>
    </div>
    <div class="ddt-actions">
      <button class="btn-ddt-calc" id="btn-ddt-calc" type="button">Calculate Water Temp</button>
    </div>
    <div id="ddt-result-area" class="hidden"></div>
  `;

  // Wire preset selector
  const presetSelect = panel.querySelector("#ddt-preset");
  const ddtTarget = panel.querySelector("#ddt-target");
  const ddtFriction = panel.querySelector("#ddt-friction");

  presetSelect.addEventListener("change", () => {
    const p = DDT_PRESETS[presetSelect.value];
    if (p) {
      ddtTarget.value = p.ddt;
      ddtFriction.value = p.friction;
    }
  });

  // Wire calculate button
  panel.querySelector("#btn-ddt-calc").addEventListener("click", () => {
    if (typeof PieLabPremium !== "undefined") {
      PieLabPremium.gate(() => computeDDT());
    } else {
      computeDDT();
    }
  });

  function computeDDT() {
    const ddt = parseFloat(ddtTarget.value) || 76;
    const room = parseFloat(panel.querySelector("#ddt-room").value) || 72;
    const flour = parseFloat(panel.querySelector("#ddt-flour").value) || 70;
    const friction = parseFloat(ddtFriction.value) || 28;

    const waterTemp = (ddt * 3) - room - flour - friction;
    const resultArea = panel.querySelector("#ddt-result-area");

    let warning = "";
    if (waterTemp < 40) {
      warning = `<p style="color:var(--clr-primary);font-size:0.85rem;margin-top:0.5rem">⚠️ Water temp is very cold. Consider using ice water and adjusting your target DDT.</p>`;
    } else if (waterTemp > 110) {
      warning = `<p style="color:var(--clr-primary);font-size:0.85rem;margin-top:0.5rem">⚠️ Water temp is very hot. This could kill yeast. Lower your DDT target or cool your environment.</p>`;
    }

    resultArea.className = "ddt-result";
    resultArea.innerHTML = `
      <div class="ddt-result-temp">${Math.round(waterTemp)}°F</div>
      <div class="ddt-result-label">Required Water Temperature</div>
      <div class="ddt-result-formula">
        (${ddt}°F × 3) − ${room}°F room − ${flour}°F flour − ${friction}°F friction = ${Math.round(waterTemp)}°F
      </div>
      ${warning}
    `;
  }
}
