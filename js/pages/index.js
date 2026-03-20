import '../capacitor-init.js';
import '../carousel.js';
import { PieLabOnboarding } from '../onboarding.js';
import { PieLabStorage } from '../storage.js';

if ('serviceWorker' in navigator)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

// Route new users to Kitchen Profile instead of calculator
const _btnStart = document.getElementById('btn-start');

const _onboardingDone = localStorage.getItem('pielab-onboarding-complete');
const _profileSaved = (() => {
  try {
    const p = JSON.parse(localStorage.getItem('pielab-user-profile') || '{}');
    return !!(p.displayName && p.displayName.trim());
  } catch {
    return false;
  }
})();

if (!_onboardingDone && !_profileSaved) {
  _btnStart.href = 'kitchen.html?welcome=1&onboarding=1';
}

_btnStart.addEventListener('click', function (e) {
  e.preventDefault();
  try {
    let profile = PieLabStorage.getJSON('pielab-user-profile');
    if (!profile) {
      try {
        const raw = localStorage.getItem('pielab-user-profile');
        profile = raw ? JSON.parse(raw) : null;
      } catch {
        /* ignore */
      }
    }
    const hasProfile = profile && profile.displayName && profile.displayName.trim() !== '';
    if (hasProfile) {
      window.location.href = 'calculator.html';
    } else if (PieLabOnboarding.shouldShow()) {
      PieLabOnboarding.start();
    } else {
      window.location.href = 'kitchen.html?welcome=1';
    }
  } catch {
    window.location.href = 'calculator.html';
  }
});
