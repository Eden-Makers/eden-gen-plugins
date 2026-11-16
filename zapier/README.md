# Eden Gen on Zapier

Platform CLI app skeleton. It is not registered with `zapier register` and it is not pushed.

Actions:

- Create Take (`creates/create-take.js`). Estimates first. Creates one take only when `can_run` is true. If the estimate needs confirmation, the action errors unless Confirm cost is on. Sends `max_cost_usd` of the estimated total and one idempotency key.
- Get Take (`creates/get-take.js`). Fetches `GET /v1/takes/{id}`.

Auth is a custom API token field. The before-request hook sets `Authorization: Bearer`. The connection label is the static text `Eden Gen` so the token is not shown.

## Checks

```bash
npm install
npm test
npm run validate
```

`validate` loads `index.js`, which needs `zapier-platform-core`.

## Submission steps

1. `npm install -g zapier-platform-cli` on a machine signed into the Edenmakers Zapier partner account.
2. `zapier register "Eden Gen"` only when you mean to create the app. Then `zapier push` for a new version. Do not do either from this change.
3. In the Zapier UI, set the logo to the concept 12 mark, category Media or Productivity, homepage https://edengen.ai, privacy https://edengen.ai/privacy.
4. Invite a reviewer and give them a capped API token outside git.
5. Promote the version after Zapier approves it.

## Review requirements

Zapier checks auth with the account test (`GET /v1/account`), that creates return the sample shape, and that a user can see what a paid action will do. The Create Take description says it spends credit after the estimate.

## Human still does

A Zapier Platform account for Eden makers s.r.o., `zapier register` and `zapier push`, a test token for review, screenshots of a Zap, and the promote click.
