import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const dist = resolve(root, "dist");
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const entries = ["background", "popup", "options", "editor"];
await Promise.all(
  entries.map((name) =>
    build({
      entryPoints: [resolve(root, "src", `${name}.ts`)],
      outfile: resolve(dist, `${name}.js`),
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "chrome120",
      legalComments: "none",
    }),
  ),
);

await cp(resolve(root, "manifest.json"), resolve(dist, "manifest.json"));
await cp(resolve(root, "src/styles.css"), resolve(dist, "styles.css"));
for (const page of ["popup", "options", "editor"]) {
  await cp(resolve(root, "src", `${page}.html`), resolve(dist, `${page}.html`));
}
await cp(resolve(root, "icons"), resolve(dist, "icons"), { recursive: true });
console.log(`Built ${dist}`);
