/* ══════════════════════════════════════════════════════
   The Pie Lab — Pizza Journal UI
   Page: journal.html
   ══════════════════════════════════════════════════════ */

(() => {
  const formWrapper = document.getElementById("journal-form-wrapper");
  const form = document.getElementById("journal-form");
  const entriesContainer = document.getElementById("journal-entries");
  const btnNewEntry = document.getElementById("btn-new-entry");
  const btnCancel = document.getElementById("btn-cancel-entry");
  const filterSelect = document.getElementById("journal-style-filter");
  const btnCompare = document.getElementById("btn-compare");
  const comparisonEl = document.getElementById("journal-comparison");
  const modalOverlay = document.getElementById("journal-detail-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");
  const searchInput = document.getElementById("journal-search-input");
  const sortSelect = document.getElementById("journal-sort-select");

  // Restore saved sort preference
  const savedSort = localStorage.getItem("pielab-journal-sort");
  if (savedSort && sortSelect) sortSelect.value = savedSort;

  // Star rating state
  let currentRating = 0;
  const starContainer = document.getElementById("j-star-rating");
  const stars = starContainer.querySelectorAll(".star");

  // Multi-photo state (replaces single-photo)
  let currentPhotos = []; // array of data-URL strings, max 4
  const photoInput = document.getElementById("j-photo-input");
  const photoGrid = document.getElementById("j-photo-grid");
  const photoAddBtn = document.getElementById("j-photo-add-btn");
  const MAX_PHOTOS = 4;

  // Iteration / derivedFrom state
  let pendingDerivedFromId = null;

  // Dough snapshot state
  let currentSnapshot = null;
  const snapshotEl = document.getElementById("j-dough-snapshot");

  // Form heading
  const formHeading = document.getElementById("journal-form-heading");

  // ── HTML escaping — prevents XSS from user-supplied text ──
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ── Storage usage display ────────────────────────
  function updateStorageDisplay() {
    const label = document.getElementById("storage-label");
    const fill = document.getElementById("storage-bar-fill");
    if (!label || !fill) return;

    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        totalBytes += (key.length + localStorage.getItem(key).length) * 2; // UTF-16
      }
    } catch { /* ignore */ }

    const limitBytes = 5 * 1024 * 1024; // ~5 MB
    const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
    const pct = Math.min((totalBytes / limitBytes) * 100, 100);

    label.textContent = `Storage: ${usedMB} MB of ~5 MB used`;
    fill.style.width = `${pct}%`;
    fill.className = "storage-bar-fill" + (pct > 80 ? " storage-warning" : pct > 95 ? " storage-critical" : "");
  }

  // ── Populate dropdowns ────────────────────────────
  function populateDropdowns() {
    const jStyle = document.getElementById("j-style");
    populateStyleSelect(jStyle);
    populateStyleSelect(filterSelect, { includeAll: true, placeholder: null });
  }

  function populateOvenDropdown() {
    const ovenSelect = document.getElementById("j-oven-type");
    populateOvenSelect(ovenSelect);
  }

  // ── Journal Stats Dashboard ─────────────────────────
  const statsSection = document.getElementById("journal-stats-section");
  const statsGrid = document.getElementById("stats-grid");
  const statsToggle = document.getElementById("stats-toggle");
  const statsArrow = document.getElementById("stats-toggle-arrow");

  function renderStats() {
    if (!statsSection || !statsGrid) return;
    const entries = PieLabJournal.getAllEntries();
    if (entries.length < 2) { statsSection.classList.add("hidden"); return; }
    statsSection.classList.remove("hidden");

    // Total Bakes
    const total = entries.length;

    // Favorite Style
    const styleCounts = {};
    entries.forEach(e => { styleCounts[e.styleKey] = (styleCounts[e.styleKey] || 0) + 1; });
    const favKey = Object.keys(styleCounts).sort((a, b) => styleCounts[b] - styleCounts[a])[0];
    const favName = (PIZZA_RECIPES[favKey] || {}).name || favKey;
    const favCount = styleCounts[favKey];

    // Average Rating
    const rated = entries.filter(e => e.rating > 0);
    const avgRating = rated.length ? (rated.reduce((s, e) => s + e.rating, 0) / rated.length) : 0;

    // Best Rated Bake
    const best = rated.length ? rated.reduce((a, b) => (b.rating > a.rating || (b.rating === a.rating && b.date > a.date)) ? b : a) : null;
    const bestLabel = best ? (best.bakeName || best.date || "—") : "—";

    // Bakes This Month
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = entries.filter(e => e.date && e.date.startsWith(monthPrefix)).length;

    // Most Common Oven
    const ovenCounts = {};
    entries.forEach(e => { if (e.ovenType) ovenCounts[e.ovenType] = (ovenCounts[e.ovenType] || 0) + 1; });
    const topOven = Object.keys(ovenCounts).sort((a, b) => ovenCounts[b] - ovenCounts[a])[0] || "";
    const ovenLabel = (typeof OVEN_TYPES !== "undefined" && OVEN_TYPES[topOven]) ? OVEN_TYPES[topOven].replace("Home Oven + ", "") : topOven;

    const cards = [
      { value: total, label: "Total Bakes" },
      { value: favName, label: `Favorite (×${favCount})` },
      { value: avgRating ? avgRating.toFixed(1) + " ★" : "—", label: "Avg Rating" },
      { value: best ? best.rating + " ★" : "—", label: bestLabel },
      { value: thisMonth, label: "This Month" },
      { value: ovenLabel || "—", label: "Top Oven" },
    ];

    statsGrid.innerHTML = cards.map(c =>
      `<div class="stat-card"><div class="stat-value">${c.value}</div><div class="stat-label">${c.label}</div></div>`
    ).join("");

    // Restore collapse state
    const collapsed = localStorage.getItem("pielab-stats-open") === "0";
    statsGrid.classList.toggle("collapsed", collapsed);
    statsArrow.style.transform = collapsed ? "rotate(0deg)" : "rotate(180deg)";
  }

  if (statsToggle) {
    statsToggle.addEventListener("click", () => {
      const isCollapsed = statsGrid.classList.toggle("collapsed");
      statsArrow.style.transform = isCollapsed ? "rotate(0deg)" : "rotate(180deg)";
      localStorage.setItem("pielab-stats-open", isCollapsed ? "0" : "1");
    });
  }

  // ── Star rating — click to set, hover to preview ──
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const clicked = parseInt(star.dataset.value);
      currentRating = clicked === currentRating ? 0 : clicked;
      updateStars();
    });

    star.addEventListener("mouseenter", () => {
      const hoverVal = parseInt(star.dataset.value);
      stars.forEach((s) => {
        s.classList.toggle("hovered", parseInt(s.dataset.value) <= hoverVal);
        s.classList.remove("active");
      });
    });

    star.addEventListener("mouseleave", () => {
      stars.forEach((s) => s.classList.remove("hovered"));
      updateStars();
    });
  });

  function updateStars() {
    stars.forEach((s) => {
      const val = parseInt(s.dataset.value);
      s.classList.toggle("active", val <= currentRating);
    });
  }

  function renderStars(rating) {
    return "\u2605".repeat(rating) + "\u2606".repeat(5 - rating);
  }

  // ── Multi-photo handling ──────────────────────────
  function renderPhotoGrid() {
    photoGrid.innerHTML = "";

    currentPhotos.forEach((dataUrl, idx) => {
      const thumb = document.createElement("div");
      thumb.className = "photo-grid-thumb";
      thumb.innerHTML = `
        <img src="${dataUrl}" alt="Photo ${idx + 1}" />
        <button type="button" class="photo-grid-remove" data-idx="${idx}" aria-label="Remove photo">&times;</button>
      `;
      photoGrid.appendChild(thumb);
    });

    // Show/hide the add button based on count
    if (currentPhotos.length >= MAX_PHOTOS) {
      photoAddBtn.classList.add("hidden");
    } else {
      photoAddBtn.classList.remove("hidden");
    }
  }

  async function handlePhotoFiles(files) {
    const remaining = MAX_PHOTOS - currentPhotos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    for (const file of toProcess) {
      try {
        const dataUrl = await PieLabJournal.compressPhoto(file, 800);
        currentPhotos.push(dataUrl);
      } catch {
        // silently skip unreadable files
      }
    }

    renderPhotoGrid();
  }

  photoInput.addEventListener("change", (e) => {
    if (e.target.files.length) {
      handlePhotoFiles(e.target.files);
      photoInput.value = ""; // reset so same file can be re-selected
    }
  });

  // Delegate remove clicks on photo grid
  photoGrid.addEventListener("click", (e) => {
    const removeBtn = e.target.closest(".photo-grid-remove");
    if (!removeBtn) return;
    const idx = parseInt(removeBtn.dataset.idx);
    currentPhotos.splice(idx, 1);
    renderPhotoGrid();
  });

  // ── Show/hide form ────────────────────────────────
  function showForm(prefill, derivedFrom) {
    formWrapper.classList.remove("hidden");
    btnNewEntry.classList.add("hidden");

    // Set date to today
    document.getElementById("j-date").value = new Date().toISOString().split("T")[0];

    // Reset
    currentRating = 0;
    updateStars();
    currentPhotos = [];
    renderPhotoGrid();
    document.getElementById("j-bake-name").value = "";
    document.getElementById("j-notes").value = "";
    document.getElementById("j-bake-temp").value = "";
    document.getElementById("j-bake-time").value = "";
    document.getElementById("j-oven-type").selectedIndex = 0;
    pendingDerivedFromId = null;

    if (derivedFrom) {
      // Iteration mode — new entry based on an existing one
      pendingDerivedFromId = derivedFrom.id;
      formHeading.textContent = `New Bake \u2014 Based on ${derivedFrom.styleName}`;

      document.getElementById("j-style").value = derivedFrom.styleKey || "";
      if (derivedFrom.bakeTemp) document.getElementById("j-bake-temp").value = derivedFrom.bakeTemp;
      if (derivedFrom.bakeTime) document.getElementById("j-bake-time").value = derivedFrom.bakeTime;
      if (derivedFrom.ovenType) document.getElementById("j-oven-type").value = derivedFrom.ovenType;

      if (derivedFrom.doughSnapshot) {
        currentSnapshot = derivedFrom.doughSnapshot;
        renderSnapshot(derivedFrom.doughSnapshot);
      } else {
        currentSnapshot = null;
        snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">No dough data for this entry</span>';
      }

      // Don't copy photos or notes — user starts fresh for the new bake
    } else if (prefill) {
      // New entry with calculator prefill
      try {
        const raw = localStorage.getItem("pielab-last-calc");
        if (raw) {
          const calc = JSON.parse(raw);
          document.getElementById("j-style").value = calc.styleKey;
          if (calc.bakeTemp) {
            document.getElementById("j-bake-temp").value = calc.bakeTemp;
          }
          currentSnapshot = calc.doughSnapshot;
          renderSnapshot(calc.doughSnapshot);

          // Carry lineage through from "Use as Starting Point" flow
          if (calc.derivedFromId) {
            pendingDerivedFromId = calc.derivedFromId;
            const parent = PieLabJournal.getEntryById(calc.derivedFromId);
            formHeading.textContent = parent
              ? `New Bake \u2014 Based on ${parent.styleName} (${formatDate(parent.date)})`
              : "New Bake \u2014 Iteration";
          } else {
            formHeading.textContent = "Log a Bake";
          }
        } else {
          formHeading.textContent = "Log a Bake";
          currentSnapshot = null;
          snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
        }
      } catch {
        formHeading.textContent = "Log a Bake";
        currentSnapshot = null;
        snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
      }
    } else {
      formHeading.textContent = "Log a Bake";
      currentSnapshot = null;
      snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
    }

    // Style match indicator
    const styleHistoryEl = document.getElementById("j-style-history");
    const selectedStyle = document.getElementById("j-style").value;
    if (selectedStyle && styleHistoryEl) {
      const styleEntries = PieLabJournal.getEntriesByStyle(selectedStyle);
      if (styleEntries.length > 0) {
        const bestRating = Math.max(...styleEntries.map(e => e.rating || 0));
        const styleName = (PIZZA_RECIPES[selectedStyle] || {}).name || selectedStyle;
        styleHistoryEl.textContent = `You\u2019ve logged ${styleEntries.length} ${styleName} bake${styleEntries.length > 1 ? "s" : ""}. Your best was ${bestRating} \u2605`;
        styleHistoryEl.classList.remove("hidden");
      } else {
        styleHistoryEl.classList.add("hidden");
      }
    } else if (styleHistoryEl) {
      styleHistoryEl.classList.add("hidden");
    }

    formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideForm() {
    formWrapper.classList.add("hidden");
    btnNewEntry.classList.remove("hidden");
    pendingDerivedFromId = null;
    formHeading.textContent = "Log a Bake";
    localStorage.removeItem("pielab-pending-bake");
  }

  function renderSnapshot(snap) {
    if (!snap) return;
    snapshotEl.innerHTML = `
      <span class="snapshot-label">Dough Snapshot:</span>
      <span class="snapshot-chip"><strong>${(snap.hydration * 100).toFixed(1)}%</strong> hydration</span>
      <span class="snapshot-chip"><strong>${(snap.saltPct * 100).toFixed(1)}%</strong> salt</span>
      <span class="snapshot-chip"><strong>${(snap.oilPct * 100).toFixed(1)}%</strong> oil</span>
      <span class="snapshot-chip"><strong>${(snap.sugarPct * 100).toFixed(1)}%</strong> sugar</span>
      <span class="snapshot-chip"><strong>${(snap.yeastPct * 100).toFixed(2)}%</strong> yeast</span>
      <span class="snapshot-chip"><strong>${snap.doughBallWeight}g</strong> per ball</span>
    `;
  }

  btnNewEntry.addEventListener("click", () => showForm(false));
  btnCancel.addEventListener("click", hideForm);

  // Check for ?prefill=1 URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("prefill") === "1") {
    setTimeout(() => showForm(true), 100);
  } else {
    // Auto-detect pending bake (no button press required)
    try {
      const raw = localStorage.getItem("pielab-pending-bake");
      if (raw) {
        const pending = JSON.parse(raw);
        if (pending.timestamp && (Date.now() - pending.timestamp < 24 * 60 * 60 * 1000)) {
          setTimeout(() => showForm(true), 100);
        } else {
          localStorage.removeItem("pielab-pending-bake"); // stale
        }
      }
    } catch { /* ignore */ }
  }

  // ── Save entry ────────────────────────────────────
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const styleKey = document.getElementById("j-style").value;
    if (!styleKey) { alert("Please select a pizza style."); return; }

    const recipe = PIZZA_RECIPES[styleKey];
    const bakeName = document.getElementById("j-bake-name").value.trim();
    const entry = {
      date: document.getElementById("j-date").value,
      bakeName: bakeName || null,
      styleKey,
      styleName: recipe ? recipe.name : styleKey,
      doughSnapshot: currentSnapshot || null,
      bakeTemp: parseInt(document.getElementById("j-bake-temp").value) || null,
      bakeTime: document.getElementById("j-bake-time").value.trim() || null,
      ovenType: document.getElementById("j-oven-type").value,
      rating: currentRating || 0,
      notes: document.getElementById("j-notes").value.trim(),
      photos: currentPhotos.length ? [...currentPhotos] : [],
      photo: currentPhotos.length ? currentPhotos[0] : null, // legacy compat
      derivedFromId: pendingDerivedFromId || null,
    };

    const saved = PieLabJournal.addEntry(entry);
    localStorage.removeItem("pielab-pending-bake");

    pendingDerivedFromId = null;
    hideForm();
    renderEntries();
    renderStats();
    updateCompareButton();
    updateStorageDisplay();

    // Celebrate milestone tier achievements (1, 4, 9, 16, 26 bakes per style)
    const MILESTONE_COUNTS = [1, 4, 9, 16, 26];
    if (MILESTONE_COUNTS.includes(saved.skillCount)) {
      showMilestoneCelebration(saved);
    }
  });

  // ── Empty state builder ──────────────────────────
  function buildEmptyState() {
    return `<div class="journal-empty-state">
      <div class="empty-state-icon">\u25CB</div>
      <h3>No bakes logged yet</h3>
      <p>Run the calculator, hit \u201CLog This Bake,\u201D and your first session will appear here.</p>
      <a href="calculator.html" class="btn-primary">Go to Make \u2192</a>
    </div>`;
  }

  // ── Render entries ────────────────────────────────
  function renderEntries() {
    const filter = filterSelect.value;
    let entries = filter === "all"
      ? PieLabJournal.getAllEntries()
      : PieLabJournal.getEntriesByStyle(filter);

    // Hide toolbar when journal is empty (no entries at all, not just filtered)
    const toolbar = document.querySelector(".journal-toolbar");
    const allEntries = PieLabJournal.getAllEntries();
    if (toolbar) toolbar.classList.toggle("hidden", !allEntries || allEntries.length === 0);

    if (!allEntries || allEntries.length === 0) {
      entriesContainer.innerHTML = buildEmptyState();
      return;
    }

    // ── Text search filter ──────────────────────────
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    if (searchTerm) {
      entries = entries.filter((entry) => {
        const bakeName = (entry.bakeName || "").toLowerCase();
        const styleName = (entry.styleName || "").toLowerCase();
        const notes = (entry.notes || "").toLowerCase();
        return bakeName.includes(searchTerm) || styleName.includes(searchTerm) || notes.includes(searchTerm);
      });
    }

    // ── Sort ────────────────────────────────────────
    const sortValue = sortSelect ? sortSelect.value : "newest";
    entries.sort((a, b) => {
      switch (sortValue) {
        case "oldest":
          return (a.date || "").localeCompare(b.date || "");
        case "newest":
          return (b.date || "").localeCompare(a.date || "");
        case "hydration-high": {
          const aH = a.doughSnapshot ? a.doughSnapshot.hydration : -1;
          const bH = b.doughSnapshot ? b.doughSnapshot.hydration : -1;
          return bH - aH;
        }
        case "hydration-low": {
          const aH = a.doughSnapshot ? a.doughSnapshot.hydration : Infinity;
          const bH = b.doughSnapshot ? b.doughSnapshot.hydration : Infinity;
          return aH - bH;
        }
        case "rating-high":
          return (b.rating || 0) - (a.rating || 0);
        case "rating-low":
          return (a.rating || 0) - (b.rating || 0);
        default:
          return 0;
      }
    });

    if (!entries || entries.length === 0) {
      entriesContainer.innerHTML = '<div class="journal-no-results">No matching bakes found.</div>';
      return;
    }

    entriesContainer.querySelectorAll(".journal-empty-state").forEach((c) => c.remove());
    entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());
    entriesContainer.querySelectorAll(".styles-mastered-row").forEach((c) => c.remove());

    // ── Styles Mastered summary (only if any style ≥ 26 bakes) ──
    if (typeof PIZZA_RECIPES !== "undefined") {
      const masteredStyles = Object.keys(PIZZA_RECIPES).filter(
        (key) => PieLabJournal.getStyleBakeCount(key) >= 26
      );
      if (masteredStyles.length > 0) {
        const row = document.createElement("div");
        row.className = "styles-mastered-row";
        const pills = masteredStyles
          .map((key) => {
            const name = PIZZA_RECIPES[key] ? PIZZA_RECIPES[key].name : key;
            return `<span class="mastered-pill">\uD83C\uDFC6 ${escapeHtml(name)}</span>`;
          })
          .join("");
        row.innerHTML = `<span class="mastered-label">Styles Mastered</span><div class="mastered-list">${pills}</div>`;
        entriesContainer.appendChild(row);
      }
    }

    entries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "journal-entry-card";
      card.dataset.id = entry.id;

      // Use first photo from photos array, fall back to legacy photo field
      const thumbSrc = (entry.photos && entry.photos.length) ? entry.photos[0] : entry.photo;
      const thumbHtml = thumbSrc
        ? `<img class="entry-thumb" src="${thumbSrc}" alt="Bake photo" />`
        : `<div class="entry-thumb-placeholder">\uD83C\uDF55</div>`;

      const detailParts = [];
      if (entry.bakeTemp) detailParts.push(`${entry.bakeTemp}\u00B0F`);
      if (entry.bakeTime) detailParts.push(`${entry.bakeTime} min`);
      if (entry.ovenType && OVEN_TYPES[entry.ovenType]) {
        detailParts.push(OVEN_TYPES[entry.ovenType]);
      } else if (entry.ovenType) {
        detailParts.push(escapeHtml(entry.ovenType));
      }

      // Lineage badge
      const lineageBadge = entry.derivedFromId
        ? '<span class="lineage-badge">\uD83D\uDD04 Iteration</span>'
        : "";

      card.innerHTML = `
        ${thumbHtml}
        <div class="entry-info">
          <div class="entry-top-row">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-style-badge">${escapeHtml(entry.styleName)}</span>
            ${lineageBadge}
            ${entry.rating ? `<span class="entry-stars">${renderStars(entry.rating)}</span>` : ""}
          </div>
          ${entry.bakeName ? `<div class="entry-bake-name">${escapeHtml(entry.bakeName)}</div>` : ""}
          ${detailParts.length ? `<div class="entry-details">${detailParts.join(" \u00B7 ")}</div>` : ""}
          ${entry.skillBadge ? `<div class="entry-skill-line"><span class="skill-pill">${entry.skillBadge}</span><span class="skill-bake-count">Bake #${entry.skillCount} in ${escapeHtml(entry.styleName)}</span></div>` : ""}
          ${entry.notes ? `<div class="entry-notes-preview">${escapeHtml(entry.notes)}</div>` : ""}
        </div>
      `;

      card.addEventListener("click", () => openDetailModal(entry));
      entriesContainer.appendChild(card);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // ── Filter ────────────────────────────────────────
  filterSelect.addEventListener("change", () => {
    renderEntries();
    updateCompareButton();
    comparisonEl.classList.add("hidden");
  });

  // Search (debounced)
  let searchTimer = null;
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderEntries(), 300);
    });
  }

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      localStorage.setItem("pielab-journal-sort", sortSelect.value);
      renderEntries();
    });
  }

  const compareHint = document.getElementById("compare-hint");

  function updateCompareButton() {
    const filter = filterSelect.value;
    if (filter === "all") {
      btnCompare.disabled = true;
      compareHint.textContent = "Filter by a specific style to compare bakes.";
      compareHint.classList.remove("hidden");
      return;
    }
    const entries = PieLabJournal.getEntriesByStyle(filter);
    if (entries.length < 2) {
      btnCompare.disabled = true;
      compareHint.textContent = "Log at least 2 bakes of this style to compare.";
      compareHint.classList.remove("hidden");
    } else {
      btnCompare.disabled = false;
      compareHint.classList.add("hidden");
    }
  }

  // ── Detail Modal ──────────────────────────────────
  function openDetailModal(entry) {
    let html = "";

    // Photo strip — supports multiple photos
    const photos = (entry.photos && entry.photos.length) ? entry.photos : (entry.photo ? [entry.photo] : []);
    if (photos.length) {
      html += '<div class="modal-photo-strip">';
      photos.forEach((src, i) => {
        html += `<img class="modal-strip-img${i === 0 ? " active" : ""}" src="${src}" alt="Bake photo ${i + 1}" data-idx="${i}" />`;
      });
      html += "</div>";

      // If multiple photos, show the first as large preview
      if (photos.length > 1) {
        html += `<img class="modal-photo-main" id="modal-photo-main" src="${photos[0]}" alt="Bake photo" />`;
      }
    }

    // Skill badge — use entry-stamped data
    const modalBadgeHtml = entry.skillBadge
      ? `<span class="skill-pill skill-pill--modal">${entry.skillBadge}</span>`
      : "";

    html += `
      <div class="modal-header">
        <div class="modal-header-top">
          <h3>${escapeHtml(entry.bakeName || entry.styleName)}</h3>
          ${modalBadgeHtml}
        </div>
        ${entry.bakeName ? `<span class="modal-style-label">${escapeHtml(entry.styleName)}</span>` : ""}
        <span class="entry-date">${formatDate(entry.date)}</span>
        ${entry.rating ? `<span class="modal-stars">${renderStars(entry.rating)}</span>` : ""}
      </div>
    `;

    // Lineage row
    if (entry.derivedFromId) {
      const parent = PieLabJournal.getEntryById(entry.derivedFromId);
      if (parent) {
        html += `
          <div class="modal-lineage">
            <span class="lineage-icon">\uD83D\uDD04</span>
            <span>Based on <strong>${escapeHtml(parent.styleName)}</strong> bake from ${formatDate(parent.date)}</span>
          </div>
        `;
      } else {
        html += `
          <div class="modal-lineage">
            <span class="lineage-icon">\uD83D\uDD04</span>
            <span>Iteration of a previous bake</span>
          </div>
        `;
      }
    }

    // Details grid
    const details = [];
    if (entry.bakeTemp) details.push({ label: "Bake Temp", value: `${entry.bakeTemp}\u00B0F` });
    if (entry.bakeTime) details.push({ label: "Bake Time", value: `${entry.bakeTime} min` });
    if (entry.ovenType) {
      const label = OVEN_TYPES[entry.ovenType] || escapeHtml(entry.ovenType);
      details.push({ label: "Oven", value: label });
    }

    if (entry.doughSnapshot) {
      const s = entry.doughSnapshot;
      details.push({ label: "Hydration", value: `${(s.hydration * 100).toFixed(1)}%` });
      details.push({ label: "Salt", value: `${(s.saltPct * 100).toFixed(1)}%` });
      details.push({ label: "Oil", value: `${(s.oilPct * 100).toFixed(1)}%` });
      details.push({ label: "Sugar", value: `${(s.sugarPct * 100).toFixed(1)}%` });
      details.push({ label: "Yeast", value: `${(s.yeastPct * 100).toFixed(2)}%` });
      details.push({ label: "Dough Ball", value: `${s.doughBallWeight}g` });
    }

    if (details.length) {
      html += '<div class="modal-detail-grid">';
      details.forEach((d) => {
        html += `<div class="modal-detail-item"><span class="detail-label">${d.label}</span><span class="detail-value">${d.value}</span></div>`;
      });
      html += "</div>";
    }

    // Dough Formula — reconstruct gram amounts from baker's percentages
    if (entry.doughSnapshot && entry.doughSnapshot.doughBallWeight > 0) {
      const s = entry.doughSnapshot;
      const totalPct = 1 + (s.hydration || 0) + (s.saltPct || 0) + (s.oilPct || 0) + (s.sugarPct || 0) + (s.yeastPct || 0);
      const flourG = s.doughBallWeight / totalPct;
      const ingredients = [
        { name: "Flour", grams: flourG, pct: 100 },
        { name: "Water", grams: flourG * (s.hydration || 0), pct: (s.hydration || 0) * 100 },
        { name: "Salt", grams: flourG * (s.saltPct || 0), pct: (s.saltPct || 0) * 100 },
        { name: "Oil", grams: flourG * (s.oilPct || 0), pct: (s.oilPct || 0) * 100 },
        { name: "Sugar", grams: flourG * (s.sugarPct || 0), pct: (s.sugarPct || 0) * 100 },
        { name: "Yeast", grams: flourG * (s.yeastPct || 0), pct: (s.yeastPct || 0) * 100 },
      ].filter((ing) => Math.round(ing.grams) > 0);
      const totalG = ingredients.reduce((sum, ing) => sum + ing.grams, 0);

      html += '<div class="modal-formula-section"><h4>Dough Formula <span class="formula-per-ball">(per ball)</span></h4>';
      html += '<div class="modal-formula-grid">';
      ingredients.forEach((ing) => {
        const pctStr = ing.name === "Flour" ? "100%" : ing.pct < 1 ? `${ing.pct.toFixed(2)}%` : `${ing.pct.toFixed(1)}%`;
        html += `<div class="formula-row"><span class="formula-ingredient">${ing.name}</span><span class="formula-grams">${Math.round(ing.grams)}g</span><span class="formula-pct">${pctStr}</span></div>`;
      });
      html += `<div class="formula-row formula-total"><span class="formula-ingredient">Total</span><span class="formula-grams">${Math.round(totalG)}g</span><span class="formula-pct">${(totalPct * 100).toFixed(0)}%</span></div>`;
      html += "</div></div>";
    }

    if (entry.notes) {
      html += `<div class="modal-notes"><h4>Notes</h4><p>${escapeHtml(entry.notes)}</p></div>`;
    }

    // Share button — only if entry has a photo
    const hasPhoto = (entry.photos && entry.photos.length) || entry.photo;
    const shareBtnHtml = hasPhoto
      ? `<button class="btn-modal-share" data-id="${entry.id}">Share This Bake</button>`
      : "";

    html += `
      <div class="modal-actions">
        ${shareBtnHtml}
        <button class="btn-modal-iterate" data-id="${entry.id}">
          Bake Again ↻
        </button>
        <button class="btn-modal-delete" data-id="${entry.id}">
          Delete
        </button>
      </div>
    `;

    modalBody.innerHTML = html;
    modalOverlay.classList.remove("hidden");

    // Photo strip click → swap main image
    if (photos.length > 1) {
      const mainImg = document.getElementById("modal-photo-main");
      const stripImgs = modalBody.querySelectorAll(".modal-strip-img");
      stripImgs.forEach((img) => {
        img.addEventListener("click", () => {
          mainImg.src = img.src;
          stripImgs.forEach((s) => s.classList.remove("active"));
          img.classList.add("active");
        });
      });
    }

    // Iterate handler — "Use as Starting Point" → load into calculator
    modalBody.querySelector(".btn-modal-iterate").addEventListener("click", () => {
      const lastCalcData = {
        styleKey: entry.styleKey,
        styleName: entry.styleName,
        sizeKey: null,
        numPizzas: 1,
        ovenType: entry.ovenType || "",
        useCustom: false,
        doughSnapshot: entry.doughSnapshot || null,
        bakeTemp: entry.bakeTemp || null,
        derivedFromId: entry.id,
      };
      localStorage.setItem("pielab-last-calc", JSON.stringify(lastCalcData));
      window.location.href = "calculator.html?load=1";
    });

    // Delete handler
    modalBody.querySelector(".btn-modal-delete").addEventListener("click", (e) => {
      if (confirm("Delete this journal entry? This cannot be undone.")) {
        PieLabJournal.deleteEntry(e.target.dataset.id);
        modalOverlay.classList.add("hidden");
        renderEntries();
        renderStats();
        updateCompareButton();
        updateStorageDisplay();
      }
    });

    // Share handler
    const shareBtn = modalBody.querySelector(".btn-modal-share");
    if (shareBtn) shareBtn.addEventListener("click", () => shareThisBake(entry));
  }

  modalClose.addEventListener("click", () => modalOverlay.classList.add("hidden"));
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
  });

  // ── Comparison ────────────────────────────────────
  btnCompare.addEventListener("click", () => {
    const filter = filterSelect.value;
    if (filter === "all") return;

    const entries = PieLabJournal.getEntriesByStyle(filter);
    const analysis = PieLabJournal.analyzeEntries(entries);

    if (analysis.insufficient) {
      comparisonEl.innerHTML = '<p class="comparison-empty">You need at least 2 logged bakes to compare. Keep baking.</p>';
      comparisonEl.classList.remove("hidden");
      return;
    }

    let html = `
      <div class="comparison-header">
        <h3>Comparison \u2014 ${PIZZA_RECIPES[filter]?.name || filter}</h3>
        <span class="comparison-count">${analysis.totalEntries} entries</span>
      </div>
    `;

    html += '<div class="insights-row">';
    if (analysis.bestHydration) {
      html += `
        <div class="insight-card insight-highlight">
          <span class="insight-icon">\uD83D\uDCA7</span>
          <div>
            <strong>Best Hydration: ${analysis.bestHydration.value}%</strong>
            <p>Avg rating: ${analysis.bestHydration.avg}/5 (${analysis.bestHydration.count} bakes)</p>
          </div>
        </div>
      `;
    }
    if (analysis.bestBakeTemp) {
      html += `
        <div class="insight-card insight-highlight">
          <span class="insight-icon">\uD83C\uDF21\uFE0F</span>
          <div>
            <strong>Best Temp: ${analysis.bestBakeTemp.value}\u00B0F</strong>
            <p>Avg rating: ${analysis.bestBakeTemp.avg}/5 (${analysis.bestBakeTemp.count} bakes)</p>
          </div>
        </div>
      `;
    }
    html += "</div>";

    html += '<div class="comparison-table-wrapper"><table class="comparison-table">';
    html += "<thead><tr><th>Date</th><th>Hydration</th><th>Bake Temp</th><th>Time</th><th>Oven</th><th>Rating</th></tr></thead><tbody>";

    entries.forEach((entry) => {
      const hydration = entry.doughSnapshot ? Math.round(entry.doughSnapshot.hydration * 100) : null;
      const bakeTemp = entry.bakeTemp ? Math.round(entry.bakeTemp / 25) * 25 : null;

      const hClass = hydration != null && analysis.bestHydration && hydration === analysis.bestHydration.value ? "highlight-cell" : "";
      const tClass = bakeTemp != null && analysis.bestBakeTemp && bakeTemp === analysis.bestBakeTemp.value ? "highlight-cell" : "";

      const ovenLabel = OVEN_TYPES[entry.ovenType] || escapeHtml(entry.ovenType) || "\u2014";

      html += `<tr>
        <td>${formatDate(entry.date)}</td>
        <td class="${hClass}">${hydration != null ? hydration + "%" : "\u2014"}</td>
        <td class="${tClass}">${entry.bakeTemp ? entry.bakeTemp + "\u00B0F" : "\u2014"}</td>
        <td>${entry.bakeTime ? entry.bakeTime + " min" : "\u2014"}</td>
        <td>${ovenLabel}</td>
        <td class="stars-cell">${entry.rating ? renderStars(entry.rating) : "\u2014"}</td>
      </tr>`;
    });

    html += "</tbody></table></div>";
    html += '<button class="btn-close-comparison" id="btn-close-comparison">Close Comparison</button>';

    comparisonEl.innerHTML = html;
    comparisonEl.classList.remove("hidden");
    comparisonEl.scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("btn-close-comparison").addEventListener("click", () => {
      comparisonEl.classList.add("hidden");
    });
  });

  // ── Milestone Celebration ─────────────────────────
  function showMilestoneCelebration(entry) {
    const badge = entry.skillBadge || "";
    const badgeEmoji = badge.split(" ")[0];
    const badgeName  = badge.split(" ").slice(1).join(" ");
    const isFirst = entry.skillCount === 1;

    const title = isFirst
      ? "Your First Bake!"
      : `${badgeName}!`;
    const msg = isFirst
      ? `You just logged <strong>${entry.styleName}</strong>. Your pizza journey starts now.`
      : `<strong>${entry.styleName}</strong> \u2014 bake #${entry.skillCount}. You\u2019ve earned a new badge.`;
    const hint = isFirst
      ? "Fill your Style Passport by baking all 13 styles."
      : `Keep going \u2014 your ${entry.styleName} game is leveling up.`;

    const overlay = document.createElement("div");
    overlay.className = "first-bake-overlay";
    overlay.innerHTML = `
      <div class="first-bake-card">
        <span class="first-bake-emoji">${badgeEmoji}</span>
        <h2 class="first-bake-title">${title}</h2>
        <p class="first-bake-msg">${msg}</p>
        <p class="first-bake-hint">${hint}</p>
        <button class="first-bake-dismiss">Let\u2019s Go</button>
      </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("first-bake--visible"));

    const dismiss = () => {
      overlay.classList.remove("first-bake--visible");
      setTimeout(() => overlay.remove(), 400);
    };
    overlay.querySelector(".first-bake-dismiss").addEventListener("click", dismiss);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) dismiss(); });
    setTimeout(dismiss, 8000);
  }

  // ── Toast Notification ──────────────────────────────
  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    // Trigger reflow then add visible class for transition
    requestAnimationFrame(() => toast.classList.add("toast--visible"));
    setTimeout(() => {
      toast.classList.remove("toast--visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Share This Bake ────────────────────────────────
  async function shareThisBake(entry) {
    // 1. Read profile
    if (typeof PieLabProfile === "undefined") {
      showToast("Complete your profile in the Kitchen tab to share your bakes");
      return;
    }
    const profile = PieLabProfile.getProfile();
    const name = (profile.displayName || "").trim();
    const location = (profile.city || "").trim();

    if (!name || !location) {
      showToast("Complete your profile in the Kitchen tab to share your bakes");
      return;
    }

    // 2. Get photo
    const photoSrc = (entry.photos && entry.photos.length) ? entry.photos[0] : entry.photo;
    if (!photoSrc) {
      showToast("Add a photo to share this bake");
      return;
    }

    // 3. Get skill level from entry-stamped badge
    const skillLevel = entry.skillBadge || null;

    // 4. Generate Polaroid card
    showToast("Generating share image\u2026");
    let blob;
    try {
      blob = await generatePolaroidCard(entry, { name, location, skillLevel });
    } catch (err) {
      console.error("Polaroid generation failed:", err);
      showToast("Could not generate share image");
      return;
    }

    // 5. Build file list — Polaroid card + all bake photos
    const files = [new File([blob], "my-bake.png", { type: "image/png" })];
    const photos = (entry.photos && entry.photos.length) ? entry.photos : (entry.photo ? [entry.photo] : []);
    photos.forEach((dataUri, i) => {
      const photoFile = dataUriToFile(dataUri, `bake-photo-${i + 1}.jpg`);
      if (photoFile) files.push(photoFile);
    });

    // 6. Share or download
    try {
      if (navigator.share && navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: "Check out my bake on The Pie Lab",
        });
      } else {
        // Fallback: download Polaroid card + all photos
        files.forEach((f) => downloadBlob(f, f.name));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        files.forEach((f) => downloadBlob(f, f.name));
      }
    }
  }

  function dataUriToFile(dataUri, filename) {
    try {
      const [header, b64] = dataUri.split(",");
      const mime = header.match(/:(.*?);/)[1];
      const bytes = atob(b64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      return new File([arr], filename, { type: mime });
    } catch { return null; }
  }

  function downloadBlob(blobOrFile, filename) {
    const url = URL.createObjectURL(blobOrFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || blobOrFile.name || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ── Polaroid Card Generator ────────────────────────
  function generatePolaroidCard(entry, profile) {
    return new Promise((resolve, reject) => {
      const W = 1080, H = 1360, PHOTO_H = 1080;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      // Load bake photo
      const photoSrc = (entry.photos && entry.photos.length) ? entry.photos[0] : entry.photo;
      const img = new Image();
      img.onload = () => {
        // Draw cropped/centered to fill 1080x1080
        const srcW = img.width, srcH = img.height;
        const scale = Math.max(PHOTO_H / srcW, PHOTO_H / srcH);
        const drawW = srcW * scale, drawH = srcH * scale;
        const dx = (W - drawW) / 2, dy = (PHOTO_H - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);

        // Load logo watermark (may fail — graceful)
        const logo = new Image();
        logo.onload = () => {
          drawLogoWatermark(ctx, logo, W, PHOTO_H);
          finishCard(ctx, canvas, entry, profile, W, H, PHOTO_H, resolve);
        };
        logo.onerror = () => {
          // Logo missing — skip watermark, still finish card
          finishCard(ctx, canvas, entry, profile, W, H, PHOTO_H, resolve);
        };
        logo.src = "assets/logos/logo-transparent.svg";
      };
      img.onerror = () => reject(new Error("Failed to load bake photo"));
      img.src = photoSrc;
    });
  }

  function drawLogoWatermark(ctx, logo, canvasW, photoH) {
    // Logo SVG is 600x300 (2:1 aspect) — render at 200x100 in bottom-right
    const LOGO_W = 200, LOGO_H = 100, MARGIN = 15, PADDING = 10, RADIUS = 8;
    const x = canvasW - LOGO_W - MARGIN;
    const y = photoH - LOGO_H - MARGIN;

    // Semi-transparent white backing pill
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    roundRect(ctx, x - PADDING, y - PADDING, LOGO_W + PADDING * 2, LOGO_H + PADDING * 2, RADIUS);
    ctx.fill();

    // Draw logo
    ctx.drawImage(logo, x, y, LOGO_W, LOGO_H);
  }

  function finishCard(ctx, canvas, entry, profile, W, H, PHOTO_H, resolve) {
    // Separator line
    ctx.strokeStyle = "#e0ddd8";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, PHOTO_H);
    ctx.lineTo(W, PHOTO_H);
    ctx.stroke();

    // Polaroid border is already white from initial fill
    const LEFT = 40;

    // Username
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "600 28px Inter, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(profile.name, LEFT, 1138);

    // Location · Style
    ctx.fillStyle = "#555555";
    ctx.font = "400 22px Inter, sans-serif";
    const styleName = entry.styleName || entry.styleKey || "";
    ctx.fillText(`${profile.location} \u00B7 ${styleName}`, LEFT, 1178);

    // Skill badge pill
    if (profile.skillLevel) {
      ctx.font = "500 18px Inter, sans-serif";
      const badgeText = profile.skillLevel;
      const textW = ctx.measureText(badgeText).width;
      const pillPadH = 12, pillPadV = 6;
      const pillW = textW + pillPadH * 2;
      const pillH = 18 + pillPadV * 2;
      const pillX = LEFT, pillY = 1205;

      // Rounded rect background
      ctx.fillStyle = "#c9622a";
      roundRect(ctx, pillX, pillY, pillW, pillH, 6);
      ctx.fill();

      // Badge text
      ctx.fillStyle = "#ffffff";
      ctx.textBaseline = "middle";
      ctx.fillText(badgeText, pillX + pillPadH, pillY + pillH / 2);
    }

    // ThePieLab.app branding
    ctx.fillStyle = "#9a9690";
    ctx.font = "400 16px Inter, sans-serif";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "right";
    ctx.fillText("ThePieLab.app", 1040, 1335);
    ctx.textAlign = "left"; // reset

    // Export
    canvas.toBlob((blob) => resolve(blob), "image/png");
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  // ── Initialize ────────────────────────────────────
  populateDropdowns();
  populateOvenDropdown();
  renderEntries();
  renderStats();
  updateCompareButton();
  updateStorageDisplay();
})();
