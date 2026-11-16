# Eden Gen for Shopify

Product image generation for a merchant, shaped for the [Shopify Remix app template](https://github.com/Shopify/shopify-app-template-remix) (React Router is the current template name; the route layout is the same).

The server calls Eden Gen. The browser never sees the token. `EDEN_SHOP_TOKENS` is a JSON object of shop domain to personal token (`tkp_`), stored as a server environment variable. A real app should move that map into the template's database, keyed by shop, from a settings action. Do not commit the JSON.

`app/routes/app.generate.tsx` is the page. The first submit returns the estimate. `PriceStep` posts again with `confirm=yes`, and only then does `attachGeneratedImage` create a take, upload the bytes with `stagedUploadsCreate`, and add them with `productCreateMedia`. That mutation adds one image. `productSet` can replace the whole media list, so this scaffold does not use it. Admin API `2026-10` marks `productCreateMedia` deprecated. Re-check the mutation against the current Admin API before you submit the app.

`app/shopify.server.ts` throws until you replace `authenticate.admin` with the template's Shopify helper.

## Build

```bash
npm install
npm test
npm run typecheck
```

There is no `shopify app dev` session in this pull request. That command needs a Partner account.

Copy into a template created by `shopify app init --template=https://github.com/Shopify/shopify-app-template-remix`:

- `app/routes/app.generate.tsx`
- `src/attach.ts`
- the `EDEN_SHOP_TOKENS` lookup

In the template route, render `<PriceStep data={useActionData()} />`. Scopes in `shopify.app.toml` are `read_products,write_products`.

## Store submission

1. Create the app in the Shopify Partner dashboard for Edenmakers. Let the CLI write `client_id`. Do not invent one.
2. Install it on a development store. Paste a personal token into the server env for that shop. Show a price, then add one cheap image to a product. Confirm the existing gallery is still there.
3. Screenshots of the price and the product image. A short video of that path.
4. Privacy https://edengen.ai/privacy, support support@edengen.ai. The listing says a price is shown before credit is spent, and that the image is generated into the merchant's Eden Gen workspace.
5. Submit the app listing when you mean to. Do not submit from this pull request.

A Partner account has no fee in Shopify's public partner docs. A public app review is separate. Confirm protected customer data requirements in the checklist. This app does not request customer scopes.

## Review requirements

Shopify checks scopes, embedded auth, and that the app does what the listing says. The token stays on the server. The first action does not create a take.

## Costs

`usd_total` comes from the estimate. This folder does not hardcode a model price. A failed take is refunded when `refunded` is true. Shopify billing for the app, if you add a charge later, is separate from Eden Gen credit. This scaffold does not add a Shopify charge.

## Human still does

A Partner account, `shopify app dev`, the token map on the server, one product image, screenshots, the demo video, and the listing submit. Replace `productCreateMedia` if the API version you ship has removed it.
