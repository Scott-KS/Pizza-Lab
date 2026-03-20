/* ══════════════════════════════════════════════════════
 The Pie Lab — Pizza Journal UI
 Page: journal.html
 ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';
import { PIZZA_RECIPES, fToC } from '../recipes.js';
import { PieLabJournal } from '../journal.js';
import { PieLabPhotos } from './photo-store.js';
import {
  populateStyleSelect,
  populateOvenSelect,
  OVEN_TYPES,
  escapeHtml,
  showToast,
} from './nav.js';
import { PieLabProfile } from './user-profile.js';
import { PieLabPremium } from './premium.js';

const _metricTemp = PieLabProfile.isMetricTemp();
function formatTemp(f) {
  return _metricTemp ? `${fToC(f)}\u00B0C` : `${f}\u00B0F`;
}
const form = document.getElementById('journal-form');
const entriesContainer = document.getElementById('journal-entries');
const btnNewEntry = document.getElementById('btn-new-entry');
const btnCancel = document.getElementById('btn-cancel-entry');
const filterSelect = document.getElementById('journal-style-filter');
const btnCompare = document.getElementById('btn-compare');
const comparisonEl = document.getElementById('journal-comparison');
const modalOverlay = document.getElementById('journal-detail-modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const searchInput = document.getElementById('journal-search-input');
const sortSelect = document.getElementById('journal-sort-select');

// Restore saved sort preference
const savedSort = localStorage.getItem('pielab-journal-sort');
if (savedSort && sortSelect) sortSelect.value = savedSort;

// Star rating state
let currentRating = 0;
const starContainer = document.getElementById('j-star-rating');
const stars = starContainer ? starContainer.querySelectorAll('.star') : [];

// Multi-photo state (replaces single-photo)
let currentPhotos = []; // array of data-URL strings, max 4
const photoInput = document.getElementById('j-photo-input');
const photoGrid = document.getElementById('j-photo-grid');
const photoAddBtn = document.getElementById('j-photo-add-btn');
const MAX_PHOTOS = 4;

// Iteration / derivedFrom state
let pendingDerivedFromId = null;

// Edit mode state (null = creating new, string = editing existing entry ID)
let editingEntryId = null;

// Dough snapshot state
let currentSnapshot = null;
const snapshotEl = document.getElementById('j-dough-snapshot');

// Form heading
const formHeading = document.getElementById('journal-form-heading');

// escapeHtml() is defined globally in nav.js

// ── Storage usage display ────────────────────────
function updateStorageDisplay() {
  const label = document.getElementById('storage-label');
  const fill = document.getElementById('storage-bar-fill');
  if (!label || !fill) return;

  let lsBytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      lsBytes += (key.length + localStorage.getItem(key).length) * 2; // UTF-16
    }
  } catch {
    /* ignore */
  }

  const lsMB = (lsBytes / (1024 * 1024)).toFixed(1);
  const lsLimit = 5 * 1024 * 1024;
  const lsPct = Math.min((lsBytes / lsLimit) * 100, 100);

  label.textContent = `Storage: ${lsMB} MB settings`;
  fill.style.width = `${lsPct}%`;
  fill.className =
    'storage-bar-fill' + (lsPct > 95 ? ' storage-critical' : lsPct > 80 ? ' storage-warning' : '');

  // Show IndexedDB photo storage size
  PieLabPhotos.getStorageSize()
    .then((photoBytes) => {
      const photoMB = (photoBytes / (1024 * 1024)).toFixed(1);
      if (photoBytes > 0) {
        label.textContent = `Storage: ${lsMB} MB settings + ${photoMB} MB photos`;
      }
    })
    .catch(() => {});
}

// ── Populate dropdowns ────────────────────────────
function populateDropdowns() {
  const jStyle = document.getElementById('j-style');
  populateStyleSelect(jStyle);
  populateStyleSelect(filterSelect, { includeAll: true, placeholder: null });
}

function populateOvenDropdown() {
  const ovenSelect = document.getElementById('j-oven-type');
  populateOvenSelect(ovenSelect);
}

// ── Journal Stats Dashboard ─────────────────────────
const statsSection = document.getElementById('journal-stats-section');
const statsGrid = document.getElementById('stats-grid');

function renderStats() {
  if (!statsSection || !statsGrid) return;
  const entries = PieLabJournal.getAllEntries();
  if (entries.length < 2) {
    statsGrid.innerHTML = '';
    return;
  }

  // Total Bakes
  const total = entries.length;

  // Favorite Style
  const styleCounts = {};
  entries.forEach((e) => {
    styleCounts[e.styleKey] = (styleCounts[e.styleKey] || 0) + 1;
  });
  const favKey = Object.keys(styleCounts).sort((a, b) => styleCounts[b] - styleCounts[a])[0];
  const favName = (PIZZA_RECIPES[favKey] || {}).name || favKey;
  const favCount = styleCounts[favKey];

  // Average Rating
  const rated = entries.filter((e) => e.rating > 0);
  const avgRating = rated.length ? rated.reduce((s, e) => s + e.rating, 0) / rated.length : 0;

  // Best Rated Bake
  const best = rated.length
    ? rated.reduce((a, b) =>
        b.rating > a.rating || (b.rating === a.rating && b.date > a.date) ? b : a
      )
    : null;
  const bestLabel = best ? best.bakeName || best.date || '—' : '—';

  // Bakes This Month
  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = entries.filter((e) => e.date && e.date.startsWith(monthPrefix)).length;

  // Most Common Oven
  const ovenCounts = {};
  entries.forEach((e) => {
    if (e.ovenType) ovenCounts[e.ovenType] = (ovenCounts[e.ovenType] || 0) + 1;
  });
  const topOven = Object.keys(ovenCounts).sort((a, b) => ovenCounts[b] - ovenCounts[a])[0] || '';
  const ovenLabel = OVEN_TYPES[topOven] ? OVEN_TYPES[topOven] : topOven;

  const cards = [
    { value: total, label: 'Total Bakes' },
    { value: favName, label: `Favorite (×${favCount})` },
    { value: avgRating ? avgRating.toFixed(1) + ' ★' : '—', label: 'Avg Rating' },
    { value: best ? best.rating + ' ★' : '—', label: bestLabel },
    { value: thisMonth, label: 'This Month' },
    { value: ovenLabel || '—', label: 'Top Oven' },
  ];

  statsGrid.innerHTML = cards
    .map(
      (c) =>
        `<div class="stat-card"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`
    )
    .join('');
}

// ── Bake Analytics (Pro) ────────────────────────────
const analyticsSection = document.getElementById('analytics-section');
const analyticsBody = document.getElementById('analytics-body');

function renderAnalytics() {
  if (!analyticsSection || !analyticsBody) return;
  const hint = analyticsSection.querySelector('.section-hint');
  const entries = PieLabJournal.getAllEntries();
  if (entries.length < 3) {
    analyticsBody.innerHTML = '';
    if (hint) hint.classList.remove('hidden');
    return;
  }
  if (hint) hint.classList.add('hidden');

  // Gate: show locked state if not premium
  if (!PieLabPremium.canUse()) {
    analyticsBody.innerHTML =
      '<p class="analytics-locked">Start a free trial to unlock Bake Analytics.</p>';
    return;
  }

  // ── Monthly bake timeline (last 6 months) ──
  const monthMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { count: 0, label: d.toLocaleDateString(undefined, { month: 'short' }) };
  }
  entries.forEach((e) => {
    if (e.date) {
      const key = e.date.slice(0, 7);
      if (monthMap[key]) monthMap[key].count++;
    }
  });
  const maxCount = Math.max(1, ...Object.values(monthMap).map((m) => m.count));
  const timelineHtml = Object.entries(monthMap)
    .map(([, m]) => {
      const pct = Math.round((m.count / maxCount) * 100);
      return `<div class="timeline-bar-col">
      <div class="timeline-bar" style="height:${Math.max(4, pct)}%"><span class="timeline-count">${m.count}</span></div>
      <span class="timeline-month">${m.label}</span>
    </div>`;
    })
    .join('');

  const timelineEl = document.getElementById('analytics-timeline');
  if (timelineEl) {
    timelineEl.innerHTML = `<h4>Bakes Per Month</h4><div class="timeline-chart">${timelineHtml}</div>`;
  }

  // ── Per-style breakdown ──
  const styleMap = {};
  entries.forEach((e) => {
    if (!styleMap[e.styleKey]) styleMap[e.styleKey] = { count: 0, ratingSum: 0, ratedCount: 0 };
    styleMap[e.styleKey].count++;
    if (e.rating > 0) {
      styleMap[e.styleKey].ratingSum += e.rating;
      styleMap[e.styleKey].ratedCount++;
    }
  });
  const styleRows = Object.entries(styleMap)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, data]) => {
      const name = PIZZA_RECIPES[key] ? PIZZA_RECIPES[key].name : key;
      const avg = data.ratedCount ? (data.ratingSum / data.ratedCount).toFixed(1) : '\u2014';
      return `<tr><td>${name}</td><td>${data.count}</td><td>${avg}</td></tr>`;
    })
    .join('');

  // ── Sweet spots from analyzeEntries ──
  const analysis = PieLabJournal.analyzeEntries(entries);
  let sweetHtml = '';
  if (!analysis.insufficient) {
    if (analysis.bestHydration) {
      sweetHtml += `<div class="sweet-card"><div class="sweet-value">${analysis.bestHydration.value}%</div><div class="sweet-label">Best Hydration (${analysis.bestHydration.avg}\u2605 avg, ${analysis.bestHydration.count} bakes)</div></div>`;
    }
    if (analysis.bestBakeTemp) {
      const metricTemp = PieLabProfile.isMetricTemp();
      const tempVal = metricTemp
        ? fToC(analysis.bestBakeTemp.value) + '\u00B0C'
        : analysis.bestBakeTemp.value + '\u00B0F';
      sweetHtml += `<div class="sweet-card"><div class="sweet-value">${tempVal}</div><div class="sweet-label">Best Bake Temp (${analysis.bestBakeTemp.avg}\u2605 avg, ${analysis.bestBakeTemp.count} bakes)</div></div>`;
    }
  }

  // ── Unique styles tried ──
  const uniqueStyles = Object.keys(styleMap).length;
  const totalStyles = Object.keys(PIZZA_RECIPES).length;

  const gridEl = document.getElementById('analytics-grid');
  if (gridEl) {
    gridEl.innerHTML = `
      <div class="analytics-card">
        <h4>Style Breakdown</h4>
        <table class="analytics-table"><thead><tr><th>Style</th><th>Bakes</th><th>Avg \u2605</th></tr></thead><tbody>${styleRows}</tbody></table>
      </div>
      ${sweetHtml ? `<div class="analytics-card"><h4>Your Sweet Spots</h4><div class="sweet-grid">${sweetHtml}</div></div>` : ''}
      <div class="analytics-card analytics-card-small">
        <div class="sweet-value">${uniqueStyles} / ${totalStyles}</div>
        <div class="sweet-label">Styles Explored</div>
      </div>
    `;
  }
}

