# FaceAssure Headless SDK — Integration Task Prompts

Copy a prompt below into your AI IDE. Replace placeholders (`<CDN_URL>`, `<YOUR_APP>`, etc.) before sending.

**Before any task:** ask the agent to read `AGENTS.md`, `API_QUICK_REFERENCE.md`, and `rawdemoclient.js` in this folder.

---

## 1. Greenfield vanilla JavaScript

```
Integrate the Privately FaceAssure Headless SDK into <YOUR_APP>.

Read these files first (in the Browser Integration pack):
- AGENTS.md
- API_QUICK_REFERENCE.md
- rawdemoclient.js (canonical lifecycle: runAgeCheck, buildSdkConfig)

Requirements:
1. Load the SDK from <CDN_URL> via a <script> tag; use global HeadlessSDK.
2. Fetch a short-lived JWT from GET /api/age-check/session on my backend (create a minimal stub route if missing).
3. Implement lifecycle: ready() → getUserMedia → attachVideo → start() → getResult().
4. Map onGuidance and onLiveness codes to user strings using data/guidance-codes.en.json.
5. Handle onWarn (MULTIPLE_FACES_DETECTED, media readiness) without ending the session.
6. On onResult, POST transactionId and unsignedToken to /api/age-check/pending for webhook correlation.
7. On onDestroyed, stop MediaStream tracks and reset UI for retry.
8. Retry = new JWT + new transactionId + new HeadlessSDK instance.

Follow ANTI_PATTERNS.md. Verify against CHECKLIST.md when done.
Do not implement browser redirects. Do not store secrets in localStorage.
```

---

## 2. React / Next.js SPA

```
Add FaceAssure Headless age verification to my React app at <PATH>.

Read AGENTS.md, API_QUICK_REFERENCE.md, and rawdemoclient.js in the Browser Integration pack.

Implement:
- A hook or service (e.g. useAgeCheck) that mirrors runAgeCheck() lifecycle.
- HeadlessSDK instance in a useRef; set null in onDestroyed.
- Camera preview <video> element; pass to attachVideo().
- Guidance/liveness copy from data/guidance-codes.en.json.
- Backend call to fetch JWT before each check.
- Cleanup: stop tracks in onDestroyed; never reuse instances.

Do not put SDK construction in render without guards. Do not skip onDestroyed cleanup.
Verify CHECKLIST.md. Follow ANTI_PATTERNS.md.
```

---

## 3. Vue / Nuxt

```
Integrate FaceAssure HeadlessSDK into my Vue 3 component at <PATH>.

Read AGENTS.md, rawdemoclient.js, and API_QUICK_REFERENCE.md from the Browser Integration pack.

Preserve the exact lifecycle from runAgeCheck(). Use a composable (useFaceAssureAgeCheck) that:
- Creates one HeadlessSDK per attempt
- Manages MediaStream lifecycle
- Maps guidance codes via data/guidance-codes.en.json
- Handles onWarn, onError, onDestroyed correctly

Follow ANTI_PATTERNS.md and complete CHECKLIST.md.
```

---

## 4. Backend webhook verifier (Node.js)

```
Implement a server webhook handler for Privately FaceAssure age verification.

Context: browser SDK posts unsignedToken + transactionId to our API; Privately POSTs a signed JWT to our webhook.

Requirements:
1. POST /webhooks/privately/age-verification endpoint.
2. Verify RS256 signature using Privately public key:
   https://cdn.jsdelivr.net/gh/privately-corp/privately-public-keys@latest/general/faceassure_public_rsa256.pem
3. Validate exp, nbf, iat, aud claims.
4. Match jti to pending session stored when browser called /api/age-check/pending.
5. Derive pass/fail from rlt.minAge/maxAge vs requested gate (age claim).
6. Return 200 on success; do not expose verification details in response body.

See API_QUICK_REFERENCE.md for claim schema. This is separate from browser SDK wiring.
```

---

## 5. Retry after failure

```
Add robust retry UX for FaceAssure Headless SDK failures in <YOUR_APP>.

Read ANTI_PATTERNS.md and rawdemoclient.js (onDestroyed handler).

Rules:
- Wait for onDestroyed before any retry.
- Fetch NEW JWT and NEW transactionId from backend.
- new HeadlessSDK({ ... }) — never reuse previous instance.
- Handle onDestroyed.reason: liveness_failed, timeout, failure, error.
- Do not auto-retry inside onError without new auth.

Wire a "Try again" button disabled until onDestroyed fires.
```

---

## 6. Internationalization (i18n)

```
Add i18n for FaceAssure Headless SDK guidance and liveness messages in <YOUR_APP> (locale: <LOCALE>).

Use data/guidance-codes.en.json as the template. Create data/guidance-codes.<LOCALE>.json.
Wire onGuidance and onLiveness to lookup tables only — no hardcoded strings in callbacks.
Keep SDK codes unchanged; only translate displayed copy.
Follow AGENTS.md constraints.
```

---

## 7. Code review / audit existing integration

```
Review my FaceAssure Headless SDK integration for correctness.

Read AGENTS.md, ANTI_PATTERNS.md, CHECKLIST.md, and API_QUICK_REFERENCE.md.
Compare my code against rawdemoclient.js canonical lifecycle.

Report:
- Violations of MUST / MUST NOT rules
- Missing callbacks or cleanup
- Security issues (secrets in frontend, unsignedToken trusted, etc.)
- Items from CHECKLIST.md that fail

Files to review: <LIST_YOUR_FILES>
```
