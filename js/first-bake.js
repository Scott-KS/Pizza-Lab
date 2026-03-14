/* ══════════════════════════════════════════════════════
   The Pie Lab — First Bake Beginner Guide
   Loaded on: calculator.html
   Shows a step-by-step overlay teaching new users
   how to make their first pizza.
   ══════════════════════════════════════════════════════ */

const PieLabFirstBake = (() => {
  const STORAGE_KEY = "pielab-first-bake-shown";

  function isShown() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function markShown() {
    localStorage.setItem(STORAGE_KEY, "1");
  }

  const guideSteps = [
    {
      title: "Let's Make Your First Pizza!",
      body: "We'll walk you through a simple beginner-friendly bake. Don't worry — we'll keep it easy and fun.",
      target: null,
      action: null,
    },
    {
      title: "Pick a Style",
      body: "For your first bake, we recommend New York Style. It's forgiving, uses common ingredients, and bakes in a regular home oven.",
      target: "#style-select",
      action: function () {
        const select = document.getElementById("style-select");
        if (select) {
          select.value = "new-york";
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      },
    },
    {
      title: "Choose Your Size",
      body: "A 14-inch pizza is the classic New York size — big, foldable slices. Let's make 2 pizzas so you have plenty to share (or save for later).",
      target: "#size-select",
      action: function () {
        const sizeSelect = document.getElementById("size-select");
        const countInput = document.getElementById("num-pizzas");
        if (sizeSelect) {
          sizeSelect.value = "14";
          sizeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
        if (countInput) {
          countInput.value = "2";
          countInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      },
    },
    {
      title: "Calculate Your Recipe",
      body: "Hit the Calculate Recipe button below. We'll figure out the exact amounts of flour, water, salt, yeast, and everything else you need.",
      target: "#btn-calculate",
      action: null,
    },
    {
      title: "Check Your Ingredients",
      body: "Scroll down to see your complete recipe — dough ingredients, sauce, and toppings. Everything is measured precisely for your pizza count.",
      target: null,
      action: function () {
        const btn = document.getElementById("btn-calculate");
        if (btn) btn.click();
      },
      delay: 400,
    },
    {
      title: "Read the Baking Tips",
      body: "Below the recipe you'll find step-by-step baking instructions and tips. The skill slider lets you toggle between Beginner, Intermediate, and Pro-level guidance.",
      target: "#tips-card",
      action: function () {
        const tips = document.getElementById("tips-card");
        if (tips) tips.scrollIntoView({ behavior: "smooth", block: "center" });
      },
    },
    {
      title: "You're All Set!",
      body: "When you finish baking, come back and hit \"Log This Bake\" to save it to your journal. Your first bake unlocks the trial and starts your pizza journey. Happy baking!",
      target: null,
      action: null,
    },
  ];

  let overlay = null;
  let currentStep = 0;
  let highlightEl = null;

  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "firstbake-overlay";
    overlay.innerHTML = `
      <div class="firstbake-card">
        <button class="firstbake-skip" id="firstbake-skip" aria-label="Close guide">Got it, thanks</button>
        <div class="firstbake-step-count" id="firstbake-step-count"></div>
        <h3 class="firstbake-title" id="firstbake-title"></h3>
        <p class="firstbake-body" id="firstbake-body"></p>
        <div class="firstbake-actions">
          <button class="firstbake-btn firstbake-btn--back hidden" id="firstbake-back">Back</button>
          <button class="firstbake-btn firstbake-btn--next" id="firstbake-next">Next</button>
        </div>
      </div>
    `;

    // Create highlight ring element
    highlightEl = document.createElement("div");
    highlightEl.className = "firstbake-highlight hidden";
    document.body.appendChild(highlightEl);
    document.body.appendChild(overlay);

    document.getElementById("firstbake-next").addEventListener("click", nextStep);
    document.getElementById("firstbake-back").addEventListener("click", prevStep);
    document.getElementById("firstbake-skip").addEventListener("click", close);

    document.addEventListener("keydown", handleKey);

    requestAnimationFrame(() => overlay.classList.add("firstbake-overlay--visible"));
    renderStep();
  }

  function handleKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
    if (e.key === "ArrowLeft") prevStep();
  }

  function renderStep() {
    const step = guideSteps[currentStep];

    document.getElementById("firstbake-step-count").textContent =
      `Step ${currentStep + 1} of ${guideSteps.length}`;
    document.getElementById("firstbake-title").textContent = step.title;
    document.getElementById("firstbake-body").textContent = step.body;

    // Back button
    const backBtn = document.getElementById("firstbake-back");
    if (currentStep === 0) {
      backBtn.classList.add("hidden");
    } else {
      backBtn.classList.remove("hidden");
    }

    // Next button text
    const nextBtn = document.getElementById("firstbake-next");
    if (currentStep === guideSteps.length - 1) {
      nextBtn.textContent = "Start Baking!";
    } else {
      nextBtn.textContent = "Next";
    }

    // Highlight target element
    clearHighlight();
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => positionHighlight(el), 300);
      }
    }

    // Run step action
    if (step.action) {
      if (step.delay) {
        setTimeout(() => step.action(), step.delay);
      } else {
        step.action();
      }
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
    if (currentStep < guideSteps.length - 1) {
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
    markShown();
    document.removeEventListener("keydown", handleKey);
    clearHighlight();
    if (highlightEl) { highlightEl.remove(); highlightEl = null; }
    overlay.classList.remove("firstbake-overlay--visible");
    setTimeout(() => {
      overlay.remove();
      overlay = null;
    }, 300);
  }

  function shouldShow() {
    const params = new URLSearchParams(window.location.search);
    return params.get("firstbake") === "1" && !isShown();
  }

  function start() {
    if (overlay) return;
    currentStep = 0;
    createOverlay();
  }

  return { shouldShow, start };
})();

// Auto-start if conditions met
document.addEventListener("DOMContentLoaded", () => {
  if (PieLabFirstBake.shouldShow()) {
    setTimeout(() => PieLabFirstBake.start(), 600);
  }
});