// ── Star rating — click to set, hover to preview ──
stars.forEach((star) => {
  star.addEventListener('click', () => {
    const clicked = parseInt(star.dataset.value);
    currentRating = clicked === currentRating ? 0 : clicked;
    updateStars();
  });

  star.addEventListener('mouseenter', () => {
    const hoverVal = parseInt(star.dataset.value);
    stars.forEach((s) => {
      s.classList.toggle('hovered', parseInt(s.dataset.value) <= hoverVal);
      s.classList.remove('active');
    });
  });

  star.addEventListener('mouseleave', () => {
    stars.forEach((s) => s.classList.remove('hovered'));
    updateStars();
  });
});

function updateStars() {
  stars.forEach((s) => {
    const val = parseInt(s.dataset.value);
    s.classList.toggle('active', val <= currentRating);
  });
}

function renderStars(rating) {
  return '\u2605'.repeat(rating) + '\u2606'.repeat(5 - rating);
}

// ── Multi-photo handling ──────────────────────────
function renderPhotoGrid() {
  photoGrid.innerHTML = '';

  currentPhotos.forEach((dataUrl, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'photo-grid-thumb';
    thumb.innerHTML = `
      <img src="${dataUrl}" alt="Photo ${idx + 1}" />
      <button type="button" class="photo-grid-remove" data-idx="${idx}" aria-label="Remove photo">&times;</button>
    `;
    photoGrid.appendChild(thumb);
  });

  // Show/hide the add button based on count
  if (currentPhotos.length >= MAX_PHOTOS) {
    photoAddBtn.classList.add('hidden');
  } else {
    photoAddBtn.classList.remove('hidden');
  }

  // Recalculate accordion max-height so Save button isn't clipped
  // Use rAF + short delay to account for image rendering
  requestAnimationFrame(() => {
    const logAccordion = document.getElementById('accordion-log');
    if (logAccordion && logAccordion.classList.contains('open')) {
      const body = logAccordion.querySelector('.accordion-body');
      if (body) body.style.maxHeight = body.scrollHeight + 'px';
    }
  });
}

async function handlePhotoFiles(files) {
  const remaining = MAX_PHOTOS - currentPhotos.length;
  const toProcess = Array.from(files).slice(0, remaining);

  for (const file of toProcess) {
    try {
      const dataUrl = await PieLabJournal.compressPhoto(file, 800);
      currentPhotos.push(dataUrl);
    } catch {
      // silently skip unreadable files
    }
  }

  renderPhotoGrid();
}

photoInput.addEventListener('change', (e) => {
  if (e.target.files.length) {
    handlePhotoFiles(e.target.files);
    photoInput.value = ''; // reset so same file can be re-selected
  }
});

// Delegate remove clicks on photo grid
photoGrid.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.photo-grid-remove');
  if (!removeBtn) return;
  const idx = parseInt(removeBtn.dataset.idx);
  currentPhotos.splice(idx, 1);
  renderPhotoGrid();
});

// ── Show/hide form ────────────────────────────────
function showForm(prefill, derivedFrom, editEntry) {
  // Expand the Log a Bake accordion
  const logAccordion = document.getElementById('accordion-log');
  if (logAccordion && !logAccordion.classList.contains('open')) {
    logAccordion.classList.add('open');
    const body = logAccordion.querySelector('.accordion-body');
    if (body) body.style.maxHeight = body.scrollHeight + 'px';
  }

  // Set date to today
  document.getElementById('j-date').value = new Date().toISOString().split('T')[0];

  // Reset
  currentRating = 0;
  updateStars();
  currentPhotos = [];
  renderPhotoGrid();
  document.getElementById('j-bake-name').value = '';
  document.getElementById('j-notes').value = '';
  document.getElementById('j-bake-temp').value = '';
  document.getElementById('j-bake-time').value = '';
  document.getElementById('j-oven-type').selectedIndex = 0;
  pendingDerivedFromId = null;
  editingEntryId = null;

  if (editEntry) {
    // ── Edit mode — populate form with existing entry data ──
    editingEntryId = editEntry.id;
    formHeading.textContent = 'Edit Bake';
    document.getElementById('j-style').value = editEntry.styleKey || '';
    document.getElementById('j-date').value = editEntry.date || '';
    document.getElementById('j-bake-name').value = editEntry.bakeName || '';
    if (editEntry.bakeTemp) document.getElementById('j-bake-temp').value = editEntry.bakeTemp;
    if (editEntry.bakeTime) document.getElementById('j-bake-time').value = editEntry.bakeTime;
    if (editEntry.ovenType) document.getElementById('j-oven-type').value = editEntry.ovenType;
    if (editEntry.notes) document.getElementById('j-notes').value = editEntry.notes;
    currentRating = editEntry.rating || 0;
    updateStars();
    currentPhotos = editEntry.photos ? [...editEntry.photos] : [];
    renderPhotoGrid();
    pendingDerivedFromId = editEntry.derivedFromId || null;
    if (editEntry.doughSnapshot) {
      currentSnapshot = editEntry.doughSnapshot;
      renderSnapshot(editEntry.doughSnapshot);
    } else {
      currentSnapshot = null;
      snapshotEl.innerHTML =
        '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">No dough data for this entry</span>';
    }
  } else if (derivedFrom) {
    // Iteration mode — new entry based on an existing one
    pendingDerivedFromId = derivedFrom.id;
    formHeading.textContent = `New Bake \u2014 Based on ${derivedFrom.styleName}`;

    document.getElementById('j-style').value = derivedFrom.styleKey || '';
    if (derivedFrom.bakeTemp) document.getElementById('j-bake-temp').value = derivedFrom.bakeTemp;
    if (derivedFrom.bakeTime) document.getElementById('j-bake-time').value = derivedFrom.bakeTime;
    if (derivedFrom.ovenType) document.getElementById('j-oven-type').value = derivedFrom.ovenType;

    if (derivedFrom.doughSnapshot) {
      currentSnapshot = derivedFrom.doughSnapshot;
      renderSnapshot(derivedFrom.doughSnapshot);
    } else {
      currentSnapshot = null;
      snapshotEl.innerHTML =
        '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">No dough data for this entry</span>';
    }

    // Don't copy photos or notes — user starts fresh for the new bake
  } else if (prefill) {
    // New entry with calculator prefill — consume and clear so it doesn't persist
    try {
      const calc = PieLabStorage.getJSON('pielab-last-calc');
      PieLabStorage.remove('pielab-last-calc');
      if (calc) {
        document.getElementById('j-style').value = calc.styleKey;
        if (calc.bakeTemp) {
          document.getElementById('j-bake-temp').value = calc.bakeTemp;
        }
        currentSnapshot = calc.doughSnapshot;
        renderSnapshot(calc.doughSnapshot);

        // Carry lineage through from "Use as Starting Point" flow
        if (calc.derivedFromId) {
          pendingDerivedFromId = calc.derivedFromId;
          const parent = PieLabJournal.getEntryById(calc.derivedFromId);
          formHeading.textContent = parent
            ? `New Bake \u2014 Based on ${parent.styleName} (${formatDate(parent.date)})`
            : 'New Bake \u2014 Iteration';
        } else {
          formHeading.textContent = 'Log a Bake';
        }
        showToast('Bake loaded from Scheduler');
      } else {
        formHeading.textContent = 'Log a Bake';
        currentSnapshot = null;
        snapshotEl.innerHTML =
          '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
      }
    } catch {
      formHeading.textContent = 'Log a Bake';
      currentSnapshot = null;
      snapshotEl.innerHTML =
        '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
    }
  } else {
    formHeading.textContent = 'Log a Bake';
    currentSnapshot = null;
    snapshotEl.innerHTML =
      '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
  }

  // Style match indicator
  const styleHistoryEl = document.getElementById('j-style-history');
  const selectedStyle = document.getElementById('j-style').value;
  if (selectedStyle && styleHistoryEl) {
    const styleEntries = PieLabJournal.getEntriesByStyle(selectedStyle);
    if (styleEntries.length > 0) {
      const bestRating = Math.max(...styleEntries.map((e) => e.rating || 0));
      const styleName = (PIZZA_RECIPES[selectedStyle] || {}).name || selectedStyle;
      styleHistoryEl.textContent = `You\u2019ve logged ${styleEntries.length} ${styleName} bake${styleEntries.length > 1 ? 's' : ''}. Your best was ${bestRating} \u2605`;
      styleHistoryEl.classList.remove('hidden');
    } else {
      styleHistoryEl.classList.add('hidden');
    }
  } else if (styleHistoryEl) {
    styleHistoryEl.classList.add('hidden');
  }

  // Re-measure accordion height after form content changes and scroll to it
  if (logAccordion) {
    const logBody = logAccordion.querySelector('.accordion-body');
    if (logBody) logBody.style.maxHeight = logBody.scrollHeight + 'px';
    logAccordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function hideForm() {
  // Collapse the Log a Bake accordion
  const logAccordion = document.getElementById('accordion-log');
  if (logAccordion) {
    logAccordion.classList.remove('open');
    const body = logAccordion.querySelector('.accordion-body');
    if (body) body.style.maxHeight = null;
  }
  pendingDerivedFromId = null;
  editingEntryId = null;
  formHeading.textContent = 'Log a Bake';
  localStorage.removeItem('pielab-pending-bake');
}

const YEAST_LABELS = { idy: 'Instant Dry', ady: 'Active Dry', fresh: 'Fresh' };

function renderSnapshot(snap) {
  if (!snap) return;
  let chips = `
    <span class="snapshot-label">Dough Snapshot:</span>
    <span class="snapshot-chip"><strong>${(snap.hydration * 100).toFixed(1)}%</strong> hydration</span>
    <span class="snapshot-chip"><strong>${(snap.saltPct * 100).toFixed(1)}%</strong> salt</span>
    <span class="snapshot-chip"><strong>${(snap.oilPct * 100).toFixed(1)}%</strong> oil</span>
    <span class="snapshot-chip"><strong>${(snap.sugarPct * 100).toFixed(1)}%</strong> sugar</span>
    <span class="snapshot-chip"><strong>${(snap.yeastPct * 100).toFixed(2)}%</strong> yeast</span>
    <span class="snapshot-chip"><strong>${snap.doughBallWeight}g</strong> per ball</span>`;
  if (snap.flourType) {
    chips += `\n      <span class="snapshot-chip"><strong>${escapeHtml(snap.flourType)}</strong></span>`;
  }
  if (snap.yeastType) {
    const label = YEAST_LABELS[snap.yeastType] || snap.yeastType;
    chips += `\n      <span class="snapshot-chip"><strong>${escapeHtml(label)}</strong> yeast</span>`;
  }
  if (snap.fermentHours) {
    const tempStr = snap.fermentTemp ? ` @ ${formatTemp(snap.fermentTemp)}` : '';
    chips += `\n      <span class="snapshot-chip"><strong>${snap.fermentHours}h</strong> ferment${tempStr}</span>`;
  }
  snapshotEl.innerHTML = chips;
}

// Accordion header click opens form (Log a Bake accordion)
if (btnNewEntry) btnNewEntry.addEventListener('click', () => showForm(false));
btnCancel.addEventListener('click', hideForm);

// Journal accordion toggle handlers (allow multiple open)
document
  .querySelectorAll('#tab-panel-bakes > .accordion-item > .accordion-header')
  .forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      if (item.classList.contains('open')) {
        item.classList.remove('open');
        body.style.maxHeight = null;
      } else {
        // Reset form when opening Log a Bake so stale data doesn't persist
        if (item.id === 'accordion-log') {
          showForm(false);
        }
        // Re-render stats when opening the stats accordion so content exists
        if (item.id === 'accordion-stats') {
          renderStats();
          renderAnalytics();
        }
        item.classList.add('open');
        // Delay max-height calc so rendered content is measured
        requestAnimationFrame(() => {
          body.style.maxHeight = body.scrollHeight + 'px';
        });
      }
    });
  });

