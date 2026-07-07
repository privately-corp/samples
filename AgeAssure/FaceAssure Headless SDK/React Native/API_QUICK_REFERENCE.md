# FaceAssure Headless SDK — React Native API Quick Reference

**Version:** `v1.10.32`  
**Pattern:** Browser bundle (`HeadlessSDK`) inside WebView, served from on-device localhost

---

## React Native setup

### SDK assets (not in git)

| File | Notes |
|------|-------|
| `assets/sdk/headless-sdk.bundle` | Rename from `headless-sdk.js` |
| `assets/sdk/*.wasm` | All WASM from SDK dist |
| `assets/sdk/index.html` | Provided by sample |

```bash
npm run copy-sdk-assets -- /path/to/headless-sdk/dist
npm run generate-sdk-assets
```

### Metro

```javascript
// metro.config.js
config.resolver.assetExts.push('wasm', 'bundle');
```

### Android (`app.json`)

```json
{ "expo-build-properties": { "android": { "usesCleartextTraffic": true } } }
```

Permissions: `CAMERA`, `INTERNET`. iOS: `NSCameraUsageDescription`.

---

## RN ↔ WebView bridge

### RN → WebView

```typescript
// HeadlessSdkWebView ref methods
ref.start(auth: AuthConfig);  // → { type: 'start', auth: SdkAuthPayload }
ref.stop();                    // → { type: 'stop' }
```

`SdkAuthPayload` (`src/types/sdk.ts`):

```typescript
{
  transactionId: string;
  requestedAgeGate: number | null;
  sessionId?: string;
  sessionPassword?: string;
  token?: string;
  features: {
    captureWithActiveLiveness: boolean;
    passiveLiveness: boolean;
  };
}
```

### WebView → RN (`SdkBridgeMessage`)

| type | Payload |
|------|---------|
| `hostReady` | — |
| `ready` | — |
| `sessionStarted` | `{ transactionId }` |
| `loadProgress` | `{ module, progress }` |
| `guidance` | `{ code, severity? }` |
| `liveness` | `{ phase, code }` |
| `state` | `{ previous, current }` |
| `result` | `{ result: AgeCheckResult }` |
| `telemetry` | `{ phase }` |
| `warn` | `{ code, message }` |
| `error` | `{ code, message }` |
| `destroyed` | `{ reason }` |
| `log` | `{ message }` |

### WebView required props

```tsx
javaScriptEnabled
domStorageEnabled
allowsInlineMediaPlayback
mediaCapturePermissionGrantType="grant"
mixedContentMode="always"
originWhitelist={['*']}
```

---

## HeadlessSDK (inside WebView)

Same API as browser integration. Global `HeadlessSDK` loaded from `./headless-sdk.js` in `index.html`.

### Constructor config

```javascript
new HeadlessSDK({
  token: 'eyJ…',                    // OR sessionId + sessionPassword
  transactionId: 'tx_' + Date.now(),
  requestedAgeGate: 25,             // 0 | 16 | 21 | 25
  features: {
    captureWithActiveLiveness: false,
    passiveLiveness: true,
  },
  onLoadProgress, onReady, onGuidance, onLiveness, onState,
  onResult, onTelemetry, onWarn, onError, onDestroyed,
})
```

### Lifecycle methods

| Method | When |
|--------|------|
| `await sdk.ready()` | After construct; before `start()` |
| `await sdk.attachVideo(videoElement)` | Bind camera preview `<video>` |
| `await sdk.attachStream(stream)` | Bind `MediaStream` |
| `await sdk.start()` | Begin pipeline |
| `await sdk.getResult()` | Resolves when transaction concludes |
| `sdk.stop()` | User cancel → `onDestroyed` |

**Order:** `ready()` → attach → `start()` → `getResult()`

---

## Callback payloads (SDK → forwarded to RN)

### `onGuidance`

```typescript
{ code: string; category: 'pose' | 'quality' | 'presence'; severity: 'info' | 'warning' }
```

Codes: `MOVE_INTO_FRAME`, `FACE_TOO_CLOSE`, `FACE_TOO_FAR`, `HEAD_TOO_*`, `IMAGE_NOT_BRIGHT_ENOUGH`, `IMAGE_TOO_BLURRY`, `VALID_CAPTURE_STATE`, etc.

### `onLiveness`

```typescript
{ code: string; phase: 'instruction' | 'in_progress' | 'completed' | 'failed'; module: 'active' | 'passive' }
```

`phase: 'failed'` → session ends; retry with new auth + new instance.

### `onResult`

```typescript
{
  status: 'success' | 'failure';
  transactionId: string;
  minAge: number | null;
  maxAge: number | null;
  ageIdentified: string | null;
  unsignedToken: string | null;
}
```

### `onWarn`

| Code | Meaning |
|------|---------|
| `MEDIA_STREAM_NOT_AVAILABLE` | No usable video track |
| `AWAITING_MEDIA_READY` | Stream attached, frames not ready |
| `MULTIPLE_FACES_DETECTED` | >1 face; clears when resolved |

### `onError` (terminal)

`PRESENTATION_ATTACK_DETECTED`, `VIRTUAL_CAMERA_DETECTED`, `PASSIVE_LIVENESS_ATTACK_DETECTED`, `INFERENCE_FAILED`, `PROCESS_TIMEOUT`, `AUTHENTICATION_FAILED`, `BACKEND_ERROR`, `MODEL_LOAD_FAILED`, `UNSUPPORTED_ENVIRONMENT`

### `onDestroyed`

```typescript
{ reason: 'success' | 'failure' | 'timeout' | 'user_cancelled' | 'liveness_failed' | 'error' }
```

---

## Verification tokens

- App receives **unsigned** JWT in `result.unsignedToken` (correlation only).
- Server receives **signed** RS256 JWT via **webhook** (authoritative).
- Match sessions using `jti` / `transactionId`.
- Privately public key: `https://cdn.jsdelivr.net/gh/privately-corp/privately-public-keys@latest/general/faceassure_public_rsa256.pem`

---

## Gate derivation (from `minAge`)

| minAge | gate | ageIdentified |
|--------|------|---------------|
| &lt; 16 | 0 | `'<16'` |
| 16–20.99 | 16 | `'16.0-21.0'` |
| 21–24.99 | 21 | `'21+'` |
| ≥ 25 | 25 | `'25+'` |
