# Eden Gen Slack app

`manifest.json` matches the takes draft: bot scope `commands`, slash command `POST https://edengen.ai/api/slack/commands`, redirect `https://edengen.ai/api/slack/oauth`. `/edengen` shows help and the connected balance. It does not spend credit. The routes exist in takes pull request 67 and stay off until `SLACK_APP_ENABLED=1`. This repository does not run them.

## Submission steps

1. Deploy takes pull request 67 when you mean to. The routes are already specified in `TAKES-ENDPOINTS.md`.
2. Create a Slack app in the Edenmakers workspace from `manifest.json`. Put `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, and `SLACK_SIGNING_SECRET` in the takes secret store, then set `SLACK_APP_ENABLED=1`. Reviewer store id: `slack`.
3. Install the app to a test workspace, connect a member with `/edengen connect`, run `/edengen image` through estimate and one approved cheap take.
4. If you want the app in the Slack Marketplace, use the Slack Marketplace form: privacy https://edengen.ai/privacy, support support@edengen.ai, a demo video of `/edengen`, and screenshots of the estimate and the result.

## Review requirements

Slack checks the slash command responds in three seconds (the spec acks first), that requests are signed, and that scopes match the manifest (`commands`, `chat:write`). The estimate message must make the credit spend obvious. Approve is the confirmation. Cancel does not call create.

## Human still does

The takes implementation, a Slack app in the Edenmakers org, secrets outside git, a demo video, screenshots, and any Marketplace submit. Do not submit from this pull request.
