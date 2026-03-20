/* ══════════════════════════════════════════════════════
   The Pie Lab — Persistent Storage Layer
   Cache-backed abstraction over @capacitor/preferences.

   On native (iOS/Android): uses Preferences (NSUserDefaults /
   SharedPreferences) which survives iOS storage pressure.
   On web: falls back to localStorage.

   Reads are synchronous (from in-memory cache).
   Writes are async (persist to Preferences on native).
   ══════════════════════════════════════════════════════ */

const PieLabStorage = (() => {
  const _cache = new Map();
  let _prefs = null;
  let _initPromise = null;

  function _isNative() {
    return typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform();
  }

  // Keys containing persistent structured data to migrate
  const PERSISTENT_KEYS = [
    'pielab-user-profile',
    'pielab-style-levels',
    'pielab-premium',
    'pielab-active-schedule',
    'pielab-journal',
    'pielab-personal-settings',
    'pielab-dough-profiles',
    'pielab-last-calc',
    'pielab-scaling-memory',
    'pielab-bake-timer',
    'pielab-bakeday-checklist',
    'pielab-session-count',
  ];

  // ── Initialization ────────────────────────────────────
  // Returns a shared promise so multiple callers can await
  // the same init without re-running.
  function init() {
    if (!_initPromise) _initPromise = _doInit();
    return _initPromise;
  }

  async function _doInit() {
    if (!_isNative()) return;

    try {
      _prefs = Capacitor.Plugins.Preferences;
    } catch {
      return;
    }

    // One-time migration: localStorage → Preferences
    await _migrate();

    // Populate cache from Preferences
    for (const key of PERSISTENT_KEYS) {
      try {
        const { value } = await _prefs.get({ key });
        if (value != null) _cache.set(key, value);
      } catch {
        /* ignore */
      }
    }
  }

  // ── One-Time Migration ────────────────────────────────
  // Copies all pielab-* localStorage values into Preferences,
  // then deletes the localStorage copies. Skips pielab-theme
  // which must remain in localStorage for the inline dark-mode
  // detection script.
  async function _migrate() {
    try {
      const { value } = await _prefs.get({ key: '_pielab_storage_migrated' });
      if (value === '1') return;
    } catch {
      /* continue */
    }

    for (const key of PERSISTENT_KEYS) {
      try {
        const val = localStorage.getItem(key);
        if (val != null) {
          await _prefs.set({ key, value: val });
          _cache.set(key, val);
        }
      } catch {
        /* ignore */
      }
    }

    try {
      await _prefs.set({ key: '_pielab_storage_migrated', value: '1' });
    } catch {
      /* ignore */
    }

    // Remove localStorage copies — Preferences is now authoritative
    for (const key of PERSISTENT_KEYS) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
  }

  // ── Read (synchronous from cache) ─────────────────────
  // Falls back to localStorage if cache miss (pre-init or web).
  function get(key) {
    if (_cache.has(key)) return _cache.get(key);
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function getJSON(key) {
    const raw = get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  // ── Write (async to Preferences, sync to cache) ───────
  // Cache is updated immediately so subsequent get() calls
  // return the new value even before Preferences persists.
  async function set(key, value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    _cache.set(key, str);
    if (_prefs) {
      try {
        await _prefs.set({ key, value: str });
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.setItem(key, str);
      } catch {
        /* ignore */
      }
    }
  }

  async function remove(key) {
    _cache.delete(key);
    if (_prefs) {
      try {
        await _prefs.remove({ key });
      } catch {
        /* ignore */
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }

  // ── Bulk remove (for Delete All Data) ─────────────────
  async function removeAll() {
    for (const key of PERSISTENT_KEYS) {
      await remove(key);
    }
  }

  return { init, get, getJSON, set, remove, removeAll, PERSISTENT_KEYS };
})();

export { PieLabStorage };
