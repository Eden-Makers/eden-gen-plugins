# Eden Gen for VS Code

Command palette: **Eden Gen: Generate into workspace**. It asks for a prompt and image or video, shows the price from `POST /v1/estimate` in a modal, and after Spend writes the file under `edengen/` in the first workspace folder.

**Eden Gen: Set API token** stores a personal token (`tkp_`) in VS Code secret storage. **Eden Gen: Sign in** runs OAuth PKCE on `http://127.0.0.1`, which takes draft pull request 67 already trusts. The MCP registration does not send that token. MCP uses `https://edengen.ai/mcp`, and VS Code completes MCP OAuth on `https://vscode.dev`, which is already a known client.

On activation the extension calls `vscode.lm.registerMcpServerDefinitionProvider` with id `edengen.mcp` and one `McpHttpServerDefinition` for `https://edengen.ai/mcp`. The contribution point is `mcpServerDefinitionProviders` in `package.json`. This needs VS Code 1.101 or newer.

## Build

```bash
npm install
npm run typecheck
npm run build
```

Load this folder with the extension development host (Run Extension), or package it:

```bash
npx @vscode/vsce package
```

`publisher` is `edenmakers`. Change it if that Marketplace publisher is not yours before you package for the store. Do not publish from this pull request.

## Store submission

1. Create or claim the `edenmakers` publisher on the Visual Studio Marketplace. There is no fee for a free extension.
2. Package the vsix after `npm run build`.
3. Run one generate into a workspace and confirm the file lands in `edengen/`. Open Copilot chat and confirm Eden Gen appears as an MCP server, then finish its own sign-in.
4. Screenshots of the price modal, the saved file, and the MCP server list. A short video of the generate command.
5. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai. The listing says a price is shown before credit is spent.
6. Upload the vsix when you mean to. Do not upload from this pull request.

## Review requirements

The Marketplace checks the publisher, a license, and that the description matches the commands. This extension does not request extra activation on every document. The personal token stays in secret storage and is not written to the MCP headers.

## Costs

The modal shows `usd_total`. This folder does not hardcode a model price. A higher fresh estimate is refused. A failed take is refunded when `refunded` is true.

## Human still does

A Marketplace publisher, one generate, one MCP sign-in, screenshots, the demo video, and the upload. `vsce package` can warn until the publisher exists. That warning is expected.
