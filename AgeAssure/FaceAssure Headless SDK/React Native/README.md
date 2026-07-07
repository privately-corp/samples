# FaceAssure Headless SDK — React Native Sample App

Sample React Native application demonstrating how to integrate the **FaceAssure Headless SDK** in a mobile app using an embedded WebView.

The FaceAssure Headless SDK is distributed as a browser bundle (JavaScript + WASM). React Native cannot execute it directly. This sample hosts the SDK inside a WebView, served from on-device `localhost`, so camera access, WebAssembly, and cryptography run in a secure browser context.

## Contents

| File / folder | Purpose |
|---|---|
| `src/` | React Native sample app (bridge, UI, static server) |
| `assets/sdk/index.html` | **Canonical WebView host** — SDK lifecycle |
| `README.md` | Human-oriented setup guide (this file) |
| `AGENTS.md` | Agent brief — rules for AI-assisted integration |
| `API_QUICK_REFERENCE.md` | SDK API + RN bridge contract |
| `INTEGRATION_TASKS.md` | Copy-paste prompts per scenario |
| `CHECKLIST.md` | Definition of done / acceptance tests |
| `ANTI_PATTERNS.md` | Common mistakes to avoid |
| `data/guidance-codes.en.json` | Default user-facing copy for SDK codes |
| `data/error-codes.json` | Default messages for warn/error/destroyed |
| `llms.txt` | Doc index for LLM-aware tools |
| `prompts/` | Individual task prompts |
| `.cursor/skills/faceassure-headless-sdk-react-native/` | Cursor Agent Skill |
| `.github/copilot-instructions.md` | GitHub Copilot pointer |
| `CLAUDE.md` | Claude Code pointer |
| `SKILL.md` | AI integration guide index |

---

## Agent-assisted integration (AI / IDE)

If you use Cursor, GitHub Copilot, Claude Code, Windsurf, or similar:

1. Open this folder in your IDE (or copy it into your project).
2. Ask your agent to read **`AGENTS.md`** first, then **`assets/sdk/index.html`**.
3. Pick a scenario from **`INTEGRATION_TASKS.md`** (or `prompts/`).
4. Verify the result with **`CHECKLIST.md`**.

**Starter prompt:**

```
Read AGENTS.md and assets/sdk/index.html in the React Native integration pack.
Integrate HeadlessSDK into my app using WebView + on-device localhost.
Fetch JWTs from my backend at /api/age-check/session.
Map guidance codes via data/guidance-codes.en.json.
Follow ANTI_PATTERNS.md and complete CHECKLIST.md when done.
```

Tool-specific entry points:

| Tool | File |
|------|------|
| Any agent | `AGENTS.md` |
| Cursor | `.cursor/skills/faceassure-headless-sdk-react-native/SKILL.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `CLAUDE.md` |
| Doc-aware LLMs | `llms.txt` |

---

## Architecture

```
React Native UI (auth form, status, event log)
        │
        ▼ postMessage bridge
WebView (index.html + headless-sdk.js)
        │
        ├─ getUserMedia() → camera preview
        ├─ HeadlessSDK.ready() → models + auth handshake
        └─ callbacks → RN event log
```

At runtime, SDK files in `assets/sdk/` are copied to the app’s document directory and served by a lightweight on-device HTTP server. The WebView loads `index.html`, which runs the SDK and streams events back to React Native.

## Prerequisites

- Node.js 18+ (Node 20+ recommended)
- npm
- Android Studio (APK / emulator) or Xcode (iOS)
- FaceAssure API credentials (session ID + password, or JWT)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Add SDK assets

This repository does **not** include the compiled SDK bundle or WASM model files. Obtain them from your licensed **FaceAssure Headless SDK** distribution package, then copy them into `assets/sdk/`:

| File | Description |
|---|---|
| `headless-sdk.bundle` | SDK JavaScript bundle (rename from `headless-sdk.js` — see note below) |
| `index.html` | WebView host page (provided in this sample) |
| `*.wasm` | Model and runtime WASM files from your SDK package |

> **Important:** The SDK bundle must use the `.bundle` extension (e.g. `headless-sdk.bundle`) so the React Native bundler treats it as a static asset. The sample copies it to `headless-sdk.js` at runtime for the WebView.

Copy from your SDK `dist/` folder:

```bash
npm run copy-sdk-assets -- /path/to/your/headless-sdk/dist
```

Or copy the files manually, then regenerate the Metro asset manifest:

```bash
npm run generate-sdk-assets
```

You must complete this step before building or running the app.

### 3. Generate native projects

```bash
npx expo prebuild
```

### 4. Run on device or emulator

```bash
# Android
npm run android

# iOS
npm run ios
```

## Building a release APK (Android)

```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```

Output:

```
android/app/build/outputs/apk/release/app-release.apk
```

Sign the APK with your release keystore before distributing to end users.

## Usage

1. Open the app.
2. Enter **session credentials** or a **JWT token**.
3. Set the requested age gate and liveness options.
4. Tap **Start age check** and grant camera permission when prompted.
5. Follow on-screen guidance in the camera preview.
6. Review pipeline state, guidance, result, and the event log.

Credentials are stored locally on the device (AsyncStorage) for convenience across restarts.

## Project layout

| Path | Purpose |
|---|---|
| `assets/sdk/` | SDK bundle, WASM models, and WebView host page (binaries not included in git) |
| `assets/sdk/index.html` | WebView entry point; loads and runs the SDK |
| `src/sdkAssets.generated.ts` | Generated Metro asset manifest (`npm run generate-sdk-assets`) |
| `src/components/HeadlessSdkWebView.tsx` | WebView wrapper and RN ↔ SDK message bridge |
| `src/screens/AgeCheckScreen.tsx` | Sample UI (auth, controls, status) |
| `src/hooks/useSdkServer.ts` | Copies bundled assets and starts localhost static server |
| `src/constants/guidance.ts` | Example mapping of SDK guidance codes to user-facing text |

## Integration notes

- **One `HeadlessSDK` instance per transaction.** After `onDestroyed`, create a new instance with fresh credentials.
- **Your app owns all UI.** Map SDK guidance codes to localized strings (see `src/constants/guidance.ts`).
- **Backend verification** uses the unsigned token from `onResult` and your registered webhook; see the FaceAssure Headless SDK integrator documentation.
- **Production:** ship a production SDK build and configure the telemetry endpoint per your environment.

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| App crashes on launch | Ensure `headless-sdk.js` is **not** imported as a JS module — use `headless-sdk.bundle` in `assets/sdk/` |
| SDK host fails to start | Copy licensed SDK files into `assets/sdk/` and run `npm run generate-sdk-assets` |
| Camera permission denied | Grant camera permission in system settings |
| `AUTHENTICATION_FAILED` | Check session ID/password or JWT expiry |
| `MODEL_LOAD_FAILED` | Ensure all required `*.wasm` files are in `assets/sdk/` |
| Blank WebView on Android | Confirm cleartext HTTP to localhost is allowed (`usesCleartextTraffic` in `app.json`) |

## Further reading

| Resource | Purpose |
|----------|---------|
| `API_QUICK_REFERENCE.md` | In-pack API + bridge cheat sheet (v1.10.32) |
| `INTEGRATION_TASKS.md` | AI prompts for common integration tasks |
| Privately onboarding docs | Full API, JWT claims, webhook setup |

For questions about SDK distribution, credentials, or webhook setup, contact your Privately integration contact.
