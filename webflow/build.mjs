import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/index.js",
  format: "esm",
  target: "es2022",
  logLevel: "info",
});
cpSync("src/index.html", "dist/index.html");
cpSync("src/styles.css", "dist/styles.css");
