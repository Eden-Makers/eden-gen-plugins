# What the takes app still needs

Draft https://github.com/Eden-Makers/takes/pull/67 (not merged, not deployed) already has the pieces below. Do not merge it from this change. Production at https://edengen.ai does not serve them until that draft is deployed.

## Already in that draft

- Personal API tokens in Settings, API and agents (`https://edengen.ai/app/settings?tab=api`). Prefix `tkp_`. Scopes `models:read`, `takes:read`, `takes:write`, `estimate`, `uploads:write`, `account:read`. Developer keys stay `tk_` with no scope list.
- `/v1` routes for models, estimate, takes, uploads, account, images, and videos. OpenAPI at `/openapi.json` and `/v1/openapi.json`.
- CORS on those token routes only, for `chrome-extension://<32 a-p characters>` and `https://figma.com` plus `https://*.figma.com`. Cookie `/api` routes are not included. Allowed request headers: `Authorization`, `Content-Type`, `Idempotency-Key`, `Prefer`, `X-Takes-Tags`, `X-Eden-Project`.
- OAuth known clients, these URIs only:
  - Raycast `https://raycast.com/redirect?packageName=Extension` (any non-empty `packageName` on `/redirect`)
  - Chrome `https://<extension-id>.chromiumapp.org/` where the id is 32 characters from a to p
  - Figma `https://www.figma.com/oauth/callback` and the same path on `figma.com`
- Slack `POST /api/slack/commands` and `GET /api/slack/oauth`, off unless `SLACK_APP_ENABLED=1`. `/edengen` is help and balance. It does not spend credit.
- `GET /.well-known/openai-apps-challenge` returns `OPENAI_APPS_CHALLENGE` as `text/plain`. Unset answers 404.
- Reviewer store ids include `raycast`, `droppy`, `figma`, `chrome`, `slack`, `n8n`, `zapier` (plus the earlier directory ids).

## Still needed in takes

1. **`POST /v1/assets` has no scope.** `personalRouteAllowed` refuses a personal token when the route does not declare one. Chrome imports a page image with `POST /v1/assets` and `{ "url" }`. Declare `uploads:write` on that POST (and the GET if a token should list assets), and add `/v1/assets` to `TOKEN_AUTH_PATH` in `src/server/plugin-cors.ts` so a `chrome-extension://` or `figma.com` page can call it. A developer key still works because a null scope list allows every route. Droppy no longer uses this route. It uses `POST /v1/uploads` and then `PUT`s the bytes.

2. **Figma cannot read the finished file.** `GET /v1/takes/{id}/content` is on the CORS list, then redirects to a signed media URL. The browser uses the redirected response, and that host does not send `Access-Control-Allow-Origin` for `https://www.figma.com`. Stream the bytes from `/v1/takes/{id}/content` (so the token-route CORS headers apply), or send those CORS headers on `media.edengen.ai` and the signed R2 URL for `https://figma.com` and `https://*.figma.com`.

Nothing else in the plugin folders is blocked on a takes change. Deploying pull request 67 is a human step, not a new route.
