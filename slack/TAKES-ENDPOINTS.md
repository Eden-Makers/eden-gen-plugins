# Slack endpoints for the takes repo

This file is a spec. Do not implement it in eden-gen-plugins. The routes belong in the takes app, behind the existing session, ledger and `createRun` / `submitTakes` path.

Nothing here is built, deployed or submitted. Slack app credentials stay in the takes secret store. Do not commit a signing secret, bot token or verification token.

## Routes

| Method | Path | Caller |
|---|---|---|
| POST | `/api/slack/commands` | Slack slash command `/edengen` |
| POST | `/api/slack/interactions` | Estimate approval buttons |
| GET | `/api/slack/install` | Starts Slack OAuth for a workspace admin |
| GET | `/api/slack/oauth` | Slack redirect. Exchanges the code and stores the bot token |

Suggested files in takes: `src/app/api/slack/commands/route.ts`, `src/app/api/slack/interactions/route.ts`, `src/app/api/slack/install/route.ts`, `src/app/api/slack/oauth/route.ts`, and `src/server/slack.ts`.

## Request verification

Every POST from Slack is `application/x-www-form-urlencoded` (commands) or a JSON string in the `payload` field (interactions).

1. Read the raw body before parsing.
2. Reject unless `X-Slack-Signature` matches `v0=` plus hex HMAC-SHA256 of `v0:{X-Slack-Request-Timestamp}:{raw body}` using `SLACK_SIGNING_SECRET`.
3. Reject when the timestamp is more than five minutes from now.
4. Reply 401 on failure. Do not create a take.

## Linking a Slack team to Eden Gen

Slack's user is not an Eden Gen member until someone connects them.

1. `/api/slack/install` redirects a signed-in Eden Gen owner to Slack's OAuth authorize URL, with bot scopes `commands` and `chat:write`. Redirect URI: `https://edengen.ai/api/slack/oauth`.
2. `/api/slack/oauth` exchanges the code with `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`, then stores `team_id`, encrypted bot token, and the Eden workspace id of the signed-in owner.
3. A member pastes a `tk_` API token once with `/edengen connect`. Store only the SHA-256 of that token, the same way `api_keys` already stores keys, plus `slack_user_id` and `team_id`. Show the token prefix back. Never echo the token into Slack.
4. Later slash commands resolve `team_id` + `user_id` to that key. No match replies with the connect instructions and does not call the ledger.

Add `https://edengen.ai/api/slack/oauth` only after Slack's documentation for that redirect is the one you register. Until the app exists, the consent screen would show the host as unverified if this were an Eden OAuth client. This flow is Slack's OAuth, not Eden's.

## Slash command

`/edengen` usage:

- `/edengen help`
- `/edengen balance`
- `/edengen connect` (opens a dialog; the token is a dialog input, not the slash text)
- `/edengen image <prompt>`
- `/edengen video <prompt>`
- `/edengen audio <prompt>`

Ack in under 3 seconds with `response_type: ephemeral` and the text `Estimating…`. Do the Eden call after the ack, then post to `response_url`.

For image, video and audio:

1. Pick a default model for that kind (`nano-banana-2.1`, `seedance-2.5`, `gemini-3-8-flash-tts`) unless the user has saved another id.
2. `POST /v1/estimate` with the linked key, `aspect_ratio: "16:9"`, `count: 1`.
3. If `can_run` is false, post the blockers. Do not create.
4. Post the USD total, model id and two buttons: Approve and Cancel. Cancel does nothing.
5. Approve calls `POST /v1/takes` once, with `Idempotency-Key` derived from the Slack `trigger_id`, `confirm_cost` true only when `needs_confirmation` was true, and `max_cost_usd` set to the estimated total.
6. Poll `GET /v1/takes/{id}` from the worker, not from the slash request. Post the output URL or the failure and refund note to the same `response_url` (it stays valid for 30 minutes). After that, post with `chat.postMessage` in the channel only if the install has `chat:write` and the command was not ephemeral-only. Prefer a thread reply when `channel_id` is present.

An accepted take cannot be cancelled. Say that on the estimate message.

## Environment

| Name | Purpose |
|---|---|
| `SLACK_CLIENT_ID` | Slack app client id |
| `SLACK_CLIENT_SECRET` | Slack app client secret |
| `SLACK_SIGNING_SECRET` | Verifies command and interaction bodies |

Do not add these to `.env.example` with real values. Names only.

## What this repo already contains

`slack/manifest.json` is the Slack app manifest whose request URLs are the routes above. A person creates the Slack app, pastes the manifest, and fills the secrets in takes. This repository does not call Slack.
