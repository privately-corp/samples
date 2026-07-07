# FaceAssure Headless SDK — React Native Anti-Patterns

Agents integrating this SDK in React Native frequently make the mistakes below. **Do not implement these.**

## React Native & Metro

| Anti-pattern | Why it breaks |
|--------------|---------------|
| `import` / `require()` of `headless-sdk.js` or `.bundle` | Metro bundles it as JS; webpack `publicPath` crash |
| Loading WebView from `file://` | Camera + WASM fail; no secure context |
| Skipping `npm run generate-sdk-assets` after adding WASM | Metro missing modules; build fails |
| Committing `*.wasm` / `.bundle` to public git | Exposes proprietary SDK binaries |
| Using `headless-sdk.js` extension in `assets/sdk/` | Metro treats as JS module — use `.bundle` |

## WebView & bridge

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Calling `start()` before `serverUrl` is ready | WebView loads blank; bridge silent |
| Parsing bridge messages without try/catch | Malformed messages crash RN |
| Ignoring `destroyed` before retry | Stale WebView state; camera may stay on |
| Putting all UI inside WebView only | Defeats headless pattern; RN should own UX |
| Skipping `mediaCapturePermissionGrantType="grant"` | Camera permission blocked in WebView |

## Instance & lifecycle (inside WebView)

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Reusing `HeadlessSDK` after `onDestroyed` | Instance invalid; `INSTANCE_DESTROYED` |
| Sending `start` again without new auth after failure | Same transaction invalid |
| Skipping `onDestroyed` before retry | Race conditions; camera leaks |
| Calling `start()` before `attachVideo` | `INVALID_STATE` |
| Calling `destroy()` manually | Not public API; use `stop()` |

## Security

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Storing `sessionPassword` in AsyncStorage (production) | Credential leak |
| Treating `unsignedToken` as proof of age | Unsigned; webhook JWT is authoritative |
| Skipping webhook signature verification | Forged results possible |
| Hardcoding API secrets in RN source | Credential leak |

## UX & callbacks

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Showing raw SDK codes to users (`FACE_TOO_FAR`) | Codes are machine strings; map via `data/guidance-codes.*.json` |
| Using `error` bridge message for `MULTIPLE_FACES_DETECTED` | Use `warn`; session continues |
| Auto-retrying on `error` without new auth | Must wait for `destroyed` + new instance |
| Ending session on every `guidance` warning | Warnings are continuous feedback |

## Architecture

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Trying to run HeadlessSDK natively in RN (no WebView) | SDK requires browser APIs + WASM |
| Expecting signed JWT in `result` bridge message | Signed JWT delivered to **server webhook** only |
| Bundling SDK source with webpack in RN app | Use prebuilt dist from Privately |
| Removing localhost static server | WebView cannot load WASM from arbitrary paths reliably |

## Framework-specific

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Creating SDK start in render without guards | Multiple sessions; race conditions |
| Unmounting WebView mid-session without `stop()` | Orphaned camera in WebView process |
| Sharing one WebView host across multiple concurrent checks | One instance per transaction |

## Auth

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Ignoring JWT `age` claim precedence | JWT `age` overrides `requestedAgeGate` |
| Reusing `transactionId` across retries | Replay / correlation errors |
| Passing expired JWT | `AUTHENTICATION_FAILED` on `ready()` |
