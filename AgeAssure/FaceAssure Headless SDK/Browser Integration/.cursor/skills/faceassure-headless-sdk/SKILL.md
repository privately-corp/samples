---
name: faceassure-headless-sdk
description: Integrate Privately FaceAssure Headless SDK for browser age verification. Use when implementing HeadlessSDK, camera liveness, age gates, unsignedToken/webhook correlation, or adapting rawdemoclient.js to React/Vue/vanilla apps.
---

# FaceAssure Headless SDK (browser)

## Read first

1. `Browser Integration/AGENTS.md` — MUST / MUST NOT rules
2. `Browser Integration/rawdemoclient.js` — canonical `runAgeCheck()` + `buildSdkConfig()`
3. `Browser Integration/API_QUICK_REFERENCE.md` — callbacks and codes

## Workflow

1. Load CDN bundle → `window.HeadlessSDK`
2. `new HeadlessSDK(config)` with all callbacks on constructor
3. `await sdk.ready()` → attach media → `await sdk.start()` → `await sdk.getResult()`
4. Cleanup in `onDestroyed` (stop camera tracks)
5. Retry = new JWT + new `transactionId` + **new** instance

## Copy & i18n

Map codes via `Browser Integration/data/guidance-codes.en.json` — never show raw codes to users.

## Tasks

See `Browser Integration/INTEGRATION_TASKS.md` for scenario prompts.

## Verify

Complete `Browser Integration/CHECKLIST.md`. Avoid everything in `Browser Integration/ANTI_PATTERNS.md`.

## Never

- Reuse instances after `onDestroyed`
- Trust `unsignedToken` for access control
- Store API secrets in frontend
- Implement redirect-based return flows
