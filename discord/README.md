# Eden Gen for Discord

discord.js bot. `/imagine` takes a prompt, shows the price from `POST /v1/estimate`, and creates a take only after the same person presses Spend. The finished file is posted in the channel. `/balance` reads the workspace and does not spend. `/link` saves a personal token in a modal so it is not a channel message. `/login` runs OAuth PKCE against `http://127.0.0.1` on the machine that runs the bot. Loopback redirects are already trusted by takes draft pull request 67.

The link file defaults to `discord/data/links.json` (mode 0600, gitignored). Set `EDEN_LINK_STORE` to move it. Treat that file as a secret. It is not committed.

## Build

```bash
npm install
npm test
npm run typecheck
```

Run, when you have a bot token:

```bash
DISCORD_TOKEN=... DISCORD_APPLICATION_ID=... npm start
```

The process registers the global slash commands on startup. Do not print the bot token. This pull request does not create a Discord application.

Invite the bot with the `applications.commands` and `bot` scopes. It requests the Guilds intent only. It does not read message content, so a token pasted in a channel is not deleted. Tell people to use `/link`.

## Store submission

Discord does not have a paid plugin store for this bot. Publishing means inviting it to the Edenmakers server, and, if it will join 100 or more servers, Discord's verification review.

1. Create the application in the Discord developer portal under the Edenmakers team.
2. Bot, reset token, put it in the host's secret store. Privileged message content intent stays off.
3. Invite the bot. Run `/link`, then `/imagine` with a cheap image. Confirm the Spend button, and confirm someone else's button does nothing.
4. Screenshots of the price and the posted image. A short video of that path.
5. Privacy https://edengen.ai/privacy, support support@edengen.ai. The description says a price is shown before credit is spent.
6. Start verification only when the server count requires it. Do not submit from this pull request.

Creating a Discord application has no fee in the developer portal. Verification is a review, not a fee listed on that page. Confirm before you apply.

## Review requirements

Discord checks the intent list, the privacy policy, and that the bot does what the description says. This bot does not ask for message content. OAuth `/login` only works when the person approving can open a browser on the bot's machine, because the callback is loopback. Everyone else uses `/link`. A public callback would need a host and a known-client row. That host is not chosen here.

## Costs

The Spend button label is `usd_total`. This folder does not hardcode a model price. If the fresh estimate is higher than the button, the bot refuses and does not create. A failed take is refunded when `refunded` is true. The bot host's bill is separate from Eden Gen credit.

## Human still does

A Discord application, the bot token, an invite, one real `/imagine`, screenshots, the demo video, and verification if you cross 100 servers. `/login` from a laptop that is not the bot host will time out. Use `/link` for that.
