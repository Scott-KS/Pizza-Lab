/* ══════════════════════════════════════════════════════
   The Pie Lab — Capacitor Native Init
   Runs on every page. Configures native-only behavior.
   Does nothing when running in a regular browser.
   ══════════════════════════════════════════════════════ */

(function () {
  if (typeof Capacitor === "undefined" || !Capacitor.isNativePlatform()) return;

  // Hide splash screen once DOM is ready
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const { SplashScreen } = Capacitor.Plugins;
      await SplashScreen.hide();
    } catch (e) {
      /* not critical */
    }

    try {
      const { StatusBar } = Capacitor.Plugins;
      await StatusBar.setBackgroundColor({ color: "#8c3524" });
      await StatusBar.setStyle({ style: "LIGHT" });
    } catch (e) {
      /* not critical — some Android versions don't support this */
    }
  });

  // Handle Android back button
  document.addEventListener("backbutton", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      try {
        const { App } = Capacitor.Plugins;
        App.exitApp();
      } catch (e) {
        /* fallback: do nothing */
      }
    }
  });
})();
