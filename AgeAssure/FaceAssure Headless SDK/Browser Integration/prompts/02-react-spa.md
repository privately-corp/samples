# Task: React / Next.js integration

Read `AGENTS.md`, `API_QUICK_REFERENCE.md`, and `rawdemoclient.js` in this folder first.

Add FaceAssure Headless age verification to my React app at **\<PATH\>**.

## Requirements

- A hook or service (e.g. `useAgeCheck`) that mirrors `runAgeCheck()` lifecycle.
- `HeadlessSDK` instance in a `useRef`; set `null` in `onDestroyed`.
- Camera preview `<video>` element; pass to `attachVideo()`.
- Guidance/liveness copy from `data/guidance-codes.en.json`.
- Backend call to fetch JWT before each check.
- Cleanup: stop tracks in `onDestroyed`; never reuse instances.

Do not put SDK construction in render without guards. Do not skip `onDestroyed` cleanup.

Verify `CHECKLIST.md`. Follow `ANTI_PATTERNS.md`.
