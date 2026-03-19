# The Pie Lab — Claude Code Rules

## Project Overview
The Pie Lab is a premium pizza-making web app. Static HTML/CSS/JS — no framework, no build step, no dependencies unless explicitly approved. localStorage for persistence. Hosted at C:\Users\scott\Pizza-Lab, versioned at https://github.com/Scott-KS/Pizza-Lab.

---

## Before Writing Any Code

### Always do this first:
1. Read the files relevant to the task before touching anything. Do not assume file structure — check it.
2. If the request is ambiguous, ask clarifying questions before proceeding. Do not guess at intent.
3. If multiple implementation approaches exist, briefly state the tradeoffs and ask which direction to take before writing code.
4. If a request would require adding a new dependency, stop and ask for approval first.

### Clarifying questions to ask when relevant:
- Is this feature free-tier or premium-gated?
- Should this work on mobile, desktop, or both?
- Does this touch localStorage — and if so, what's the key structure?
- Does this connect to any other page or feature (cross-page prefill, deep links, badges)?
- Should this match an existing UI pattern in the app, or is it a new pattern?

---

## Language & Tech Rules

- **Always vanilla JS, HTML, CSS.** No React, Vue, jQuery, or any framework unless explicitly told otherwise.
- **No new npm packages or CDN imports** without explicit approval.
- **No build tools.** No webpack, Vite, Rollup. Everything runs directly in the browser.
- **No TypeScript.** Plain JS only.
- If a utility already exists in the codebase (e.g. `populateStyleSelect()`, `PieLabJournal`), use it. Do not rewrite existing logic.

---

## Code Quality Standards

### General
- Write the minimum code required to solve the problem correctly. No over-engineering.
- Every function should do one thing. If a function is doing three things, split it.
- No dead code. No commented-out blocks left behind.
- No console.log statements in final output unless they serve a debug purpose that's been discussed.

### JavaScript
- Use `const` by default. `let` only when reassignment is required. Never `var`.
- Use descriptive variable names. `styleCount` not `sc`. `bakeBadge` not `b`.
- Keep functions under 30 lines where possible. If longer, add a comment explaining why.
- Guard against missing localStorage data — always check before parsing, never assume a key exists.
- Style name comparisons must always be case-insensitive and trimmed: `style.toLowerCase().trim()`

### CSS
- Never use inline styles unless dynamically required by JS logic.
- Match the existing design system exactly. All colours use CSS custom properties defined in style.css:
  - **Light mode** (default):
    - Background: `#f3ebe2` (`--clr-bg`)
    - Card/surface: `#faf6f1` (`--clr-card`)
    - Border: `#d5c9bc` (`--clr-border`)
    - Text: `#1a1410` (`--clr-text`)
    - Muted text: `#5a4e47` (`--clr-text-light`)
    - Primary (red): `#8c3524` (`--clr-primary`)
    - Accent (gold): `#c9954a` (`--clr-accent`)
  - **Dark mode** (`[data-theme="dark"]`):
    - Background: `#1c1614`
    - Card/surface: `#2a2220`
    - Border: `#4d413a`
    - Text: `#e8ddd4`
    - Primary: `#c4604b`
    - Accent: `#d9a85a`
  - Border radius: `var(--radius)` (12px) for cards, 6–8px for inputs/buttons
  - Transitions: `200ms ease` preferred; animations may use `0.3s` or cubic-bezier where appropriate
- Typography: Playfair Display for headings, Inter for body. Do not introduce new fonts.
- Mobile-first. New UI elements must stack cleanly on small screens. Test at 375px width mentally before submitting.

### HTML
- Semantic elements over divs where appropriate (`<section>`, `<nav>`, `<article>`, `<button>`).
- Every interactive element needs a logical tab order and a visible focus state.
- No inline event handlers (`onclick=""`). Attach events in JS.

---

## Architecture Rules

- **Multi-page app.** Seven pages:
  - `index.html` — splash / welcome screen
  - `calculator.html` — recipe calculator (main tool)
  - `schedule.html` — dough scheduler
  - `learn.html` — knowledge base (styles, flour, cheese, tools)
  - `journal.html` — bake journal
  - `kitchen.html` — user profile, settings, feedback, data & privacy
  - `legal.html` — privacy policy, terms of service, refund policy