// Check for ?prefill=1 URL parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('prefill') === '1') {
  setTimeout(() => showForm(true), 100);
} else {
  // Auto-detect pending bake (no button press required)
  try {
    const raw = localStorage.getItem('pielab-pending-bake');
    if (raw) {
      const pending = JSON.parse(raw);
      if (pending.timestamp && Date.now() - pending.timestamp < 24 * 60 * 60 * 1000) {
        setTimeout(() => showForm(true), 100);
      } else {
        localStorage.removeItem('pielab-pending-bake'); // stale
      }
    }
  } catch {
    /* ignore */
  }
}

// ── Save entry ────────────────────────────────────
let isSaving = false;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (isSaving) return; // prevent double submission

  const styleKey = document.getElementById('j-style').value;
  if (!styleKey) {
    alert('Please select a pizza style.');
    return;
  }
  isSaving = true;

  const recipe = PIZZA_RECIPES[styleKey];
  const bakeName = document.getElementById('j-bake-name').value.trim();
  const entry = {
    date: document.getElementById('j-date').value,
    bakeName: bakeName || null,
    styleKey,
    styleName: recipe ? recipe.name : styleKey,
    doughSnapshot: currentSnapshot || null,
    bakeTemp: parseInt(document.getElementById('j-bake-temp').value) || null,
    bakeTime: document.getElementById('j-bake-time').value.trim() || null,
    ovenType: document.getElementById('j-oven-type').value,
    rating: currentRating || 0,
    notes: document.getElementById('j-notes').value.trim(),
    photos: currentPhotos.length ? [...currentPhotos] : [],
    photo: currentPhotos.length ? currentPhotos[0] : null, // legacy compat
    derivedFromId: pendingDerivedFromId || null,
  };

  let saved;
  if (editingEntryId) {
    // ── Edit mode — update existing entry ──
    PieLabJournal.updateEntry(editingEntryId, entry);
    saved = { ...entry, id: editingEntryId, skillCount: 0 };
    editingEntryId = null;
  } else {
    saved = await PieLabJournal.addEntry(entry);
  }
  localStorage.removeItem('pielab-pending-bake');
  PieLabStorage.remove('pielab-last-calc');
  if (window.PieLabHaptics) PieLabHaptics.success();

  // Close journal guide if still active (prevents stray highlight)
  if (jgOverlay) jgClose();

  pendingDerivedFromId = null;
  hideForm();
  renderEntries();
  renderStats();
  renderAnalytics();
  renderPassport();
  updateCompareButton();
  updateStorageDisplay();

  // Celebrate milestone tier achievements (1, 4, 9, 16, 26 bakes per style)
  const MILESTONE_COUNTS = [1, 4, 9, 16, 26];
  const hasMilestone = MILESTONE_COUNTS.includes(saved.skillCount);
  if (hasMilestone) {
    showMilestoneCelebration(saved);
  }

  // Show share guide after first bake, or submit nudge every 3rd bake
  const guideDelay = hasMilestone ? 4500 : 600;
  setTimeout(() => {
    if (!localStorage.getItem(SHARE_GUIDE_KEY)) {
      showShareGuide(saved);
    } else {
      showSubmitNudge(saved);
    }
  }, guideDelay);

  // Passport intro after 2nd bake ever
  const PASSPORT_INTRO_KEY = 'pielab-passport-intro-shown';
  const allAfterSave = PieLabJournal.getAllEntries();
  if (allAfterSave.length === 2 && localStorage.getItem(PASSPORT_INTRO_KEY) !== '1') {
    const passportDelay = hasMilestone ? 5000 : 1200;
    setTimeout(() => showPassportIntro(), passportDelay);
  }

  // "Almost there" nudge — 1 bake away from next tier
  const NEXT_TIER_THRESHOLDS = [3, 8, 15, 25]; // one below 4, 9, 16, 26
  if (NEXT_TIER_THRESHOLDS.includes(saved.skillCount)) {
    const TIER_NAMES = {
      3: 'Getting Comfortable',
      8: 'Dialed In',
      15: 'Style Specialist',
      25: 'Master of the Oven',
    };
    const nudgeDelay = hasMilestone ? 5500 : 1500;
    setTimeout(() => showStatusNudge(saved.styleName, TIER_NAMES[saved.skillCount]), nudgeDelay);
  }

  isSaving = false;
});

// ── Empty state builder ──────────────────────────
function buildEmptyState() {
  return `<div class="journal-empty-state">
    <div class="empty-state-icon">\uD83C\uDF55</div>
    <h3>Your Pizza Journal</h3>
    <p>Every great pizzaiolo keeps a journal. Calculate your first recipe, bake it, then come back and log how it turned out — photos, ratings, and all.</p>
    <a href="calculator.html" class="btn-primary">Make Your First Pizza \u2192</a>
  </div>`;
}

