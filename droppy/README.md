# Eden Gen droplet for Droppy

Droppy's current extension format is a Droplet: a Swift package that builds a dynamic library against [DroppyKit](https://gitlab.com/droppyformac1/droppykit), with `droplet.json`, an Icon Composer document and a creator avatar. Quick Action tiles in the file tray are built into Droppy. They are not a community extension format, so this package is a shelf widget you drop an image onto.

Checked against DroppyKit 1.23.0 and later. The drop zone uses `onDrop` of file URLs plus `.droppyWidgetDropTarget`, which DroppyKit documents for widgets that take files. A settings pane stores the API token. A short HUD reports the result. `droppy://droplet/eden-gen/reference?path=/absolute/file.png` and `droppy://droplet/eden-gen/upscale?path=...` call the same upload.

Reference mode asks `POST /v1/uploads` for a one-time URL, PUTs the bytes, and stops. That does not start a paid take. A personal token (`tkp_`) from Settings, API and agents needs `uploads:write`. Upscale mode also needs `estimate` and `takes:write`. It estimates `nano-banana-pro` (it accepts image references and edits) with the saved prompt, then creates one take with `max_cost_usd` set to that estimate. Dedicated Topaz upscale ids in the catalog do not advertise a normal image reference slot, so the default model is Nano Banana Pro. Change the model id in settings if a later catalog row accepts a standard reference. Droppy has no OAuth redirect on the takes allowlist. Reviewer store id: `droppy`.

## Build on a Mac

This environment cannot compile DroppyKit. On macOS 14 or later, with Swift 6.2:

```bash
git clone https://gitlab.com/droppyformac1/droppykit.git
export PATH="$PWD/droppykit/Scripts:$PATH"
cd droppy
droppykit validate
droppykit build
```

Install the `.droplet` from Droppy's Store, Local droplets. The first unsigned build asks for approval.

## Store submission

The Droplet Store is review-and-sign. Open a merge request on https://gitlab.com/droppyformac1/droplets with this folder. Droppy's pipeline builds and signs it. Jordy designs Store icons. `EdenGen.icon` is a placeholder that uses the concept 12 mark. Replace it if review asks. `Creator.png` is the same mark, used as the creator avatar.

Capabilities requested: `network-client`, `hud`, `shelf-read`. No disk, camera or clipboard access.

## Review requirements

A person reads the droplet before it ships. The API token is a preference, not a secret in git. Say in the Store text that upscale spends credit after an estimate and that a reference upload does not.

## Human still does

Build and run it in Droppy or Droppy Playground, drop a PNG, confirm the reference id, run one cheap upscale, record a short video, replace the icon if required, and open the Store merge request. Do not submit from this pull request.
