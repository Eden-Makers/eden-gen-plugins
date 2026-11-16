# Eden Gen for Telegram

Bot with the same flow as Discord. `/imagine` and `/video` show the price from `POST /v1/estimate` and create a take only after the same person presses Spend. The file is sent back in the chat.

`/link` works only in a private chat. The next message is the personal token (`tkp_`). The bot deletes that message. A token sent in a group is ignored. `/login` is OAuth PKCE on `http://127.0.0.1` of the machine running the bot, which takes draft pull request 67 already trusts. `/balance` does not spend.

Linked accounts are stored in `telegram/data/links.json` (mode 0600, gitignored) unless `EDEN_LINK_STORE` is set. The store code is shared with the Discord bot. Treat the file as a secret.

## Build

```bash
npm install
npm test
npm run typecheck
```

Run, when you have a bot token from BotFather:

```bash
TELEGRAM_BOT_TOKEN=... npm start
```

Do not print the bot token. This pull request does not create a bot.

## Store submission

Telegram does not charge a fee to create a bot with BotFather, and there is no separate plugin store for this flow.

1. Talk to BotFather as the Edenmakers account. `/newbot`, name Eden Gen, username that is still free.
2. Put the token in the host's secret store.
3. Open a private chat, `/link`, then `/imagine` a cheap image. Confirm Spend posts a photo, and that a group chat will not accept a pasted token.
4. Screenshots of the price and the photo. A short video of the private-chat path.
5. Set the bot description to say a price is shown before credit is spent. Privacy https://edengen.ai/privacy, support support@edengen.ai.
6. Do not submit a directory listing from this pull request.

## Review requirements

If you later list the bot in a third-party directory, they usually ask for a privacy policy and a description that matches the commands. This bot does not log message text. It deletes the token message in private chats when Telegram allows the delete. `/login` fails for anyone who is not on the bot's machine. Use `/link`.

## Costs

The Spend button is `usd_total`. This folder does not hardcode a model price. A higher fresh estimate is refused. A failed take is refunded when `refunded` is true.

## Human still does

BotFather, the bot token, one private-chat generate, screenshots, and the demo video. A public OAuth callback is not set, because the bot is not hosted yet.
