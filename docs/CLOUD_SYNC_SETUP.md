# Cloud sync setup (Google sign‑in + Firebase)

Hive can sign you in with Google and sync your data across devices using
**Firebase** (Google's free serverless backend). This is optional — until you
finish these steps, the app runs exactly as before, fully on‑device.

Your data is stored in **your own Firebase project**, readable/writable only by
your signed‑in account (enforced by the security rules below).

## 1. Create a Firebase project (free)

1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it (e.g. `hive-money`), accept defaults, create it. The free **Spark**
   plan is plenty.

## 2. Add a Web app and copy the config

1. In the project, click the **`</>` (Web)** icon to "Add an app to get started".
2. Give it a nickname (e.g. `hive-web`). You do **not** need Firebase Hosting.
3. Firebase shows a `firebaseConfig` object. Copy these values — you'll paste
   them in (or send them to me):
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

   These are **not secrets** — they're meant to ship in web apps. Access is
   controlled by the steps below.

## 3. Turn on Google sign‑in

1. **Build → Authentication → Get started**.
2. **Sign‑in method → Google → Enable**, pick a support email, **Save**.

## 4. Authorize the app's domain

1. **Authentication → Settings → Authorized domains → Add domain**.
2. Add **`sapnu24.github.io`** (and keep `localhost` for testing).

## 5. Create the database

1. **Build → Firestore Database → Create database**.
2. Choose a location, start in **Production mode**.
3. Open the **Rules** tab, replace the rules with the following, and **Publish**:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

   This lets each signed‑in person read and write **only their own** document.

## 6. Plug the config into Hive

Paste the values from step 2 into `src/firebaseConfig.ts` (replace the empty
strings), or send them over and they'll be wired in and deployed. Once the
`apiKey`, `projectId`, and `appId` are set, an **Account & sync** card appears in
**Settings** with a **Continue with Google** button.

## How syncing behaves

- Signing in on your first device uploads your current data.
- Signing in on another device pulls it down.
- After that, edits sync automatically (a couple of seconds after each change)
  and live between devices.
- Conflicts use **last change wins** (fine for one person across their own
  devices). Receipt photos stay on‑device and are not uploaded.
- Offline still works — changes sync the next time you're online.
