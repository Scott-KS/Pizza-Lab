/* ══════════════════════════════════════════════════════
   The Pie Lab — My Kitchen
   Page: kitchen.html
   ══════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // ── Welcome banner for new users ───────────────────
  if (new URLSearchParams(window.location.search).has("welcome")) {
    const banner = document.getElementById("welcome-banner");
    if (banner) banner.classList.remove("hidden");
  }

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

  // ── Measurement System toggle ──────────────────────
  const unitsGrp = document.getElementById("k-units");
  let selectedUnits = profile.unitSystem || "standard";

  unitsGrp.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.classList.toggle("selected", btn.dataset.value === selectedUnits);
  });

  unitsGrp.addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;

    unitsGrp.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedUnits = btn.dataset.value;
  });

  // ── Location autocomplete & elevation ────────────────
  const suggestList = document.getElementById("k-city-suggestions");
  let storedCity         = profile.city || "";
  let resolvedElevation  = profile.elevation ?? null;
  let searchTimer        = null;
  let cityResolved       = false;
  let activeIndex        = -1;

  // US state abbreviation map
  const US_STATES = {
    Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",
    Colorado:"CO",Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",
    Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",
    Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",Massachusetts:"MA",
    Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",
    Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ",
    "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",
    Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI",
    "South Carolina":"SC","South Dakota":"SD",Tennessee:"TN",Texas:"TX",
    Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA","West Virginia":"WV",
    Wisconsin:"WI",Wyoming:"WY",
    "District of Columbia":"DC"
  };

  // Show saved elevation on load
  if (storedCity && resolvedElevation != null) {
    cityStatus.textContent = `\uD83D\uDCCD ${storedCity} \u2014 ${resolvedElevation.toLocaleString()} ft`;
    cityStatus.className   = "city-status resolved";
  }

  function closeSuggestions() {
    suggestList.classList.add("hidden");
    suggestList.innerHTML = "";
    cityInput.classList.remove("ac-open");
    activeIndex = -1;
  }

  function formatPlace(place) {
    const region = place.admin1 || "";
    const abbr = US_STATES[region];
    if (place.country_code?.toUpperCase() === "US" && abbr) {
      return { display: `${place.name}, ${abbr}`, detail: "" };
    }
    const parts = [place.name];
    if (region) parts.push(region);
    if (place.country && place.country !== "United States") parts.push(place.country);
    return { display: parts.join(", "), detail: "" };
  }

  async function resolveElevationForPlace(place) {
    const lat = place.latitude;
    const lng = place.longitude;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.elevation || data.elevation.length === 0) return null;
      return Math.round((data.elevation[0] * 3.28084) / 10) * 10;
    } catch {
      return null;
    }
  }

  function selectPlace(place) {
    const { display } = formatPlace(place);
    cityInput.value = display;
    closeSuggestions();

    cityStatus.textContent = "Resolving elevation\u2026";
    cityStatus.className   = "city-status resolving";

    resolveElevationForPlace(place).then((feet) => {
      if (feet != null) {
        resolvedElevation  = feet;
        cityResolved       = true;
        cityStatus.textContent = `\uD83D\uDCCD ${display} \u2014 ${feet.toLocaleString()} ft`;
        cityStatus.className   = "city-status resolved";
      } else {
        cityStatus.textContent = "Could not resolve elevation";
        cityStatus.className   = "city-status error";
      }
    });
  }

  function renderSuggestions(results) {
    suggestList.innerHTML = "";
    activeIndex = -1;

    if (!results.length) {
      closeSuggestions();
      return;
    }

    results.forEach((place, i) => {
      const li = document.createElement("li");
      const { display } = formatPlace(place);
      const region = place.admin1 || "";
      const abbr = US_STATES[region];
      const isUS = place.country_code?.toUpperCase() === "US" && abbr;

      li.innerHTML = isUS
        ? `<span class="ac-city">${place.name}</span>, <span class="ac-region">${abbr}</span>`
        : `<span class="ac-city">${place.name}</span>${region ? `, <span class="ac-region">${region}</span>` : ""}${place.country && place.country !== "United States" ? `, <span class="ac-region">${place.country}</span>` : ""}`;

      li.addEventListener("mousedown", (e) => {
        e.preventDefault();          // prevent blur from firing first
        selectPlace(place);
      });
      suggestList.appendChild(li);
    });

    suggestList.classList.remove("hidden");
    cityInput.classList.add("ac-open");
  }

  cityInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    const q = cityInput.value.trim();

    cityResolved      = false;
    resolvedElevation = null;

    if (q.length < 2) {
      closeSuggestions();
      if (!q) {
        cityStatus.textContent = "";
        cityStatus.className   = "city-status";
      }
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        renderSuggestions(data.results || []);
      } catch { /* network error — ignore */ }
    }, 300);
  });

  // Keyboard navigation in dropdown
  cityInput.addEventListener("keydown", (e) => {
    const items = suggestList.querySelectorAll("li");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].dispatchEvent(new MouseEvent("mousedown"));
      return;
    } else if (e.key === "Escape") {
      closeSuggestions();
      return;
    } else {
      return;
    }

    items.forEach((li, i) => li.classList.toggle("active", i === activeIndex));
  });

  cityInput.addEventListener("blur", () => {
    // Short delay to let mousedown on suggestion fire first
    setTimeout(() => closeSuggestions(), 150);
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
      unitSystem:    selectedUnits,
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

  // ── Clear any saved theme override — always use system preference ──
  localStorage.removeItem("pielab-theme");
  const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
  document.documentElement.dataset.theme = prefersDark ? "dark" : "light";

  // ── Style Passport ──────────────────────────────
  renderPassport();

  function renderPassport() {
    const grid = document.getElementById("passport-grid");
    const countEl = document.getElementById("passport-count");
    const progressEl = document.getElementById("passport-progress");
    if (!grid) return;

    const styleKeys = Object.keys(PIZZA_RECIPES);
    let unlocked = 0;

    grid.innerHTML = styleKeys
      .map((key) => {
        const recipe = PIZZA_RECIPES[key];
        const count = PieLabJournal.getBakesCountByStyle(key);
        const isUnlocked = count > 0;
        if (isUnlocked) unlocked++;

        if (isUnlocked) {
          const badge = PieLabJournal.getSkillBadge(count);
          return `<a href="journal.html?style=${key}" class="passport-card unlocked">
            <span class="passport-badge">${badge.split(" ")[0]}</span>
            <span class="passport-style-name">${recipe.name}</span>
            <span class="passport-bake-count">${count} bake${count !== 1 ? "s" : ""}</span>
          </a>`;
        }

        return `<div class="passport-card locked">
          <span class="passport-badge">\uD83D\uDD12</span>
          <span class="passport-style-name">${recipe.name}</span>
          <span class="passport-bake-count">Not yet baked</span>
        </div>`;
      })
      .join("");

    if (countEl) countEl.textContent = unlocked;
    if (progressEl && unlocked === styleKeys.length) {
      progressEl.innerHTML = "\uD83C\uDF89 All styles unlocked!";
    }
  }

  // ── Data Export / Import ──────────────────────────
  const BACKUP_KEYS = [
    "pielab-journal",
    "pielab-personal-settings",
    "pielab-user-profile",
    "pielab-style-levels",
  ];

  document.getElementById("btn-export").addEventListener("click", () => {
    const backup = { _version: 1, _exportedAt: new Date().toISOString() };
    BACKUP_KEYS.forEach((key) => {
      const raw = localStorage.getItem(key);
      backup[key] = raw ? JSON.parse(raw) : null;
    });

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = "pielab-backup-" + dateStr + ".json";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const status = document.getElementById("export-status");
    status.textContent = "Exported " + filename + " (" + sizeMB + " MB)";
    status.classList.remove("hidden");
  });

  document.getElementById("import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const hasValidKey = BACKUP_KEYS.some((key) => key in data);
        if (!hasValidKey) {
          alert("This file doesn\u2019t appear to be a valid Pie Lab backup.");
          return;
        }
        const journalCount = Array.isArray(data["pielab-journal"])
          ? data["pielab-journal"].length
          : 0;
        const msg =
          "This will replace your current data with:\n" +
          "- " + journalCount + " journal entries\n" +
          "- Kitchen settings & profile\n\n" +
          "Your current data will be overwritten. Continue?";
        if (!confirm(msg)) return;

        BACKUP_KEYS.forEach((key) => {
          if (data[key] != null) {
            localStorage.setItem(key, JSON.stringify(data[key]));
          }
        });
        window.location.reload();
      } catch {
        alert("Could not read backup file. Make sure it\u2019s a valid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  // ── Feedback Form ─────────────────────────────────
  const fbType    = document.getElementById("fb-type");
  const fbMessage = document.getElementById("fb-message");
  const fbSend    = document.getElementById("btn-send-feedback");
  const fbStatus  = document.getElementById("feedback-status");

  fbSend.addEventListener("click", () => {
    const message = fbMessage.value.trim();
    if (!message) {
      fbMessage.focus();
      fbMessage.classList.add("input-error");
      setTimeout(() => fbMessage.classList.remove("input-error"), 1500);
      return;
    }

    const type   = fbType.value;
    const labels = { bug: "Bug Report", feature: "Feature Request", general: "General Feedback" };
    const label  = labels[type] || "Feedback";

    // Gather context automatically
    const profile = PieLabProfile.getProfile();
    const device  = navigator.userAgent;
    const screen  = `${window.screen.width}x${window.screen.height}`;
    const theme   = document.documentElement.dataset.theme || "light";

    const subject = encodeURIComponent(`[Pie Lab] ${label}`);
    const body    = encodeURIComponent(
      `${message}\n\n` +
      `--- App Context (auto-generated) ---\n` +
      `Type: ${label}\n` +
      `Name: ${profile.displayName || "—"}\n` +
      `Location: ${profile.city || "—"}\n` +
      `Units: ${profile.unitSystem || "standard"}\n` +
      `Theme: ${theme}\n` +
      `Screen: ${screen}\n` +
      `Device: ${device}\n`
    );

    const mailto = `mailto:feedback@thepielab.app?subject=${subject}&body=${body}`;
    window.location.href = mailto;

    // Show confirmation + clear form
    fbMessage.value = "";
    fbStatus.textContent = "Thanks! Your email client should open with the feedback ready to send.";
    fbStatus.classList.remove("hidden");
    fbStatus.classList.remove("fade-out");

    setTimeout(() => {
      fbStatus.classList.add("fade-out");
      fbStatus.addEventListener(
        "transitionend",
        () => fbStatus.classList.add("hidden"),
        { once: true }
      );
    }, 5000);
  });

  // ── Delete All Data ─────────────────────────────────
  const deleteBtn     = document.getElementById("k-delete-data");
  const deleteModal   = document.getElementById("delete-data-modal");
  const deleteCancel  = document.getElementById("delete-cancel");
  const deleteConfirm = document.getElementById("delete-confirm");

  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener("click", () => {
      deleteModal.classList.remove("hidden");
    });

    deleteCancel.addEventListener("click", () => {
      deleteModal.classList.add("hidden");
    });

    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) deleteModal.classList.add("hidden");
    });

    deleteConfirm.addEventListener("click", () => {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith("pielab"));
      keys.forEach((k) => localStorage.removeItem(k));
      window.location.href = "index.html";
    });
  }
});
