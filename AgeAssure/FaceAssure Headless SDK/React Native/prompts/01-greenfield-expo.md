# Task: Greenfield Expo / React Native integration

Read `AGENTS.md`, `API_QUICK_REFERENCE.md`, `assets/sdk/index.html`, `src/hooks/useSdkServer.ts`, and `src/components/HeadlessSdkWebView.tsx` in this folder first.

Integrate the Privately FaceAssure Headless SDK into **\<YOUR_APP\>**.

## Requirements

1. Use **WebView + on-device localhost** — never `import` the SDK bundle as a JS module.
2. Copy SDK dist to `assets/sdk/` as `headless-sdk.bundle` + `*.wasm`; run `npm run generate-sdk-assets`.
3. Configure `metro.config.js` (`wasm`, `bundle` in `assetExts`) and Android `usesCleartextTraffic`.
4. Implement RN ↔ WebView bridge per `API_QUICK_REFERENCE.md`.
5. Fetch a short-lived JWT from `GET /api/age-check/session` on my backend.
6. Map `guidance` / `liveness` bridge codes via `data/guidance-codes.en.json`.
7. On `result`, POST `transactionId` and `unsignedToken` to `/api/age-check/pending`.
8. On `destroyed`, reset UI and enable retry with new JWT + new `transactionId`.

Follow `ANTI_PATTERNS.md`. Verify against `CHECKLIST.md` when done.

Do not commit SDK binaries to git.
