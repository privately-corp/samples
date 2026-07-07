# Task: Retry after failure

Add robust retry UX for FaceAssure Headless SDK failures in **\<YOUR_APP\>**.

Read `ANTI_PATTERNS.md` and `rawdemoclient.js` (`onDestroyed` handler).

## Rules

- Wait for `onDestroyed` before any retry.
- Fetch **new** JWT and **new** `transactionId` from backend.
- `new HeadlessSDK({ … })` — never reuse the previous instance.
- Handle `onDestroyed.reason`: `liveness_failed`, `timeout`, `failure`, `error`.
- Do not auto-retry inside `onError` without new auth.

Wire a "Try again" button disabled until `onDestroyed` fires.
