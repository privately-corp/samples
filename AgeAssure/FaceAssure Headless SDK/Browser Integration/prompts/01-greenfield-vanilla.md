# Task: Greenfield vanilla JavaScript integration

Read `AGENTS.md`, `API_QUICK_REFERENCE.md`, and `rawdemoclient.js` in this folder first.

Integrate the Privately FaceAssure Headless SDK into **\<YOUR_APP\>**.

## Requirements

1. Load the SDK from **\<CDN_URL\>** via a `<script>` tag; use global `HeadlessSDK`.
2. Fetch a short-lived JWT from `GET /api/age-check/session` on my backend (create a minimal stub route if missing).
3. Implement lifecycle: `ready()` → `getUserMedia` → `attachVideo` → `start()` → `getResult()`.
4. Map `onGuidance` and `onLiveness` codes to user strings using `data/guidance-codes.en.json`.
5. Handle `onWarn` (`MULTIPLE_FACES_DETECTED`, media readiness) without ending the session.
6. On `onResult`, POST `transactionId` and `unsignedToken` to `/api/age-check/pending` for webhook correlation.
7. On `onDestroyed`, stop `MediaStream` tracks and reset UI for retry.
8. Retry = new JWT + new `transactionId` + `new HeadlessSDK({ … })`.

Follow `ANTI_PATTERNS.md`. Verify against `CHECKLIST.md` when done.

Do not implement browser redirects. Do not store secrets in `localStorage`.
