/* ══════════════════════════════════════════════════════
   The Pie Lab — Knowledge Hub UI
   Page: learn.html
   ══════════════════════════════════════════════════════ */

// ── Tab Navigation ───────────────────────────────────
function activateTab(tabId) {
  document.querySelectorAll(".toolkit-tab").forEach((t) => {
    const isTarget = t.dataset.tool === tabId;
    t.classList.toggle("active", isTarget);
    t.setAttribute("aria-selected", isTarget);
  });
  document.querySelectorAll(".toolkit-panel").forEach((p) => {
    p.classList.toggle("active", p.id === `tool-${tabId}`);
  });
  history.replaceState(null, "", `#${tabId}`);
}

(function initKnowledgeHub() {
  // Tab click handlers — now uses unified toolkit selectors
  // (toolkit.js also binds these same buttons, but activateTab is idempotent)
  document.querySelectorAll(".toolkit-tab").forEach((tab) => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tool));
  });

  // Hash-based routing on load
  const knowledgeTabs = ["styles", "toppings", "flour", "cheese", "fermentation"];
  const hash = location.hash.replace("#", "");
  if (knowledgeTabs.includes(hash)) {
    activateTab(hash);
  }
  window.addEventListener("hashchange", () => {
    const h = location.hash.replace("#", "");
    if (knowledgeTabs.includes(h)) {
      activateTab(h);
    }
  });

  // Populate all panels
  populateStyleLibrary();
  populateToppingCombos();
  populateFlourGuide();
  populateCheeseSauceGuide();
  populateFermentationChart();

  // ── Auto-open style accordion from URL param ──
  // Supports: learn.html?style=new-york#styles
  const urlParams = new URLSearchParams(window.location.search);
  const styleParam = urlParams.get("style");
  if (styleParam) {
    // Make sure the styles tab is active
    activateTab("styles");
    // Find and open the matching accordion
    setTimeout(() => {
      const panel = document.getElementById("tool-styles");
      if (!panel) return;
      const item = panel.querySelector(`.accordion-item[data-style-key="${styleParam}"]`);
      if (item) {
        openAccordion(item);
        item.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  }

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
  const panel = document.getElementById("tool-styles");
  if (!panel) return;
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
  const panel = document.getElementById("tool-toppings");
  if (!panel) return;
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
  const panel = document.getElementById("tool-flour");
  if (!panel) return;
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
  const panel = document.getElementById("tool-cheese");
  if (!panel) return;

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
}

// ── Fermentation Reference Chart (replaces Timer) ────
function populateFermentationChart() {
  const panel = document.getElementById("tool-fermentation");
  if (!panel) return;

  let rows = "";
  for (const [key, sched] of Object.entries(FERMENTATION_SCHEDULES)) {
    const recipe = PIZZA_RECIPES[key];
    if (!recipe) continue;

    // Extract room-temp and fridge info from steps
    let hasFridge = sched.method.toLowerCase().includes("cold") ||
                    sched.steps.some((s) => s.label.toLowerCase().includes("fridge") ||
                                            s.label.toLowerCase().includes("refrigerat") ||
                                            s.label.toLowerCase().includes("cold"));

    const bakeTemp = recipe.idealTemp
      ? `${recipe.idealTemp.min}\u2013${recipe.idealTemp.max}\u00B0F`
      : "\u2014";

    const roomTemp = hasFridge ? "1\u20132 hrs" : sched.totalTime;
    const fridgeTemp = hasFridge
      ? sched.totalTime.replace(/\d+\s*[-–]\s*\d+\s*hours?/i, (m) => m)
      : "\u2014";

    rows += `
      <tr>
        <td class="chart-style-name">${sched.name}</td>
        <td>${sched.method}</td>
        <td>${sched.totalTime}</td>
        <td>${roomTemp}</td>
        <td>${fridgeTemp}</td>
        <td>${bakeTemp}</td>
      </tr>
    `;
  }

  panel.innerHTML = `
    <p class="chart-intro">A quick reference for fermentation methods across all 13 pizza styles. Times are approximate \u2014 adjust based on your dough's behavior and room temperature.</p>
    <div class="ferment-chart-wrapper">
      <table class="ferment-reference-chart">
        <thead>
          <tr>
            <th>Style</th>
            <th>Method</th>
            <th>Total Time</th>
            <th>Room Temp</th>
            <th>Fridge</th>
            <th>Bake Temp</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}