// ── Render entries ────────────────────────────────
function renderEntries() {
  const filter = filterSelect.value;
  let entries =
    filter === 'all' ? PieLabJournal.getAllEntries() : PieLabJournal.getEntriesByStyle(filter);

  // Hide toolbar when journal is empty (no entries at all, not just filtered)
  const toolbar = document.querySelector('.journal-toolbar');
  const allEntries = PieLabJournal.getAllEntries();
  if (toolbar) toolbar.classList.toggle('hidden', !allEntries || allEntries.length === 0);

  if (!allEntries || allEntries.length === 0) {
    entriesContainer.innerHTML = buildEmptyState();
    return;
  }

  // ── Text search filter ──────────────────────────
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (searchTerm) {
    entries = entries.filter((entry) => {
      const bakeName = (entry.bakeName || '').toLowerCase();
      const styleName = (entry.styleName || '').toLowerCase();
      const notes = (entry.notes || '').toLowerCase();
      return (
        bakeName.includes(searchTerm) ||
        styleName.includes(searchTerm) ||
        notes.includes(searchTerm)
      );
    });
  }

  // ── Sort ────────────────────────────────────────
  const sortValue = sortSelect ? sortSelect.value : 'newest';
  entries.sort((a, b) => {
    switch (sortValue) {
      case 'oldest':
        return (a.date || '').localeCompare(b.date || '');
      case 'newest':
        return (b.date || '').localeCompare(a.date || '');
      case 'hydration-high': {
        const aH = a.doughSnapshot ? a.doughSnapshot.hydration : -1;
        const bH = b.doughSnapshot ? b.doughSnapshot.hydration : -1;
        return bH - aH;
      }
      case 'hydration-low': {
        const aH = a.doughSnapshot ? a.doughSnapshot.hydration : Infinity;
        const bH = b.doughSnapshot ? b.doughSnapshot.hydration : Infinity;
        return aH - bH;
      }
      case 'rating-high':
        return (b.rating || 0) - (a.rating || 0);
      case 'rating-low':
        return (a.rating || 0) - (b.rating || 0);
      default:
        return 0;
    }
  });

  if (!entries || entries.length === 0) {
    entriesContainer.innerHTML = '<div class="journal-no-results">No matching bakes found.</div>';
    return;
  }

  entriesContainer.querySelectorAll('.journal-empty-state').forEach((c) => c.remove());
  entriesContainer.querySelectorAll('.journal-entry-card').forEach((c) => c.remove());
  entriesContainer.querySelectorAll('.styles-mastered-row').forEach((c) => c.remove());

  // ── Styles Mastered summary (only if any style ≥ 26 bakes) ──
  const masteredStyles = Object.keys(PIZZA_RECIPES).filter(
    (key) => PieLabJournal.getStyleBakeCount(key) >= 26
  );
  if (masteredStyles.length > 0) {
    const row = document.createElement('div');
    row.className = 'styles-mastered-row';
    const pills = masteredStyles
      .map((key) => {
        const name = PIZZA_RECIPES[key] ? PIZZA_RECIPES[key].name : key;
        return `<span class="mastered-pill">\uD83C\uDFC6 ${escapeHtml(name)}</span>`;
      })
      .join('');
    row.innerHTML = `<span class="mastered-label">Styles Mastered</span><div class="mastered-list">${pills}</div>`;
    entriesContainer.appendChild(row);
  }

  entries.forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'journal-entry-card';
    card.dataset.id = entry.id;

    // Photo thumbnail — loaded async from IndexedDB
    const hasPhoto = entry.photoCount > 0 || (entry.photos && entry.photos.length) || entry.photo;
    const thumbHtml = hasPhoto
      ? `<div class="entry-thumb-placeholder entry-thumb-loading" data-photo-id="${entry.id}"></div>`
      : `<div class="entry-thumb-placeholder">\uD83C\uDF55</div>`;

    const detailParts = [];
    if (entry.bakeTemp) detailParts.push(formatTemp(entry.bakeTemp));
    if (entry.bakeTime) detailParts.push(`${entry.bakeTime} min`);
    if (entry.ovenType && OVEN_TYPES[entry.ovenType]) {
      detailParts.push(OVEN_TYPES[entry.ovenType]);
    } else if (entry.ovenType) {
      detailParts.push(escapeHtml(entry.ovenType));
    }

    // Lineage badge
    const lineageBadge = entry.derivedFromId
      ? '<span class="lineage-badge">\uD83D\uDD04 Iteration</span>'
      : '';

    card.innerHTML = `
      ${thumbHtml}
      <div class="entry-info">
        <div class="entry-top-row">
          <span class="entry-date">${formatDate(entry.date)}</span>
          <span class="entry-style-badge">${escapeHtml(entry.styleName)}</span>
          ${lineageBadge}
          ${entry.rating ? `<span class="entry-stars">${renderStars(entry.rating)}</span>` : ''}
        </div>
        ${entry.bakeName ? `<div class="entry-bake-name">${escapeHtml(entry.bakeName)}</div>` : ''}
        ${detailParts.length ? `<div class="entry-details">${detailParts.join(' \u00B7 ')}</div>` : ''}
        ${entry.skillBadge ? `<div class="entry-skill-line"><span class="skill-pill">${entry.skillBadge}</span><span class="skill-bake-count">Bake #${entry.skillCount} in ${escapeHtml(entry.styleName)}</span></div>` : ''}
        ${entry.notes ? `<div class="entry-notes-preview">${escapeHtml(entry.notes)}</div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openDetailModal(entry));
    entriesContainer.appendChild(card);
  });

  // Lazy-load thumbnails from IndexedDB
  lazyLoadThumbnails();
}

function lazyLoadThumbnails() {
  const placeholders = entriesContainer.querySelectorAll('[data-photo-id]');
  placeholders.forEach((el) => {
    const entryId = el.dataset.photoId;
    PieLabPhotos.getPhotos(entryId)
      .then((photos) => {
        if (photos && photos.length) {
          const img = document.createElement('img');
          img.className = 'entry-thumb';
          img.alt = 'Bake photo';
          img.src = photos[0];
          el.replaceWith(img);
        } else {
          el.textContent = '\uD83C\uDF55';
          el.classList.remove('entry-thumb-loading');
        }
      })
      .catch(() => {
        el.textContent = '\uD83C\uDF55';
        el.classList.remove('entry-thumb-loading');
      });
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Filter ────────────────────────────────────────
filterSelect.addEventListener('change', () => {
  renderEntries();
  updateCompareButton();
  comparisonEl.classList.add('hidden');
});

// Search (debounced)
let searchTimer = null;
if (searchInput) {
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => renderEntries(), 300);
  });
}

// Sort
if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    localStorage.setItem('pielab-journal-sort', sortSelect.value);
    renderEntries();
  });
}

const compareHint = document.getElementById('compare-hint');

function updateCompareButton() {
  const filter = filterSelect.value;
  if (filter === 'all') {
    btnCompare.disabled = true;
    compareHint.textContent = 'Filter by a specific style to compare bakes.';
    compareHint.classList.remove('hidden');
    return;
  }
  const entries = PieLabJournal.getEntriesByStyle(filter);
  if (entries.length < 2) {
    btnCompare.disabled = true;
    compareHint.textContent = 'Log at least 2 bakes of this style to compare.';
    compareHint.classList.remove('hidden');
  } else {
    btnCompare.disabled = false;
    compareHint.classList.add('hidden');
  }
}

// ── Detail Modal ──────────────────────────────────
async function openDetailModal(entry) {
  let html = '';

  // Load photos from IndexedDB (fall back to entry data for backward compat)
  let photos = [];
  if (entry.id) {
    try {
      photos = await PieLabPhotos.getPhotos(entry.id);
    } catch {
      /* ignore */
    }
  }
  if (!photos.length) {
    photos = entry.photos && entry.photos.length ? entry.photos : entry.photo ? [entry.photo] : [];
  }
  // Attach loaded photos so share/save can use them without another read
  entry.photos = photos;

  if (photos.length) {
    html += '<div class="modal-photo-strip">';
    photos.forEach((src, i) => {
      html += `<img class="modal-strip-img${i === 0 ? ' active' : ''}" src="${src}" alt="Bake photo ${i + 1}" data-idx="${i}" />`;
    });
    html += '</div>';

    // If multiple photos, show the first as large preview
    if (photos.length > 1) {
      html += `<img class="modal-photo-main" id="modal-photo-main" src="${photos[0]}" alt="Bake photo" />`;
    }
  }

  // Skill badge — use entry-stamped data
  const modalBadgeHtml = entry.skillBadge
    ? `<span class="skill-pill skill-pill--modal">${entry.skillBadge}</span>`
    : '';

  html += `
    <div class="modal-header">
      <div class="modal-header-top">
        <h3>${escapeHtml(entry.bakeName || entry.styleName)}</h3>
        ${modalBadgeHtml}
      </div>
      ${entry.bakeName ? `<span class="modal-style-label">${escapeHtml(entry.styleName)}</span>` : ''}
      <span class="entry-date">${formatDate(entry.date)}</span>
      ${entry.rating ? `<span class="modal-stars">${renderStars(entry.rating)}</span>` : ''}
    </div>
  `;

  // Lineage row
  if (entry.derivedFromId) {
    const parent = PieLabJournal.getEntryById(entry.derivedFromId);
    if (parent) {
      html += `
        <div class="modal-lineage">
          <span class="lineage-icon">\uD83D\uDD04</span>
          <span>Based on <strong>${escapeHtml(parent.styleName)}</strong> bake from ${formatDate(parent.date)}</span>
        </div>
      `;
    } else {
      html += `
        <div class="modal-lineage">
          <span class="lineage-icon">\uD83D\uDD04</span>
          <span>Iteration of a previous bake</span>
        </div>
      `;
    }
  }

  // Details grid
  const details = [];
  if (entry.bakeTemp) details.push({ label: 'Bake Temp', value: formatTemp(entry.bakeTemp) });
  if (entry.bakeTime) details.push({ label: 'Bake Time', value: `${entry.bakeTime} min` });
  if (entry.ovenType) {
    const label = OVEN_TYPES[entry.ovenType] || escapeHtml(entry.ovenType);
    details.push({ label: 'Oven', value: label });
  }

  if (entry.doughSnapshot) {
    const s = entry.doughSnapshot;
    if (s.flourType) details.push({ label: 'Flour', value: escapeHtml(s.flourType) });
    details.push({ label: 'Hydration', value: `${(s.hydration * 100).toFixed(1)}%` });
    details.push({ label: 'Salt', value: `${(s.saltPct * 100).toFixed(1)}%` });
    details.push({ label: 'Oil', value: `${(s.oilPct * 100).toFixed(1)}%` });
    details.push({ label: 'Sugar', value: `${(s.sugarPct * 100).toFixed(1)}%` });
    details.push({ label: 'Yeast', value: `${(s.yeastPct * 100).toFixed(2)}%` });
    if (s.yeastType) {
      const ytLabel = YEAST_LABELS[s.yeastType] || s.yeastType;
      details.push({ label: 'Yeast Type', value: escapeHtml(ytLabel) });
    }
    details.push({ label: 'Dough Ball', value: `${s.doughBallWeight}g` });
    if (s.fermentHours) {
      const tempStr = s.fermentTemp ? ` @ ${formatTemp(s.fermentTemp)}` : '';
      details.push({ label: 'Ferment', value: `${s.fermentHours}h${tempStr}` });
    }
  }

  if (details.length) {
    html += '<div class="modal-detail-grid">';
    details.forEach((d) => {
      html += `<div class="modal-detail-item"><span class="detail-label">${d.label}</span><span class="detail-value">${d.value}</span></div>`;
    });
    html += '</div>';
  }

  // Dough Formula — reconstruct gram amounts from baker's percentages
  if (entry.doughSnapshot && entry.doughSnapshot.doughBallWeight > 0) {
    const s = entry.doughSnapshot;
    const totalPct =
      1 +
      (s.hydration || 0) +
      (s.saltPct || 0) +
      (s.oilPct || 0) +
      (s.sugarPct || 0) +
      (s.yeastPct || 0);
    const flourG = s.doughBallWeight / totalPct;
    const flourName = escapeHtml(s.flourType || 'Flour');
    const yeastName = escapeHtml(
      s.yeastType ? (YEAST_LABELS[s.yeastType] || s.yeastType) + ' Yeast' : 'Yeast'
    );
    const ingredients = [
      { name: flourName, grams: flourG, pct: 100 },
      { name: 'Water', grams: flourG * (s.hydration || 0), pct: (s.hydration || 0) * 100 },
      { name: 'Salt', grams: flourG * (s.saltPct || 0), pct: (s.saltPct || 0) * 100 },
      { name: 'Oil', grams: flourG * (s.oilPct || 0), pct: (s.oilPct || 0) * 100 },
      { name: 'Sugar', grams: flourG * (s.sugarPct || 0), pct: (s.sugarPct || 0) * 100 },
      { name: yeastName, grams: flourG * (s.yeastPct || 0), pct: (s.yeastPct || 0) * 100 },
    ].filter((ing) => Math.round(ing.grams) > 0);
    const totalG = ingredients.reduce((sum, ing) => sum + ing.grams, 0);

    html +=
      '<div class="modal-formula-section"><h4>Dough Formula <span class="formula-per-ball">(per ball)</span></h4>';
    html += '<div class="modal-formula-grid">';
    ingredients.forEach((ing) => {
      const pctStr =
        ing.name === 'Flour'
          ? '100%'
          : ing.pct < 1
            ? `${ing.pct.toFixed(2)}%`
            : `${ing.pct.toFixed(1)}%`;
      html += `<div class="formula-row"><span class="formula-ingredient">${ing.name}</span><span class="formula-grams">${Math.round(ing.grams)}g</span><span class="formula-pct">${pctStr}</span></div>`;
    });
    html += `<div class="formula-row formula-total"><span class="formula-ingredient">Total</span><span class="formula-grams">${Math.round(totalG)}g</span><span class="formula-pct">${(totalPct * 100).toFixed(0)}%</span></div>`;
    html += '</div></div>';
  }

  if (entry.notes) {
    html += `<div class="modal-notes"><h4>Notes</h4><p>${escapeHtml(entry.notes)}</p></div>`;
  }

  const shareButtons = `<button class="btn-modal-share" data-id="${entry.id}">Share This Bake</button>
       <button class="btn-modal-save-photo" data-id="${entry.id}">Save to Photos</button>`;

  html += `
    <div class="modal-actions">
      ${shareButtons}
      <button class="btn-modal-edit" data-id="${entry.id}">
        Edit
      </button>
      <button class="btn-modal-iterate" data-id="${entry.id}">
        Bake Again \u21BB
      </button>
      <button class="btn-modal-delete" data-id="${entry.id}">
        Delete
      </button>
    </div>
  `;

  modalBody.innerHTML = html;
  modalOverlay.classList.remove('hidden');

  // Photo strip click → swap main image
  if (photos.length > 1) {
    const mainImg = document.getElementById('modal-photo-main');
    const stripImgs = modalBody.querySelectorAll('.modal-strip-img');
    stripImgs.forEach((img) => {
      img.addEventListener('click', () => {
        mainImg.src = img.src;
        stripImgs.forEach((s) => s.classList.remove('active'));
        img.classList.add('active');
      });
    });
  }

  // Edit handler — close modal, open form in edit mode
  modalBody.querySelector('.btn-modal-edit').addEventListener('click', () => {
    modalOverlay.classList.add('hidden');
    showForm(false, null, entry);
  });

  // Iterate handler — "Use as Starting Point" → load into calculator
  modalBody.querySelector('.btn-modal-iterate').addEventListener('click', () => {
    const lastCalcData = {
      styleKey: entry.styleKey,
      styleName: entry.styleName,
      sizeKey: null,
      numPizzas: 1,
      ovenType: entry.ovenType || '',
      useCustom: false,
      doughSnapshot: entry.doughSnapshot || null,
      bakeTemp: entry.bakeTemp || null,
      derivedFromId: entry.id,
    };
    PieLabStorage.set('pielab-last-calc', lastCalcData);
    window.location.href = 'calculator.html?load=1';
  });

  // Delete handler
  modalBody.querySelector('.btn-modal-delete').addEventListener('click', (e) => {
    if (confirm('Delete this journal entry? This cannot be undone.')) {
      PieLabJournal.deleteEntry(e.target.dataset.id);
      if (window.PieLabHaptics) PieLabHaptics.warning();
      modalOverlay.classList.add('hidden');
      renderEntries();
      renderStats();
      renderAnalytics();
      renderPassport();
      updateCompareButton();
      updateStorageDisplay();
    }
  });

  // Share handler — generates share image with social caption
  const shareBtn = modalBody.querySelector('.btn-modal-share');
  if (shareBtn) shareBtn.addEventListener('click', () => shareThisBake(entry, 'social'));

  // Save to Photos handler — downloads watermarked images with social caption
  const saveBtn = modalBody.querySelector('.btn-modal-save-photo');
  if (saveBtn) saveBtn.addEventListener('click', () => savePhotosToDevice(entry, 'social'));
}

modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

// ── Comparison ────────────────────────────────────
btnCompare.addEventListener('click', () => {
  const filter = filterSelect.value;
  if (filter === 'all') return;

  const entries = PieLabJournal.getEntriesByStyle(filter);
  const analysis = PieLabJournal.analyzeEntries(entries);

  if (analysis.insufficient) {
    comparisonEl.innerHTML =
      '<p class="comparison-empty">You need at least 2 logged bakes to compare. Keep baking.</p>';
    comparisonEl.classList.remove('hidden');
    return;
  }

  let html = `
    <div class="comparison-header">
      <h3>Comparison \u2014 ${PIZZA_RECIPES[filter]?.name || filter}</h3>
      <span class="comparison-count">${analysis.totalEntries} entries</span>
    </div>
  `;

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
  html += '</div>';

  html += '<div class="comparison-table-wrapper"><table class="comparison-table">';
  html +=
    '<thead><tr><th>Date</th><th>Hydration</th><th>Bake Temp</th><th>Time</th><th>Oven</th><th>Rating</th></tr></thead><tbody>';

  entries.forEach((entry) => {
    const hydration = entry.doughSnapshot ? Math.round(entry.doughSnapshot.hydration * 100) : null;
    const bakeTemp = entry.bakeTemp ? Math.round(entry.bakeTemp / 25) * 25 : null;

    const hClass =
      hydration != null && analysis.bestHydration && hydration === analysis.bestHydration.value
        ? 'highlight-cell'
        : '';
    const tClass =
      bakeTemp != null && analysis.bestBakeTemp && bakeTemp === analysis.bestBakeTemp.value
        ? 'highlight-cell'
        : '';

    const ovenLabel = OVEN_TYPES[entry.ovenType] || escapeHtml(entry.ovenType) || '\u2014';

    html += `<tr>
      <td>${formatDate(entry.date)}</td>
      <td class="${hClass}">${hydration != null ? hydration + '%' : '\u2014'}</td>
      <td class="${tClass}">${entry.bakeTemp ? formatTemp(entry.bakeTemp) : '\u2014'}</td>
      <td>${entry.bakeTime ? entry.bakeTime + ' min' : '\u2014'}</td>
      <td>${ovenLabel}</td>
      <td class="stars-cell">${entry.rating ? renderStars(entry.rating) : '\u2014'}</td>
    </tr>`;
  });

  html += '</tbody></table></div>';
  html +=
    '<button class="btn-close-comparison" id="btn-close-comparison">Close Comparison</button>';

  comparisonEl.innerHTML = html;
  comparisonEl.classList.remove('hidden');
  comparisonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

  document.getElementById('btn-close-comparison').addEventListener('click', () => {
    comparisonEl.classList.add('hidden');
  });
});

// ── Milestone Celebration ─────────────────────────
function showMilestoneCelebration(entry) {
  if (window.PieLabHaptics) PieLabHaptics.success();
  const badge = entry.skillBadge || '';
  const badgeEmoji = badge.split(' ')[0];
  const badgeName = badge.split(' ').slice(1).join(' ');
  const isFirst = entry.skillCount === 1;

  const safeName = escapeHtml(entry.styleName);
  const title = isFirst ? 'Your First Bake!' : `${escapeHtml(badgeName)}!`;
  const msg = isFirst
    ? `You just logged <strong>${safeName}</strong>. Your pizza journey starts now.`
    : `<strong>${safeName}</strong> \u2014 bake #${entry.skillCount}. You\u2019ve earned a new badge.`;
  const hint = isFirst
    ? 'Fill your Style Passport by baking all 13 styles.'
    : `Keep going \u2014 your ${safeName} game is leveling up.`;

  const overlay = document.createElement('div');
  overlay.className = 'first-bake-overlay';
  overlay.innerHTML = `
    <div class="first-bake-card">
      <span class="first-bake-emoji">${badgeEmoji}</span>
      <h2 class="first-bake-title">${title}</h2>
      <p class="first-bake-msg">${msg}</p>
      <p class="first-bake-hint">${hint}</p>
      <button class="first-bake-dismiss">Let\u2019s Go</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('first-bake--visible'));

  const dismiss = () => {
    overlay.classList.remove('first-bake--visible');
    setTimeout(() => {
      overlay.remove();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };
  overlay.querySelector('.first-bake-dismiss').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
  setTimeout(dismiss, 8000);
}

// ── Passport Intro (shown after 2nd bake) ──────────────
function showPassportIntro() {
  const PASSPORT_INTRO_KEY = 'pielab-passport-intro-shown';
  if (localStorage.getItem(PASSPORT_INTRO_KEY) === '1') return;

  const overlay = document.createElement('div');
  overlay.className = 'first-bake-overlay';
  overlay.innerHTML = `
    <div class="first-bake-card" style="max-width: 360px;">
      <span class="first-bake-emoji">\uD83C\uDFDF\uFE0F</span>
      <h2 class="first-bake-title">Your Style Passport</h2>
      <p class="first-bake-msg">Every style you bake earns progress toward mastery. Here\u2019s how it works:</p>
      <div style="text-align:left;margin:0.75rem 0;font-size:0.9rem;line-height:1.6;">
        <div>\uD83C\uDF55 <strong>1 bake</strong> \u2014 First Stretch</div>
        <div>\uD83D\uDD25 <strong>4 bakes</strong> \u2014 Getting Comfortable</div>
        <div>\u2B50 <strong>9 bakes</strong> \u2014 Dialed In</div>
        <div>\uD83D\uDC68\u200D\uD83C\uDF73 <strong>16 bakes</strong> \u2014 Style Specialist</div>
        <div>\uD83C\uDFC6 <strong>26 bakes</strong> \u2014 Master of the Oven</div>
      </div>
      <p class="first-bake-hint">Check the Passport tab to see your journey.</p>
      <button class="first-bake-dismiss" id="passport-intro-btn">View Passport</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('first-bake--visible'));

  localStorage.setItem(PASSPORT_INTRO_KEY, '1');

  const dismiss = () => {
    overlay.classList.remove('first-bake--visible');
    setTimeout(() => overlay.remove(), 400);
  };
  overlay.querySelector('#passport-intro-btn').addEventListener('click', () => {
    dismiss();
    // Switch to Passport tab and scroll to top
    const passportTab = document.querySelector(".journal-tab[data-tab='passport']");
    if (passportTab) passportTab.click();
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
}

// ── Status Nudge Toast (1 bake from next tier) ────────
function showStatusNudge(styleName, nextBadgeName) {
  const toast = document.createElement('div');
  toast.className = 'status-nudge-toast';
  toast.textContent = `One more ${styleName} bake and you\u2019ll hit ${nextBadgeName}!`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('status-nudge--visible'));

  setTimeout(() => {
    toast.classList.remove('status-nudge--visible');
    setTimeout(() => toast.remove(), 400);
  }, 5000);
}

// ── Share Guide Popup (after saving a bake with photo) ──
const SHARE_GUIDE_KEY = 'pielab-share-guide-shown';
const SUBMIT_FORM_URL = 'https://REPLACE_WITH_YOUR_GOOGLE_FORM_URL';

function showShareGuide(entry) {
  // Only show once
  if (localStorage.getItem(SHARE_GUIDE_KEY)) return;

  const hasPhotos = (entry.photos && entry.photos.length) || entry.photo;
  if (!hasPhotos) return;

  localStorage.setItem(SHARE_GUIDE_KEY, '1');

  const overlay = document.createElement('div');
  overlay.className = 'share-guide-overlay';
  overlay.innerHTML = `
    <div class="share-guide-card">
      <h2 class="share-guide-title">Nice Shot!</h2>
      <p class="share-guide-subtitle">Your bake is saved. Here's how to show it off:</p>
      <div class="share-guide-options">
        <div class="share-guide-option">
          <span class="share-guide-icon">&#128172;</span>
          <div>
            <strong>Text it to friends</strong>
            <p>Open your bake, tap <em>Share This Bake</em>, and send the image in any messaging app.</p>
          </div>
        </div>
        <div class="share-guide-option">
          <span class="share-guide-icon">&#127758;</span>
          <div>
            <strong>Post to Social Media</strong>
            <p>Open your bake, then upload to your social media account. A caption with your bake stats is auto-copied.</p>
          </div>
        </div>
        <div class="share-guide-option">
          <span class="share-guide-icon">&#128247;</span>
          <div>
            <strong>Get Featured on @pielab.app</strong>
            <p>Submit your bake photo and you could be featured in our daily Instagram feed!</p>
          </div>
        </div>
      </div>
      <button class="share-guide-dismiss">Got It</button>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('share-guide--visible'));

  const dismiss = () => {
    overlay.classList.remove('share-guide--visible');
    setTimeout(() => {
      overlay.remove();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };
  overlay.querySelector('.share-guide-dismiss').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
}

// ── Instagram Submit Nudge (every 3rd bake) ──────

function showSubmitNudge(entry) {
  const hasPhotos = (entry.photos && entry.photos.length) || entry.photo;
  if (!hasPhotos) return;

  const totalBakes = PieLabJournal.getAllEntries().length;
  // Show on every 3rd bake, but not the 1st (share guide covers that)
  if (totalBakes < 3 || totalBakes % 3 !== 0) return;

  const overlay = document.createElement('div');
  overlay.className = 'share-guide-overlay';
  overlay.innerHTML = `
    <div class="share-guide-card">
      <h2 class="share-guide-title">Feature Your Bake?</h2>
      <p class="share-guide-subtitle">You\u2019ve logged ${totalBakes} bakes! Submit your best to <strong>@pielab.app</strong> on Instagram.</p>
      <div class="share-guide-options">
        <div class="share-guide-option">
          <span class="share-guide-icon">&#128247;</span>
          <div>
            <strong>Get Featured</strong>
            <p>Upload your bake photo and we\u2019ll pick the best submissions for our daily feed.</p>
          </div>
        </div>
      </div>
      <div class="submit-nudge-actions">
        <a href="${SUBMIT_FORM_URL}" target="_blank" rel="noopener" class="btn-primary submit-nudge-btn">Submit My Bake</a>
        <button class="share-guide-dismiss">Not Now</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('share-guide--visible'));

  const dismiss = () => {
    overlay.classList.remove('share-guide--visible');
    setTimeout(() => {
      overlay.remove();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  };
  overlay.querySelector('.share-guide-dismiss').addEventListener('click', dismiss);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) dismiss();
  });
}

