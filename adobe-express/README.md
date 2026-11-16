# Eden Gen for Adobe Express

Add-on panel that generates an image and inserts it with `addOnUISdk.app.document.addImage`. The panel calls `POST /v1/estimate`, shows `usd_total`, then creates one take and polls `GET /v1/takes/{id}`.

Auth is a personal token (`tkp_`) from [Settings, API and agents](https://edengen.ai/app/settings?tab=api), stored in `localStorage` as `edengen.token`. Adobe Express add-ons do not have one published OAuth callback that every listing shares, so this scaffold does not open an authorize redirect. A developer key (`tk_`) also works.

The bytes are read from `GET /v1/takes/{id}/content`. That route redirects to a signed media URL today, and the media host does not send CORS for the add-on origin. Insert fails until takes streams the file with the token-route CORS headers. See `TAKES-CHANGES-NEEDED-WAVE2.md`.

## Build

```bash
npm install
npm run typecheck
npm run build
```

Load `dist/manifest.json` with the Adobe add-on CLI (`npx @adobe/ccweb-add-on-scripts`, or the Add-on CLI from Adobe's docs). `testId` is `edengen-adobe-express` for local development. Do not invent a marketplace id.

Local panel origin: `https://localhost:5241`.

After the first private listing, the origin becomes `https://<addon-id>.wxp.adobe-addons.com` and stays on that host. Copy it from the listing's Add-on URL.

## Store submission

1. Create the listing in the Adobe Express add-on submission portal with the Edenmakers organization.
2. Create a private link first so the `wxp.adobe-addons.com` host exists, then ask for that exact origin on the takes token routes.
3. Run one cheap image: price, generate, confirm it lands on the canvas.
4. Screenshots of the price and the inserted image. A short video of that path.
5. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai.
6. Submit for public review when you mean to. Do not submit from this pull request.

Adobe's public add-on docs used here do not list a submission fee. Confirm the current fee in the portal.

## Review requirements

Adobe reviews the manifest permissions, that network calls stay in the panel (not the document sandbox), and that the add-on matches the listing. This add-on requests `allow-popups` and `allow-popups-to-escape-sandbox` so a future sign-in window can open. The current flow does not open one. The token is not logged.

The listing should say a price is shown before credit is spent, and that a created take is not cancelled by closing the panel.

## Costs

`usd_total` comes from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true.

## Human still does

An Adobe developer account, the private listing (to learn the origin), the CORS change in takes, one real insert, screenshots, the demo video, and the public submit.
