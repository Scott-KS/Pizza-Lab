/* ══════════════════════════════════════════════════════
   The Pie Lab — Calculator + Results + Settings
   Page: calculator.html
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';
import {
  PIZZA_RECIPES,
  calculateDough,
  calculateSauce,
  calculateToppings,
  getBakingInfo,
  round1,
  fToC,
  HYDRATION_GUIDE,
} from '../recipes.js';
import {
  populateStyleSelect,
  populateOvenSelect,
  OVEN_TYPES,
  showToast,
  createAlarmBeep,
} from './nav.js';
import { PieLabProfile } from './user-profile.js';
import { PieLabPremium } from './premium.js';
import { PieLabJournal } from '../journal.js';
import { OVEN_PREHEAT_MINUTES } from '../scheduler-data.js';
import { OVEN_SETUPS, STYLE_TOOLS } from '../tools-data.js';
import { STYLE_LIBRARY } from '../knowledge-data.js';
import { PieNotifications } from './pie-notifications.js';

// ── Module-scoped state ─────────────────────────────
let lastRecipe = null;
let lastCalcContext = null;
let lastDough = null;
let lastSauce = null;
let lastToppings = null;
let lastPreferment = null; // preferment ingredient split (if active)
let currentUnit = 'g';
let _currentTips = [];
let _currentStyleKey = null;
let renderTips = null;
let initTipsSlider = null;

// ── Preferment-eligible styles ──────────────────────
const PREFERMENT_STYLES = ['neapolitan', 'new-york', 'sicilian', 'grandma', 'new-haven'];

// ── Preferment splitter ─────────────────────────────
// Takes calculated dough array, splits flour/water/yeast into preferment + final dough.
function splitPreferment(doughArr, prefType, flourFraction) {
  // Find flour, water, yeast rows
  const flourRow = doughArr.find((d) => /flour/i.test(d.ingredient));
  const waterRow = doughArr.find((d) => /water/i.test(d.ingredient));
  const yeastRow = doughArr.find((d) => /yeast/i.test(d.ingredient));

  if (!flourRow || !waterRow) return null;

  const totalFlour = flourRow.amount;
  const _totalWater = waterRow.amount;
  const _totalYeast = yeastRow ? yeastRow.amount : 0;

  const prefFlour = round1(totalFlour * flourFraction);
  let prefWater, prefYeast;

  if (prefType === 'poolish') {
    prefWater = round1(prefFlour); // 100% hydration
    prefYeast = round1(prefFlour * 0.001); // tiny amount
  } else {
    // biga — 50% hydration
    prefWater = round1(prefFlour * 0.5);
    prefYeast = round1(prefFlour * 0.001);
  }

  // Build preferment ingredients
  const preferment = [
    {
      ingredient: flourRow.ingredient,
      amount: prefFlour,
      pct: round1((prefFlour / prefFlour) * 100),
    },
    { ingredient: 'Water', amount: prefWater, pct: round1((prefWater / prefFlour) * 100) },
    {
      ingredient: yeastRow ? yeastRow.ingredient : 'Instant Dry Yeast',
      amount: prefYeast,
      pct: round1((prefYeast / prefFlour) * 100),
    },
  ];

  // Adjust final dough — subtract preferment amounts
  const finalDough = doughArr.map((d) => {
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
  'Tipo 00 Flour': 0.55,
  'High-Gluten Bread Flour': 0.65,
  'All-Purpose Flour': 0.58,
  'Bread Flour': 0.62,
  'Bread Flour (or Bread + Semolina blend)': 0.62,
  'Whole Wheat Flour': 0.7,
  'Semolina Flour': 0.5,
};

// ── Volume Conversion Data ──────────────────────────
function showScalingMemoryIndicator(styleName) {
  const el = document.getElementById('scaling-memory-indicator');
  if (!el) return;
  el.textContent = `Restored from your last ${styleName} bake`;
  el.classList.remove('hidden', 'fade-out');
  el.classList.add('fade-in');
  setTimeout(() => {
    el.classList.add('fade-out');
    setTimeout(() => {
      el.classList.add('hidden');
      el.classList.remove('fade-in', 'fade-out');
    }, 500);
  }, 3000);
}

function gramsToOz(grams) {
  const oz = grams / 28.3495;
  if (oz < 0.1) return '< 0.1 oz';
  return Math.round(oz * 10) / 10 + ' oz';
}

function formatAmount(grams, _ingredientName) {
  if (currentUnit === 'g') return grams + ' g';
  return gramsToOz(grams);
}

function unitColumnHeader() {
  return currentUnit === 'g' ? 'Grams' : 'Ounces';
}

// ── All DOM-dependent code runs after DOMContentLoaded ──
document.addEventListener('DOMContentLoaded', () => {
  // ── Populate Pizza Style Selector ────────────────────
  const typeSelectEl = document.getElementById('pizza-type');
  if (typeSelectEl) populateStyleSelect(typeSelectEl);

  // ── Populate Oven-Type Selector ──────────────────────
  const ovenSelect = document.getElementById('calc-oven-type');
  if (ovenSelect) {
    populateOvenSelect(ovenSelect);

    // Default to user's preferred oven from My Kitchen profile
    const kitchenProfile = PieLabProfile.getProfile();
    if (
      kitchenProfile.preferredOven &&
      ovenSelect.querySelector(`option[value="${kitchenProfile.preferredOven}"]`)
    ) {
      ovenSelect.value = kitchenProfile.preferredOven;
    }

    // Set measurement unit from Kitchen profile
    currentUnit = PieLabProfile.isMetricWeight() ? 'g' : 'oz';
  }

  // ── URL params (used for style pre-select after handler is bound) ──
  const urlParams = new URLSearchParams(window.location.search);

  // ── Dynamic Size Selector ────────────────────────────
  const sizeSelect = document.getElementById('pizza-size');

  typeSelectEl.addEventListener('change', () => {
    const recipe = PIZZA_RECIPES[typeSelectEl.value];
    if (!recipe) return;

    sizeSelect.innerHTML = '';
    for (const [key, info] of Object.entries(recipe.sizes)) {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = info.label;
      sizeSelect.appendChild(opt);
    }

    // Default: recipe-specified, or middle option (3+ sizes), or larger (2 sizes)
    const keys = Object.keys(recipe.sizes);
    if (recipe.defaultSize && keys.includes(recipe.defaultSize)) {
      sizeSelect.value = recipe.defaultSize;
    } else if (keys.length >= 3) {
      sizeSelect.value = keys[Math.floor(keys.length / 2)];
    } else if (keys.length === 2) {
      sizeSelect.value = keys[1];
    } else {
      sizeSelect.value = keys[0];
    }

    // Restore scaling memory for this style (skip if explicit load/style URL)
    if (!urlParams.get('load') && !urlParams.get('style')) {
      try {
        const mem = PieLabStorage.getJSON('pielab-scaling-memory') || {};
        const saved = mem[typeSelectEl.value];
        if (saved) {
          if (saved.sizeKey && sizeSelect.querySelector(`option[value="${saved.sizeKey}"]`)) {
            sizeSelect.value = saved.sizeKey;
          }
          if (saved.numPizzas) {
            document.getElementById('num-pizzas').value = saved.numPizzas;
          }
          // Restore oven only if no preferred oven in kitchen profile
          const profile = PieLabProfile.getProfile();
          const hasPreferred =
            profile.preferredOven &&
            ovenSelect.querySelector(`option[value="${profile.preferredOven}"]`);
          if (
            saved.ovenType &&
            !hasPreferred &&
            ovenSelect.querySelector(`option[value="${saved.ovenType}"]`)
          ) {
            ovenSelect.value = saved.ovenType;
          }
          showScalingMemoryIndicator(recipe.name);
        }
      } catch {
        /* ignore */
      }
    }

    // Refresh ferment options when style changes in plan mode

    // Show/hide preferment controls based on style eligibility
    const prefControls = document.getElementById('preferment-controls');
    if (prefControls) {
      const eligible = PREFERMENT_STYLES.includes(typeSelectEl.value);
      prefControls.classList.toggle('hidden', !eligible);
      // Reset preferment toggle when switching to ineligible style
      if (!eligible) {
        const prefToggle = document.getElementById('preferment-toggle');
        if (prefToggle) prefToggle.checked = false;
        const prefOptions = document.getElementById('preferment-options');
        if (prefOptions) prefOptions.classList.add('hidden');
      }
    }
  });

  // ── Pre-select style (from URL or Kitchen profile) ────
  // Must come AFTER the change handler is bound so sizes populate.
  const presetStyle = urlParams.get('style');
  if (presetStyle && typeSelectEl && typeSelectEl.querySelector(`option[value="${presetStyle}"]`)) {
    typeSelectEl.value = presetStyle;
    typeSelectEl.dispatchEvent(new Event('change'));
  } else {
    const kitchenProfile = PieLabProfile.getProfile();
    if (
      kitchenProfile.favoriteStyle &&
      typeSelectEl &&
      typeSelectEl.querySelector(`option[value="${kitchenProfile.favoriteStyle}"]`)
    ) {
      typeSelectEl.value = kitchenProfile.favoriteStyle;
      typeSelectEl.dispatchEvent(new Event('change'));
    }
  }

  // ── Preferment Toggle Handler ─────────────────────────
  const prefermentToggle = document.getElementById('preferment-toggle');
  const prefermentOptions = document.getElementById('preferment-options');
  const prefermentPctSlider = document.getElementById('preferment-pct');
  const prefermentPctLabel = document.getElementById('preferment-pct-label');

  if (prefermentToggle) {
    prefermentToggle.addEventListener('change', () => {
      if (prefermentToggle.checked) {
        PieLabPremium.verifyAndGate(() => {
          prefermentOptions.classList.remove('hidden');
        });
        // If gate denied, uncheck
        if (!PieLabPremium.canUse()) {
          prefermentToggle.checked = false;
        }
      } else {
        prefermentOptions.classList.add('hidden');
      }
    });
  }

  if (prefermentPctSlider && prefermentPctLabel) {
    prefermentPctSlider.addEventListener('input', () => {
      prefermentPctLabel.textContent = prefermentPctSlider.value + '%';
    });
  }

  // ── Yeast Scaling Slider Labels ──────────────────────
  const fermentHoursSlider = document.getElementById('ferment-hours');
  const fermentHoursLabel = document.getElementById('ferment-hours-label');
  const fermentTempSlider = document.getElementById('ferment-temp');
  const fermentTempLabel = document.getElementById('ferment-temp-label');
  let yeastScalingGated = false;

  if (fermentHoursSlider && fermentHoursLabel) {
    fermentHoursSlider.addEventListener('input', () => {
      fermentHoursLabel.textContent = fermentHoursSlider.value + ' hours';
      if (!yeastScalingGated) {
        yeastScalingGated = true;
        PieLabPremium.verifyAndGate(() => {
          /* access granted */
        });
      }
    });
  }
  function updateFermentTempLabel() {
    if (!fermentTempSlider || !fermentTempLabel) return;
    const valF = parseFloat(fermentTempSlider.value);
    const metricTemp = PieLabProfile.isMetricTemp();
    fermentTempLabel.textContent = metricTemp ? fToC(valF) + '°C' : valF + '°F';
  }
  if (fermentTempSlider && fermentTempLabel) {
    fermentTempSlider.addEventListener('input', updateFermentTempLabel);
    updateFermentTempLabel(); // set initial label
  }

  // ── Form Submit ──────────────────────────────────────
  document.getElementById('pizza-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('pizza-type').value;
    const sizeKey = sizeSelect.value;
    const numPizzas = parseInt(document.getElementById('num-pizzas').value, 10);
    const ovenType = ovenSelect ? ovenSelect.value : 'home';

    // Inline validation
    const errType = document.getElementById('err-pizza-type');
    const errSize = document.getElementById('err-pizza-size');
    if (errType) errType.classList.toggle('hidden', !!type);
    if (errSize) errSize.classList.toggle('hidden', !!sizeKey);
    if (!type || !sizeKey) return;
    if (!numPizzas || numPizzas < 1) {
      alert('Please enter at least 1 pizza.');
      return;
    }

    const useCustom = document.getElementById('settings-mode-toggle').checked;
    const recipe = PieLabJournal.getEffectiveRecipe(type, useCustom);
    if (!recipe) return;

    // ── Apply kitchen profile adjustments ──
    const profile = PieLabProfile.getProfile();
    const elevAdj = PieLabProfile.getElevationAdjustments(profile.elevation);
    const humidAdj = PieLabProfile.getHumidityAdjustments(profile.humidity);

    const totalHydrationDelta = elevAdj.hydrationDelta + humidAdj.hydrationDelta;
    const yeastMultiplier = elevAdj.yeastMultiplier;

    const adjustedRecipe = { ...recipe };
    if (totalHydrationDelta !== 0 || yeastMultiplier !== 1.0) {
      adjustedRecipe.hydration = Math.min(
        1.0,
        Math.max(0.4, recipe.hydration + totalHydrationDelta)
      );
      adjustedRecipe.yeastPct = Math.min(0.05, Math.max(0.001, recipe.yeastPct * yeastMultiplier));
    }

    // ── Dynamic Yeast Scaling (Exponential Q10 model, premium) ──
    let dynamicYeastActive = false;
    let fermentHoursVal = null;
    let fermentTempVal = null;
    let yeastTypeLabel = 'Instant Dry Yeast';
    if (PieLabPremium.canUse()) {
      const fhSlider = document.getElementById('ferment-hours');
      const ftSlider = document.getElementById('ferment-temp');
      const ytSelect = document.getElementById('yeast-type');
      if (
        fhSlider &&
        ftSlider &&
        !document.getElementById('yeast-scaling-controls').classList.contains('hidden')
      ) {
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
        const yeastType = ytSelect ? ytSelect.value : 'idy';
        const yeastMultiplier = { idy: 1, ady: 1.33, fresh: 2.5 };
        const multiplier = yeastMultiplier[yeastType] || 1;
        const yeastTypeLabels = {
          idy: 'Instant Dry Yeast',
          ady: 'Active Dry Yeast',
          fresh: 'Fresh Yeast',
        };
        yeastTypeLabel = yeastTypeLabels[yeastType] || 'Instant Dry Yeast';

        // Clamp after multiplier with per-type maximums
        const maxPct = { idy: 0.02, ady: 0.027, fresh: 0.05 };
        const clampMax = maxPct[yeastType] || 0.02;
        adjustedRecipe.yeastPct = Math.max(0.0005, Math.min(clampMax, rawIdyPct * multiplier));
        dynamicYeastActive = true;
      }
    }

    // ── Calculate ──
    lastRecipe = adjustedRecipe;
    const dough = calculateDough(adjustedRecipe, numPizzas, sizeKey);
    const sauce = calculateSauce(adjustedRecipe, numPizzas, sizeKey);
    const toppings = calculateToppings(adjustedRecipe, numPizzas, sizeKey);

    // ── Bowl Residue Compensation (+1.5%, Pro) ──
    const residueToggle = document.getElementById('bowl-residue-toggle');
    const residueOn = residueToggle?.checked || false;
    if (residueOn && PieLabPremium.canUse()) {
      dough.forEach((d) => {
        d.amount = round1(d.amount * 1.015);
      });
    } else if (residueToggle) {
      residueToggle.checked = false;
    }

    // ── Preferment Split ──
    const prefEnabled =
      prefermentToggle?.checked && PREFERMENT_STYLES.includes(type) && PieLabPremium.canUse();
    lastPreferment = null;
    if (prefEnabled) {
      const prefType = document.getElementById('preferment-type')?.value || 'poolish';
      const prefPct = parseInt(document.getElementById('preferment-pct')?.value || '25', 10) / 100;
      lastPreferment = splitPreferment(dough, prefType, prefPct);
    }
    const ovenTempF = adjustedRecipe.idealTemp ? adjustedRecipe.idealTemp.max : 500;
    const bakingInfo = getBakingInfo(adjustedRecipe, ovenTempF);

    // ── Render title ──
    const sizeLabel = recipe.sizes[sizeKey].label;
    const unitLabel = recipe.isSheet ? 'pan' : 'pizza';
    const countLabel = numPizzas === 1 ? `1 ${unitLabel}` : `${numPizzas} ${unitLabel}s`;
    document.getElementById('result-title').textContent = `${recipe.name} — ${countLabel}`;

    document.getElementById('result-badge').textContent = sizeLabel;

    // ── Adjustment notice ──
    let noticeEl = document.getElementById('adjustment-notice');
    if (!noticeEl) {
      noticeEl = document.createElement('div');
      noticeEl.id = 'adjustment-notice';
      const grid = document.querySelector('.results-grid');
      grid.parentNode.insertBefore(noticeEl, grid);
    }

    const adjustments = [];
    if (elevAdj.hydrationDelta !== 0) {
      adjustments.push(
        `Hydration ${elevAdj.hydrationDelta > 0 ? '+' : ''}${(elevAdj.hydrationDelta * 100).toFixed(0)}% for ${profile.elevation != null ? profile.elevation.toLocaleString() : 'your elevation'} ft elevation`
      );
    }
    if (humidAdj.hydrationDelta !== 0) {
      adjustments.push(
        `Hydration ${humidAdj.hydrationDelta > 0 ? '+' : ''}${(humidAdj.hydrationDelta * 100).toFixed(0)}% for ${profile.humidity} climate`
      );
    }
    if (yeastMultiplier !== 1.0) {
      const reduction = Math.round((1 - yeastMultiplier) * 100);
      adjustments.push(
        `Yeast \u2212${reduction}% for ${profile.elevation != null ? profile.elevation.toLocaleString() : 'your elevation'} ft elevation`
      );
    }

    if (adjustments.length > 0) {
      noticeEl.className = 'adjustment-notice';
      noticeEl.innerHTML = `<strong>Adjusted for your kitchen:</strong> ${adjustments.join(' \u00B7 ')}`;
    } else {
      noticeEl.className = 'adjustment-notice hidden';
      noticeEl.innerHTML = '';
    }

    // Cache raw gram data for unit toggle re-rendering
    lastDough = dough;
    lastSauce = sauce;
    lastToppings = toppings;

    // Render tables (unit-aware — driven by Kitchen measurement setting)
    // If preferment active, render both preferment table and modified final dough
    const prefResultEl = document.getElementById('preferment-result');
    const doughTitle = document.getElementById('dough-section-title');
    const prefTypeBadge = document.getElementById('preferment-type-badge');

    if (lastPreferment) {
      // Show preferment section
      prefResultEl.classList.remove('hidden');
      prefTypeBadge.textContent = lastPreferment.type === 'poolish' ? 'Poolish' : 'Biga';
      renderPrefermentTable(lastPreferment.preferment);

      // Render final dough (with preferment subtracted)
      doughTitle.textContent = 'Final Dough';
      lastDough = lastPreferment.finalDough;
      renderDoughTable(lastPreferment.finalDough);
    } else {
      prefResultEl.classList.add('hidden');
      doughTitle.textContent = 'Dough';
      renderDoughTable(dough);
    }

    // Bowl residue note
    const residueNote = document.getElementById('residue-note');
    if (residueNote) {
      residueNote.textContent = 'Includes +1.5% for bowl/mixer residue';
      residueNote.classList.toggle('hidden', !residueOn);
    }

    // Yeast scaling note
    const yeastNote = document.getElementById('yeast-note');
    if (yeastNote) {
      if (dynamicYeastActive) {
        const pct = (adjustedRecipe.yeastPct * 100).toFixed(2);
        const metricTempYeast = PieLabProfile.isMetricTemp();
        const tempStr = metricTempYeast ? `${fToC(fermentTempVal)}°C` : `${fermentTempVal}°F`;
        yeastNote.textContent = `${yeastTypeLabel} scaled to ${pct}% — ${fermentHoursVal}h at ${tempStr}`;
        yeastNote.classList.remove('hidden');
      } else {
        yeastNote.classList.add('hidden');
      }
    }

    renderSimpleTable('sauce-table', sauce);
    renderSimpleTable('toppings-table', toppings);

    // ── Step 1: Preheat ──
    const recTempF = bakingInfo.recommendedTemp;
    const _recTempC = fToC(recTempF);
    const preheatMinutes =
      typeof OVEN_PREHEAT_MINUTES !== 'undefined' && OVEN_PREHEAT_MINUTES[ovenType]
        ? OVEN_PREHEAT_MINUTES[ovenType]
        : 45;

    // ── Oven Calibration offset (from Kitchen profile) ──
    const ovenOffset = PieLabProfile.getProfile().ovenTempOffset || 0;
    const adjTempF = recTempF - ovenOffset;
    const adjTempC = fToC(adjTempF);
    const metricTempBake = PieLabProfile.isMetricTemp();
    const baseTempDisplay = metricTempBake ? `${adjTempC}\u00B0C` : `${adjTempF}\u00B0F`;
    const offsetNote =
      ovenOffset !== 0
        ? ` <span class="oven-offset-note">(adjusted ${ovenOffset > 0 ? '\u2212' : '+'}${Math.abs(ovenOffset)}\u00B0F for your oven)</span>`
        : '';
    const tempDisplay = baseTempDisplay + offsetNote;

    const preferredLabel = recipe.preferredOven ? OVEN_TYPES[recipe.preferredOven] || '' : '';
    const secondaryLabel = recipe.secondaryOven ? OVEN_TYPES[recipe.secondaryOven] || '' : '';

    // ── Step 0: Divide (multi-pizza only) ──
    const divideStep = document.getElementById('step-divide');
    const divideBody = document.getElementById('baking-divide');
    if (divideStep && divideBody) {
      if (numPizzas > 1) {
        const ballWt = adjustedRecipe.sizes[sizeKey].doughWeight;
        const metricWt = PieLabProfile.isMetricWeight();
        const wtDisplay =
          metricWt !== false ? `${ballWt}g` : `${Math.round(ballWt * 0.03527 * 10) / 10} oz`;
        divideBody.innerHTML = `<p>Divide your dough into <strong>${numPizzas} balls</strong> at <strong>${wtDisplay}</strong> each. Shape into tight rounds and let them rest covered before stretching.</p>`;
        divideStep.classList.remove('hidden');
      } else {
        divideStep.classList.add('hidden');
      }
    }

    // ── Step 1: Preheat ──
    let preheatHtml = `<p>Set your oven to <strong>${tempDisplay}</strong>. Preheat for at least ${preheatMinutes} minutes with your steel or stone inside.</p>`;
    if (preferredLabel) {
      preheatHtml += `<p class="bake-step-detail">Best oven: ${preferredLabel}`;
      if (secondaryLabel) preheatHtml += ` · Also works well: ${secondaryLabel}`;
      preheatHtml += `</p>`;
    }
    document.getElementById('baking-instructions').innerHTML = preheatHtml;

    // ── Step 2: Position ──
    const rackEl = document.getElementById('baking-rack');
    if (rackEl) {
      rackEl.innerHTML = recipe.rackPosition ? `<p>${recipe.rackPosition}</p>` : '';
      // Hide the step entirely if no position data
      const posStep = document.getElementById('step-position');
      if (posStep) posStep.classList.toggle('hidden', !recipe.rackPosition);
    }

    // ── Step 3: Bake ──
    const bakeTimeEl = document.getElementById('baking-time');
    if (bakeTimeEl) {
      const ovenSetup = OVEN_SETUPS.find((o) => o.id === ovenType);
      const ovenBake =
        ovenSetup && ovenSetup.styleBakeTimes ? ovenSetup.styleBakeTimes[type] : null;

      let bakeTimeHTML;
      if (ovenBake) {
        bakeTimeHTML = `<p>Bake for <strong>${ovenBake.time}</strong> at ${tempDisplay}.</p>`;
        if (ovenBake.note) {
          bakeTimeHTML += `<p class="bake-time-note">${ovenBake.note}</p>`;
        }
      } else {
        bakeTimeHTML = `<p>Bake for <strong>${bakingInfo.bakeTime}</strong> at ${tempDisplay}.</p>`;
      }
      bakeTimeEl.innerHTML = bakeTimeHTML;
    }

    // ── Make Your Dough — basic process steps ──
    renderDoughProcess(type, numPizzas, adjustedRecipe.sizes[sizeKey].doughWeight);

    // ── Tips — init slider for this style, then render ──
    _currentTips = recipe.tips || [];
    _currentStyleKey = type;
    if (initTipsSlider) initTipsSlider(type);
    if (renderTips) renderTips();

    // ── Contextual "Learn More" link (cross-page) ──
    const learnMoreEl = document.getElementById('results-learn-more');
    if (STYLE_LIBRARY[type]) {
      const styleName = STYLE_LIBRARY[type].name;
      learnMoreEl.innerHTML = `<a href="learn.html?style=${type}#styles" class="learn-more-link">Learn more about ${styleName} \u2192</a>`;
    } else {
      learnMoreEl.innerHTML = '';
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
        flourType: adjustedRecipe.flour || null,
        yeastType: dynamicYeastActive
          ? document.getElementById('yeast-type')?.value || 'idy'
          : null,
        fermentHours: fermentHoursVal || null,
        fermentTemp: fermentTempVal || null,
      },
      bakeTemp: recipe.idealTemp ? recipe.idealTemp.max : null,
      totalDoughWeight: Math.round(doughBallWeight * numPizzas),
      timestamp: Date.now(),
      // Premium feature state
      bowlResidue: residueOn,
      prefermentEnabled: prefEnabled,
      prefermentType: prefEnabled
        ? document.getElementById('preferment-type')?.value || null
        : null,
      prefermentFlourPct: prefEnabled
        ? parseInt(document.getElementById('preferment-pct')?.value || '25', 10)
        : null,
      dynamicYeast: dynamicYeastActive,
      fermentHours: fermentHoursVal,
      fermentTemp: fermentTempVal,
      yeastType: dynamicYeastActive ? document.getElementById('yeast-type')?.value || 'idy' : null,
    };

    // Preserve derivedFromId if user arrived via "Use as Starting Point"
    // and is still working with the same pizza style
    try {
      const existing = PieLabStorage.getJSON('pielab-last-calc') || {};
      if (existing.derivedFromId && existing.styleKey === type) {
        lastCalcData.derivedFromId = existing.derivedFromId;
      }
    } catch {
      /* ignore */
    }

    try {
      PieLabStorage.set('pielab-last-calc', lastCalcData);
      localStorage.setItem('pielab-pending-bake', JSON.stringify(lastCalcData));
    } catch {
      /* ignore storage errors */
    }

    // Save scaling memory for this style
    try {
      const mem = PieLabStorage.getJSON('pielab-scaling-memory') || {};
      mem[type] = { sizeKey, numPizzas, ovenType };
      PieLabStorage.set('pielab-scaling-memory', mem);
    } catch {
      /* ignore */
    }

    // ── Flour substitution row ──
    lastCalcContext = { adjustedRecipe, numPizzas, sizeKey };

    const flourSubRow = document.getElementById('flour-sub-row');
    const flourSubSelect = document.getElementById('flour-sub-select');
    const flourSubNote = document.getElementById('flour-sub-note');

    if (adjustedRecipe.flour && FLOUR_ABSORPTION[adjustedRecipe.flour] != null) {
      // Populate select with flour options (excluding recipe's own flour)
      flourSubSelect.innerHTML = '<option value="">— Use recommended flour —</option>';
      for (const flour of Object.keys(FLOUR_ABSORPTION)) {
        if (flour === adjustedRecipe.flour) continue;
        const opt = document.createElement('option');
        opt.value = flour;
        opt.textContent = flour;
        flourSubSelect.appendChild(opt);
      }
      flourSubRow.classList.remove('hidden');
    } else {
      flourSubRow.classList.add('hidden');
    }

    // Reset any previous flour substitution
    flourSubSelect.value = '';
    if (flourSubNote) {
      flourSubNote.className = 'flour-sub-note hidden';
      flourSubNote.innerHTML = '';
    }

    // ── Yeast substitution row ──
    const yeastSubRow = document.getElementById('yeast-sub-row');
    const yeastSubSelect = document.getElementById('yeast-sub-select');

    const YEAST_OPTIONS = [
      { value: 'idy', label: 'Instant Dry Yeast' },
      { value: 'ady', label: 'Active Dry Yeast' },
      { value: 'fresh', label: 'Fresh Yeast' },
    ];

    // Determine recipe's base yeast key
    const recYeast = (adjustedRecipe.yeast || 'Instant Dry Yeast').toLowerCase().trim();
    let recYeastKey = 'idy';
    if (recYeast.includes('active dry')) recYeastKey = 'ady';
    else if (recYeast.includes('fresh')) recYeastKey = 'fresh';

    // Populate options excluding recipe's own yeast type
    yeastSubSelect.innerHTML = '<option value="">— Use recommended yeast —</option>';
    for (const opt of YEAST_OPTIONS) {
      if (opt.value === recYeastKey) continue;
      const el = document.createElement('option');
      el.value = opt.value;
      el.textContent = opt.label;
      yeastSubSelect.appendChild(el);
    }
    yeastSubRow.classList.remove('hidden');
    yeastSubSelect.value = '';

    // Clear any previous yeast sub note
    const yeastSubNote = document.getElementById('yeast-sub-note');
    if (yeastSubNote) {
      yeastSubNote.className = 'flour-sub-note hidden';
      yeastSubNote.innerHTML = '';
    }

    // Show results
    const resultsEl = document.getElementById('results');
    resultsEl.classList.remove('hidden');
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.PieLabHaptics) PieLabHaptics.success();

    // ── Scheduler nudge ──────────────────────────────
    const calcCount = parseInt(localStorage.getItem('pielab-calc-count') || '0', 10) + 1;
    localStorage.setItem('pielab-calc-count', String(calcCount));

    const schedulerUsed = localStorage.getItem('pielab-scheduler-used');
    const nudgeDismissed = localStorage.getItem('pielab-scheduler-nudge-dismissed');
    const existingNudge = document.getElementById('sched-nudge');
    if (!schedulerUsed && !nudgeDismissed && calcCount >= 2 && !existingNudge) {
      const nudge = document.createElement('div');
      nudge.className = 'sched-nudge';
      nudge.id = 'sched-nudge';
      nudge.innerHTML = `
        <span>\u23F1 Want better flavor? Cold ferment takes 5 minutes to set up.</span>
        <a href="schedule.html" class="sched-nudge-link">Try the Scheduler \u2192</a>
        <button type="button" class="sched-nudge-dismiss" aria-label="Dismiss">\u00D7</button>
      `;
      resultsEl.insertBefore(nudge, resultsEl.firstChild);
      nudge.querySelector('.sched-nudge-dismiss').addEventListener('click', () => {
        localStorage.setItem('pielab-scheduler-nudge-dismissed', '1');
        nudge.remove();
      });
    }
  });

  // ── "Schedule This Bake" prefills scheduler ──────────
  document.getElementById('btn-schedule-bake').addEventListener('click', () => {
    if (!lastCalcContext) return;
    const { numPizzas, sizeKey } = lastCalcContext;
    const type = document.getElementById('pizza-type').value;
    try {
      const planData = {
        styleKey: type,
        sizeKey: sizeSelect.value,
        quantity: numPizzas,
        calcResult: { doughBallWeight: lastCalcContext.adjustedRecipe.sizes[sizeKey].doughWeight },
      };
      PieLabStorage.set('pielab-plan-prefill', planData);
    } catch {
      /* ignore */
    }
    window.location.href = 'schedule.html?prefill=1';
  });

  // ── "Copy Shopping List" — formats ingredients and copies to clipboard ──
  document.getElementById('btn-copy-list').addEventListener('click', () => {
    if (!lastDough) {
      showToast('Calculate a recipe first');
      return;
    }

    const CATEGORIES = {
      'Flour & Dry': /flour|salt|sugar|yeast|semolina|cornmeal|tipo/i,
      Dairy: /mozzarella|parmesan|pecorino|ricotta|cheese|butter|cream/i,
      Produce: /tomato|basil|garlic|onion|pepper|olive|mushroom|arugula|oregano|herb/i,
    };

    const all = [
      ...(lastDough || []).map((d) => ({ name: d.ingredient, amount: d.amount })),
      ...(lastSauce || []).map((d) => ({ name: d.ingredient, amount: d.amount })),
      ...(lastToppings || []).map((d) => ({ name: d.ingredient, amount: d.amount })),
    ];

    const grouped = { 'Flour & Dry': [], Dairy: [], Produce: [], Other: [] };
    all.forEach((item) => {
      let placed = false;
      for (const [cat, regex] of Object.entries(CATEGORIES)) {
        if (regex.test(item.name)) {
          grouped[cat].push(item);
          placed = true;
          break;
        }
      }
      if (!placed) grouped['Other'].push(item);
    });

    const title = document.getElementById('result-title')?.textContent || 'Recipe';
    let text = `Shopping List \u2014 ${title}\n`;
    for (const [cat, items] of Object.entries(grouped)) {
      if (!items.length) continue;
      text += `\n${cat.toUpperCase()}\n`;
      items.forEach((item) => {
        text += `- ${item.name}: ${formatAmount(item.amount, item.name)}\n`;
      });
    }

    navigator.clipboard.writeText(text.trim()).then(
      () => showToast('Shopping list copied!'),
      () => showToast('Could not copy — try again')
    );
  });

  // ── "Log This Bake" navigates to journal page ────────
  document.getElementById('btn-log-bake').addEventListener('click', () => {
    window.location.href = 'journal.html?prefill=1';
  });

  // ── Bowl Residue Pro gate ─────────────────────────────
  const bowlResidueToggle = document.getElementById('bowl-residue-toggle');
  if (bowlResidueToggle) {
    bowlResidueToggle.addEventListener('change', () => {
      if (bowlResidueToggle.checked) {
        bowlResidueToggle.checked = false;
        PieLabPremium.verifyAndGate(() => {
          bowlResidueToggle.checked = true;
        });
      }
    });
  }

  // ── Flour Substitution Handler ───────────────────────
  document.getElementById('flour-sub-select').addEventListener('change', () => {
    if (!lastCalcContext) return;

    const select = document.getElementById('flour-sub-select');
    const selectedFlour = select.value;
    const { adjustedRecipe, numPizzas, sizeKey } = lastCalcContext;

    // Manage the flour-sub-note element (above dough table)
    let noteEl = document.getElementById('flour-sub-note');
    if (!noteEl) {
      noteEl = document.createElement('div');
      noteEl.id = 'flour-sub-note';
      const doughTable = document.getElementById('dough-table');
      doughTable.parentNode.insertBefore(noteEl, doughTable);
    }

    // Reset: restore original dough table
    if (!selectedFlour) {
      const dough = calculateDough(adjustedRecipe, numPizzas, sizeKey);
      lastDough = dough;
      renderDoughTable(dough);
      noteEl.className = 'flour-sub-note hidden';
      noteEl.innerHTML = '';
      // Restore original flour type in stored data
      try {
        const stored = PieLabStorage.getJSON('pielab-last-calc') || {};
        if (stored.doughSnapshot) {
          stored.doughSnapshot.flourType = adjustedRecipe.flour || null;
          stored.doughSnapshot.hydration = adjustedRecipe.hydration;
          PieLabStorage.set('pielab-last-calc', stored);
        }
      } catch {
        /* ignore */
      }
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
    subRecipe.hydration = Math.min(1.0, Math.max(0.4, adjustedRecipe.hydration + hydrationDelta));

    // Recalculate and re-render dough table only
    const dough = calculateDough(subRecipe, numPizzas, sizeKey);
    lastDough = dough;
    renderDoughTable(dough);

    // Update stored flour type in lastCalcData so journal prefill gets the substitute
    try {
      const stored = PieLabStorage.getJSON('pielab-last-calc') || {};
      if (stored.doughSnapshot) {
        stored.doughSnapshot.flourType = selectedFlour;
        stored.doughSnapshot.hydration = subRecipe.hydration;
        PieLabStorage.set('pielab-last-calc', stored);
      }
    } catch {
      /* ignore */
    }

    // If Custom mode is active, update the hydration field and save
    const toggle = document.getElementById('settings-mode-toggle');
    if (toggle && toggle.checked) {
      const hydField = document.getElementById('ps-hydration');
      if (hydField) hydField.value = (subRecipe.hydration * 100).toFixed(1);

      const styleKey = document.getElementById('pizza-type').value;
      if (styleKey) {
        const current = PieLabJournal.getPersonalSettings(styleKey) || {};
        current.hydration = subRecipe.hydration;
        PieLabJournal.savePersonalSettings(styleKey, current);
      }
    }

    // Compatibility badge
    let badgeClass, badgeText, noteClass;
    if (absDelta <= 0.04) {
      badgeClass = 'badge-great';
      badgeText = 'Works great';
      noteClass = 'compat-great';
    } else if (absDelta <= 0.08) {
      badgeClass = 'badge-workable';
      badgeText = 'Workable';
      noteClass = 'compat-workable';
    } else {
      badgeClass = 'badge-significant';
      badgeText = 'Significant difference \u2014 result will vary';
      noteClass = 'compat-significant';
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
    tbody.innerHTML = '';
    rows.forEach((cols) => {
      const tr = document.createElement('tr');
      tr.innerHTML = cols.map((c) => `<td>${c}</td>`).join('');
      tbody.appendChild(tr);
    });
  }

  // ── Make Your Dough — simplified process steps for beginners ──
  // Per-style shaping instructions
  const SHAPING_INSTRUCTIONS = {
    neapolitan:
      'Gently flatten each ball with your fingertips, leaving a puffy rim. Drape over your knuckles and let gravity stretch it into a 10\u201312\u2033 round.',
    'new-york':
      'Press each ball flat, then use your knuckles to stretch into a 14\u201316\u2033 round. A rolling pin is fine for beginners \u2014 just don\u2019t crush the rim.',
    detroit:
      'Press the dough into an oiled Detroit-style pan. Use flat palms with firm presses. Let it rest 15 min, then press again to fill corners.',
    'chicago-deep':
      'Press the dough into a buttered deep-dish pan, pushing it up the sides about 1.5\u2033. The dough should be slightly thicker at the edges.',
    'chicago-tavern':
      'Run the dough through a sheeter or roll with a pin until paper-thin (~1/8\u2033). Dock the entire surface with a fork \u2014 no bubbles allowed.',
    sicilian:
      'Press into an oiled sheet pan. Use flat palms and let the dough rest between presses. It should fill the pan evenly, slightly thicker at edges.',
    pan: 'Press into a well-oiled cast iron or cake pan. Push to the edges. The oil will fry the bottom during baking for a golden crust.',
    'school-night':
      'Pat or roll the dough into a rough round on a floured surface. This no-rise dough won\u2019t stretch like yeasted dough \u2014 just shape and go.',
    'st-louis':
      'Roll the dough very thin with a rolling pin on a floured surface. St. Louis style uses a cracker-thin, yeast-free crust.',
    grandma:
      'Press into an oiled sheet pan. Dimple the surface with your fingertips. Let it proof in the pan 30\u201345 min before topping.',
    bar: 'Press into a well-oiled sheet pan or quarter sheet. The dough is thin and crispy \u2014 stretch it evenly to the edges.',
    roman:
      'Stretch gently into a large oval or rectangle on a floured peel. Roman dough is very wet \u2014 use plenty of flour and work quickly.',
    'coal-fired':
      'Stretch by hand like Neapolitan but slightly larger and thinner. Coal-fired pizza cooks fast, so the dough should be thin and even.',
  };

  function renderDoughProcess(styleKey, numPizzas, doughBallWeight) {
    const stepsEl = document.getElementById('dough-process-steps');
    const methodEl = document.getElementById('dough-process-method');
    if (!stepsEl || !methodEl) return;

    const shapingNote =
      SHAPING_INSTRUCTIONS[styleKey] ||
      'Flatten each ball gently, then stretch or roll to your desired size and shape.';
    const ballText =
      numPizzas > 1
        ? `Portion into <strong>${numPizzas} balls</strong> at <strong>${doughBallWeight}g each</strong>. Tuck edges underneath to form tight, smooth rounds.`
        : `Shape into a tight, smooth ball by tucking edges underneath. Your dough ball is <strong>${doughBallWeight}g</strong>.`;

    methodEl.textContent = 'Same-day method \u00B7 ~4 hours total';

    stepsEl.innerHTML = `
      <li class="dough-process-step">
        <span class="dough-process-step-title">Mix</span>
        <p>Combine flour, water, salt, and yeast in a large bowl. Mix until no dry flour remains, then knead on a clean surface for 8\u201310 minutes until smooth and elastic.</p>
      </li>
      <li class="dough-process-step">
        <span class="dough-process-step-title">Rise</span>
        <p>Lightly oil the bowl, return the dough, and cover with plastic wrap or a damp towel. Let rest at room temperature for 2\u20134 hours until roughly doubled in size.</p>
      </li>
      <li class="dough-process-step">
        <span class="dough-process-step-title">Divide</span>
        <p>Turn the dough out onto a lightly floured surface. ${ballText}</p>
      </li>
      <li class="dough-process-step">
        <span class="dough-process-step-title">Rest</span>
        <p>Space the dough balls on a floured tray or in individual containers. Cover and let relax at room temperature for 30\u201360 minutes until soft and pliable.</p>
      </li>
      <li class="dough-process-step">
        <span class="dough-process-step-title">Shape</span>
        <p>${shapingNote}</p>
      </li>
    `;
  }

  function renderDoughTable(dough) {
    const th = document.querySelector('#dough-table thead th:nth-child(2)');
    if (th) th.textContent = unitColumnHeader();

    fillTable(
      'dough-table',
      dough.map((d) => {
        const nameCell =
          d.ingredient === 'Water'
            ? `Water <button class="hydration-info-btn" type="button" aria-label="Hydration guide">\u24D8</button>`
            : d.ingredient;
        return [nameCell, formatAmount(d.amount, d.ingredient), `${d.pct}%`];
      })
    );

    // Total batch weight
    const totalGrams = dough.reduce((sum, d) => sum + d.amount, 0);
    const totalEl = document.getElementById('dough-total-amount');
    if (totalEl) totalEl.textContent = formatAmount(Math.round(totalGrams), 'Total');

    // Per dough ball weight (shown when making multiple pizzas)
    const ballRow = document.getElementById('dough-ball-row');
    const ballEl = document.getElementById('dough-ball-amount');
    if (ballRow && ballEl) {
      const count = parseInt(document.getElementById('num-pizzas')?.value) || 1;
      if (count > 1) {
        ballEl.textContent = formatAmount(Math.round(totalGrams / count), 'Total');
        ballRow.classList.remove('hidden');
      } else {
        ballRow.classList.add('hidden');
      }
    }
  }

  function renderPrefermentTable(prefIngredients) {
    const th = document.querySelector('#preferment-table thead th:nth-child(2)');
    if (th) th.textContent = unitColumnHeader();

    fillTable(
      'preferment-table',
      prefIngredients.map((d) => [d.ingredient, formatAmount(d.amount, d.ingredient), `${d.pct}%`])
    );
  }

  function renderSimpleTable(tableId, rows) {
    const th = document.querySelector(`#${tableId} thead th:nth-child(2)`);
    if (th) th.textContent = unitColumnHeader();

    fillTable(
      tableId,
      rows.map((r) => [r.ingredient, formatAmount(r.amount, r.ingredient)])
    );
  }

  // ── Hydration Guide Popover (delegated) ─────────────
  document.getElementById('dough-table').addEventListener('click', (e) => {
    const btn = e.target.closest('.hydration-info-btn');
    if (!btn || !lastRecipe) return;

    e.stopPropagation();

    // Close any existing popover
    const existing = document.querySelector('.hydration-popover');
    if (existing) {
      existing.remove();
      return;
    }

    const guide = HYDRATION_GUIDE[lastRecipe.flour];
    if (!guide) return;

    const popover = document.createElement('div');
    popover.className = 'hydration-popover';

    let brandsHtml = guide.brandNotes
      .map((b) => `<li><strong>${b.brand}:</strong> ${b.note}</li>`)
      .join('');

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
    const cell = btn.closest('td');
    cell.style.position = 'relative';
    cell.appendChild(popover);

    // Close handlers
    popover.querySelector('.popover-close').addEventListener('click', (ev) => {
      ev.stopPropagation();
      popover.remove();
    });

    document.addEventListener('click', function closeOnOutside(ev) {
      if (!popover.contains(ev.target) && ev.target !== btn) {
        popover.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    });
  });

  // ── Tools & Equipment Popover ──────────────────────
  document.getElementById('tools-info-btn').addEventListener('click', (e) => {
    e.stopPropagation();

    // Close any existing popover
    const existing = document.querySelector('.tools-popover');
    if (existing) {
      existing.remove();
      return;
    }

    const type = document.getElementById('pizza-type').value;
    if (!type) return;

    const styleTools = STYLE_TOOLS[type];
    const commonTools = STYLE_TOOLS._common || [];
    if (!styleTools) return;

    const styleName = PIZZA_RECIPES[type] ? PIZZA_RECIPES[type].name : type;

    const commonHtml = commonTools
      .map((t) => `<li><strong>${t.name}</strong> \u2014 ${t.desc}</li>`)
      .join('');

    const styleHtml = styleTools.tools
      .map((t) => `<li><strong>${t.name}</strong> \u2014 ${t.desc}</li>`)
      .join('');

    const popover = document.createElement('div');
    popover.className = 'tools-popover';
    popover.innerHTML = `
      <div class="popover-header">
        <span class="popover-title">Tools & Equipment</span>
        <button class="popover-close" type="button" aria-label="Close">&times;</button>
      </div>
      <div class="popover-body">
        <div class="popover-section">
          <h4>${styleName} Essentials</h4>
          <ul class="tools-list">${styleHtml}</ul>
        </div>
        <div class="popover-section">
          <h4>Every Bake</h4>
          <ul class="tools-list">${commonHtml}</ul>
        </div>
      </div>
    `;

    const anchor = document.getElementById('tools-info-btn').closest('.form-group');
    anchor.style.position = 'relative';
    anchor.appendChild(popover);

    popover.querySelector('.popover-close').addEventListener('click', (ev) => {
      ev.stopPropagation();
      popover.remove();
    });

    document.addEventListener('click', function closeOnOutside(ev) {
      if (!popover.contains(ev.target) && ev.target !== e.target) {
        popover.remove();
        document.removeEventListener('click', closeOnOutside);
      }
    });
  });

  // ── Yeast Substitution Handler ────────────────────
  document.getElementById('yeast-sub-select').addEventListener('change', () => {
    if (!lastCalcContext) return;

    const select = document.getElementById('yeast-sub-select');
    const selectedYeast = select.value;
    const { adjustedRecipe, numPizzas, sizeKey } = lastCalcContext;

    // Yeast conversion factors relative to IDY (1g IDY base)
    const YEAST_FACTORS = { idy: 1, ady: 1.25, fresh: 3 };
    const YEAST_LABELS = {
      idy: 'Instant Dry Yeast',
      ady: 'Active Dry Yeast',
      fresh: 'Fresh Yeast',
    };

    // Determine recipe's base yeast type key
    const recipeYeastName = (adjustedRecipe.yeast || 'Instant Dry Yeast').toLowerCase().trim();
    let recipeYeastKey = 'idy';
    if (recipeYeastName.includes('active dry')) recipeYeastKey = 'ady';
    else if (recipeYeastName.includes('fresh')) recipeYeastKey = 'fresh';

    // Manage the yeast-sub-note element
    let noteEl = document.getElementById('yeast-sub-note');
    if (!noteEl) {
      noteEl = document.createElement('div');
      noteEl.id = 'yeast-sub-note';
      const doughTable = document.getElementById('dough-table');
      doughTable.parentNode.insertBefore(noteEl, doughTable);
    }

    // Reset: restore original dough table
    if (!selectedYeast) {
      const dough = calculateDough(adjustedRecipe, numPizzas, sizeKey);
      lastDough = dough;
      renderDoughTable(dough);
      noteEl.className = 'flour-sub-note hidden';
      noteEl.innerHTML = '';
      return;
    }

    // Hide the option matching the recipe's own yeast type
    // (already filtered out below)
    if (selectedYeast === recipeYeastKey) {
      select.value = '';
      return;
    }

    // Recalculate dough with converted yeast amount
    const conversionFactor = YEAST_FACTORS[selectedYeast] / YEAST_FACTORS[recipeYeastKey];
    const subRecipe = { ...adjustedRecipe };
    subRecipe.yeastPct = adjustedRecipe.yeastPct * conversionFactor;

    const dough = calculateDough(subRecipe, numPizzas, sizeKey);

    // Rename the yeast ingredient row
    dough.forEach((d) => {
      if (/yeast/i.test(d.ingredient)) {
        d.ingredient = YEAST_LABELS[selectedYeast];
      }
    });

    lastDough = dough;
    renderDoughTable(dough);

    const origLabel = YEAST_LABELS[recipeYeastKey];
    const subLabel = YEAST_LABELS[selectedYeast];
    const noteText =
      selectedYeast === 'ady'
        ? 'Active Dry Yeast should be dissolved in warm water (100\u2013110\u00B0F) for 5\u201310 minutes before adding to the dough.'
        : selectedYeast === 'fresh'
          ? 'Crumble Fresh Yeast directly into the flour or dissolve in lukewarm water. Use within 2 weeks of purchase.'
          : 'Instant Dry Yeast can be mixed directly into the flour \u2014 no activation needed.';

    noteEl.className = 'flour-sub-note compat-great';
    noteEl.innerHTML =
      `Using <strong>${subLabel}</strong> instead of <strong>${origLabel}</strong>. ` +
      `Amount adjusted automatically. <br><em>${noteText}</em>`;
  });

  // ══════════════════════════════════════════════════════
  // ── Settings Toggle ─────────────────────────────────
  // ══════════════════════════════════════════════════════
  (() => {
    const toggle = document.getElementById('settings-mode-toggle');
    const labelRec = document.getElementById('toggle-label-rec');
    const labelCustom = document.getElementById('toggle-label-custom');
    const editor = document.getElementById('custom-settings-editor');
    const styleSelect = document.getElementById('pizza-type');
    const customStyleLabel = document.getElementById('custom-style-label');

    const fields = {
      hydration: document.getElementById('ps-hydration'),
      saltPct: document.getElementById('ps-salt'),
      oilPct: document.getElementById('ps-oil'),
      sugarPct: document.getElementById('ps-sugar'),
      yeastPct: document.getElementById('ps-yeast'),
      doughBallWeight: document.getElementById('ps-dough-weight'),
    };

    function updateToggleLabels() {
      const isCustom = toggle.checked;
      labelRec.classList.toggle('active', !isCustom);
      labelCustom.classList.toggle('active', isCustom);
    }

    function showEditor() {
      const styleKey = styleSelect.value;
      if (!toggle.checked || !styleKey) {
        editor.classList.add('hidden');
        return;
      }

      const recipe = PIZZA_RECIPES[styleKey];
      if (!recipe) {
        editor.classList.add('hidden');
        return;
      }

      const personal = PieLabJournal.getPersonalSettings(styleKey);
      const sizeKeys = Object.keys(recipe.sizes);
      const defaultDoughWeight = recipe.sizes[sizeKeys[0]].doughWeight;

      customStyleLabel.textContent = `\u2014 ${recipe.name}`;

      fields.hydration.value =
        personal?.hydration != null
          ? (personal.hydration * 100).toFixed(1)
          : (recipe.hydration * 100).toFixed(1);
      fields.saltPct.value =
        personal?.saltPct != null
          ? (personal.saltPct * 100).toFixed(1)
          : (recipe.saltPct * 100).toFixed(1);
      fields.oilPct.value =
        personal?.oilPct != null
          ? (personal.oilPct * 100).toFixed(1)
          : (recipe.oilPct * 100).toFixed(1);
      fields.sugarPct.value =
        personal?.sugarPct != null
          ? (personal.sugarPct * 100).toFixed(1)
          : (recipe.sugarPct * 100).toFixed(1);
      fields.yeastPct.value =
        personal?.yeastPct != null
          ? (personal.yeastPct * 100).toFixed(2)
          : (recipe.yeastPct * 100).toFixed(2);
      fields.doughBallWeight.placeholder = `${defaultDoughWeight}g (default)`;
      if (personal?.doughBallWeight != null) {
        fields.doughBallWeight.value = personal.doughBallWeight;
      } else {
        fields.doughBallWeight.value = '';
      }

      editor.classList.remove('hidden');

      // Show fermentation tuning if user has Pro access
      const yeastControls = document.getElementById('yeast-scaling-controls');
      if (yeastControls) {
        const isPro = PieLabPremium.canUse();
        yeastControls.classList.toggle('hidden', !isPro);
      }
    }

    function saveCurrentSettings() {
      const styleKey = styleSelect.value;
      if (!styleKey || !toggle.checked) return;

      const settings = {
        hydration: parseFloat(fields.hydration.value) / 100,
        saltPct: parseFloat(fields.saltPct.value) / 100,
        oilPct: parseFloat(fields.oilPct.value) / 100,
        sugarPct: parseFloat(fields.sugarPct.value) / 100,
        yeastPct: parseFloat(fields.yeastPct.value) / 100,
      };
      const dbwVal = fields.doughBallWeight.value.trim();
      if (dbwVal !== '') settings.doughBallWeight = parseFloat(dbwVal);
      PieLabJournal.savePersonalSettings(styleKey, settings);
    }

    // Events
    toggle.addEventListener('change', () => {
      updateToggleLabels();
      showEditor();
    });

    styleSelect.addEventListener('change', showEditor);

    // Update dough ball placeholder when pizza size changes
    const sizeSelectForPlaceholder = document.getElementById('pizza-size');
    if (sizeSelectForPlaceholder) {
      sizeSelectForPlaceholder.addEventListener('change', () => {
        const sk = styleSelect.value;
        const recipe = sk ? PIZZA_RECIPES[sk] : null;
        if (recipe && recipe.sizes[sizeSelectForPlaceholder.value]) {
          fields.doughBallWeight.placeholder = `${recipe.sizes[sizeSelectForPlaceholder.value].doughWeight}g (default)`;
        }
      });
    }

    Object.values(fields).forEach((input) => {
      input.addEventListener('blur', saveCurrentSettings);
      input.addEventListener('change', saveCurrentSettings);
    });

    document.getElementById('btn-reset-custom').addEventListener('click', () => {
      const styleKey = styleSelect.value;
      if (styleKey) {
        PieLabJournal.deletePersonalSettings(styleKey);
        showEditor();
      }
    });

    // Init labels
    updateToggleLabels();
  })();

  // ── Custom Dough Profiles (Pro) ────────────────────
  (() => {
    const saveBtn = document.getElementById('btn-save-profile');
    const loaderEl = document.getElementById('profile-loader');
    const profileSelect = document.getElementById('profile-select');
    const deleteBtn = document.getElementById('btn-delete-profile');
    const styleSelect = document.getElementById('pizza-type');
    if (!saveBtn || !loaderEl || !profileSelect) return;

    function refreshProfileList() {
      const styleKey = styleSelect.value;
      if (!styleKey) {
        loaderEl.classList.add('hidden');
        return;
      }
      const profiles = PieLabJournal.getProfilesByStyle(styleKey);
      if (profiles.length === 0) {
        loaderEl.classList.add('hidden');
        return;
      }
      profileSelect.innerHTML =
        '<option value="" disabled selected>Select a saved dough\u2026</option>';
      profiles.forEach((p) => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name + ' (' + new Date(p.createdAt).toLocaleDateString() + ')';
        profileSelect.appendChild(opt);
      });
      loaderEl.classList.remove('hidden');
    }

    // Refresh when style changes
    styleSelect.addEventListener('change', refreshProfileList);

    // Save profile
    saveBtn.addEventListener('click', () => {
      PieLabPremium.verifyAndGate(() => {
        const styleKey = styleSelect.value;
        if (!styleKey) return;
        const name = prompt('Name this dough:');
        if (!name || !name.trim()) return;
        const dbwRaw = document.getElementById('ps-dough-weight').value.trim();
        const recipe = PIZZA_RECIPES[styleKey];
        const sizeKey = document.getElementById('pizza-size')?.value;
        const defaultDbw =
          recipe && sizeKey && recipe.sizes[sizeKey]
            ? recipe.sizes[sizeKey].doughWeight
            : recipe
              ? recipe.sizes[Object.keys(recipe.sizes)[0]].doughWeight
              : 250;
        const fields = {
          hydration: parseFloat(document.getElementById('ps-hydration').value) / 100,
          saltPct: parseFloat(document.getElementById('ps-salt').value) / 100,
          oilPct: parseFloat(document.getElementById('ps-oil').value) / 100,
          sugarPct: parseFloat(document.getElementById('ps-sugar').value) / 100,
          yeastPct: parseFloat(document.getElementById('ps-yeast').value) / 100,
          doughBallWeight: dbwRaw !== '' ? parseFloat(dbwRaw) : defaultDbw,
        };
        // Capture flour, yeast type, and ferment data from current calculation
        try {
          const stored = PieLabStorage.getJSON('pielab-last-calc') || {};
          const snap = stored.doughSnapshot;
          if (snap) {
            if (snap.flourType) fields.flourType = snap.flourType;
            if (snap.yeastType) fields.yeastType = snap.yeastType;
            if (snap.fermentHours) fields.fermentHours = snap.fermentHours;
            if (snap.fermentTemp) fields.fermentTemp = snap.fermentTemp;
          }
        } catch {
          /* ignore */
        }
        PieLabJournal.saveProfile({ name: name.trim(), styleKey, settings: fields });
        refreshProfileList();
      });
    });

    // Load profile
    profileSelect.addEventListener('change', () => {
      PieLabPremium.verifyAndGate(() => {
        const id = profileSelect.value;
        if (!id) return;
        const profiles = PieLabJournal.getAllProfiles();
        const profile = profiles.find((p) => p.id === id);
        if (!profile || !profile.settings) return;
        const s = profile.settings;
        if (s.hydration != null)
          document.getElementById('ps-hydration').value = (s.hydration * 100).toFixed(1);
        if (s.saltPct != null)
          document.getElementById('ps-salt').value = (s.saltPct * 100).toFixed(1);
        if (s.oilPct != null) document.getElementById('ps-oil').value = (s.oilPct * 100).toFixed(1);
        if (s.sugarPct != null)
          document.getElementById('ps-sugar').value = (s.sugarPct * 100).toFixed(1);
        if (s.yeastPct != null)
          document.getElementById('ps-yeast').value = (s.yeastPct * 100).toFixed(2);
        if (s.doughBallWeight != null)
          document.getElementById('ps-dough-weight').value = s.doughBallWeight;
        // Auto-save as current personal settings
        PieLabJournal.savePersonalSettings(profile.styleKey, s);
      });
    });

    // Delete profile
    deleteBtn.addEventListener('click', () => {
      const id = profileSelect.value;
      if (!id) return;
      PieLabJournal.deleteProfile(id);
      refreshProfileList();
    });

    // Initial render
    refreshProfileList();
  })();

  // ── "Cook This Again" / "Use as Starting Point" loader (?load=1) ──
  (() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('load') !== '1') return;

    try {
      const raw = PieLabStorage.get('pielab-last-calc');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data || !data.styleKey) return;

      // 1. Set pizza style (triggers size selector population)
      const typeSelect = document.getElementById('pizza-type');
      if (typeSelect) {
        typeSelect.value = data.styleKey;
        typeSelect.dispatchEvent(new Event('change'));
      }

      // 2. Set oven type
      if (data.ovenType) {
        const ovenSelect = document.getElementById('calc-oven-type');
        if (ovenSelect && ovenSelect.querySelector(`option[value="${data.ovenType}"]`)) {
          ovenSelect.value = data.ovenType;
        }
      }

      // 3. Set number of pizzas
      if (data.numPizzas) {
        const numInput = document.getElementById('num-pizzas');
        if (numInput) numInput.value = data.numPizzas;
      }

      // 4. Set pizza size if we have one
      if (data.sizeKey) {
        const sizeSelect = document.getElementById('pizza-size');
        if (sizeSelect && sizeSelect.querySelector(`option[value="${data.sizeKey}"]`)) {
          sizeSelect.value = data.sizeKey;
        }
      }

      // 5. If we have a doughSnapshot (from "Use as Starting Point"),
      //    switch to Custom mode and populate the fields
      if (data.doughSnapshot) {
        const snap = data.doughSnapshot;
        const toggle = document.getElementById('settings-mode-toggle');
        const editor = document.getElementById('custom-settings-editor');
        const labelRec = document.getElementById('toggle-label-rec');
        const labelCustom = document.getElementById('toggle-label-custom');
        const customStyleLabel = document.getElementById('custom-style-label');

        // Switch toggle to Custom
        if (toggle && !toggle.checked) {
          toggle.checked = true;
          labelRec.classList.remove('active');
          labelCustom.classList.add('active');
        }

        // Save the snapshot values as custom settings for this style
        // so getEffectiveRecipe() picks them up on Calculate
        const customSettings = {};
        if (snap.hydration != null) customSettings.hydration = snap.hydration;
        if (snap.saltPct != null) customSettings.saltPct = snap.saltPct;
        if (snap.oilPct != null) customSettings.oilPct = snap.oilPct;
        if (snap.sugarPct != null) customSettings.sugarPct = snap.sugarPct;
        if (snap.yeastPct != null) customSettings.yeastPct = snap.yeastPct;
        if (snap.doughBallWeight != null) customSettings.doughBallWeight = snap.doughBallWeight;

        PieLabJournal.savePersonalSettings(data.styleKey, customSettings);

        // Populate the visible editor fields
        const fieldMap = {
          hydration: { el: document.getElementById('ps-hydration'), mult: 100, dec: 1 },
          saltPct: { el: document.getElementById('ps-salt'), mult: 100, dec: 1 },
          oilPct: { el: document.getElementById('ps-oil'), mult: 100, dec: 1 },
          sugarPct: { el: document.getElementById('ps-sugar'), mult: 100, dec: 1 },
          yeastPct: { el: document.getElementById('ps-yeast'), mult: 100, dec: 2 },
          doughBallWeight: { el: document.getElementById('ps-dough-weight'), mult: 1, dec: 0 },
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
        if (editor) editor.classList.remove('hidden');
      }

      // Scroll to calculator
      const calcCard = document.querySelector('.calculator-card');
      if (calcCard) {
        setTimeout(() => calcCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      }

      // 6. If ferment data present, switch to Plan My Bake mode and populate
      if (
        data.fermentHours ||
        data.yeastType ||
        (data.doughSnapshot && data.doughSnapshot.yeastType)
      ) {
        const yeastTypeVal =
          data.yeastType || (data.doughSnapshot && data.doughSnapshot.yeastType) || null;
        if (yeastTypeVal) {
          const ytSelect = document.getElementById('yeast-type');
          if (ytSelect && ytSelect.querySelector(`option[value="${yeastTypeVal}"]`)) {
            ytSelect.value = yeastTypeVal;
          }
        }
      }

      // Clean URL so reload doesn't re-trigger
      history.replaceState(null, '', window.location.pathname);
    } catch {
      // Silently ignore malformed data
    }
  })();

  // ── Print & New Recipe buttons (no inline handlers) ──
  const btnPrint = document.getElementById('btn-print');
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());

  const btnReset = document.getElementById('btn-reset');
  if (btnReset)
    btnReset.addEventListener('click', () => {
      document.getElementById('results').classList.add('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  // Clear validation errors when user changes selection
  const typeSelect = document.getElementById('pizza-type');
  const sizeSelect2 = document.getElementById('pizza-size');
  if (typeSelect)
    typeSelect.addEventListener('change', () => {
      const err = document.getElementById('err-pizza-type');
      if (err) err.classList.add('hidden');
      // Style change auto-populates size, so clear that error too
      const errSize = document.getElementById('err-pizza-size');
      if (errSize) errSize.classList.add('hidden');
    });
  if (sizeSelect2)
    sizeSelect2.addEventListener('change', () => {
      const err = document.getElementById('err-pizza-size');
      if (err) err.classList.add('hidden');
    });
}); // end DOMContentLoaded

// ── Tiered Tips & Skill Level Slider ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const LEVEL_LABELS = ['beginner', 'intermediate', 'pro'];
  const LEVEL_DISPLAY = { beginner: 'Beginner', intermediate: 'Intermediate', pro: 'Pro' };

  const slider = document.getElementById('tips-level-slider');
  const badge = document.getElementById('tips-level-badge');
  const tipsList = document.getElementById('pro-tips');

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
    badge.textContent = LEVEL_DISPLAY[level] || 'Beginner';
    badge.className = 'tips-level-badge tips-level-badge--' + level;
  }

  renderTips = function () {
    if (!tipsList) return;
    const level = getActiveLevel();
    const tips = _currentTips.filter((t) => t.level === level);
    tipsList.innerHTML = '';
    if (!tips.length) {
      const li = document.createElement('li');
      li.textContent = 'Calculate a recipe to see tips.';
      li.classList.add('text-muted');
      tipsList.appendChild(li);
      return;
    }
    tips.forEach(({ tip }) => {
      const li = document.createElement('li');
      li.textContent = tip;
      tipsList.appendChild(li);
    });
  };

  // ── Initialize slider from saved profile (or bake count) ───────────────
  // Called each time a style is calculated so the default updates per style.
  initTipsSlider = function (styleKey) {
    if (!styleKey || !slider) return;

    // 1. Check for a manually saved level
    const saved = PieLabProfile.getStyleLevel(styleKey);

    if (saved) {
      setSliderToLevel(saved);
      return;
    }

    // 2. Fall back to computing from bake count
    const bakeCount = PieLabJournal.getBakesCountByStyle(styleKey);

    const computed = PieLabProfile.levelFromBakeCount(bakeCount);

    setSliderToLevel(computed);
  };

  // ── Slider interaction ─────────────────────────────────────────────────
  slider?.addEventListener('input', () => {
    const level = getActiveLevel();
    updateBadge(level);
    renderTips();

    // Persist the manual choice against the current style
    const styleKey = _currentStyleKey;
    if (styleKey) {
      PieLabProfile.setStyleLevel(styleKey, level);
    }
  });

  // ══════════════════════════════════════════════════════
  //  BAKE TIMER
  // ══════════════════════════════════════════════════════
  const RING_CIRCUMFERENCE = 2 * Math.PI * 88; // matches SVG r=88
  const timerOverlay = document.getElementById('timer-overlay');
  const timerTimeEl = document.getElementById('timer-time');
  const timerStatusEl = document.getElementById('timer-status');
  const timerRingFg = document.getElementById('timer-ring-fg');
  const timerPauseBtn = document.getElementById('timer-pause');

  if (timerRingFg) {
    timerRingFg.style.strokeDasharray = RING_CIRCUMFERENCE;
    timerRingFg.style.strokeDashoffset = 0;
  }

  const timer = {
    running: false,
    paused: false,
    total: 0,
    remaining: 0,
    startedAt: 0,
    pauseOffset: 0,
    intervalId: null,
  };

  function parseBakeTimeString(str) {
    // Handles: "6–18 min", "60–90 seconds", "90 sec–3 min", "3–5 minutes"
    const range = str.match(
      /(\d+)\s*(seconds?|minutes?|min|sec)?\s*[–\u2013-]\s*(\d+)\s*(seconds?|minutes?|min|sec)/i
    );
    if (!range) return 300; // fallback 5 min
    const lo = parseInt(range[1], 10);
    const loUnit = range[2] || range[4]; // use first unit if present, else the trailing unit
    const multiplier = loUnit.toLowerCase().startsWith('s') ? 1 : 60;
    return lo * multiplier;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    const secs = Math.max(0, timer.remaining);
    timerTimeEl.textContent = formatTime(secs);
    const frac = timer.total > 0 ? secs / timer.total : 0;
    timerRingFg.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - frac);
  }

  function saveTimerState() {
    try {
      PieLabStorage.set('pielab-bake-timer', {
        total: timer.total,
        startedAt: timer.startedAt,
        pauseOffset: timer.pauseOffset,
        paused: timer.paused,
        pausedAt: timer.paused ? Date.now() : 0,
      });
    } catch {
      /* ignore */
    }
  }

  function clearTimerState() {
    PieLabStorage.remove('pielab-bake-timer');
  }

  /* ── Looping alarm sound (uses shared createAlarmBeep from nav.js) ── */
  let alarmHandle = null;

  function startAlarmSound() {
    stopAlarmSound();
    alarmHandle = createAlarmBeep({ freq: 880, gain: 0.35, interval: 1500 });
  }

  function stopAlarmSound() {
    if (alarmHandle) {
      alarmHandle.stop();
      alarmHandle = null;
    }
  }

  function timerComplete() {
    timer.running = false;
    clearInterval(timer.intervalId);
    timer.remaining = 0;
    updateTimerDisplay();
    clearTimerState();
    if (window.PieLabMiniTimer) window.PieLabMiniTimer.stop();
    // Swap to done controls (Stop Alarm button)
    document.getElementById('timer-running-controls').classList.add('hidden');
    document.getElementById('timer-done-controls').classList.remove('hidden');
    timerStatusEl.textContent = 'Pizza is done! 🍕';
    if (window.PieLabHaptics) PieLabHaptics.warning();
    // Start looping alarm
    startAlarmSound();
    // Browser notification
    PieNotifications.requestPermission().then((ok) => {
      if (ok)
        PieNotifications.schedule({
          id: 9999,
          title: 'Pizza is done! 🍕',
          body: 'Your bake timer has finished.',
          at: new Date(Date.now() + 100),
        });
    });
  }

  function timerTick() {
    if (timer.paused) return;
    const elapsed = (Date.now() - timer.startedAt - timer.pauseOffset) / 1000;
    timer.remaining = Math.round(timer.total - elapsed);
    if (timer.remaining <= 0) {
      timerComplete();
      return;
    }
    updateTimerDisplay();
    // Save state every 5 seconds
    if (timer.remaining % 5 === 0) saveTimerState();
  }

  function resetTimerControls() {
    document.getElementById('timer-running-controls').classList.remove('hidden');
    document.getElementById('timer-done-controls').classList.add('hidden');
    timerPauseBtn.textContent = 'Pause';
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
    timerOverlay.classList.remove('hidden');
    if (window.PieLabMiniTimer) window.PieLabMiniTimer.start();
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
    if (timer.remaining <= 0) {
      timerComplete();
      timerOverlay.classList.remove('hidden');
      return;
    }
    timer.running = true;
    timerPauseBtn.textContent = timer.paused ? 'Resume' : 'Pause';
    timerPauseBtn.disabled = false;
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    updateTimerDisplay();
    if (!timer.paused) {
      clearInterval(timer.intervalId);
      timer.intervalId = setInterval(timerTick, 1000);
    }
    timerOverlay.classList.remove('hidden');
  }

  // Start button
  document.getElementById('btn-start-timer').addEventListener('click', () => {
    const instrEl = document.getElementById('baking-time');
    const bakeTimeText = instrEl ? instrEl.textContent : '';
    const seconds = parseBakeTimeString(bakeTimeText);
    startTimer(seconds);
  });

  // Pause / Resume
  timerPauseBtn.addEventListener('click', () => {
    if (!timer.running) return;
    if (timer.paused) {
      timer.pauseOffset += Date.now() - timer._pausedAt;
      timer.paused = false;
      timerPauseBtn.textContent = 'Pause';
      timer.intervalId = setInterval(timerTick, 1000);
    } else {
      timer.paused = true;
      timer._pausedAt = Date.now();
      timerPauseBtn.textContent = 'Resume';
      clearInterval(timer.intervalId);
    }
    saveTimerState();
  });

  // ±30s adjustments
  document.getElementById('timer-plus').addEventListener('click', () => {
    if (!timer.running) return;
    timer.total += 30;
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    timerTick();
    saveTimerState();
  });
  document.getElementById('timer-minus').addEventListener('click', () => {
    if (!timer.running) return;
    timer.total = Math.max(timer.total - 30, 1);
    timerStatusEl.textContent = `Total: ${formatTime(timer.total)}`;
    timerTick(); // timerTick calls timerComplete() if remaining <= 0
    if (timer.running) saveTimerState(); // only save if timer is still running
  });

  // Cancel (X button)
  document.getElementById('timer-cancel').addEventListener('click', () => {
    timer.running = false;
    timer.paused = false;
    clearInterval(timer.intervalId);
    stopAlarmSound();
    clearTimerState();
    resetTimerControls();
    timerOverlay.classList.add('hidden');
    if (window.PieLabMiniTimer) window.PieLabMiniTimer.stop();
  });

  // Stop Alarm
  document.getElementById('timer-stop').addEventListener('click', () => {
    stopAlarmSound();
    resetTimerControls();
    timerOverlay.classList.add('hidden');
    if (window.PieLabMiniTimer) window.PieLabMiniTimer.stop();
  });

  // Resume timer on page load
  try {
    const saved = PieLabStorage.getJSON('pielab-bake-timer');
    if (saved && saved.startedAt) resumeTimer(saved);
  } catch {
    /* ignore */
  }
});
