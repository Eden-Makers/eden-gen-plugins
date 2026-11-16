import assert from "node:assert/strict";
import test from "node:test";
import { clearRuns, dropRun, stageRun, takeRun } from "./pending.ts";

test("only the person who staged a run can confirm it", () => {
  clearRuns();
  const id = stageRun("user-a", { model: "nano-banana-2.1", prompt: "A glacier" }, 0.04);
  assert.equal(takeRun(id, "user-b"), undefined);
  assert.equal(takeRun(id, "user-a")?.usdTotal, 0.04);
  assert.equal(takeRun(id, "user-a"), undefined);
});

test("cancel removes a pending run", () => {
  clearRuns();
  const id = stageRun("user-a", { model: "nano-banana-2.1", prompt: "A glacier" }, 0.04);
  assert.equal(dropRun(id, "user-b"), false);
  assert.equal(dropRun(id, "user-a"), true);
  assert.equal(takeRun(id, "user-a"), undefined);
});
