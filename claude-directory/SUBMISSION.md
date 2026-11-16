# Claude directory submission

Paste each block into the matching field at https://claude.ai/directory/manage. Do not submit from this repository.

The Claude Code plugin is already in this repo at `plugins/claude` (marketplace `.claude-plugin/marketplace.json`, remote `.mcp.json`, skill `eden-gen`). This folder is the directory text. Submit the remote connector even if the plugin is submitted too.

Server URL: `https://edengen.ai/mcp`

## Listing

Name (100 characters):

```
Eden Gen
```

One-liner (200 characters):

```
Generate images, video and audio with a price shown before every take and a project budget that holds.
```

Description (2000 characters):

```
Eden Gen is the image, video and audio workspace from Edenmakers. This connector lets Claude list models, price a generation, and start one take in the signed-in workspace.

Every paid call is estimated first. The estimate is in USD and uses the same checks as creation. If the price is above the workspace confirmation threshold, Claude asks before it starts the take. An accepted take cannot be cancelled. Failed takes are refunded. A result marked simulated is a test render, not a finished file.

The connection is limited to one project and the monthly cap approved on the consent screen. OAuth uses PKCE and dynamic client registration. The only scope is takes.

Uploads and generated files are stored for the workspace. Prompts are sent to the model providers that render the take. Eden Gen does not ask Claude for unrelated account data.
```

Categories (pick one to five on the form; these match the product):

```
Creative
Media
Productivity
```

Documentation URL: `https://edengen.ai/docs/agents`

Privacy policy URL: `https://edengen.ai/privacy`

Support contact: `support@edengen.ai`

Terms URL, if asked: `https://edengen.ai/terms`

Slug, if asked: `eden-gen`

Icon: the concept 12 mark in `plugins/claude/assets/icon.png` (amber to crimson, three slanted bars). Export a square PNG from that file if the form rejects the existing asset. Do not draw a new mark.

## Company

Company name: `Eden makers s.r.o.`

Website: `https://edengen.ai`

Address, if asked: Plzeňská 3352/156, 150 00 Praha 5, Czech Republic. IČO 24518344. VAT CZ24518344.

Primary review contact: the person who owns the Anthropic org. Use support@edengen.ai for users.

## Use cases

Primary use cases:

```
Price an image, video or audio generation before spending credit.
Generate one take after the person accepts the estimate.
Check the workspace balance, project budget and recent takes.
Reuse a reference image, first frame or saved element.
```

What users need before they connect:

```
An Eden Gen account at https://edengen.ai, a verified email, and workspace credit. The consent screen asks for one project and a monthly cap. A free Claude login can add the connector for themselves. A directory listing needs a paid Claude plan on an Anthropic organization owned by Eden makers s.r.o.
```

Reads and writes:

```
Reads the catalog, projects, balance, takes and saved references. Writes a take (spends credit), an upload, an imported reference or a saved element. Generation does not delete workspace data.
```

## Authentication

Authentication requirement: `Required`

Authentication method: `OAuth 2.0`

How users sign in:

```
Claude discovers OAuth from the 401 and from /.well-known/oauth-protected-resource/mcp and /.well-known/oauth-authorization-server. The server supports dynamic client registration for public clients, PKCE S256, and the single scope takes. Do not send a client secret. token_endpoint_auth_method is none. Leave Anthropic's "hold our OAuth client secret" fields empty.
```

## Data handling

```
The API is Eden Gen's own. Prompts and reference media are sent to the model provider that renders the take. Eden Gen stores prompts, outputs and uploads for the workspace. It does not handle personal health data. The connector is not sponsored content.
```

## Tools

The live server is the source of tool names. Annotations are already set on the server (`title`, `readOnlyHint`, `destructiveHint`). Generation spends credit and is not marked destructive, because it does not delete data. These are the tools a reviewer should be able to call:

| Tool | Kind |
|---|---|
| takes_list_models | Read catalog |
| takes_list_projects | Read projects |
| takes_estimate | Read a price, no charge |
| takes_account | Read balance and threshold |
| takes_list | Read takes |
| takes_get | Read one take |
| takes_list_references | Read references |
| takes_create | Write, spends credit |
| takes_finish | Write, spends credit for a final |
| takes_create_upload_link | Write an upload link |
| takes_import_reference | Write a reference |
| takes_create_element | Write a saved element |

Provider tools (`takes_replicate_*`, `takes_sunra_*`, `takes_wavespeed_*`, `takes_machgen_*`, `takes_llm_*`, `takes_read_text`) are also on the server. A reviewer who calls every tool will see them. Do not hide them in the listing.

## Test prompts

Use these in a custom connector before the directory test step. They are the three examples the directory policy asks for, plus two that cover a refusal.

1. `List Eden Gen image models and estimate one 16:9 still of a red lighthouse at dusk. Do not generate it.`
2. `Show my Eden Gen balance and whether a one dollar image can run.`
3. `Estimate the cheapest image of a red square, then generate exactly one take if I say yes. Tell me the take id and the price.`
4. `Show my latest Eden Gen takes and do not create another.`
5. `Cancel my latest Eden Gen take.` Expected: Claude says an accepted take cannot be cancelled, and does not invent a refund.

## Review requirements

- Remote HTTPS server. OAuth with discovery. Tool titles and read or destructive hints.
- Privacy policy covers collection, use, storage, sharing, retention and a contact. https://edengen.ai/privacy is that page. Confirm it still says those things before you submit.
- A test account with sample credit, no second factor that a reviewer cannot pass. takes has reviewer sign-in behind `REVIEWER_ACCESS=1`. Turn it on in production, create one Claude reviewer, and paste the password only into Anthropic's form. Do not put it in git.
- Icon, and MCP App screenshots if the form asks, captured from a real Claude chat that rendered an image.
- Test every tool in a conversation or the MCP Inspector, including the provider tools.
- The plugin package validator has reported `LICENSE_MISSING` on some local packages. `plugins/claude/LICENSE` is the MIT license for the plugin files. Confirm that file is inside the package you upload.

## Human still does

- Paid Claude organization for Eden makers s.r.o.
- Turn on reviewer access and create the test account.
- Run the prompts above and keep the transcripts.
- Capture the icon and any screenshots.
- Submit the connector at claude.ai/directory/manage, and the plugin only after the license check is confirmed.
- Do not submit from this pull request.
