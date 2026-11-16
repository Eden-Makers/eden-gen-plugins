# What the takes app still needs for wave 2

Draft https://github.com/Eden-Makers/takes/pull/67 is not merged and not deployed. Do not merge it from this change. Production at https://edengen.ai does not serve that draft until someone deploys it.

Wave 1 already asked for two fixes in `TAKES-CHANGES-NEEDED.md` (scope on `POST /v1/assets`, and streaming `GET /v1/takes/{id}/content` so Figma can read the file). This file is only the extra wave 2 list. It does not repeat those two items except where the same content-route fix unblocks Adobe Express, Webflow, and Canva thumbnails.

The strings below are the same values as `WAVE2_BROWSER_ORIGINS` in `edengen-rest/edengen-rest.ts`.

## Already enough, once pull request 67 is deployed

These wave 2 targets call `/v1` from a server, an extension host, or the Shortcuts app. They do not need a new browser origin. Loopback OAuth (`http://127.0.0.1:<port>/callback` and `http://localhost:<port>/callback`) is already treated as a known client. `https://vscode.dev` (every path) is already a known client, which covers VS Code's MCP sign-in.

- Discord and Telegram bots (personal token, or loopback OAuth while the bot process is on the same machine as the browser)
- VS Code extension (personal token or loopback OAuth for `/v1`; MCP registration uses `https://edengen.ai/mcp`)
- JetBrains AI Assistant (MCP URL, or `mcp-remote` which uses a loopback callback)
- Shopify app (the Remix server calls `/v1`; the merchant's Eden token stays on the server)
- WordPress plugin (PHP calls `/v1`; the browser only talks to WordPress)
- Apple Shortcuts (the Shortcuts app calls `/v1` directly; this is not a browser origin)
- Hugging Face Space (the Gradio process calls `/v1`)
- Notion custom MCP (dynamic client registration already accepts any https redirect; see the candidate below before marking it verified)

## 1. CORS on the token routes

`pluginOriginAllowed` in `src/server/plugin-cors.ts` currently allows only `chrome-extension://<32 a-p characters>` and `https://figma.com` plus `https://*.figma.com`, and only on `TOKEN_AUTH_PATH`.

Add the origins below to that same allowlist (token routes only, same allowed headers: `Authorization`, `Content-Type`, `Idempotency-Key`, `Prefer`, `X-Takes-Tags`, `X-Eden-Project`). Do not put these origins on cookie `/api` routes. Do not use `*` once `Authorization` is sent.

The app ids do not exist until a person creates each listing. Allow the exact origin, not every tenant on that parent domain.

| Plugin | Origin to allow | When it exists |
|---|---|---|
| Canva | `https://app-<lowercase-app-id>.canva-apps.com` | Canva Developer Portal, App ID column. The label in the host is the App ID lowercased. Example shape: `https://app-aabbccddeeff001122334455.canva-apps.com`. |
| Adobe Express, local | `https://localhost:5241` | Adobe's add-on dev server (`https://localhost:5241`). Allow this on a dev deploy only if you want local panels to call production. |
| Adobe Express, listed | `https://<addon-id>.wxp.adobe-addons.com` | Assigned when the first private listing is created. It stays stable across later versions. Example shape: `https://w906hhl6k.wxp.adobe-addons.com`. |
| Framer, users | `https://<plugin-id>.plugins.framercdn.com` | Framer Plugins dashboard, Copy Plugin ID. No version label. |
| Framer, review | `https://<plugin-id>-<version-id>.plugins.framercdn.com` | Same plugin id, plus a version label of letters and digits. Framer review loads this host, and the version changes on every submit. Match `^https://<plugin-id>(-[a-zA-Z0-9]+)?\.plugins\.framercdn\.com$` so you do not hardcode a version. |
| Webflow | `https://<extension-id>.webflow-ext.com` | Webflow app id. Example shape from the Designer iframe: `https://686448c2b116eff21b5e58db.webflow-ext.com`. |

Framer documents both framercdn patterns as required for review: https://www.framer.com/developers/plugins-cors

Canva documents the app host as `https://app-<APP_ID>.canva-apps.com`: https://www.canva.dev/docs/apps/cross-origin-resource-sharing/

Adobe documents the listed host as `https://<addon-id>.wxp.adobe-addons.com` and local dev as `https://localhost:5241`.

## 2. Let the browser read the finished file

Adobe Express (`addOnUISdk.app.document.addImage`) and Webflow (`webflow.createAsset`) fetch the bytes inside the iframe. Canva's video and image upload is fetched by Canva's servers from `output.url` (that hop is not CORS), but the thumbnail URL is loaded by the panel and must send CORS for the Canva app origin.

`GET /v1/takes/{id}/content` is already on `TOKEN_AUTH_PATH`, then redirects to a signed media URL. The media host does not send `Access-Control-Allow-Origin` for these panels. This is the same gap wave 1 reported for Figma.

Do one of these:

1. Stream the bytes from `GET /v1/takes/{id}/content` with the token-route CORS headers, and do not answer 302. The browser then reads one response.
2. Or send `Access-Control-Allow-Origin` (echo the allowed plugin origin, with `Vary: Origin`) on `media.edengen.ai` and the signed R2 URL for every origin in the table above, plus the existing Figma origins.

Canva also refuses asset URLs that redirect (`upload` in `@canva/asset`). `output.url` on the take must be a direct https URL (200, `Content-Type` matching the file, no redirect). The content route can keep streaming for Adobe and Webflow.

## 3. Video poster is not required

Canva's video upload requires `thumbnailImageUrl`. The app draws a small PNG data URL in the panel at the selected aspect ratio, and uses `output.poster_url` only when the take already has one. Do not add a poster field for this scaffold.

## 4. OAuth known clients

Add a row to `KNOWN_CLIENTS` in `src/lib/oauth-known-clients.ts` only after the vendor documents the redirect, or a person on the Edenmakers account copies it from a real consent redirect. Do not add a guessed host.

### Notion, confirm before adding

Notion's help (https://www.notion.com/help/mcp-connections-for-custom-agents) says a custom MCP server can use OAuth, and that dynamic client registration is required unless the workspace uses a bearer token. The help page does not publish the redirect URI.

A public dynamic-registration probe recorded Notion registering `client_name: "Notion"`, `token_endpoint_auth_method: "none"`, and redirect `https://app.notion.com/workflows/mcp/oauth/callback`. That URI is not in Notion's help page. Leave it unverified (the consent screen already shows "Unverified app" plus the host) until someone completes one Notion custom-MCP connect and the address bar matches that URI exactly. If it matches, add:

- name: `Notion`
- host: `app.notion.com`
- path: `/workflows/mcp/oauth/callback` (exact)
- note: Notion Custom Agent custom MCP (confirmed from a consent redirect on this date)

No takes change is required for Notion to connect. Unverified is a label, not a block. Registration already accepts the https redirect.

### Do not add yet

Discord and Telegram have no vendor redirect. The bots in this repo use a personal token, or loopback OAuth, which pull request 67 already trusts. A public callback such as `https://edengen.ai/integrations/discord/callback` would need both a route and a known-client row, and neither bot is hosted on edengen.ai in this change. Add the row only when the host is chosen, using that exact URI.

Canva, Adobe Express, Framer, and Webflow in this repo authenticate with a personal token because those iframes do not have a stable documented OAuth callback of their own. No new redirect is required for the scaffolds.

## 5. Reviewer store ids

Pull request 67 names reviewer store ids `raycast`, `droppy`, `figma`, `chrome`, `slack`, `n8n`, `zapier`. When a reviewer login should cover a wave 2 listing, add the id next to that list:

`canva`, `adobe-express`, `framer`, `notion`, `discord`, `telegram`, `vscode`, `shopify`, `wordpress`, `webflow`, `huggingface`

JetBrains and Apple Shortcuts have no reviewer sandbox inside the product. Skip them unless a person asks.

## Not a takes change

Store accounts, screenshots, demo videos, and submit clicks stay with a person. This file is not a request to merge pull request 67.
