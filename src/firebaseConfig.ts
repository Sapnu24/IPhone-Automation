// Firebase web config for Google sign-in + cloud sync.
//
// These values are NOT secret — Firebase's web config is meant to ship in
// client code. Access is controlled by Firestore security rules and the list
// of authorized domains in Firebase Auth (see docs/CLOUD_SYNC_SETUP.md).
//
// Paste the values from your Firebase project (Project settings → your web app
// → "SDK setup and configuration" → Config) between the quotes below. Until
// they're filled in, the app runs exactly as before with sync turned off.
//
// You can also supply them at build time via VITE_FB_* env vars, which take
// precedence over anything hard-coded here.

const e = ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) ?? {}

export const firebaseConfig = {
  apiKey: e.VITE_FB_API_KEY || '',
  authDomain: e.VITE_FB_AUTH_DOMAIN || '',
  projectId: e.VITE_FB_PROJECT_ID || '',
  storageBucket: e.VITE_FB_STORAGE_BUCKET || '',
  messagingSenderId: e.VITE_FB_MESSAGING_SENDER_ID || '',
  appId: e.VITE_FB_APP_ID || '',
}

/** True once the essential fields are present, which flips cloud sync on. */
export const cloudConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)
