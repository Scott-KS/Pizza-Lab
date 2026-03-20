# The Pie Lab

A pizza-making companion app for home bakers who care about their dough. Calculate recipes for 13 regional pizza styles, schedule your fermentation from mix to table, and keep a journal of every bake. Runs as a PWA in the browser and as a native mobile app on iOS and Android via Capacitor.

**Live:** [scott-ks.github.io/Pizza-Lab](https://scott-ks.github.io/Pizza-Lab/)

---

## Features

### Recipe Calculator

Select a pizza style, size, and quantity. The calculator outputs baker's-percentage dough formulas, sauce, toppings, and baking instructions tailored to your oven type.

**13 pizza styles:** Neapolitan, New York, Chicago Tavern, Detroit Deep Dish, Sicilian, Grandma, Thin & Crispy, Pan Pizza, St. Louis, New Haven Apizza, Ohio Valley, Cast Iron, and School Night (No Rise).

### Dough Scheduler

Pick when you want to eat and the app works backward to build a step-by-step timeline — mix, bulk ferment, cold ferment, ball, preheat, bake. Supports same-day, 24-hour, 48-hour, and 72-hour cold fermentation schedules. Push notifications remind you when each step is due.

### Baking Journal

Log every bake with style, ratings, hydration, ferment time, oven temp, photos, and notes. Track your progress with analytics, skill badges, and side-by-side bake comparisons. Share bakes as branded cards with watermarked photos.

### Pizza Toolkit

Reference guides for flour types, yeast, cheese and sauce pairings, oven setups, fermentation science, hydration ranges, dough troubleshooting, and a desired dough temperature (DDT) calculator.

### Free & Pro Tiers

Core features (calculator, style library, flour/cheese/oven guides) are free. A 14-day trial unlocks everything. Pro is a one-time $4.99 in-app purchase that adds the scheduler, analytics, hydration calculator, custom dough profiles, DDT calculator, fermentation tuning, and more.

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES modules), CSS custom properties, semantic HTML
- **Persistence:** localStorage + IndexedDB (photos) — no backend, all data stays on device
- **PWA:** Service worker with cache-first strategy and content-hashed versioning
- **Native:** Capacitor for iOS and Android shells
- **Payments:** RevenueCat for in-app purchase verification
- **Tooling:** ESLint, Prettier, Husky + lint-staged, Vitest

---

## Local Development

No build step required for development. Serve the project root with any static file server:

```bash
npm run dev
# or
python -m http.server 8080
```

Then open [http://localhost:8080](http://localhost:8080).

The service worker uses `pielab-dev` as a static cache name in development. To test with a fresh cache, unregister the SW in DevTools or use an incognito window.

---

## Build

```bash
npm run build
```

This copies the app to `www/`, computes SHA-256 content hashes for every cached asset, generates `sw-manifest.json`, and stamps a unique `CACHE_NAME` into `www/sw.js`. The cache name changes automatically whenever any file changes — no manual version bumping needed.

Run the build before `cap sync` or any native deploy.

---

## Native Builds

Requires [Android Studio](https://developer.android.com/studio) and/or [Xcode](https://developer.apple.com/xcode/).

```bash
npm run cap:sync      # build + copy to native projects
npm run cap:android   # open in Android Studio
npm run cap:ios       # open in Xcode
```

---

## Testing

```bash
npm test
```

Unit tests (Vitest) cover recipe math, dough scaling, fermentation timing, and edge cases. Test files live in `test/`.

---

## Project Structure

```
├── index.html              Welcome / splash screen
├── calculator.html         Recipe calculator
├── schedule.html           Dough scheduler
├── journal.html            Baking journal
├── kitchen.html            User profile & settings
├── learn.html              Knowledge base & toolkit
├── legal.html              Privacy, terms, refund policy
├── style.css               All styles (light + dark mode)
├── sw.js                   Service worker (cache-first PWA)
├── manifest.json           PWA manifest
│
├── recipes.js              Pizza recipe data + dough math
├── scheduler-data.js       Fermentation schedule engine
├── knowledge-data.js       Style library, flour, cheese/sauce data
├── tools-data.js           Oven setups, hydration ranges, troubleshooting
├── journal.js              Journal CRUD (localStorage)
│
├── js/
│   ├── pages/              Per-page entry points (ES module roots)
│   ├── calculator.js       Calculator UI
│   ├── scheduler.js        Scheduler UI
│   ├── journal-ui.js       Journal UI
│   ├── kitchen.js          Kitchen/settings UI
│   ├── knowledge.js        Knowledge base UI
│   ├── toolkit.js          Toolkit UI (DDT, hydration, ovens)
│   ├── nav.js              Shared navigation + utilities
│   ├── premium.js          Trial/Pro gating + upgrade modal
│   ├── user-profile.js     Profile read/write
│   ├── storage.js          Capacitor Preferences adapter
│   ├── photo-store.js      IndexedDB photo storage
│   ├── pie-notifications.js Push notification scheduling
│   ├── capacitor-init.js   Native bridge setup
│   ├── carousel.js         Welcome screen carousel
│   ├── onboarding.js       New user onboarding wizard
│   ├── first-bake.js       First bake guided flow
│   └── vendor/             Third-party scripts (html2canvas)
│
├── assets/                 Logos and brand assets
├── Images/                 Pizza style hero photos
├── landing/                Marketing landing page
├── scripts/                Build scripts (build-web.cjs)
├── test/                   Unit tests (Vitest)
├── capacitor.config.js     Capacitor native config
├── eslint.config.js        ESLint flat config
├── package.json            Scripts, dependencies, lint-staged
└── PLAN.md                 Current work in progress
```

---

## Deployment

Pushing to `main` auto-deploys to GitHub Pages at [scott-ks.github.io/Pizza-Lab](https://scott-ks.github.io/Pizza-Lab/).

---

## Contributing

See [PLAN.md](PLAN.md) for current work in progress and implementation plans.