- **Shared logic lives in `nav.js`.** If something needs to work across pages, it belongs there or in a shared data file.
- **Feature modules are scoped to their page** (all in `js/`):
  - `calculator.js` → calculator.html
  - `scheduler.js` → schedule.html
  - `knowledge.js` → learn.html
  - `toolkit.js` → learn.html
  - `journal-ui.js` → journal.html
  - `kitchen.js` → kitchen.html
  - `carousel.js` → index.html (welcome carousel)
- **Cross-page modules** (in `js/`):
  - `nav.js` — navigation, mobile tab bar, active schedule badge, data notice banner
  - `premium.js` — trial/Pro gating system, upgrade modal (loaded on calculator.html, learn.html)
  - `user-profile.js` — PieLabProfile class, profile read/write
  - `pie-notifications.js` — push notification scheduling
  - `capacitor-init.js` — Capacitor bridge for native app wrapper
- **Data files are read-only from feature modules** (in project root):
  - `recipes.js` — dough calculation logic and PIZZA_RECIPES data
  - `knowledge-data.js` — style library, toppings, flour, cheese/sauce
  - `tools-data.js` — fermentation schedules, hydration ranges, oven setups, troubleshooting
  - `scheduler-data.js` — schedule building logic
  - `journal.js` — PieLabJournal class, localStorage CRUD
- **Service worker:** `sw.js` in project root. Cache name must be bumped on every deploy that changes cached assets.
- Do not mix concerns across modules. Calculator logic stays in calculator.js. Journal logic stays in journal.js.

---

## Paywall & Trial Rules

- **Pricing:** One-time $4.99 purchase to unlock all Pro features permanently.
- **Trial:** 14-day full-access trial starts after the user's first bake (not on install).
- Before building any gated feature, find and read the existing paywall/trial logic in `js/premium.js`. Build on top of it. Never create a parallel system.
- Premium features are **visible but locked** to free/expired users — never hidden entirely.
- Lock state: subtle lock icon + tooltip. Tapping triggers the existing upgrade modal.
- During trial: all features fully unlocked, no friction.
- **Free tier features:** Recipe Calculator, Bowl Compensation, Fermentation Reference Chart, Style Library, Flour Guide, Cheese & Sauce Guide, Oven Guide.
- **Pro tier features:** Dough Scheduler, Push Notifications, Plan My Bake, Bake Analytics, Hydration Calculator, Troubleshooting Tree, Custom Dough Profiles, DDT Calculator, Fermentation Tuning, Compare.

---

## localStorage Rules

- Always check for key existence before reading. Never assume.
- Always wrap `JSON.parse()` in try/catch.
- Use descriptive key names: `pielab_journal_entries`, not `entries`.
- All app keys use the `pielab` prefix (e.g. `pielab-premium`, `pielab-profile`, `pielab-notice-dismissed`).
- Do not store base64 photo data in new features — flag it for discussion if photos are involved.
- Never delete or migrate existing localStorage keys without explicit instruction.

---

## Cross-Feature Flows to Protect

These flows must continue working after any change:
- **"Log This Bake"** — calculator prefills journal via `journal.html?prefill=1` and localStorage
- **"Learn More"** — calculator links to `learn.html?style=X#styles` deep link
- **Active schedule badge** — visible in header on all pages, driven by scheduler localStorage data
- **Style skill badges** — calculated per style at journal save time, stored permanently on entry
- **Share This Bake / Save to Photos** — canvas-based image generation in journal-ui.js, requires profile name
- **Data notice banner** — first-visit banner injected by nav.js, dismissed via `pielab-notice-dismissed` flag
- **Delete All Data** — kitchen.html modal clears all `pielab*` localStorage keys, redirects to index.html
- **Footer legal links** — every page (except index.html splash) links to legal.html#privacy, #terms, #refund

---

## What to Do When Stuck

- If a file is longer than expected or the logic is unclear, read it fully before asking for help.
- If two approaches seem equally valid, pick the simpler one and note the tradeoff in a comment.
- If a change would affect more than one page or module, flag it before proceeding.
- Never silently change behavior that wasn't part of the request.
