import assert from "node:assert/strict";
import test from "node:test";
import { appendTakeImage, generateIntoPage, notionPageId } from "./notion.ts";
import type { Take } from "../../edengen-rest/edengen-rest.ts";

test("page ids come from a URL or a dashed id", () => {
  assert.equal(notionPageId("0123456789abcdef0123456789abcdef"), "01234567-89ab-cdef-0123-456789abcdef");
  assert.equal(
    notionPageId("https://www.notion.so/Eden-Gen-0123456789abcdef0123456789abcdef"),
    "01234567-89ab-cdef-0123-456789abcdef",
  );
});

test("file upload is preferred, and a missing upload route falls back to the external URL", async () => {
  const take: Take = {
    id: "take1",
    status: "succeeded",
    model: "nano-banana-2.1",
    output: { url: "https://media.edengen.ai/take1.png", mime_type: "image/png", filename: "take1.png" },
  };
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    if (url.endsWith("/file_uploads") && !url.includes("/send")) {
      return new Response("missing", { status: 404 });
    }
    if (url.includes("/blocks/") && url.endsWith("/children")) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.children[0].image.type, "external");
      assert.equal(body.children[0].image.external.url, take.output?.url);
      return new Response("{}", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response("no", { status: 500 });
  };
  const mode = await appendTakeImage({
    notionToken: "ntn_test",
    pageId: "01234567-89ab-cdef-0123-456789abcdef",
    take,
    bytes: new Uint8Array([1, 2, 3]),
    mime: "image/png",
    fetchImpl,
  });
  assert.equal(mode, "external");
  assert.ok(calls.some((call) => call.includes("/file_uploads")));
});

test("generate estimates, confirms, and uploads the file into Notion", async () => {
  let created = 0;
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/v1/estimate")) {
      return Response.json({ usd_total: 0.04, usd_each: 0.04, count: 1, model: "nano-banana-2.1", can_run: true, needs_confirmation: false });
    }
    if (url.endsWith("/v1/takes") && init?.method === "POST") {
      created += 1;
      return Response.json({ id: "take9", status: "succeeded", model: "nano-banana-2.1", output: { url: "https://media.edengen.ai/t.png", mime_type: "image/png", filename: "t.png" } });
    }
    if (url.endsWith("/v1/takes/take9") && (init?.method ?? "GET") === "GET" && !url.includes("/content")) {
      return Response.json({ id: "take9", status: "succeeded", model: "nano-banana-2.1", output: { url: "https://media.edengen.ai/t.png", mime_type: "image/png", filename: "t.png" } });
    }
    if (url.includes("/content")) {
      return new Response(new Uint8Array([9, 9]), { status: 200, headers: { "Content-Type": "image/png" } });
    }
    if (url.endsWith("/file_uploads")) {
      return Response.json({ id: "file1" }, { status: 200 });
    }
    if (url.endsWith("/file_uploads/file1/send")) return new Response("{}", { status: 200 });
    if (url.includes("/children")) {
      const body = JSON.parse(String(init?.body));
      assert.equal(body.children[0].image.file_upload.id, "file1");
      return new Response("{}", { status: 200 });
    }
    return new Response(`unexpected ${url}`, { status: 500 });
  };
  const result = await generateIntoPage({
    notionToken: "ntn_test",
    edenToken: "tkp_testtokenvalue",
    page: "0123456789abcdef0123456789abcdef",
    prompt: "A quiet library",
    confirm: () => true,
    fetchImpl,
  });
  assert.equal(created, 1);
  assert.equal(result.mode, "file_upload");
  assert.equal(result.take.id, "take9");
});
