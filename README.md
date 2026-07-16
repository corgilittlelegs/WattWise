# WattWise — Electricity Consumption Tracker

Track electricity meter readings against a daily free allowance (10 kWh/day), visualize savings trends, and optionally sync across devices with a secret Sync Key. All calculations run client-side; data is stored in `localStorage` and, if cloud sync is enabled, in Firestore.

## Run locally

**Prerequisites:** Node.js 20+

```
npm install
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm test` — run the unit tests
- `npm run lint` — typecheck with `tsc --noEmit`

## Cloud sync

Cloud sync uses Firebase Anonymous Auth + Firestore. The web config in `firebase-applet-config.json` is not secret (standard for Firebase web apps), but the deployed project should have App Check and referrer restrictions enabled. Firestore security rules live in `firestore.rules`; deploy them with:

```
firebase deploy --only firestore:rules
```
