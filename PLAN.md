# Implementation Plan — Onboarding & Guide Improvements

## A. My Kitchen Profile Guide (new)
**File: `js/kitchen.js`**

Add a step-by-step guided walkthrough when the user arrives at kitchen.html during onboarding (`?welcome=1&onboarding=1`). Instead of just showing a banner, we'll highlight each form field one at a time with an explanation of *why* we're asking:

| Step | Field Highlighted | Popup Text |
|------|-------------------|------------|
| 1 | Display Name | "First, tell us your name. This shows up on your shared bake cards and journal entries." |
| 2 | City / Location | "Your city helps us look up your elevation. Higher altitude affects how dough rises, so we'll adjust yeast and hydration automatically." |
| 3 | Oven Type | "What oven do you bake in? We'll prefill this in your bake log so you don't have to pick it every time." |
| 4 | Favorite Style | "Pick your go-to pizza style. We'll preselect it in the recipe calculator so you can get started faster." |
| 5 | Measurement System | "Choose how you measure. Standard uses oz and °F. Metric uses grams and °C. Measure in grams but cook in °F? Choose Hybrid." |
| 6 | Save Button | "All set! Hit Save My Kitchen to lock in your profile and start your 7-day free trial of all Pro features." |

**Mechanics:**
- Reuse the existing `firstbake-overlay` / `firstbake-card` / `firstbake-highlight` CSS classes (same look as all other guides).
- Each step scrolls to the target field and highlights it.
- Steps 1–5 auto-advance when the user interacts with that field (fills name, selects city, picks oven, etc.) but also have a Next button as fallback.
- Step 6 (Save) waits for form submission, then the existing redirect to `calculator.html?firstbake=1` fires.
- Gated by `?onboarding=1` — only runs during the initial onboarding flow, not on return visits.

**Calculator prepopulation (already works):**
The calculator already reads profile data on load (favorite style, oven type, unit system, elevation). After the kitchen guide saves, the redirect to `calculator.html?firstbake=1` will pick up the saved profile. No changes needed here — just confirming the flow is already wired.

---

## B. First Bake Guide — New "Start Bake Timer" Step
**File: `js/first-bake.js`**

Insert a new step between current Step 6 ("Baking Tips") and Step 7 ("Log Your Bake"), making it a new Step 7 in an 8-step guide:

| Step | Title | Target | Body |
|------|-------|--------|------|
| 7 (new) | "Start Your Bake Timer" | `#btn-start-timer` | "When your pizza goes in the oven, tap Start Bake Timer. A countdown overlay will appear — use the −30s and +30s buttons to adjust time on the fly. You'll get a notification when it's done." |

After the user clicks "Start Bake Timer" (or clicks Next), the highlight shifts to the timer overlay's `#timer-running-controls` (the ±30s buttons) for ~2 seconds to draw attention, then auto-advances to the final "Log Your Bake" step (now Step 8).

**Implementation:**
- Add the new step object to `firstBakeSteps` array at index 6.
- `waitFor: { selector: "#btn-start-timer", event: "click" }` — auto-advances when user starts the timer.
- After advancing from this step, briefly highlight `#timer-running-controls` to show the ±30s buttons before rendering the final step.

---

## C. Journal "Log This Bake" Guide — Step-by-Step Form Walkthrough
**File: `js/journal-ui.js`**

Replace the current 3-step journal guide with a detailed 8-step walkthrough that highlights each form field individually:

