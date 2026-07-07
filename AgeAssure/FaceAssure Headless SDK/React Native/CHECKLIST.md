# FaceAssure Headless SDK — React Native Integration Checklist

Use this list to verify a React Native integration is complete. AI agents should not mark the task done until all applicable items pass.

## Environment & assets

- [ ] Licensed SDK dist copied to `assets/sdk/` (`headless-sdk.bundle` + all `*.wasm`)
- [ ] `npm run generate-sdk-assets` run after copying binaries
- [ ] `metro.config.js` includes `wasm` and `bundle` in `assetExts`
- [ ] SDK binaries **not** committed to public git (`.gitignore` enforced)
- [ ] App builds on target platform (Android and/or iOS)

## Localhost static server

- [ ] `useSdkServer` (or equivalent) copies assets to document directory
- [ ] Static HTTP server serves SDK files on localhost
- [ ] WebView loads `http://localhost:<port>/index.html` (not `file://`)
- [ ] Android `usesCleartextTraffic: true` for localhost

## WebView

- [ ] `react-native-webview` configured with camera grant + JS enabled
- [ ] `HeadlessSdkWebView` (or equivalent) handles `onMessage` for all bridge types
- [ ] RN → WebView `start` / `stop` via `injectJavaScript` message dispatch
- [ ] `hostReady` received before enabling Start button

## Authentication

- [ ] Production uses **JWT token** from backend (not session credentials in app storage)
- [ ] Each attempt uses a **unique** `transactionId` / `jti`
- [ ] No API secrets in RN source, git, or AsyncStorage (production)
- [ ] Token expiry handled server-side before passing to app

## SDK lifecycle (inside WebView)

- [ ] `new HeadlessSDK(config)` created per attempt in `index.html`
- [ ] `await sdk.ready()` completes before `start()`
- [ ] Camera acquired via `getUserMedia` in WebView
- [ ] Media attached via `attachVideo` before `start()`
- [ ] `destroyed` bridge message always received at session end
- [ ] Retry sends **new** `start` with **new** auth (never reuses old instance)

## RN UI & callbacks

- [ ] All `guidance` codes mapped to localized strings (`data/guidance-codes.*.json` or `guidance.ts`)
- [ ] `liveness` instruction codes mapped for active liveness UI
- [ ] `warn` handled for `MULTIPLE_FACES_DETECTED` and media readiness (non-blocking)
- [ ] `error` shown for terminal failures
- [ ] `result` forwarded to backend with `unsignedToken`
- [ ] `destroyed` resets UI and re-enables retry
- [ ] User can cancel via `stop()` (wired to a button)

## Backend & verification

- [ ] Backend endpoint issues short-lived JWT
- [ ] App POSTs `transactionId` + `unsignedToken` to backend on `result`
- [ ] Webhook handler verifies RS256 signature with Privately public key
- [ ] Webhook `jti` matched to in-flight app session
- [ ] Access control uses **signed webhook JWT**, not `unsignedToken`

## Permissions

- [ ] Android `CAMERA` permission declared and requested
- [ ] iOS `NSCameraUsageDescription` set
- [ ] Camera permission granted before or during check

## Manual smoke test (device)

- [ ] Successful check: `result.status === 'success'`, `destroyed.reason === 'success'`
- [ ] Stop button: `destroyed.reason === 'user_cancelled'`
- [ ] Retry after session: new transaction, no `INSTANCE_DESTROYED` errors
- [ ] Multiple faces: `warn` with `MULTIPLE_FACES_DETECTED`, clears when one face remains
- [ ] App survives background/foreground during check (or handles gracefully)
