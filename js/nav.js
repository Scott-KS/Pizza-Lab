/* ══════════════════════════════════════════════════════
   The Pie Lab — Shared Navigation & Utilities
   Loaded on every page before feature scripts.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';
import { PIZZA_RECIPES } from '../recipes.js';
import { PieLabPremium } from './premium.js';

// ── Shared Utilities ─────────────────────────────────
export function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Shared toast notification. Shows a brief message at bottom of screen.
 * @param {string} message — text to display
 * @param {number} duration — ms before auto-dismiss (default 2500)
 */
export function showToast(message, duration = 2500) {
  const existing = document.querySelector('.pielab-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'pielab-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('pielab-toast--visible'));
  setTimeout(() => {
    toast.classList.remove('pielab-toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Shared alarm beep utility. Each caller can customise freq, gain, offsets, and interval.
 * Returns { stop() } handle.
 */
export function createAlarmBeep({
  freq = 880,
  gain = 0.35,
  offsets = [0, 0.25, 0.5],
  interval = 1500,
} = {}) {
  let ctx = null;
  let intervalId = null;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return { stop() {} };
  }
  function beep() {
    if (!ctx) return;
    offsets.forEach((offset) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g);
      g.connect(ctx.destination);
      osc.frequency.value = freq;
      g.gain.value = gain;
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  }
  beep();
  intervalId = setInterval(beep, interval);
  return {
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (ctx) {
        try {
          ctx.close();
        } catch {
          /* ignore */
        }
        ctx = null;
      }
    },
  };
}

// ── Register Service Worker (PWA offline support) ─────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* SW unsupported */
    });
  });
}

// ── Canonical Oven Types (5 types) ────────────────────
export const OVEN_TYPES = {
  home: 'Home Oven',
  'wood-fired': 'Pizza Oven \u2014 Wood-Fired',
  gas: 'Pizza Oven \u2014 Gas',
  portable: 'Countertop \u2014 Portable',
  electric: 'Countertop \u2014 Electric',
};

// ── Migrate legacy oven keys ─────────────────────────
// One-time migration for users with old oven values stored
// in localStorage (steel/stone/rack → home, portable → gas).
const OVEN_KEY_MIGRATION = {
  steel: 'home',
  stone: 'home',
  rack: 'home',
  portable: 'gas',
};

function migrateOvenKeys() {
  // Migrate profile.preferredOven
  try {
    const raw = localStorage.getItem('pielab-user-profile');
    if (raw) {
      const profile = JSON.parse(raw);
      const mapped = OVEN_KEY_MIGRATION[profile.preferredOven];
      if (mapped) {
        profile.preferredOven = mapped;
        localStorage.setItem('pielab-user-profile', JSON.stringify(profile));
      }
    }
  } catch {
    /* ignore */
  }

  // Migrate journal entries' ovenType
  try {
    const raw = localStorage.getItem('pielab_journal_entries');
    if (raw) {
      const entries = JSON.parse(raw);
      let changed = false;
      for (const entry of entries) {
        const mapped = OVEN_KEY_MIGRATION[entry.ovenType];
        if (mapped) {
          entry.ovenType = mapped;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('pielab_journal_entries', JSON.stringify(entries));
      }
    }
  } catch {
    /* ignore */
  }

  // Migrate scaling memory ovenType values
  try {
    const raw = localStorage.getItem('pielab-scaling-memory');
    if (raw) {
      const mem = JSON.parse(raw);
      let changed = false;
      for (const key of Object.keys(mem)) {
        const mapped = OVEN_KEY_MIGRATION[mem[key].ovenType];
        if (mapped) {
          mem[key].ovenType = mapped;
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem('pielab-scaling-memory', JSON.stringify(mem));
      }
    }
  } catch {
    /* ignore */
  }

  // Migrate last-calc ovenType
  try {
    const raw = localStorage.getItem('pielab-last-calc');
    if (raw) {
      const calc = JSON.parse(raw);
      const mapped = OVEN_KEY_MIGRATION[calc.ovenType];
      if (mapped) {
        calc.ovenType = mapped;
        localStorage.setItem('pielab-last-calc', JSON.stringify(calc));
      }
    }
  } catch {
    /* ignore */
  }

  // Migrate active schedule ovenType
  try {
    const raw = localStorage.getItem('pielab-active-schedule');
    if (raw) {
      const sched = JSON.parse(raw);
      const mapped = OVEN_KEY_MIGRATION[sched.ovenType];
      if (mapped) {
        sched.ovenType = mapped;
        localStorage.setItem('pielab-active-schedule', JSON.stringify(sched));
      }
    }
  } catch {
    /* ignore */
  }
}

migrateOvenKeys();

// ── Populate any <select> with pizza styles ───────────
export function populateStyleSelect(selectEl, options = {}) {
  const { includeAll = false, placeholder = 'Select a style\u2026' } = options;
  selectEl.innerHTML = '';

  if (placeholder) {
    const ph = document.createElement('option');
    ph.value = '';
    ph.disabled = true;
    ph.selected = true;
    ph.textContent = placeholder;
    selectEl.appendChild(ph);
  }

  if (includeAll) {
    const all = document.createElement('option');
    all.value = 'all';
    all.textContent = 'All Styles';
    selectEl.appendChild(all);
  }

  for (const [key, recipe] of Object.entries(PIZZA_RECIPES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = recipe.name;
    selectEl.appendChild(opt);
  }
}

// ── Populate any <select> with oven types ─────────────
export function populateOvenSelect(selectEl) {
  selectEl.innerHTML = '';
  for (const [key, label] of Object.entries(OVEN_TYPES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = label;
    selectEl.appendChild(opt);
  }
}

// ── localStorage Quota Warning ───────────────────────
// On native, Preferences has no 5MB limit, so skip this check.
(function checkStorageQuota() {
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) return;
  try {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pielab')) {
        totalBytes += (localStorage.getItem(key) || '').length * 2; // UTF-16
      }
    }
    const limitBytes = 5 * 1024 * 1024; // 5MB typical limit
    const WARNED_KEY = 'pielab-storage-warning-shown';
    if (totalBytes > limitBytes * 0.8 && !sessionStorage.getItem(WARNED_KEY)) {
      sessionStorage.setItem(WARNED_KEY, '1');
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
      // Show a non-blocking toast after page loads
      setTimeout(() => {
        const toast = document.createElement('div');
        toast.className = 'storage-warning-toast';
        toast.innerHTML = `Storage ${usedMB} MB of ~5 MB used. <a href="kitchen.html">Export your data</a> as a backup.`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
          toast.classList.remove('visible');
          setTimeout(() => toast.remove(), 400);
        }, 8000);
      }, 2000);
    }
  } catch {
    /* ignore */
  }
})();

