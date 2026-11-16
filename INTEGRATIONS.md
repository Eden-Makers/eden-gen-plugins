# Integration status

Nothing in this table was submitted, published or deployed by this change. "Built" means the folder in this repository is ready for a person to review and submit. The official MCP registry entry was already public before this work.

| Target | Built | Needs an account | Needs a human step | Submitted |
|---|---|---|---|---|
| ChatGPT and Codex plugin (`chatgpt/`) | Yes. ZIP built by `node chatgpt/build.mjs` | OpenAI platform identity for Eden makers s.r.o. | Domain challenge route in takes, demo video, reviewer password in the portal only, upload | No |
| Claude directory (`claude-directory/`) | Yes. Paste text. Code plugin already at `plugins/claude` | Paid Claude org | Reviewer account, screenshots, run every tool, submit the connector | No |
| Claude Code plugin (`plugins/claude`) | Yes, already in the repo | A Claude Code user can install from the marketplace entry | Confirm the package license check if a directory upload reports `LICENSE_MISSING` | No |
| Cursor plugin (`plugins/cursor`, PR 1) | Yes, on the parent branch | Cursor publisher | Load the plugin, finish OAuth, marketplace submit | No |
| Raycast (`raycast/`) | Yes | Raycast publisher. Set `author` to that username | Screenshots, OAuth trial on a Mac, publish | No |
| Droppy droplet (`droppy/`) | Yes. Not compiled here | Droppy Store is a GitLab merge request, no extra account beyond GitLab | `droppykit build` on a Mac, drop a PNG, replace the placeholder icon if asked | No |
| Figma (`figma/`) | Yes | Figma community publisher | CORS change in takes, then one real generate, screenshots | No |
| Chrome (`chrome/`) | Yes | Chrome Web Store developer fee | Unpacked trial, screenshots, video, submit | No |
| Slack (`slack/`) | Manifest and takes spec only. Server is not in this repo | Slack app in the Edenmakers workspace | Implement `slack/TAKES-ENDPOINTS.md` in takes, then create the app | No |
| Zapier (`zapier/`) | CLI skeleton with Create Take and Get Take | Zapier Platform partner | `zapier register` and `zapier push` when you mean it, test token for review | No |
| Make (`make/`) | App sketch and scenario blueprint | Make custom-app publisher | Rebuild in the Make editor if import is refused, run one scenario | No |
| n8n (`n8n-nodes-edengen/`) | Node package, not published | npm org and n8n Creator Portal | Provenance publish workflow, local n8n trial | No |
| Smithery (`mcp-directories/smithery.yaml`) | Listing metadata | Smithery account | Publish the URL and finish the OAuth scan | No |
| Glama (`mcp-directories/glama.json`) | Maintainer file | Glama account | Claim the connector and any server listing | No |
| mcp.so (`mcp-directories/mcp-so.json`) | Listing metadata | mcp.so account | Submit the current form | No |
| Composio (`mcp-directories/composio.json`) | Listing metadata | Composio developer account | Submit in their console | No |
| Cline marketplace (`mcp-directories/cline-marketplace.json`) | Catalog entry to copy | GitHub account that can open a PR on `cline/marketplace` | Open that PR. Do not do it from this change | No |
| Goose (`mcp-directories/goose-extension.yaml`) | Custom extension YAML | None for a private install | Paste it into Goose. No public store submit | No |
| Windsurf, Zed, VS Code snippets | Yes, plus Cursor and VS Code install links in `mcp-directories/README.md` | None for a private install | Paste the snippet or use the deeplink | No |
| Gemini CLI (`gemini-extension.json`) | Yes, already in the repo | A Gemini CLI user | Install the extension | No |
| Official MCP registry `ai.edengen/eden-gen` | Already published | Domain proof, already done | Re-publish only if `server.json` changes | Already public. Not part of this change |
