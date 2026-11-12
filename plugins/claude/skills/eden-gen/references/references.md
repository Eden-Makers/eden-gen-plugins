# Reference inputs

Call `takes_list_references` to reuse an existing element or upload. Use IDs from the current workspace, never an invented or cross-workspace ID.

- Local file: `takes_create_upload_link({filename})`, upload the file to the returned one-time URL, then use the returned asset ID. Quote the local path and URL safely when executing a terminal upload. If the client cannot upload files, explain that limitation and use an existing asset or a user-provided HTTPS URL.
- HTTPS URL: `takes_import_reference({url})`.
- Existing take: `takes_import_reference({take_id})`.
- Reusable element: `takes_create_element({name,kind,asset_ids,notes})`, where kind is character, product, location or style. Saving an element writes workspace data.

Pass exactly the references intended for the generation, for example:

```json
{"references":[{"asset_id":"ID_FROM_UPLOAD","role":"first_frame"}]}
```

`first_frame` animates a still. `last_frame` constrains the ending when supported. `reference` conditions appearance. `element_id` refers to a saved set. Select a model that accepts the input type and estimate again whenever settings or references change.
