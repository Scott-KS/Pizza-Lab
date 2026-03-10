/* ══════════════════════════════════════════════════════
   The Pie Lab — Shared Navigation & Utilities
   Loaded on every page before feature scripts.
   ══════════════════════════════════════════════════════ */

// ── Canonical Oven Types (6 types) ────────────────────
const OVEN_TYPES = {
  stone:        "Home Oven + Pizza Stone",
  steel:        "Home Oven + Pizza Steel",
  ooni:         "Ooni / Portable Pizza Oven",
  "wood-fired": "Wood-Fired Oven",
  "cast-iron":  "Cast Iron Skillet",
  pan:          "Sheet Pan / Home Oven",
};

// ── Populate any <select> with pizza styles ───────────
function populateStyleSelect(selectEl, options = {}) {
  const { includeAll = false, placeholder = "Select a style\u2026" } = options;
  selectEl.innerHTML = "";

  if (placeholder) {
    const ph = document.createElement("option");
    ph.value = "";
    ph.disabled = true;
    ph.selected = true;
    ph.textContent = placeholder;
    selectEl.appendChild(ph);
  }

  if (includeAll) {
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "All Styles";
    selectEl.appendChild(all);
  }

  for (const [key, recipe] of Object.entries(PIZZA_RECIPES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = recipe.name;
    selectEl.appendChild(opt);
  }
}

// ── Populate any <select> with oven types ─────────────
function populateOvenSelect(selectEl) {
  selectEl.innerHTML = "";
  for (const [key, label] of Object.entries(OVEN_TYPES)) {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}

// ── Navigation Active State + Schedule Badge ──────────
(function initNav() {
  const page = document.body.dataset.page;
  if (!page) return;

  // Desktop nav links
  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.toggle("active", link.dataset.page === page);
  });

  // Mobile tab bar
  document.querySelectorAll(".tab-item").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.page === page);
  });

  // Schedule badge
  updateScheduleBadge();
})();

function updateScheduleBadge() {
  const badges = document.querySelectorAll(".schedule-badge");
  try {
    const raw = localStorage.getItem("pielab-active-schedule");
    const parsed = raw ? JSON.parse(raw) : null;
    const has = parsed && parsed.steps && parsed.steps.length > 0;
    badges.forEach(b => b.classList.toggle("hidden", !has));
  } catch {
    badges.forEach(b => b.classList.add("hidden"));
  }
}
