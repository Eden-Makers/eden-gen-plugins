# Slack routes in the takes app

Implemented in draft https://github.com/Eden-Makers/takes/pull/67. Not merged and not deployed. This plugins repo does not run them.

| Method | Path | When |
|---|---|---|
| POST | `/api/slack/commands` | Slash command. 404 unless `SLACK_APP_ENABLED=1`. |
| GET | `/api/slack/oauth` | Add to Slack. No `code` starts the Slack authorize redirect. A `code` stores the install for the signed-in member. |

There is no `/api/slack/interactions` and no separate install route. The command does not create a take.

## `/edengen`

Ephemeral replies only.

- `/edengen` and `/edengen help`: how to use the command. Says a slash command does not spend credit.
- `/edengen balance` and `/edengen account`: the connected workspace name and balance, or a note to sign in at https://edengen.ai and open Add to Slack.
- Anything else: the same limit. Rendering stays in the app or a personal API token.

Signature check uses `SLACK_SIGNING_SECRET`. Slack OAuth uses `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, bot scope `commands`, and redirect `https://edengen.ai/api/slack/oauth`. The manifest in this folder matches that.

## Human still does

Create the Slack app from `manifest.json`, set the four Slack variables on the takes host, and Add to Slack while signed in at https://edengen.ai. Reviewer store id: `slack`.
