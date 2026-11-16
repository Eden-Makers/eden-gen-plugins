# Eden Gen for Figma

Generate an image into the current selection, or into a new frame when nothing paintable is selected. The UI loads image models, lets you pick format and resolution, and shows an estimate before Generate.

Auth is a personal token (`tkp_`) from Settings, API and agents, saved with `figma.clientStorage`. Sign in uses OAuth PKCE and the redirect `https://www.figma.com/oauth/callback`. Paste that callback address back into the plugin. The desktop app does not return `window.opener`, so the paste step is the path that works in both the browser and the desktop app. The access token is for resource `https://edengen.ai/v1` and lasts about an hour. A personal token does not.

## Build

```bash
npm install
npm run typecheck
npm run build
```

`build` writes `code.js` and `ui.js` next to `manifest.json`. In Figma: Plugins, Development, Import plugin from manifest, choose `figma/manifest.json`.

## What still fails after the takes draft

Draft takes pull request 67 allows `https://figma.com` and `https://*.figma.com` on the token routes (`/v1/models`, `/v1/estimate`, `/v1/takes`, `/v1/account`). That is not on production until the draft is deployed. The finished file is a redirect to a signed media URL. That host does not send CORS for Figma, so placing the pixels still needs the change in `TAKES-CHANGES-NEEDED.md`.

`networkAccess.allowedDomains` lists `edengen.ai`, `media.edengen.ai` and `*.r2.cloudflarestorage.com`. Reviewer store id: `figma`.

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
