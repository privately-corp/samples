# GitHub Copilot — FaceAssure Headless SDK (React Native)

When integrating Privately FaceAssure Headless SDK in a React Native / Expo app, follow:

**React Native/AGENTS.md** — mandatory rules and architecture  
**React Native/assets/sdk/index.html** — canonical SDK lifecycle in WebView  
**React Native/src/components/HeadlessSdkWebView.tsx** — RN ↔ WebView bridge  
**React Native/API_QUICK_REFERENCE.md** — SDK API + bridge contract  
**React Native/ANTI_PATTERNS.md** — do not violate these  

Key rules: WebView + localhost (never import SDK as JS module); one HeadlessSDK per attempt; cleanup on `destroyed` bridge message; signed JWT from webhook only.
