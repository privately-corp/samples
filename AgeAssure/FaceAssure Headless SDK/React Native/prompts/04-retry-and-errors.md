# Task: Retry after failure

Add robust retry UX for FaceAssure Headless SDK failures in **\<YOUR_APP\>**.

Read `ANTI_PATTERNS.md` and `assets/sdk/index.html` (`onDestroyed` → `postToNative` with `destroyed`).

## Rules

- Wait for **`destroyed`** bridge message before enabling retry.
- Fetch **NEW** JWT and **NEW** `transactionId` from backend.
- Send new `{ type: 'start', auth }` to WebView — never reuse the previous SDK instance.
- Handle `destroyed.reason`: `liveness_failed`, `timeout`, `failure`, `error`.
- Do **not** auto-retry on `error` bridge message without new auth.

Wire a "Try again" button disabled until `destroyed` fires.
