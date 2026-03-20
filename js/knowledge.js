import { PieLabStorage } from './storage.js';
import { PIZZA_RECIPES } from '../recipes.js';
import {
  STYLE_LIBRARY,
  TOPPING_COMBOS,
  FLOUR_GUIDE,
  YEAST_GUIDE,
  CHEESE_SAUCE_GUIDE,
} from '../knowledge-data.js';
import { FERMENTATION_SCHEDULES } from '../tools-data.js';
import { PieLabPremium } from './premium.js';

/* ══════════════════════════════════════════════════════
   The Pie Lab — Knowledge Hub UI
   Page: learn.html
   ══════════════════════════════════════════════════════ */

// ── Tab Navigation ───────────────────────────────────
export function activateTab(tabId) {
  document.querySelectorAll('.toolkit-tab').forEach((t) => {
    const isTarget = t.dataset.tool === tabId;
    t.classList.toggle('active', isTarget);
    t.setAttribute('aria-selected', isTarget);
  });
  document.querySelectorAll('.toolkit-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `tool-${tabId}`);
  });
  history.replaceState(null, '', `#${tabId}`);
}

(function initKnowledgeHub() {
  // Tab click handlers — now uses unified toolkit selectors
  // (toolkit.js also binds these same buttons, but activateTab is idempotent)
  document.querySelectorAll('.toolkit-tab').forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.tool));
  });

  // Hash-based routing on load
  const knowledgeTabs = [
    'styles',
    'cheese',
    'flour',
    'fermentation',
    'compare',
    'hydration',
    'oven',
    'troubleshoot',
    'ddt',
    'volume',
  ];
  const hash = location.hash.replace('#', '');
  if (knowledgeTabs.includes(hash)) {
    activateTab(hash);
  }
  window.addEventListener('hashchange', () => {
    const h = location.hash.replace('#', '');
    if (knowledgeTabs.includes(h)) {
      activateTab(h);
    }
  });

  // Populate all panels
  populateStyleLibrary();
  populateFlourGuide();
  populateCheeseSauceGuide();
  populateFermentationChart();
  populateCompareTab();

  // ── Auto-open style accordion from URL param ──
  // Supports: learn.html?style=new-york#styles
  const urlParams = new URLSearchParams(window.location.search);
  const styleParam = urlParams.get('style');
  if (styleParam) {
    // Make sure the styles tab is active
    activateTab('styles');
    // Find and open the matching accordion
    setTimeout(() => {
      const panel = document.getElementById('tool-styles');
      if (!panel) return;
      const item = panel.querySelector(`.accordion-item[data-style-key="${styleParam}"]`);
      if (item) {
        openAccordion(item);
        item.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
})();

// ── Accordion Factory ────────────────────────────────
export function createAccordion(parentEl, items, renderContent) {
  items.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'accordion-item';
    if (item.key) wrapper.dataset.styleKey = item.key;

    const header = document.createElement('button');
    header.className = 'accordion-header';
    header.type = 'button';
    const subtitleHtml = item.subtitle
      ? `<span class="accordion-subtitle">${item.subtitle}</span>`
      : '';
    header.innerHTML = `<span class="accordion-title">${item.title}${subtitleHtml}</span><span class="accordion-arrow">\u25BC</span>`;

    const body = document.createElement('div');
    body.className = 'accordion-body';

    const inner = document.createElement('div');
    inner.className = 'accordion-inner';
    inner.innerHTML = renderContent(item.data);
    body.appendChild(inner);

    header.addEventListener('click', () => {
      const isOpen = wrapper.classList.contains('open');
      // Close all siblings
      parentEl.querySelectorAll('.accordion-item.open').forEach((a) => {
        a.classList.remove('open');
        a.querySelector('.accordion-body').style.maxHeight = null;
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

export function openAccordion(wrapper) {
  // Close siblings first
  const parent = wrapper.parentElement;
  if (parent) {
    parent.querySelectorAll('.accordion-item.open').forEach((a) => {
      a.classList.remove('open');
      a.querySelector('.accordion-body').style.maxHeight = null;
    });
  }
  wrapper.classList.add('open');
  const body = wrapper.querySelector('.accordion-body');
  body.style.maxHeight = body.scrollHeight + 'px';
}

// ── Style Library (includes Topping Combos) ─────────
function populateStyleLibrary() {
  const panel = document.getElementById('tool-styles');
  if (!panel) return;
  const items = Object.entries(STYLE_LIBRARY).map(([key, style]) => ({
    key,
    title: style.name,
    subtitle: style.origin || '',
    data: { ...style, _key: key },
  }));

  createAccordion(panel, items, (style) => {
    const factsHtml = style.keyFacts
      .map((f) => `<span class="key-fact"><strong>${f.label}:</strong> ${f.value}</span>`)
      .join('');

    // Topping combos for this style (merged from former Toppings tab)
    let combosSection = '';
    const combos = TOPPING_COMBOS[style._key] || null;
    if (combos && combos.combos && combos.combos.length) {
      const combosHtml = combos.combos
        .map((combo) => {
          const tierClass = combo.tier.toLowerCase();
          return `
            <div class="combo-card">
              <div class="combo-header">
                <span class="tier-badge tier-${tierClass}">${combo.tier}</span>
                <strong class="combo-name">${combo.name}</strong>
              </div>
              <ul class="combo-ingredients">
                ${combo.ingredients.map((i) => `<li>${i}</li>`).join('')}
              </ul>
              <p class="combo-why">${combo.why}</p>
            </div>
          `;
        })
        .join('');

      combosSection = `
        <div class="style-combos">
          <h4>Suggested Recipes</h4>
          <div class="combos-grid">${combosHtml}</div>
        </div>
      `;
    }

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
      ${combosSection}
    `;
  });
}

// ── Flour & Yeast Guide ──────────────────────────────
function populateFlourGuide() {
  const panel = document.getElementById('tool-flour');
  if (!panel) return;

  // ── Flour sub-section ──────────────────────────────
  const flourHeader = document.createElement('h3');
  flourHeader.className = 'panel-subheader';
  flourHeader.textContent = 'Flour';
  panel.appendChild(flourHeader);

  const flourContainer = document.createElement('div');
  flourContainer.className = 'flour-accordions';
  panel.appendChild(flourContainer);

  createAccordion(
    flourContainer,
    Object.entries(FLOUR_GUIDE).map(([key, flour]) => ({
      key,
      title: flour.name,
      data: flour,
    })),
    (flour) => {
      const usesHtml = flour.bestUses.map((u) => `<span class="use-tag">${u}</span>`).join('');

      const linksHtml = flour.buyLinks
        .map(
          (link) =>
            `<a href="${link.url}" class="buy-link" target="_blank" rel="noopener">
              <strong>${link.brand}</strong>
              <span class="buy-note">${link.note}</span>
              <span class="buy-arrow">\u2192</span>
            </a>`
        )
        .join('');

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
    }
  );

  // ── Yeast sub-section ──────────────────────────────
  if (typeof YEAST_GUIDE === 'undefined') return;

  const yeastHeader = document.createElement('h3');
  yeastHeader.className = 'panel-subheader';
  yeastHeader.textContent = 'Yeast';
  panel.appendChild(yeastHeader);

  const yeastContainer = document.createElement('div');
  yeastContainer.className = 'yeast-accordions';
  panel.appendChild(yeastContainer);

  createAccordion(
    yeastContainer,
    Object.entries(YEAST_GUIDE).map(([key, yeast]) => ({
      key,
      title: yeast.name,
      data: yeast,
    })),
    (yeast) => {
      const usesHtml = yeast.bestUses.map((u) => `<span class="use-tag">${u}</span>`).join('');

      const linksHtml = yeast.buyLinks
        .map(
          (link) =>
            `<a href="${link.url}" class="buy-link" target="_blank" rel="noopener">
              <strong>${link.brand}</strong>
              <span class="buy-note">${link.note}</span>
              <span class="buy-arrow">\u2192</span>
            </a>`
        )
        .join('');

      const noteHtml = yeast.note ? `<p class="yeast-note">${yeast.note}</p>` : '';

      return `
        <span class="protein-badge">${yeast.badge}</span>
        <p class="flour-desc">${yeast.description}</p>
        <h4>How to Use</h4>
        <p class="flour-effect">${yeast.usage}</p>
        <div class="flour-uses">
          <h4>Best For</h4>
          <div class="use-tags">${usesHtml}</div>
        </div>
        <div class="flour-buy">
          <h4>Where to Buy</h4>
          ${linksHtml}
        </div>
        ${noteHtml}
      `;
    }
  );

  // ── Yeast Converter Widget ─────────────────────────
  // Ratios: 1g IDY = 1.25g ADY = 3g Fresh
  const converter = document.createElement('div');
  converter.className = 'yeast-converter';
  converter.innerHTML = `
    <h4>Yeast Converter</h4>
    <p class="converter-desc">Enter an amount in any type and see the equivalent for the other two.</p>
    <div class="converter-row">
      <div class="converter-field">
        <label for="yc-idy">Instant Dry (IDY)</label>
        <input type="number" id="yc-idy" step="0.1" min="0" placeholder="g" />
      </div>
      <div class="converter-field">
        <label for="yc-ady">Active Dry (ADY)</label>
        <input type="number" id="yc-ady" step="0.1" min="0" placeholder="g" />
      </div>
      <div class="converter-field">
        <label for="yc-fresh">Fresh (Cake)</label>
        <input type="number" id="yc-fresh" step="0.1" min="0" placeholder="g" />
      </div>
    </div>
  `;
  panel.appendChild(converter);

  const idyInput = converter.querySelector('#yc-idy');
  const adyInput = converter.querySelector('#yc-ady');
  const freshInput = converter.querySelector('#yc-fresh');

  function updateFrom(source) {
    const val = parseFloat(source.value);
    if (isNaN(val) || val < 0) return;
    const round = (n) => Math.round(n * 100) / 100;
    if (source === idyInput) {
      adyInput.value = round(val * 1.25);
      freshInput.value = round(val * 3);
    } else if (source === adyInput) {
      idyInput.value = round(val / 1.25);
      freshInput.value = round(val * 2.4);
    } else {
      idyInput.value = round(val / 3);
      adyInput.value = round(val / 2.4);
    }
  }

  idyInput.addEventListener('input', () => updateFrom(idyInput));
  adyInput.addEventListener('input', () => updateFrom(adyInput));
  freshInput.addEventListener('input', () => updateFrom(freshInput));
}

// ── Cheese & Sauce Guide ─────────────────────────────
function populateCheeseSauceGuide() {
  const panel = document.getElementById('tool-cheese');
  if (!panel) return;

  // Cheese accordion
  const cheeseHeader = document.createElement('h3');
  cheeseHeader.className = 'panel-subheader';
  cheeseHeader.textContent = 'Cheeses';
  panel.appendChild(cheeseHeader);

  const cheeseContainer = document.createElement('div');
  cheeseContainer.className = 'cheese-accordions';
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
          return recipe ? `<span class="use-tag">${recipe.name}</span>` : '';
        })
        .join('');

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
  const sauceHeader = document.createElement('h3');
  sauceHeader.className = 'panel-subheader';
  sauceHeader.textContent = 'Sauces';
  panel.appendChild(sauceHeader);

  const sauceContainer = document.createElement('div');
  sauceContainer.className = 'sauce-accordions';
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
          return recipe ? `<span class="use-tag">${recipe.name}</span>` : '';
        })
        .join('');

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
  const panel = document.getElementById('tool-fermentation');
  if (!panel) return;

  let rows = '';
  for (const [key, sched] of Object.entries(FERMENTATION_SCHEDULES)) {
    const recipe = PIZZA_RECIPES[key];
    if (!recipe) continue;

    // Extract room-temp and fridge info from steps
    const COLD_METHOD_NAMES = ['Cold Ferment', 'Cold Cure', 'Tavern Cure'];
    let hasFridge =
      COLD_METHOD_NAMES.some((m) => sched.method.includes(m)) ||
      sched.steps.some(
        (s) =>
          s.label.toLowerCase().includes('fridge') || s.label.toLowerCase().includes('refrigerat')
      );

    const bakeTemp = recipe.idealTemp
      ? `${recipe.idealTemp.min}\u2013${recipe.idealTemp.max}\u00B0F`
      : '\u2014';

    const roomTemp = hasFridge ? '1\u20132 hrs' : sched.totalTime;
    const fridgeTemp = hasFridge ? sched.totalTime : '\u2014';

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

// ── Side-by-Side Recipe Compare ──────────────────────
function populateCompareTab() {
  const panel = document.getElementById('tool-compare');
  if (!panel) return;

  const styleKeys = Object.keys(PIZZA_RECIPES);

  // Build option markup shared across selects
  const optionsHtml = styleKeys
    .map((k) => `<option value="${k}">${PIZZA_RECIPES[k].name}</option>`)
    .join('');

  panel.innerHTML = `
    <p class="compare-intro">Pick 2\u20133 pizza styles to see their dough formulas, bake temps, and techniques side by side.</p>
    <div class="compare-picker">
      <div class="compare-picker-row">
        <select class="compare-select" id="compare-a">
          <option value="">Style 1\u2026</option>
          ${optionsHtml}
        </select>
        <select class="compare-select" id="compare-b">
          <option value="">Style 2\u2026</option>
          ${optionsHtml}
        </select>
        <select class="compare-select" id="compare-c">
          <option value="">(Optional) Style 3\u2026</option>
          ${optionsHtml}
        </select>
        <button class="btn-compare-go" id="btn-compare-go" disabled>Compare</button>
      </div>
    </div>
    <div id="compare-result"></div>
  `;

  const selA = panel.querySelector('#compare-a');
  const selB = panel.querySelector('#compare-b');
  const selC = panel.querySelector('#compare-c');
  const btn = panel.querySelector('#btn-compare-go');
  const resultEl = panel.querySelector('#compare-result');

  function getSelectedKeys() {
    return [selA.value, selB.value, selC.value].filter(Boolean);
  }

  function updateButtonState() {
    const keys = getSelectedKeys();
    const unique = new Set(keys);
    btn.disabled = unique.size < 2;
  }

  [selA, selB, selC].forEach((sel) => sel.addEventListener('change', updateButtonState));

  btn.addEventListener('click', () => {
    const keys = [...new Set(getSelectedKeys())];
    if (keys.length < 2) return;
    PieLabPremium.verifyAndGate(() => renderComparison(keys, resultEl));
  });
}

function renderComparison(keys, container) {
  const recipes = keys.map((k) => ({ key: k, ...PIZZA_RECIPES[k] }));
  const colCount = recipes.length;

  // Data rows definition
  const rows = [
    {
      label: 'Flour Type',
      values: recipes.map((r) => r.flour),
    },
    {
      label: 'Hydration',
      values: recipes.map((r) => (r.hydration * 100).toFixed(0) + '%'),
      raw: recipes.map((r) => r.hydration * 100),
      diffThreshold: 5,
    },
    {
      label: 'Salt %',
      values: recipes.map((r) => (r.saltPct * 100).toFixed(1) + '%'),
      raw: recipes.map((r) => r.saltPct * 100),
      diffThreshold: 1,
    },
    {
      label: 'Oil %',
      values: recipes.map((r) => (r.oilPct * 100).toFixed(1) + '%'),
      raw: recipes.map((r) => r.oilPct * 100),
      diffThreshold: 1,
    },
    {
      label: 'Sugar %',
      values: recipes.map((r) => (r.sugarPct * 100).toFixed(1) + '%'),
      raw: recipes.map((r) => r.sugarPct * 100),
      diffThreshold: 1,
    },
    {
      label: 'Yeast %',
      values: recipes.map((r) => (r.yeastPct * 100).toFixed(2) + '%'),
      raw: recipes.map((r) => r.yeastPct * 100),
      diffThreshold: 0.5,
    },
    {
      label: 'Ideal Temp',
      values: recipes.map((r) =>
        r.idealTemp ? `${r.idealTemp.min}\u2013${r.idealTemp.max}\u00B0F` : '\u2014'
      ),
    },
    {
      label: 'Bake Time',
      values: recipes.map((r) => (r.bakeTime ? r.bakeTime.medium : '\u2014')),
    },
    {
      label: '12\u2033 Dough',
      values: recipes.map((r) => {
        const s = r.sizes['12'];
        return s ? s.doughWeight + 'g' : '\u2014';
      }),
    },
  ];

  // Check if a row has significant diff
  function hasDiff(row) {
    if (!row.raw || !row.diffThreshold) return false;
    const min = Math.min(...row.raw);
    const max = Math.max(...row.raw);
    return max - min >= row.diffThreshold;
  }

  // Build HTML
  let html = `<div class="compare-grid-table" style="--col-count:${colCount}">`;

  // Header row
  html += `<div class="compare-row compare-header-row"><div class="compare-label-cell"></div>`;
  recipes.forEach((r) => {
    html += `<div class="compare-header-cell">
      <strong>${r.name}</strong>
      <a href="calculator.html?style=${r.key}" class="btn-compare-make">Make This \u2192</a>
    </div>`;
  });
  html += `</div>`;

  // Data rows
  rows.forEach((row) => {
    const diffClass = hasDiff(row) ? ' compare-diff-highlight' : '';
    html += `<div class="compare-row${diffClass}"><div class="compare-label-cell">${row.label}</div>`;
    row.values.forEach((val) => {
      html += `<div class="compare-value-cell">${val}</div>`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ── Toolkit Tour (3rd app session) ──────────────────
(function initToolkitTour() {
  const TOUR_DONE_KEY = 'pielab-toolkit-tour-done';
  if (localStorage.getItem(TOUR_DONE_KEY) === '1') return;
  const sessions = parseInt(PieLabStorage.get('pielab-session-count') || '0', 10);
  if (sessions < 3) return;

  const steps = [
    {
      tab: 'styles',
      title: 'Style Library',
      body: 'Explore 13 regional pizza styles — from Neapolitan to Detroit. Each entry covers the history, key characteristics, and authentic techniques to get it right.',
    },
    {
      tab: 'cheese',
      title: 'Cheese & Sauce Guide',
      body: 'Learn which cheeses and sauces pair best with each style. Covers everything from fresh mozzarella to brick cheese, and classic marinara to white sauce.',
    },
    {
      tab: 'flour',
      title: 'Flour & Yeast Guide',
      body: 'Understand the difference between Tipo 00, bread flour, and all-purpose. Plus a yeast converter to switch between instant, active dry, and fresh yeast.',
    },
    {
      tab: 'fermentation',
      title: 'Fermentation Chart',
      body: "A quick reference for every style's fermentation schedule — cold vs. room temp, total time, and optimal bake temperatures all in one place.",
    },
    {
      tab: 'hydration',
      title: 'Hydration Guide',
      body: 'A Pro tool that shows the ideal hydration range for each style with an interactive slider. See exactly how much water to use for your flour amount.',
      isPro: true,
    },
    {
      tab: 'oven',
      title: 'Oven Guide',
      body: 'Detailed guides for 6 oven types — home, wood-fired, gas, portable, and electric. Learn preheat times, heat transfer methods, and style-specific tips.',
    },
    {
      tab: 'troubleshoot',
      title: 'Troubleshooting',
      body: 'Having issues with your dough or bake? This Pro tool walks you through common symptoms with a diagnostic flow to pinpoint the problem and fix it.',
      isPro: true,
    },
    {
      tab: 'compare',
      title: 'Style Compare',
      body: 'Pick 2–3 styles and compare their recipes side by side — hydration, salt, oil, sugar, yeast, bake temp, and more. A Pro feature for dialing in your dough.',
      isPro: true,
    },
    {
      tab: 'ddt',
      title: 'DDT Calculator',
      body: 'Calculate the ideal water temperature for your dough using the Desired Dough Temperature method. Accounts for room temp, flour temp, and friction factor.',
      isPro: true,
    },
    {
      tab: 'volume',
      title: 'Volume Conversion',
      body: "Convert grams to cups, tablespoons, and teaspoons for any pizza ingredient. Handy when you don't have a scale.",
    },
  ];

  let overlay = null;
  let highlight = null;
  let currentStep = 0;

  function start() {
    currentStep = 0;
    overlay = document.createElement('div');
    overlay.className = 'firstbake-overlay';
    overlay.innerHTML = `
      <div class="firstbake-card">
        <button class="firstbake-skip" id="tt-skip" aria-label="Close tour">Skip</button>
        <div class="firstbake-step-count" id="tt-step-count"></div>
        <h3 class="firstbake-title" id="tt-title"></h3>
        <p class="firstbake-body" id="tt-body"></p>
        <div class="firstbake-actions">
          <button class="firstbake-btn firstbake-btn--next" id="tt-next">Next</button>
        </div>
      </div>
    `;

    highlight = document.createElement('div');
    highlight.className = 'firstbake-highlight hidden';
    document.body.appendChild(highlight);
    document.body.appendChild(overlay);

    document.getElementById('tt-next').addEventListener('click', next);
    document.getElementById('tt-skip').addEventListener('click', close);

    requestAnimationFrame(() => overlay.classList.add('firstbake-overlay--visible'));
    render();
  }

  function render() {
    const step = steps[currentStep];
    const total = steps.length;

    document.getElementById('tt-step-count').textContent = `${currentStep + 1} of ${total}`;
    document.getElementById('tt-title').textContent = step.title + (step.isPro ? ' (Pro)' : '');
    document.getElementById('tt-body').textContent = step.body;

    const nextBtn = document.getElementById('tt-next');
    nextBtn.textContent = currentStep === total - 1 ? 'Got It!' : 'Next';

    // Switch to this tab
    if (typeof activateTab === 'function') activateTab(step.tab);

    // Highlight the tab button
    if (highlight) highlight.classList.add('hidden');
    const tabBtn = document.querySelector(`.toolkit-tab[data-tool="${step.tab}"]`);
    if (tabBtn) {
      tabBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      setTimeout(() => {
        if (!highlight) return;
        const rect = tabBtn.getBoundingClientRect();
        const pad = 4;
        highlight.style.top = rect.top + window.scrollY - pad + 'px';
        highlight.style.left = rect.left - pad + 'px';
        highlight.style.width = rect.width + pad * 2 + 'px';
        highlight.style.height = rect.height + pad * 2 + 'px';
        highlight.classList.remove('hidden');
      }, 200);
    }
  }

  function next() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      render();
    } else {
      close();
    }
  }

  function close() {
    localStorage.setItem(TOUR_DONE_KEY, '1');
    if (highlight) {
      highlight.remove();
      highlight = null;
    }
    if (overlay) {
      overlay.classList.remove('firstbake-overlay--visible');
      setTimeout(() => {
        if (overlay) {
          overlay.remove();
          overlay = null;
        }
        if (typeof activateTab === 'function') activateTab('styles');
      }, 300);
    }
  }

  setTimeout(() => start(), 800);
})();
