import '../capacitor-init.js';
import '../carousel.js';
import { PieLabOnboarding } from '../onboarding.js';
import { PieLabStorage } from '../storage.js';

if ('serviceWorker' in navigator)
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

document.getElementById('btn-start').addEventListener('click', function (e) {
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