// ── Share This Bake ────────────────────────────────
async function shareThisBake(entry, destination = 'social') {
  // 1. Read profile
  const profile = PieLabProfile.getProfile();
  const name = (profile.displayName || '').trim();
  const location = (profile.city || '').trim();

  if (!name) {
    showToast('Set your name in My Kitchen to share bakes');
    return;
  }

  // 2. Collect photos (from entry or IndexedDB)
  let photos =
    entry.photos && entry.photos.length ? entry.photos : entry.photo ? [entry.photo] : [];
  if (!photos.length && entry.id) {
    try {
      photos = await PieLabPhotos.getPhotos(entry.id);
    } catch {
      /* ignore */
    }
  }
  if (!photos.length) {
    showToast('Add a photo to share this bake');
    return;
  }

  // 3. Get skill level from entry-stamped badge
  const skillLevel = entry.skillBadge || null;

  // 4. Generate one share image per saved photo:
  //    - Photo 1: polaroid card (stats + watermark)
  //    - Photos 2+: watermarked photo only (no stats frame)
  showToast('Generating share image\u2026');
  const files = [];
  try {
    // First photo → polaroid with stats
    const polaroidBlob = await generatePolaroidCard(
      { ...entry, photos: [photos[0]] },
      { name, location, skillLevel }
    );
    files.push(new File([polaroidBlob], 'my-bake-1.png', { type: 'image/png' }));

    // Additional photos → watermark only
    for (let i = 1; i < photos.length; i++) {
      const wmBlob = await generateWatermarkedPhoto(photos[i]);
      files.push(new File([wmBlob], `my-bake-${i + 1}.png`, { type: 'image/png' }));
    }
  } catch {
    showToast('Could not generate share image');
    return;
  }

  // 5. Copy destination-aware caption to clipboard
  const caption = buildShareCaption(entry, { name, location, skillLevel }, destination);
  try {
    await navigator.clipboard.writeText(caption);
  } catch {
    /* ignore */
  }

  // 6. Share or download
  let canShareFiles;
  try {
    canShareFiles = navigator.share && navigator.canShare && navigator.canShare({ files });
  } catch {
    canShareFiles = false;
  }

  try {
    if (canShareFiles) {
      await navigator.share({
        files,
        title: 'Check out my bake on The Pie Lab',
        text: caption,
      });
    } else {
      files.forEach((f) => downloadBlob(f, f.name));
      showToast('Caption copied — paste into your post');
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      files.forEach((f) => downloadBlob(f, f.name));
      showToast('Caption copied — paste into your post');
    }
  }
}

