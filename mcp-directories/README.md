# MCP directory listings

Listing metadata for the remote server `https://edengen.ai/mcp`. Nothing here has been submitted.

OAuth is discovered from the server: RFC 9728 and RFC 8414, dynamic client registration, PKCE S256, scope `takes`. Do not put an API token in these files.

## Install

[Add to Cursor](https://cursor.com/install-mcp?name=eden-gen&config=eyJ1cmwiOiJodHRwczovL2VkZW5nZW4uYWkvbWNwIn0=)

[Add to VS Code](vscode:mcp/install?%7B%22name%22%3A%22eden-gen%22%2C%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A//edengen.ai/mcp%22%7D)

The Cursor link is the base64 of `{"url":"https://edengen.ai/mcp"}`. Cursor asks before it writes the config and then runs OAuth.

VS Code Insiders can also open `https://insiders.vscode.dev/redirect/mcp/install?name=eden-gen&config=eyJ0eXBlIjoiaHR0cCIsInVybCI6Imh0dHBzOi8vZWRlbmdlbi5haS9tY3AifQ==` (base64 of `{"type":"http","url":"https://edengen.ai/mcp"}`). If that redirect path has changed, use the `vscode:mcp/install` link or paste `snippets/vscode.json` into MCP settings.

| Editor | Snippet |
|---|---|
| VS Code | `snippets/vscode.json` |
| Windsurf | `snippets/windsurf.json` in Cascade MCP settings |
| Zed | `snippets/zed.json` under `context_servers` |

## Files

| File | Directory | What a person still does |
|---|---|---|
| `smithery.yaml` | Smithery | Sign in at smithery.ai/new, publish URL `https://edengen.ai/mcp`, complete the OAuth scan. The live publish flow is the URL form. This file is the listing metadata to keep next to it. |
| `glama.json` | Glama | Claim the connector that appears after the official registry entry, and submit the GitHub repo if Glama still wants a server listing. Serve the maintainer claim if they ask for `/.well-known/glama.json`. Do not weaken auth so an anonymous probe can pass. |
| `mcp-so.json` | mcp.so | Create the listing from this metadata. mcp.so has asked for a paid or account submission. Confirm the current form. |
| `composio.json` | Composio | Submit in the Composio developer console. Resource for MCP tools is `https://edengen.ai/mcp`. |
| `cline-marketplace.json` | Cline | Open a pull request on `cline/marketplace` with this entry. Do not publish it from this repository. |
| `goose-extension.yaml` | Goose | Extensions, Add custom extension, type Streamable HTTP, URI `https://edengen.ai/mcp`. Paste this block into Goose config if the UI asks for YAML. |

## Review requirements that repeat

- Public HTTPS MCP URL.
- OAuth that a reviewer can finish, with a test workspace. Reviewer sign-in in takes stays off until `REVIEWER_ACCESS=1` (`docs/REVIEWERS.md` in the takes repo). Do not put passwords in git.
- Privacy https://edengen.ai/privacy, terms https://edengen.ai/terms, docs https://edengen.ai/docs/agents, support support@edengen.ai.
- Tool list comes from the live server. Do not paste a stale copy into a directory that scans the server itself.

## Human still does

Accounts on Smithery, Glama, mcp.so, Composio, and a Cline marketplace pull request. Screenshots only where a form asks. No submission has been made from this change.
