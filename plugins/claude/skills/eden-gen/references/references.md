# Reference inputs

Call `takes_list_references` to reuse an existing element or upload. Use IDs from the current workspace, never an invented or cross-workspace ID.

- Local file: `takes_create_upload_link({filename})` where `filename` is the path of the local file (absolute recommended). Run the returned command, which looks like `curl -X PUT --data-binary @'/abs/path.png' "<url>"`, then use the `id` in its JSON output as the asset ID. Accepted: PNG, JPEG, WebP, MP4, MOV, WebM, WAV, MP3, M4A, MIDI and 3D meshes. The link works for one successful upload within 30 minutes; a refused file leaves it valid, so fix the file and send it again. Quote the local path and URL safely (single quotes) when executing a terminal upload. If the client cannot upload files, explain that limitation and use an existing asset or a user-provided HTTPS URL.
- HTTPS URL: `takes_import_reference({url})`.
- Existing take: `takes_import_reference({take_id})`.
- Reusable element: `takes_create_element({name,kind,asset_ids,notes})`, where kind is character, product, location or style. Saving an element writes workspace data.

Pass exactly the references intended for the generation, for example:

```json
{"references":[{"asset_id":"ID_FROM_UPLOAD","role":"first_frame"}]}
```

`first_frame` animates a still. `last_frame` constrains the ending when supported. `reference` conditions appearance. `element_id` refers to a saved set. Image models take a `first_frame` as a reference image. An element expands to all of its images, and every image counts against the model's reference limit (`Refs:` in `takes_list_models`), so keep elements to the clearest 1-4 images. Select a model that accepts the input type and estimate again whenever settings or references change.
