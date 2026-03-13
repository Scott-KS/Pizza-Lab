/* ══════════════════════════════════════════════════════
   The Pie Lab — Shared Navigation & Utilities
   Loaded on every page before feature scripts.
   ══════════════════════════════════════════════════════ */

// ── Register Service Worker (PWA offline support) ─────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {/* SW unsupported */});
  });
}

// ── Canonical Oven Types (6 types) ────────────────────
const OVEN_TYPES = {
  steel:        "Home Oven + Pizza Steel",
  stone:        "Home Oven + Pizza Stone",
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

  // Schedule badge + session banner + data notice
  updateScheduleBadge();
  updateSessionBanner();
  showDataNotice();
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

// ── Session Progress Banner ─────────────────────────
function updateSessionBanner() {
  const page = document.body.dataset.page;

  // Create or find the banner element
  let banner = document.querySelector(".session-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "session-banner";
    const header = document.querySelector("header.site-header");
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    } else if (header) {
      header.parentNode.appendChild(banner);
    } else {
      return; // no header found (splash page)
    }
  }

  let scheduleData = null;
  let lastCalcData = null;

  try {
    const rawSchedule = localStorage.getItem("pielab-active-schedule");
    if (rawSchedule) scheduleData = JSON.parse(rawSchedule);
  } catch { /* ignore */ }

  try {
    const rawCalc = localStorage.getItem("pielab-last-calc");
    if (rawCalc) lastCalcData = JSON.parse(rawCalc);
  } catch { /* ignore */ }

  const now = new Date();
  const fourHoursAgo = new Date(now.getTime() - 4 * 3600000);

  // ── STATE 1 & 2: Active schedule ──
  if (scheduleData && scheduleData.steps && scheduleData.steps.length > 0) {
    // Find the eat step (last step)
    const eatStep = scheduleData.steps[scheduleData.steps.length - 1];
    const eatTime = new Date(eatStep.dateTime);

    // Find next unchecked step in the future
    let nextStep = null;
    for (const step of scheduleData.steps) {
      const stepTime = new Date(step.dateTime);
      if (!step.checked && stepTime > now) {
        nextStep = step;
        break;
      }
    }

    // STATE 1: Eat time has passed (within last 4 hours), or all steps done
    if (eatTime <= now && eatTime >= fourHoursAgo) {
      banner.innerHTML =
        '<span>Bake time!</span> How did it turn out? ' +
        '<a href="journal.html?prefill=1">Log This Bake \u2192</a>';
      banner.removeAttribute("hidden");
      return;
    }

    // Also STATE 1 if eat time is future but no unchecked future steps remain
    if (!nextStep && eatTime <= now) {
      banner.innerHTML =
        '<span>Bake time!</span> How did it turn out? ' +
        '<a href="journal.html?prefill=1">Log This Bake \u2192</a>';
      banner.removeAttribute("hidden");
      return;
    }

    // STATE 2: Schedule running, eat time in the future
    if (eatTime > now && nextStep) {
      const timeStr = new Date(nextStep.dateTime).toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
      banner.innerHTML =
        '<span>Schedule active.</span> Next: ' + nextStep.label +
        ' at ' + timeStr +
        ' <a href="schedule.html">View \u2192</a>';
      banner.removeAttribute("hidden");
      return;
    }
  }

  // ── STATE 3: Calculation done, no active schedule ──
  if (lastCalcData && lastCalcData.styleKey && !scheduleData) {
    // Only show on pages other than calculator (the Make page)
    if (page !== "calculator") {
      banner.innerHTML =
        '<span>Dough calculated.</span> Ready to schedule? ' +
        '<a href="schedule.html">Start Schedule \u2192</a>';
      banner.removeAttribute("hidden");
      return;
    }
  }

  // ── STATE 4: Nothing active ──
  banner.setAttribute("hidden", "");
}

// ── First-Visit Data Notice Banner ──────────────────
function showDataNotice() {
  if (localStorage.getItem("pielab-notice-dismissed")) return;

  // Don't show on splash page
  const page = document.body.dataset.page;
  if (page === "welcome") return;

  const notice = document.createElement("div");
  notice.className = "data-notice";
  notice.innerHTML =
    '<p>The Pie Lab stores your data locally on this device. We don\u2019t collect or share your information. ' +
    '<a href="legal.html#privacy">Privacy Policy</a></p>' +
    '<button class="data-notice-dismiss" aria-label="Dismiss">\u00D7</button>';

  document.body.prepend(notice);

  notice.querySelector(".data-notice-dismiss").addEventListener("click", () => {
    localStorage.setItem("pielab-notice-dismissed", "1");
    notice.remove();
  });
}
