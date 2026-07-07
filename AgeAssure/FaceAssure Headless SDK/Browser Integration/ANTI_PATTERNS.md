# FaceAssure Headless SDK — Anti-Patterns

Agents integrating this SDK frequently make the mistakes below. **Do not implement these.**

## Instance & lifecycle

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Reusing `HeadlessSDK` after `onDestroyed` | Instance is invalid; crypto material wiped; throws `INSTANCE_DESTROYED` |
| Calling `ready()` again on the same instance for a new check | One instance = one transaction |
| Skipping `onDestroyed` before starting retry | Camera stays on; stale state; race conditions |
| Calling `start()` before `attachVideo` / `attachStream` | Throws `INVALID_STATE` |
| Calling `destroy()` manually | Not part of public API; use `stop()` or let session end naturally |

## Security

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Storing `sessionPassword` in frontend / localStorage | Credential leak |
| Treating `unsignedToken` as proof of age | Unsigned; webhook JWT is authoritative |
| Skipping webhook signature verification | Forged results possible |
| Hardcoding Privately API secrets in client code | Credential leak |

## UX & callbacks

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Showing raw SDK codes to end users (`FACE_TOO_FAR`) | Codes are locale-neutral machine strings |
| Using `onError` for `MULTIPLE_FACES_DETECTED` | Use `onWarn`; session continues |
| Ignoring `onWarn` media readiness codes | User sees blank preview with no feedback |
| Auto-retrying inside `onError` without new auth | Same transaction invalid; must wait for `onDestroyed` + new instance |
| Ending session on every `onGuidance` warning | Warnings are continuous feedback, not failures |

## Architecture

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Browser redirect after check (`window.location = rdr`) | Headless SDK uses callbacks + server webhook, not redirect |
| Expecting signed JWT in `onResult` | Signed JWT delivered to **server webhook** only |
| Implementing telemetry POST yourself | SDK sends diagnostics automatically |
| Bundling / tree-shaking the SDK source | Use the prebuilt CDN bundle from Privately |

## Framework-specific

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Creating SDK in render body without cleanup | Leaks instances; call from event handler; cleanup in `onDestroyed` |
| Unmounting component without `stop()` or waiting for `onDestroyed` | Orphaned camera stream |
| Sharing one SDK instance across routes/tabs | One instance per transaction per tab |

## Auth

| Anti-pattern | Why it breaks |
|--------------|---------------|
| Ignoring JWT `age` claim precedence | JWT `age` overrides `requestedAgeGate` in config |
| Reusing `jti` across retry attempts | Replay / correlation errors |
| Passing expired JWT to browser | `AUTHENTICATION_FAILED` on `ready()` |
