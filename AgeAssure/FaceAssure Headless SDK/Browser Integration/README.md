# Headless Age Estimation SDK — Browser Integration Guide

This folder contains a minimal browser integration you can use as a starting point. It demonstrates how to load the compiled SDK from a remote URL, authenticate a session, attach a camera feed, run an age check, and handle SDK callbacks in your own UI.

**You do not need the SDK source code.** Privately delivers a single JavaScript bundle (for example `headless-sdk.js`) hosted on a CDN. Your page loads that script and talks to the global `HeadlessSDK` constructor.

## Contents

| File | Purpose |
|---|---|
| `index.html` | Page layout, camera preview, and script tags |
| `rawdemoclient.js` | Integration logic — auth, SDK lifecycle, callbacks, camera handling |
| `README.md` | This guide |

Open `index.html` over **HTTPS** (or `localhost` during development). Camera access requires a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts).

---

## 1. Load the SDK bundle

In `index.html`, replace the placeholder CDN URL with the URL Privately provides for your environment:

```html
<script
  src="https://YOUR_CDN_HOST/path/to/headless-sdk.js"
  onerror="window.__headlessSdkBundleFailed = true"
></script>
<script src="rawdemoclient.js"></script>
```

The bundle registers a global constructor:

```javascript
const sdk = new HeadlessSDK({ /* config */ });
```

`rawdemoclient.js` polls until `window.HeadlessSDK` is available (see `waitForSdkConstructor`). If the script fails to load, the demo disables **Start** and shows an error.

**Browser requirements:** HTTPS, `getUserMedia`, WebAssembly, and a modern Chromium-, Safari-, or Firefox-based browser. Exact supported versions are provided in your onboarding materials.

---

## 2. What you build vs what the SDK does

### SDK responsibilities

- On-device age estimation from live video frames
- Capture guidance and liveness checks (configurable)
- Session authentication with Privately backends
- Diagnostics telemetry after each check
- An **unsigned** verification token in `onResult` (for correlation with server webhooks)

### Your responsibilities

- All visual design, copy, and localization
- Camera permission UX and `MediaStream` acquisition
- Mapping SDK **codes** (e.g. `MOVE_INTO_FRAME`) to user-facing strings
- Backend integration: issue credentials, receive signed webhooks, decide pass/fail for your product
- Retry after failure: **new** credentials + **new** `HeadlessSDK` instance per attempt

The SDK is **headless** — it emits structured events; it does not render UI.

---

## 3. Integration flow

The demo in `rawdemoclient.js` follows this sequence:

```
Load bundle → new HeadlessSDK(config) → ready() → getUserMedia() → attachVideo() → start() → getResult()
                                                                                              ↓
                                                                    callbacks fire during pipeline
                                                                                              ↓
                                                                    onDestroyed (session ended)
```

### Step-by-step (see `runAgeCheck` in `rawdemoclient.js`)

1. **Validate auth** — session ID + password, or a JWT token (see §4).
2. **Construct the SDK** — `new HeadlessSDK(buildSdkConfig(auth))` with all callbacks registered in the config object.
3. **`await sdk.ready()`** — authentication, regional endpoint selection, and model loading complete. Use `onLoadProgress` for a loading indicator.
4. **Acquire camera** — `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', … } })`.
5. **Attach media** — `await sdk.attachVideo(videoElement)` (or `attachStream(mediaStream)` if you prefer).
6. **`await sdk.start()`** — analysis begins; guidance and liveness callbacks update your UI.
7. **`await sdk.getResult()`** — resolves when the check finishes successfully.
8. **`onDestroyed`** — always fired after internal teardown; stop camera tracks and re-enable your UI. Use **Retry** to start a new transaction.

### One instance per transaction

Each age check needs a **fresh** `HeadlessSDK` instance. After success, failure, timeout, or user cancel, the SDK tears itself down. Do not reuse instances or call `ready()` again on the same object.

---

## 4. Authentication

Provide **one** of the following when constructing the SDK.

### Option A — Session credentials

Your backend obtains an API key and secret from Privately. The browser passes them to the SDK:

```javascript
{
  sessionId: 'YOUR_API_KEY',
  sessionPassword: 'YOUR_API_SECRET',
  transactionId: 'unique-id-per-attempt',  // optional; auto-generated if omitted
}
```

During `ready()`, the SDK exchanges these with Privately and receives session-scoped material for the check.

### Option B — Pre-issued JWT token

