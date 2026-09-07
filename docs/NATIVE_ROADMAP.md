# Native iOS Roadmap — Screen Time, App-Locking, Parental Controls & the App Store

This is the Phase-2 plan for the features that **cannot** be built as a web app and
**must** be a native iOS (Swift) app: monitoring device Screen Time, locking/blocking
other apps, parental controls, and shipping on the App Store. You have a Mac, so all
of this is reachable — it just needs the Apple toolchain and one approval from Apple.

Everything in the current web app (money, bills, budgets, focus, habits) keeps
working and can be **reused** by the native app (see "What to reuse" at the end).

---

## 1. The key facts (read first)

- **Only a native app can touch Screen Time / other apps.** Apple exposes this
  through the **Family Controls / Screen Time API**. JavaScript in Safari or a PWA
  has zero access — this is a hard platform rule, not a limitation of our code.
- **You must request a special entitlement from Apple:**
  `com.apple.developer.family-controls`. Development builds can use it with your
  developer account; **shipping to the App Store requires requesting the
  *Distribution* entitlement via an Apple form and being approved.**
- **Privacy-by-design:** you never see other apps' names/bundle IDs. The user picks
  apps via Apple's own `FamilyActivityPicker`, which returns **opaque tokens**. You
  shield/limit those tokens; you can't enumerate or exfiltrate them.
- **Real device + Xcode required.** The interesting APIs don't work in the Simulator,
  and everything is built on a Mac with Xcode.

## 2. Prerequisites checklist

- [ ] **Mac with Xcode** (latest).
- [ ] **Apple Developer Program** membership ($99/year).
- [ ] A physical **iPhone** (iOS 16+) for testing.
- [ ] App ID + provisioning profile created in the developer portal.
- [ ] **Request the Family Controls entitlement**: Apple Developer → Account →
      "Contact us" / entitlement request form → *Request Family Controls
      (Distribution)*. Explain the parental-control / self-monitoring use case.
      Approval can take a little while — start this early.
- [ ] For parental controls: the guardian and child devices in the same
      **Family Sharing** group.

## 3. Two routes to native (pick based on urgency)

### Route A — Capacitor wrapper (fastest App Store win) ✅ recommended first
Wrap the **existing web app** in a native shell so you can ship to the App Store
quickly, then add Screen Time features as native plugins/extensions.

```bash
npm i @capacitor/core @capacitor/ios
npm i -D @capacitor/cli
npx cap init Anchor com.yourname.anchor --web-dir=dist

# Build the web app for a wrapped (root-served) context — NOT the Pages base path:
npm run build            # ensure BASE_PATH is unset so base = "/"
npx cap add ios
npx cap sync
npx cap open ios         # opens the project in Xcode → run on your iPhone
```

Then add the Screen Time capability as described in §4 via a **native Swift plugin**
plus the required **app extensions**. The web UI calls the plugin over Capacitor's
bridge (e.g. "pick apps to limit", "set a 1-hour limit").

- 👍 Reuse 100% of the current UI/logic; on the store in days, not weeks.
- 👍 Add native features incrementally.
- 👎 Wiring Family Controls **app extensions** into a Capacitor project takes care
  (extensions are native targets in the Xcode project).

### Route B — Full SwiftUI app (cleanest deep integration)
Rebuild the UI in SwiftUI and port the domain logic (§ "What to reuse"). Best if the
Screen Time features become the heart of the product.

- 👍 First-class SwiftUI, Live Activities, widgets, deep OS integration.
- 👎 Rebuild the UI; slower to first ship.

## 4. Screen Time architecture (native)

Frameworks:

