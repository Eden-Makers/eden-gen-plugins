import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { LinkStore } from "./store.ts";

test("linked accounts round-trip without appearing in the assertion text beyond the fixture", () => {
  const file = join(mkdtempSync(join(tmpdir(), "edengen-")), "links.json");
  const store = new LinkStore(file);
  store.set("42", { kind: "personal", accessToken: "tkp_testtokenvalue" });
  const again = new LinkStore(file);
  assert.equal(again.get("42")?.kind, "personal");
  assert.equal(again.get("42")?.accessToken, "tkp_testtokenvalue");
  assert.equal(again.get("other"), undefined);
});
