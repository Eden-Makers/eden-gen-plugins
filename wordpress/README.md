# Eden Gen for WordPress

Plugin in `wordpress/eden-gen/`. The block editor gets a document panel: prompt, model, aspect, Show price, then Set featured image or Insert image.

The browser calls `/wp-json/edengen/v1/`. PHP holds the token in the `edengen_token` option (`autoload` is the default, but the value is not exposed to the editor script). Settings, Eden Gen, shows an empty password field. Saving a blank value keeps the current token. A token that does not start with `tkp_` or `tk_` is rejected.

Show price is `POST /v1/estimate`. The two insert buttons call `POST /v1/takes` with an idempotency key, then poll `GET /v1/takes/{id}`, then sideload `GET /v1/takes/{id}/content` into the media library. Featured image uses `set_post_thumbnail`. Insert image creates a `core/image` block. Callers need `edit_posts`, and sideload also checks `edit_post` on that post.

There is no OAuth redirect. Each site has a different admin URL, so a personal token in settings is the auth path. No takes CORS change is required.

## Check

```bash
php -l eden-gen/eden-gen.php
php -l eden-gen/includes/class-edengen-api.php
php -l eden-gen/includes/class-edengen-rest.php
node --check eden-gen/assets/editor.js
```

Zip the inner `eden-gen` folder so the zip root is the plugin, not `wordpress/`.

## Store submission

1. Create a WordPress.org account for Edenmakers. Plugin directory submission has no fee.
2. Activate the plugin on a site you can record. Save a token. Show a price. Set a featured image. Insert an inline image. Confirm the token is not in the page source.
3. Screenshots of the panel with a price, the featured image, and the inline block. A short video of both buttons. `readme.txt` assets go in `assets/` on the assets branch (banner, icon) when you submit. This repo does not include those images.
4. Privacy https://edengen.ai/privacy, support support@edengen.ai. The description says a price is shown before credit is spent.
5. Upload the zip on the plugin directory when you mean to. Do not submit from this pull request.

## Review requirements

The plugin team checks `readme.txt`, a license, no remote code that phones home unexpectedly, and that the description matches the panel. This plugin phones home only to `https://edengen.ai` with the stored token, from PHP. It does not track readers. It does not send the token to the block editor.

## Costs

The panel prints `usd_total` from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true. WordPress.org hosting of the plugin is free. Generation uses the site owner's Eden Gen credit.

## Human still does

A WordPress.org account, banner and icon art, one site trial of both buttons, screenshots, the demo video, and the directory upload. `readme.txt` lists `Contributors: edenmakers`. That username has to exist before the directory will accept the plugin.
