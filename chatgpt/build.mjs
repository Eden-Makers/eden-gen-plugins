import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PYTHON = `
import sys, zipfile
source, destination, *names = sys.argv[1:]
with zipfile.ZipFile(destination, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for name in names:
        info = zipfile.ZipInfo(name)
        info.date_time = (2026, 11, 16, 0, 0, 0)
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        with open(source + "/" + name, "rb") as handle:
            archive.writestr(info, handle.read())
`;

const root = dirname(fileURLToPath(import.meta.url));
const source = resolve(root, "plugin");
const outFile = join(root, "eden-gen-openai-plugin.zip");

const files = await walk(source);
const forbidden = files.filter((file) => /(?:^|\/)(?:\.app\.json|hooks\/|secrets)/.test(file) || file.endsWith(".env"));
if (forbidden.length) throw new Error(`Refusing to pack ${forbidden.join(", ")}`);
if (!files.includes("plugin.json") || !files.includes("mcp.json") || !files.includes("skills/eden-gen/SKILL.md")) {
  throw new Error("The plugin root is missing plugin.json, mcp.json or the eden-gen skill.");
}

const listing = JSON.parse(await readFile(join(source, "plugin.json"), "utf8"));
const iface = listing.extensions["com.openai"].interface;
if (iface.displayName.length > 30 || iface.shortDescription.length > 30) {
  throw new Error("Listing name or subtitle is over the 30 character submission limit.");
}
for (const prompt of iface.defaultPrompt) {
  if (prompt.length > 128 || prompt.includes("@")) throw new Error(`Starter prompt is invalid: ${prompt}`);
}
const cases = listing.extensions["com.openai"].review.test_cases;
if (cases.positive.length !== 5 || cases.negative.length !== 3) {
  throw new Error("MCP review needs exactly five positive and three negative cases.");
}

await writeZip(files, source, outFile);
const packed = await readFile(outFile);
const names = zipNames(packed);
if (names.filter((name) => name.endsWith("plugin.json")).length !== 1) {
  throw new Error("The ZIP must contain exactly one plugin.json at the archive root.");
}
if (names.some((name) => name.includes("..") || name.startsWith("/"))) throw new Error("Unsafe ZIP path.");
console.log(`${outFile} (${packed.length} bytes, sha256 ${createHash("sha256").update(packed).digest("hex").slice(0, 16)})`);

async function walk(dir, prefix = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) found.push(...(await walk(join(dir, entry.name), rel)));
    else found.push(rel);
  }
  return found.sort();
}

async function writeZip(names, sourceDir, destination) {
  await mkdir(dirname(destination), { recursive: true });
  const python = spawnSync(
    "python3",
    ["-c", PYTHON, sourceDir, destination, ...names],
    { stdio: "inherit" },
  );
  if (python.status !== 0) throw new Error("zip build failed");
}

function zipNames(buffer) {
  // Local file headers: PK\\x03\\x04, name length at offset 26.
  const names = [];
  let offset = 0;
  while (offset + 30 < buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const compressed = buffer.readUInt32LE(offset + 18);
    const name = buffer.subarray(offset + 30, offset + 30 + nameLength).toString("utf8");
    names.push(name);
    offset += 30 + nameLength + extraLength + compressed;
  }
  return names;
}
