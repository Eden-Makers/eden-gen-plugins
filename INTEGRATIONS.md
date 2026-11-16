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
