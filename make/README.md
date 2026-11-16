# Eden Gen on Make

`app.json` is a custom-app sketch: an API token connection and three modules (estimate, create, get). `blueprint.json` is a scenario that estimates, creates only when `can_run` is true, and then fetches the take. Make's importer is stricter than this sketch. Treat the JSON as the contract to rebuild in the Make apps editor, not as a file Make is guaranteed to import unchanged.

## Submission steps

1. In Make, open Custom apps and create Eden Gen with base URL `https://edengen.ai/v1` and a bearer token connection.
2. Add the three modules from `app.json`. Create must send `Idempotency-Key` and must not fire unless an estimate said `can_run`.
3. Import or rebuild `blueprint.json` as a private scenario and run it once on a cheap image.
4. To list the app publicly, use Make's app submission form: privacy https://edengen.ai/privacy, support support@edengen.ai, a logo (concept 12), and a scenario video.

## Review requirements

Make wants a working connection test against `GET /v1/account`, modules whose outputs match live responses, and a clear note that Create spends credit.

## Human still does

A Make account that can publish custom apps, the editor work if import fails, one real scenario run, screenshots, and the public submit. This change does not create the app on Make.
