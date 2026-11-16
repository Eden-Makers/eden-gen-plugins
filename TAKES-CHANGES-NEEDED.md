# Changes the takes app still needs

Do not make these edits in this repository. They belong in https://github.com/Eden-Makers/takes. Checked against production on 2026-11-16.

API tokens already exist. A key created at `/app/developers` (`tk_…`) is a bearer for `https://edengen.ai/v1` and for MCP. OAuth access tokens (`tko_…`) work on `/v1` only when the grant's resource is `https://edengen.ai/v1` (`restResourceOf` in `src/server/oauth.ts`). Native apps in this repo send that resource. No new token type is required.

## 1. OpenAI domain challenge

`GET https://edengen.ai/.well-known/openai-apps-challenge` returned 404 HTML on 2026-11-16.

Add a public route, for example `src/app/.well-known/openai-apps-challenge/route.ts`, that:

- Answers `GET` with status 200.
- Sets `Content-Type: text/plain; charset=utf-8`.
- Writes only the exact token from an environment variable such as `OPENAI_APPS_CHALLENGE`. No JSON, no HTML, no extra newline if the portal token has none.
- Does not require a session, an API key, or a client certificate. OpenAI's domain check is separate from MCP mTLS.
- Returns 404 when the variable is unset, so a missing token is obvious.

Keep `/.well-known/*`, `/oauth/*` and `/mcp` reachable by the verifier. A WAF block looks like 403 and fails verification even when the route is correct.

The ChatGPT package documents this. The token itself must not be committed.

## 2. CORS on `/v1` for the Figma plugin

On 2026-11-16:

- `GET /v1/account` with `Origin: https://www.figma.com` returned 401 and no `Access-Control-Allow-Origin`.
- `OPTIONS /v1/estimate` with `Origin: chrome-extension://…` returned 204 and no `Access-Control-Allow-Origin`.
- `/.well-known/oauth-authorization-server` did send `access-control-allow-origin: *`, but `access-control-allow-headers` was only `Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID`.

The Figma plugin UI calls `/v1` from an iframe. It cannot read the response until `/v1` sends CORS headers. The Chrome extension avoids this by calling from the service worker, which has host permission. A future page that calls `/v1` from JavaScript needs the same headers.

On `/v1` responses and on `OPTIONS`:

- `Access-Control-Allow-Origin: *` (the API already uses bearer tokens, not cookies).
- `Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS`.
- `Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key, Prefer, X-Filename, X-Takes-Tags`.
- `Access-Control-Max-Age: 86400`.

Apply it in the shared `/v1` response path, not only on the well-known OAuth routes.

Finished files are fetched by the Figma plugin from `output.url` (media.edengen.ai or a signed R2 URL). Those URLs also need `Access-Control-Allow-Origin` that a Figma plugin iframe can read, or the plugin can price a take and still fail to place the pixels. Easiest is `*` on the media response. Signed R2 URLs need the same header from the bucket CORS policy.

## 3. OAuth discovery for the REST resource

`audienceOf` in `src/server/oauth.ts` accepts resource `https://edengen.ai/v1`. A live `GET /.well-known/oauth-protected-resource/v1` still returned `"resource": "https://edengen.ai/mcp"` because `protectedResourceMetadata()` always calls `resourceOf` (the MCP URL).

Clients in this repo hardcode `resource=https://edengen.ai/v1`, so they work without the document. A client that trusts the well-known document for `/v1` will ask for an MCP token and then be refused by `/v1`.

Serve a REST document when the protected-resource path is `/v1`:

```json
{
  "resource": "https://edengen.ai/v1",
  "authorization_servers": ["https://edengen.ai"],
  "scopes_supported": ["takes"],
  "bearer_methods_supported": ["header"],
  "resource_name": "Eden Gen API"
}
```

Leave `/.well-known/oauth-protected-resource/mcp` pointing at `https://edengen.ai/mcp`.

## 4. Known OAuth clients

`src/lib/oauth-known-clients.ts` does not list Raycast or a Chrome extension. Dynamic registration already accepts their https redirects. The consent screen shows "Unverified app" until the host is listed.

Add, after checking the vendor URL still matches:

- Raycast web redirect. Host `raycast.com`, path prefix `/redirect`. The redirect Raycast documents for every extension is `https://raycast.com/redirect?packageName=Extension`. The query is not part of the path match in `redirectTrust`.
- Chrome, only after the Web Store extension id exists. Host `<id>.chromiumapp.org`. `chrome.identity.getRedirectURL()` is `https://<id>.chromiumapp.org/`.

Do not add `raycast://` unless you also extend `validRedirect` / `allowedCustomScheme`. Today a custom scheme is rejected at registration unless it is already a known client. The Raycast package uses the https redirect so this is optional.

Figma uses an API token, not OAuth. Droppy uses an API token. Slack uses Slack's own OAuth, specified in `slack/TAKES-ENDPOINTS.md`, not Eden's consent list.

## 5. Slack routes

Specified in `slack/TAKES-ENDPOINTS.md`. They are not implemented. Summary:

- `POST /api/slack/commands` for `/edengen`
- `POST /api/slack/interactions` for the approve button
- `GET /api/slack/install` and `GET /api/slack/oauth` to store a bot token for a team
- Verify `X-Slack-Signature` with `SLACK_SIGNING_SECRET`
- Map a Slack user to a hashed `tk_` key
- Ack in under 3 seconds, then estimate, then create once on approve

Creation must go through `createRun` or `submitTakes`.

## Not required

- A new API token format. `tk_` keys and REST-audience OAuth tokens are enough.
- A change for Raycast, Droppy, n8n, Zapier or Make to call `/v1` from a server or a native process. Those are not browser CORS clients.
- Editing this plugins repository to stand in for the routes above.
