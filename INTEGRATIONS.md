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
| Slack (`slack/`) | Manifest matches takes draft PR 67. Server is in that draft, not here | Slack app in the Edenmakers workspace | Set `SLACK_APP_ENABLED` and the Slack secrets, Add to Slack, reviewer store id `slack` | No |
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

<!-- wave-2-additive-section -->

# Wave 2

This section is additive. The wave 1 table, when that pull request is merged, stays above this heading. If git reports an add/add conflict on this file, keep the wave 1 table and append everything below this heading. Do not delete wave 1 rows from this section, and do not edit wave 1 rows here.

Nothing in this table was submitted, published, or deployed by this change. "Built" means the folder is ready for a person to review. Generation spends Eden Gen workspace credit. Each folder shows the estimate from `POST /v1/estimate` before it creates a take. Prices are not hardcoded in these folders.

| Target | Built | Needs an account | Needs a human step | Submitted |
|---|---|---|---|---|
| Canva (`canva/`) | Yes. Apps SDK panel, image and video insert | Canva developer, Edenmakers team | App ID, CORS origin in takes, permissions, one real generate, screenshots, video, submit | No |
| Adobe Express (`adobe-express/`) | Yes. Add-on panel, image insert | Adobe developer, Edenmakers org | Private listing to learn the `wxp.adobe-addons.com` host, CORS in takes, screenshots, video, submit | No |
| Framer (`framer/`) | Yes. Plugin panel, image on the canvas | Framer developer | Plugin ID, both framercdn CORS origins in takes, screenshots, submit | No |
| Notion (`notion/`) | Yes. Custom MCP path documented, plus a CLI that appends an image block | Notion admin on Business or Enterprise for custom MCP. An internal integration token for the CLI | Confirm the OAuth redirect before marking it verified, enable custom MCP, run the CLI once | No |
| Discord (`discord/`) | Yes. discord.js `/imagine` with link and confirm | Discord application in the Edenmakers team | Bot token, invite, screenshots, verification only if the bot will be in 100 or more servers | No |
| Telegram (`telegram/`) | Yes. `/imagine` and `/video`, token only in a private chat | BotFather bot | Bot token, one private-chat trial, screenshots | No |
| VS Code (`vscode/`) | Yes. Command palette generate, MCP provider for `https://edengen.ai/mcp` | Marketplace publisher if it will be public | `vsce package`, screenshots, one generate into a workspace | No |
| JetBrains (`jetbrains/`) | Doc for AI Assistant MCP, plus a plugin skeleton that is not compiled here | JetBrains account only if the skeleton is later published. MCP setup needs no store | Paste the MCP JSON on IDE 2025.3 or newer. OAuth goes through `mcp-remote` | No |
| Shopify (`shopify/`) | Yes. Remix-shaped app route and tested product-image flow | Shopify Partner | `shopify app dev` on the Remix template, protected customer data review if the listing asks, screenshots | No |
| WordPress (`wordpress/eden-gen/`) | Yes. Block editor panel for a featured image or an inline image | WordPress.org plugin account for a public listing | Zip `eden-gen`, one generate on a site, screenshots, readme assets | No |
| Webflow (`webflow/`) | Yes. Designer extension, image on the canvas | Webflow workspace that can create apps | Extension id, CORS origin in takes, `webflow extension serve`, screenshots, submit | No |
| Apple Shortcuts (`apple-shortcuts/`) | Yes. Recipe and an unsigned `.shortcut` | None to share a shortcut. An iCloud or RoutineHub account only if it is published | Open the shortcut on a Mac, sign it, share-sheet trial | No |
| Hugging Face (`huggingface/`) | Yes. Gradio Space that calls `/v1` with the visitor's token | Hugging Face account to create the Space | Create the Space from this folder, do not put a token in Space secrets, screenshots | No |
