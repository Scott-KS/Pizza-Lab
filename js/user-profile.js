/* ══════════════════════════════════════════════════════
   The Pie Lab — User Profile
   Persistent user preferences stored in localStorage.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';

const PieLabProfile = (() => {
  const STORAGE_KEY = 'pielab-user-profile';

  const DEFAULTS = {
    displayName: '',
    city: '',
    elevation: null,
    humidity: 'normal',
    favoriteStyle: '',
    preferredOven: '',
    ovenTempOffset: 0, // signed °F: positive = runs hot, negative = runs cold
    unitSystem: 'standard', // "standard" (oz/°F), "metric" (g/°C), or "hybrid" (g/°F)
    createdAt: null,
    updatedAt: null,
  };

  // ── Persistence helpers ──────────────────────────────
  function readStorage() {
    return PieLabStorage.getJSON(STORAGE_KEY) || {};
  }

  async function writeStorage(profile) {
    await PieLabStorage.set(STORAGE_KEY, profile);
  }

  // ── Public API ───────────────────────────────────────

  /** Return full profile merged with defaults for any missing fields. */
  function getProfile() {
    const stored = readStorage();
    return Object.assign({}, DEFAULTS, stored);
  }

  /**
   * Merge `updates` into the stored profile.
   * Sets createdAt on first save, updatedAt on every save.
   * Returns the saved profile.
   */
  async function saveProfile(updates) {
    const stored = readStorage();
    const merged = Object.assign({}, DEFAULTS, stored, updates);

    if (!merged.createdAt) {
      merged.createdAt = new Date().toISOString();
    }
    merged.updatedAt = new Date().toISOString();

    await writeStorage(merged);
    return merged;
  }

  /** Remove the profile entirely. */
  async function clearProfile() {
    await PieLabStorage.remove(STORAGE_KEY);
  }

  // ── Environment adjustments ──────────────────────────

  /**
   * Elevation-based adjustments.
   * @param {number} elevationFeet — feet above sea level
   * @returns {{ yeastMultiplier: number, hydrationDelta: number }}
   */
  function getElevationAdjustments(elevationFeet) {
    if (elevationFeet == null || elevationFeet < 3500) {
      return { yeastMultiplier: 1.0, hydrationDelta: 0 };
    }
    if (elevationFeet < 5000) {
      return { yeastMultiplier: 0.9, hydrationDelta: 0.01 };
    }
    if (elevationFeet < 7000) {
      return { yeastMultiplier: 0.85, hydrationDelta: 0.02 };
    }
    return { yeastMultiplier: 0.8, hydrationDelta: 0.03 };
  }

  /**
   * Humidity-based adjustments.
   * @param {string} humidity — "dry" | "normal" | "humid"
   * @returns {{ hydrationDelta: number }}
   */
  function getHumidityAdjustments(humidity) {
    switch (humidity) {
      case 'dry':
        return { hydrationDelta: 0.02 };
      case 'humid':
        return { hydrationDelta: -0.02 };
      default:
        return { hydrationDelta: 0 };
    }
  }

  // ── City → Elevation resolver (Open-Meteo) ──────────

  /**
   * Resolve a city name to elevation in feet via Open-Meteo APIs.
   * @param {string} cityName — free-text city name
   * @returns {Promise<{ elevationFeet: number, displayName: string, countryCode: string }
   *           | { error: string }>}
   */
  async function resolveElevationFromCity(cityName) {
    try {
      // 1. Geocode city → lat/lng
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geoUrl);
      if (!geoRes.ok) return { error: 'Could not resolve elevation' };

      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return { error: 'City not found' };
      }

      const place = geoData.results[0];
      const lat = place.latitude;
      const lng = place.longitude;
      const displayName = place.name;
      const countryCode = place.country_code;

      // 2. Lat/lng → elevation in meters
      const elevUrl = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;
      const elevRes = await fetch(elevUrl);
      if (!elevRes.ok) return { error: 'Could not resolve elevation' };

      const elevData = await elevRes.json();
      if (!elevData.elevation || elevData.elevation.length === 0) {
        return { error: 'Could not resolve elevation' };
      }

      // 3. Convert meters → feet, round to nearest 10
      const meters = elevData.elevation[0];
      const elevationFeet = Math.round((meters * 3.28084) / 10) * 10;

      return { elevationFeet, displayName, countryCode };
    } catch {
      return { error: 'Could not resolve elevation' };
    }
  }

  // ── Per-style skill level ──────────────────────────

  const STYLE_LEVELS_KEY = 'pielab-style-levels';

  function _readStyleLevels() {
    return PieLabStorage.getJSON(STYLE_LEVELS_KEY) || {};
  }

  function getStyleLevel(styleKey) {
    return _readStyleLevels()[styleKey] || null;
  }

  async function setStyleLevel(styleKey, level) {
    const map = _readStyleLevels();
    map[styleKey] = level;
    await PieLabStorage.set(STYLE_LEVELS_KEY, map);
  }

  function levelFromBakeCount(count) {
    if (count >= 10) return 'pro';
    if (count >= 3) return 'intermediate';
    return 'beginner';
  }

  /** Convenience: true when user has chosen Metric (g / °C). */
  function isMetric() {
    return getProfile().unitSystem === 'metric';
  }

  /** True when weight should display in grams (metric or hybrid). */
  function isMetricWeight() {
    const sys = getProfile().unitSystem;
    return sys === 'metric' || sys === 'hybrid';
  }

  /** True when temperature should display in °C (metric only). */
  function isMetricTemp() {
    return getProfile().unitSystem === 'metric';
  }

  return {
    getProfile,
    saveProfile,
    clearProfile,
    isMetric,
    isMetricWeight,
    isMetricTemp,
    getElevationAdjustments,
    getHumidityAdjustments,
    resolveElevationFromCity,
    getStyleLevel,
    setStyleLevel,
    levelFromBakeCount,
  };
})();

export { PieLabProfile };
