# FaceAssure Headless SDK — Agent Integration Brief

**SDK version:** `v1.10.32`  
**Audience:** AI coding agents (Cursor, Copilot, Claude Code, Windsurf, Continue, etc.)

## What this folder is

A **reference browser integration** for the Privately FaceAssure Headless SDK. Clients load a CDN bundle and integrate via the global `HeadlessSDK` constructor. They do **not** need the SDK source code.

| File | Role |
|------|------|
| `rawdemoclient.js` | **Canonical lifecycle** — `runAgeCheck()`, `buildSdkConfig()`, callback wiring |
| `index.html` | Minimal demo page (script tags, preview `<video>`) |
| `API_QUICK_REFERENCE.md` | Condensed API contract (codes, config, lifecycle) |
| `INTEGRATION_TASKS.md` | Copy-paste prompts per integration scenario |
| `CHECKLIST.md` | Definition of done / acceptance tests |
| `ANTI_PATTERNS.md` | Mistakes agents must avoid |
| `data/*.json` | Locale-neutral code → default user-facing copy |

## Hard constraints (MUST)

1. Load the SDK from the CDN URL Privately provides (`headless-sdk.js` or a variant — see API reference).
2. Run only on **HTTPS** or **localhost** (secure context required for camera + crypto).
3. Use **one `new HeadlessSDK()` per age-check attempt**. After `onDestroyed`, the instance is invalid.
4. Follow lifecycle order: **`ready()` → attach media → `start()` → `getResult()`**.
5. Register all callbacks on the **constructor config** (no `.on()` / `.off()` API).
6. **Client owns:** all UI, localization, camera permission UX, stopping `MediaStream` tracks.
7. **Signed verification** comes from a **server webhook**, not the browser. `onResult.unsignedToken` is for correlation/optimistic UI only.
8. **Retry** after failure: wait for `onDestroyed` → fetch **new** auth/token + **new** `transactionId` → `new HeadlessSDK({ … })`.

## Hard constraints (MUST NOT)

- Do **not** call `destroy()` — it is not public; teardown is automatic via `conclude()` → `onDestroyed`.
- Do **not** store production `sessionPassword` or long-lived secrets in `localStorage` (demo only).
- Do **not** treat `unsignedToken` as cryptographic proof of age verification.
- Do **not** reuse or reconfigure a `HeadlessSDK` instance after `onDestroyed`.
- Do **not** implement browser **redirect** return flows (`window.location`, `rdr` navigation) — headless uses callbacks + webhook.
- Do **not** put API secrets in frontend source or committed env files.

## Canonical implementation

Mirror the flow in `rawdemoclient.js`:

```
Load bundle → new HeadlessSDK(config) → ready() → getUserMedia() → attachVideo() → start() → getResult()
                                                                                              ↓
                                                                    callbacks during pipeline
                                                                                              ↓
                                                                    onDestroyed (always)
```

Key functions to study:

- `buildSdkConfig(auth)` — constructor options and callbacks
- `runAgeCheck()` — full session lifecycle
- `stopCameraStream()` — called from `onDestroyed`
- `waitForSdkConstructor()` — poll until `window.HeadlessSDK` exists

## Auth modes (provide one)

**Option A — JWT token (production):** backend issues short-lived token; browser passes `token` in config.

**Option B — Session credentials (demo/dev):** `sessionId` + `sessionPassword` from Privately.

JWT claim precedence:

| Claim | Effect |
|-------|--------|
| `jti` | Transaction ID (overrides `config.transactionId`) |
| `age` | Requested age gate (overrides `config.requestedAgeGate`) |
| `tmt` | Timeout in seconds (overrides `config.processTimeoutMs`) |
| `liv: false` | Disables liveness (server may block; contact Privately) |
| `iss` | Your RS256 public key URL (webhook verification) |
| `rdr` | Webhook URL for signed result delivery |

## Callback responsibilities

| Callback | Agent should |
|----------|----------------|
| `onGuidance` | Map `event.code` → localized string via `data/guidance-codes.*.json` |
| `onLiveness` | Map active liveness codes; handle `phase: 'failed'` as terminal |
| `onWarn` | Show non-fatal hints (`MULTIPLE_FACES_DETECTED`, media readiness); clears automatically |
| `onError` | Show terminal errors; do not auto-retry without new instance |
| `onResult` | Display outcome; POST `transactionId` + `unsignedToken` to your backend |
| `onDestroyed` | Stop camera tracks, reset UI, enable retry |
| `onTelemetry` | Optional loader UX (`acknowledged` / `failed`) |

## Adapting to a framework (React, Vue, etc.)

- Preserve the **lifecycle** from `runAgeCheck()`; move state into components/hooks.
- Keep SDK instance in a ref; set to `null` in `onDestroyed`.
- Do not mount/unmount the SDK wrapper in ways that skip `onDestroyed` cleanup.
- Map codes through JSON lookup tables; do not inline user-facing strings in callback bodies.

## Definition of done

Complete every item in `CHECKLIST.md` before marking the integration finished.

## Further reading

- `README.md` — human-oriented integration guide
- `INTEGRATION_TASKS.md` — scenario prompts
- `ANTI_PATTERNS.md` — common agent mistakes
- Full API reference — provided by Privately (Confluence / onboarding)
