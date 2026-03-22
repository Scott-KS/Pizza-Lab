/* ══════════════════════════════════════════════════════
   The Pie Lab — My Kitchen
   Page: kitchen.html
   ══════════════════════════════════════════════════════ */
import { PieLabStorage } from './storage.js';
import { populateOvenSelect, populateStyleSelect, escapeHtml, showToast } from './nav.js';
import { PieLabProfile } from './user-profile.js';
import { PieLabPremium } from './premium.js';
import { PieLabPhotos } from './photo-store.js';

document.addEventListener('DOMContentLoaded', () => {
  // ── Welcome banner for new users ───────────────────
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('welcome')) {
    const banner = document.getElementById('welcome-banner');
    if (banner) {
      banner.classList.remove('hidden');
      if (urlParams.get('onboarding') === '1') {
        banner.innerHTML =
          "<p>👨‍🍳 <strong>Almost there!</strong> Fill out your kitchen profile below and hit <em>Save My Kitchen</em>. Then we'll guide you through your first bake.</p>";
      }
    }
  }

  // ── DOM refs ─────────────────────────────────────────
  const nameInput = document.getElementById('k-display-name');
  const cityInput = document.getElementById('k-city');
  const cityStatus = document.getElementById('k-city-status');
  const ovenSelect = document.getElementById('k-oven');
  const humidityGrp = document.getElementById('k-humidity');
  const styleSelect = document.getElementById('k-style');
  const saveBtn = document.getElementById('k-save');
  const saveConfirm = document.getElementById('k-save-confirm');

  // ── Populate selects, then load profile values ───────
  populateOvenSelect(ovenSelect);
  populateStyleSelect(styleSelect, { placeholder: 'Select a style\u2026' });

  const profile = PieLabProfile.getProfile();

  // ── Profile-incomplete prompt ──────────────────────
  if (!urlParams.has('welcome') && (!profile.displayName || !profile.displayName.trim())) {
    const promptEl = document.createElement('div');
    promptEl.className = 'profile-prompt';
    promptEl.innerHTML =
      '<p>Finish your Kitchen Profile to get personalized recommendations \u2192</p>' +
      '<button type="button" class="profile-prompt-close" aria-label="Dismiss">&times;</button>';
    const section = document.querySelector('.kitchen-fieldset');
    if (section) section.parentNode.insertBefore(promptEl, section);
    promptEl
      .querySelector('.profile-prompt-close')
      ?.addEventListener('click', () => promptEl.remove());
  }

  nameInput.value = profile.displayName || '';
  cityInput.value = profile.city || '';
  ovenSelect.value = profile.preferredOven || ovenSelect.options[0]?.value || '';
  styleSelect.value = profile.favoriteStyle || '';

  // ── Humidity toggle ──────────────────────────────────
  let selectedHumidity = profile.humidity || 'normal';

  humidityGrp.querySelectorAll('.toggle-btn').forEach((btn) => {
    const isActive = btn.dataset.value === selectedHumidity;
    btn.classList.toggle('selected', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  humidityGrp.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;

    humidityGrp.querySelectorAll('.toggle-btn').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    selectedHumidity = btn.dataset.value;
  });

  // ── Oven Calibration offset ─────────────────────────
  const ovenOffsetInput = document.getElementById('k-oven-offset');
  const ovenDirGrp = document.getElementById('k-oven-direction');
  let ovenDirection = (profile.ovenTempOffset || 0) >= 0 ? 'hot' : 'cold';

  if (ovenOffsetInput) {
    ovenOffsetInput.value = Math.abs(profile.ovenTempOffset || 0);
    ovenDirGrp.querySelectorAll('.toggle-btn').forEach((btn) => {
      const isActive = btn.dataset.value === (profile.ovenTempOffset > 0 ? 'hot' : 'cold');
      btn.classList.toggle('selected', isActive);
    });
    ovenDirGrp.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;
      ovenDirGrp.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      ovenDirection = btn.dataset.value;
    });
  }

  // ── Measurement System toggle ──────────────────────
  const unitsGrp = document.getElementById('k-units');
  let selectedUnits = profile.unitSystem || 'standard';

  unitsGrp.querySelectorAll('.toggle-btn').forEach((btn) => {
    const isActive = btn.dataset.value === selectedUnits;
    btn.classList.toggle('selected', isActive);
    btn.setAttribute('aria-pressed', isActive);
  });

  unitsGrp.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-btn');
    if (!btn) return;

    unitsGrp.querySelectorAll('.toggle-btn').forEach((b) => {
      b.classList.remove('selected');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-pressed', 'true');
    selectedUnits = btn.dataset.value;
  });

  // ── Skill Level toggle ────────────────────────────
  const skillGrp = document.getElementById('k-skill-level');
  let selectedSkillLevel = profile.skillLevel ?? 1;

  if (skillGrp) {
    skillGrp.querySelectorAll('.toggle-btn').forEach((btn) => {
      const isActive = btn.dataset.value === String(selectedSkillLevel);
      btn.classList.toggle('selected', isActive);
      btn.setAttribute('aria-pressed', isActive);
    });

    skillGrp.addEventListener('click', (e) => {
      const btn = e.target.closest('.toggle-btn');
      if (!btn) return;

      skillGrp.querySelectorAll('.toggle-btn').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      selectedSkillLevel = parseInt(btn.dataset.value, 10);
    });
  }

  // ── Notifications toggle ────────────────────────────
  if (profile.notifications) {
    document.querySelectorAll('#k-notifications .toggle-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.value === profile.notifications);
    });
  }

  document.querySelectorAll('#k-notifications .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      document
        .querySelectorAll('#k-notifications .toggle-btn')
        .forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const val = btn.dataset.value;
      if (val === 'on') {
        // Request permission if not already granted
        try {
          const { PieLabNotifications } = await import('./pie-notifications.js');
          await PieLabNotifications.requestPermission();
        } catch {
          /* ignore on web */
        }
        document.getElementById('notif-permission-hint').classList.add('hidden');
      }
    });
  });

  // Check current notification permission status
  (async () => {
    try {
      const { PieLabNotifications } = await import('./pie-notifications.js');
      const status = await PieLabNotifications.checkPermission?.();
      if (status === 'denied') {
        // Notifications blocked — force toggle to off and disable it
        document
          .querySelectorAll('#k-notifications .toggle-btn')
          .forEach((b) => b.classList.remove('selected'));
        document.querySelector('#k-notifications [data-value="off"]')?.classList.add('selected');
        document.getElementById('notif-permission-hint').textContent =
          'Notifications are blocked. Enable them in your device settings.';
        document.getElementById('notif-permission-hint').classList.remove('hidden');
      }
    } catch {
      /* web — ignore */
    }
  })();

  // ── Onboarding flow: Enter key advances to next field ──
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      cityInput.focus();
      cityInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  // ── Location autocomplete & elevation ────────────────
  const suggestList = document.getElementById('k-city-suggestions');
  let storedCity = profile.city || '';
  let resolvedElevation = profile.elevation ?? null;
  let searchTimer = null;
  let cityResolved = false;
  let activeIndex = -1;

  // US state abbreviation map
  const US_STATES = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
    'District of Columbia': 'DC',
  };

  // Show saved elevation on load
  if (storedCity && resolvedElevation != null) {
    cityStatus.textContent = `\uD83D\uDCCD ${storedCity} \u2014 ${resolvedElevation.toLocaleString()} ft`;
    cityStatus.className = 'city-status resolved';
  }

  function closeSuggestions() {
    suggestList.classList.add('hidden');
    suggestList.innerHTML = '';
    cityInput.classList.remove('ac-open');
    activeIndex = -1;
  }

  function formatPlace(place) {
    const region = place.admin1 || '';
    const abbr = US_STATES[region];
    if (place.country_code?.toUpperCase() === 'US' && abbr) {
      return { display: `${place.name}, ${abbr}`, detail: '' };
    }
    const parts = [place.name];
    if (region) parts.push(region);
    if (place.country && place.country !== 'United States') parts.push(place.country);
    return { display: parts.join(', '), detail: '' };
  }

  async function resolveElevationForPlace(place) {
    const lat = place.latitude;
    const lng = place.longitude;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.elevation || data.elevation.length === 0) return null;
      return Math.round((data.elevation[0] * 3.28084) / 10) * 10;
    } catch {
      return null;
    }
  }

  function selectPlace(place) {
    const { display } = formatPlace(place);
    cityInput.value = display;
    closeSuggestions();
    // Skip auto-scroll when kitchen guide is walking through fields
    if (!kitchenGuideActive) {
      setTimeout(() => {
        ovenSelect.focus();
        ovenSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }

    cityStatus.textContent = 'Resolving elevation\u2026';
    cityStatus.className = 'city-status resolving';

    resolveElevationForPlace(place).then((feet) => {
      if (feet != null) {
        resolvedElevation = feet;
        cityResolved = true;
        cityStatus.textContent = `\uD83D\uDCCD ${display} \u2014 ${feet.toLocaleString()} ft`;
        cityStatus.className = 'city-status resolved';
      } else {
        cityStatus.textContent = 'Could not resolve elevation';
        cityStatus.className = 'city-status error';
      }
    });
  }

  function renderSuggestions(results) {
    suggestList.innerHTML = '';
    activeIndex = -1;

    if (!results.length) {
      closeSuggestions();
      return;
    }

    results.forEach((place) => {
      const li = document.createElement('li');
      const { display: _display } = formatPlace(place);
      const region = place.admin1 || '';
      const abbr = US_STATES[region];
      const isUS = place.country_code?.toUpperCase() === 'US' && abbr;

      li.innerHTML = isUS
        ? `<span class="ac-city">${escapeHtml(place.name)}</span>, <span class="ac-region">${escapeHtml(abbr)}</span>`
        : `<span class="ac-city">${escapeHtml(place.name)}</span>${region ? `, <span class="ac-region">${escapeHtml(region)}</span>` : ''}${place.country && place.country !== 'United States' ? `, <span class="ac-region">${escapeHtml(place.country)}</span>` : ''}`;

      li.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur from firing first
        selectPlace(place);
      });
      suggestList.appendChild(li);
    });

    suggestList.classList.remove('hidden');
    cityInput.classList.add('ac-open');
  }

  cityInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = cityInput.value.trim();

    cityResolved = false;
    resolvedElevation = null;

    if (q.length < 2) {
      closeSuggestions();
      if (!q) {
        cityStatus.textContent = '';
        cityStatus.className = 'city-status';
      }
      return;
    }

    searchTimer = setTimeout(async () => {
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        renderSuggestions(data.results || []);
      } catch {
        /* network error — ignore */
      }
    }, 300);
  });

  // Keyboard navigation in dropdown
  cityInput.addEventListener('keydown', (e) => {
    const items = suggestList.querySelectorAll('li');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      items[activeIndex].dispatchEvent(new window.MouseEvent('mousedown'));
      return;
    } else if (e.key === 'Escape') {
      closeSuggestions();
      return;
    } else {
      return;
    }

    items.forEach((li, i) => li.classList.toggle('active', i === activeIndex));
  });

  cityInput.addEventListener('blur', () => {
    // Short delay to let mousedown on suggestion fire first
    setTimeout(() => closeSuggestions(), 150);
  });

  // ── Save ─────────────────────────────────────────────
  saveBtn.addEventListener('click', () => {
    const currentCity = cityInput.value.trim();

    // Determine elevation to save:
    // - If city was resolved this session, use that elevation
    // - If city didn't change from stored, keep stored elevation
    // - If city changed but resolution failed/pending, save null
    let elevation;
    if (cityResolved) {
      elevation = resolvedElevation;
    } else if (currentCity === storedCity) {
      elevation = profile.elevation ?? null;
    } else {
      elevation = null;
    }

    const rawOffset = parseInt(ovenOffsetInput?.value, 10) || 0;
    const ovenTempOffset = ovenDirection === 'hot' ? rawOffset : -rawOffset;

    const updates = {
      displayName: nameInput.value.trim(),
      city: currentCity,
      elevation: elevation,
      humidity: selectedHumidity,
      preferredOven: ovenSelect.value,
      ovenTempOffset,
      favoriteStyle: styleSelect.value,
      unitSystem: selectedUnits,
      skillLevel: selectedSkillLevel,
      notifications:
        document.querySelector('#k-notifications .toggle-btn.selected')?.dataset.value ?? 'on',
    };

    PieLabProfile.saveProfile(updates);
    if (window.PieLabHaptics) PieLabHaptics.success();

    // Start Pro trial on first profile save (14-day trial)
    if (updates.displayName) {
      PieLabPremium.startTrial();
    }

    // Update stored city so subsequent edits compare to latest save
    storedCity = currentCity;

    // "You're All Set" modal — show once on first profile completion
    const onboardingDone = PieLabStorage.get('pielab-onboarding-complete');
    if (!onboardingDone && updates.displayName) {
      PieLabStorage.set('pielab-onboarding-complete', true);
      showAllSetModal();
      return;
    }

    // If this is part of onboarding, redirect to first bake guide
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === '1' && updates.displayName) {
      window.location.href = 'calculator.html?firstbake=1';
      return;
    }

    // Show confirmation with fade-out
    saveConfirm.classList.remove('hidden');
    saveConfirm.classList.remove('fade-out');

    setTimeout(() => {
      saveConfirm.classList.add('fade-out');
      saveConfirm.addEventListener('transitionend', () => saveConfirm.classList.add('hidden'), {
        once: true,
      });
    }, 2500);
  });

  // ── Restore Purchase ─────────────────────────────────
  const restoreBtn = document.getElementById('btn-restore-purchase');
  const restoreStatus = document.getElementById('restore-status');
  const restoreRow = document.getElementById('restore-purchase-row');

  // Only show if user is not already Pro
  if (restoreRow) {
    if (PieLabPremium.isPro()) {
      restoreRow.classList.add('hidden');
    }
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', async () => {
      restoreBtn.disabled = true;
      restoreBtn.textContent = 'Restoring\u2026';

      const restored = await PieLabPremium.restorePurchases();

      if (restored) {
        restoreStatus.textContent = 'Pro access restored!';
        restoreStatus.classList.remove('hidden');
        restoreBtn.textContent = 'Restored';
        if (window.PieLabHaptics) PieLabHaptics.success();
      } else {
        restoreStatus.textContent = 'No previous purchase found.';
        restoreStatus.classList.remove('hidden');
        restoreBtn.textContent = 'Restore Purchase';
        restoreBtn.disabled = false;
      }

      setTimeout(() => {
        restoreStatus.classList.add('fade-out');
        restoreStatus.addEventListener(
          'transitionend',
          () => {
            restoreStatus.classList.add('hidden');
            restoreStatus.classList.remove('fade-out');
          },
          { once: true }
        );
      }, 3000);
    });
  }

  // ── Apply saved theme preference ──────────────────────
  function applyTheme(val) {
    if (val === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else if (val === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      // system
      const prefersDark = matchMedia('(prefers-color-scheme:dark)').matches;
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    }
  }
  const savedTheme = localStorage.getItem('pielab-theme') || 'system';
  applyTheme(savedTheme);
  // Reflect saved theme in toggle UI
  document.querySelectorAll('#k-theme .toggle-btn').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.value === savedTheme);
  });
  // Toggle handler
  document.querySelectorAll('#k-theme .toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('#k-theme .toggle-btn')
        .forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      const val = btn.dataset.value;
      if (val === 'system') {
        localStorage.removeItem('pielab-theme');
      } else {
        localStorage.setItem('pielab-theme', val);
      }
      applyTheme(val);
    });
  });

  // ── Data Export / Import ──────────────────────────
  const BACKUP_KEYS = [
    'pielab-journal',
    'pielab-personal-settings',
    'pielab-user-profile',
    'pielab-style-levels',
  ];

  document.getElementById('btn-export').addEventListener('click', async () => {
    const backup = { _version: 2, _exportedAt: new Date().toISOString() };
    BACKUP_KEYS.forEach((key) => {
      const raw = PieLabStorage.get(key);
      try {
        backup[key] = raw ? JSON.parse(raw) : null;
      } catch {
        backup[key] = raw;
      }
    });

    // Include IndexedDB photos in backup
    try {
      backup._photos = await PieLabPhotos.getAllPhotos();
    } catch {
      /* ignore */
    }

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const sizeMB = (blob.size / (1024 * 1024)).toFixed(1);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = 'pielab-backup-' + dateStr + '.json';

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    const status = document.getElementById('export-status');
    status.textContent = 'Exported ' + filename + ' (' + sizeMB + ' MB)';
    status.classList.remove('hidden');
  });

  document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        const hasValidKey = BACKUP_KEYS.some((key) => key in data);
        if (!hasValidKey) {
          alert('This file doesn\u2019t appear to be a valid Pie Lab backup.');
          return;
        }
        const journalCount = Array.isArray(data['pielab-journal'])
          ? data['pielab-journal'].length
          : 0;
        const msg =
          'This will replace your current data with:\n' +
          '- ' +
          journalCount +
          ' journal entries\n' +
          '- Kitchen settings & profile\n\n' +
          'Your current data will be overwritten. Continue?';
        if (!confirm(msg)) return;

        BACKUP_KEYS.forEach((key) => {
          if (data[key] != null) {
            PieLabStorage.set(key, data[key]);
          }
        });

        // Restore IndexedDB photos if present in backup
        if (data._photos) {
          PieLabPhotos.importPhotos(data._photos)
            .catch(() => {})
            .finally(() => window.location.reload());
        } else {
          window.location.reload();
        }
      } catch {
        alert('Could not read backup file. Make sure it\u2019s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  // ── Feedback Form (submits to Google Forms) ──────
  const FEEDBACK_URL =
    'https://docs.google.com/forms/d/e/1FAIpQLScJNRfJizp54U1iMz6ExKLMMArGfaNDR-OkXYyr0FX5HSHiqg/formResponse';
  const fbType = document.getElementById('fb-type');
  const fbMessage = document.getElementById('fb-message');
  const fbEmail = document.getElementById('fb-email');
  const fbSend = document.getElementById('btn-send-feedback');
  const fbStatus = document.getElementById('feedback-status');

  fbSend.addEventListener('click', async () => {
    const message = fbMessage.value.trim();
    if (!message) {
      fbMessage.focus();
      fbMessage.classList.add('input-error');
      setTimeout(() => fbMessage.classList.remove('input-error'), 1500);
      return;
    }

    const type = fbType.value;
    const labels = { bug: 'Bug Report', feature: 'Feature Request', general: 'General Feedback' };
    const label = labels[type] || 'Feedback';

    // Gather context automatically
    const profile = PieLabProfile.getProfile();
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    const theme = document.documentElement.dataset.theme || 'light';

    // Google Forms field IDs
    const formData = new URLSearchParams({
      'entry.1415359353': label,
      'entry.575932940': message,
      'entry.456796556': fbEmail ? fbEmail.value.trim() : '',
      'entry.452605385': profile.displayName || '',
      'entry.630348213': profile.city || '',
      'entry.804412391': profile.units || 'imperial',
      'entry.1854651755': theme,
      'entry.1921840507': screenSize,
      'entry.1311401632': /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
    });

    // Disable button while submitting
    fbSend.disabled = true;
    fbSend.textContent = 'Sending\u2026';

    try {
      await fetch(FEEDBACK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
    } catch {
      // Google Forms returns opaque response with no-cors — submission still succeeds
    }

    // Clear form and show confirmation
    fbMessage.value = '';
    if (fbEmail) fbEmail.value = '';
    fbSend.disabled = false;
    fbSend.textContent = 'Send Feedback';
    showToast('Feedback sent \u2014 thank you!');

    fbStatus.textContent = 'Thanks! We read every message.';
    fbStatus.classList.remove('hidden');
    fbStatus.classList.remove('fade-out');

    setTimeout(() => {
      fbStatus.classList.add('fade-out');
      fbStatus.addEventListener('transitionend', () => fbStatus.classList.add('hidden'), {
        once: true,
      });
    }, 5000);
  });

  // ── Delete All Data (two-step confirmation) ─────────
  const deleteBtn = document.getElementById('k-delete-data');
  const deleteModal = document.getElementById('delete-data-modal');
  const deleteStep1 = document.getElementById('delete-step-1');
  const deleteStep2 = document.getElementById('delete-step-2');
  const deleteConfirm = document.getElementById('delete-confirm');

  function resetDeleteModal() {
    deleteModal.classList.add('hidden');
    if (deleteStep1) deleteStep1.classList.remove('hidden');
    if (deleteStep2) deleteStep2.classList.add('hidden');
  }

  if (deleteBtn && deleteModal) {
    deleteBtn.addEventListener('click', () => {
      resetDeleteModal();
      deleteModal.classList.remove('hidden');
    });

    // Step 1 → Step 2
    const stepNext = document.getElementById('delete-step-next');
    if (stepNext)
      stepNext.addEventListener('click', () => {
        deleteStep1.classList.add('hidden');
        deleteStep2.classList.remove('hidden');
      });

    // Cancel buttons
    const deleteCancel = document.getElementById('delete-cancel');
    if (deleteCancel) deleteCancel.addEventListener('click', resetDeleteModal);

    const deleteCancel2 = document.getElementById('delete-cancel-2');
    if (deleteCancel2)
      deleteCancel2.addEventListener('click', () => {
        deleteStep2.classList.add('hidden');
        deleteStep1.classList.remove('hidden');
      });

    const deleteClose = document.getElementById('delete-modal-close');
    if (deleteClose) deleteClose.addEventListener('click', resetDeleteModal);

    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) resetDeleteModal();
    });

    // Step 2: confirmed — delete everything
    if (deleteConfirm)
      deleteConfirm.addEventListener('click', () => {
        if (window.PieLabHaptics) PieLabHaptics.warning();
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('pielab'));
        keys.forEach((k) => localStorage.removeItem(k));
        // Also clear Preferences (native persistent storage)
        PieLabStorage.removeAll().catch(() => {});
        // Clear IndexedDB photo storage (does not affect camera roll)
        PieLabPhotos.deleteAll()
          .catch(() => {})
          .finally(() => {
            window.location.href = 'index.html';
          });
      });
  }

  // ── Kitchen Profile Guide (onboarding only) ────────────
  // Walks new users through each field, explaining why it matters.

  const kitchenGuideSteps = [
    {
      title: 'What Should We Call You?',
      body: 'Your display name shows up on shared bake cards and your journal. It\u2019s how your pizza friends will know you.',
      target: '#k-display-name',
    },
    {
      title: 'Where\u2019s Your Kitchen?',
      body: 'Your city tells us your elevation. Dough behaves differently at 5,000 ft vs sea level \u2014 we adjust yeast and hydration automatically.',
      target: '#k-city',
    },
    {
      title: 'What Oven Do You Use?',
      body: 'Your oven type prefills every bake with the right temps and cook times. Home oven, Ooni, Roccbox \u2014 we\u2019ve got you covered.',
      target: '#k-oven',
    },
    {
      title: 'How Humid Is It?',
      body: 'Humidity affects how much water your flour absorbs. If you\u2019re in a dry or humid climate, we\u2019ll fine-tune hydration for you.',
      target: '#k-humidity',
    },
    {
      title: 'Pick Your Go-To Style',
      body: 'Your favorite style prepopulates the calculator so you can jump straight to baking. You can always switch styles later.',
      target: '#k-style',
    },
    {
      title: 'How Do You Measure?',
      body: 'Standard uses ounces and \u00B0F. Metric uses grams and \u00B0C. Measure in grams but cook in \u00B0F? Choose Hybrid.',
      target: '#k-units',
    },
    {
      title: 'You\u2019re All Set!',
      body: 'Fill in your details above and hit Save My Kitchen. We\u2019ll use these settings to personalize every recipe.',
      target: '#k-save',
      nextLabel: 'Got It!',
    },
  ];

  function shouldShowKitchenGuide() {
    return urlParams.get('onboarding') === '1';
  }

  let kitchenGuideActive = false;

  function startKitchenGuide() {
    kitchenGuideActive = true;
    let kgStep = 0;
    let _kgCleanup = null;

    const kgOverlay = document.createElement('div');
    kgOverlay.className = 'firstbake-overlay';
    kgOverlay.innerHTML = `
      <div class="firstbake-card">
        <button class="firstbake-skip" id="kg-skip" aria-label="Close guide">Skip</button>
        <div class="firstbake-step-count" id="kg-step-count"></div>
        <h3 class="firstbake-title" id="kg-title"></h3>
        <p class="firstbake-body" id="kg-body"></p>
        <div class="firstbake-actions">
          <button class="firstbake-btn firstbake-btn--back hidden" id="kg-back">Back</button>
          <button class="firstbake-btn firstbake-btn--next" id="kg-next">Next</button>
        </div>
      </div>
    `;

    // Move card to body level so it escapes overlay's stacking context
    const kgCardEl = kgOverlay.querySelector('.firstbake-card');
    document.body.appendChild(kgCardEl);

    const kgHighlight = document.createElement('div');
    kgHighlight.className = 'firstbake-highlight hidden';
    document.body.appendChild(kgHighlight);
    document.body.appendChild(kgOverlay);

    function renderStep() {
      const step = kitchenGuideSteps[kgStep];
      const total = kitchenGuideSteps.length;

      document.getElementById('kg-step-count').textContent = `Step ${kgStep + 1} of ${total}`;
      document.getElementById('kg-title').textContent = step.title;
      document.getElementById('kg-body').textContent = step.body;

      const backBtn = document.getElementById('kg-back');
      backBtn.classList.toggle('hidden', kgStep === 0);

      const nextBtn = document.getElementById('kg-next');
      nextBtn.textContent = step.nextLabel || (kgStep === total - 1 ? 'Done' : 'Next');

      kgHighlight.classList.add('hidden');
      if (step.target) {
        setTimeout(() => {
          const el = document.querySelector(step.target);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
              const rect = el.getBoundingClientRect();
              const pad = 6;
              kgHighlight.style.top = rect.top + window.scrollY - pad + 'px';
              kgHighlight.style.left = rect.left - pad + 'px';
              kgHighlight.style.width = rect.width + pad * 2 + 'px';
              kgHighlight.style.height = rect.height + pad * 2 + 'px';
              kgHighlight.classList.remove('hidden');
            }, 350);
          }
        }, 50);
      }
    }

    function close() {
      kitchenGuideActive = false;
      kgHighlight.remove();
      kgCardEl.remove();
      kgOverlay.classList.remove('firstbake-overlay--visible');
      setTimeout(() => kgOverlay.remove(), 300);
    }

    document.getElementById('kg-next').addEventListener('click', () => {
      if (kgStep < kitchenGuideSteps.length - 1) {
        kgStep++;
        renderStep();
      } else {
        close();
      }
    });

    document.getElementById('kg-back').addEventListener('click', () => {
      if (kgStep > 0) {
        kgStep--;
        renderStep();
      }
    });

    document.getElementById('kg-skip').addEventListener('click', close);

    requestAnimationFrame(() => kgOverlay.classList.add('firstbake-overlay--visible'));
    renderStep();
  }

  if (shouldShowKitchenGuide()) {
    setTimeout(() => startKitchenGuide(), 600);
  }

  // Display app version
  const versionEl = document.getElementById('app-version');
  if (versionEl) {
    // On native (Capacitor), App plugin can return the real build version.
    // On web, fall back to the hardcoded string.
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const info = await App.getInfo();
        versionEl.textContent = `v${info.version} (${info.build})`;
      } catch {
        versionEl.textContent = 'v1.0.0';
      }
    })();
  }

  // ── "You're All Set" Modal ─────────────────────────
  function showAllSetModal() {
    const days = PieLabPremium.daysLeft();
    const trialLine =
      days > 0
        ? `<p class="allset-trial">Your 14-day Pro trial is active \u2014 ${days} day${days !== 1 ? 's' : ''} remaining</p>`
        : '';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'allset-modal';
    overlay.innerHTML = `<div class="modal-content allset-modal">
      <h2>Your kitchen is ready</h2>
      <div class="allset-features">
        <div class="allset-feature"><span class="allset-icon">\uD83E\uDDEE</span><span>Calculate recipes \u2014 exact weights for any style</span></div>
        <div class="allset-feature"><span class="allset-icon">\uD83D\uDCC5</span><span>Schedule your ferment \u2014 step-by-step timing</span></div>
        <div class="allset-feature"><span class="allset-icon">\uD83D\uDCD3</span><span>Log your bakes \u2014 track your progress</span></div>
      </div>
      ${trialLine}
      <a href="calculator.html" class="btn-primary allset-cta">Calculate My First Recipe</a>
    </div>`;
    document.body.appendChild(overlay);
  }
});
