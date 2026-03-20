/* ══════════════════════════════════════════════════════
   The Pie Lab — Scheduler First-Time Guide
   Loaded on: schedule.html
   Step-by-step walkthrough for first-time scheduler users.
   Reuses the firstbake overlay/highlight CSS classes.
   ══════════════════════════════════════════════════════ */

import { PieLabStorage } from './storage.js';

const PieLabSchedulerGuide = (() => {
  const STORAGE_KEY = 'pielab-scheduler-guide-shown';

  function isShown() {
    return localStorage.getItem(STORAGE_KEY) === '1';
  }

  function markShown() {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  const steps = [
    {
      title: 'Plan Your Bake',
      body: 'The Dough Scheduler works backward from when you want to eat. We\u2019ll build a step-by-step timeline so you know exactly when to start each part of the process.',
      target: null,
      nextLabel: 'Show Me',
    },
    {
      title: 'Pick Your Style',
      body: 'Start by choosing the pizza style you want to make. Different styles use different fermentation methods and timelines.',
      target: '#sched-style',
      waitFor: { selector: '#sched-style', event: 'change' },
    },
    {
      title: 'How Many Pizzas?',
      body: 'Set the number of pizzas you\u2019re making. This helps us calculate dough quantities for your schedule.',
      target: '#sched-count',
    },
    {
      title: 'When Do You Want to Eat?',
      body: 'Pick your target dinner time. We\u2019ll calculate backward from here to tell you exactly when to start mixing, fermenting, and preheating.',
      target: '#sched-datetime',
    },
    {
      title: 'Choose Your Oven',
      body: 'Your oven type affects preheat time. If you\u2019ve set a preferred oven in My Kitchen, it\u2019s already selected.',
      target: '#sched-oven',
    },
    {
      title: 'Set Your Reminders',
      body: 'Choose how far in advance you want to be reminded before each step. We\u2019ll send you a notification so you never miss a step.',
      target: '#sched-reminder',
    },
    {
      title: 'Hit Next to Continue',
      body: 'Once everything looks good, tap Next to see your fermentation method and build your full schedule. Happy baking!',
      target: '#btn-sched-next-1',
      nextLabel: 'Got It!',
    },
  ];

  let overlay = null;
  let cardEl = null;
  let highlightEl = null;
  let currentStep = 0;
  let activeCleanup = null;

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'firstbake-overlay';
    overlay.innerHTML = `
      <div class="firstbake-card">
        <button class="firstbake-skip" id="sg-skip" aria-label="Close guide">Skip</button>
        <div class="firstbake-step-count" id="sg-step-count"></div>
        <h3 class="firstbake-title" id="sg-title"></h3>
        <p class="firstbake-body" id="sg-body"></p>
        <div class="firstbake-actions">
          <button class="firstbake-btn firstbake-btn--back hidden" id="sg-back">Back</button>
          <button class="firstbake-btn firstbake-btn--next" id="sg-next">Next</button>
        </div>
      </div>
    `;

    // Move card to body level so it escapes overlay's stacking context
    cardEl = overlay.querySelector('.firstbake-card');
    document.body.appendChild(cardEl);

    highlightEl = document.createElement('div');
    highlightEl.className = 'firstbake-highlight hidden';
    document.body.appendChild(highlightEl);
    document.body.appendChild(overlay);

    document.getElementById('sg-next').addEventListener('click', nextStep);
    document.getElementById('sg-back').addEventListener('click', prevStep);
    document.getElementById('sg-skip').addEventListener('click', close);
    document.addEventListener('keydown', handleKey);

    requestAnimationFrame(() => overlay.classList.add('firstbake-overlay--visible'));
    renderStep();
  }

  function handleKey(e) {
    if (!overlay) return;
    if (e.key === 'Escape') close();
  }

  function renderStep() {
    cleanupWaitFor();

    const step = steps[currentStep];
    const total = steps.length;

    document.getElementById('sg-step-count').textContent = `Step ${currentStep + 1} of ${total}`;
    document.getElementById('sg-title').textContent = step.title;
    document.getElementById('sg-body').textContent = step.body;

    const backBtn = document.getElementById('sg-back');
    backBtn.classList.toggle('hidden', currentStep === 0);

    const nextBtn = document.getElementById('sg-next');
    const isLast = currentStep === total - 1;
    nextBtn.textContent = step.nextLabel || (isLast ? 'Done' : 'Next');

    clearHighlight();
    if (step.target) {
      setTimeout(() => {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => positionHighlight(el), 350);
        }
      }, step.delay || 50);
    }

    if (step.waitFor) {
      const { selector, event } = step.waitFor;
      const el = document.querySelector(selector);
      if (el) {
        const stepWhenRegistered = currentStep;
        const handler = () => {
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
    highlightEl.style.top = rect.top + window.scrollY - pad + 'px';
    highlightEl.style.left = rect.left - pad + 'px';
    highlightEl.style.width = rect.width + pad * 2 + 'px';
    highlightEl.style.height = rect.height + pad * 2 + 'px';
    highlightEl.classList.remove('hidden');
  }

  function clearHighlight() {
    if (highlightEl) highlightEl.classList.add('hidden');
  }

  function nextStep() {
    if (currentStep < steps.length - 1) {
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
    markShown();
    document.removeEventListener('keydown', handleKey);
    clearHighlight();
    if (highlightEl) {
      highlightEl.remove();
      highlightEl = null;
    }
    if (cardEl) {
      cardEl.remove();
      cardEl = null;
    }
    if (overlay) {
      overlay.classList.remove('firstbake-overlay--visible');
      setTimeout(() => {
        if (overlay) {
          overlay.remove();
          overlay = null;
        }
      }, 300);
    }
  }

  function shouldShow() {
    if (isShown()) return false;
    // Don't show if arriving via prefill (auto-built schedule)
    const params = new URLSearchParams(window.location.search);
    if (params.has('prefill')) return false;
    // Don't show if user already has an active schedule
    try {
      if (PieLabStorage.get('pielab-active-schedule')) return false;
    } catch {
      /* ignore */
    }
    return true;
  }

  function start() {
    if (overlay) return;
    currentStep = 0;
    createOverlay();
  }

  return { shouldShow, start };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (PieLabSchedulerGuide.shouldShow()) {
    setTimeout(() => PieLabSchedulerGuide.start(), 600);
  }
});
