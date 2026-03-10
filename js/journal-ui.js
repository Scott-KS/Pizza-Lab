/* ══════════════════════════════════════════════════════
   The Pie Lab — Pizza Journal UI
   Page: journal.html
   ══════════════════════════════════════════════════════ */

(() => {
  const formWrapper = document.getElementById("journal-form-wrapper");
  const form = document.getElementById("journal-form");
  const entriesContainer = document.getElementById("journal-entries");
  const emptyState = document.getElementById("journal-empty");
  const btnNewEntry = document.getElementById("btn-new-entry");
  const btnCancel = document.getElementById("btn-cancel-entry");
  const filterSelect = document.getElementById("journal-style-filter");
  const btnCompare = document.getElementById("btn-compare");
  const comparisonEl = document.getElementById("journal-comparison");
  const modalOverlay = document.getElementById("journal-detail-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.getElementById("modal-close");

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

    formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideForm() {
    formWrapper.classList.add("hidden");
    btnNewEntry.classList.remove("hidden");
    pendingDerivedFromId = null;
    formHeading.textContent = "Log a Bake";
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
      bakeTime: parseInt(document.getElementById("j-bake-time").value) || null,
      ovenType: document.getElementById("j-oven-type").value,
      rating: currentRating || 0,
      notes: document.getElementById("j-notes").value.trim(),
      photos: currentPhotos.length ? [...currentPhotos] : [],
      photo: currentPhotos.length ? currentPhotos[0] : null, // legacy compat
      derivedFromId: pendingDerivedFromId || null,
    };

    PieLabJournal.addEntry(entry);

    pendingDerivedFromId = null;
    hideForm();
    renderEntries();
    updateCompareButton();
    updateStorageDisplay();
  });

  // ── Render entries ────────────────────────────────
  function renderEntries() {
    const filter = filterSelect.value;
    const entries = filter === "all"
      ? PieLabJournal.getAllEntries()
      : PieLabJournal.getEntriesByStyle(filter);

    if (entries.length === 0) {
      emptyState.classList.remove("hidden");
      entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());
      return;
    }

    emptyState.classList.add("hidden");
    entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());

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

    html += `
      <div class="modal-header">
        <h3>${escapeHtml(entry.bakeName || entry.styleName)}</h3>
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

    if (entry.notes) {
      html += `<div class="modal-notes"><h4>Notes</h4><p>${escapeHtml(entry.notes)}</p></div>`;
    }

    html += `
      <div class="modal-actions">
        <button class="btn-modal-iterate" data-id="${entry.id}">
          Use as Starting Point
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
      window.location.href = "index.html?load=1";
    });

    // Delete handler
    modalBody.querySelector(".btn-modal-delete").addEventListener("click", (e) => {
      if (confirm("Delete this journal entry? This cannot be undone.")) {
        PieLabJournal.deleteEntry(e.target.dataset.id);
        modalOverlay.classList.add("hidden");
        renderEntries();
        updateCompareButton();
        updateStorageDisplay();
      }
    });
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
      comparisonEl.innerHTML = "<p>Need at least 2 entries for the same style to compare.</p>";
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

  // ── Initialize ────────────────────────────────────
  populateDropdowns();
  populateOvenDropdown();
  renderEntries();
  updateCompareButton();
  updateStorageDisplay();
})();
