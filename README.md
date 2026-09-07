# ⚓️ Anchor — Money & Focus

An all-in-one life manager for adults, built as an **installable web app (PWA)** you
can add to your iPhone home screen. Track expenses, bills, due dates, budgets and
cashflow — with a focus timer and habit tracking on the way. Everything stays
**private on your device**: no account, no servers.

> Working name "Anchor" — easy to rename in `vite.config.ts` (manifest) and
> `index.html`.

## Why a PWA (and what needs native iOS)

This app is a Progressive Web App so it can be built, tested and shipped from any
machine and installed on an iPhone today — no Mac or App Store required. Some parts
of the original vision **can only** be done in a native Swift app with a special
Apple entitlement, and are documented in [`docs/NATIVE_ROADMAP.md`](docs/NATIVE_ROADMAP.md):

- Monitoring device-wide **Screen Time**
- **Locking / blocking other apps** (for yourself or as parental controls)
- Distribution on the **App Store**

## Features (this version)

- **Money**
  - Log expenses & income with categories
  - Recurring **bills** (weekly / monthly / yearly) with due dates, overdue &
    "due soon" tracking, and one-tap **Mark paid**
  - Monthly **budgets** per category with progress bars
  - **Safe-to-spend** cashflow: income − spending − bills still due this month
- **Reminders that actually fire on iOS** — export bills to a `.ics` calendar file
  with alarms; open it to add reliable due-date reminders to Apple Calendar
- **Private & offline** — data is stored on-device (IndexedDB); works with no
  connection once installed
- **Backup** — export / restore all data as a JSON file
- **Light & dark** themes, multiple currencies
- **Coming next:** Pomodoro focus timer + habit tracking (Phase B), spending charts
  (Phase C), receipt photo capture with on-device OCR (Phase D)

## Tech

React + TypeScript + Vite · `vite-plugin-pwa` (offline + installable) ·
IndexedDB via `idb` · React Router (hash) · hand-rolled SVG icons · Vitest for the
money/recurrence logic.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # unit tests (money + recurrence)
npm run build      # type-check + production build into dist/
npm run gen:icons  # regenerate PNG app icons from public/favicon.svg
```

## Deploy (free, via GitHub Pages)

A GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and publishes the
app on every push to `main` or the feature branch.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment →
Source: GitHub Actions**. After the next push the app is live at:

```
https://<your-username>.github.io/<repo-name>/
```

## Install on your iPhone

1. Open the Pages URL above in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch "Anchor" from your home screen — it runs full-screen and offline.

## Privacy

All data lives in your browser's local database on the device. Nothing is uploaded.
Clearing Safari website data (or deleting the app) erases it — use **Settings →
Export backup** to keep a copy.
