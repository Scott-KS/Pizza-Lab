/* ══════════════════════════════════════════════════════
   The Pie Lab — My Kitchen
   Page: kitchen.html
   ══════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // ── DOM refs ─────────────────────────────────────────
  const nameInput   = document.getElementById("k-display-name");
  const cityInput   = document.getElementById("k-city");
  const cityStatus  = document.getElementById("k-city-status");
  const ovenSelect  = document.getElementById("k-oven");
  const humidityGrp = document.getElementById("k-humidity");
  const styleSelect = document.getElementById("k-style");
  const saveBtn     = document.getElementById("k-save");
  const saveConfirm = document.getElementById("k-save-confirm");

  // ── Populate selects, then load profile values ───────
  populateOvenSelect(ovenSelect);
  populateStyleSelect(styleSelect, { placeholder: "Select a style\u2026" });

  const profile = PieLabProfile.getProfile();

  nameInput.value   = profile.displayName || "";
  cityInput.value   = profile.city || "";
  ovenSelect.value  = profile.preferredOven || ovenSelect.options[0]?.value || "";
  styleSelect.value = profile.favoriteStyle || "";

  // ── Humidity toggle ──────────────────────────────────
  let selectedHumidity = profile.humidity || "normal";

  humidityGrp.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === selectedHumidity);
  });

  humidityGrp.addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;

    humidityGrp.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedHumidity = btn.dataset.value;
  });

  // ── City elevation resolver ──────────────────────────
  let storedCity         = profile.city || "";
  let resolvedElevation  = profile.elevation ?? null;
  let resolveTimer       = null;
  let cityResolved       = false;   // true after a successful resolve this session

  // Show saved elevation on load
  if (storedCity && resolvedElevation != null) {
    cityStatus.textContent = `\uD83D\uDCCD ${storedCity} \u2014 ${resolvedElevation.toLocaleString()} ft`;
    cityStatus.className   = "city-status resolved";
  }

  function triggerResolve() {
    clearTimeout(resolveTimer);
    const city = cityInput.value.trim();

    // Nothing to resolve
    if (!city) {
      cityStatus.textContent = "";
      cityStatus.className   = "city-status";
      cityResolved = false;
      return;
    }

    // City hasn't changed from stored value — keep existing elevation
    if (city === storedCity) return;

    // Reset pending state
    resolvedElevation = null;
    cityResolved      = false;
    cityStatus.textContent = "Resolving elevation\u2026";
    cityStatus.className   = "city-status resolving";

    resolveTimer = setTimeout(async () => {
      const result = await PieLabProfile.resolveElevationFromCity(city);

      if (result.error) {
        cityStatus.textContent = result.error;
        cityStatus.className   = "city-status error";
      } else {
        resolvedElevation = result.elevationFeet;
        cityResolved      = true;
        const label = result.countryCode
          ? `${result.displayName}, ${result.countryCode}`
          : result.displayName;
        cityStatus.textContent = `\uD83D\uDCCD ${label} \u2014 ${result.elevationFeet.toLocaleString()} ft`;
        cityStatus.className   = "city-status resolved";
      }
    }, 600);
  }

  cityInput.addEventListener("input", () => {
    clearTimeout(resolveTimer);
    const city = cityInput.value.trim();

    if (!city) {
      cityStatus.textContent = "";
      cityStatus.className   = "city-status";
      cityResolved = false;
      resolvedElevation = null;
      return;
    }

    if (city === storedCity) return;

    cityStatus.textContent = "Resolving elevation\u2026";
    cityStatus.className   = "city-status resolving";
    resolvedElevation      = null;
    cityResolved           = false;

    resolveTimer = setTimeout(async () => {
      const result = await PieLabProfile.resolveElevationFromCity(city);

      if (result.error) {
        cityStatus.textContent = result.error;
        cityStatus.className   = "city-status error";
      } else {
        resolvedElevation = result.elevationFeet;
        cityResolved      = true;
        const label = result.countryCode
          ? `${result.displayName}, ${result.countryCode}`
          : result.displayName;
        cityStatus.textContent = `\uD83D\uDCCD ${label} \u2014 ${result.elevationFeet.toLocaleString()} ft`;
        cityStatus.className   = "city-status resolved";
      }
    }, 600);
  });

  cityInput.addEventListener("blur", () => {
    // On blur, resolve immediately if city changed and no pending result
    const city = cityInput.value.trim();
    if (city && city !== storedCity && !cityResolved) {
      clearTimeout(resolveTimer);
      resolvedElevation = null;
      cityStatus.textContent = "Resolving elevation\u2026";
      cityStatus.className   = "city-status resolving";

      (async () => {
        const result = await PieLabProfile.resolveElevationFromCity(city);

        if (result.error) {
          cityStatus.textContent = result.error;
          cityStatus.className   = "city-status error";
        } else {
          resolvedElevation = result.elevationFeet;
          cityResolved      = true;
          const label = result.countryCode
            ? `${result.displayName}, ${result.countryCode}`
            : result.displayName;
          cityStatus.textContent = `\uD83D\uDCCD ${label} \u2014 ${result.elevationFeet.toLocaleString()} ft`;
          cityStatus.className   = "city-status resolved";
        }
      })();
    }
  });

  // ── Save ─────────────────────────────────────────────
  saveBtn.addEventListener("click", () => {
    const currentCity = cityInput.value.trim();

    // Determine elevation to save:
    // - If city was resolved this session, use that elevation
    // - If city didn't change from stored, keep stored elevation
    // - If city changed but resolution failed/pending, save null
    let elevation;
    if (cityResolved) {
      elevation = resolvedElevation;
    } else if (currentCity === storedCity) {
      elevation = profile.elevation ?? null;
    } else {
      elevation = null;
    }

    const updates = {
      displayName:   nameInput.value.trim(),
      city:          currentCity,
      elevation:     elevation,
      humidity:      selectedHumidity,
      preferredOven: ovenSelect.value,
      favoriteStyle: styleSelect.value,
    };

    PieLabProfile.saveProfile(updates);

    // Update stored city so subsequent edits compare to latest save
    storedCity = currentCity;

    // Show confirmation with fade-out
    saveConfirm.classList.remove("hidden");
    saveConfirm.classList.remove("fade-out");

    setTimeout(() => {
      saveConfirm.classList.add("fade-out");
      saveConfirm.addEventListener(
        "transitionend",
        () => saveConfirm.classList.add("hidden"),
        { once: true }
      );
    }, 2500);
  });
});
