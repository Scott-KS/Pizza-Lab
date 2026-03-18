/* ══════════════════════════════════════════════════════
   The Pie Lab — Premium / Trial System
   Loaded on: calculator.html, learn.html, kitchen.html
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
        <button class="btn-start-trial" id="btn-premium-trial">Set Up My Kitchen</button>
        <p class="premium-modal-footer">No credit card required. $4.99 one-time purchase after trial.</p>
        <button class="premium-modal-close" aria-label="Close">&times;</button>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Close handlers
    modalOverlay.querySelector(".premium-modal-close").addEventListener("click", hideModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) hideModal();
    });

    // Action button handler
    modalOverlay.querySelector("#btn-premium-trial").addEventListener("click", () => {
      if (!trialStart() && !isPro()) {
        // No trial yet — send to Kitchen Profile to start trial
        hideModal();
        window.location.href = "kitchen.html";
        return;
      }
      hideModal();
      // Re-invoke the gated action if trial is active
      if (canUse() && pendingCallback) {
        const cb = pendingCallback;
        pendingCallback = null;
        cb();
      }
    });
  }

  function showModal() {
    createModal();

    const btn = modalOverlay.querySelector("#btn-premium-trial");
    const desc = modalOverlay.querySelector(".premium-modal-desc");
    const footer = modalOverlay.querySelector(".premium-modal-footer");

    if (isExpired()) {
      btn.textContent = "Unlock Pro \u2014 $4.99";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      desc.textContent = "Your 7-day trial has ended. Unlock all Pro features permanently.";
      footer.textContent = "One-time $4.99 purchase. No subscription.";
    } else if (canUse()) {
      btn.textContent = "Continue with Trial";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
    } else {
      // No trial started — direct to Kitchen Profile
      btn.textContent = "Set Up My Kitchen";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      desc.textContent = "Fill out your Kitchen Profile to unlock a free 7-day trial of all Pro features.";
      footer.textContent = "No credit card required. $4.99 one-time purchase after trial.";
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

    // PRO tags always stay visible as feature indicators
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
