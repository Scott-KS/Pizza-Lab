// ── Carousel ────────────────────────────────────────
(function() {
  const slides = document.querySelectorAll('.carousel-slide');
  const dots   = document.querySelectorAll('.dot');
  let current  = 0;
  let timer;
  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }
  function startAuto() {
    timer = setInterval(next, 5000);
  }
  function resetAuto() {
    clearInterval(timer);
    startAuto();
  }
  document.querySelector('.carousel-arrow.next').addEventListener('click', () => { next(); resetAuto(); });
  document.querySelector('.carousel-arrow.prev').addEventListener('click', () => { prev(); resetAuto(); });
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      goTo(parseInt(dot.dataset.index));
      resetAuto();
    });
  });
  startAuto();
})();

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

  // ── Contextual "Learn More" link ──
  const learnMoreEl = document.getElementById("results-learn-more");
  if (STYLE_LIBRARY[type]) {
    const styleName = STYLE_LIBRARY[type].name;
    learnMoreEl.innerHTML = `<a href="#styles" class="learn-more-link" data-style-key="${type}">Learn more about ${styleName} \u2192</a>`;
    learnMoreEl.querySelector(".learn-more-link").addEventListener("click", (ev) => {
      ev.preventDefault();
      activateTab("styles");
      setTimeout(() => {
        const accordion = document.querySelector(`.accordion-item[data-style-key="${type}"]`);
        if (accordion) {
          openAccordion(accordion);
          accordion.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    });
  } else {
    learnMoreEl.innerHTML = "";
  }

  // Store last calculation for journal pre-fill
  window._lastCalc = {
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

  // Show results
  const resultsEl = document.getElementById("results");
  resultsEl.classList.remove("hidden");
  resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
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
// ── Knowledge Hub ────────────────────────────────────
// ══════════════════════════════════════════════════════

// ── Tab Navigation ───────────────────────────────────
function activateTab(tabId) {
  document.querySelectorAll(".hub-tab").forEach((t) => {
    const isTarget = t.dataset.tab === tabId;
    t.classList.toggle("active", isTarget);
    t.setAttribute("aria-selected", isTarget);
  });
  document.querySelectorAll(".hub-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `panel-${tabId}`);
  });
  history.replaceState(null, "", `#${tabId}`);
}

(function initKnowledgeHub() {
  // Tab click handlers
  document.querySelectorAll(".hub-tab").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  // Hash-based routing on load
  const hash = location.hash.replace("#", "");
  if (["styles", "toppings", "flour", "cheese"].includes(hash)) {
    activateTab(hash);
  }
  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (["styles", "toppings", "flour", "cheese"].includes(h)) {
      activateTab(h);
    }
  });

  // Populate all panels
  populateStyleLibrary();
  populateToppingCombos();
  populateFlourGuide();
  populateCheeseSauceGuide();
})();

// ── Accordion Factory ────────────────────────────────
function createAccordion(parentEl, items, renderContent) {
  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "accordion-item";
    if (item.key) wrapper.dataset.styleKey = item.key;

    const header = document.createElement("button");
    header.className = "accordion-header";
    header.type = "button";
    header.innerHTML = `<span class="accordion-title">${item.title}</span><span class="accordion-arrow">\u25BC</span>`;

    const body = document.createElement("div");
    body.className = "accordion-body";

    const inner = document.createElement("div");
    inner.className = "accordion-inner";
    inner.innerHTML = renderContent(item.data);
    body.appendChild(inner);

    header.addEventListener("click", () => {
      const isOpen = wrapper.classList.contains("open");
      // Close all siblings
      parentEl.querySelectorAll(".accordion-item.open").forEach((a) => {
        a.classList.remove("open");
        a.querySelector(".accordion-body").style.maxHeight = null;
      });
      if (!isOpen) {
        openAccordion(wrapper);
      }
    });

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    parentEl.appendChild(wrapper);
  });
}

function openAccordion(wrapper) {
  // Close siblings first
  const parent = wrapper.parentElement;
  if (parent) {
    parent.querySelectorAll(".accordion-item.open").forEach((a) => {
      a.classList.remove("open");
      a.querySelector(".accordion-body").style.maxHeight = null;
    });
  }
  wrapper.classList.add("open");
  const body = wrapper.querySelector(".accordion-body");
  body.style.maxHeight = body.scrollHeight + "px";
}

// ── Style Library ────────────────────────────────────
function populateStyleLibrary() {
  const panel = document.getElementById("panel-styles");
  const items = Object.entries(STYLE_LIBRARY).map(([key, style]) => ({
    key,
    title: style.name,
    data: style,
  }));

  createAccordion(panel, items, (style) => {
    const factsHtml = style.keyFacts
      .map((f) => `<span class="key-fact"><strong>${f.label}:</strong> ${f.value}</span>`)
      .join("");

    return `
      <span class="origin-badge">${style.origin}</span>
      <div class="style-prose">
        <h4>The Story</h4>
        <p>${style.story}</p>
        <h4>What Makes It Authentic</h4>
        <p>${style.authenticity}</p>
        <h4>The Debates</h4>
        <p>${style.debates}</p>
      </div>
      <div class="key-facts">${factsHtml}</div>
    `;
  });
}

// ── Topping Combinations ─────────────────────────────
function populateToppingCombos() {
  const panel = document.getElementById("panel-toppings");
  const items = Object.entries(TOPPING_COMBOS).map(([key, data]) => ({
    key,
    title: data.name,
    data: data,
  }));

  createAccordion(panel, items, (data) => {
    const combosHtml = data.combos
      .map((combo) => {
        const tierClass = combo.tier.toLowerCase();
        return `
          <div class="combo-card">
            <div class="combo-header">
              <span class="tier-badge tier-${tierClass}">${combo.tier}</span>
              <strong class="combo-name">${combo.name}</strong>
            </div>
            <ul class="combo-ingredients">
              ${combo.ingredients.map((i) => `<li>${i}</li>`).join("")}
            </ul>
            <p class="combo-why">${combo.why}</p>
          </div>
        `;
      })
      .join("");

    return `<div class="combos-grid">${combosHtml}</div>`;
  });
}

