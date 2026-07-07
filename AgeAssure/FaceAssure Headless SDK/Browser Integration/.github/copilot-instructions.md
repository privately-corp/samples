# GitHub Copilot — FaceAssure Headless SDK

When integrating Privately FaceAssure Headless SDK in this project, follow:

**Browser Integration/AGENTS.md** — mandatory rules and lifecycle  
**Browser Integration/rawdemoclient.js** — canonical implementation (`runAgeCheck`, `buildSdkConfig`)  
**Browser Integration/API_QUICK_REFERENCE.md** — API contract  
**Browser Integration/ANTI_PATTERNS.md** — do not violate these  

Key rules: one `HeadlessSDK` per attempt; `ready()` → attach → `start()`; cleanup in `onDestroyed`; signed JWT from webhook only.
