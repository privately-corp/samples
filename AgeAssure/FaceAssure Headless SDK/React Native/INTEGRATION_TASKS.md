# FaceAssure Headless SDK — React Native Integration Task Prompts

Copy a prompt below into your AI IDE. Replace placeholders (`<YOUR_APP>`, `<PATH>`, etc.) before sending.

**Before any task:** ask the agent to read `AGENTS.md`, `API_QUICK_REFERENCE.md`, and `assets/sdk/index.html` in this folder.

---

## 1. Greenfield Expo / React Native app

```
Integrate the Privately FaceAssure Headless SDK into a new Expo React Native app.

Read these files first (React Native integration pack):
- AGENTS.md
- API_QUICK_REFERENCE.md
- assets/sdk/index.html (canonical WebView lifecycle)
- src/hooks/useSdkServer.ts
- src/components/HeadlessSdkWebView.tsx

Requirements:
1. Use WebView + on-device localhost static server — never import SDK as a JS module.
2. Copy SDK dist to assets/sdk/ as headless-sdk.bundle + *.wasm; run generate-sdk-assets.
3. Configure metro.config.js (wasm, bundle assetExts) and Android usesCleartextTraffic.
4. Implement RN ↔ WebView bridge per API_QUICK_REFERENCE.md.
5. Fetch short-lived JWT from GET /api/age-check/session on my backend.
6. Map guidance/liveness codes via data/guidance-codes.en.json in RN UI.
7. On result bridge message, POST transactionId + unsignedToken to /api/age-check/pending.
8. On destroyed, reset UI and enable retry with new JWT + new transactionId.

Follow ANTI_PATTERNS.md. Verify against CHECKLIST.md when done.
Do not commit SDK binaries to git.
```

---

## 2. Add to existing React Native app

```
Add FaceAssure Headless age verification to my existing React Native app at <PATH>.

Read AGENTS.md, API_QUICK_REFERENCE.md, assets/sdk/index.html, and src/components/HeadlessSdkWebView.tsx from the React Native integration pack.

Integrate without rewriting my app:
- Copy useSdkServer.ts, HeadlessSdkWebView.tsx, types/sdk.ts, assets/sdk/index.html
- Add react-native-webview, @dr.pogodin/react-native-static-server, expo-file-system, expo-asset
- Apply patches/@dr.pogodin+react-native-static-server+0.21.0.patch
- Add one screen or modal that wires useSdkServer → HeadlessSdkWebView → ref.start(auth)
- Map bridge messages to my existing UI patterns

Preserve WebView + localhost architecture. Do not import headless-sdk as a module.
Verify CHECKLIST.md. Follow ANTI_PATTERNS.md.
```

---

## 3. Adapt this sample to production

```
Harden the FaceAssure React Native sample for production in <YOUR_APP>.

Read AGENTS.md and ANTI_PATTERNS.md.

Changes required:
1. Remove demo AsyncStorage credential persistence — fetch JWT from backend only.
2. Replace com.privately.headlesssdkdemo bundle ID with our app ID.
3. Move auth UI into our design system; keep WebView host unchanged unless needed.
4. Add backend correlation on result (unsignedToken + transactionId).
5. Ensure reset-sdk-assets-manifest stub is committed; binaries stay local/CI-only.
6. Production SDK bundle from Privately (not staging).

Verify CHECKLIST.md security and backend sections.
```

---

## 4. Backend webhook verifier (Node.js)

```
Implement a server webhook handler for Privately FaceAssure age verification.

Context: React Native app posts unsignedToken + transactionId to our API; Privately POSTs a signed JWT to our webhook.

Requirements:
1. POST /webhooks/privately/age-verification endpoint.
2. Verify RS256 signature using Privately public key:
   https://cdn.jsdelivr.net/gh/privately-corp/privately-public-keys@latest/general/faceassure_public_rsa256.pem
3. Validate exp, nbf, iat, aud claims.
4. Match jti to pending session stored when app called /api/age-check/pending.
5. Derive pass/fail from rlt.minAge/maxAge vs requested gate.
6. Return 200 on success.

See API_QUICK_REFERENCE.md for claim schema. Same as browser integration webhook.
```

---

## 5. Retry after failure

```
Add robust retry UX for FaceAssure Headless SDK failures in my React Native app at <PATH>.

Read ANTI_PATTERNS.md and assets/sdk/index.html (onDestroyed → postToNative destroyed).

Rules:
- Wait for destroyed bridge message before enabling retry.
- Fetch NEW JWT and NEW transactionId from backend.
- Send new start(auth) to WebView — never reuse previous SDK instance.
- Handle destroyed.reason: liveness_failed, timeout, failure, error.
- Do not auto-retry on error bridge message without new auth.

Wire "Try again" button disabled until destroyed fires.
```

---

## 6. Internationalization (i18n)

```
Add i18n for FaceAssure Headless SDK guidance and liveness messages in my React Native app (locale: <LOCALE>).

Use data/guidance-codes.en.json as template. Create data/guidance-codes.<LOCALE>.json.
Map guidance and liveness bridge messages in RN — no hardcoded strings.
Keep SDK codes unchanged; only translate displayed copy.
Follow AGENTS.md constraints.
```

---

## 7. iOS-specific setup

```
Configure FaceAssure Headless SDK React Native integration for iOS in <YOUR_APP>.

Read AGENTS.md platform requirements.

Ensure:
- NSCameraUsageDescription and NSMicrophoneUsageDescription in app.json / Info.plist
- expo prebuild generates iOS project
- WebView mediaCapturePermissionGrantType="grant"
- Static server fileDir paths work on iOS (expo-file-system bundleDirectory)
- Test on physical device (simulator camera limitations)

Follow CHECKLIST.md iOS items.
```

---

## 8. Code review / audit existing integration

```
Review my FaceAssure Headless SDK React Native integration for correctness.

Read AGENTS.md, ANTI_PATTERNS.md, CHECKLIST.md, and API_QUICK_REFERENCE.md.
Compare against assets/sdk/index.html and HeadlessSdkWebView.tsx canonical patterns.

Report:
- Violations of MUST / MUST NOT rules
- Metro/import anti-patterns
- Missing bridge handlers or cleanup
- Security issues (secrets in app, unsignedToken trusted, etc.)
- CHECKLIST.md items that fail

Files to review: <LIST_YOUR_FILES>
```
