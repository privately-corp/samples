# FaceAssure Headless SDK — API Quick Reference

**Version:** `v1.10.32`  
**Global:** `window.HeadlessSDK` (CDN bundle)

## Load

```html
<script src="https://YOUR_CDN_HOST/path/to/headless-sdk.js"></script>
<script>
  const sdk = new HeadlessSDK({ /* config — see below */ });
</script>
```

### Bundle variants

| File | Use when |
|------|----------|
| `headless-sdk.js` | Default — modern Chrome, Firefox, Edge, Safari 15+ |
| `headless-sdk-safari14.js` | Safari 14 / legacy WebKit |
| `headless-sdk-cef74.js` | Chromium Embedded Framework 74 (game engine WebViews) |

### Browser requirements

Chrome, Safari, Firefox, Edge, Opera — secure context (`https:` or `localhost`), `MediaStream`, `HTMLVideoElement`, WebAssembly.

Unsupported engines emit `onError` with code `UNSUPPORTED_ENVIRONMENT`.

---

## Constructor config

```javascript
new HeadlessSDK({
  // Auth — one of:
  token: 'eyJ…',
  // sessionId: '…',
  // sessionPassword: '…',

  transactionId: 'tx_' + Date.now(),  // optional; JWT jti wins
  requestedAgeGate: 25,               // 0 | 16 | 21 | 25; JWT age wins

  features: {
    captureWithActiveLiveness: false,  // default false
    passiveLiveness: true,             // default true
  },

  processTimeoutMs: 120_000,  // default; JWT tmt (seconds) wins

  // Callbacks — all optional but strongly recommended:
  onLoadProgress, onReady, onGuidance, onLiveness, onState,
  onResult, onTelemetry, onWarn, onError, onDestroyed,
})
```

---

## Lifecycle methods

| Method | When |
|--------|------|
| `await sdk.ready()` | After construct; before `start()`. Loads models + auth handshake. |
| `await sdk.attachStream(stream, { mirrored?: boolean })` | Bind `MediaStream` |
| `await sdk.attachVideo(videoElement)` | Bind existing `<video>` |
| `await sdk.start()` | Begin pipeline (calls `ready()` internally) |
| `await sdk.getResult()` | Resolves when transaction concludes |
| `sdk.stop()` | User cancel → teardown → `onDestroyed` |
| `sdk.pause()` / `sdk.resume()` | Pause/resume frame processing |
| `sdk.detach()` | Unbind media; does not stop tracks |

**Order:** `ready()` → attach → `start()` → `getResult()`  
**Errors:** `INVALID_STATE`, `INSTANCE_DESTROYED`, `AUTHENTICATION_FAILED`, `MODEL_LOAD_FAILED`

---

## Callback payloads

### `onGuidance`

```typescript
{ code: string; category: 'pose' | 'quality' | 'presence'; severity: 'info' | 'warning'; timestamp: number }
```

| Code | Category |
|------|----------|
| `MOVE_INTO_FRAME` | presence |
| `FACE_TOO_CLOSE`, `FACE_TOO_FAR`, `HEAD_TOO_*`, `HEAD_TILTED_*`, `VALID_CAPTURE_STATE` | pose |
| `IMAGE_NOT_BRIGHT_ENOUGH`, `IMAGE_TOO_BLURRY`, `IMAGE_QUALITY_SUFFICIENT` | quality |

### `onLiveness`

```typescript
{ code: string; phase: 'instruction' | 'in_progress' | 'completed' | 'failed'; module: 'active' | 'passive'; attempt: number; timestamp: number }
```

| Code | Module |
|------|--------|
| `OPEN_YOUR_MOUTH`, `KEEP_YOUR_MOUTH_OPEN`, `CLOSE_YOUR_MOUTH` | active |
| `LIVENESS_CHECK_COMPLETED` | active |
| `PASSIVE_LIVENESS_ATTACK_DETECTED` | passive |

`phase: 'failed'` → session ends; retry with new instance.

### `onState`

```typescript
{ previous: string; current: string; timestamp: number }
```

States: `IDLE`, `WAITING_FOR_FACE`, `LIVENESS`, `IMAGE_QUALITY`, `FACE_ORIENTATION`, `INFERENCE`, `SUBMITTING`, `RESULT_READY`, `TIMEOUT`, `ERROR`.

### `onResult`

```typescript
{
  status: 'success' | 'failure';
  transactionId: string;
  minAge: number | null;
  maxAge: number | null;
  gate: 0 | 16 | 21 | 25 | null;
  ageIdentified: '<16' | '16.0-21.0' | '21+' | '25+' | null;
  confidence: number | null;
  unsignedToken: string | null;
  claims: object | null;
}
```

### `onWarn`

```typescript
{ source: 'frontend'; code: string; message: string }
```

| Code | Meaning |
|------|---------|
| `MEDIA_STREAM_NOT_AVAILABLE` | No usable video track |
| `AWAITING_MEDIA_READY` | Stream attached, frames not ready |
| `MULTIPLE_FACES_DETECTED` | >1 confident face; clears when resolved |

### `onError`

```typescript
{ source: 'frontend' | 'backend' | 'liveness' | 'inference' | 'telemetry'; code: string; message: string; recoverable: boolean }
```

| Code | Terminal |
|------|----------|
| `PRESENTATION_ATTACK_DETECTED` | Yes |
| `VIRTUAL_CAMERA_DETECTED` | Yes |
| `PASSIVE_LIVENESS_ATTACK_DETECTED` | Yes |
| `INFERENCE_FAILED` | Yes |
| `PROCESS_TIMEOUT` | Yes |
| `AUTHENTICATION_FAILED` | Yes |
| `BACKEND_ERROR` | Yes |
| `UNSUPPORTED_ENVIRONMENT` | Yes |

### `onDestroyed`

```typescript
{ transactionId: string; reason: 'success' | 'failure' | 'timeout' | 'user_cancelled' | 'liveness_failed' | 'error'; timestamp: number }
```

### `onTelemetry`

```typescript
{ phase: 'preparing' | 'sending' | 'acknowledged' | 'failed'; transactionId: string; error?: { code: string; message: string } }
```

---

## Verification tokens

- Browser receives **unsigned** JWT in `onResult.unsignedToken` (correlation only).
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
