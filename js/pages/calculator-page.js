import '../capacitor-init.js';
import '../nav.js';
import '../calculator.js';
import '../first-bake.js';
import { PieLabProfile } from '../user-profile.js';

// ── Sync skill level from profile to tips slider ──
document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('tips-level-slider');
  const badge = document.getElementById('tips-level-badge');
  if (!slider || !badge) return;

  const skill = PieLabProfile.getProfile().skillLevel ?? 1;
  slider.value = String(skill);
  const labels = ['Beginner', 'Intermediate', 'Pro'];
  badge.textContent = labels[skill] || 'Intermediate';
  slider.dispatchEvent(new Event('input', { bubbles: true }));
});
