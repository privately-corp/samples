# FaceAssure Headless SDK — React Native Agent Integration Brief

**SDK version:** `v1.10.32`  
**Audience:** AI coding agents (Cursor, Copilot, Claude Code, Windsurf, Continue, etc.)

## What this folder is

A **reference React Native integration** for the Privately FaceAssure Headless SDK. The SDK is a browser bundle (JS + WASM); React Native hosts it in a **WebView** served from **on-device localhost**. Clients do **not** need SDK source code.

| File | Role |
|------|------|
| `src/hooks/useSdkServer.ts` | Copies SDK assets; starts localhost static HTTP server |
| `src/components/HeadlessSdkWebView.tsx` | WebView + RN ↔ SDK `postMessage` bridge |
| `assets/sdk/index.html` | **Canonical WebView host** — `runAgeCheck()`, `buildSdkConfig()`, callbacks |
| `src/screens/AgeCheckScreen.tsx` | Example RN UI wiring |
| `src/types/sdk.ts` | Bridge message types and auth payload |
| `API_QUICK_REFERENCE.md` | SDK API + RN bridge contract |
| `INTEGRATION_TASKS.md` | Copy-paste prompts per scenario |
| `CHECKLIST.md` | Definition of done / acceptance tests |
| `ANTI_PATTERNS.md` | Mistakes agents must avoid |
| `data/*.json` | Locale-neutral code → default user-facing copy |

## Architecture (non-negotiable)

```
React Native UI  →  postMessage  →  WebView (index.html + headless-sdk.js)
                                        ↓
                              on-device localhost HTTP server
```

React Native **cannot** `import` or `require()` the SDK bundle as a JS module.

## Hard constraints (MUST)

1. Bundle SDK as static assets in `assets/sdk/` — use `headless-sdk.bundle` extension (Metro); serve as `headless-sdk.js` in WebView.
2. Serve SDK files over **HTTP localhost** (not `file://`) — camera + WASM require a secure browser context.
3. Use **one `HeadlessSDK` instance per age-check attempt** inside the WebView. After `onDestroyed`, create a new instance with fresh auth.
4. Follow SDK lifecycle in `assets/sdk/index.html`: **`ready()` → attach media → `start()` → `getResult()`**.
5. Register all SDK callbacks in the **constructor config** inside `index.html` (no `.on()` / `.off()` API).
6. **RN owns:** all UI outside the WebView, localization, auth form, event log, retry UX.
7. **WebView owns:** SDK construction, camera via `getUserMedia`, callback forwarding via `postMessage`.
8. **Signed verification** comes from a **server webhook**, not the app. `onResult.unsignedToken` is for correlation/optimistic UI only.
9. After adding/removing WASM files, run `npm run generate-sdk-assets`.
10. **Retry** after failure: wait for `destroyed` bridge message → fetch **new** auth + **new** `transactionId` → send `start` to WebView again.

## Hard constraints (MUST NOT)

- Do **not** `import` / `require()` `headless-sdk.js` or `.bundle` in TypeScript/JavaScript — causes Metro/webpack `publicPath` errors.
- Do **not** load WebView from `file://` — use localhost static server (`useSdkServer.ts` pattern).
- Do **not** commit `*.wasm` or `headless-sdk.bundle` to public git repos.
- Do **not** call `destroy()` on HeadlessSDK — teardown is automatic via `conclude()` → `onDestroyed`.
- Do **not** store production `sessionPassword` in AsyncStorage (demo convenience only).
- Do **not** treat `unsignedToken` as cryptographic proof of age verification.
- Do **not** reuse a WebView session after `destroyed` without sending a fresh `start` with new auth.
- Do **not** put API secrets in committed source or env files.

## Canonical implementation

Study these files in order:

1. `assets/sdk/index.html` — SDK lifecycle (`runAgeCheck`, `buildSdkConfig`, `postToNative`)
2. `src/components/HeadlessSdkWebView.tsx` — RN → WebView `start`/`stop`, message parsing
3. `src/hooks/useSdkServer.ts` — asset copy + static server
4. `src/screens/AgeCheckScreen.tsx` — handling bridge messages in RN UI

```
Copy assets → start localhost server → load WebView at /index.html
     → hostReady → RN sends start(auth) → runAgeCheck() in WebView
     → callbacks postMessage to RN → onDestroyed → RN enables retry
```

## SDK assets setup

This repo excludes compiled binaries. Integrator must:

```bash
npm run copy-sdk-assets -- /path/to/headless-sdk/dist
npm run generate-sdk-assets
```

Before public git push: `npm run reset-sdk-assets-manifest`.

## Bridge protocol

### RN → WebView

```json
{ "type": "start", "auth": { "transactionId", "requestedAgeGate", "sessionId?", "sessionPassword?", "token?", "features": { "captureWithActiveLiveness", "passiveLiveness" } } }
{ "type": "stop" }
```

Sent via `injectJavaScript` dispatching a `message` event (see `HeadlessSdkWebView.tsx`).

### WebView → RN

| type | Agent should |
|------|----------------|
| `hostReady` | SDK constructor available; enable Start button |
| `ready` | `onReady` fired; show loading complete |
| `sessionStarted` | Transaction begun |
| `loadProgress` | Model loading indicator |
| `guidance` | Map `code` via `data/guidance-codes.*.json` |
| `liveness` | Map active liveness codes; `phase: 'failed'` is terminal |
| `state` | Pipeline state for progress UI |
| `result` | Forward `unsignedToken` + `transactionId` to backend |
| `warn` | Non-fatal; do not end session |
| `error` | Terminal; do not auto-retry without new auth |
| `destroyed` | Reset UI; enable retry; WebView stops camera |

## Auth modes (provide one)

**Option A — JWT token (production):** backend issues short-lived token; RN passes via bridge `auth.token`.

**Option B — Session credentials (demo/dev):** `sessionId` + `sessionPassword` from Privately.

JWT claim precedence: `jti` → transaction ID; `age` → age gate; `tmt` → timeout; `liv` → liveness flags.

## Platform requirements

| Platform | Requirement |
|----------|-------------|
| Android | `usesCleartextTraffic: true` for localhost; `CAMERA` permission |
| iOS | `NSCameraUsageDescription`; WebView camera grant |
| Metro | `assetExts` includes `wasm` and `bundle` |
| Dependencies | `react-native-webview`, `@dr.pogodin/react-native-static-server`, `expo-file-system`, `expo-asset` |

Apply `patches/@dr.pogodin+react-native-static-server+0.21.0.patch` (Expo file-system shim).

## Adapting to an existing app

1. Copy `useSdkServer.ts`, `HeadlessSdkWebView.tsx`, `types/sdk.ts`, `assets/sdk/index.html`.
2. Add dependencies and patch (see above).
3. Extend `metro.config.js` with `wasm` + `bundle` asset extensions.
4. Wire screen: `useSdkServer()` → `serverUrl` → `HeadlessSdkWebView` → `ref.start(auth)`.
5. Customize `index.html` only for camera constraints or in-WebView overlay.

## Definition of done

Complete every item in `CHECKLIST.md` before marking the integration finished.

## Further reading

- `README.md` — human-oriented setup and build
- `INTEGRATION_TASKS.md` — scenario prompts
- `ANTI_PATTERNS.md` — common agent mistakes
- Browser Integration pack — same HeadlessSDK API reference for callbacks and codes