// ── App Session Counter ──────────────────────────────
// Increments once per browser session using sessionStorage as a dedup guard.
(function trackAppSession() {
  if (sessionStorage.getItem('pielab-session-counted')) return;
  sessionStorage.setItem('pielab-session-counted', '1');
  try {
    const count = parseInt(PieLabStorage.get('pielab-session-count') || '0', 10);
    PieLabStorage.set('pielab-session-count', String(count + 1));
  } catch {
    /* ignore */
  }
})();

// ── Navigation Active State + Schedule Badge ──────────
function initNav() {
  const page = document.body.dataset.page;
  if (!page) return;

  // Desktop nav links
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Mobile tab bar
  document.querySelectorAll('.tab-item').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.page === page);
  });

  // Schedule badge + session banner + data notice
  updateScheduleBadge();
  updateSessionBanner();
  showDataNotice();
}

// Defer initNav to DOMContentLoaded so PieLabStorage cache is populated
document.addEventListener('DOMContentLoaded', async () => {
  await PieLabStorage.init();
  initNav();
});

export function updateScheduleBadge() {
  const badges = document.querySelectorAll('.schedule-badge');
  try {
    const parsed = PieLabStorage.getJSON('pielab-active-schedule');
    const has = parsed && parsed.steps && parsed.steps.length > 0;
    badges.forEach((b) => b.classList.toggle('hidden', !has));
  } catch {
    badges.forEach((b) => b.classList.add('hidden'));
  }
}

// ── Session Progress Banner ─────────────────────────
function updateSessionBanner() {
  const page = document.body.dataset.page;

  // Create or find the banner element
  let banner = document.querySelector('.session-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.className = 'session-banner';
    const header = document.querySelector('header.site-header');
    if (header && header.nextSibling) {
      header.parentNode.insertBefore(banner, header.nextSibling);
    } else if (header) {
      header.parentNode.appendChild(banner);
    } else {
      return; // no header found (splash page)
    }
  }

  let scheduleData = PieLabStorage.getJSON('pielab-active-schedule');
  let lastCalcData = PieLabStorage.getJSON('pielab-last-calc');

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
      banner.removeAttribute('hidden');
      return;
    }

    // Also STATE 1 if eat time is future but no unchecked future steps remain
    if (!nextStep && eatTime <= now) {
      banner.innerHTML =
        '<span>Bake time!</span> How did it turn out? ' +
        '<a href="journal.html?prefill=1">Log This Bake \u2192</a>';
      banner.removeAttribute('hidden');
      return;
    }

    // STATE 2: Schedule running, eat time in the future
    if (eatTime > now && nextStep) {
      const timeStr = new Date(nextStep.dateTime).toLocaleString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      banner.innerHTML =
        '<span>Schedule active.</span> Next: ' +
        nextStep.label +
        ' at ' +
        timeStr +
        ' <a href="schedule.html">View \u2192</a>';
      banner.removeAttribute('hidden');
      return;
    }
  }

  // ── STATE 3: Calculation done, no active schedule ──
  if (lastCalcData && lastCalcData.styleKey && !scheduleData) {
    // Only show on pages other than calculator (the Make page)
    if (page !== 'calculator') {
      banner.innerHTML =
        '<span>Dough calculated.</span> Ready to schedule? ' +
        '<a href="schedule.html">Start Schedule \u2192</a>';
      banner.removeAttribute('hidden');
      return;
    }
  }

  // ── STATE 4: Nothing active ──
  banner.setAttribute('hidden', '');
}