/** Save watermarked images directly to device. */
async function savePhotosToDevice(entry, destination = 'social') {
  const profile = PieLabProfile.getProfile();
  const name = (profile.displayName || '').trim();
  const location = (profile.city || '').trim();
  const skillLevel = entry.skillBadge || null;

  let photos =
    entry.photos && entry.photos.length ? entry.photos : entry.photo ? [entry.photo] : [];
  if (!photos.length && entry.id) {
    try {
      photos = await PieLabPhotos.getPhotos(entry.id);
    } catch {
      /* ignore */
    }
  }
  if (!photos.length) {
    showToast('No photos to save');
    return;
  }

  showToast('Saving to photos\u2026');
  try {
    // First photo → polaroid with stats
    const polaroidBlob = await generatePolaroidCard(
      { ...entry, photos: [photos[0]] },
      { name, location, skillLevel }
    );
    downloadBlob(polaroidBlob, 'my-bake-1.png');

    // Additional photos → watermark only
    for (let i = 1; i < photos.length; i++) {
      const wmBlob = await generateWatermarkedPhoto(photos[i]);
      downloadBlob(wmBlob, `my-bake-${i + 1}.png`);
    }

    // Copy destination-aware caption for easy paste
    const caption = buildShareCaption(entry, { name, location, skillLevel }, destination);
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      /* ignore */
    }
    showToast('Saved! Caption copied — paste into your post');
  } catch {
    showToast('Could not save photos');
  }
}

/**
 * Build a ready-to-paste caption tailored to the share destination.
 * @param {object} entry   - journal entry
 * @param {object} profile - { name, location, skillLevel }
 * @param {"social"|"email"|"text"} destination
 */
function buildShareCaption(entry, profile, destination = 'social') {
  const styleName = entry.styleName || entry.styleKey || '';
  const parts = [];
  if (styleName) parts.push(styleName);
  if (profile.location) parts.push(profile.location);
  const headline = parts.length ? parts.join(' · ') : 'Homemade Pizza';
  const badge = profile.skillLevel ? `${profile.skillLevel}` : '';

  if (destination === 'email') {
    let caption = `Check out my latest bake: ${headline}`;
    if (badge) caption += ` (${badge})`;
    caption += '\n\nThePieLab.app';
    return caption;
  }

  if (destination === 'text') {
    let caption = headline;
    if (badge) caption += ` — ${badge}`;
    return caption;
  }

  // Social media — full caption with hashtags
  let caption = headline;
  if (badge) caption += ` — ${badge}`;
  caption += '\n\nThePieLab.app';
  caption += '\n\n#ThePieLab #HomemadePizza #PizzaMaking';
  if (styleName) {
    const tag = '#' + styleName.replace(/[^a-zA-Z0-9]/g, '');
    caption += ` ${tag}`;
  }
  return caption;
}

function downloadBlob(blobOrFile, filename) {
  const url = URL.createObjectURL(blobOrFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || blobOrFile.name || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Polaroid Card Generator ────────────────────────
function generatePolaroidCard(entry, profile) {
  return new Promise((resolve, reject) => {
    // Polaroid-style: thin equal borders top/left/right, thicker bottom for text
    const BORDER = 40; // top, left, right border
    const PHOTO_SIZE = 1080; // square photo area
    const BOTTOM_H = 150; // white text area below photo
    const W = BORDER + PHOTO_SIZE + BORDER; // 1160
    const H = BORDER + PHOTO_SIZE + BOTTOM_H + BORDER; // 1310
    const PHOTO_X = BORDER;
    const PHOTO_Y = BORDER;

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // White background (forms the Polaroid frame)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Load bake photo
    const photoSrc = entry.photos && entry.photos.length ? entry.photos[0] : entry.photo;
    const img = new Image();
    img.onload = () => {
      // Draw cropped/centered to fill photo area
      const srcW = img.width,
        srcH = img.height;
      const scale = Math.max(PHOTO_SIZE / srcW, PHOTO_SIZE / srcH);
      const drawW = srcW * scale,
        drawH = srcH * scale;
      const dx = PHOTO_X + (PHOTO_SIZE - drawW) / 2;
      const dy = PHOTO_Y + (PHOTO_SIZE - drawH) / 2;
      // Clip to photo area
      ctx.save();
      ctx.beginPath();
      ctx.rect(PHOTO_X, PHOTO_Y, PHOTO_SIZE, PHOTO_SIZE);
      ctx.clip();
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      // Load logo watermark (may fail — graceful)
      const logo = new Image();
      const photoBottom = PHOTO_Y + PHOTO_SIZE;
      logo.onload = () => {
        drawLogoWatermark(ctx, logo, PHOTO_X + PHOTO_SIZE, photoBottom);
        finishCard(ctx, canvas, entry, profile, W, H, PHOTO_X, photoBottom, resolve, reject);
      };
      logo.onerror = () => {
        finishCard(ctx, canvas, entry, profile, W, H, PHOTO_X, photoBottom, resolve, reject);
      };
      logo.src = 'assets/logos/logo-transparent.svg';
    };
    img.onerror = () => reject(new Error('Failed to load bake photo'));
    img.src = photoSrc;
  });
}

/** Generate a square watermarked photo (no polaroid frame / stats). */
function generateWatermarkedPhoto(photoDataUri) {
  return new Promise((resolve, reject) => {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      // Crop/center to fill 1080×1080
      const scale = Math.max(SIZE / img.width, SIZE / img.height);
      const drawW = img.width * scale,
        drawH = img.height * scale;
      const dx = (SIZE - drawW) / 2,
        dy = (SIZE - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Watermark
      const logo = new Image();
      logo.onload = () => {
        drawLogoWatermark(ctx, logo, SIZE, SIZE);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
          'image/png'
        );
      };
      logo.onerror = () => {
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('toBlob null'))),
          'image/png'
        );
      };
      logo.src = 'assets/logos/logo-transparent.svg';
    };
    img.onerror = () => reject(new Error('Failed to load photo for watermark'));
    img.src = photoDataUri;
  });
}

function drawLogoWatermark(ctx, logo, canvasW, photoH) {
  // Logo SVG is 600x300 (2:1 aspect) — render at 200x100 in bottom-right
  const LOGO_W = 200,
    LOGO_H = 100,
    MARGIN = 15;
  const x = canvasW - LOGO_W - MARGIN;
  const y = photoH - LOGO_H - MARGIN;

  // Draw logo tinted black using off-screen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = LOGO_W;
  offscreen.height = LOGO_H;
  const offCtx = offscreen.getContext('2d');
  offCtx.drawImage(logo, 0, 0, LOGO_W, LOGO_H);
  offCtx.globalCompositeOperation = 'source-in';
  offCtx.fillStyle = '#000000';
  offCtx.fillRect(0, 0, LOGO_W, LOGO_H);

  ctx.drawImage(offscreen, x, y);
}

function finishCard(ctx, canvas, entry, profile, W, H, LEFT, photoBottom, resolve, reject) {
  // Polaroid border is already white from initial fill — no separator line needed
  // Extra inset so text isn't clipped when Instagram crops edges
  const TEXT_PAD = 36;
  LEFT = LEFT + TEXT_PAD;
  const RIGHT = W - LEFT;

  // Text area starts below the photo with some padding
  const textTop = photoBottom + 28;

  // Line 1: Display Name (30px)
  const displayName = (profile.name || '').trim();
  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 30px Inter, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(displayName, LEFT, textTop);

  // Line 2: Location (24px)
  const location = (profile.location || '').trim();
  if (location) {
    ctx.fillStyle = '#555555';
    ctx.font = '400 24px Inter, sans-serif';
    ctx.fillText(location, LEFT, textTop + 34);
  }

  // Line 3: "Pizza Style, Oven Type" left (22px)
  const line3Y = textTop + 64;
  const styleName = entry.styleName || entry.styleKey || '';
  const ovenLabel =
    entry.ovenType && OVEN_TYPES[entry.ovenType]
      ? OVEN_TYPES[entry.ovenType]
      : entry.ovenType || '';
  const line3Parts = [styleName, ovenLabel].filter(Boolean);
  const line3Left = line3Parts.join(', ');

  ctx.fillStyle = '#555555';
  ctx.font = '400 22px Inter, sans-serif';
  ctx.textBaseline = 'alphabetic';
  if (line3Left) ctx.fillText(line3Left, LEFT, line3Y);

  // Line 4: Star rating + badge left, www.pielab.app right (20px)
  const line4Y = line3Y + 30;
  const rating = entry.rating || 0;
  const starStr = rating > 0 ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '';
  const badgeText = entry.skillBadge || '';
  const line4Parts = [starStr, badgeText].filter(Boolean);
  const line4Left = line4Parts.join(', ');

  ctx.fillStyle = '#555555';
  ctx.font = '400 20px Inter, sans-serif';
  ctx.textBaseline = 'alphabetic';
  if (line4Left) ctx.fillText(line4Left, LEFT, line4Y);

  // www.pielab.app right-aligned on line 4
  ctx.fillStyle = '#9a9690';
  ctx.font = 'italic 20px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('www.pielab.app', RIGHT, line4Y);
  ctx.textAlign = 'left';

  // Export
  canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('Canvas toBlob returned null'));
  }, 'image/png');
}

