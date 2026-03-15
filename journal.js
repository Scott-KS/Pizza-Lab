/* ══════════════════════════════════════════════════════
   Pizza Journal — Data Module
   localStorage-backed personal settings + journal CRUD
   ══════════════════════════════════════════════════════ */

const PieLabJournal = (() => {
  const SETTINGS_KEY = "pielab-personal-settings";
  const JOURNAL_KEY = "pielab-journal";

  // ── localStorage helpers ──────────────────────────
  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function saveJSON(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert(
          "Storage is full. Try deleting some journal entries or photos to free up space."
        );
      }
      return false;
    }
  }

  // ── Personal Settings ─────────────────────────────
  function getAllPersonalSettings() {
    return loadJSON(SETTINGS_KEY) || {};
  }

  function getPersonalSettings(styleKey) {
    const all = getAllPersonalSettings();
    return all[styleKey] || null;
  }

  function savePersonalSettings(styleKey, settings) {
    const all = getAllPersonalSettings();
    all[styleKey] = settings;
    saveJSON(SETTINGS_KEY, all);
  }

  function deletePersonalSettings(styleKey) {
    const all = getAllPersonalSettings();
    delete all[styleKey];
    saveJSON(SETTINGS_KEY, all);
  }

  /**
   * Returns the effective recipe for calculations.
   * If usePersonal is true and the user has saved personal settings for this
   * style, overlays those values on top of the base recipe.
   */
  function getEffectiveRecipe(styleKey, usePersonal) {
    if (typeof PIZZA_RECIPES === "undefined") return null;
    const base = PIZZA_RECIPES[styleKey];
    if (!base) return null;
    if (!usePersonal) return base;

    const personal = getPersonalSettings(styleKey);
    if (!personal) return base;

    // Shallow copy — primitive overrides work because hydration, saltPct, etc.
    // are numbers. sizes, sauce, toppings remain shared references (intentional).
    const effective = { ...base };

    if (personal.hydration != null) effective.hydration = personal.hydration;
    if (personal.saltPct != null) effective.saltPct = personal.saltPct;
    if (personal.oilPct != null) effective.oilPct = personal.oilPct;
    if (personal.sugarPct != null) effective.sugarPct = personal.sugarPct;
    if (personal.yeastPct != null) effective.yeastPct = personal.yeastPct;

    // Dough ball weight override — need new sizes object
    if (personal.doughBallWeight != null) {
      const newSizes = {};
      for (const [key, size] of Object.entries(base.sizes)) {
        newSizes[key] = { ...size, doughWeight: personal.doughBallWeight };
      }
      effective.sizes = newSizes;
    }

    return effective;
  }

  // ── Journal Entries ───────────────────────────────
  function getAllEntries() {
    return loadJSON(JOURNAL_KEY) || [];
  }

  function saveAllEntries(entries) {
    return saveJSON(JOURNAL_KEY, entries);
  }

  function addEntry(entry) {
    const entries = getAllEntries();
    entry.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    entry.createdAt = new Date().toISOString();

    // Stamp skill progression — count includes this new entry
    const prevCount = entries.filter((e) => e.styleKey === entry.styleKey).length;
    entry.skillCount = prevCount + 1;
    entry.skillBadge = getSkillBadge(entry.skillCount);

    entries.unshift(entry); // newest first
    saveAllEntries(entries);
    return entry;
  }

  function updateEntry(id, updates) {
    const entries = getAllEntries();
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    entries[idx] = { ...entries[idx], ...updates };
    saveAllEntries(entries);
    return entries[idx];
  }

  function deleteEntry(id) {
    const entries = getAllEntries().filter((e) => e.id !== id);
    return saveAllEntries(entries);
  }

  function getEntriesByStyle(styleKey) {
    return getAllEntries().filter((e) => e.styleKey === styleKey);
  }

  function getBakesCountByStyle(styleKey) {
    return getEntriesByStyle(styleKey).length;
  }

  function getEntryById(id) {
    return getAllEntries().find((e) => e.id === id) || null;
  }

  // ── Skill Badge System ─────────────────────────────
  const SKILL_TIERS = [
    { min: 26, badge: "\uD83C\uDFC6 Master of the Oven" },
    { min: 16, badge: "\uD83D\uDC68\u200D\uD83C\uDF73 Style Specialist" },
    { min:  9, badge: "\u2B50 Dialed In" },
    { min:  4, badge: "\uD83D\uDD25 Getting Comfortable" },
    { min:  1, badge: "\uD83C\uDF55 First Stretch" },
  ];

  function getStyleBakeCount(styleKey) {
    return getBakesCountByStyle(styleKey);
  }

  function getSkillBadge(count) {
    if (!count || count < 1) return null;
    for (const tier of SKILL_TIERS) {
      if (count >= tier.min) return tier.badge;
    }
    return null;
  }

  // ── Photo Compression ─────────────────────────────
  function compressPhoto(file, maxWidth = 600) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX = maxWidth;
          let w = img.width;
          let h = img.height;
          if (w > MAX || h > MAX) {
            if (w > h) {
              h = Math.round((h * MAX) / w);
              w = MAX;
            } else {
              w = Math.round((w * MAX) / h);
              h = MAX;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.65));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ── Custom Dough Profiles ────────────────────────
  const PROFILES_KEY = "pielab-dough-profiles";

  function getAllProfiles() {
    return loadJSON(PROFILES_KEY) || [];
  }

  function saveProfile(profile) {
    const profiles = getAllProfiles();
    profile.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    profile.createdAt = new Date().toISOString();
    profiles.unshift(profile);
    return saveJSON(PROFILES_KEY, profiles) ? profile : null;
  }

  function deleteProfile(id) {
    const profiles = getAllProfiles().filter(p => p.id !== id);
    return saveJSON(PROFILES_KEY, profiles);
  }

  function getProfilesByStyle(styleKey) {
    return getAllProfiles().filter(p => p.styleKey === styleKey);
  }

  // ── Comparison Analysis ───────────────────────────
  function analyzeEntries(entries) {
    if (entries.length < 2) return { insufficient: true };

    // Group by hydration (rounded to nearest integer %)
    const hydrationGroups = {};
    const bakeTempGroups = {};

    entries.forEach((entry) => {
      // Skip unrated entries (rating 0) — they'd drag averages down
      if (!entry.rating) return;

      // Hydration grouping
      if (entry.doughSnapshot && entry.doughSnapshot.hydration != null) {
        const hKey = Math.round(entry.doughSnapshot.hydration * 100);
        if (!hydrationGroups[hKey]) hydrationGroups[hKey] = { sum: 0, count: 0 };
        hydrationGroups[hKey].sum += entry.rating;
        hydrationGroups[hKey].count++;
      }

      // Bake temp grouping (25F increments)
      if (entry.bakeTemp) {
        const tKey = Math.round(entry.bakeTemp / 25) * 25;
        if (!bakeTempGroups[tKey]) bakeTempGroups[tKey] = { sum: 0, count: 0 };
        bakeTempGroups[tKey].sum += entry.rating;
        bakeTempGroups[tKey].count++;
      }
    });

    const bestOf = (groups) => {
      let best = null;
      for (const [key, g] of Object.entries(groups)) {
        const avg = g.sum / g.count;
        if (
          !best ||
          avg > best.avg ||
          (avg === best.avg && g.count > best.count)
        ) {
          best = { value: Number(key), avg: Math.round(avg * 10) / 10, count: g.count };
        }
      }
      return best;
    };

    return {
      bestHydration: bestOf(hydrationGroups),
      bestBakeTemp: bestOf(bakeTempGroups),
      hydrationGroups,
      bakeTempGroups,
      totalEntries: entries.length,
    };
  }

  // ── Public API ────────────────────────────────────
  return {
    getEffectiveRecipe,
    getAllPersonalSettings,
    getPersonalSettings,
    savePersonalSettings,
    deletePersonalSettings,
    getAllEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntriesByStyle,
    getBakesCountByStyle,
    getEntryById,
    compressPhoto,
    analyzeEntries,
    getStyleBakeCount,
    getSkillBadge,
    getAllProfiles,
    saveProfile,
    deleteProfile,
    getProfilesByStyle,
  };
})();