| Framework | Purpose |
|---|---|
| **FamilyControls** | Ask permission (`AuthorizationCenter`), show `FamilyActivityPicker`, hold a `FamilyActivitySelection` (opaque app/category/web tokens). |
| **ManagedSettings** | Apply restrictions — **shield (block) apps** via a `ManagedSettingsStore`, set restrictions, customize the block screen. |
| **DeviceActivity** | Schedule monitoring windows and usage thresholds; a `DeviceActivityMonitor` **app extension** gets callbacks (`intervalDidStart`, `eventDidReachThreshold`) where you apply/remove shields. |
| **DeviceActivityReport** | A SwiftUI **report extension** that displays usage in a privacy-preserving sandbox (you render totals; you can't read raw data out). |

Minimal flow:

```swift
import FamilyControls, ManagedSettings, DeviceActivity

// 1) Authorize (self-monitoring; use .child on a child's device)
try await AuthorizationCenter.shared.requestAuthorization(for: .individual)

// 2) User picks apps/categories via FamilyActivityPicker -> selection
@State var selection = FamilyActivitySelection()   // bound to the picker

// 3) Block ("lock") the chosen apps now
let store = ManagedSettingsStore()
store.shield.applications = selection.applicationTokens
store.shield.applicationCategories = .specific(selection.categoryTokens)

// 4) Time limits: schedule a window + threshold; the DeviceActivityMonitor
//    extension flips the shield on at the limit and off when the window resets.
```

App extensions you'll add as Xcode targets:
- **DeviceActivityMonitor** extension — apply/lift shields on schedule/threshold.
- **ShieldConfiguration** extension — customize the "app is blocked" screen.
- **ShieldAction** extension — handle taps on the block screen (e.g. "ask a parent").
- **DeviceActivityReport** extension — show usage charts.

## 5. Parental controls model

- The child's device runs the app and requests **`.child`** authorization; the
  guardian approves through Apple's Family Sharing flow.
- The guardian sets limits (which apps, how long, bedtime windows). Those limits are
  enforced **on the child device** by its `DeviceActivityMonitor`.
- Coordinating settings **between** guardian and child devices needs your own sync —
  use **CloudKit** (private/shared database) or your own backend. (This is the one
  piece that reintroduces a server.)

## 6. Reminders without native (interim option)

If you want true scheduled push reminders before going fully native, add a small
backend that sends **Web Push** (iOS 16.4+ supports push for home-screen PWAs). Until
then the app's **calendar (.ics) export** already gives reliable due-date alarms.

## 7. Suggested sequence

1. **2.0 Prep** — enroll in the Developer Program; **request the Family Controls
   entitlement** (do this first, it gates everything).
2. **2.1 Ship current app** — Capacitor-wrap and submit to the App Store (money +
   focus + bills). Fastest real milestone.
3. **2.2 Self screen-time** — add `DeviceActivityReport` to show *your own* usage.
4. **2.3 App limits & locking** — `FamilyActivityPicker` + `ManagedSettings` shields
   + `DeviceActivityMonitor` for time limits and manual "lock now."
5. **2.4 Parental controls** — `.child` authorization + Family Sharing + CloudKit
   sync of limits between devices.
6. **2.5 Extras** — Pomodoro Live Activity, Focus filters, home-screen widgets.

## 8. App Store review notes

- Family Controls apps (parental control / self-monitoring) are allowed but
  scrutinized — state the purpose clearly and include a privacy policy.
- Don't use Screen Time data for anything except the user-facing feature; you
  couldn't exfiltrate it anyway by design.

## What to reuse from this repo

- **Domain types** — `src/types.ts` (Transaction, Bill, Budget, Category, Settings…)
  → port to Swift structs / SwiftData models.
- **Money & recurrence logic** — `src/lib/money.ts` and `src/lib/recurrence.ts`
  (safe-to-spend, budget progress, monthly/weekly/yearly due-date math, month-end
  clamping). These are pure and unit-tested — translate them directly to Swift.
- **Calendar export** — `src/lib/ics.ts` (VEVENT/RRULE/VALARM shape).
- **UX & information architecture** — the tab layout, bill/expense flows, the
  "Safe to spend" concept, category model, and the whole Money screen design.
- **The web app itself** — via Route A it *becomes* the first native release.
