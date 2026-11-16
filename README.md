# Eden Gen for AI agents

Connect [Eden Gen](https://edengen.ai) to Claude, ChatGPT, Codex, Cursor, Gemini CLI, Grok and any MCP client. Your agent can price, generate and organize images, video and audio in your Eden Gen workspace, with a cost estimate before every take and project budgets that hold.

- MCP endpoint: `https://edengen.ai/mcp` (Streamable HTTP, OAuth 2.1 with dynamic client registration, scope `takes`)
- Docs: https://edengen.ai/docs/agents
- Account: sign up at https://edengen.ai. Generation uses your workspace credit.

## Install

**Claude Code**

```bash
claude plugin marketplace add Eden-Makers/eden-gen-plugins
claude plugin install eden-gen@eden-gen
```

**Claude.ai and Claude Desktop:** Settings, Connectors, Add custom connector, URL `https://edengen.ai/mcp`.

**ChatGPT:** Settings, Apps, Advanced, Developer mode, Create app, URL `https://edengen.ai/mcp`, authentication OAuth.

**Codex CLI**

```bash
codex mcp add eden-gen --url https://edengen.ai/mcp
```

**Cursor:** [Install Eden Gen](https://cursor.com/install-mcp?name=eden-gen&config=eyJ1cmwiOiJodHRwczovL2VkZW5nZW4uYWkvbWNwIn0%3D), or use the plugin in `plugins/cursor`.

**Gemini CLI**

```bash
gemini extensions install https://github.com/Eden-Makers/eden-gen-plugins
```

**Grok:** grok.com/connectors, Add custom MCP, URL `https://edengen.ai/mcp`.

**Any other MCP client:** add a remote server with URL `https://edengen.ai/mcp`. The client discovers OAuth from the server. An API key from your workspace settings also works as a bearer token.

## What is in this repository

| Path | For |
|---|---|
| `.claude-plugin/marketplace.json`, `plugins/claude` | Claude Code plugin marketplace |
| `plugins/portable` | ChatGPT and Codex (Agent Plugins format) |
| `plugins/cursor` | Cursor plugin |
| `gemini-extension.json`, `GEMINI.md`, `skills/` | Gemini CLI extension |
| `server.json` | Official MCP Registry entry `ai.edengen/eden-gen` |
| `chatgpt/` | ChatGPT and Codex directory ZIP (`node chatgpt/build.mjs`) |
| `claude-directory/` | Paste-ready Claude directory submission |
| `raycast/` | Raycast extension |
| `droppy/` | Droppy droplet |
| `figma/` | Figma plugin |
| `chrome/` | Chrome extension |
| `slack/` | Slack manifest and the takes endpoint spec |
| `zapier/`, `make/`, `n8n-nodes-edengen/` | Automation apps |
| `mcp-directories/` | Smithery, Glama, mcp.so, Composio, Cline, Goose, editor snippets |
| [INTEGRATIONS.md](INTEGRATIONS.md) | Status of every target |
| [TAKES-CHANGES-NEEDED.md](TAKES-CHANGES-NEEDED.md) | Server changes that belong in the takes app |

Nothing in the store folders has been submitted. Each folder's README lists the store steps, the review requirements, and what a person still has to do.

## Support

support@edengen.ai. Terms: https://edengen.ai/terms. Privacy: https://edengen.ai/privacy.

## License

The files in this repository (plugin manifests, MCP configuration, skills and agent instructions) are MIT licensed. The Eden Gen service, its code, and the Eden Gen and Edenmakers names and logos are not covered and remain proprietary to Eden makers s.r.o. See [LICENSE](LICENSE).
