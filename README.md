# Gym Tracker

A small offline web app for your phone: log exercises (weight in kg × reps, one or more sets), see history and progress per exercise, personal records (heaviest weight, ties broken by reps), filter by muscle group or specific muscle, and see which exercises for a group you haven't done for the longest time.

All data stays in the phone's browser storage. Use **Data → Backup (JSON)** regularly; import that file on another phone, or use **Log as CSV** to open your log in Excel.

## Files
- `index.html` – the whole app (approved exercise catalog included)
- `manifest.webmanifest`, `sw.js`, icons – make it installable and usable offline

## Publish with GitHub Pages
1. Put these files in the root of a GitHub repository.
2. Repository → Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Open `https://<your-user>.github.io/<repo>/` on your phone.
4. Install: Android Chrome → menu → *Add to Home screen* / *Install app*. iPhone Safari → Share → *Add to Home Screen*.

## Updating the app
After changing files, bump `VERSION` in `sw.js` so phones pick up the new version. Your logged data is not affected by updates.