Your backend performs the handshake and passes a short-lived token to the browser:

```javascript
{
  token: 'eyJhbGciOiJIUzI1NiIs…',
  transactionId: 'optional-if-jti-in-token',
}
```

If the JWT contains a `jti` claim, it is used as the transaction ID.

**JWT notes (when using tokens):**

| Claim | Effect |
|---|---|
| `jti` | Transaction ID for callbacks and verification |
| `age` | Requested age gate if not set in config |
| `liv: false` | Disables active and passive liveness for that session (this can't be configured automatically on your end; contact Privately for more details) |
| `iss` | URL of your RS256 public key (required for webhook verification) |

The demo toggles between session and token modes via radio buttons and persists values in `localStorage` for convenience only — **do not store production secrets in localStorage**.

---

## 5. Configuration highlights

The demo builds config in `buildSdkConfig()`:

```javascript
{
  transactionId: auth.transactionId,
  requestedAgeGate: 25,           // 0, 16, 21, or 25

  features: {
    captureWithActiveLiveness: true,   // mouth-open / smile challenge
    passiveLiveness: true,             // passive anti-spoof (default on)
  },

  // Session credentials OR token — see §4
  sessionId: '…',
  sessionPassword: '…',
  // token: '…',

  onLoadProgress: (event) => { /* event.module, event.progress, event.status */ },
  onReady: () => {},
  onGuidance: (event) => { /* event.code, event.severity */ },
  onLiveness: (event) => { /* event.code, event.phase, event.module */ },
  onState: (event) => { /* event.previous, event.current */ },
  onResult: (result) => {},
  onTelemetry: (event) => { /* event.phase */ },
  onError: (error) => { /* error.code, error.message, error.recoverable */ },
  onWarn: (warning) => {},
  onDestroyed: (event) => { /* event.reason, event.transactionId */ },
}
```

### Feature flags

| Flag | Default | Meaning |
|---|---|---|
| `features.captureWithActiveLiveness` | `false` | When `true`, runs the active liveness challenge before age estimation. |
| `features.passiveLiveness` | `true` | When `false`, skips passive liveness. Set to `false` to opt out. |

Age estimation and telemetry are always enabled in the headless bundle.

---

## 6. Callbacks and UI mapping

Register callbacks on the constructor (there is no separate `.on()` API).

### `onGuidance` — pose, lighting, distance

The SDK emits stable string **codes**. Map them to your copy — the demo uses `GUIDANCE_COPY` in `rawdemoclient.js`:

| Code | Suggested user message (demo) |
|---|---|
| `MOVE_INTO_FRAME` | Position your face in the frame |
| `FACE_TOO_CLOSE` | Move back a little |
| `FACE_TOO_FAR` | Move closer |
| `IMAGE_NOT_BRIGHT_ENOUGH` | Find better lighting |
| `IMAGE_TOO_BLURRY` | Clean camera lens |
| `VALID_CAPTURE_STATE` | Hold steady |
| … | See `GUIDANCE_COPY` for the full list |

`event.severity` is `info`, `warning`, or `blocking`.

### `onLiveness` — active and passive liveness

| `event.phase` | When |
|---|---|
| `instruction` | New active liveness step (e.g. `OPEN_YOUR_MOUTH`) |
| `in_progress` | Ongoing liveness feedback |
| `completed` | Liveness segment finished |
| `failed` | Liveness failed — prepare retry with new auth + new instance |

`event.module` is `active` or `passive`.

### `onState` — pipeline stage

`event.current` values include `IDLE`, `WAITING_FOR_FACE`, `LIVENESS`, `IMAGE_QUALITY`, `FACE_ORIENTATION`, `INFERENCE`, `SUBMITTING`, `RESULT_READY`, `TIMEOUT`, `ERROR`. Use these for step indicators or progress UI.

### `onResult` — age outcome

```javascript
{
  status: 'success' | 'failure',
  transactionId: '…',
  minAge: number,
  maxAge: number,
  gate: number,
  ageIdentified: boolean,
  confidence: number | null,
  unsignedToken: string | null,  // correlate with Privately webhook
  claims: object | null,
}
```

The **signed** verification JWT is delivered to your **server** via webhook, not in the browser. Send `unsignedToken` / `transactionId` to your backend so it can match the webhook.

### `onError` / `onWarn`

- **`onError`** — `error.recoverable === true` for cases like `MULTIPLE_FACES_DETECTED` where the user can adjust and continue.
- **`onWarn`** — non-fatal media readiness (e.g. stream attached but frames not ready yet).

### `onDestroyed` — session ended

| `event.reason` | Typical meaning |
|---|---|
| `success` | Check completed successfully |
| `failure` | Check ended without success |
| `liveness_failed` | Liveness did not pass |
| `timeout` | `processTimeoutMs` exceeded (default 120 s) |
| `user_cancelled` | `stop()` was called |
| `error` | Unexpected terminal error |

Stop `MediaStream` tracks here. To retry, create a **new** `HeadlessSDK` with **new** credentials.

### `onTelemetry`

Phases such as `preparing`, `sending`, `acknowledged`, `failed`. Useful for hiding loaders after diagnostics are sent. You do not need to implement telemetry POSTs yourself.

---

## 7. Media and preview

The demo binds the same stream to a `<video>` element for preview and passes that element to the SDK:

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
});
videoElement.srcObject = stream;
await sdk.attachVideo(videoElement);
```

Alternatively, use `attachStream(stream)` if you manage the video element separately.

**Stopping the camera** is your job — the SDK does not stop tracks:

```javascript
stream.getTracks().forEach((track) => track.stop());
```

The demo calls `stopCameraStream()` from `onDestroyed` and when the user clicks **Stop**.

---

## 8. Session control

| Method | Description |
|---|---|
| `ready()` | Wait for auth and module loading |
| `attachVideo(el)` / `attachStream(stream)` | Bind camera input |
| `start()` | Begin the pipeline |
| `stop()` | User cancel → teardown → `onDestroyed` |
| `getResult()` | Promise that resolves with the age result on success |
| `pause()` / `resume()` | Pause or resume frame processing |
| `detach()` | Unbind media without stopping camera tracks |

Call `start()` only after `ready()` resolves and media is attached.

---

## 9. Retry pattern

After liveness failure, timeout, or non-recoverable error:

1. Wait for `onDestroyed`.
2. Request **new** authentication from your backend (new `transactionId` or new token).
3. `new HeadlessSDK({ … })` — do not reuse the old instance.
4. Run `ready()` → attach → `start()` again.

The demo **Retry with new session** button calls `runAgeCheck()` again, which creates a new instance and a new `transactionId` (`demo_tx_` + timestamp).

---

## 10. Adapting this demo for production

1. **Replace the CDN URL** in `index.html` with your environment-specific bundle URL.
2. **Remove demo-only storage** — fetch tokens from your backend instead of form fields / `localStorage`.
3. **Replace the demo UI** — keep the lifecycle in `runAgeCheck()`; wire callbacks to your components.
4. **Implement webhook handling** on your server for signed verification JWTs.
5. **Localize** `GUIDANCE_COPY` (or equivalent) for each supported locale.
6. **Serve over HTTPS** in production.

### Minimal production skeleton

```javascript
async function runAgeCheck(authFromBackend) {
  const sdk = new HeadlessSDK({
    token: authFromBackend.token,
    transactionId: authFromBackend.transactionId,
    requestedAgeGate: 25,
    features: { captureWithActiveLiveness: false, passiveLiveness: true },
    onGuidance: ({ code }) => updateHint(GUIDANCE_COPY[code] ?? code),
    onResult: (result) => sendUnsignedTokenToBackend(result),
    onDestroyed: ({ reason }) => cleanupCamera(reason),
    // …other callbacks
  });

  await sdk.ready();
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  await sdk.attachStream(stream);
  await sdk.start();
  return sdk.getResult();
}
```

---

## 11. Troubleshooting

| Symptom | Check |
|---|---|
| “HeadlessSDK did not become available” | CDN URL, CORS, script blocked by CSP, network |
| “Could not load … headless-sdk.js” | `onerror` on script tag — verify URL and deployment |
| Camera never starts | HTTPS, permissions, another app using the camera |
| `AUTHENTICATION_FAILED` on `ready()` | Credentials, token expiry, clock skew |
| `INVALID_STATE` on `start()` | Call `ready()` and attach media first |
| No `onResult` | Check `onError`, `onDestroyed`, and `getResult()` rejection |
| Retry does nothing | Ensure a **new** `HeadlessSDK` instance per attempt |

---

## 12. Further reference

Privately provides a full API reference (callbacks, error codes, JWT claims, webhook schema, and `rsn` completion reasons) separately from this bundle. Use this README and the demo sources together as the browser integration starting point.

For questions about CDN URLs, credentials, or webhook setup, contact your Privately integration contact.
