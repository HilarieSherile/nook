# Nook — Meals & Money

A cozy personal planner: weekly meal calendar, a searchable recipe box, an auto-filled grocery list with running cost, and simple budget + savings tracking. Free to run, works on phone and laptop, saves to your home screen like an app.

## 1. Try it locally first
Just open `index.html` in a browser — it works immediately in **local-only mode** (saved to that one browser via localStorage). Good for testing before you set anything up.

## 2. Put it on GitHub Pages (free hosting)
1. Create a new **public** repo on GitHub (e.g. `nook`).
2. Upload all these files to it (keep the folder structure).
3. In the repo, go to **Settings → Pages**, set source to the `main` branch, root folder. Save.
4. After a minute or two, your app will be live at `https://yourusername.github.io/nook/`.

## 3. Add free cloud sync (Firebase) — optional but recommended
This lets your phone and laptop stay in sync. Full step-by-step is written inside `js/firebase-config.js`, but the short version:
1. Create a free project at [console.firebase.google.com](https://console.firebase.google.com) (Spark/free plan).
2. Add a Web App inside it, copy the config values into `js/firebase-config.js`.
3. Enable **Email/Password** sign-in under Authentication.
4. Enable **Firestore Database**, and paste in the security rules shown in that same file.
5. Push the updated `firebase-config.js` to GitHub — the app will now ask you to sign in and will sync automatically.

Until you do this step, the app still works great — it just stays on one device.

## 4. Save it to your home screen
- **iPhone (Safari):** open the site → Share icon → "Add to Home Screen"
- **Android (Chrome):** open the site → ⋮ menu → "Add to Home screen"
- **Laptop (Chrome/Edge):** open the site → install icon in the address bar → Install

It'll open full-screen, like a real app, with no browser bar.

## What's inside
- `index.html` — page structure
- `css/style.css` — all styling
- `js/store.js` — data layer (local + Firebase sync)
- `js/meals.js` / `recipes.js` / `grocery.js` / `finance.js` — feature logic
- `js/app.js` — tabs, modal system, sign-in
- `js/firebase-config.js` — your Firebase keys go here

Recipe search uses [TheMealDB](https://www.themealdb.com), a free public recipe API — no signup or key needed.

## Cost
$0. GitHub Pages hosting is free, Firebase's free tier is far more than one person needs, and TheMealDB's public API is free. The only costs that could ever apply are ones you choose later (like a custom domain), and none are required.
