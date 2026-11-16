# Eden Gen for Notion

Notion does not offer a public third-party slash command. The path that runs inside Notion is a Custom Agent with a custom MCP connection to `https://edengen.ai/mcp`. This folder also has a small CLI that generates an image and appends it to a page, for a person who wants a block without Notion AI.

## Custom MCP (the in-product path)

Eden Gen already serves a remote MCP server with dynamic client registration, scope `takes`, and resource `https://edengen.ai/mcp`. Notion's help says a custom MCP server can sign in with OAuth when the server supports dynamic client registration, or with a bearer token.

https://www.notion.com/help/mcp-connections-for-custom-agents

1. A workspace admin on a Business or Enterprise plan opens Settings, Connections, Manage, and turns on custom MCP servers.
2. If the workspace limits connections to an approved list, add `https://edengen.ai/mcp` as a custom MCP server URL. Include `/mcp`.
3. On the Custom Agent, open Settings, Tools and access, Add connection, Custom MCP server.
4. URL: `https://edengen.ai/mcp`. Name: Eden Gen.
5. Choose OAuth. Notion registers a public client. The consent screen may say "Unverified app" until the redirect is confirmed and added. That label is not a block. A bearer token from Settings, API and agents also works if the connection form asks for a header. Use a personal token (`tkp_`). Do not paste a token into the agent instructions.
6. Leave write tools on "always ask". `takes_create` spends credit. The Eden Gen tool instructions already require an estimate and a confirmation before create.

The help page does not publish Notion's OAuth redirect. A public registration probe recorded `https://app.notion.com/workflows/mcp/oauth/callback`. Do not add that host in takes until a person copies it from a real consent redirect. Details are in `TAKES-CHANGES-NEEDED-WAVE2.md`.

There is no Notion marketplace submission for a custom MCP URL. A public Notion integration (the gallery) is a different product: it uses Notion's own OAuth, needs a public website, and a review. This change does not build that gallery app.

## CLI (append an image block)

The CLI is the minimal implementation. It estimates, asks before create, polls, then copies the bytes into Notion with the file upload API. If Notion refuses file upload, it appends an external image block. Signed URLs expire, so the file upload path is the one to keep.

```bash
npm install
npm test
npm run typecheck
EDEN_TOKEN=tkp_... NOTION_TOKEN=ntn_... npm start -- --page "https://www.notion.so/..." --prompt "A quiet reading room"
```

`--yes` spends the estimated amount without a second prompt. Omit it to type `yes` after the price is printed. The tokens are read from the environment and are not printed.

Create the Notion token as an internal integration at https://www.notion.so/profile/integrations with read and insert content, then share the target page with that integration. `NOTION_TOKEN` is Notion's secret, not an Eden Gen token.

## Costs

The CLI prints `usd_total` from `POST /v1/estimate` and does not create a take until you accept it. Prices are not hardcoded. A failed take is refunded when `refunded` is true. Notion plan limits are separate: custom MCP is Business and Enterprise only.

## Review requirements

Notion reviews a public integration for privacy policy, a real website, and the scopes you request. A custom MCP connection is not that review. The agent owner should keep write tools on ask, because generation spends workspace credit. The CLI never sends the Eden token to Notion.

## Human still does

A Notion admin, the Business or Enterprise plan, enabling custom MCP, one connect to `https://edengen.ai/mcp`, and a check that the consent redirect matches the candidate in `TAKES-CHANGES-NEEDED-WAVE2.md` before anyone marks Notion as a verified OAuth client. For the CLI: an internal integration, a shared page, and one run. Screenshots of the agent connection if you want them for a later gallery submission. No submit from this pull request.

There is no listing fee for adding a custom MCP server. A public integration review, if you start one later, is also not given a fee in Notion's help page used here. Confirm in the gallery form.
