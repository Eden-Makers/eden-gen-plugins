# Eden Gen for Figma

Generate an image into the current selection, or into a new frame when nothing paintable is selected. The UI loads image models, lets you pick format and resolution, and shows an estimate before Generate.

Auth is an API token from https://edengen.ai/app/developers, saved with `figma.clientStorage`. Figma's plugin UI is an iframe, so OAuth redirect is a poor fit and is not implemented.

## Build

```bash
npm install
npm run typecheck
npm run build
```

`build` writes `code.js` and `ui.js` next to `manifest.json`. In Figma: Plugins, Development, Import plugin from manifest, choose `figma/manifest.json`.

## Why generation can fail until takes changes

The plugin UI calls `https://edengen.ai/v1` with `fetch`. A live check on 2026-11-16 showed `/v1` responses do not send `Access-Control-Allow-Origin`. The Figma iframe cannot read them until takes adds that header. The finished file is fetched from its output URL, which also has to allow the plugin origin. Both are specified in `TAKES-CHANGES-NEEDED.md`.

`networkAccess.allowedDomains` already lists `edengen.ai`, `media.edengen.ai` and `*.r2.cloudflarestorage.com`.

## Store submission

1. Create the plugin in the Figma community from the Edenmakers organization. The manifest id `eden-gen` is local. Figma replaces it with a numeric id when you publish. Do not invent one.
2. Run the plugin on a file: load models, estimate, generate one cheap image, confirm it lands in the selection and, with an empty selection, in a new frame.
3. Screenshots: the price, the model picker, the placed frame. A short video of that path.
4. Privacy https://edengen.ai/privacy, support support@edengen.ai, homepage https://edengen.ai.
5. Submit for community review. Do not publish from this pull request.

## Review requirements

Figma reviews network access, that the plugin does what the listing says, and that a token field is not logged. The listing should say a price is shown before credit is spent, and that one take cannot be cancelled after it is accepted.

## Human still does

A Figma account that can publish, the CORS change in takes, screenshots, the demo video, and the community submit.
