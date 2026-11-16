import { build } from "esbuild";
import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
await build({
  entryPoints: ["src/index.tsx"],
  bundle: true,
  outfile: "dist/index.js",
  format: "esm",
  target: "es2022",
  jsx: "automatic",
  loader: { ".css": "css" },
  logLevel: "info",
});
cpSync("index.html", "dist/index.html");
