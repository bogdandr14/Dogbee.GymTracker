# Gym Tracker

A simple mobile web app for tracking gym workouts.

## Features
- **Log workouts**: pick an exercise, enter weight (kg) and reps, and add as many sets as you need. The app shows what you did last time and your personal record.
- **History**: every session grouped by day, plus a progress chart and PR for each exercise. Entries can be edited or deleted.
- **Muscles**: filter by muscle group, specific muscle and equipment to see personal records and which exercises you haven't done for the longest time.
- **Exercise catalog**: about 120 exercises, each with its main and secondary muscles and equipment. You can add or edit your own.
- **Works offline**: install it on your phone's home screen and use it at the gym without internet.
- **Optional sync**: sign in with Google to use the same data on several devices.
- **Export**: JSON backup and CSV (opens in Excel).

## Install on your phone
- **Android (Chrome):** open the app → ⋮ menu → *Add to Home screen* / *Install app*
- **iPhone (Safari):** open the app → Share → *Add to Home Screen*

## Built with
Plain HTML, CSS and JavaScript (no build step), hosted on GitHub Pages. Sync uses Firebase Authentication and Cloud Firestore.
