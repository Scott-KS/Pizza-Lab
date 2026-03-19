# Implementation Plan — Onboarding & Guide Improvements

## A. My Kitchen Profile Guide (new)
**File: `js/kitchen.js`**

Add a step-by-step guided walkthrough when the user arrives at kitchen.html during onboarding (`?onboarding=1`). Instead of just showing a banner, highlight each form field one at a time with an explanation of *why* we're asking:

| Step | Field Highlighted | Popup Text |
|------|-------------------|------------|
| 1 | Display Name | "First, tell us your name. This shows up on your shared bake cards and journal entries." |
| 2 | City / Location | "Your city helps us look up your elevation. Higher altitude affects how dough rises, so we'll adjust yeast and hydration automatically." |
| 3 | Oven Type | "What oven do you bake in? We'll prefill this in your bake log so you don't have to pick it every time." |
| 4 | Favorite Style | "Pick your go-to pizza style. We'll preselect it in the recipe calculator so you can get started faster." |
| 5 | Measurement System | "Choose how you measure. Standard uses oz and °F. Metric uses grams and °C. Measure in grams but cook in °F? Choose Hybrid." |
| 6 | Save Button | "All set! Hit Save My Kitchen to lock in your profile and start your 7-day free trial of all Pro features." |

**Mechanics:**
- Reuse the existing `firstbake-overlay` / `firstbake-card` / `firstbake-highlight` CSS classes (same visual style as all other guides).
- Each step scrolls to the target field and highlights it.
- Steps 1–5 auto-advance when the user interacts with that field (fills name, selects city, picks oven, etc.) but also have a Next button as fallback.
- Step 6 (Save) waits for form submission, then the existing redirect to `calculator.html?firstbake=1` fires.
- Gated by `?onboarding=1` query param — only runs during the initial onboarding flow, not on return visits.

**Calculator prepopulation (already works):**
The calculator already reads profile data on load (favorite style, oven type, unit system, elevation). After the kitchen guide saves, the redirect to `calculator.html?firstbake=1` picks up the saved profile. No changes needed on the calculator side.

---

## B. First Bake Guide — New "Start Bake Timer" Step
**File: `js/first-bake.js`**

Insert a new step between current Step 6 ("Baking Tips") and Step 7 ("Log Your Bake"), making it a new Step 7 in an 8-step guide:

| Step | Title | Target | Body |
|------|-------|--------|------|
| 7 (new) | "Start Your Bake Timer" | `#btn-start-timer` | "When your pizza goes in the oven, tap Start Bake Timer. A countdown overlay will appear — use the −30s and +30s buttons to adjust time on the fly. You'll get a notification when it's done." |

**Two-part highlight behavior:**
1. First: highlight the "Start Bake Timer" button. Auto-advances when user clicks it (or via Next).
2. After advancing: briefly highlight the timer overlay's `#timer-running-controls` (the −30s / Pause / +30s buttons) for ~2 seconds to show the adjustment controls, then continue to the final "Log Your Bake" step (now Step 8).

**Implementation:**
- Add the new step object to `firstBakeSteps` array at index 6.
- `waitFor: { selector: "#btn-start-timer", event: "click" }` — auto-advances when user starts the timer.

---

## C. Journal "Log This Bake" Guide — Step-by-Step Form Walkthrough
**File: `js/journal-ui.js`**

Replace the current 3-step journal guide with a detailed 8-step walkthrough that highlights each form field individually:

| Step | Title | Target | Body | Auto-advance |
|------|-------|--------|------|--------------|
| 1 | "Name Your Bake" | `#j-bake-name` | "Give your bake a name — something fun like 'Sunday Margherita' or 'Garage Neapolitan'. This is optional but makes it easy to find later." | On input/blur |
| 2 | "Verify Your Style" | `#j-style` | "We've prefilled the style from your recipe. Double-check it's correct, or change it if you switched things up." | On change |
| 3 | "Set the Date" | `#j-date` | "Today's date is filled in automatically. Change it if you're logging a bake from a different day." | Next only |
| 4 | "Bake Details" | temp/time/oven grid | "Add your bake temp, bake time, and oven type. These help you track what works best for each style." | Next only |
| 5 | "Rate Your Bake" | `#j-star-rating` | "How did it turn out? Tap the stars to rate it. Over time your ratings help you see which recipes you've dialed in." | On click (star) |
| 6 | "Add Photos" | `#j-photo-add-btn` | "Snap a photo of your finished pizza, or add shots from earlier steps — shaping, stretching, the oven. Up to 4 photos per bake." | On change (file input) |
| 7 | "Save Your Bake" | `.btn-save-entry` | "Everything look good? Hit Save Entry to log this bake to your journal." | Wait for form submit |
| 8 | "Share It!" | `.journal-entry-card` | "Your bake is saved! Tap the card to see the full details, share it with friends, or save it to your camera roll." | Final step — "Got It!" button |

**CSS bug fix — date input width:**
The `#j-date` input overflows its grid cell because `input[type="date"]` has intrinsic browser sizing. Fix by adding `max-width: 100%; box-sizing: border-box;` to the date input in `style.css`.

---

## D. Submit My Bake — 3rd Bake Nudge Cleanup
**File: `js/journal-ui.js`**

Current issues:
1. Fires on every 3rd bake (3, 6, 9...) which may feel too aggressive.
2. No way for users to permanently dismiss it.

**Changes:**
- Reduce frequency: show on bake 3, then every 5th bake after that (3, 8, 13, 18...).
- Add a "Don't Ask Again" option alongside "Not Now". Store opt-out flag in `pielab-submit-nudge-optout`.
- Polish the card copy to feel more celebratory and less repetitive on subsequent appearances.
- Leave the `SUBMIT_FORM_URL` placeholder as-is — you'll supply the real URL yourself.

---

## File Change Summary

| File | Changes |
|------|---------|
| `js/kitchen.js` | Add 6-step profile guide during onboarding |
| `js/first-bake.js` | Insert new Step 7 "Start Bake Timer" (8 steps total) |
| `js/journal-ui.js` | Rewrite journal guide to 8-step form walkthrough; improve submit nudge frequency + add opt-out |
| `style.css` | Fix date input overflow in `.journal-form-grid` |