function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Style Passport ──────────────────────────────────
function renderPassport() {
  const grid = document.getElementById('passport-grid');
  const countEl = document.getElementById('passport-count');
  const progressEl = document.getElementById('passport-progress');
  if (!grid) return;

  const styleKeys = Object.keys(PIZZA_RECIPES);
  let unlocked = 0;

  grid.innerHTML = styleKeys
    .map((key) => {
      const recipe = PIZZA_RECIPES[key];
      const count = PieLabJournal.getBakesCountByStyle(key);
      const isUnlocked = count > 0;
      if (isUnlocked) unlocked++;

      if (isUnlocked) {
        const badge = PieLabJournal.getSkillBadge(count);
        return `<button type="button" class="passport-card unlocked" data-style="${key}">
          <span class="passport-badge">${badge.split(' ')[0]}</span>
          <span class="passport-style-name">${recipe.name}</span>
          <span class="passport-bake-count">${count} bake${count !== 1 ? 's' : ''}</span>
        </button>`;
      }

      return `<div class="passport-card locked">
        <span class="passport-badge">\uD83D\uDD12</span>
        <span class="passport-style-name">${recipe.name}</span>
        <span class="passport-bake-count">Not yet baked</span>
      </div>`;
    })
    .join('');

  if (countEl) countEl.textContent = unlocked;
  if (progressEl && unlocked === styleKeys.length) {
    progressEl.innerHTML = '\uD83C\uDF89 All styles unlocked!';
  }

  // Clicking an unlocked card shows bake history below the grid
  grid.querySelectorAll('.passport-card.unlocked').forEach((card) => {
    card.addEventListener('click', () => {
      const styleKey = card.dataset.style;
      togglePassportBakeList(styleKey, card);
    });
  });
}

function togglePassportBakeList(styleKey, card) {
  const section = document.getElementById('passport-section');
  const existing = document.getElementById('passport-bake-list');

  // If already showing this style, collapse it
  if (existing && existing.dataset.style === styleKey) {
    existing.remove();
    card.classList.remove('passport-card--active');
    return;
  }

  // Remove any existing list
  if (existing) existing.remove();
  document
    .querySelectorAll('.passport-card--active')
    .forEach((c) => c.classList.remove('passport-card--active'));

  const entries = PieLabJournal.getEntriesByStyle(styleKey);
  if (!entries || entries.length === 0) return;

  // Sort most recent first
  entries.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const recipe = PIZZA_RECIPES[styleKey] || null;
  const styleName = recipe ? recipe.name : styleKey;

  let html = `<div class="passport-bake-list" id="passport-bake-list" data-style="${styleKey}">
    <h4 class="passport-bake-list-title">${escapeHtml(styleName)} Bakes</h4>
    <div class="passport-bake-items">`;

  entries.forEach((entry) => {
    const hasPhoto = entry.photoCount > 0 || (entry.photos && entry.photos.length) || entry.photo;
    const thumbHtml = hasPhoto
      ? `<div class="passport-bake-thumb-placeholder" data-passport-photo-id="${entry.id}"></div>`
      : `<div class="passport-bake-thumb-placeholder">\uD83C\uDF55</div>`;

    const stars = entry.rating ? renderStars(entry.rating) : '';

    html += `
      <button type="button" class="passport-bake-item" data-entry-id="${entry.id}">
        ${thumbHtml}
        <div class="passport-bake-info">
          <span class="passport-bake-date">${formatDate(entry.date)}</span>
          ${entry.bakeName ? `<span class="passport-bake-name">${escapeHtml(entry.bakeName)}</span>` : ''}
          ${stars ? `<span class="passport-bake-stars">${stars}</span>` : ''}
          ${entry.skillBadge ? `<span class="passport-bake-badge">${entry.skillBadge}</span>` : ''}
        </div>
      </button>`;
  });

  html += '</div></div>';

  section.insertAdjacentHTML('beforeend', html);
  card.classList.add('passport-card--active');

  // Click handler to open detail modal
  const list = document.getElementById('passport-bake-list');
  list.querySelectorAll('.passport-bake-item').forEach((item) => {
    item.addEventListener('click', () => {
      const entryId = item.dataset.entryId;
      const entry = entries.find((e) => e.id === entryId);
      if (entry) openDetailModal(entry);
    });
  });

  // Lazy-load passport thumbnails from IndexedDB
  list.querySelectorAll('[data-passport-photo-id]').forEach((el) => {
    PieLabPhotos.getPhotos(el.dataset.passportPhotoId)
      .then((photos) => {
        if (photos && photos.length) {
          const img = document.createElement('img');
          img.className = 'passport-bake-thumb';
          img.alt = 'Bake photo';
          img.src = photos[0];
          el.replaceWith(img);
        } else {
          el.textContent = '\uD83C\uDF55';
        }
      })
      .catch(() => {
        el.textContent = '\uD83C\uDF55';
      });
  });

  // Scroll list into view
  list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Journal Guide (post-first-bake) ──────────────
// Shown once after the first-bake calculator guide completes and user navigates
// to the journal. Teaches logging a bake, then viewing & sharing.

const JOURNAL_GUIDE_KEY = 'pielab-journal-guide-pending';
const JOURNAL_GUIDE_DONE_KEY = 'pielab-journal-guide-done';

const journalGuideSteps = [
  {
    title: 'Name Your Bake',
    body: 'Give your bake a name \u2014 \u2018Sunday Night Margherita\u2019 or anything that helps you remember it. This is optional, so skip it if you want.',
    target: '#j-bake-name',
  },
  {
    title: 'Verify Your Style',
    body: 'Make sure the style matches what you baked. We prefilled it from your recipe \u2014 change it if you switched things up.',
    target: '#j-style',
  },
  {
    title: 'Set the Date',
    body: 'Defaults to today. Change it if you\u2019re logging a past bake.',
    target: '#j-date',
  },
  {
    title: 'Bake Details',
    body: 'Record your bake temp, time, and oven type. These help you dial in future bakes and see what worked best.',
    target: '#j-bake-details-grid',
  },
  {
    title: 'Rate Your Bake',
    body: 'How\u2019d it turn out? Tap a star to rate this bake. You can compare ratings across styles in your journal over time.',
    target: '#j-star-rating',
  },
  {
    title: 'Add Photos',
    body: 'Snap a photo of your finished pizza, or add photos from earlier steps. Up to 4 photos per bake \u2014 great for tracking your progress.',
    target: '#j-photo-add-btn',
  },
  {
    title: 'Save & Share',
    body: 'Hit Save Entry to log this bake. Once saved, you can tap the bake card to share it with friends or save it to your camera roll.',
    target: '.btn-save-entry',
    nextLabel: 'Got It!',
  },
];

let jgOverlay = null;
let jgCardEl = null;
let jgHighlight = null;
let jgStep = 0;
let jgCleanup = null;

function shouldShowJournalGuide() {
  if (localStorage.getItem(JOURNAL_GUIDE_DONE_KEY) === '1') return false;
  if (localStorage.getItem(JOURNAL_GUIDE_KEY) !== '1') return false;
  // Only show when form is prefilled (user came from calculator)
  const params = new URLSearchParams(window.location.search);
  return params.get('prefill') === '1';
}

function startJournalGuide() {
  jgStep = 0;
  jgOverlay = document.createElement('div');
  jgOverlay.className = 'firstbake-overlay';
  jgOverlay.innerHTML = `
    <div class="firstbake-card">
      <button class="firstbake-skip" id="jg-skip" aria-label="Close guide">Skip</button>
      <div class="firstbake-step-count" id="jg-step-count"></div>
      <h3 class="firstbake-title" id="jg-title"></h3>
      <p class="firstbake-body" id="jg-body"></p>
      <div class="firstbake-actions">
        <button class="firstbake-btn firstbake-btn--next" id="jg-next">Next</button>
      </div>
    </div>
  `;

  // Move card to body level so it escapes overlay's stacking context
  jgCardEl = jgOverlay.querySelector('.firstbake-card');
  document.body.appendChild(jgCardEl);

  jgHighlight = document.createElement('div');
  jgHighlight.className = 'firstbake-highlight hidden';
  document.body.appendChild(jgHighlight);
  document.body.appendChild(jgOverlay);

  document.getElementById('jg-next').addEventListener('click', jgNextStep);
  document.getElementById('jg-skip').addEventListener('click', jgClose);

  requestAnimationFrame(() => jgOverlay.classList.add('firstbake-overlay--visible'));
  jgRenderStep();
}

function jgRenderStep() {
  jgCleanupWait();
  const step = journalGuideSteps[jgStep];
  const total = journalGuideSteps.length;

  document.getElementById('jg-step-count').textContent = `Step ${jgStep + 1} of ${total}`;
  document.getElementById('jg-title').textContent = step.title;
  document.getElementById('jg-body').textContent = step.body;

  const nextBtn = document.getElementById('jg-next');
  nextBtn.classList.remove('hidden');
  nextBtn.textContent = step.nextLabel || (jgStep === total - 1 ? 'Done' : 'Next');

  // Highlight
  if (jgHighlight) jgHighlight.classList.add('hidden');
  if (step.target) {
    setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (!jgHighlight) return;
          const rect = el.getBoundingClientRect();
          const pad = 6;
          jgHighlight.style.top = rect.top + window.scrollY - pad + 'px';
          jgHighlight.style.left = rect.left - pad + 'px';
          jgHighlight.style.width = rect.width + pad * 2 + 'px';
          jgHighlight.style.height = rect.height + pad * 2 + 'px';
          jgHighlight.classList.remove('hidden');
        }, 350);
      }
    }, step.delay || 50);
  }

  // waitFor
  if (step.waitFor) {
    const { selector, event } = step.waitFor;
    const el = document.querySelector(selector);
    if (el) {
      const stepWhenRegistered = jgStep;
      const handler = () => {
        setTimeout(() => {
          if (jgStep === stepWhenRegistered) jgNextStep();
        }, 600);
      };
      el.addEventListener(event, handler, { once: true });
      jgCleanup = () => el.removeEventListener(event, handler);
    }
  }
}

function jgCleanupWait() {
  if (jgCleanup) {
    jgCleanup();
    jgCleanup = null;
  }
}

function jgNextStep() {
  if (jgStep < journalGuideSteps.length - 1) {
    jgStep++;
    jgRenderStep();
  } else {
    jgClose();
  }
}

function jgClose() {
  jgCleanupWait();
  localStorage.setItem(JOURNAL_GUIDE_DONE_KEY, '1');
  localStorage.removeItem(JOURNAL_GUIDE_KEY);
  if (jgHighlight) {
    jgHighlight.remove();
    jgHighlight = null;
  }
  if (jgCardEl) {
    jgCardEl.remove();
    jgCardEl = null;
  }
  if (jgOverlay) {
    jgOverlay.classList.remove('firstbake-overlay--visible');
    setTimeout(() => {
      if (jgOverlay) {
        jgOverlay.remove();
        jgOverlay = null;
      }
    }, 300);
  }
}

// ── Dough Library ──────────────────────────────────
const doughLibSection = document.getElementById('dough-library-section');
const _doughLibBody = document.getElementById('dough-library-body');
const doughLibGrid = document.getElementById('dough-library-grid');
const doughLibEmpty = document.getElementById('dough-library-empty');
const doughLibFilter = document.getElementById('dough-library-style-filter');

