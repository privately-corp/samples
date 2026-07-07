---
name: faceassure-headless-sdk-react-native
description: >-
  Integrates the FaceAssure Headless SDK into React Native / Expo apps via WebView,
  on-device localhost, and a postMessage bridge. Use when implementing HeadlessSDK
  on mobile, WebView SDK hosting, WASM bundle setup, age gates, unsignedToken/webhook
  correlation, or adapting this sample to an existing RN app.
---

# FaceAssure Headless SDK (React Native)

## Read first

1. `AGENTS.md` — MUST / MUST NOT rules and architecture
2. `assets/sdk/index.html` — canonical WebView lifecycle (`runAgeCheck`, `buildSdkConfig`)
3. `src/components/HeadlessSdkWebView.tsx` — RN ↔ WebView bridge
4. `API_QUICK_REFERENCE.md` — SDK API + bridge protocol

## Workflow

1. Copy SDK dist → `assets/sdk/` → `npm run generate-sdk-assets`
2. `useSdkServer()` → localhost HTTP → WebView loads `/index.html`
3. RN sends `start(auth)` → WebView runs `new HeadlessSDK` → `ready()` → attach → `start()` → `getResult()`
4. Handle bridge messages in RN UI; map codes via `data/guidance-codes.en.json`
5. On `destroyed`, reset UI; retry = new JWT + new `transactionId` + new `start`

## Never

- Import / require SDK bundle in TS/JS
- Load WebView from `file://`
- Commit `*.wasm` or `.bundle` to public git
- Reuse SDK instance after `destroyed`
- Trust `unsignedToken` for access control

## Tasks

See `INTEGRATION_TASKS.md` and `prompts/` for scenario prompts.

## Verify

Complete `CHECKLIST.md`. Avoid everything in `ANTI_PATTERNS.md`.
