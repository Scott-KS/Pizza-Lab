/* ══════════════════════════════════════════════════════
   The Pie Lab — Notification Abstraction Layer
   Bridges browser Notification API ↔ Capacitor LocalNotifications.
   Loaded on schedule.html before scheduler.js.
   ══════════════════════════════════════════════════════ */

const PieNotifications = (() => {
  // Track browser setTimeout IDs for cancellation
  let _browserTimeouts = [];

  /**
   * Detect if running inside Capacitor native shell.
   */
  function isNative() {
    return (
      typeof window !== "undefined" &&
      typeof window.Capacitor !== "undefined" &&
      window.Capacitor.isNativePlatform()
    );
  }

  /**
   * Request notification permission.
   * Returns a Promise<boolean> — true if granted.
   */
  async function requestPermission() {
    if (isNative()) {
      try {
        const { LocalNotifications } = Capacitor.Plugins;
        const result = await LocalNotifications.requestPermissions();
        return result.display === "granted";
      } catch (e) {
        /* native permission request failed — swallowed */
        return false;
      }
    }

    // Browser fallback
    if ("Notification" in window) {
      if (Notification.permission === "granted") return true;
      if (Notification.permission === "default") {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      }
    }
    return false;
  }

  /**
   * Schedule a single notification.
   * @param {Object} opts
   * @param {number} opts.id   — unique numeric ID (> 0)
   * @param {string} opts.title — notification title
   * @param {string} opts.body  — notification body text
   * @param {Date}   opts.at   — when to fire
   */
  async function schedule({ id, title, body, at }) {
    if (isNative()) {
      try {
        const { LocalNotifications } = Capacitor.Plugins;
        await LocalNotifications.schedule({
          notifications: [
            {
              id,
              title,
              body,
              schedule: { at },
              sound: "default",
              smallIcon: "ic_stat_notification",
              iconColor: "#8c3524",
            },
          ],
        });
      } catch (e) {
        /* native schedule failed — swallowed */
      }
      return;
    }

    // Browser fallback: setTimeout + Notification API
    const delay = at.getTime() - Date.now();
    if (delay <= 0) return;

    const tid = setTimeout(() => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "assets/logos/logo-monogram-512.svg",
        });
      }
    }, delay);

    _browserTimeouts.push(tid);
  }

  /**
   * Cancel all pending notifications.
   */
  async function cancelAll() {
    if (isNative()) {
      try {
        const { LocalNotifications } = Capacitor.Plugins;
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel(pending);
        }
      } catch (e) {
        /* native cancelAll failed — swallowed */
      }
      return;
    }

    // Browser fallback: clear all stored timeouts
    _browserTimeouts.forEach((tid) => clearTimeout(tid));
    _browserTimeouts = [];
  }

  return { isNative, requestPermission, schedule, cancelAll };
})();
