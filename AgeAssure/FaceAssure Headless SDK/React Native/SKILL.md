# FaceAssure Headless SDK — React Native (AI integration guide)

This folder includes agent docs for LLM-assisted integration. **Start here:**

| Doc | Purpose |
|-----|---------|
| [AGENTS.md](AGENTS.md) | Rules, architecture, file map — **read first** |
| [API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md) | SDK API + RN bridge contract |
| [INTEGRATION_TASKS.md](INTEGRATION_TASKS.md) | Copy-paste prompts per scenario |
| [CHECKLIST.md](CHECKLIST.md) | Definition of done |
| [ANTI_PATTERNS.md](ANTI_PATTERNS.md) | Common mistakes |
| [llms.txt](llms.txt) | Doc index for LLM-aware tools |
| [prompts/](prompts/) | Individual task prompts |

## Tool-specific entry points

| Tool | File |
|------|------|
| Any agent | `AGENTS.md` |
| Cursor | `.cursor/skills/faceassure-headless-sdk-react-native/SKILL.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Claude Code | `CLAUDE.md` |
| Doc-aware LLMs | `llms.txt` |

## Starter prompt

```
Read AGENTS.md and assets/sdk/index.html in the React Native integration pack.
Integrate FaceAssure HeadlessSDK into my app using WebView + localhost.
Fetch JWTs from my backend at /api/age-check/session.
Map guidance codes via data/guidance-codes.en.json.
Follow ANTI_PATTERNS.md and complete CHECKLIST.md when done.
```