// ── Flour Guide ──────────────────────────────────────
function populateFlourGuide() {
  const panel = document.getElementById("panel-flour");
  const items = Object.entries(FLOUR_GUIDE).map(([key, flour]) => ({
    key,
    title: flour.name,
    data: flour,
  }));

  createAccordion(panel, items, (flour) => {
    const usesHtml = flour.bestUses
      .map((u) => `<span class="use-tag">${u}</span>`)
      .join("");

    const linksHtml = flour.buyLinks
      .map(
        (link) =>
          `<a href="${link.url}" class="buy-link" target="_blank" rel="noopener">
            <strong>${link.brand}</strong>
            <span class="buy-note">${link.note}</span>
            <span class="buy-arrow">\u2192</span>
          </a>`
      )
      .join("");

    return `
      <span class="protein-badge">${flour.proteinContent} protein</span>
      <p class="flour-desc">${flour.description}</p>
      <h4>Effect on Dough</h4>
      <p class="flour-effect">${flour.doughEffect}</p>
      <div class="flour-uses">
        <h4>Best For</h4>
        <div class="use-tags">${usesHtml}</div>
      </div>
      <div class="flour-buy">
        <h4>Where to Buy</h4>
        ${linksHtml}
      </div>
    `;
  });
}

// ── Cheese & Sauce Guide ─────────────────────────────
function populateCheeseSauceGuide() {
  const panel = document.getElementById("panel-cheese");

  // Cheese accordion
  const cheeseHeader = document.createElement("h3");
  cheeseHeader.className = "panel-subheader";
  cheeseHeader.textContent = "Cheeses";
  panel.appendChild(cheeseHeader);

  const cheeseContainer = document.createElement("div");
  cheeseContainer.className = "cheese-accordions";
  panel.appendChild(cheeseContainer);

  createAccordion(
    cheeseContainer,
    CHEESE_SAUCE_GUIDE.cheeses.map((c) => ({
      title: c.name,
      data: c,
    })),
    (cheese) => {
      const stylesHtml = cheese.bestStyles
        .map((s) => {
          const recipe = PIZZA_RECIPES[s];
          return recipe ? `<span class="use-tag">${recipe.name}</span>` : "";
        })
        .join("");

      return `
        <p>${cheese.description}</p>
        <h4>Tips</h4>
        <p class="cheese-tips">${cheese.tips}</p>
        <div class="cheese-styles">
          <h4>Best For</h4>
          <div class="use-tags">${stylesHtml}</div>
        </div>
      `;
    }
  );

  // Sauce accordion
  const sauceHeader = document.createElement("h3");
  sauceHeader.className = "panel-subheader";
  sauceHeader.textContent = "Sauces";
  panel.appendChild(sauceHeader);

  const sauceContainer = document.createElement("div");
  sauceContainer.className = "sauce-accordions";
  panel.appendChild(sauceContainer);

  createAccordion(
    sauceContainer,
    CHEESE_SAUCE_GUIDE.sauces.map((s) => ({
      title: s.name,
      data: s,
    })),
    (sauce) => {
      const stylesHtml = sauce.bestStyles
        .map((s) => {
          const recipe = PIZZA_RECIPES[s];
          return recipe ? `<span class="use-tag">${recipe.name}</span>` : "";
        })
        .join("");

      return `
        <p>${sauce.description}</p>
        <h4>Tips</h4>
        <p class="sauce-tips">${sauce.tips}</p>
        <div class="sauce-styles">
          <h4>Best For</h4>
          <div class="use-tags">${stylesHtml}</div>
        </div>
      `;
    }
  );

  // Pairing Matrix
  const matrixHeader = document.createElement("h3");
  matrixHeader.className = "panel-subheader";
  matrixHeader.textContent = "Pairing Matrix";
  panel.appendChild(matrixHeader);

  const matrixWrapper = document.createElement("div");
  matrixWrapper.className = "matrix-wrapper";
  matrixWrapper.innerHTML = buildPairingMatrixHTML();
  panel.appendChild(matrixWrapper);
}

// ══════════════════════════════════════════════════════
// ── Pizza Toolkit ───────────────────────────────────
// ══════════════════════════════════════════════════════

function activateToolTab(toolId) {
  document.querySelectorAll(".toolkit-tab").forEach((t) => {
    const isTarget = t.dataset.tool === toolId;
    t.classList.toggle("active", isTarget);
    t.setAttribute("aria-selected", isTarget);
  });
  document.querySelectorAll(".toolkit-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tool-${toolId}`);
  });
}

(function initPizzaToolkit() {
  document.querySelectorAll(".toolkit-tab").forEach((tab) => {
    tab.addEventListener("click", () => activateToolTab(tab.dataset.tool));
  });

  populateFermentationTimer();
  populateHydrationGuide();
  populateOvenGuide();
  populateTroubleshooting();
})();

// ── 1. Fermentation Timer ───────────────────────────

function populateFermentationTimer() {
  const panel = document.getElementById("tool-ferment");

  panel.innerHTML = `
    <div class="ferment-controls">
      <div class="ferment-field">
        <label for="ferment-style">Pizza Style</label>
        <select id="ferment-style">
          <option value="" disabled selected>Select a style…</option>
          ${Object.entries(FERMENTATION_SCHEDULES)
            .map(([key, s]) => `<option value="${key}">${s.name}</option>`)
            .join("")}
        </select>
      </div>
      <div class="ferment-field">
        <label for="ferment-start">When are you starting?</label>
        <input type="datetime-local" id="ferment-start" />
      </div>
      <button type="button" class="btn-start-timer" id="btn-start-timer" disabled>Start Timer</button>
    </div>
    <div id="ferment-timeline" class="ferment-timeline hidden"></div>
  `;

  const styleSelect = panel.querySelector("#ferment-style");
  const startInput = panel.querySelector("#ferment-start");
  const startBtn = panel.querySelector("#btn-start-timer");
  const timelineEl = panel.querySelector("#ferment-timeline");

  // Default to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  startInput.value = now.toISOString().slice(0, 16);

  function checkReady() {
    startBtn.disabled = !styleSelect.value || !startInput.value;
  }
  styleSelect.addEventListener("change", checkReady);
  startInput.addEventListener("input", checkReady);

  startBtn.addEventListener("click", () => {
    const schedule = FERMENTATION_SCHEDULES[styleSelect.value];
    if (!schedule) return;

    const startTime = new Date(startInput.value);
    if (isNaN(startTime)) return;

    renderTimeline(schedule, startTime, timelineEl);
    timelineEl.classList.remove("hidden");

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  });
}

