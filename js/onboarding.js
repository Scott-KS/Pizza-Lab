/* ══════════════════════════════════════════════════════
   The Pie Lab — New User Onboarding Wizard
   Loaded on: index.html
   ══════════════════════════════════════════════════════ */

const PieLabOnboarding = (() => {
  const STORAGE_KEY = "pielab-onboarding-complete";

  function isComplete() {
    return localStorage.getItem(STORAGE_KEY) === "1";
  }

  function markComplete() {
    localStorage.setItem(STORAGE_KEY, "1");
  }

  function hasProfile() {
    try {
      const raw = localStorage.getItem("pielab-user-profile");
      const profile = raw ? JSON.parse(raw) : null;
      return profile && profile.displayName && profile.displayName.trim() !== "";
    } catch { return false; }
  }

  // ── Step content ──────────────────────────────────
  const steps = [
    {
      icon: "🍕",
      title: "Welcome to The Pie Lab",
      body: "Your personal pizza-making companion. Whether you're a total beginner or seasoned pizzaiolo, we'll guide you from raw ingredients to a perfect bake.",
      detail: "Let us give you a quick tour of the app before you get started.",
    },
    {
      icon: "🧮",
      title: "The Recipe Calculator",
      page: "Make",
      body: "Choose your pizza style, size, and how many you're making — we'll calculate precise ingredient amounts for dough, sauce, and toppings.",
      detail: "Supports 13 regional styles from Neapolitan to Detroit, with adjustments for your altitude and oven type.",
    },
    {
      icon: "📅",
      title: "The Dough Scheduler",
      page: "Schedule",
      body: "Tell us when you want to eat, and we'll build a step-by-step timeline working backward — from mixing your dough to pulling the pizza out of the oven.",
      detail: "Get reminders for each step so you never miss a stretch, fold, or preheat.",
    },
    {
      icon: "📓",
      title: "Your Bake Journal",
      page: "Journal",
      body: "Log every bake with photos, ratings, and tasting notes. Track what worked, what didn't, and watch your skills grow over time.",
      detail: "Earn skill badges for each style as you bake more — from First Bake all the way to Pizzaiolo.",
    },
    {
      icon: "📚",
      title: "The Learning Hub",
      page: "Learn",
      body: "Explore our style library, flour guide, cheese & sauce reference, fermentation charts, and troubleshooting tools.",
      detail: "Everything you need to understand the science and craft behind great pizza.",
    },
    {
      icon: "👨‍🍳",
      title: "Your Kitchen Profile",
      page: "My Kitchen",
      body: "Tell us about your oven, location, and preferences. We\u2019ll tailor every recipe to your specific setup.",
      detail: "We\u2019ll walk you through each setting and explain why it matters.",
    },
    {
      icon: "🚀",
      title: "Ready to Start?",
      body: "Let's set up your kitchen profile first, then we'll walk you through making your very first pizza.",
      detail: "It only takes a minute. You'll be baking in no time!",
    },
  ];

  let overlay = null;
  let currentStep = 0;

  // ── Build the modal DOM ───────────────────────────
  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "onboarding-overlay";
    overlay.innerHTML = `
      <div class="onboarding-card">
        <button class="onboarding-skip" id="onboarding-skip" aria-label="Skip tour">Skip Tour</button>
        <div class="onboarding-icon" id="onboarding-icon"></div>
        <div class="onboarding-page-badge hidden" id="onboarding-page-badge"></div>
        <h2 class="onboarding-title" id="onboarding-title"></h2>
        <p class="onboarding-body" id="onboarding-body"></p>
        <p class="onboarding-detail" id="onboarding-detail"></p>
        <div class="onboarding-dots" id="onboarding-dots"></div>
        <div class="onboarding-actions">
          <button class="onboarding-btn onboarding-btn--back hidden" id="onboarding-back">Back</button>
          <button class="onboarding-btn onboarding-btn--next" id="onboarding-next">Next</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Build dot indicators
    const dotsContainer = document.getElementById("onboarding-dots");
    steps.forEach((_, i) => {
      const dot = document.createElement("span");
      dot.className = "onboarding-dot" + (i === 0 ? " active" : "");
      dot.setAttribute("data-step", i);
      dotsContainer.appendChild(dot);
    });

    // Wire buttons
    document.getElementById("onboarding-next").addEventListener("click", nextStep);
    document.getElementById("onboarding-back").addEventListener("click", prevStep);
    document.getElementById("onboarding-skip").addEventListener("click", skipTour);

    // Close on overlay click (outside card)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) skipTour();
    });

    // Keyboard navigation
    document.addEventListener("keydown", handleKey);

    // Show with animation
    requestAnimationFrame(() => overlay.classList.add("onboarding-overlay--visible"));
    renderStep();
  }

  function handleKey(e) {
    if (!overlay) return;
    if (e.key === "Escape") skipTour();
    if (e.key === "ArrowRight" || e.key === "Enter") nextStep();
    if (e.key === "ArrowLeft") prevStep();
  }

  // ── Render current step ───────────────────────────
  function renderStep() {
    const step = steps[currentStep];
    const card = overlay.querySelector(".onboarding-card");

    document.getElementById("onboarding-icon").textContent = step.icon;
    document.getElementById("onboarding-title").textContent = step.title;
    document.getElementById("onboarding-body").textContent = step.body;
    document.getElementById("onboarding-detail").textContent = step.detail;

    // Page badge
    const badge = document.getElementById("onboarding-page-badge");
    if (step.page) {
      badge.textContent = step.page;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    // Dot indicators
    overlay.querySelectorAll(".onboarding-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === currentStep);
    });

    // Back button visibility
    const backBtn = document.getElementById("onboarding-back");
    if (currentStep === 0) {
      backBtn.classList.add("hidden");
    } else {
      backBtn.classList.remove("hidden");
    }

    // Next button text
    const nextBtn = document.getElementById("onboarding-next");
    if (currentStep === steps.length - 1) {
      nextBtn.textContent = "Set Up My Kitchen";
    } else {
      nextBtn.textContent = "Next";
    }

    // Animate content
    card.classList.remove("onboarding-card--enter");
    void card.offsetWidth; // reflow
    card.classList.add("onboarding-card--enter");
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      finishTour();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function skipTour() {
    markComplete();
    closeThenNavigate();
  }

  function finishTour() {
    markComplete();
    closeThenNavigate();
  }

  function closeThenNavigate() {
    document.removeEventListener("keydown", handleKey);
    overlay.classList.remove("onboarding-overlay--visible");
    setTimeout(() => {
      overlay.remove();
      overlay = null;
      window.location.href = "kitchen.html?welcome=1&onboarding=1";
    }, 300);
  }

  // ── Public API ────────────────────────────────────
  function shouldShow() {
    return !isComplete() && !hasProfile();
  }

  function start() {
    if (overlay) return;
    currentStep = 0;
    createOverlay();
  }

  return { shouldShow, start, isComplete, markComplete };
})();
