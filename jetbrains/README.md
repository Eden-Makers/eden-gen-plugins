# Eden Gen for JetBrains

AI Assistant connects to the remote MCP server. A full plugin is not required. This folder documents that setup and includes a small plugin skeleton that only opens a note. The skeleton is not compiled here. The IntelliJ Platform SDK download is large, and CI does not run Gradle.

## MCP in AI Assistant

Needs a JetBrains IDE from 2025.3 or newer so Streamable HTTP is available. 2025.2 is stdio only.

1. Settings, Tools, AI Assistant, Model Context Protocol (MCP), Add.
2. For a first look, paste `mcp/ai-assistant.http.json`:

```json
{
  "mcpServers": {
    "eden-gen": {
      "url": "https://edengen.ai/mcp"
    }
  }
}
```

3. The Eden Gen server requires sign-in. AI Assistant's own docs do not describe a browser OAuth flow for MCP. Use `mcp/ai-assistant.oauth.json` instead. It runs `npx -y mcp-remote https://edengen.ai/mcp`. `mcp-remote` opens a browser and uses a loopback callback, which takes draft pull request 67 already trusts. The resource is `https://edengen.ai/mcp`, scope `takes`. Do not paste a `/v1` personal token into the MCP URL. That token is for the REST API, and an MCP token is refused on `/v1`.
4. Choose the server level (global or this project) and apply. Ask the assistant to list models and to estimate a take before it creates one. The server instructions require the estimate and a confirmation.

A personal token can be tried as a header only if your IDE build shows a headers field:

```json
{
  "mcpServers": {
    "eden-gen": {
      "url": "https://edengen.ai/mcp",
      "headers": { "Authorization": "Bearer YOUR_TOKEN" }
    }
  }
}
```

JetBrains documents that shape more clearly for Junie than for AI Assistant. Prefer `mcp-remote` when the header is ignored. Do not commit a file that contains the token. The JSON files in this folder do not.

No takes change is required for this setup. `https://vscode.dev` is unrelated. Notion's redirect is unrelated.

## Plugin skeleton

`plugin/` is an IntelliJ Platform plugin with one action, Eden Gen: MCP setup, that shows the MCP URL. It does not generate media and it does not register an MCP server. AI Assistant does not offer a public extension point for that in the docs used here, so the action points at this README.

Compile only if you want to try it:

```bash
cd plugin
./gradlew build
```

You need a JDK and the Gradle wrapper jars, which are not committed (they are a binary download). Generate the wrapper on a machine that already has Gradle: `gradle wrapper`. CI does not do this.

## Store submission

Do not submit the skeleton. If a person later publishes it:

1. A JetBrains account that can publish plugins. Free plugins have no fee on the marketplace page used for this note. Confirm before you pay for anything.
2. The plugin id in `plugin.xml` is `ai.edengen.jetbrains`. Keep it once you publish.
3. Screenshots are unnecessary for the MCP JSON. They matter only if the plugin is published: the action dialog and a note that generation happens in AI Assistant.
4. Privacy https://edengen.ai/privacy, support support@edengen.ai.

## Review requirements

JetBrains plugin review checks the description, the license, and that the plugin does not phone home. This skeleton does not make network calls. The MCP connection is configured by the user in AI Assistant, not by the plugin.

## Costs

Generation spends Eden Gen workspace credit when the assistant creates a take. The estimate still comes from the server. This folder does not hardcode a price. There is no JetBrains charge for pasting the MCP JSON.

## Human still does

Install AI Assistant on IDE 2025.3 or newer, paste one of the JSON files, finish sign-in through `mcp-remote`, and run one estimate in chat. Screenshots only if you publish the optional plugin. Do not publish from this pull request.
