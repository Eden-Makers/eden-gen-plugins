import assert from "node:assert/strict";
import test from "node:test";
import type { AdminClient } from "../app/shopify.server.ts";
import { attachGeneratedImage } from "./attach.ts";

test("a confirmed estimate is uploaded to Shopify and added to the product", async () => {
  const queries: string[] = [];
  const admin: AdminClient = {
    async graphql(query) {
      queries.push(query);
      if (query.includes("stagedUploadsCreate")) {
        return {
          json: async () => ({
            data: {
              stagedUploadsCreate: {
                stagedTargets: [{ url: "https://upload.shopify.test/put", resourceUrl: "https://cdn.shopify.test/image.png", httpMethod: "PUT", parameters: [{ name: "acl", value: "private" }] }],
                userErrors: [],
              },
            },
          }),
        };
      }
      if (query.includes("productCreateMedia")) {
        return { json: async () => ({ data: { productCreateMedia: { media: [{ alt: "A product", status: "UPLOADED" }], mediaUserErrors: [] } } }) };
      }
      throw new Error(query.slice(0, 40));
    },
  };
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/v1/estimate")) {
      return Response.json({ usd_total: 0.05, usd_each: 0.05, count: 1, model: "nano-banana-2.1", can_run: true, needs_confirmation: true });
    }
    if (url.endsWith("/v1/takes") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      assert.equal(body.confirm_cost, true);
      return Response.json({ id: "take1", status: "succeeded", model: "nano-banana-2.1", output: { url: "https://media.edengen.ai/p.png", mime_type: "image/png", filename: "p.png" } });
    }
    if (url.endsWith("/v1/takes/take1")) {
      return Response.json({ id: "take1", status: "succeeded", model: "nano-banana-2.1", output: { url: "https://media.edengen.ai/p.png", mime_type: "image/png", filename: "p.png" } });
    }
    if (url.includes("/content")) return new Response(new Uint8Array([1, 2, 3, 4]), { status: 200, headers: { "Content-Type": "image/png" } });
    if (url === "https://upload.shopify.test/put") {
      assert.equal(init?.method, "PUT");
      const headers = init?.headers as Record<string, string>;
      assert.equal(headers.acl, "private");
      return new Response(null, { status: 201 });
    }
    return new Response(`unexpected ${url}`, { status: 500 });
  };
  const result = await attachGeneratedImage({
    admin,
    productId: "gid://shopify/Product/1",
    prompt: "A product on a glacier",
    edenToken: "tkp_testtokenvalue",
    confirm: () => true,
    fetchImpl,
  });
  assert.equal(result.takeId, "take1");
  assert.equal(queries.length, 2);
});

test("a declined price does not call Shopify", async () => {
  let graphql = 0;
  const admin: AdminClient = {
    async graphql() {
      graphql += 1;
      return { json: async () => ({}) };
    },
  };
  const fetchImpl: typeof fetch = async (input) => {
    if (String(input).endsWith("/v1/estimate")) {
      return Response.json({ usd_total: 2, usd_each: 2, count: 1, model: "m", can_run: true, needs_confirmation: false });
    }
    return new Response("no", { status: 500 });
  };
  await assert.rejects(() =>
    attachGeneratedImage({
      admin,
      productId: "gid://shopify/Product/1",
      prompt: "no",
      edenToken: "tkp_testtokenvalue",
      confirm: () => false,
      fetchImpl,
    }),
  );
  assert.equal(graphql, 0);
});
