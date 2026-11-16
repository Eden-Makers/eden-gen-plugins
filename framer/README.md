# Eden Gen for Framer

Plugin panel that generates an image and places it with `framer.addImage`. The panel loads image models, shows the price from `POST /v1/estimate`, then creates one take and polls until it finishes. Framer's servers fetch `output.url`, so that URL must be public https.

Auth is a personal token (`tkp_`) from [Settings, API and agents](https://edengen.ai/app/settings?tab=api), stored in `localStorage` as `edengen.token`. Framer does not publish one OAuth callback for every plugin, so this scaffold does not start a redirect. A developer key (`tk_`) also works.

## Build

```bash
npm install
npm run typecheck
npm run build
```

Open the plugin in Framer from `dist/` (Plugins, Development, Open Development Plugin) or point Framer at this folder if your Framer build expects the official Vite template. Do not invent a plugin id. Copy it from the Plugins dashboard after you create the plugin.

## CORS

Framer review loads `https://<plugin-id>-<version-id>.plugins.framercdn.com`. Installed copies load `https://<plugin-id>.plugins.framercdn.com`. Both must be allowed on the takes token routes. The version label changes every submit, so the allowlist should match the plugin id with an optional `-[version]` label. See `TAKES-CHANGES-NEEDED-WAVE2.md` and https://www.framer.com/developers/plugins-cors.

## Store submission

1. Create the plugin in the Framer dashboard with the Edenmakers account. Copy the plugin id.
2. Ask for both framercdn origins on the takes token routes before you submit. Review fails if only the production host is allowed.
3. Run one cheap image on a canvas: price, generate, confirm the image is on the canvas.
4. Screenshots of the price and the placed image. A short video of that path.
5. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai.
6. Submit for marketplace review. Do not submit from this pull request.

Framer's public plugin docs used here do not list a submission fee. Confirm the current fee in the dashboard.

## Review requirements

Framer checks CORS on both hosts, that the plugin uses the current `@framer/plugin` API, and that the listing matches the panel. The token is not logged. The listing should say a price is shown before credit is spent.

## Costs

`usd_total` comes from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true. Closing the plugin after you confirm does not cancel the take.

## Human still does

A Framer account that can publish, the plugin id, the CORS change in takes, one real generate, screenshots, the demo video, and the submit click.
