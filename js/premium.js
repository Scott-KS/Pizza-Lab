/* ══════════════════════════════════════════════════════
   The Pie Lab — Premium / Trial System
   Loaded on: calculator.html, learn.html
   ══════════════════════════════════════════════════════ */

window.PieLabPremium = (function () {
  const STORAGE_KEY = "pielab-premium";
  const TRIAL_DAYS = 7;

  // ── Persistence helpers ──────────────────────────────
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  // ── Public API ───────────────────────────────────────

  function isPro() {
    return !!load().isPro;
  }

  function trialStart() {
    return load().trialStart || null;
  }

  function daysLeft() {
    const ts = trialStart();
    if (!ts) return -1;
    const elapsed = (Date.now() - ts) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(TRIAL_DAYS - elapsed));
  }

  function isExpired() {
    const ts = trialStart();
    if (!ts) return false;
    return daysLeft() <= 0 && !isPro();
  }

  function canUse() {
    if (isPro()) return true;
    const ts = trialStart();
    if (!ts) return false;
    return daysLeft() > 0;
  }

  function startTrial() {
    const data = load();
    if (!data.trialStart) {
      data.trialStart = Date.now();
      save(data);
    }
    renderBadge();
  }

  // ── Paywall Modal ────────────────────────────────────

  let modalOverlay = null;
  let pendingCallback = null;

  function createModal() {
    if (modalOverlay) return;

    modalOverlay = document.createElement("div");
    modalOverlay.className = "premium-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="premium-modal-card">
        <span class="premium-modal-icon">🔓</span>
        <h3 class="premium-modal-title">Unlock Pro Features</h3>
        <p class="premium-modal-desc">
          Get access to preferment calculations, dynamic yeast scaling,
          DDT water temperature tools, and more.
        </p>
        <button class="btn-start-trial" id="btn-premium-trial">Start 7-Day Free Trial</button>
        <p class="premium-modal-footer">No credit card required. Full pricing coming soon.</p>
        <button class="premium-modal-close" aria-label="Close">&times;</button>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Close handlers
    modalOverlay.querySelector(".premium-modal-close").addEventListener("click", hideModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) hideModal();
    });

    // Start trial handler
    modalOverlay.querySelector("#btn-premium-trial").addEventListener("click", () => {
      startTrial();
      hideModal();
      // Re-invoke the gated action
      if (pendingCallback) {
        const cb = pendingCallback;
        pendingCallback = null;
        cb();
      }
    });
  }

  function showModal() {
    createModal();

    // Update button text based on state
    const btn = modalOverlay.querySelector("#btn-premium-trial");
    if (isExpired()) {
      btn.textContent = "Trial Expired — Coming Soon";
      btn.disabled = true;
      btn.classList.add("btn-disabled");
    } else if (canUse()) {
      // Trial active — shouldn't see modal, but just in case
      btn.textContent = "Continue with Trial";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
    } else {
      btn.textContent = "Start 7-Day Free Trial";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
    }

    modalOverlay.classList.add("premium-modal--visible");
  }

  function hideModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove("premium-modal--visible");
      pendingCallback = null;
    }
  }

  // ── Gate function ────────────────────────────────────

  function gate(callback) {
    if (canUse()) {
      callback();
      return;
    }
    pendingCallback = callback;
    showModal();
  }

  // ── Header Badge ─────────────────────────────────────

  function renderBadge() {
    let badge = document.getElementById("premium-badge");
    if (!badge) {
      const nav = document.querySelector(".nav-logo");
      if (!nav) return;
      badge = document.createElement("span");
      badge.id = "premium-badge";
      nav.parentNode.insertBefore(badge, nav.nextSibling);
    }

    if (isPro()) {
      badge.className = "premium-badge pro";
      badge.textContent = "PRO";
    } else if (canUse()) {
      const d = daysLeft();
      badge.className = "premium-badge trial";
      badge.textContent = `Trial: ${d}d left`;
    } else if (isExpired()) {
      badge.className = "premium-badge expired";
      badge.textContent = "Trial Expired";
    } else {
      // No trial started — hide badge
      badge.className = "premium-badge hidden";
      badge.textContent = "";
    }
  }

  // ── Init on load ─────────────────────────────────────
  document.addEventListener("DOMContentLoaded", renderBadge);

  // ── Expose ───────────────────────────────────────────
  return {
    canUse,
    startTrial,
    daysLeft,
    isExpired,
    isPro,
    gate,
    renderBadge,
  };
})();
