# Eden Gen for Canva

Generate an image or a video into the open design. The panel loads models for the selected kind, shows the price from `POST /v1/estimate`, and places the file only after Generate and place.

Auth is a personal token (`tkp_`) from [Settings, API and agents](https://edengen.ai/app/settings?tab=api). It is kept in `localStorage` under `edengen.token` and is not written to the console. Canva does not publish a stable OAuth callback for apps, so this scaffold does not start an OAuth redirect. A developer key (`tk_`) also works.

Images are uploaded with `aiDisclosure: "app_generated"` and inserted with `addElementAtPoint`. Video uses the same path. The thumbnail is a PNG drawn in the panel (or `output.poster_url` when the take has one). Canva's servers fetch `output.url`, which must be https and must not redirect.

## Build

```bash
npm install
npm run typecheck
npm run build
```

`dist/` is the bundle (`index.html` and `index.js`). In the Canva developer portal, create an app and point the development URL at this bundle, or copy `src/` into the official starter kit if the portal asks for that layout. Do not invent an app id. The portal assigns it.

Enable these permissions before a review build:

- `canva:design:content:write`
- `canva:asset:private:write`

## CORS

The panel origin is `https://app-<lowercase-app-id>.canva-apps.com`. Draft takes pull request 67 does not allow it yet. Canva's servers fetch `output.url` (that URL must be https, status 200, and must not redirect). Image thumbnails use that same URL, so the image response also needs CORS for the app origin. The video thumbnail is a data URL from the panel, so it does not need CORS.

## Store submission

1. Create the app in the Canva developer portal from the Edenmakers team. Copy the App ID and send it for the CORS change. The id in the origin is lowercased.
2. Run the panel on a design: load models, show a price, generate one cheap image, confirm it lands on the canvas.
3. Screenshots: the price, the model picker, the placed image. A short video of that path.
4. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai. The listing says a price is shown before credit is spent.
5. Submit for review. Do not publish from this pull request.

Canva's developer portal does not show a listing fee on the public docs used for this scaffold. Confirm the current fee before you submit.

## Review requirements

Canva checks the UI kit, the AI disclosure flag, that asset URLs are public https, and that the app does what the listing says. This app uses `@canva/app-ui-kit` and sets `aiDisclosure` to `app_generated`. A token field is not logged.

## Costs

The figure on the panel is `usd_total` from the estimate. This folder does not hardcode a model price. A failed take is refunded when the take's `refunded` field is true. Confirming a take does not let you cancel it by closing the panel.

## Human still does

A Canva developer account, the App ID, the CORS and poster changes in takes, one real generate, screenshots, the demo video, and the submit click.
