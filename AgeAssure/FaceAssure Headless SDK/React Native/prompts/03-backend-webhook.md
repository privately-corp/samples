# Task: Backend webhook verifier

Implement a server webhook handler for Privately FaceAssure age verification.

**Context:** React Native app posts `unsignedToken` + `transactionId` to our API; Privately POSTs a signed JWT to our webhook.

## Requirements

1. `POST /webhooks/privately/age-verification` endpoint.
2. Verify RS256 signature using Privately public key:
   `https://cdn.jsdelivr.net/gh/privately-corp/privately-public-keys@latest/general/faceassure_public_rsa256.pem`
3. Validate `exp`, `nbf`, `iat`, `aud` claims.
4. Match `jti` to pending session stored when app called `/api/age-check/pending`.
5. Derive pass/fail from `rlt.minAge`/`maxAge` vs requested gate.
6. Return 200 on success.

See `API_QUICK_REFERENCE.md`. Same webhook contract as Browser Integration pack.
