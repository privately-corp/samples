# Task: Add to existing React Native app

Read `AGENTS.md`, `API_QUICK_REFERENCE.md`, `assets/sdk/index.html`, and `src/components/HeadlessSdkWebView.tsx` in this folder first.

Add FaceAssure Headless age verification to my existing React Native app at **\<PATH\>**.

## Requirements

1. Copy `useSdkServer.ts`, `HeadlessSdkWebView.tsx`, `types/sdk.ts`, and `assets/sdk/index.html` from the sample.
2. Add dependencies: `react-native-webview`, `@dr.pogodin/react-native-static-server`, `expo-file-system`, `expo-asset`.
3. Apply `patches/@dr.pogodin+react-native-static-server+0.21.0.patch`.
4. Add a screen or modal: `useSdkServer()` → `HeadlessSdkWebView` → `ref.start(auth)`.
5. Map bridge messages to my existing UI; guidance copy from `data/guidance-codes.en.json`.

Preserve WebView + localhost architecture. Do not import `headless-sdk` as a module.

Verify `CHECKLIST.md`. Follow `ANTI_PATTERNS.md`.