| Step | Title | Target | Body | Auto-advance |
|------|-------|--------|------|--------------|
| 1 | "Name Your Bake" | `#j-bake-name` | "Give your bake a name — something fun like 'Sunday Margherita' or 'Garage Neapolitan'. This is optional but makes it easy to find later." | On input/blur |
| 2 | "Verify Your Style" | `#j-style` | "We've prefilled the style from your recipe. Double-check it's correct, or change it if you switched things up." | On change |
| 3 | "Set the Date" | `#j-date` | "Today's date is filled in automatically. Change it if you're logging a bake from a different day." | Next only |
| 4 | "Bake Details" | `.journal-form-grid:nth-of-type(2)` (temp/time/oven grid) | "Add your bake temp, bake time, and oven type. These help you track what works best for each style." | Next only |
| 5 | "Rate Your Bake" | `#j-star-rating` | "How did it turn out? Tap the stars to rate it. Over time your ratings help you see which recipes you've dialed in." | On click (star) |
| 6 | "Add Photos" | `#j-photo-add-btn` | "Snap a photo of your finished pizza, or add shots from earlier steps — shaping, stretching, the oven. Up to 4 photos per bake." | On change (file input) |
| 7 | "Save Your Bake" | `.btn-save-entry` | "Everything look good? Hit Save Entry to log this bake to your journal." | Wait for form submit |
| 8 | "Share It!" | `.journal-entry-card` | "Your bake is saved! Tap the card to see the full details, share it with friends, or save it to your camera roll." | Final step — "Got It!" button |

**CSS fix — date input width:**
The `#j-date` input is wider than sibling fields in the `.journal-form-grid` because `input[type="date"]` has intrinsic browser sizing. Fix by adding `max-width: 100%; box-sizing: border-box;` to `#j-date` in style.css (or a more targeted rule on `.journal-form-grid input[type="date"]`).

---

## D. Submit My Bake — 3rd Bake Nudge Improvements
**File: `js/journal-ui.js`**

Current issues with `showSubmitNudge()`:
1. The `SUBMIT_FORM_URL` is a placeholder (`"https://REPLACE_WITH_YOUR_GOOGLE_FORM_URL"`).
2. The nudge fires on bakes 3, 6, 9... which may be too frequent or feel repetitive.

**Proposed changes:**
- Replace the placeholder URL — **need your actual Google Form / submission URL.** If you don't have one yet, I'll leave a TODO or swap to a different CTA (e.g., "Tag @pielab.app on Instagram" with a direct Instagram link).
- Reduce frequency: show on bake 3, then every 5th bake after that (3, 8, 13, 18...) instead of every 3rd.
- Add a "Don't Ask Again" option alongside "Not Now" so users can permanently dismiss it. Store flag in `pielab-submit-nudge-optout`.
- Polish the card copy to feel more celebratory and less repetitive.

**Questions for you:**
- Do you have a real submission URL to replace the placeholder?
- Are you happy with the 3→8→13 cadence, or do you want something different?

---

## E. Passport — "One Bake Away" Notifications
**Files: `js/journal-ui.js`, `journal.js`**

Add a special popup when the user is exactly 1 bake away from reaching the next badge tier for any style. The tiers are:

| Bakes | Badge |
|-------|-------|
| 1 | First Stretch |
| 4 | Getting Comfortable |
| 9 | Dialed In |
| 16 | Style Specialist |
| 26 | Master of the Oven |

**"One away" thresholds:** 3, 8, 15, 25 bakes in a given style.

**When it fires:** After saving a bake, if the new `skillCount` for that style equals 3, 8, 15, or 25:
- Show a motivational popup: "You're one bake away from **[Next Badge Name]** in [Style]! Keep going!"
- Include the next badge emoji and name.
- Popup auto-dismisses after 5s or on tap.
- This fires *instead of* (or *before*) the share guide / submit nudge for that save, so the user isn't flooded with popups.

**On the Passport tab itself:**
- For any style where the user is 1–2 bakes away from the next tier, show a subtle progress hint on the passport card: e.g., "2 more to **Getting Comfortable**" below the current badge.
- Renders in `renderPassport()` by comparing current count against the next threshold.

---

## File Change Summary

| File | Changes |
|------|---------|
| `js/kitchen.js` | Add 6-step profile guide during onboarding |
| `js/first-bake.js` | Insert new Step 7 "Start Bake Timer" (8 steps total) |
| `js/journal-ui.js` | Rewrite journal guide to 8-step form walkthrough; add "one away" popup after bake save; add progress hints to passport cards; improve submit nudge frequency/copy |
| `style.css` | Fix date input overflow in `.journal-form-grid`; any minor style tweaks for new guide steps |
| `journal.js` | No changes (badge tiers already defined) |