// ── Pro Feature Lock State ───────────────────────────
// Adds PRO badge to Schedule nav links and applies .pro-locked
// class to all Pro-gated elements when trial is expired / not started.
function applyProLockState() {
  const locked = !PieLabPremium.canUse();

  // Inject PRO tag into Schedule nav links (desktop + mobile)
  document
    .querySelectorAll('.nav-link[data-page="schedule"], .tab-item[data-page="schedule"]')
    .forEach((link) => {
      if (!link.querySelector('.premium-tag')) {
        const tag = document.createElement('span');
        tag.className = 'premium-tag';
        tag.textContent = 'PRO';
        // For mobile tab bar, append after .tab-label as sibling; for desktop, append to link
        const label = link.querySelector('.tab-label');
        if (label) {
          link.appendChild(tag);
        } else {
          // Desktop nav — insert before the schedule-badge span
          const badge = link.querySelector('.schedule-badge');
          if (badge) link.insertBefore(tag, badge);
          else link.appendChild(tag);
        }
      }
    });

  // Inject PRO tag into Scheduler page heading
  const schedHeading = document.querySelector('.dough-scheduler > h2');
  if (schedHeading && !schedHeading.querySelector('.premium-tag')) {
    const tag = document.createElement('span');
    tag.className = 'premium-tag';
    tag.textContent = 'PRO';
    schedHeading.appendChild(document.createTextNode(' '));
    schedHeading.appendChild(tag);
  }

  // Apply or remove .pro-locked class on lockable elements
  // Selectors for elements that should show locked state
  const lockableSelectors = [
    '.toolkit-tab[data-tool="hydration"]',
    '.toolkit-tab[data-tool="troubleshoot"]',
    '.toolkit-tab[data-tool="compare"]',
    '.toolkit-tab[data-tool="ddt"]',
    '.mode-btn[data-mode="plan"]',
    '#btn-save-profile',
    '#analytics-toggle',
  ];

  lockableSelectors.forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.classList.toggle('pro-locked', locked);
  });

  // Lock the scheduler wizard when expired
  const schedWizard = document.getElementById('scheduler-progress');
  if (schedWizard) schedWizard.classList.toggle('pro-locked', locked);
}

// Run after DOMContentLoaded so premium.js is loaded
document.addEventListener('DOMContentLoaded', applyProLockState);

// ── First-Visit Data Notice Banner ──────────────────
function showDataNotice() {
  if (localStorage.getItem('pielab-notice-dismissed')) return;

  // Don't show on splash page
  const page = document.body.dataset.page;
  if (page === 'welcome') return;

  const notice = document.createElement('div');
  notice.className = 'data-notice';
  notice.innerHTML =
    '<p>The Pie Lab stores your data locally on this device. We don\u2019t collect or share your information. ' +
    '<a href="legal.html#privacy">Privacy Policy</a></p>' +
    '<button class="data-notice-dismiss" aria-label="Dismiss">\u00D7</button>';

  document.body.prepend(notice);

  notice.querySelector('.data-notice-dismiss').addEventListener('click', () => {
    localStorage.setItem('pielab-notice-dismissed', '1');
    notice.remove();
  });
}

// ── Hide mobile tab bar when virtual keyboard is open ──
(function initKeyboardDetection() {
  const tabBar = document.querySelector('.mobile-tab-bar');
  if (!tabBar) return;

  if (window.visualViewport) {
    const threshold = 150; // pixels — keyboards are typically 200px+

    window.visualViewport.addEventListener('resize', () => {
      const heightDiff = window.innerHeight - window.visualViewport.height;
      if (heightDiff > threshold) {
        tabBar.classList.add('keyboard-open');
      } else {
        tabBar.classList.remove('keyboard-open');
      }
    });
  } else {
    // Fallback: hide on focus of text inputs
    document.addEventListener('focusin', (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        tabBar.classList.add('keyboard-open');
      }
    });
    document.addEventListener('focusout', () => {
      tabBar.classList.remove('keyboard-open');
    });
  }
})();
