# Public deployment verification

Verified November 1, 2026, at approximately 10:25 AM IST.

- Game: https://the-last-process.onrender.com
- Swagger: https://the-last-process.onrender.com/docs
- OpenAPI schema: https://the-last-process.onrender.com/openapi.json
- Health: https://the-last-process.onrender.com/health
- Code revision tested: `2e2952f79033f35495e7ae33c1808bdb6ca8edb0`.
- Host: Render free Docker web service, Singapore, one worker, 512 MB RAM. Service: `the-last-process`.

## Public checks passed

1. Health, HTML page, resident portrait, Swagger UI and OpenAPI schema loaded successfully.
2. Session access without a bearer token was rejected.
3. A new game reported the actual story source as `ultramarine-1-flash`.
4. An incorrect answer left progression at stage zero.
5. One hosted hint returned actual `gemma-4-26b-a4b-it` dialogue, with the independent authored hint alongside it.
6. All three correct answers advanced the game and served the bundled Ultramarine diary.
7. The preserve ending completed successfully and survived a session resume request.
8. Native Safari visibly loaded the app; entering the first answer unlocked the next file and displayed the generated diary. Opening the recovered file displayed the Ultramarine source label.

The Docker build and startup were verified by the successful Render deployment. Local tests remain 20 passed. These checks establish the exercised integration paths, not general AI accuracy or production-scale reliability.

## Credentials and limits

Only `GEMINI_API_KEY` is configured as a server environment secret on this service, with the user's destination-specific approval. The Ultramarine key stays local; the generated casebook is bundled as a public story asset. No key belongs in the browser or repository.

The free service can sleep, delaying the first request. Local SQLite storage is ephemeral, so restarts or deployments can reset saves. Model-call limits are process-local. No paid plan, persistent disk or paid add-on was selected.

DEV publication is a separate step and has not been performed.
