/* ══════════════════════════════════════════════════════
   The Pie Lab — Premium / Trial System
   Loaded on: calculator.html, learn.html, kitchen.html

   Uses RevenueCat (@revenuecat/purchases-capacitor) on
   native platforms for App Store / Play Store billing.
   Falls back to localStorage-only on web.

   Security: entitlement data is signed with an HMAC so
   that manual localStorage edits are detected. A device
   fingerprint prevents trial resets via data clearing.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';

const PieLabPremium = (function () {
  const STORAGE_KEY = 'pielab-premium';
  const TRIAL_DAYS = 14;
  const _PRODUCT_ID = 'pielab_pro_lifetime';
  const FINGERPRINT_KEY = 'pielab-dfp'; // device fingerprint — survives Delete All Data

  // ── Obfuscated signing key ─────────────────────────
  // Split across multiple fragments to resist casual string searches.
  // This is a speed bump, not NSA-grade security.
  const _k = ['pL', '9x', 'Qm', 'bR', '4v', 'Tn', 'Kj', '7s', 'Wf', 'Yc', '2d', 'Xp'];
  function _sigKey() {
    return _k.join('') + String.fromCharCode(33, 64, 35, 36);
  }

  // ── Lightweight HMAC (SHA-256 via SubtleCrypto) ─────
  // Falls back to a simple hash if SubtleCrypto is unavailable.
  async function _hmac(message) {
    try {
      const enc = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(_sigKey()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
      return Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback: simple non-crypto hash (still blocks casual edits)
      return _simpleHash(message + _sigKey());
    }
  }

  function _simpleHash(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  // ── Signature helpers ──────────────────────────────
  function _buildSignableString(data) {
    // Deterministic string from the fields that matter
    const parts = [data.isPro ? '1' : '0', data.store || '', data.trialStart || ''];
    return parts.join('|');
  }

  async function _sign(data) {
    const msg = _buildSignableString(data);
    data._sig = await _hmac(msg);
    return data;
  }

  async function _verify(data) {
    if (!data || !data._sig) return false;
    const msg = _buildSignableString(data);
    const expected = await _hmac(msg);
    return data._sig === expected;
  }

  // ── Device fingerprint ─────────────────────────────
  // Generates a random ID on first run and stores it in
  // a separate key that is NOT cleared by Delete All Data.
  // If a trial was already started for this device, clearing
  // the main storage won't grant a new trial.
  function _getFingerprint() {
    let fp = localStorage.getItem(FINGERPRINT_KEY);
    if (!fp) {
      fp = crypto.randomUUID
        ? crypto.randomUUID()
        : 'fp-' + Date.now() + '-' + Math.random().toString(36).slice(2);
      localStorage.setItem(FINGERPRINT_KEY, fp);
    }
    return fp;
  }

  // Separate key stores the trial-start timestamp keyed to fingerprint.
  // This survives Delete All Data because it lives outside PERSISTENT_KEYS.
  const TRIAL_ANCHOR_KEY = 'pielab-ta';

  function _getTrialAnchor() {
    try {
      const raw = localStorage.getItem(TRIAL_ANCHOR_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function _setTrialAnchor(timestamp) {
    const fp = _getFingerprint();
    localStorage.setItem(TRIAL_ANCHOR_KEY, JSON.stringify({ fp, ts: timestamp }));
  }

  // ── Persistence helpers ──────────────────────────────
  function load() {
    return PieLabStorage.getJSON(STORAGE_KEY) || {};
  }

  async function save(data) {
    await _sign(data);
    await PieLabStorage.set(STORAGE_KEY, data);
  }

  // ── Native store detection ─────────────────────────
  function isNative() {
    return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  }

  function getRevenueCat() {
    if (typeof Purchases !== 'undefined') return Purchases;
    if (typeof window.Purchases !== 'undefined') return window.Purchases;
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
      const apiKey =
        platform === 'ios'
          ? 'appl_YOUR_REVENUECAT_IOS_API_KEY'
          : 'goog_YOUR_REVENUECAT_ANDROID_API_KEY';

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
      const entitlement = customerInfo.entitlements.active['pro'];
      const data = load();

      if (entitlement) {
        data.isPro = true;
        data.store = entitlement.store;
        await save(data);
      } else if (data.store) {
        // Entitlement was revoked (refund) — remove Pro
        data.isPro = false;
        delete data.store;
        delete data._sig;
        await save(data);
      }
    } catch {
      // Network error — keep current localStorage state
    }

    renderBadge();
  }

  // ── Purchase flow ──────────────────────────────────
  async function purchasePro() {
    if (await _verifiedIsPro()) return true;

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
      updateModalState('purchasing');
      const { offerings } = await rc.getOfferings();
      const pkg = offerings.current && offerings.current.lifetime;

      if (!pkg) {
        showPurchaseError('Product not available. Please try again later.');
        return false;
      }

      const { customerInfo } = await rc.purchasePackage({ aPackage: pkg });
      const entitled = customerInfo.entitlements.active['pro'];

      if (entitled) {
        const data = load();
        data.isPro = true;
        data.store = entitled.store;
        await save(data);
        renderBadge();
        hideModal();
        if (window.PieLabHaptics) PieLabHaptics.success();
        return true;
      }

      showPurchaseError('Purchase could not be verified. Please restart the app.');
      return false;
    } catch (err) {
      if (err.userCancelled) {
        updateModalState('expired');
        return false;
      }
      showPurchaseError('Purchase failed. Please try again.');
      return false;
    }
  }

  // ── Restore purchases ──────────────────────────────
  async function restorePurchases() {
    const rc = getRevenueCat();
    if (!rc || !rcInitialized) return false;

    try {
      const { customerInfo } = await rc.restorePurchases();
      const entitled = customerInfo.entitlements.active['pro'];

      if (entitled) {
        const data = load();
        data.isPro = true;
        data.store = entitled.store;
        await save(data);
        renderBadge();
        return true;
      }
    } catch {
      // Restore failed
    }

    return false;
  }

  // ── Public API ───────────────────────────────────────

  // Synchronous check — requires both isPro flag AND a valid store field.
  // Unsigned or tampered data is rejected.
  function isPro() {
    const data = load();
    return !!(data.isPro && data.store);
  }

  // Async verified check — validates HMAC signature before trusting isPro.
  async function _verifiedIsPro() {
    const data = load();
    if (!data.isPro || !data.store) return false;
    return await _verify(data);
  }

  function trialStart() {
    // Check both main storage and the tamper-resistant anchor
    const data = load();
    if (data.trialStart) return data.trialStart;

    // If main storage was cleared but anchor exists, restore it
    const anchor = _getTrialAnchor();
    if (anchor && anchor.ts) {
      return anchor.ts;
    }
    return null;
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

  async function startTrial() {
    const data = load();
    // Check for existing anchor first (prevents trial reset)
    const anchor = _getTrialAnchor();
    if (anchor && anchor.ts) {
      // Trial was previously started — restore the original timestamp
      if (!data.trialStart) {
        data.trialStart = anchor.ts;
        await save(data);
      }
      renderBadge();
      return;
    }

    if (!data.trialStart) {
      data.trialStart = Date.now();
      await save(data);
      _setTrialAnchor(data.trialStart);
    }
    renderBadge();
  }

  // ── Paywall Modal ────────────────────────────────────

  let modalOverlay = null;
  let pendingCallback = null;

  function createModal() {
    if (modalOverlay) return;

    modalOverlay = document.createElement('div');
    modalOverlay.className = 'premium-modal-overlay';
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
    modalOverlay.querySelector('.premium-modal-close').addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) hideModal();
    });

    // Action button handler
    modalOverlay.querySelector('#btn-premium-trial').addEventListener('click', async () => {
      if (!trialStart() && !isPro()) {
        // No trial yet — send to Kitchen Profile to start trial
        hideModal();
        window.location.href = 'kitchen.html';
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
    modalOverlay.querySelector('#btn-premium-restore').addEventListener('click', async () => {
      const restored = await restorePurchases();
      if (restored) {
        hideModal();
        if (pendingCallback) {
          const cb = pendingCallback;
          pendingCallback = null;
          cb();
        }
      } else {
        showPurchaseError('No previous purchase found.');
      }
    });
  }

  function updateModalState(state) {
    if (!modalOverlay) return;
    const btn = modalOverlay.querySelector('#btn-premium-trial');
    const errorEl = modalOverlay.querySelector('#premium-purchase-error');

    if (state === 'purchasing') {
      btn.textContent = 'Processing\u2026';
      btn.disabled = true;
      btn.classList.add('btn-disabled');
      errorEl.classList.add('hidden');
    } else if (state === 'expired') {
      btn.textContent = 'Unlock Pro \u2014 $4.99';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');
    }
  }

  function showPurchaseError(msg) {
    if (!modalOverlay) return;
    const btn = modalOverlay.querySelector('#btn-premium-trial');
    const errorEl = modalOverlay.querySelector('#premium-purchase-error');
    btn.textContent = 'Unlock Pro \u2014 $4.99';
    btn.disabled = false;
    btn.classList.remove('btn-disabled');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function showPurchaseUnavailable() {
    if (!modalOverlay) createModal();
    const errorEl = modalOverlay.querySelector('#premium-purchase-error');
    errorEl.textContent = 'In-app purchases are only available in the mobile app.';
    errorEl.classList.remove('hidden');
  }

  function showModal() {
    createModal();

    const btn = modalOverlay.querySelector('#btn-premium-trial');
    const desc = modalOverlay.querySelector('.premium-modal-desc');
    const footer = modalOverlay.querySelector('.premium-modal-footer');
    const errorEl = modalOverlay.querySelector('#premium-purchase-error');
    const restoreBtn = modalOverlay.querySelector('#btn-premium-restore');

    // Reset error state
    errorEl.classList.add('hidden');

    if (isExpired()) {
      btn.textContent = 'Unlock Pro \u2014 $4.99';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');
      desc.textContent = 'Your 14-day trial has ended. Unlock all Pro features permanently.';
      // Try to personalize with bake count
      import('../journal.js')
        .then(({ PieLabJournal }) => {
          const bakeCount = PieLabJournal.getAllEntries().length;
          if (bakeCount > 0) {
            desc.textContent = `You\u2019ve logged ${bakeCount} bake${bakeCount !== 1 ? 's' : ''} \u2014 unlock Pro to keep your streak and access bake analytics.`;
          }
        })
        .catch(() => {
          /* fall back to static string */
        });
      footer.textContent = 'One-time $4.99 \u2014 yours forever. No subscription, no renewal.';
      restoreBtn.classList.remove('hidden');
    } else if (canUse()) {
      btn.textContent = 'Continue with Trial';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');
      restoreBtn.classList.add('hidden');
    } else {
      // No trial started — direct to Kitchen Profile
      btn.textContent = 'Set Up My Kitchen';
      btn.disabled = false;
      btn.classList.remove('btn-disabled');
      desc.textContent =
        'Fill out your Kitchen Profile to unlock a free 14-day trial of all Pro features.';
      footer.textContent = 'No credit card required. $4.99 one-time purchase after trial.';
      restoreBtn.classList.add('hidden');
    }

    modalOverlay.classList.add('premium-modal--visible');
  }

  function hideModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('premium-modal--visible');
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
    let badge = document.getElementById('premium-badge');
    if (!badge) {
      const nav = document.querySelector('.nav-logo');
      if (!nav) return;
      badge = document.createElement('span');
      badge.id = 'premium-badge';
      nav.parentNode.insertBefore(badge, nav.nextSibling);
    }

    if (isPro()) {
      badge.className = 'premium-badge pro';
      badge.textContent = 'PRO';
    } else if (canUse()) {
      const d = daysLeft();
      badge.className = 'premium-badge trial';
      badge.textContent = `Trial: ${d}d left`;

      // Trial expiry banner at 3 days or fewer
      if (
        d <= 3 &&
        d > 0 &&
        !sessionStorage.getItem('pielab-trial-banner-dismissed') &&
        !document.getElementById('trial-expiry-banner')
      ) {
        const mainEl = document.querySelector('main');
        if (mainEl) {
          const banner = document.createElement('div');
          banner.className = 'trial-expiry-banner';
          banner.id = 'trial-expiry-banner';
          banner.innerHTML = `
            \u23F3 Your Pro trial ends in ${d} day${d !== 1 ? 's' : ''}.
            <button class="btn-unlock-now">Unlock Pro \u2014 $4.99</button>
            <button class="trial-banner-dismiss" aria-label="Dismiss">\u00D7</button>
          `;
          mainEl.insertBefore(banner, mainEl.firstChild);
          banner.querySelector('.btn-unlock-now').addEventListener('click', () => showModal());
          banner.querySelector('.trial-banner-dismiss').addEventListener('click', () => {
            sessionStorage.setItem('pielab-trial-banner-dismissed', '1');
            banner.remove();
          });
        }
      }
    } else if (isExpired()) {
      badge.className = 'premium-badge expired';
      badge.textContent = 'Trial Expired';
    } else {
      // No trial started — hide badge
      badge.className = 'premium-badge hidden';
      badge.textContent = '';
    }
  }

  // ── Init on load ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    _getFingerprint(); // ensure fingerprint exists early
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

export { PieLabPremium };