function renderTimeline(schedule, startTime, container) {
  const steps = schedule.steps;
  const now = new Date();

  let html = `
    <div class="timeline-header">
      <h3>${schedule.name} — ${schedule.method}</h3>
      <span class="timeline-total">Total: ${schedule.totalTime}</span>
    </div>
    <div class="timeline-steps">
  `;

  steps.forEach((step, i) => {
    const stepTime = new Date(startTime.getTime() + step.offsetMin * 60000);
    const isPast = now >= stepTime;
    const isNext = !isPast && (i === 0 || now >= new Date(startTime.getTime() + steps[Math.max(0, i - 1)].offsetMin * 60000));
    const statusClass = isPast ? "step-done" : isNext ? "step-next" : "step-upcoming";

    html += `
      <div class="timeline-step ${statusClass}">
        <div class="step-marker">
          <span class="step-dot">${isPast ? "✓" : (i + 1)}</span>
          ${i < steps.length - 1 ? '<span class="step-line"></span>' : ""}
        </div>
        <div class="step-content">
          <div class="step-time">${formatTime(stepTime)}</div>
          <div class="step-label">${step.label}</div>
          <div class="step-desc">${step.desc}</div>
          ${isNext ? `<div class="step-countdown" data-target="${stepTime.toISOString()}"></div>` : ""}
        </div>
      </div>
    `;
  });

  html += "</div>";
  container.innerHTML = html;

  // Start countdown for "next" step
  const countdownEl = container.querySelector(".step-countdown");
  if (countdownEl) {
    updateCountdown(countdownEl);
    const interval = setInterval(() => {
      if (!document.body.contains(countdownEl)) {
        clearInterval(interval);
        return;
      }
      updateCountdown(countdownEl);
    }, 1000);
  }
}

