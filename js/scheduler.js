/* ══════════════════════════════════════════════════════
   The Pie Lab — Dough Scheduler UI
   Page: schedule.html
   ══════════════════════════════════════════════════════ */

(function initDoughScheduler() {
  const STORAGE_KEY = "pielab-active-schedule";

  // ── DOM Refs ──
  const styleSelect = document.getElementById("sched-style");
  const countInput = document.getElementById("sched-count");
  const datetimeInput = document.getElementById("sched-datetime");
  const ovenSelect = document.getElementById("sched-oven");
  const reminderSelect = document.getElementById("sched-reminder");
  const progressEl = document.getElementById("scheduler-progress");
  const methodCard = document.getElementById("sched-method-card");
  const validationEl = document.getElementById("sched-validation");
  const timelineEl = document.getElementById("sched-timeline");
  const visualBarEl = document.getElementById("sched-visual-bar");
  const bannerEl = document.getElementById("active-schedule-banner");

  // Wizard step panels
  const stepPanels = [
    document.getElementById("sched-step-1"),
    document.getElementById("sched-step-2"),
    document.getElementById("sched-step-3"),
  ];

  // Buttons
  const btnNext1 = document.getElementById("btn-sched-next-1");
  const btnBack2 = document.getElementById("btn-sched-back-2");
  const btnNext2 = document.getElementById("btn-sched-next-2");
  const btnBack3 = document.getElementById("btn-sched-back-3");
  const btnSaveImg = document.getElementById("btn-sched-save-img");
  const btnStartOver = document.getElementById("btn-sched-start-over");
  const btnBannerView = document.getElementById("btn-banner-view");
  const btnBannerClear = document.getElementById("btn-banner-clear");

  // State
  let currentStep = 1;
  let selectedMethod = null;
  let methodDisplayLabel = "";
  let computedSchedule = null;
  let countdownInterval = null;
  let stepTimeouts = [];
  let notifiedSteps = new Set();

  // ── Step Alarm (Web Audio) ──
  let alarmCtx = null;
  let alarmIntervalId = null;

  function startStepAlarm() {
    stopStepAlarm();
    try {
      alarmCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return; }
    function beepBurst() {
      if (!alarmCtx) return;
      [0, 0.2, 0.4].forEach(offset => {
        const osc = alarmCtx.createOscillator();
        const gain = alarmCtx.createGain();
        osc.connect(gain);
        gain.connect(alarmCtx.destination);
        osc.frequency.value = 660;
        gain.gain.value = 0.3;
        osc.start(alarmCtx.currentTime + offset);
        osc.stop(alarmCtx.currentTime + offset + 0.12);
      });
    }
    beepBurst();
    alarmIntervalId = setInterval(beepBurst, 2000);
  }

  function stopStepAlarm() {
    if (alarmIntervalId) { clearInterval(alarmIntervalId); alarmIntervalId = null; }
    if (alarmCtx) { try { alarmCtx.close(); } catch {} alarmCtx = null; }
  }

  function showStepAlert(stepLabel) {
    // Remove any existing alert
    const existing = document.getElementById("sched-step-alert");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "sched-step-alert";
    overlay.className = "sched-step-alert-overlay";
    overlay.innerHTML = `
      <div class="sched-step-alert-card">
        <div class="sched-alert-icon">\u23F0</div>
        <h3 class="sched-alert-title">Time\u2019s Up!</h3>
        <p class="sched-alert-label">${stepLabel}</p>
        <button type="button" class="sched-alert-dismiss" id="sched-alert-dismiss">Got It</button>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById("sched-alert-dismiss").addEventListener("click", () => {
      stopStepAlarm();
      overlay.remove();
    });
  }

  // ── Populate dropdowns using shared utilities ──
  populateStyleSelect(styleSelect);
  populateOvenSelect(ovenSelect);

  // Default to user's preferred oven from My Kitchen profile
  const kitchenProfile = PieLabProfile.getProfile();
  if (kitchenProfile.preferredOven &&
      ovenSelect.querySelector(`option[value="${kitchenProfile.preferredOven}"]`)) {
    ovenSelect.value = kitchenProfile.preferredOven;
  }

  // ── Default datetime to tomorrow 6 PM ──
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(18, 0, 0, 0);
  const tzOffset = tomorrow.getTimezoneOffset() * 60000;
  datetimeInput.value = new Date(tomorrow.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);

  // ── Wizard Navigation ──

  function goToStep(step) {
    currentStep = step;
    stepPanels.forEach((p, i) => {
      p.classList.toggle("active", i === step - 1);
    });

    // Update progress dots
    const dots = progressEl.querySelectorAll(".progress-step");
    const lines = progressEl.querySelectorAll(".progress-line");
    dots.forEach((dot, i) => {
      const stepNum = i + 1;
      dot.classList.remove("active", "completed");
      if (stepNum === step) dot.classList.add("active");
      else if (stepNum < step) dot.classList.add("completed");
      // Update dot text
      const dotEl = dot.querySelector(".progress-dot");
      if (stepNum < step) dotEl.textContent = "\u2713";
      else dotEl.textContent = stepNum;
    });
    lines.forEach((line, i) => {
      line.classList.toggle("completed", i < step - 1);
    });
  }

  function validateStep1() {
    return styleSelect.value && countInput.value > 0 && datetimeInput.value;
  }

  // Enable/disable Next button
  function checkStep1Ready() {
    btnNext1.disabled = !validateStep1();
  }
  styleSelect.addEventListener("change", checkStep1Ready);
  countInput.addEventListener("input", checkStep1Ready);
  datetimeInput.addEventListener("input", checkStep1Ready);

  // Flavor tradeoff notes for method selection cards
  const FLAVOR_NOTES = {
    "cold-72": "Maximum flavor complexity",
    "cold-48": "Great balance of flavor & convenience",
    "cold-24": "Good flavor, practical timeline",
    "same-day": "Convenient, lighter flavor",
  };

  // Pre-validate schedule with the currently selected method
  function preValidateSchedule() {
    const eatTime = new Date(datetimeInput.value);
    const styleKey = styleSelect.value;
    const recipe = PIZZA_RECIPES[styleKey];
    if (!recipe) return;
    const sizeKeys = Object.keys(recipe.sizes);
    const defaultSize = recipe.defaultSize || (sizeKeys.includes("12") ? "12" : sizeKeys[0]);
    const doughBallWeight = recipe.sizes[defaultSize].doughWeight;
    const numPizzas = parseInt(countInput.value, 10);

    const result = buildScheduleBackward(
      eatTime, ovenSelect.value, selectedMethod,
      numPizzas, doughBallWeight, styleKey
    );

    if (!result.isValid) {
      validationEl.textContent = result.validationMsg;
      validationEl.classList.remove("hidden");
      btnNext2.disabled = true;
    } else {
      validationEl.classList.add("hidden");
      btnNext2.disabled = false;
    }
  }

  // ── Step 1 → Step 2 ──
  btnNext1.addEventListener("click", () => {
    if (!validateStep1()) return;

    // Dough Scheduler is a Pro feature
    if (typeof PieLabPremium !== "undefined" && !PieLabPremium.canUse()) {
      PieLabPremium.gate(() => btnNext1.click());
      return;
    }

    const eatTime = new Date(datetimeInput.value);
    const now = new Date();
    const availableHours = (eatTime - now) / 3600000;
    const styleKey = styleSelect.value;

    if (availableHours <= 0) {
      alert("Please select a time in the future.");
      return;
    }

    // ── Style-specific fixed method cards ──
    if (styleKey === "school-night") {
      selectedMethod = FERMENT_METHODS["same-day"];
      methodCard.innerHTML = `
        <div class="method-card-fixed">
          <span class="method-req-badge">Style Requirement</span>
          <div class="method-badge">${selectedMethod.label}</div>
          <p class="method-description">This is a no-rise dough built for weeknight speed. Mix to table in under an hour \u2014 no fermentation, no cold rest. Just mix, rest 20 minutes, and bake.</p>
        </div>
      `;
      preValidateSchedule();
      goToStep(2);
      return;
    }

    if (styleKey === "chicago-tavern") {
      selectedMethod = FERMENT_METHODS["cure-24"];
      methodCard.innerHTML = `
        <div class="method-card-fixed">
          <span class="method-req-badge">Style Requirement</span>
          <div class="method-badge">${selectedMethod.label}</div>
          <p class="method-description">Chicago Tavern dough requires a 24-hour cure \u2014 this is what creates the cracker-thin, crispy texture. There\u2019s no shortcut. You\u2019ll need to start at least 26 hours before dinner.</p>
        </div>
      `;
      preValidateSchedule();
      goToStep(2);
      return;
    }

    // Get viable methods for this style and time window
    const availableMethods = getAvailableFermentMethods(availableHours, styleKey);
    selectedMethod = availableMethods[0]; // Default to best option

    const availHoursRounded = Math.round(availableHours);

    if (availableMethods.length === 1) {
      // Single method — non-interactive summary card
      methodCard.innerHTML = `
        <div class="method-badge">${selectedMethod.label}</div>
        <p class="method-description">${selectedMethod.description}</p>
        <p class="method-reason">${selectedMethod.reason}</p>
        <span class="method-time-badge">~${availHoursRounded} hours available</span>
      `;
    } else {
      // Multiple methods — render selectable cards
      let cardsHtml = '<div class="method-options">';
      availableMethods.forEach((m, i) => {
        const isSelected = i === 0;
        cardsHtml += `
          <button type="button" class="method-option-card${isSelected ? " selected" : ""}" data-method-id="${m.id}">
            <div class="method-option-label">${m.label}</div>
            <p class="method-option-desc">${m.description}</p>
            <span class="method-option-note">${FLAVOR_NOTES[m.id] || ""}</span>
          </button>
        `;
      });
      cardsHtml += '</div>';
      cardsHtml += `<span class="method-time-badge">\u2248 ${availHoursRounded} hours available</span>`;
      methodCard.innerHTML = cardsHtml;

      // Attach click handlers for method selection
      methodCard.querySelectorAll(".method-option-card").forEach((card) => {
        card.addEventListener("click", () => {
          methodCard.querySelectorAll(".method-option-card").forEach((c) => c.classList.remove("selected"));
          card.classList.add("selected");
          selectedMethod = FERMENT_METHODS[card.dataset.methodId];
          preValidateSchedule();
        });
      });
    }

    preValidateSchedule();
    goToStep(2);
  });

  // ── Step 2 → Back to Step 1 ──
  btnBack2.addEventListener("click", () => goToStep(1));

  // ── Step 2 → Step 3 ──
  btnNext2.addEventListener("click", () => {
    const eatTime = new Date(datetimeInput.value);
    const styleKey = styleSelect.value;
    const recipe = PIZZA_RECIPES[styleKey];
    if (!recipe) return;
    const sizeKeys = Object.keys(recipe.sizes);
    const defaultSize = recipe.defaultSize || (sizeKeys.includes("12") ? "12" : sizeKeys[0]);
    const doughBallWeight = recipe.sizes[defaultSize].doughWeight;
    const numPizzas = parseInt(countInput.value, 10);

    const result = buildScheduleBackward(
      eatTime, ovenSelect.value, selectedMethod,
      numPizzas, doughBallWeight, styleKey
    );

    if (!result.isValid) {
      validationEl.textContent = result.validationMsg;
      validationEl.classList.remove("hidden");
      return;
    }

    computedSchedule = result.steps;

    // Compute a human-friendly label for the method pill
    methodDisplayLabel =
      styleKey === "chicago-tavern" ? "Chicago Tavern \u2014 Cured Dough"
      : styleKey === "school-night" ? "No Rise"
      : selectedMethod.label;

    // Request notification permission (native or browser)
    PieNotifications.requestPermission();

    // Save to localStorage
    saveActiveSchedule({
      createdAt: new Date().toISOString(),
      styleKey,
      styleName: recipe.name,
      numPizzas,
      ovenType: ovenSelect.value,
      methodId: selectedMethod.id,
      methodLabel: selectedMethod.label,
      methodDisplayLabel,
      reminderMinutes: parseInt(reminderSelect.value, 10) || 0,
      eatTime: eatTime.toISOString(),
      doughBallWeight,
      steps: computedSchedule.map((s) => ({
        id: s.id,
        label: s.label,
        dateTime: s.dateTime.toISOString(),
        instruction: s.instruction,
        why: s.why,
        duration: s.duration || null,
        checked: s.checked || false,
      })),
    });

    // Update schedule badge in nav
    updateScheduleBadge();

    renderScheduleTimeline(computedSchedule);
    renderVisualBar(computedSchedule);
    goToStep(3);

    // Hide banner when viewing full schedule
    bannerEl.classList.add("hidden");
  });

  // ── Step 3 → Back to Step 2 ──
  btnBack3.addEventListener("click", () => {
    stopCountdown();
    goToStep(2);
  });

  // ── Start Over ──
  btnStartOver.addEventListener("click", () => {
    stopCountdown();
    notifiedSteps.clear();
    clearActiveSchedule();
    computedSchedule = null;
    selectedMethod = null;
    methodDisplayLabel = "";
    bannerEl.classList.add("hidden");
    updateScheduleBadge();
    goToStep(1);
  });

  // ── Timeline Rendering ──

  function renderScheduleTimeline(steps) {
    const now = new Date();

    // Find the "next" step: first unchecked step whose time is in the future
    let nextIdx = -1;
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].checked && steps[i].dateTime > now) {
        nextIdx = i;
        break;
      }
    }
    // If all future steps are checked, find the first unchecked step
    if (nextIdx === -1) {
      nextIdx = steps.findIndex((s) => !s.checked);
    }

    const styleName = PIZZA_RECIPES[styleSelect.value]?.name || "";

    let html = `
      <div class="schedule-header">
        <h4>${styleName} Schedule</h4>
        <span class="schedule-method-pill">${methodDisplayLabel || (selectedMethod ? selectedMethod.label : "")}</span>
      </div>
      <div class="schedule-steps">
    `;

    steps.forEach((step, i) => {
      const isPast = now >= step.dateTime;
      const isNext = i === nextIdx && !step.checked;
      let statusClass;
      if (step.checked) statusClass = "step-checked";
      else if (isNext) statusClass = "step-next";
      else if (isPast) statusClass = "step-done";
      else statusClass = "step-upcoming";

      const indentClass = step.subStep ? " sched-sub-step" : "";

      html += `
        <div class="sched-timeline-step ${statusClass}${indentClass}" data-step-idx="${i}">
          <div class="sched-step-marker">
            <button class="sched-step-dot" data-idx="${i}"
              aria-label="${step.checked ? "Unmark" : "Mark"} ${step.label} as done"
              title="Click to ${step.checked ? "unmark" : "mark as done"}">
              ${step.checked ? "\u2713" : (i + 1)}
            </button>
            ${i < steps.length - 1 ? '<span class="sched-step-line"></span>' : ""}
          </div>
          <div class="sched-step-content">
            <div class="sched-step-time">${formatScheduleTime(step.dateTime)}</div>
            <div class="sched-step-label">
              ${step.label}
              ${step.duration ? `<span class="step-duration-badge">${step.duration}</span>` : ""}
            </div>
            <div class="sched-step-instruction">${step.instruction}</div>
            <button class="step-why-toggle" type="button">Why it matters</button>
            <div class="step-why-content">${step.why}</div>
            ${isNext ? `<div class="sched-step-countdown" data-target="${step.dateTime.toISOString()}"></div>` : ""}
          </div>
        </div>
      `;
    });

    html += "</div>";
    timelineEl.innerHTML = html;

    // ── Attach event listeners ──

    // Checkoff buttons
    timelineEl.querySelectorAll(".sched-step-dot").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(btn.dataset.idx, 10);
        if (isNaN(idx) || !computedSchedule) return;
        computedSchedule[idx].checked = !computedSchedule[idx].checked;
        updateStoredChecks();
        renderScheduleTimeline(computedSchedule);
        renderVisualBar(computedSchedule);
      });
    });

    // "Why it matters" toggles
    timelineEl.querySelectorAll(".step-why-toggle").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        toggle.classList.toggle("open");
        const content = toggle.nextElementSibling;
        if (content) content.classList.toggle("open");
      });
    });

    // Start countdown
    startCountdown();
  }

  // ── Visual Overview Bar ────────────────────────────
  function renderVisualBar(steps) {
    if (!visualBarEl || !steps || steps.length < 2) {
      if (visualBarEl) visualBarEl.innerHTML = "";
      return;
    }

    const now = new Date();
    const startTime = steps[0].dateTime.getTime();
    const endTime = steps[steps.length - 1].dateTime.getTime();
    const totalSpan = endTime - startTime;
    if (totalSpan <= 0) { visualBarEl.innerHTML = ""; return; }

    // Compute raw widths as percentage of total span
    const rawWidths = steps.map((step, i) => {
      if (i === steps.length - 1) return 3; // last step gets minimum
      const next = steps[i + 1].dateTime.getTime();
      return ((next - step.dateTime.getTime()) / totalSpan) * 100;
    });

    // Cap at 40% max, redistribute excess proportionally among uncapped
    const CAP = 40;
    let excess = 0;
    let uncappedTotal = 0;
    const capped = rawWidths.map((w) => {
      if (w > CAP) { excess += w - CAP; return CAP; }
      uncappedTotal += w;
      return w;
    });
    const widths = capped.map((w) => {
      if (w < CAP && uncappedTotal > 0) return w + (w / uncappedTotal) * excess;
      return w;
    });

    // Build blocks
    let blocksHtml = "";
    steps.forEach((step, i) => {
      // Status class (mirrors timeline logic)
      let statusClass = "step-upcoming";
      if (step.checked) {
        statusClass = "step-checked";
      } else {
        const stepTime = step.dateTime.getTime();
        if (stepTime <= now.getTime()) {
          // Find if this is the "next" unchecked step
          const firstUncheckedPast = steps.findIndex(
            (s) => !s.checked && s.dateTime.getTime() <= now.getTime()
          );
          statusClass = firstUncheckedPast === i ? "step-next" : "step-done";
        }
      }

      const shortTime = step.dateTime.toLocaleTimeString(undefined, {
        hour: "numeric", minute: "2-digit",
      });
      // Show short date on visual bar for multi-day bakes
      const shortDate = step.dateTime.toLocaleDateString(undefined, {
        weekday: "short", month: "short", day: "numeric",
      });
      const shortLabel = step.label.length > 14 ? step.label.slice(0, 13) + "\u2026" : step.label;

      blocksHtml += `<div class="bar-block ${statusClass}" style="flex:${widths[i].toFixed(2)};" data-step-idx="${i}">
        <span class="bar-block-label">${shortLabel}</span>
        <span class="bar-block-time">${shortDate} ${shortTime}</span>
      </div>`;
    });

    visualBarEl.innerHTML = `<div class="visual-bar-track">${blocksHtml}</div>`;

    // Click handlers — scroll to timeline step
    visualBarEl.querySelectorAll(".bar-block").forEach((block) => {
      block.addEventListener("click", () => {
        const idx = block.dataset.stepIdx;
        const target = timelineEl.querySelector(`.sched-timeline-step[data-step-idx="${idx}"]`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  function formatScheduleTime(date) {
    const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
    const monthDay = date.toLocaleDateString(undefined, { month: "long", day: "numeric" });
    const time = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${weekday} \u2014 ${monthDay} \u2014 ${time}`;
  }

  // ── Countdown Timer ──

  function startCountdown() {
    stopCountdown();
    scheduleAllNotifications();
    countdownInterval = setInterval(() => {
      const el = timelineEl.querySelector(".sched-step-countdown");
      if (!el) {
        stopCountdown();
        return;
      }
      updateSchedCountdown(el);
    }, 1000);
    // Immediate update
    const el = timelineEl.querySelector(".sched-step-countdown");
    if (el) updateSchedCountdown(el);
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
    stopStepAlarm();
    clearAllStepTimeouts();
  }

  function updateSchedCountdown(el) {
    const target = new Date(el.dataset.target);
    const now = new Date();
    const diff = target - now;

    if (diff <= 0) {
      el.textContent = "\u23F0 Now!";
      el.classList.add("countdown-now");
      // Fire alarm + alert once per step
      if (!el.dataset.advanced) {
        el.dataset.advanced = "1";
        const stepIdx = el.closest(".sched-timeline-step")?.dataset.stepIdx;
        const stepLabel = computedSchedule && stepIdx != null
          ? computedSchedule[stepIdx].label
          : "This step";
        startStepAlarm();
        showStepAlert(stepLabel);
        // Re-render to advance countdown to the next upcoming step
        setTimeout(() => {
          if (computedSchedule) {
            renderScheduleTimeline(computedSchedule);
            renderVisualBar(computedSchedule);
          }
        }, 1500);
      }
      return;
    }

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    let text = "\u23F3 ";
    if (days > 0) text += `${days}d ${hours}h ${minutes}m`;
    else if (hours > 0) text += `${hours}h ${minutes}m ${seconds}s`;
    else if (minutes > 0) text += `${minutes}m ${seconds}s`;
    else text += `${seconds}s`;

    el.textContent = text;
  }

  // ── Step Notification Scheduling ──
  // Sets a setTimeout for every future unchecked step so each one
  // fires a browser notification when its time arrives.

  function scheduleAllNotifications() {
    clearAllStepTimeouts();
    if (!computedSchedule) return;

    const now = Date.now();
    const saved = loadActiveSchedule();
    const reminderMs = ((saved && saved.reminderMinutes) || 0) * 60000;

    computedSchedule.forEach((step, idx) => {
      const key = step.id + "_" + step.dateTime.getTime();
      if (step.checked || notifiedSteps.has(key)) return;

      // Notification fires (reminderMinutes) before the actual step time
      const fireAt = step.dateTime.getTime() - reminderMs;
      const delay = fireAt - now;
      if (delay <= 0) return;

      // Use PieNotifications abstraction (native or browser fallback)
      const notifTitle = reminderMs > 0
        ? `The Pie Lab \u2014 In ${Math.round(reminderMs / 60000)} min:`
        : "The Pie Lab \u2014 Time\u2019s Up!";
      const notifBody = reminderMs > 0
        ? `Get ready to: ${step.label}`
        : `It\u2019s time to: ${step.label}`;

      PieNotifications.schedule({
        id: idx + 1,
        title: notifTitle,
        body: notifBody,
        at: new Date(fireAt),
      });

      // Also keep a browser-side timeout for alarm + re-rendering
      const stepLabel = step.label;
      const tid = setTimeout(() => {
        if (notifiedSteps.has(key)) return;
        notifiedSteps.add(key);
        startStepAlarm();
        showStepAlert(stepLabel);
        if (computedSchedule) {
          renderScheduleTimeline(computedSchedule);
          renderVisualBar(computedSchedule);
        }
      }, delay);

      stepTimeouts.push(tid);
    });
  }

  function clearAllStepTimeouts() {
    stepTimeouts.forEach((tid) => clearTimeout(tid));
    stepTimeouts = [];
    PieNotifications.cancelAll();
  }

  // ── localStorage Persistence ──

  function saveActiveSchedule(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      if (e.name === "QuotaExceededError") {
        alert("Storage is full. Your schedule may not persist across page reloads.");
      }
    }
  }

  function loadActiveSchedule() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Parse ISO date strings back to Date objects in steps
      if (data.steps) {
        data.steps.forEach((s) => {
          s.dateTime = new Date(s.dateTime);
        });
      }
      data.eatTime = new Date(data.eatTime);
      return data;
    } catch {
      return null;
    }
  }

  function clearActiveSchedule() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function updateStoredChecks() {
    const stored = loadActiveSchedule();
    if (!stored || !computedSchedule) return;
    stored.steps.forEach((s, i) => {
      if (computedSchedule[i]) {
        s.checked = computedSchedule[i].checked;
      }
    });
    // Re-serialize dates
    stored.steps.forEach((s) => {
      if (s.dateTime instanceof Date) s.dateTime = s.dateTime.toISOString();
    });
    if (stored.eatTime instanceof Date) stored.eatTime = stored.eatTime.toISOString();
    saveActiveSchedule(stored);
  }

  // ── Active Schedule Banner ──

  function showBanner(data) {
    const bannerStyleName = document.getElementById("banner-style-name");
    const bannerNextStep = document.getElementById("banner-next-step");

    // If the display label is a style-specific override (differs from the raw
    // method label), show it standalone — it already carries context.  Otherwise
    // use the classic "Style Name — Method Label" format.
    const mLabel = data.methodDisplayLabel || data.methodLabel;
    const isOverride = data.methodDisplayLabel && data.methodDisplayLabel !== data.methodLabel;
    bannerStyleName.textContent = isOverride ? mLabel : `${data.styleName} \u2014 ${mLabel}`;

    // Find next unchecked step
    const now = new Date();
    const nextStep = data.steps.find((s) => !s.checked && s.dateTime > now);
    if (nextStep) {
      const time = nextStep.dateTime.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const dateStr = nextStep.dateTime.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      bannerNextStep.textContent = `Next: ${nextStep.label} \u2014 ${dateStr} at ${time}`;
    } else {
      const unchecked = data.steps.find((s) => !s.checked);
      if (unchecked) {
        bannerNextStep.textContent = `Next: ${unchecked.label}`;
      } else {
        bannerNextStep.textContent = "All steps complete!";
      }
    }

    bannerEl.classList.remove("hidden");
  }

  btnBannerView.addEventListener("click", () => {
    const data = loadActiveSchedule();
    if (!data) return;
    restoreSchedule(data);
  });

  btnBannerClear.addEventListener("click", () => {
    stopCountdown();
    notifiedSteps.clear();
    clearActiveSchedule();
    computedSchedule = null;
    selectedMethod = null;
    methodDisplayLabel = "";
    bannerEl.classList.add("hidden");
    updateScheduleBadge();
    goToStep(1);
  });

  // ── Restore Schedule from Storage ──

  function restoreSchedule(data) {
    // Set form values
    styleSelect.value = data.styleKey;
    countInput.value = data.numPizzas;
    ovenSelect.value = data.ovenType;
    // Set datetime
    const eatDate = data.eatTime instanceof Date ? data.eatTime : new Date(data.eatTime);
    const off = eatDate.getTimezoneOffset() * 60000;
    datetimeInput.value = new Date(eatDate.getTime() - off).toISOString().slice(0, 16);

    // Restore reminder preference
    if (data.reminderMinutes != null) {
      reminderSelect.value = String(data.reminderMinutes);
    }

    // Set method
    selectedMethod = FERMENT_METHODS[data.methodId] || FERMENT_METHODS["same-day"];
    methodDisplayLabel = data.methodDisplayLabel || selectedMethod.label;

    // Restore steps with Date objects
    computedSchedule = data.steps.map((s) => ({
      ...s,
      dateTime: s.dateTime instanceof Date ? s.dateTime : new Date(s.dateTime),
    }));

    bannerEl.classList.add("hidden");
    renderScheduleTimeline(computedSchedule);
    renderVisualBar(computedSchedule);
    goToStep(3);
  }

  // ── Save as Image ──

  btnSaveImg.addEventListener("click", () => {
    if (typeof html2canvas === "undefined") {
      alert("Image export is loading. Please try again in a moment.");
      return;
    }
    const target = timelineEl;
    // Temporarily add a background for the capture
    const origBg = target.style.background;
    target.style.background = "#faf6f1";
    target.style.padding = "1.5rem";

    html2canvas(target, {
      backgroundColor: "#faf6f1",
      scale: 2,
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      target.style.background = origBg;
      target.style.padding = "";
      const link = document.createElement("a");
      link.download = `pie-lab-schedule-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch((err) => {
      target.style.background = origBg;
      target.style.padding = "";
      console.error("Screenshot failed:", err);
      alert("Could not generate image. Try again.");
    });
  });

  // ── On-Load: Check for Active Schedule ──

  const saved = loadActiveSchedule();
  if (saved && saved.steps && saved.steps.length > 0) {
    showBanner(saved);
  }

  // ── On-Load: Plan My Bake Prefill ──

  (function checkPrefill() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("prefill")) return;

    const raw = localStorage.getItem("pielab-plan-prefill");
    if (!raw) return;

    let prefill;
    try { prefill = JSON.parse(raw); } catch { return; }
    localStorage.removeItem("pielab-plan-prefill");

    // Strip ?prefill=1 from URL without reload
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", cleanUrl);

    // Read oven type from user profile, default "home"
    const profile = (typeof PieLabProfile !== "undefined") ? PieLabProfile.getProfile() : {};
    const ovenType = profile.preferredOven || "home";

    // If no eat time or method provided, pre-fill wizard Step 1 and let user choose
    if (!prefill.eatTime || !prefill.fermentMethodKey) {
      if (prefill.styleKey && styleSelect.querySelector(`option[value="${prefill.styleKey}"]`)) {
        styleSelect.value = prefill.styleKey;
      }
      if (prefill.quantity) countInput.value = prefill.quantity;
      checkStep1Ready();
      goToStep(1);
      return;
    }

    // Validate eat time is in the future
    const eatTime = new Date(prefill.eatTime);
    const now = new Date();

    if (eatTime <= now) {
      // Eat time in the past — show message and fall back to wizard with pre-filled values
      showPrefillBanner(
        "Your planned eat time has passed.",
        "Set a new time"
      );
      // Pre-fill wizard step 1 fields
      if (prefill.styleKey && styleSelect.querySelector(`option[value="${prefill.styleKey}"]`)) {
        styleSelect.value = prefill.styleKey;
      }
      if (prefill.quantity) countInput.value = prefill.quantity;
      checkStep1Ready();
      goToStep(1);
      return;
    }

    // Get doughBallWeight from calcResult
    const doughBallWeight = prefill.calcResult
      ? prefill.calcResult.doughBallWeight
      : null;

    if (!doughBallWeight || !prefill.fermentMethodKey || !prefill.styleKey) return;

    const method = FERMENT_METHODS[prefill.fermentMethodKey];
    if (!method) return;

    const numPizzas = prefill.quantity || 1;

    // Build the schedule
    const result = buildScheduleBackward(
      eatTime, ovenType, method, numPizzas, doughBallWeight, prefill.styleKey
    );

    if (!result.isValid) {
      // Invalid schedule — show wizard with pre-filled values
      showPrefillBanner(
        result.validationMsg || "Could not build schedule.",
        "Start over"
      );
      if (prefill.styleKey && styleSelect.querySelector(`option[value="${prefill.styleKey}"]`)) {
        styleSelect.value = prefill.styleKey;
      }
      if (prefill.quantity) countInput.value = prefill.quantity;
      checkStep1Ready();
      goToStep(1);
      return;
    }

    // Set scheduler state so timeline rendering works
    const recipe = PIZZA_RECIPES[prefill.styleKey];
    styleSelect.value = prefill.styleKey;
    countInput.value = numPizzas;
    ovenSelect.value = ovenType;
    const off = eatTime.getTimezoneOffset() * 60000;
    datetimeInput.value = new Date(eatTime.getTime() - off).toISOString().slice(0, 16);
    selectedMethod = method;
    computedSchedule = result.steps;

    methodDisplayLabel =
      prefill.styleKey === "chicago-tavern" ? "Chicago Tavern \u2014 Cured Dough"
      : prefill.styleKey === "school-night" ? "No Rise"
      : method.label;

    // Request notification permission
    PieNotifications.requestPermission();

    // Save to localStorage as active schedule
    saveActiveSchedule({
      createdAt: new Date().toISOString(),
      styleKey: prefill.styleKey,
      styleName: recipe ? recipe.name : prefill.styleKey,
      numPizzas,
      ovenType,
      methodId: method.id,
      methodLabel: method.label,
      methodDisplayLabel,
      reminderMinutes: parseInt(reminderSelect.value, 10) || 0,
      eatTime: eatTime.toISOString(),
      doughBallWeight,
      steps: computedSchedule.map((s) => ({
        id: s.id,
        label: s.label,
        dateTime: s.dateTime.toISOString(),
        instruction: s.instruction,
        why: s.why,
        duration: s.duration || null,
        checked: s.checked || false,
      })),
    });

    updateScheduleBadge();

    // Hide the existing active-schedule banner
    bannerEl.classList.add("hidden");
    // Hide the wizard progress bar
    progressEl.classList.add("hidden");

    // Show prefill info banner
    showPrefillBanner(
      "Schedule built from your Make calculation.",
      "Start over"
    );

    renderScheduleTimeline(computedSchedule);
    renderVisualBar(computedSchedule);
    goToStep(3);
  })();

  // ── Prefill Banner Helper ──

  function showPrefillBanner(message, linkText) {
    // Remove existing prefill banner if any
    const existing = document.getElementById("prefill-banner");
    if (existing) existing.remove();

    const banner = document.createElement("div");
    banner.className = "prefill-banner";
    banner.id = "prefill-banner";
    banner.innerHTML = `
      <span>${message}</span>
      <button type="button" class="link-btn" id="restart-wizard-btn">${linkText}</button>
    `;

    // Insert at top of scheduler section
    const scheduler = document.getElementById("dough-scheduler");
    const firstChild = scheduler.querySelector("h2");
    if (firstChild && firstChild.nextSibling) {
      scheduler.insertBefore(banner, firstChild.nextSibling);
    } else {
      scheduler.prepend(banner);
    }

    // "Start over" / "Set a new time" click handler
    document.getElementById("restart-wizard-btn").addEventListener("click", () => {
      banner.remove();
      stopCountdown();
      notifiedSteps.clear();
      clearActiveSchedule();
      computedSchedule = null;
      selectedMethod = null;
      methodDisplayLabel = "";
      bannerEl.classList.add("hidden");
      progressEl.classList.remove("hidden");
      updateScheduleBadge();
      goToStep(1);
    });
  }

})();
