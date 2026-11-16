const { test } = require("node:test");
const assert = require("node:assert/strict");
const createTake = require("../creates/create-take");
const getTake = require("../creates/get-take");

test("create take estimates, then creates once with the shown cap", async () => {
  const calls = [];
  const z = {
    hash: () => "idem-from-hash",
    errors: { Error: class ZapError extends Error {} },
    request: async (options) => {
      calls.push(options);
      if (options.url.endsWith("/estimate")) {
        return { data: { usd_total: 0.2, can_run: true, needs_confirmation: true, blockers: [] } };
      }
      return { data: { id: "take_1", status: "queued" } };
    },
  };
  const result = await createTake.operation.perform(z, {
    inputData: { model: "nano-banana-2.1", prompt: "A red lighthouse at dusk", confirm_cost: true },
  });
  assert.equal(result.take.id, "take_1");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].headers["Idempotency-Key"], "idem-from-hash");
  assert.equal(calls[1].body.max_cost_usd, 0.2);
  assert.equal(calls[1].body.confirm_cost, true);
  assert.equal(calls[1].body.aspect_ratio, "16:9");
});

test("create take stops when confirmation is required and not given", async () => {
  const z = {
    errors: { Error: class ZapError extends Error {} },
    request: async () => ({ data: { usd_total: 9, can_run: true, needs_confirmation: true, blockers: [] } }),
  };
  await assert.rejects(
    () => createTake.operation.perform(z, { inputData: { model: "seedance-2.5", prompt: "A slow dolly, no music", confirm_cost: false } }),
    /confirm cost/i,
  );
});

test("get take requests that id and nothing else", async () => {
  let url = "";
  const z = {
    request: async (options) => {
      url = options.url;
      return { data: { id: "take_9", status: "succeeded" } };
    },
  };
  const take = await getTake.operation.perform(z, { inputData: { take_id: "take_9" } });
  assert.equal(take.status, "succeeded");
  assert.equal(url, "https://edengen.ai/v1/takes/take_9");
});
