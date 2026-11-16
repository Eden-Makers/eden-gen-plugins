# n8n-nodes-edengen

Community node package for Eden Gen. Operations: Estimate, Create Take, Get Take. The credential is an API token sent as `Authorization: Bearer`.

Create sends `aspect_ratio`, `count: 1`, one `Idempotency-Key`, and `confirm_cost` only when the boolean is on. Set Max cost from a previous Estimate node (`usd_total`) so the create cannot drift above the price you saw.

## Build

```bash
npm install
npm run typecheck
npm run build
```

`package.json` `n8n` points at `dist/`. Install the built package in a local n8n with Settings, Community nodes, or `npm link`, and run Estimate then Create on a cheap model.

## Submission steps

n8n verifies community nodes that are published to npm from GitHub Actions with provenance. Do not publish from a laptop, and do not publish from this change.

1. When you are ready, add the official n8n publish workflow and an npm token for the Edenmakers org.
2. Tag a release. The package name must stay `n8n-nodes-edengen`.
3. Submit the npm package in the n8n Creator Portal.
4. Privacy and homepage: https://edengen.ai/privacy and https://edengen.ai.

## Review requirements

Package name prefix `n8n-nodes-`, keyword `n8n-community-node-package`, nodes and credentials listed under `n8n`, credential field is a password, and the node does what the description says. A reviewer will want a test credential. Use a capped `tk_` key. Do not put it in git.

## Human still does

An npm org, the provenance workflow, a local n8n trial, Creator Portal submit, and a demo if they ask. This pull request does not publish to npm.
