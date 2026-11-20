# Gym Tracker

A small offline web app for your phone: log exercises (weight in kg × reps, one or more sets), see history and progress per exercise, personal records (heaviest weight, ties broken by reps), filter by muscle group or specific muscle, and see which exercises for a group you haven't done for the longest time.

**Sync (optional):** sign in with Google and your workouts are saved in your account and appear on every device where you sign in. Each Google account sees only its own data. Without signing in, the app works exactly as before, with data only on that device.
Offline at the gym? Keep logging — changes are uploaded automatically when you're back online.

## Files
- `index.html` – the app (approved exercise catalog included)
- `sync.js` – Google sign-in and sync (Firebase)
- `firebase-config.js` – **you paste your Firebase settings here** (left as `null` = no sync)
- `firestore.rules` – security rules to paste into Firebase
- `manifest.webmanifest`, `sw.js`, icons – installable + offline

---

## 1. Create the Firebase project (one time, ~10 minutes, free)
1. Go to **console.firebase.google.com** and sign in with your Google account.
2. **Create a project** → any name (e.g. *gym-tracker*) → Google Analytics can be turned **off** → Create.
3. **Turn on Google sign-in:** left menu **Build → Authentication → Get started → Sign-in method → Google → Enable**, pick your support email → **Save**.
4. **Allow your GitHub Pages address:** still in Authentication → **Settings → Authorized domains → Add domain** → `youruser.github.io` (your GitHub username, without `https://` and without the repo name).
5. **Create the database:** **Build → Firestore Database → Create database** → choose a location near you (e.g. a Europe location) → start in **production mode** → Create.
6. **Protect the data:** Firestore Database → **Rules** tab → replace everything with the content of `firestore.rules` → **Publish**.
7. **Get the settings for the app:** click the **gear icon → Project settings → General**, scroll to **Your apps** → click the **Web** icon `</>` → nickname *Gym Tracker* → do **not** tick Firebase Hosting → **Register app**. You'll see a block `const firebaseConfig = { apiKey: ..., authDomain: ..., projectId: ..., ... };`.

## 2. Put the settings into the app
Open `firebase-config.js` and replace `null` with the `{ ... }` part, so it looks like:
```js
window.FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "gym-tracker-xxxx.firebaseapp.com",
  projectId: "gym-tracker-xxxx",
  storageBucket: "gym-tracker-xxxx.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```
These values are not secret (they only identify the project); your data is protected by the rules from step 6.

## 3. Upload to GitHub
In your repo: **Add file → Upload files** → drag in **all** files from this folder (replace the old ones) → **Commit changes**. GitHub Pages updates in 1–2 minutes.

## 4. Use it
1. Open the app (if it's already on your home screen, close it fully and reopen it once or twice so it picks up the new version).
2. Tap **Sign in** (top right) or go to **Data → Sign in with Google**.
3. Do the same on your other devices with the same Google account.

The first sign-in sets up your account with the exercise catalog. If the device already has workouts logged without sign-in, the app asks whether to copy them into your account.

The badge at the top right shows **Synced**, **Syncing**, **Offline** (changes wait on the phone and upload later) or **Sync problem** (details in the Data tab).

## Notes
- Signing out keeps your data in your account; the device goes back to its own local (not signed-in) data.
- **Data → Backup (JSON)** still works and is a good extra safety copy. **Import** merges a backup into your data (nothing is deleted).
- If the same entry is edited on two devices while both are offline, the last one to sync wins.
- When you change the app files later, bump `VERSION` in `sw.js` (e.g. `gym-tracker-v3`) so phones pick up the update.