function updateCountdown(el) {
  const target = new Date(el.dataset.target);
  const now = new Date();
  const diff = target - now;

  if (diff <= 0) {
    el.textContent = "⏰ Now!";
    el.classList.add("countdown-now");
    // Send notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("The Pie Lab — Time's Up!", {
        body: `It's time for the next step in your pizza dough!`,
        icon: "Images/Neapolitan.jpg",
      });
    }
    return;
  }

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (hours > 0) {
    el.textContent = `⏳ ${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    el.textContent = `⏳ ${minutes}m ${seconds}s`;
  } else {
    el.textContent = `⏳ ${seconds}s`;
  }
}

function formatTime(date) {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── 2. Hydration Guide ──────────────────────────────

function populateHydrationGuide() {
  const panel = document.getElementById("tool-hydration");

  const styleOptions = Object.entries(HYDRATION_RANGES)
    .map(([key, h]) => `<option value="${key}">${h.name}</option>`)
    .join("");

  panel.innerHTML = `
    <div class="hydration-tool-controls">
      <div class="ferment-field">
        <label for="hydration-style">Pizza Style</label>
        <select id="hydration-style">
          <option value="" disabled selected>Select a style…</option>
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
      <span class="hydration-range-badge">${range.min}%–${range.max}%</span>
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
      <span class="hydration-sweet-label">Sweet spot: ${range.sweet.low}–${range.sweet.high}%</span>
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
      const diff = Math.round(water) - Math.round(flour * (range.default / 100) / (1 + (range.default / 100) + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct) * (1 + (range.default / 100) + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct));

      // Simpler calculation — just show flour and water for 1 pizza
      const defaultTotalPct = 1 + (range.default / 100) + recipe.saltPct + recipe.oilPct + recipe.sugarPct + recipe.yeastPct;
      const defaultFlour = doughWeight / defaultTotalPct;
      const defaultWater = defaultFlour * (range.default / 100);

      const waterDiff = Math.round(water) - Math.round(defaultWater);
      const diffLabel = waterDiff > 0 ? `+${waterDiff}g` : waterDiff < 0 ? `${waterDiff}g` : "—";

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

// ── 3. Oven Temperature Guide ───────────────────────

function populateOvenGuide() {
  const panel = document.getElementById("tool-oven");

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
          ${isRecommended ? '<span class="oven-rec-badge">★ Recommended</span>' : ""}
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

// ── 4. Dough Troubleshooting ────────────────────────

function populateTroubleshooting() {
  const panel = document.getElementById("tool-troubleshoot");

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
        <button class="diag-restart" data-initial="${problem.initial}">← Start Over</button>
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
          <span class="diag-arrow">→</span>
          <span class="diag-fix-badge">Fix Found</span>
        </div>
        <h3 class="fix-title">✅ ${fix.title}</h3>
        <ol class="fix-steps">${stepsHtml}</ol>
        <button class="diag-restart" data-initial="${problem.initial}">← Try Again</button>
      </div>
    `;

    container.querySelector(".diag-restart").addEventListener("click", () => {
      renderDiagnosticStep(problem, problem.initial, container);
    });
  }
}

// ══════════════════════════════════════════════════════
// ── Knowledge Hub (original code below) ─────────────
// ══════════════════════════════════════════════════════

function buildPairingMatrixHTML() {
  const cheeses = CHEESE_SAUCE_GUIDE.cheeses;
  const sauces = CHEESE_SAUCE_GUIDE.sauces;
  const pairings = CHEESE_SAUCE_GUIDE.pairings;

  let headerCells = sauces
    .map((s) => `<th>${s.name}</th>`)
    .join("");

  let rows = cheeses
    .map((cheese) => {
      const cells = sauces
        .map((sauce) => {
          const pairing = pairings[cheese.id] && pairings[cheese.id][sauce.id];
          if (!pairing) return `<td class="rating-none">—</td>`;
          const ratingClass = `rating-${pairing.rating}`;
          const label =
            pairing.rating === "excellent" ? "\u2605" :
            pairing.rating === "good" ? "\u25CB" : "\u2716";
          return `<td class="${ratingClass}" title="${pairing.note}">${label}<span class="matrix-note">${pairing.note}</span></td>`;
        })
        .join("");
      return `<tr><th>${cheese.name}</th>${cells}</tr>`;
    })
    .join("");

  return `
    <table class="pairing-matrix">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="matrix-legend">
      <span class="legend-item"><span class="rating-excellent">\u2605</span> Excellent</span>
      <span class="legend-item"><span class="rating-good">\u25CB</span> Good</span>
      <span class="legend-item"><span class="rating-avoid">\u2716</span> Avoid</span>
    </div>
  `;
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

// ══════════════════════════════════════════════════════
// ── Pizza Journal UI ────────────────────────────────
// ══════════════════════════════════════════════════════
(() => {
  const formWrapper = document.getElementById("journal-form-wrapper");
  const form = document.getElementById("journal-form");
  const entriesContainer = document.getElementById("journal-entries");
  const emptyState = document.getElementById("journal-empty");
  const btnNewEntry = document.getElementById("btn-new-entry");
  const btnCancel = document.getElementById("btn-cancel-entry");
  const btnLogBake = document.getElementById("btn-log-bake");
  const filterSelect = document.getElementById("journal-style-filter");
  const btnCompare = document.getElementById("btn-compare");
  const comparisonEl = document.getElementById("journal-comparison");
  const modalOverlay = document.getElementById("journal-detail-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

  // Star rating state
  let currentRating = 0;
  const starContainer = document.getElementById("j-star-rating");
  const stars = starContainer.querySelectorAll(".star");

  // Photo state
  let currentPhotoData = null;
  const photoInput = document.getElementById("j-photo-input");
  const photoPreview = document.getElementById("j-photo-preview");
  const photoImg = document.getElementById("j-photo-img");
  const photoPlaceholder = document.getElementById("j-photo-placeholder");
  const photoRemove = document.getElementById("j-photo-remove");

  // Dough snapshot state
  let currentSnapshot = null;
  const snapshotEl = document.getElementById("j-dough-snapshot");

  // Populate style dropdowns
  function populateStyleDropdowns() {
    const jStyle = document.getElementById("j-style");
    jStyle.innerHTML = '<option value="" disabled selected>Select a style\u2026</option>';
    for (const [key, recipe] of Object.entries(PIZZA_RECIPES)) {
      jStyle.innerHTML += `<option value="${key}">${recipe.name}</option>`;
    }

    filterSelect.innerHTML = '<option value="all">All Styles</option>';
    for (const [key, recipe] of Object.entries(PIZZA_RECIPES)) {
      filterSelect.innerHTML += `<option value="${key}">${recipe.name}</option>`;
    }
  }

  // Star rating
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      currentRating = parseInt(star.dataset.value);
      updateStars();
    });
  });

  function updateStars() {
    stars.forEach((s) => {
      const val = parseInt(s.dataset.value);
      s.classList.toggle("active", val <= currentRating);
    });
  }

  function renderStars(rating) {
    return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  }

  // Photo handling
  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      currentPhotoData = await PieLabJournal.compressPhoto(file);
      photoImg.src = currentPhotoData;
      photoPreview.classList.remove("hidden");
      photoPlaceholder.classList.add("hidden");
    } catch {
      alert("Could not process image. Please try another photo.");
    }
  });

  photoRemove.addEventListener("click", () => {
    currentPhotoData = null;
    photoInput.value = "";
    photoPreview.classList.add("hidden");
    photoPlaceholder.classList.remove("hidden");
  });

  // Show/hide form
  function showForm(prefill) {
    formWrapper.classList.remove("hidden");
    btnNewEntry.classList.add("hidden");

    // Set date to today
    document.getElementById("j-date").value = new Date().toISOString().split("T")[0];

    // Reset
    currentRating = 0;
    updateStars();
    currentPhotoData = null;
    photoInput.value = "";
    photoPreview.classList.add("hidden");
    photoPlaceholder.classList.remove("hidden");
    document.getElementById("j-notes").value = "";
    document.getElementById("j-bake-temp").value = "";
    document.getElementById("j-bake-time").value = "";
    document.getElementById("j-oven-type").value = "home";

    if (prefill && window._lastCalc) {
      const calc = window._lastCalc;
      document.getElementById("j-style").value = calc.styleKey;
      if (calc.bakeTemp) {
        document.getElementById("j-bake-temp").value = calc.bakeTemp;
      }
      currentSnapshot = calc.doughSnapshot;
      renderSnapshot(calc.doughSnapshot);
    } else {
      currentSnapshot = null;
      snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
    }

    formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideForm() {
    formWrapper.classList.add("hidden");
    btnNewEntry.classList.remove("hidden");
  }

  function renderSnapshot(snap) {
    if (!snap) return;
    snapshotEl.innerHTML = `
      <span class="snapshot-label">Dough Snapshot:</span>
      <span class="snapshot-chip"><strong>${(snap.hydration * 100).toFixed(1)}%</strong> hydration</span>
      <span class="snapshot-chip"><strong>${(snap.saltPct * 100).toFixed(1)}%</strong> salt</span>
      <span class="snapshot-chip"><strong>${(snap.oilPct * 100).toFixed(1)}%</strong> oil</span>
      <span class="snapshot-chip"><strong>${(snap.sugarPct * 100).toFixed(1)}%</strong> sugar</span>
      <span class="snapshot-chip"><strong>${(snap.yeastPct * 100).toFixed(2)}%</strong> yeast</span>
      <span class="snapshot-chip"><strong>${snap.doughBallWeight}g</strong> per ball</span>
    `;
  }

  btnNewEntry.addEventListener("click", () => showForm(false));
  btnCancel.addEventListener("click", hideForm);
  btnLogBake.addEventListener("click", () => {
    showForm(true);
    const journalSection = document.getElementById("pizza-journal");
    journalSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // Save entry
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const styleKey = document.getElementById("j-style").value;
    if (!styleKey) { alert("Please select a pizza style."); return; }

    const recipe = PIZZA_RECIPES[styleKey];
    const entry = {
      date: document.getElementById("j-date").value,
      styleKey,
      styleName: recipe ? recipe.name : styleKey,
      doughSnapshot: currentSnapshot || null,
      bakeTemp: parseInt(document.getElementById("j-bake-temp").value) || null,
      bakeTime: parseInt(document.getElementById("j-bake-time").value) || null,
      ovenType: document.getElementById("j-oven-type").value,
      rating: currentRating || 0,
      notes: document.getElementById("j-notes").value.trim(),
      photo: currentPhotoData || null,
    };

    PieLabJournal.addEntry(entry);
    hideForm();
    renderEntries();
    updateCompareButton();
  });

  // Render entries
  function renderEntries() {
    const filter = filterSelect.value;
    const entries = filter === "all"
      ? PieLabJournal.getAllEntries()
      : PieLabJournal.getEntriesByStyle(filter);

    if (entries.length === 0) {
      emptyState.classList.remove("hidden");
      entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());
      return;
    }

    emptyState.classList.add("hidden");

    // Clear existing cards
    entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());

    entries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "journal-entry-card";
      card.dataset.id = entry.id;

      const thumbHtml = entry.photo
        ? `<img class="entry-thumb" src="${entry.photo}" alt="Bake photo" />`
        : `<div class="entry-thumb-placeholder">\uD83C\uDF55</div>`;

      const detailParts = [];
      if (entry.bakeTemp) detailParts.push(`${entry.bakeTemp}\u00B0F`);
      if (entry.bakeTime) detailParts.push(`${entry.bakeTime} min`);
      if (entry.ovenType) {
        const ovenLabels = { home: "Home", outdoor: "Outdoor", commercial: "Commercial" };
        detailParts.push(ovenLabels[entry.ovenType] || entry.ovenType);
      }

      card.innerHTML = `
        ${thumbHtml}
        <div class="entry-info">
          <div class="entry-top-row">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-style-badge">${entry.styleName}</span>
            ${entry.rating ? `<span class="entry-stars">${renderStars(entry.rating)}</span>` : ""}
          </div>
          ${detailParts.length ? `<div class="entry-details">${detailParts.join(" \u00B7 ")}</div>` : ""}
          ${entry.notes ? `<div class="entry-notes-preview">${entry.notes}</div>` : ""}
        </div>
      `;

      card.addEventListener("click", () => openDetailModal(entry));
      entriesContainer.appendChild(card);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Filter
  filterSelect.addEventListener("change", () => {
    renderEntries();
    updateCompareButton();
    comparisonEl.classList.add("hidden");
  });

  function updateCompareButton() {
    const filter = filterSelect.value;
    if (filter === "all") {
      btnCompare.disabled = true;
      return;
    }
    const entries = PieLabJournal.getEntriesByStyle(filter);
    btnCompare.disabled = entries.length < 2;
  }

  // Detail Modal
  function openDetailModal(entry) {
    let html = "";

    if (entry.photo) {
      html += `<img class="modal-photo" src="${entry.photo}" alt="Bake photo" />`;
    }

    html += `
      <div class="modal-header">
        <h3>${entry.styleName}</h3>
        <span class="entry-date">${formatDate(entry.date)}</span>
        ${entry.rating ? `<span class="modal-stars">${renderStars(entry.rating)}</span>` : ""}
      </div>
    `;

    // Details grid
    const details = [];
    if (entry.bakeTemp) details.push({ label: "Bake Temp", value: `${entry.bakeTemp}\u00B0F` });
    if (entry.bakeTime) details.push({ label: "Bake Time", value: `${entry.bakeTime} min` });
    if (entry.ovenType) {
      const ovenLabels = { home: "Home Oven", outdoor: "Outdoor / Pizza Oven", commercial: "Commercial" };
      details.push({ label: "Oven", value: ovenLabels[entry.ovenType] || entry.ovenType });
    }

    if (entry.doughSnapshot) {
      const s = entry.doughSnapshot;
      details.push({ label: "Hydration", value: `${(s.hydration * 100).toFixed(1)}%` });
      details.push({ label: "Salt", value: `${(s.saltPct * 100).toFixed(1)}%` });
      details.push({ label: "Oil", value: `${(s.oilPct * 100).toFixed(1)}%` });
      details.push({ label: "Sugar", value: `${(s.sugarPct * 100).toFixed(1)}%` });
      details.push({ label: "Yeast", value: `${(s.yeastPct * 100).toFixed(2)}%` });
      details.push({ label: "Dough Ball", value: `${s.doughBallWeight}g` });
    }

    if (details.length) {
      html += '<div class="modal-detail-grid">';
      details.forEach((d) => {
        html += `<div class="modal-detail-item"><span class="detail-label">${d.label}</span><span class="detail-value">${d.value}</span></div>`;
      });
      html += "</div>";
    }

    if (entry.notes) {
      html += `<div class="modal-notes"><h4>Notes</h4><p>${entry.notes}</p></div>`;
    }

    html += `
      <div class="modal-actions">
        <button class="btn-modal-delete" data-id="${entry.id}">Delete Entry</button>
      </div>
    `;

    modalBody.innerHTML = html;
    modalOverlay.classList.remove("hidden");

    // Delete handler
    modalBody.querySelector(".btn-modal-delete").addEventListener("click", (e) => {
      if (confirm("Delete this journal entry? This cannot be undone.")) {
        PieLabJournal.deleteEntry(e.target.dataset.id);
        modalOverlay.classList.add("hidden");
        renderEntries();
        updateCompareButton();
      }
    });
  }

  modalClose.addEventListener("click", () => modalOverlay.classList.add("hidden"));
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
  });

  // Comparison
  btnCompare.addEventListener("click", () => {
    const filter = filterSelect.value;
    if (filter === "all") return;

    const entries = PieLabJournal.getEntriesByStyle(filter);
    const analysis = PieLabJournal.analyzeEntries(entries);

    if (analysis.insufficient) {
      comparisonEl.innerHTML = "<p>Need at least 2 entries for the same style to compare.</p>";
      comparisonEl.classList.remove("hidden");
      return;
    }

    let html = `
      <div class="comparison-header">
        <h3>Comparison \u2014 ${PIZZA_RECIPES[filter]?.name || filter}</h3>
        <span class="comparison-count">${analysis.totalEntries} entries</span>
      </div>
    `;

    // Insight cards
    html += '<div class="insights-row">';
    if (analysis.bestHydration) {
      html += `
        <div class="insight-card insight-highlight">
          <span class="insight-icon">\uD83D\uDCA7</span>
          <div>
            <strong>Best Hydration: ${analysis.bestHydration.value}%</strong>
            <p>Avg rating: ${analysis.bestHydration.avg}/5 (${analysis.bestHydration.count} bakes)</p>
          </div>
        </div>
      `;
    }
    if (analysis.bestBakeTemp) {
      html += `
        <div class="insight-card insight-highlight">
          <span class="insight-icon">\uD83C\uDF21\uFE0F</span>
          <div>
            <strong>Best Temp: ${analysis.bestBakeTemp.value}\u00B0F</strong>
            <p>Avg rating: ${analysis.bestBakeTemp.avg}/5 (${analysis.bestBakeTemp.count} bakes)</p>
          </div>
        </div>
      `;
    }
    html += "</div>";

    // Comparison table
    html += '<div class="comparison-table-wrapper"><table class="comparison-table">';
    html += "<thead><tr><th>Date</th><th>Hydration</th><th>Bake Temp</th><th>Time</th><th>Oven</th><th>Rating</th></tr></thead><tbody>";

    entries.forEach((entry) => {
      const hydration = entry.doughSnapshot ? Math.round(entry.doughSnapshot.hydration * 100) : null;
      const bakeTemp = entry.bakeTemp ? Math.round(entry.bakeTemp / 25) * 25 : null;

      const hClass = hydration != null && analysis.bestHydration && hydration === analysis.bestHydration.value ? "highlight-cell" : "";
      const tClass = bakeTemp != null && analysis.bestBakeTemp && bakeTemp === analysis.bestBakeTemp.value ? "highlight-cell" : "";

      const ovenLabels = { home: "Home", outdoor: "Outdoor", commercial: "Commercial" };

      html += `<tr>
        <td>${formatDate(entry.date)}</td>
        <td class="${hClass}">${hydration != null ? hydration + "%" : "\u2014"}</td>
        <td class="${tClass}">${entry.bakeTemp ? entry.bakeTemp + "\u00B0F" : "\u2014"}</td>
        <td>${entry.bakeTime ? entry.bakeTime + " min" : "\u2014"}</td>
        <td>${ovenLabels[entry.ovenType] || entry.ovenType || "\u2014"}</td>
        <td class="stars-cell">${entry.rating ? renderStars(entry.rating) : "\u2014"}</td>
      </tr>`;
    });

    html += "</tbody></table></div>";
    html += '<button class="btn-close-comparison" id="btn-close-comparison">Close Comparison</button>';

    comparisonEl.innerHTML = html;
    comparisonEl.classList.remove("hidden");
    comparisonEl.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("btn-close-comparison").addEventListener("click", () => {
      comparisonEl.classList.add("hidden");
    });
  });

  // Initialize
  populateStyleDropdowns();
  renderEntries();
  updateCompareButton();
})();


// ═══════════════════════════════════════════════════════
// DOUGH SCHEDULER
// ═══════════════════════════════════════════════════════

(function initDoughScheduler() {
  const STORAGE_KEY = "pielab-active-schedule";

  // ── DOM Refs ──
  const styleSelect = document.getElementById("sched-style");
  const countInput = document.getElementById("sched-count");
  const datetimeInput = document.getElementById("sched-datetime");
  const ovenSelect = document.getElementById("sched-oven");
  const progressEl = document.getElementById("scheduler-progress");
  const methodCard = document.getElementById("sched-method-card");
  const validationEl = document.getElementById("sched-validation");
  const timelineEl = document.getElementById("sched-timeline");
  const bannerEl = document.getElementById("active-schedule-banner");

  // Wizard step panels
  const stepPanels = [
    document.getElementById("sched-step-1"),
    document.getElementById("sched-step-2"),
    document.getElementById("sched-step-3"),
  ];

  // Buttons
  const btnNext1 = document.getElementById("btn-sched-next-1");
  const btnBack2 = document.getElementById("btn-sched-back-2");
  const btnNext2 = document.getElementById("btn-sched-next-2");
  const btnBack3 = document.getElementById("btn-sched-back-3");
  const btnSaveImg = document.getElementById("btn-sched-save-img");
  const btnStartOver = document.getElementById("btn-sched-start-over");
  const btnBannerView = document.getElementById("btn-banner-view");
  const btnBannerClear = document.getElementById("btn-banner-clear");

  // State
  let currentStep = 1;
  let selectedMethod = null;
  let computedSchedule = null;
  let countdownInterval = null;

  // ── Populate style dropdown ──
  for (const [key, recipe] of Object.entries(PIZZA_RECIPES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = recipe.name;
    styleSelect.appendChild(opt);
  }

  // ── Default datetime to tomorrow 6 PM ──
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const tzOffset = tomorrow.getTimezoneOffset() * 60000;
  datetimeInput.value = new Date(tomorrow.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);

  // ── Wizard Navigation ──

  function goToStep(step) {
    currentStep = step;
    stepPanels.forEach((p, i) => {
      p.classList.toggle("active", i === step - 1);
    });

    // Update progress dots
    const dots = progressEl.querySelectorAll(".progress-step");
    const lines = progressEl.querySelectorAll(".progress-line");
    dots.forEach((dot, i) => {
      const stepNum = i + 1;
      dot.classList.remove("active", "completed");
      if (stepNum === step) dot.classList.add("active");
      else if (stepNum < step) dot.classList.add("completed");
      // Update dot text
      const dotEl = dot.querySelector(".progress-dot");
      if (stepNum < step) dotEl.textContent = "\u2713";
      else dotEl.textContent = stepNum;
    });
    lines.forEach((line, i) => {
      line.classList.toggle("completed", i < step - 1);
    });
  }

  function validateStep1() {
    return styleSelect.value && countInput.value > 0 && datetimeInput.value;
  }

  // Enable/disable Next button
  function checkStep1Ready() {
    btnNext1.disabled = !validateStep1();
  }
  styleSelect.addEventListener("change", checkStep1Ready);
  countInput.addEventListener("input", checkStep1Ready);
  datetimeInput.addEventListener("input", checkStep1Ready);

  // ── Step 1 → Step 2 ──
  btnNext1.addEventListener("click", () => {
    if (!validateStep1()) return;

    const eatTime = new Date(datetimeInput.value);
    const now = new Date();
    const availableHours = (eatTime - now) / 3600000;

    if (availableHours <= 0) {
      alert("Please select a time in the future.");
      return;
    }

    selectedMethod = selectFermentMethod(availableHours);

    // Render method card
    const availHoursRounded = Math.round(availableHours);
    methodCard.innerHTML = `
      <div class="method-badge">${selectedMethod.label}</div>
      <p class="method-description">${selectedMethod.description}</p>
      <p class="method-reason">${selectedMethod.reason}</p>
      <span class="method-time-badge">~${availHoursRounded} hours available</span>
    `;

    // Pre-validate: check if schedule would work
    const styleKey = styleSelect.value;
    const recipe = PIZZA_RECIPES[styleKey];
    const sizeKeys = Object.keys(recipe.sizes);
    const defaultSize = sizeKeys.includes("12") ? "12" : sizeKeys[0];
    const doughBallWeight = recipe.sizes[defaultSize].doughWeight;
    const numPizzas = parseInt(countInput.value, 10);

    const result = buildScheduleBackward(
      eatTime, ovenSelect.value, selectedMethod,
      numPizzas, doughBallWeight, styleKey
    );

    if (!result.isValid) {
      validationEl.textContent = result.validationMsg;
      validationEl.classList.remove("hidden");
      btnNext2.disabled = true;
    } else {
      validationEl.classList.add("hidden");
      btnNext2.disabled = false;
    }

    goToStep(2);
  });

  // ── Step 2 → Back to Step 1 ──
  btnBack2.addEventListener("click", () => goToStep(1));

  // ── Step 2 → Step 3 ──
  btnNext2.addEventListener("click", () => {
    const eatTime = new Date(datetimeInput.value);
    const styleKey = styleSelect.value;
    const recipe = PIZZA_RECIPES[styleKey];
    const sizeKeys = Object.keys(recipe.sizes);
    const defaultSize = sizeKeys.includes("12") ? "12" : sizeKeys[0];
    const doughBallWeight = recipe.sizes[defaultSize].doughWeight;
    const numPizzas = parseInt(countInput.value, 10);

    const result = buildScheduleBackward(
      eatTime, ovenSelect.value, selectedMethod,
      numPizzas, doughBallWeight, styleKey
    );

    if (!result.isValid) {
      validationEl.textContent = result.validationMsg;
      validationEl.classList.remove("hidden");
      return;
    }

    computedSchedule = result.steps;

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Save to localStorage
    saveActiveSchedule({
      createdAt: new Date().toISOString(),
      styleKey,
      styleName: recipe.name,
      numPizzas,
      ovenType: ovenSelect.value,
      methodId: selectedMethod.id,
      methodLabel: selectedMethod.label,
      eatTime: eatTime.toISOString(),
      doughBallWeight,
      steps: computedSchedule.map((s) => ({
        id: s.id,
        label: s.label,
        dateTime: s.dateTime.toISOString(),
        instruction: s.instruction,
        why: s.why,
        duration: s.duration || null,
        checked: s.checked || false,
      })),
    });

    renderScheduleTimeline(computedSchedule);
    goToStep(3);

    // Hide banner when viewing full schedule
    bannerEl.classList.add("hidden");
  });

  // ── Step 3 → Back to Step 2 ──
  btnBack3.addEventListener("click", () => {
    stopCountdown();
    goToStep(2);
  });

  // ── Start Over ──
  btnStartOver.addEventListener("click", () => {
    stopCountdown();
    clearActiveSchedule();
    computedSchedule = null;
    selectedMethod = null;
    bannerEl.classList.add("hidden");
    goToStep(1);
  });

  // ── Timeline Rendering ──

  function renderScheduleTimeline(steps) {
    const now = new Date();

    // Find the "next" step: first unchecked step whose time is in the future (or nearest past unchecked)
    let nextIdx = -1;
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].checked && steps[i].dateTime > now) {
        nextIdx = i;
        break;
      }
    }
    // If all future steps are checked, find the first unchecked step
    if (nextIdx === -1) {
      nextIdx = steps.findIndex((s) => !s.checked);
    }

    const styleName = PIZZA_RECIPES[styleSelect.value]?.name || "";

    let html = `
      <div class="schedule-header">
        <h4>${styleName} Schedule</h4>
        <span class="schedule-method-pill">${selectedMethod ? selectedMethod.label : ""}</span>
      </div>
      <div class="schedule-steps">
    `;

    steps.forEach((step, i) => {
      const isPast = now >= step.dateTime;
      const isNext = i === nextIdx && !step.checked;
      let statusClass;
      if (step.checked) statusClass = "step-checked";
      else if (isNext) statusClass = "step-next";
      else if (isPast) statusClass = "step-done";
      else statusClass = "step-upcoming";

      html += `
        <div class="sched-timeline-step ${statusClass}" data-step-idx="${i}">
          <div class="sched-step-marker">
            <button class="sched-step-dot" data-idx="${i}"
              aria-label="${step.checked ? "Unmark" : "Mark"} ${step.label} as done"
              title="Click to ${step.checked ? "unmark" : "mark as done"}">
              ${step.checked ? "\u2713" : (i + 1)}
            </button>
            ${i < steps.length - 1 ? '<span class="sched-step-line"></span>' : ""}
          </div>
          <div class="sched-step-content">
            <div class="sched-step-time">${formatScheduleTime(step.dateTime)}</div>
            <div class="sched-step-label">
              ${step.label}
              ${step.duration ? `<span class="step-duration-badge">${step.duration}</span>` : ""}
            </div>
            <div class="sched-step-instruction">${step.instruction}</div>
            <button class="step-why-toggle" type="button">Why it matters</button>
            <div class="step-why-content">${step.why}</div>
            ${isNext ? `<div class="sched-step-countdown" data-target="${step.dateTime.toISOString()}"></div>` : ""}
          </div>
        </div>
      `;
    });

    html += "</div>";
    timelineEl.innerHTML = html;

    // ── Attach event listeners ──

    // Checkoff buttons
    timelineEl.querySelectorAll(".sched-step-dot").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (isNaN(idx) || !computedSchedule) return;
        computedSchedule[idx].checked = !computedSchedule[idx].checked;
        updateStoredChecks();
        renderScheduleTimeline(computedSchedule);
      });
    });

    // "Why it matters" toggles
    timelineEl.querySelectorAll(".step-why-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("open");
        const content = toggle.nextElementSibling;
        if (content) content.classList.toggle("open");
      });
    });

    // Start countdown
    startCountdown();
  }

  function formatScheduleTime(date) {
    const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
    const monthDay = date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
    const time = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${weekday} \u2014 ${monthDay} \u2014 ${time}`;
  }

  // ── Countdown Timer ──

  function startCountdown() {
    stopCountdown();
    countdownInterval = setInterval(() => {
      const el = timelineEl.querySelector(".sched-step-countdown");
      if (!el) {
        stopCountdown();
        return;
      }
      updateSchedCountdown(el);
    }, 1000);
    // Immediate update
    const el = timelineEl.querySelector(".sched-step-countdown");
    if (el) updateSchedCountdown(el);
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function updateSchedCountdown(el) {
    const target = new Date(el.dataset.target);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      el.textContent = "\u23F0 Now!";
      el.classList.add("countdown-now");
      // Send notification
      if ("Notification" in window && Notification.permission === "granted") {
        // Avoid repeat notifications — check flag
        if (!el.dataset.notified) {
          el.dataset.notified = "1";
          const stepEl = el.closest(".sched-timeline-step");
          const label = stepEl
            ? stepEl.querySelector(".sched-step-label")?.textContent?.trim()
            : "next step";
          new Notification("The Pie Lab \u2014 Time's Up!", {
            body: `It's time to: ${label}`,
            icon: "assets/logos/logo-monogram-512.svg",
          });
        }
      }
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    let text = "\u23F3 ";
    if (days > 0) text += `${days}d ${hours}h ${minutes}m`;
    else if (hours > 0) text += `${hours}h ${minutes}m ${seconds}s`;
    else if (minutes > 0) text += `${minutes}m ${seconds}s`;
    else text += `${seconds}s`;

    el.textContent = text;
  }

  // ── localStorage Persistence ──

  function saveActiveSchedule(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert("Storage is full. Your schedule may not persist across page reloads.");
      }
    }
  }

  function loadActiveSchedule() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Parse ISO date strings back to Date objects in steps
      if (data.steps) {
        data.steps.forEach((s) => {
          s.dateTime = new Date(s.dateTime);
        });
      }
      data.eatTime = new Date(data.eatTime);
      return data;
    } catch {
      return null;
    }
  }

  function clearActiveSchedule() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateStoredChecks() {
    const stored = loadActiveSchedule();
    if (!stored || !computedSchedule) return;
    stored.steps.forEach((s, i) => {
      if (computedSchedule[i]) {
        s.checked = computedSchedule[i].checked;
      }
    });
    // Re-serialize dates
    stored.steps.forEach((s) => {
      if (s.dateTime instanceof Date) s.dateTime = s.dateTime.toISOString();
    });
    if (stored.eatTime instanceof Date) stored.eatTime = stored.eatTime.toISOString();
    saveActiveSchedule(stored);
  }

  // ── Active Schedule Banner ──

  function showBanner(data) {
    const bannerStyleName = document.getElementById("banner-style-name");
    const bannerNextStep = document.getElementById("banner-next-step");

    bannerStyleName.textContent = `${data.styleName} \u2014 ${data.methodLabel}`;

    // Find next unchecked step
    const now = new Date();
    const nextStep = data.steps.find((s) => !s.checked && s.dateTime > now);
    if (nextStep) {
      const time = nextStep.dateTime.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      bannerNextStep.textContent = `Next: ${nextStep.label} at ${time}`;
    } else {
      const unchecked = data.steps.find((s) => !s.checked);
      if (unchecked) {
        bannerNextStep.textContent = `Next: ${unchecked.label}`;
      } else {
        bannerNextStep.textContent = "All steps complete!";
      }
    }

    bannerEl.classList.remove("hidden");
  }

  btnBannerView.addEventListener("click", () => {
    const data = loadActiveSchedule();
    if (!data) return;
    restoreSchedule(data);
  });

  btnBannerClear.addEventListener("click", () => {
    stopCountdown();
    clearActiveSchedule();
    computedSchedule = null;
    selectedMethod = null;
    bannerEl.classList.add("hidden");
    goToStep(1);
  });

  // ── Restore Schedule from Storage ──

  function restoreSchedule(data) {
    // Set form values
    styleSelect.value = data.styleKey;
    countInput.value = data.numPizzas;
    ovenSelect.value = data.ovenType;
    // Set datetime
    const eatDate = data.eatTime instanceof Date ? data.eatTime : new Date(data.eatTime);
    const off = eatDate.getTimezoneOffset() * 60000;
    datetimeInput.value = new Date(eatDate.getTime() - off).toISOString().slice(0, 16);

    // Set method
    selectedMethod = FERMENT_METHODS[data.methodId] || FERMENT_METHODS["same-day"];

    // Restore steps with Date objects
    computedSchedule = data.steps.map((s) => ({
      ...s,
      dateTime: s.dateTime instanceof Date ? s.dateTime : new Date(s.dateTime),
    }));

    bannerEl.classList.add("hidden");
    renderScheduleTimeline(computedSchedule);
    goToStep(3);
  }

  // ── Save as Image ──

  btnSaveImg.addEventListener("click", () => {
    if (typeof html2canvas === "undefined") {
      alert("Image export is loading. Please try again in a moment.");
      return;
    }
    const target = timelineEl;
    // Temporarily add a background for the capture
    const origBg = target.style.background;
    target.style.background = "#faf6f1";
    target.style.padding = "1.5rem";

    html2canvas(target, {
      backgroundColor: "#faf6f1",
      scale: 2,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      target.style.background = origBg;
      target.style.padding = "";
      const link = document.createElement("a");
      link.download = `pie-lab-schedule-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch((err) => {
      target.style.background = origBg;
      target.style.padding = "";
      console.error("Screenshot failed:", err);
      alert("Could not generate image. Try again.");
    });
  });

  // ── On-Load: Check for Active Schedule ──

  const saved = loadActiveSchedule();
  if (saved && saved.steps && saved.steps.length > 0) {
    showBanner(saved);
  }

})();
