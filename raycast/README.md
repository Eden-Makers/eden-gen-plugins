# Eden Gen for Raycast

Commands: Generate Image, Generate Video, Generate Audio, List Models, Recent Takes, Check Balance.

Sign-in is a preference. OAuth uses PKCE S256 against `https://edengen.ai`, dynamic client registration, scope `takes`, and resource `https://edengen.ai/v1` so the token is accepted by the REST API. The web redirect Raycast documents for every extension is `https://raycast.com/redirect?packageName=Extension`. An API token from https://edengen.ai/app/developers also works when Sign-in is set to API token.

Each generate command estimates first, shows the USD total, and creates one take only after that. `aspect_ratio` is always sent. `max_cost_usd` is the estimated total. `confirm_cost` is sent only when the estimate says confirmation is required. Creation uses one new idempotency key and is not retried.

## Store submission

1. Replace `author` in `package.json` with the Raycast username that will publish. `edenmakers` is a placeholder.
2. From this folder: `npm install`, `npm run lint`, `npm run build`.
3. `npm run dev` and run every command against a real workspace: one estimate that you do not generate, one cheap image, the model list, recent takes, and the balance. Record that for the store if they ask.
4. Capture screenshots of Generate Image (with the price), Recent Takes, and Check Balance, on a dark UI. The extension uses Raycast's own chrome. The icon is the concept 12 mark.
5. Publish with `npx @raycast/api publish` only after the Raycast team account exists. Do not publish from this change.

## Review requirements

Raycast reviews the listing, the commands, and that a password preference is used for the token. OAuth must return to Raycast. The consent screen on edengen.ai will say the app is unverified until `raycast.com` is added to `src/lib/oauth-known-clients.ts` in takes. Registration already accepts the https redirect. See `TAKES-CHANGES-NEEDED.md`.

## Checks run here

`npx ray build` succeeds. `npx ray lint` succeeds for ESLint, Prettier, icons and the extension schema. It still exits with an error on `author` until that field is a Raycast username that exists. `edenmakers` returns 404 from `https://www.raycast.com/api/v1/users/edenmakers`. Replace it with the publisher's username and run `npx ray lint` again. That lookup is the store's account check. This change does not create the account.

## Human still does

A Raycast publisher account, the author username, screenshots, a trial of OAuth on a Mac, the known-client change in takes if you want the consent screen to name Raycast, and the publish click.
