# Eden Gen for Webflow

Designer Extension (`apiVersion` 2) that generates an image, uploads it with `webflow.createAsset`, and inserts an Image element after the current selection.

The panel shows the price from `POST /v1/estimate` before it creates a take. Bytes are read from `GET /v1/takes/{id}/content` inside the extension iframe, so that response has to send CORS for the extension origin (or stream the file instead of redirecting). See `TAKES-CHANGES-NEEDED-WAVE2.md`.

Auth is a personal token (`tkp_`) from [Settings, API and agents](https://edengen.ai/app/settings?tab=api), stored in `localStorage` as `edengen.token`. Webflow does not publish one OAuth callback for every Designer Extension, so this scaffold does not start a redirect.

## Build

```bash
npm install
npm run typecheck
npm run build
```

`webflow.json` serves `dist/`. A person with the Webflow CLI runs `webflow extension serve` from this folder and opens the Designer. Do not invent an extension id. The Designer iframe origin is `https://<extension-id>.webflow-ext.com`.

Designer images must be 4MB or smaller. If a take is larger, the extension surfaces the Webflow error and does not retry the create.

## Store submission

1. Create the app in the Webflow workspace from the Edenmakers account. Copy the extension id from the iframe host.
2. Ask for `https://<extension-id>.webflow-ext.com` on the takes token routes, including the content response.
3. In the Designer, select an element, show a price, generate one cheap image, confirm an Image element appears after the selection and the asset is in the Assets panel.
4. Screenshots of the price and the canvas. A short video of that path.
5. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai.
6. Submit the app for marketplace review. Do not submit from this pull request.

Webflow's public app docs used here do not list a submission fee. Confirm the current fee in the dashboard.

## Review requirements

Webflow checks that the extension uses Designer API v2, that asset MIME types are in their image list, and that the listing matches the panel. The token is not logged. The listing should say a price is shown before credit is spent, and that the image is inserted after the selected element.

## Costs

`usd_total` comes from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true.

## Human still does

A Webflow workspace that can create apps, the extension id, the CORS change in takes, one real insert, screenshots, the demo video, and the submit click.
