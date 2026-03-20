/* ══════════════════════════════════════════════════════
   The Pie Lab — Premium / Trial System
   Loaded on: calculator.html, learn.html, kitchen.html

   Uses RevenueCat (@revenuecat/purchases-capacitor) on
   native platforms for App Store / Play Store billing.
   Falls back to localStorage-only on web.
   ══════════════════════════════════════════════════════ */

window.PieLabPremium = (function () {
  const STORAGE_KEY = "pielab-premium";
  const TRIAL_DAYS = 14;
  const PRODUCT_ID = "pielab_pro_lifetime";

  // ── Persistence helpers ──────────────────────────────
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch { return {}; }
  }

  function save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  // ── Native store detection ─────────────────────────
  function isNative() {
    return typeof Capacitor !== "undefined" && Capacitor.isNativePlatform();
  }

  function getRevenueCat() {
    if (typeof Purchases !== "undefined") return Purchases;
    if (typeof window.Purchases !== "undefined") return window.Purchases;
    return null;
  }

  // ── RevenueCat initialization ──────────────────────
  let rcInitialized = false;

  async function initRevenueCat() {
    if (rcInitialized || !isNative()) return;
    const rc = getRevenueCat();
    if (!rc) return;

    try {
      // API keys — replace with your actual RevenueCat project keys
      const platform = Capacitor.getPlatform();
      const apiKey = platform === "ios"
        ? "appl_YOUR_REVENUECAT_IOS_API_KEY"
        : "goog_YOUR_REVENUECAT_ANDROID_API_KEY";

      await rc.configure({ apiKey });
      rcInitialized = true;

      // Sync entitlement state on launch
      await syncEntitlements();
    } catch {
      // RevenueCat not available — fall back to localStorage
    }
  }

  // ── Entitlement sync ───────────────────────────────
  // Checks RevenueCat for active "pro" entitlement and
  // syncs the result to localStorage so the rest of the
  // app can read it synchronously.
  async function syncEntitlements() {
    const rc = getRevenueCat();
    if (!rc || !rcInitialized) return;

    try {
      const { customerInfo } = await rc.getCustomerInfo();
      const entitlement = customerInfo.entitlements.active["pro"];
      const data = load();

      if (entitlement) {
        data.isPro = true;
        data.store = entitlement.store;
        save(data);
      } else if (data.store) {
        // Entitlement was revoked (refund) — remove Pro
        data.isPro = false;
        delete data.store;
        save(data);
      }
    } catch {
      // Network error — keep current localStorage state
    }

    renderBadge();
  }

  // ── Purchase flow ──────────────────────────────────
  async function purchasePro() {
    if (isPro()) return true;

    if (!isNative()) {
      // Web: no store available
      showPurchaseUnavailable();
      return false;
    }

    const rc = getRevenueCat();
    if (!rc || !rcInitialized) {
      await initRevenueCat();
      if (!rcInitialized) {
        showPurchaseUnavailable();
        return false;
      }
    }

    try {
      updateModalState("purchasing");
      const { offerings } = await rc.getOfferings();
      const pkg = offerings.current && offerings.current.lifetime;

      if (!pkg) {
        showPurchaseError("Product not available. Please try again later.");
        return false;
      }

      const { customerInfo } = await rc.purchasePackage({ aPackage: pkg });
      const entitled = customerInfo.entitlements.active["pro"];

      if (entitled) {
        const data = load();
        data.isPro = true;
        data.store = entitled.store;
        save(data);
        renderBadge();
        hideModal();
        if (window.PieLabHaptics) PieLabHaptics.success();
        return true;
      }

      showPurchaseError("Purchase could not be verified. Please restart the app.");
      return false;
    } catch (err) {
      if (err.userCancelled) {
        updateModalState("expired");
        return false;
      }
      showPurchaseError("Purchase failed. Please try again.");
      return false;
    }
  }

  // ── Restore purchases ──────────────────────────────
  async function restorePurchases() {
    const rc = getRevenueCat();
    if (!rc || !rcInitialized) return false;

    try {
      const { customerInfo } = await rc.restorePurchases();
      const entitled = customerInfo.entitlements.active["pro"];

      if (entitled) {
        const data = load();
        data.isPro = true;
        data.store = entitled.store;
        save(data);
        renderBadge();
        return true;
      }
    } catch {
      // Restore failed
    }

    return false;
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
        <span class="premium-modal-icon">\u{1F513}</span>
        <h3 class="premium-modal-title">Unlock Pro Features</h3>
        <p class="premium-modal-desc">
          Get access to preferment calculations, dynamic yeast scaling,
          DDT water temperature tools, and more.
        </p>
        <button class="btn-start-trial" id="btn-premium-trial">Set Up My Kitchen</button>
        <p class="premium-modal-footer">No credit card required. $4.99 one-time purchase after trial.</p>
        <p class="premium-modal-error hidden" id="premium-purchase-error"></p>
        <button class="premium-restore-link hidden" id="btn-premium-restore">Restore Purchase</button>
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
    modalOverlay.querySelector("#btn-premium-trial").addEventListener("click", async () => {
      if (!trialStart() && !isPro()) {
        // No trial yet — send to Kitchen Profile to start trial
        hideModal();
        window.location.href = "kitchen.html";
        return;
      }

      if (isExpired()) {
        // Trial expired — initiate store purchase
        await purchasePro();
        if (isPro() && pendingCallback) {
          const cb = pendingCallback;
          pendingCallback = null;
          cb();
        }
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

    // Restore purchases handler
    modalOverlay.querySelector("#btn-premium-restore").addEventListener("click", async () => {
      const restored = await restorePurchases();
      if (restored) {
        hideModal();
        if (pendingCallback) {
          const cb = pendingCallback;
          pendingCallback = null;
          cb();
        }
      } else {
        showPurchaseError("No previous purchase found.");
      }
    });
  }

  function updateModalState(state) {
    if (!modalOverlay) return;
    const btn = modalOverlay.querySelector("#btn-premium-trial");
    const errorEl = modalOverlay.querySelector("#premium-purchase-error");

    if (state === "purchasing") {
      btn.textContent = "Processing\u2026";
      btn.disabled = true;
      btn.classList.add("btn-disabled");
      errorEl.classList.add("hidden");
    } else if (state === "expired") {
      btn.textContent = "Unlock Pro \u2014 $4.99";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
    }
  }

  function showPurchaseError(msg) {
    if (!modalOverlay) return;
    const btn = modalOverlay.querySelector("#btn-premium-trial");
    const errorEl = modalOverlay.querySelector("#premium-purchase-error");
    btn.textContent = "Unlock Pro \u2014 $4.99";
    btn.disabled = false;
    btn.classList.remove("btn-disabled");
    errorEl.textContent = msg;
    errorEl.classList.remove("hidden");
  }

  function showPurchaseUnavailable() {
    if (!modalOverlay) createModal();
    const errorEl = modalOverlay.querySelector("#premium-purchase-error");
    errorEl.textContent = "In-app purchases are only available in the mobile app.";
    errorEl.classList.remove("hidden");
  }

  function showModal() {
    createModal();

    const btn = modalOverlay.querySelector("#btn-premium-trial");
    const desc = modalOverlay.querySelector(".premium-modal-desc");
    const footer = modalOverlay.querySelector(".premium-modal-footer");
    const errorEl = modalOverlay.querySelector("#premium-purchase-error");
    const restoreBtn = modalOverlay.querySelector("#btn-premium-restore");

    // Reset error state
    errorEl.classList.add("hidden");

    if (isExpired()) {
      btn.textContent = "Unlock Pro \u2014 $4.99";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      desc.textContent = "Your 14-day trial has ended. Unlock all Pro features permanently.";
      footer.textContent = "One-time $4.99 purchase. No subscription.";
      restoreBtn.classList.remove("hidden");
    } else if (canUse()) {
      btn.textContent = "Continue with Trial";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      restoreBtn.classList.add("hidden");
    } else {
      // No trial started — direct to Kitchen Profile
      btn.textContent = "Set Up My Kitchen";
      btn.disabled = false;
      btn.classList.remove("btn-disabled");
      desc.textContent = "Fill out your Kitchen Profile to unlock a free 14-day trial of all Pro features.";
      footer.textContent = "No credit card required. $4.99 one-time purchase after trial.";
      restoreBtn.classList.add("hidden");
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

  // ── Verify-then-gate ──────────────────────────────────
  // Re-checks entitlement with RevenueCat before gating.
  // On native: calls getCustomerInfo() to refresh the local
  // cache, then gates. On web: RevenueCat is unavailable, so
  // we skip the sync and gate using the localStorage cache.
  async function verifyAndGate(callback) {
    if (isNative()) {
      await syncEntitlements();
    }
    gate(callback);
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
  document.addEventListener("DOMContentLoaded", () => {
    renderBadge();
    initRevenueCat();
  });

  // ── Expose ───────────────────────────────────────────
  return {
    canUse,
    startTrial,
    daysLeft,
    isExpired,
    isPro,
    gate,
    verifyAndGate,
    renderBadge,
    purchasePro,
    restorePurchases,
    syncEntitlements,
  };
})();
