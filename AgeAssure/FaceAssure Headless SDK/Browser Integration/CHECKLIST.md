# FaceAssure Headless SDK — Integration Checklist

Use this list to verify a browser integration is complete. AI agents should not mark the task done until all applicable items pass.

## Environment

- [ ] Page served over **HTTPS** or **localhost** (not `file://`)
- [ ] CDN script URL points to the bundle Privately provided for this environment
- [ ] `window.HeadlessSDK` is a function after script load
- [ ] Correct bundle variant selected if targeting Safari 14 or CEF 74

## Authentication

- [ ] Production uses **JWT token** from your backend (not session credentials in the browser)
- [ ] Each attempt uses a **unique** `transactionId` / `jti`
- [ ] No API secrets in frontend source, git, or `localStorage`
- [ ] Token expiry (`exp` / `nbf`) handled server-side before passing to browser

## Lifecycle

- [ ] `new HeadlessSDK(config)` created per attempt
- [ ] `await sdk.ready()` completes before `start()`
- [ ] Camera acquired via `getUserMedia` before or after `ready()` (both valid)
- [ ] Media attached via `attachVideo` or `attachStream` before `start()`
- [ ] `await sdk.start()` called after attach
- [ ] `onDestroyed` always fires at session end
- [ ] Camera tracks stopped in `onDestroyed`
- [ ] Retry creates a **new** instance with **new** auth (never reuses old instance)

## UI & callbacks

- [ ] All `onGuidance` codes mapped to localized strings (via `data/guidance-codes.*.json` or equivalent)
- [ ] `onLiveness` instruction codes mapped for active liveness UI
- [ ] `onWarn` handled for `MULTIPLE_FACES_DETECTED` and media readiness (non-blocking)
- [ ] `onError` shown for terminal failures
- [ ] `onResult` displays or forwards outcome to backend
- [ ] `onDestroyed` resets UI and re-enables retry
- [ ] User can cancel via `sdk.stop()` (wired to a button)

## Backend & verification

- [ ] Backend endpoint issues short-lived JWT (or proxies session handshake)
- [ ] Browser POSTs `transactionId` + `unsignedToken` to backend on `onResult` (optional but recommended)
- [ ] Webhook handler verifies RS256 signature with Privately public key
- [ ] Webhook `jti` matched to in-flight browser session
- [ ] Access control decisions use **signed webhook JWT**, not `unsignedToken`

## Security

- [ ] CSP allows SDK CDN script and required WASM/worker sources
- [ ] No logging of tokens, session passwords, or JWTs in analytics
- [ ] Webhook URL registered via JWT `rdr` claim (per Privately onboarding)

## Manual smoke test

- [ ] Successful age check: `onResult.status === 'success'`, `onDestroyed.reason === 'success'`
- [ ] Stop button: `onDestroyed.reason === 'user_cancelled'`, camera off
- [ ] Retry after session: new transaction, no errors about `INSTANCE_DESTROYED`
- [ ] Multiple faces in frame: `onWarn` with `MULTIPLE_FACES_DETECTED`, clears when one face remains
