# ChatGPT and Codex plugin

The uploadable package is the contents of `plugin/`. `node build.mjs` writes `eden-gen-openai-plugin.zip` with `plugin.json` at the archive root, plus `mcp.json`, the `eden-gen` skill, the icon and the license. The ZIP uses fixed timestamps so the same tree builds the same archive. The committed ZIP is that file. Rebuild it when `plugin/` changes.

Upload that ZIP at https://platform.openai.com/plugins. Choose With MCP. One remote server: `https://edengen.ai/mcp`.

## What the package already satisfies

- Agent Plugins manifest with listing fields under `extensions.com.openai.interface`.
- Name and subtitle within 30 characters. Starter prompts within 128 characters and without @mentions.
- Five positive and three negative review cases.
- Skill that tells the model to estimate before `takes_create`, set `9:16` for vertical, and not retry a create blindly.
- No `.app.json`, no lifecycle hooks, no client secret, no reviewer password.

## Domain challenge

OpenAI shows a token in the portal. Draft takes pull request 67 answers `GET https://edengen.ai/.well-known/openai-apps-challenge` with the `OPENAI_APPS_CHALLENGE` value as `text/plain`. Unset answers 404. That pull request is not merged. Paste the token into the env var after deploy. Do not commit it. Verification does not use the MCP client certificate, so the challenge URL must be reachable without mTLS.

## Submission steps

1. Use `eden-gen-openai-plugin.zip`, or rebuild it with `node build.mjs`.
2. Sign in to the OpenAI platform as the Eden makers s.r.o. developer identity. Complete identity verification if it is still open.
3. Upload the ZIP. Fix anything the validator flags, then connect the MCP server.
4. Serve the challenge token from takes and click verify.
5. Finish OAuth in the portal (dynamic registration, PKCE, scope `takes`).
6. Read the tool scan. Generation tools already ship an Apps SDK UI resource from the server.
7. Add the demo recording URL and reviewer access in the dashboard form. The package deliberately omits `demo_recording_url`, `test_credentials` and `reviewer_instructions` because the portal rejects secrets in the ZIP and a recording does not exist yet.
8. Submit for review only after the five positive and three negative cases have been run in developer mode.

## Review requirements

- Verified publisher identity whose display name matches Edenmakers.
- Website, support, privacy and terms URLs. Support is https://edengen.ai/docs/help. Agent setup remains https://edengen.ai/docs/agents.
- Working OAuth, domain verification, current tool scan.
- Demo video of an estimate and one cheap generation.
- Reviewer account with credit and no blocking second factor. Use takes reviewer access (`REVIEWER_ACCESS=1`). Paste the password only into the OpenAI form.
- Commerce is declared false: ChatGPT does not take payment. Workspace credit is spent inside Eden Gen.

## Human still does

OpenAI organization and identity check, the challenge token in takes production, the demo video, screenshots the portal asks for, reviewer credentials, and the submit click. This repository does not upload the ZIP.
