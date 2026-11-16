# Eden Gen for Grok

Grok reaches Eden Gen through the remote MCP server `https://edengen.ai/mcp`. There is no plugin file to install and no public vendor catalog we could confirm, so a person adds the server themselves.

## Grok (grok.com)

1. Open https://grok.com/connectors, choose New Connector, then Custom.
2. Server URL: `https://edengen.ai/mcp`
3. Grok finds the OAuth metadata on its own (401, protected-resource metadata, dynamic client registration, PKCE). Sign in to Eden Gen on the consent screen, pick a project and a monthly cap.
4. Ask: "List Eden Gen image models and show prices. Do not generate."

Custom connectors need a paid Grok plan.

## Grok Bot

Say "custom server" so the bot does not install a catalog plugin instead:

```
Add a custom MCP server called eden-gen at https://edengen.ai/mcp
```

Click Authorize on the connect card and sign in. Localhost URLs do not work because the bot runs in the cloud.

## Grok Build

```
grok mcp add eden-gen https://edengen.ai/mcp
```

## xAI API

Pass the server as a remote MCP tool: `{"type": "mcp", "server_url": "https://edengen.ai/mcp", "server_label": "eden-gen"}`. Use an Eden Gen personal API token with the `takes` scope as the authorization value, never in the URL.

## Status

Written from third-party docs on 2026-11-16. The xAI docs page for connectors returned 404 when fetched, so check the exact field names at https://docs.x.ai before relying on the API snippet. Not listed anywhere public yet.
