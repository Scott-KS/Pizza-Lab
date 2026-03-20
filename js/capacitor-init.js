/* ══════════════════════════════════════════════════════
   The Pie Lab — Capacitor Native Init
   Runs on every page. Configures native-only behavior.
   Does nothing when running in a regular browser.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';

if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
  // Initialize persistent storage layer (migrates localStorage → Preferences)
  PieLabStorage.init();

  // Hide splash screen once DOM is ready
  document.addEventListener('DOMContentLoaded', async () => {
    // Ensure storage is ready before other DOMContentLoaded handlers
    await PieLabStorage.init();

    try {
      const { SplashScreen } = Capacitor.Plugins;
      await SplashScreen.hide();
    } catch {
      /* not critical */
    }

    try {
      const { StatusBar } = Capacitor.Plugins;
      await StatusBar.setBackgroundColor({ color: '#8c3524' });
      await StatusBar.setStyle({ style: 'LIGHT' });
    } catch {
      /* not critical — some Android versions don't support this */
    }
  });

  // Handle Android back button (Capacitor API + Cordova fallback)
  try {
    const { App } = Capacitor.Plugins;
    App.addListener('backButton', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  } catch {
    /* Capacitor not available */
  }
  document.addEventListener('backbutton', () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      try {
        const { App } = Capacitor.Plugins;
        App.exitApp();
      } catch {
        /* fallback: do nothing */
      }
    }
  });

  // ── Haptic feedback helper ───────────────────────────
  // Exposes window.PieLabHaptics for use across modules.
  // Falls back silently on devices that don't support it.
  window.PieLabHaptics = {
    light() {
      try {
        const { Haptics } = Capacitor.Plugins;
        Haptics.impact({ style: 'LIGHT' });
      } catch {
        /* not critical */
      }
    },
    medium() {
      try {
        const { Haptics } = Capacitor.Plugins;
        Haptics.impact({ style: 'MEDIUM' });
      } catch {
        /* not critical */
      }
    },
    success() {
      try {
        const { Haptics } = Capacitor.Plugins;
        Haptics.notification({ type: 'SUCCESS' });
      } catch {
        /* not critical */
      }
    },
    warning() {
      try {
        const { Haptics } = Capacitor.Plugins;
        Haptics.notification({ type: 'WARNING' });
      } catch {
        /* not critical */
      }
    },
  };

  // ── Native share helper ──────────────────────────────
  // Wraps Capacitor Share plugin for reliable native sheet.
  // Falls back to Web Share API if plugin unavailable.
  window.PieLabNativeShare = async function (opts) {
    try {
      const { Share } = Capacitor.Plugins;
      await Share.share({
        title: opts.title || '',
        text: opts.text || '',
        url: opts.url || '',
        dialogTitle: opts.dialogTitle || 'Share',
      });
      return true;
    } catch {
      // Fall back to Web Share API
      if (navigator.share) {
        await navigator.share(opts);
        return true;
      }
      return false;
    }
  };
}
