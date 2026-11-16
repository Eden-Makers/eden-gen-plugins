import assert from "node:assert/strict";
import test from "node:test";
import { parseImagine } from "./parse.ts";

test("imagine and video commands keep the prompt and ignore a bot mention", () => {
  assert.deepEqual(parseImagine("/imagine a glacier at dusk"), { kind: "image", prompt: "a glacier at dusk" });
  assert.deepEqual(parseImagine("/video@EdenGenBot slow dolly, no music"), { kind: "video", prompt: "slow dolly, no music" });
  assert.equal(parseImagine("hello"), undefined);
  assert.equal(parseImagine("/imagine")?.prompt, "");
});
