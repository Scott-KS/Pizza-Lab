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

  // Photo state
  let currentPhotoData = null;
  const photoInput = document.getElementById("j-photo-input");
  const photoPreview = document.getElementById("j-photo-preview");
  const photoImg = document.getElementById("j-photo-img");
  const photoPlaceholder = document.getElementById("j-photo-placeholder");
  const photoRemove = document.getElementById("j-photo-remove");

  // Dough snapshot state
  let currentSnapshot = null;
  const snapshotEl = document.getElementById("j-dough-snapshot");

  // Populate style dropdowns using shared utility
  function populateDropdowns() {
    const jStyle = document.getElementById("j-style");
    populateStyleSelect(jStyle);

    populateStyleSelect(filterSelect, { includeAll: true, placeholder: null });
  }

  // Populate oven dropdown using shared OVEN_TYPES
  function populateOvenDropdown() {
    const ovenSelect = document.getElementById("j-oven-type");
    populateOvenSelect(ovenSelect);
  }

  // Star rating — click to set, hover to preview
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

  // Photo handling
  photoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      currentPhotoData = await PieLabJournal.compressPhoto(file);
      photoImg.src = currentPhotoData;
      photoPreview.classList.remove("hidden");
      photoPlaceholder.classList.add("hidden");
    } catch {
      alert("Could not process image. Please try another photo.");
    }
  });

  photoRemove.addEventListener("click", () => {
    currentPhotoData = null;
    photoInput.value = "";
    photoPreview.classList.add("hidden");
    photoPlaceholder.classList.remove("hidden");
  });

  // Show/hide form
  function showForm(prefill) {
    formWrapper.classList.remove("hidden");
    btnNewEntry.classList.add("hidden");

    // Set date to today
    document.getElementById("j-date").value = new Date().toISOString().split("T")[0];

    // Reset
    currentRating = 0;
    updateStars();
    currentPhotoData = null;
    photoInput.value = "";
    photoPreview.classList.add("hidden");
    photoPlaceholder.classList.remove("hidden");
    document.getElementById("j-notes").value = "";
    document.getElementById("j-bake-temp").value = "";
    document.getElementById("j-bake-time").value = "";
    document.getElementById("j-oven-type").selectedIndex = 0;

    if (prefill) {
      // Read from localStorage instead of window._lastCalc
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
        } else {
          currentSnapshot = null;
          snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
        }
      } catch {
        currentSnapshot = null;
        snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
      }
    } else {
      currentSnapshot = null;
      snapshotEl.innerHTML = '<span class="snapshot-label">Dough Snapshot:</span><span class="snapshot-empty">Calculate a recipe first to capture dough settings</span>';
    }

    formWrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideForm() {
    formWrapper.classList.add("hidden");
    btnNewEntry.classList.remove("hidden");
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
    // Auto-open form with prefill after a brief delay for DOM
    setTimeout(() => showForm(true), 100);
  }

  // Save entry
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const styleKey = document.getElementById("j-style").value;
    if (!styleKey) { alert("Please select a pizza style."); return; }

    const recipe = PIZZA_RECIPES[styleKey];
    const entry = {
      date: document.getElementById("j-date").value,
      styleKey,
      styleName: recipe ? recipe.name : styleKey,
      doughSnapshot: currentSnapshot || null,
      bakeTemp: parseInt(document.getElementById("j-bake-temp").value) || null,
      bakeTime: parseInt(document.getElementById("j-bake-time").value) || null,
      ovenType: document.getElementById("j-oven-type").value,
      rating: currentRating || 0,
      notes: document.getElementById("j-notes").value.trim(),
      photo: currentPhotoData || null,
    };

    PieLabJournal.addEntry(entry);
    hideForm();
    renderEntries();
    updateCompareButton();
  });

  // Render entries
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

    // Clear existing cards
    entriesContainer.querySelectorAll(".journal-entry-card").forEach((c) => c.remove());

    entries.forEach((entry) => {
      const card = document.createElement("div");
      card.className = "journal-entry-card";
      card.dataset.id = entry.id;

      const thumbHtml = entry.photo
        ? `<img class="entry-thumb" src="${entry.photo}" alt="Bake photo" />`
        : `<div class="entry-thumb-placeholder">\uD83C\uDF55</div>`;

      const detailParts = [];
      if (entry.bakeTemp) detailParts.push(`${entry.bakeTemp}\u00B0F`);
      if (entry.bakeTime) detailParts.push(`${entry.bakeTime} min`);
      if (entry.ovenType && OVEN_TYPES[entry.ovenType]) {
        detailParts.push(OVEN_TYPES[entry.ovenType]);
      } else if (entry.ovenType) {
        detailParts.push(entry.ovenType);
      }

      card.innerHTML = `
        ${thumbHtml}
        <div class="entry-info">
          <div class="entry-top-row">
            <span class="entry-date">${formatDate(entry.date)}</span>
            <span class="entry-style-badge">${entry.styleName}</span>
            ${entry.rating ? `<span class="entry-stars">${renderStars(entry.rating)}</span>` : ""}
          </div>
          ${detailParts.length ? `<div class="entry-details">${detailParts.join(" \u00B7 ")}</div>` : ""}
          ${entry.notes ? `<div class="entry-notes-preview">${entry.notes}</div>` : ""}
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

  // Filter
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

  // Detail Modal
  function openDetailModal(entry) {
    let html = "";

    if (entry.photo) {
      html += `<img class="modal-photo" src="${entry.photo}" alt="Bake photo" />`;
    }

    html += `
      <div class="modal-header">
        <h3>${entry.styleName}</h3>
        <span class="entry-date">${formatDate(entry.date)}</span>
        ${entry.rating ? `<span class="modal-stars">${renderStars(entry.rating)}</span>` : ""}
      </div>
    `;

    // Details grid
    const details = [];
    if (entry.bakeTemp) details.push({ label: "Bake Temp", value: `${entry.bakeTemp}\u00B0F` });
    if (entry.bakeTime) details.push({ label: "Bake Time", value: `${entry.bakeTime} min` });
    if (entry.ovenType) {
      const label = OVEN_TYPES[entry.ovenType] || entry.ovenType;
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
      html += `<div class="modal-notes"><h4>Notes</h4><p>${entry.notes}</p></div>`;
    }

    html += `
      <div class="modal-actions">
        <button class="btn-modal-delete" data-id="${entry.id}">Delete Entry</button>
      </div>
    `;

    modalBody.innerHTML = html;
    modalOverlay.classList.remove("hidden");

    // Delete handler
    modalBody.querySelector(".btn-modal-delete").addEventListener("click", (e) => {
      if (confirm("Delete this journal entry? This cannot be undone.")) {
        PieLabJournal.deleteEntry(e.target.dataset.id);
        modalOverlay.classList.add("hidden");
        renderEntries();
        updateCompareButton();
      }
    });
  }

  modalClose.addEventListener("click", () => modalOverlay.classList.add("hidden"));
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
  });

  // Comparison
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

    // Insight cards
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

    // Comparison table
    html += '<div class="comparison-table-wrapper"><table class="comparison-table">';
    html += "<thead><tr><th>Date</th><th>Hydration</th><th>Bake Temp</th><th>Time</th><th>Oven</th><th>Rating</th></tr></thead><tbody>";

    entries.forEach((entry) => {
      const hydration = entry.doughSnapshot ? Math.round(entry.doughSnapshot.hydration * 100) : null;
      const bakeTemp = entry.bakeTemp ? Math.round(entry.bakeTemp / 25) * 25 : null;

      const hClass = hydration != null && analysis.bestHydration && hydration === analysis.bestHydration.value ? "highlight-cell" : "";
      const tClass = bakeTemp != null && analysis.bestBakeTemp && bakeTemp === analysis.bestBakeTemp.value ? "highlight-cell" : "";

      const ovenLabel = OVEN_TYPES[entry.ovenType] || entry.ovenType || "\u2014";

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

  // Initialize
  populateDropdowns();
  populateOvenDropdown();
  renderEntries();
  updateCompareButton();
})();
