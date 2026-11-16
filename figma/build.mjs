import { build } from "esbuild";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [resolve(root, "code.ts")],
  outfile: resolve(root, "code.js"),
  bundle: true,
  format: "iife",
  target: "es2020",
  legalComments: "none",
});

await build({
  entryPoints: [resolve(root, "ui.ts")],
  outfile: resolve(root, "ui.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2020",
  legalComments: "none",
});

console.log("Built figma/code.js and figma/ui.js");
