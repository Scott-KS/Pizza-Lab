/* ══════════════════════════════════════════════════════
   The Pie Lab — First Bake Beginner Guide
   Loaded on: calculator.html
   Interactive step-by-step guide that lets users interact
   with the form while popups guide each step.
   ══════════════════════════════════════════════════════ */

const PieLabFirstBake = (() => {
  const STORAGE_KEY = "pielab-first-bake-shown";
  const SECOND_BAKE_KEY = "pielab-second-bake-guide-shown";
  const JOURNAL_GUIDE_KEY = "pielab-journal-guide-pending";

  // ── Storage helpers ──────────────────────────────────

  function isFirstBakeShown() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function markFirstBakeShown() {
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function isSecondBakeShown() {
    return localStorage.getItem(SECOND_BAKE_KEY) === "1";
  }

  function markSecondBakeShown() {
    localStorage.setItem(SECOND_BAKE_KEY, "1");
  }

  // ── First Bake Guide Steps ──────────────────────────
  // Each step can define:
  //   waitFor: { selector, event } — auto-advance when user interacts (Next always visible as fallback)
  //   nextLabel: custom text for the Next button

  const firstBakeSteps = [
    {
      title: "Let\u2019s Make Your First Pizza!",
      body: "We\u2019ll walk you through a simple beginner-friendly bake step by step. You\u2019ll fill in each field as we go \u2014 don\u2019t worry, we\u2019ll keep it easy.",
      target: null,
      nextLabel: "Let\u2019s Go",
    },
    {
      title: "Pick a Style",
      body: "Start by choosing a pizza style. We recommend New York \u2014 it\u2019s forgiving, uses common ingredients, and bakes in a regular home oven.",
      target: "#pizza-type",
      waitFor: { selector: "#pizza-type", event: "change" },
    },
    {
      title: "Choose Your Size",
      body: "Now pick a pizza size and how many you want to make. For your first time, 2 pizzas is a great starting point \u2014 enough to share or save leftovers.",
      target: "#pizza-size",
      waitFor: { selector: "#pizza-size", event: "change" },
    },
    {
      title: "Hit Calculate!",
      body: "Everything\u2019s set. Tap the Calculate Recipe button to see your exact ingredient amounts.",
      target: ".btn-calculate",
      waitFor: { selector: ".btn-calculate", event: "click" },
    },
    {
      title: "Your Recipe",
      body: "Here are your ingredients \u2014 dough, sauce, and toppings, all measured precisely. Scroll through and take note of what you need.",
      target: "#dough-section",
      delay: 600,
    },
    {
      title: "Baking Tips",
      body: "Below the recipe you\u2019ll find step-by-step instructions and tips. Use the skill slider to toggle between Beginner, Intermediate, and Pro guidance.",
      target: "#tips-level-control",
    },
    {
      title: "Start Your Bake Timer",
      body: "When your pizza goes in the oven, tap this button to start the timer. It pulls the bake time from your recipe automatically. Once running, use the \u221230s and +30s buttons to adjust on the fly.",
      target: "#btn-start-timer",
    },
    {
      title: "Log Your Bake",
      body: "When you\u2019re done baking, come back here and hit this button. It\u2019ll save your bake to your journal so you can track your progress and share it.",
      target: "#btn-log-bake",
      nextLabel: "Got It \u2014 Let\u2019s Bake!",
      beforeShow: () => {
        // Close the bake timer modal if it was opened by the user
        const timerOverlay = document.getElementById("timer-overlay");
        if (timerOverlay && !timerOverlay.classList.contains("hidden")) {
          const cancelBtn = document.getElementById("timer-cancel");
          if (cancelBtn) cancelBtn.click();
        }
      },
    },
  ];

  // ── Second Bake Guide Steps ─────────────────────────

  const secondBakeSteps = [
    {
      title: "Welcome Back, Baker!",
      body: "Nice work on your first bake! This time, let\u2019s explore a powerful feature \u2014 My Style \u2014 that lets you customize your dough recipe.",
      target: null,
    },
    {
      title: "The My Style Toggle",
      body: "See the Recommended / My Style toggle above the form? Flip it to My Style to unlock custom dough settings for any pizza style.",
      target: ".settings-toggle-row",
      waitFor: { selector: "#settings-mode-toggle", event: "change" },
    },
    {
      title: "Your Custom Settings",
      body: "Now you can tweak hydration, salt, oil, sugar, yeast, and dough ball weight. These settings are saved per style \u2014 experiment and find what you love.",
      target: "#custom-settings-editor",
      delay: 300,
    },
    {
      title: "Save Your Dough Recipe",
      body: "Love your custom settings? Tap Save Dough to name and save this recipe. It\u2019ll appear in your Dough Library so you can load it anytime.",
      target: "#btn-save-profile",
    },
    {
      title: "Make It Yours",
      body: "Every time you calculate with My Style active, your custom percentages are used instead of the defaults. Hit Reset to go back to the original recipe anytime.",
      target: "#btn-reset-custom",
    },
    {
      title: "Fermentation Tuning",
      body: "Want to dial in your ferment? Switch to Plan My Bake mode to unlock fermentation controls \u2014 set your yeast type, ferment time, and temperature, and we\u2019ll adjust yeast amounts automatically.",
      target: ".settings-toggle-row",
    },
    {
      title: "Keep Exploring",
      body: "Try different styles, dial in your preferences, and log each bake. Over time you\u2019ll build a journal of your pizza journey. Happy baking!",
      target: ".calculator-card h2",
      nextLabel: "Let\u2019s Go!",
    },
  ];

  // ── Guide Engine ────────────────────────────────────

  let overlay = null;
  let cardEl = null;
  let highlightEl = null;
  let currentStep = 0;
  let activeSteps = [];
  let activeCleanup = null; // cleanup function for current waitFor listener

  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "firstbake-overlay";
    overlay.innerHTML = `
      <div class="firstbake-card">
        <button class="firstbake-skip" id="firstbake-skip" aria-label="Close guide">Skip</button>
        <div class="firstbake-step-count" id="firstbake-step-count"></div>
        <h3 class="firstbake-title" id="firstbake-title"></h3>
        <p class="firstbake-body" id="firstbake-body"></p>
        <div class="firstbake-actions">
          <button class="firstbake-btn firstbake-btn--back hidden" id="firstbake-back">Back</button>
          <button class="firstbake-btn firstbake-btn--next" id="firstbake-next">Next</button>
        </div>
      </div>
    `;

    // Move card to body level so it escapes overlay's stacking context
    // (overlay z-index traps children — highlight would always render above card)
    cardEl = overlay.querySelector(".firstbake-card");
    document.body.appendChild(cardEl);

    highlightEl = document.createElement("div");
    highlightEl.className = "firstbake-highlight hidden";
    document.body.appendChild(highlightEl);
    document.body.appendChild(overlay);

    document.getElementById("firstbake-next").addEventListener("click", nextStep);
    document.getElementById("firstbake-back").addEventListener("click", prevStep);
    document.getElementById("firstbake-skip").addEventListener("click", close);
    document.addEventListener("keydown", handleKey);

    requestAnimationFrame(() => {
      overlay.classList.add("firstbake-overlay--visible");
      cardEl.classList.add("firstbake-card--visible");
    });
    renderStep();
  }

  function handleKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") close();
  }

  function renderStep() {
    cleanupWaitFor();

    const step = activeSteps[currentStep];
    const total = activeSteps.length;

    document.getElementById("firstbake-step-count").textContent =
      `Step ${currentStep + 1} of ${total}`;
    document.getElementById("firstbake-title").textContent = step.title;
    document.getElementById("firstbake-body").textContent = step.body;

    // Back button visibility
    const backBtn = document.getElementById("firstbake-back");
    backBtn.classList.toggle("hidden", currentStep === 0);

    // Next button text
    const nextBtn = document.getElementById("firstbake-next");
    const isLast = currentStep === total - 1;
    nextBtn.classList.remove("hidden");
    nextBtn.textContent = step.nextLabel || (isLast ? "Done" : "Next");

    // Run any pre-step setup
    if (step.beforeShow) step.beforeShow();

    // Highlight target element
    clearHighlight();
    if (step.target) {
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => positionHighlight(el), 350);
        }
      }, step.delay || 50);
    }

    // Set up waitFor listener (auto-advance on user interaction)
    if (step.waitFor) {
      const { selector, event } = step.waitFor;
      const el = document.querySelector(selector);
      if (el) {
        const stepWhenRegistered = currentStep;
        const handler = () => {
          // Only auto-advance if still on the same step (prevents double-advance
          // if user clicks Next while the waitFor delay is pending)
          setTimeout(() => {
            if (currentStep === stepWhenRegistered) nextStep();
          }, 400);
        };
        el.addEventListener(event, handler, { once: true });
        activeCleanup = () => el.removeEventListener(event, handler);
      }
    }
  }

  function cleanupWaitFor() {
    if (activeCleanup) {
      activeCleanup();
      activeCleanup = null;
    }
  }

  function positionHighlight(el) {
    if (!highlightEl || !el) return;
    const rect = el.getBoundingClientRect();
    const pad = 6;
    highlightEl.style.top = (rect.top + window.scrollY - pad) + "px";
    highlightEl.style.left = (rect.left - pad) + "px";
    highlightEl.style.width = (rect.width + pad * 2) + "px";
    highlightEl.style.height = (rect.height + pad * 2) + "px";
    highlightEl.classList.remove("hidden");
  }

  function clearHighlight() {
    if (highlightEl) highlightEl.classList.add("hidden");
  }

  function nextStep() {
    if (currentStep < activeSteps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      close();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function close() {
    cleanupWaitFor();
    // Mark the appropriate guide as shown
    if (activeSteps === firstBakeSteps) {
      markFirstBakeShown();
      // Flag journal guide for next visit to journal
      localStorage.setItem(JOURNAL_GUIDE_KEY, "1");
    } else if (activeSteps === secondBakeSteps) {
      markSecondBakeShown();
    }

    document.removeEventListener("keydown", handleKey);
    clearHighlight();
    if (highlightEl) { highlightEl.remove(); highlightEl = null; }
    if (cardEl) { cardEl.remove(); cardEl = null; }
    if (overlay) {
      overlay.classList.remove("firstbake-overlay--visible");
      setTimeout(() => {
        if (overlay) { overlay.remove(); overlay = null; }
      }, 300);
    }
  }

  // ── Public API ──────────────────────────────────────

  function shouldShowFirstBake() {
    const params = new URLSearchParams(window.location.search);
    return params.get("firstbake") === "1" && !isFirstBakeShown();
  }

  function shouldShowSecondBake() {
    if (isSecondBakeShown() || !isFirstBakeShown()) return false;
    // Show on second visit (user has exactly 1 bake logged)
    if (typeof PieLabJournal === "undefined") return false;
    try {
      const entries = PieLabJournal.getAllEntries();
      return entries && entries.length === 1;
    } catch { return false; }
  }

  function startFirstBake() {
    if (overlay) return;
    activeSteps = firstBakeSteps;
    currentStep = 0;
    createOverlay();
  }

  function startSecondBake() {
    if (overlay) return;
    activeSteps = secondBakeSteps;
    currentStep = 0;
    createOverlay();
  }

  return {
    shouldShowFirstBake,
    shouldShowSecondBake,
    startFirstBake,
    startSecondBake,
    // Legacy compat
    shouldShow: shouldShowFirstBake,
    start: startFirstBake,
    JOURNAL_GUIDE_KEY,
  };
})();

// Auto-start the appropriate guide
document.addEventListener("DOMContentLoaded", () => {
  if (PieLabFirstBake.shouldShowFirstBake()) {
    setTimeout(() => PieLabFirstBake.startFirstBake(), 600);
  } else if (PieLabFirstBake.shouldShowSecondBake()) {
    setTimeout(() => PieLabFirstBake.startSecondBake(), 600);
  }
});
