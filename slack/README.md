# Eden Gen Slack app

`manifest.json` is a Slack app manifest for a bot and the `/edengen` slash command. `TAKES-ENDPOINTS.md` is the spec for the routes that must be built in the takes repository. This repository does not run a Slack server and does not create a Slack app.

## Submission steps

1. Implement the routes in takes, using `TAKES-ENDPOINTS.md`. Verify Slack signatures. Store tokens hashed or encrypted. Do not log them.
2. Create a Slack app in the Edenmakers workspace from `manifest.json`. Slack will show the client id and signing secret once. Put them in the takes secret store.
3. Install the app to a test workspace, connect a member with `/edengen connect`, run `/edengen image` through estimate and one approved cheap take.
4. If you want the app in the Slack Marketplace, use the Slack Marketplace form: privacy https://edengen.ai/privacy, support support@edengen.ai, a demo video of `/edengen`, and screenshots of the estimate and the result.

## Review requirements

Slack checks the slash command responds in three seconds (the spec acks first), that requests are signed, and that scopes match the manifest (`commands`, `chat:write`). The estimate message must make the credit spend obvious. Approve is the confirmation. Cancel does not call create.

## Human still does

The takes implementation, a Slack app in the Edenmakers org, secrets outside git, a demo video, screenshots, and any Marketplace submit. Do not submit from this pull request.
