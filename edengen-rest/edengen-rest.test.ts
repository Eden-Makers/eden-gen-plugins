import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CancelledError,
  EdenGenClient,
  EdenGenError,
  WAVE2_BROWSER_ORIGINS,
  describeEstimate,
  looksLikeToken,
  maskToken,
  pricedTake,
  runBody,
} from "./edengen-rest.ts";

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

test("run body asks the server to confirm only after approval", () => {
  const input = { model: "nano-banana-2.1", prompt: "A glacier at dusk" };
  assert.equal(runBody(input, false).confirm_cost, undefined);
  assert.equal(runBody(input, true).confirm_cost, true);
  assert.equal(runBody(input, false).aspect_ratio, "16:9");
  assert.equal(runBody(input, false).count, 1);
});

test("mask and detect tokens without keeping the secret", () => {
  assert.equal(maskToken("tkp_abcdefghijklmnop"), "tkp_...mnop");
  assert.equal(maskToken("short"), "(hidden)");
  assert.equal(looksLikeToken("tkp_abc"), true);
  assert.equal(looksLikeToken("tk_abc"), true);
  assert.equal(looksLikeToken("hello tkp_abc"), false);
});

test("priced take estimates, confirms, creates once, and polls", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/estimate")) return jsonResponse({ usd_total: 0.04, usd_each: 0.04, count: 1, model: "nano-banana-2.1", can_run: true, needs_confirmation: true });
    if (url.endsWith("/takes")) {
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers["Idempotency-Key"], "key-1");
      const body = JSON.parse(String(init?.body));
      assert.equal(body.confirm_cost, true);
      return jsonResponse({ id: "take1", status: "queued", model: "nano-banana-2.1" });
    }
    if (url.endsWith("/takes/take1")) {
      return jsonResponse({
        id: "take1",
        status: "succeeded",
        model: "nano-banana-2.1",
        cost_usd: 0.04,
        output: { url: "https://media.edengen.ai/take1.png", mime_type: "image/png", filename: "take1.png" },
      });
    }
    return jsonResponse({ error: { message: "no", code: "no" } }, 404);
  };
  const client = new EdenGenClient("tkp_testtokenvalue", fetchImpl);
  let shown = "";
  const take = await pricedTake(
    client,
    { model: "nano-banana-2.1", prompt: "A glacier at dusk" },
    {
      idempotencyKey: "key-1",
      intervalMs: 0,
      confirm(estimate) {
        shown = describeEstimate(estimate);
        return true;
      },
    },
  );
  assert.match(shown, /\$0\.04/);
  assert.equal(take.output?.filename, "take1.png");
  assert.equal(calls.filter((call) => call.includes("/takes") && call.startsWith("POST")).length, 1);
});

test("a declined estimate never creates", async () => {
  let posts = 0;
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith("/estimate")) {
      return jsonResponse({ usd_total: 1, usd_each: 1, count: 1, model: "m", can_run: true, needs_confirmation: false });
    }
    posts += 1;
    return jsonResponse({});
  };
  const client = new EdenGenClient("tk_developerkeyvalue", fetchImpl);
  await assert.rejects(
    () => pricedTake(client, { model: "m", prompt: "x" }, { confirm: () => false, intervalMs: 0 }),
    CancelledError,
  );
  assert.equal(posts, 0);
});

test("blockers stop the run", async () => {
  const fetchImpl: typeof fetch = async () =>
    jsonResponse({ usd_total: 9, usd_each: 9, count: 1, model: "m", can_run: false, needs_confirmation: true, blockers: ["Balance too low."] });
  const client = new EdenGenClient("tkp_testtokenvalue", fetchImpl);
  await assert.rejects(
    () => pricedTake(client, { model: "m", prompt: "x" }, { confirm: () => true }),
    (error: unknown) => error instanceof EdenGenError && /Balance too low/.test(error.message),
  );
});

test("api errors keep the server message", async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({ error: { message: "Unknown model.", code: "unknown_model" } }, 400);
  const client = new EdenGenClient("tkp_testtokenvalue", fetchImpl);
  await assert.rejects(() => client.listModels(), (error: unknown) => error instanceof EdenGenError && error.code === "unknown_model");
});

test("wave 2 origin notes are listed for the takes app", () => {
  const doc = readFileSync(new URL("../TAKES-CHANGES-NEEDED-WAVE2.md", import.meta.url), "utf8");
  for (const origin of Object.values(WAVE2_BROWSER_ORIGINS)) {
    assert.ok(doc.includes(origin), origin);
  }
});
