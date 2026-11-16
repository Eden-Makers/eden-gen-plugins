# Eden Gen for Chrome

Manifest V3 extension.

- Popup: prompt, image model, format, estimate, then one image take.
- Right-click an image: save it as a reference, edit it, or upscale it. Edit and upscale upload the image URL with `POST /v1/assets` (`{ url }`) and then estimate before create. Reference upload does not start a take.
- Options: API token, or Sign in with Eden Gen (OAuth PKCE, dynamic registration, scope `takes`, resource `https://edengen.ai/v1`).

Network calls run in the service worker. `host_permissions` for `https://edengen.ai/*` let that worker call the API without browser CORS. A page or popup that called `/v1` directly would still fail until the CORS change in `TAKES-CHANGES-NEEDED.md`.

The upscale default model is `nano-banana-pro`, which accepts image references. The prompt asks for an upscale that keeps the subject.

## Build

```bash
npm install
npm run typecheck
npm run build
```

Load `chrome/dist` as an unpacked extension. The store zip is that folder.

## Store submission

1. Pack `dist` after `npm run build`.
2. Chrome Web Store developer account for Eden makers s.r.o. Pay the registration fee. This change does not create the account.
3. Privacy policy https://edengen.ai/privacy. Permission justification: `contextMenus` for the image actions, `storage` for the token and the selected image, `identity` for OAuth, `tabs` to open the result, host access to `edengen.ai` and `media.edengen.ai` so the worker can call the API and open media.
4. Screenshots of the popup with a price, the context menu, and the editor page. A short demo video.
5. Single purpose: send prompts and selected images to the user's Eden Gen workspace.

## Review requirements

Google rejects extensions that take a broad host permission without a reason. This one does not ask for `<all_urls>`. An image that is not an http or https URL (a `data:` image) is refused, and the editor says so, because the API imports an http URL server-side.

OAuth redirect is `chrome.identity.getRedirectURL()` (`https://<extension-id>.chromiumapp.org/`). Dynamic registration accepts it. The Eden consent screen shows Unverified app until that host is added in takes, which can happen only after the store id exists.

## Human still does

The Web Store account, screenshots, the video, a manual pass of popup generate and all three context-menu actions, the known-client update after the extension id exists, and the submit click.