function renderDoughLibrary() {
  if (!doughLibSection) return;
  const allDoughs = PieLabJournal.getAllProfiles();
  if (allDoughs.length === 0) {
    if (doughLibGrid) doughLibGrid.innerHTML = '';
    if (doughLibEmpty) doughLibEmpty.classList.remove('hidden');
    return;
  }
  if (doughLibEmpty) doughLibEmpty.classList.add('hidden');

  // Populate style filter
  const styles = [...new Set(allDoughs.map((d) => d.styleKey))];
  const currentFilter = doughLibFilter ? doughLibFilter.value : 'all';
  if (doughLibFilter) {
    doughLibFilter.innerHTML = '<option value="all">All Styles</option>';
    styles.forEach((key) => {
      const name = PIZZA_RECIPES[key] ? PIZZA_RECIPES[key].name : key;
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = name;
      doughLibFilter.appendChild(opt);
    });
    doughLibFilter.value = currentFilter;
  }

  const filtered =
    currentFilter === 'all' ? allDoughs : allDoughs.filter((d) => d.styleKey === currentFilter);

  if (filtered.length === 0) {
    doughLibGrid.innerHTML = '';
    doughLibEmpty.classList.remove('hidden');
    return;
  }
  doughLibEmpty.classList.add('hidden');

  doughLibGrid.innerHTML = filtered
    .map((d) => {
      const s = d.settings || {};
      const styleName = PIZZA_RECIPES[d.styleKey] ? PIZZA_RECIPES[d.styleKey].name : d.styleKey;
      const date = new Date(d.createdAt).toLocaleDateString();
      return `
      <div class="dough-library-card" data-id="${d.id}">
        <div class="dough-card-header">
          <span class="dough-card-name">${escapeHtml(d.name)}</span>
          <button type="button" class="dough-card-delete" data-id="${d.id}" title="Delete dough">&times;</button>
        </div>
        <span class="dough-card-style">${escapeHtml(styleName)}</span>
        <div class="dough-card-details">
          <span>Hydration: ${(s.hydration * 100).toFixed(1)}%</span>
          <span>Salt: ${(s.saltPct * 100).toFixed(1)}%</span>
          <span>Yeast: ${(s.yeastPct * 100).toFixed(2)}%</span>
          <span>Ball: ${s.doughBallWeight}g</span>
          ${s.flourType ? `<span>Flour: ${escapeHtml(s.flourType)}</span>` : ''}
          ${s.yeastType ? `<span>Yeast: ${escapeHtml(YEAST_LABELS[s.yeastType] || s.yeastType)}</span>` : ''}
          ${s.fermentHours ? `<span>Ferment: ${s.fermentHours}h</span>` : ''}
        </div>
        <span class="dough-card-date">Saved ${date}</span>
        <button type="button" class="btn-load-dough" data-id="${d.id}">Use in Calculator</button>
      </div>`;
    })
    .join('');

  // Delete handlers
  doughLibGrid.querySelectorAll('.dough-card-delete').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Delete this saved dough?')) {
        PieLabJournal.deleteProfile(btn.dataset.id);
        if (window.PieLabHaptics) PieLabHaptics.warning();
        renderDoughLibrary();
      }
    });
  });

  // Load into calculator handlers
  doughLibGrid.querySelectorAll('.btn-load-dough').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dough = allDoughs.find((d) => d.id === btn.dataset.id);
      if (!dough) return;
      const settings = dough.settings || {};
      const calcData = {
        styleKey: dough.styleKey,
        styleName: PIZZA_RECIPES[dough.styleKey]
          ? PIZZA_RECIPES[dough.styleKey].name
          : dough.styleKey,
        sizeKey: null,
        numPizzas: 1,
        ovenType: '',
        useCustom: true,
        doughSnapshot: settings,
        // Carry ferment data from profile so calculator can restore Plan My Bake state
        fermentHours: settings.fermentHours || null,
        fermentTemp: settings.fermentTemp || null,
        yeastType: settings.yeastType || null,
      };
      PieLabStorage.set('pielab-last-calc', calcData);
      window.location.href = 'calculator.html?load=1';
    });
  });
}

if (doughLibFilter) {
  doughLibFilter.addEventListener('change', renderDoughLibrary);
}

// ── Journal Tabs ─────────────────────────────────
const tabBar = document.getElementById('journal-tabs');
if (tabBar) {
  const tabs = tabBar.querySelectorAll('.journal-tab');
  const panels = document.querySelectorAll('.journal-tab-panel');

  function switchTab(tabName) {
    tabs.forEach((t) => {
      const isActive = t.dataset.tab === tabName;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach((p) => {
      p.classList.toggle('active', p.id === 'tab-panel-' + tabName);
    });
    localStorage.setItem('pielab-journal-tab', tabName);
    // Recalculate accordion heights when Bakes tab becomes visible
    if (tabName === 'bakes') {
      setTimeout(() => {
        document.querySelectorAll('#tab-panel-bakes .accordion-item.open').forEach((item) => {
          const body = item.querySelector('.accordion-body');
          if (body) body.style.maxHeight = body.scrollHeight + 'px';
        });
      }, 50);
    }
  }

  tabs.forEach((t) => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // Force Bakes tab when coming from "Log This Bake" (prefill mode)
  const tabParams = new URLSearchParams(window.location.search);
  if (tabParams.get('prefill') === '1') {
    switchTab('bakes');
  } else {
    // Restore saved tab
    const savedTab = localStorage.getItem('pielab-journal-tab');
    if (savedTab && document.getElementById('tab-panel-' + savedTab)) {
      switchTab(savedTab);
    }
  }
}

// ── Journal Welcome Tour (2nd app session) ────────
const JOURNAL_TOUR_DONE_KEY = 'pielab-journal-tour-done';

function shouldShowJournalTour() {
  if (localStorage.getItem(JOURNAL_TOUR_DONE_KEY) === '1') return false;
  if (localStorage.getItem(JOURNAL_GUIDE_DONE_KEY) === '1') return false;
  // Don't show if first-bake guide is pending or active
  if (localStorage.getItem(JOURNAL_GUIDE_KEY) === '1') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('prefill') === '1') return false;
  const sessions = parseInt(PieLabStorage.get('pielab-session-count') || '0', 10);
  return sessions >= 2;
}

const journalTourSteps = [
  {
    title: 'Your Bakes',
    body: "This is where all your bakes live. Each time you make a pizza, log it here with a rating, photos, and tasting notes. Over time you'll build a record of what works and what to improve.",
    target: '#tab-panel-bakes',
  },
  {
    title: 'Style Passport',
    body: "The passport tracks your progress across all 13 pizza styles. As you log more bakes in each style, you'll earn skill badges — from First Bake all the way up to Pizzaiolo. It helps you dial in your recipe and build real skills.",
    target: ".journal-tab[data-tab='passport']",
    action: () => {
      document.querySelector(".journal-tab[data-tab='passport']")?.click();
    },
  },
  {
    title: 'Dough Library',
    body: "Save your best dough recipes here so you can load them instantly in the calculator next time. Think of it as your personal recipe book for doughs you've perfected.",
    target: ".journal-tab[data-tab='library']",
    nextLabel: 'Got It!',
    action: () => {
      document.querySelector(".journal-tab[data-tab='library']")?.click();
    },
  },
];

let jtOverlay = null;
let jtHighlight = null;
let jtStep = 0;

function startJournalTour() {
  jtStep = 0;
  jtOverlay = document.createElement('div');
  jtOverlay.className = 'firstbake-overlay';
  jtOverlay.innerHTML = `
    <div class="firstbake-card">
      <button class="firstbake-skip" id="jt-skip" aria-label="Close tour">Skip</button>
      <div class="firstbake-step-count" id="jt-step-count"></div>
      <h3 class="firstbake-title" id="jt-title"></h3>
      <p class="firstbake-body" id="jt-body"></p>
      <div class="firstbake-actions">
        <button class="firstbake-btn firstbake-btn--next" id="jt-next">Next</button>
      </div>
    </div>
  `;

  jtHighlight = document.createElement('div');
  jtHighlight.className = 'firstbake-highlight hidden';
  document.body.appendChild(jtHighlight);
  document.body.appendChild(jtOverlay);

  document.getElementById('jt-next').addEventListener('click', jtNextStep);
  document.getElementById('jt-skip').addEventListener('click', jtClose);

  requestAnimationFrame(() => jtOverlay.classList.add('firstbake-overlay--visible'));
  jtRenderStep();
}

function jtRenderStep() {
  const step = journalTourSteps[jtStep];
  const total = journalTourSteps.length;

  document.getElementById('jt-step-count').textContent = `Step ${jtStep + 1} of ${total}`;
  document.getElementById('jt-title').textContent = step.title;
  document.getElementById('jt-body').textContent = step.body;

  const nextBtn = document.getElementById('jt-next');
  nextBtn.textContent = step.nextLabel || (jtStep === total - 1 ? 'Done' : 'Next');

  // Run action (e.g., switch tabs)
  if (step.action) step.action();

  // Highlight target
  if (jtHighlight) jtHighlight.classList.add('hidden');
  if (step.target) {
    setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (!jtHighlight) return;
          const rect = el.getBoundingClientRect();
          const pad = 6;
          jtHighlight.style.top = rect.top + window.scrollY - pad + 'px';
          jtHighlight.style.left = rect.left - pad + 'px';
          jtHighlight.style.width = rect.width + pad * 2 + 'px';
          jtHighlight.style.height = rect.height + pad * 2 + 'px';
          jtHighlight.classList.remove('hidden');
        }, 350);
      }
    }, 100);
  }
}

function jtNextStep() {
  if (jtStep < journalTourSteps.length - 1) {
    jtStep++;
    jtRenderStep();
  } else {
    jtClose();
  }
}

function jtClose() {
  localStorage.setItem(JOURNAL_TOUR_DONE_KEY, '1');
  if (jtHighlight) {
    jtHighlight.remove();
    jtHighlight = null;
  }
  if (jtOverlay) {
    jtOverlay.classList.remove('firstbake-overlay--visible');
    setTimeout(() => {
      if (jtOverlay) {
        jtOverlay.remove();
        jtOverlay = null;
      }
      // Return to bakes tab
      document.querySelector(".journal-tab[data-tab='bakes']")?.click();
    }, 300);
  }
}

// ── Initialize ────────────────────────────────────
populateDropdowns();
populateOvenDropdown();

// Migrate localStorage photos to IndexedDB on first load, then render
function initRender() {
  renderEntries();
  renderStats();
  renderAnalytics();
  renderPassport();
  renderDoughLibrary();
  updateCompareButton();
  updateStorageDisplay();
}

PieLabPhotos.migrateFromLocalStorage()
  .then(() => initRender())
  .catch(() => initRender());

// Initialize open accordion body heights after content renders
// Only works if Bakes tab is visible; otherwise switchTab handles it
setTimeout(() => {
  const bakesPanel = document.getElementById('tab-panel-bakes');
  if (bakesPanel && bakesPanel.classList.contains('active')) {
    bakesPanel.querySelectorAll('.accordion-item.open').forEach((item) => {
      const body = item.querySelector('.accordion-body');
      if (body) body.style.maxHeight = body.scrollHeight + 'px';
    });
  }
}, 200);

// Start journal guide if flagged by the first-bake guide
if (shouldShowJournalGuide()) {
  setTimeout(() => startJournalGuide(), 800);
} else if (shouldShowJournalTour()) {
  setTimeout(() => startJournalTour(), 800);
}
