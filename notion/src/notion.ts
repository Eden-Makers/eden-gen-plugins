import {
  EdenGenClient,
  filenameForTake,
  toArrayBuffer,
  pricedTake,
  type Estimate,
  type RunInput,
  type Take,
} from "../../edengen-rest/edengen-rest.ts";

const NOTION = "https://api.notion.com/v1";

export function notionPageId(input: string): string {
  const hex = input.replace(/-/g, "").match(/[0-9a-f]{32}/i);
  if (!hex) throw new Error("Pass a Notion page URL or a 32-character page id.");
  const raw = hex[0].toLowerCase();
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

interface NotionFileUpload {
  id: string;
}

async function notionFetch(token: string, path: string, init: RequestInit, fetchImpl: typeof fetch, version: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Notion-Version", version);
  return fetchImpl(`${NOTION}${path}`, { ...init, headers });
}

export async function appendTakeImage(args: {
  notionToken: string;
  pageId: string;
  take: Take;
  bytes: Uint8Array;
  mime: string;
  fetchImpl?: typeof fetch;
}): Promise<"file_upload" | "external"> {
  const fetchImpl = args.fetchImpl ?? fetch;
  const filename = filenameForTake(args.take);
  const uploaded = await notionFetch(
    args.notionToken,
    "/file_uploads",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "single_part", filename, content_type: args.mime }),
    },
    fetchImpl,
    "2025-09-03",
  );
  if (uploaded.ok) {
    const file = (await uploaded.json()) as NotionFileUpload;
    const form = new FormData();
    form.set("file", new Blob([toArrayBuffer(args.bytes)], { type: args.mime }), filename);
    const sent = await notionFetch(args.notionToken, `/file_uploads/${encodeURIComponent(file.id)}/send`, { method: "POST", body: form }, fetchImpl, "2025-09-03");
    if (!sent.ok) {
      const detail = await sent.text();
      throw new Error(`Notion file upload failed (${sent.status}). ${detail.slice(0, 240)}`);
    }
    await appendBlock(args, fetchImpl, {
      type: "file_upload",
      file_upload: { id: file.id },
    });
    return "file_upload";
  }
  const url = args.take.output?.url;
  if (!url) throw new Error("The take has no file URL, and Notion file upload was refused.");
  await appendBlock(args, fetchImpl, { type: "external", external: { url } });
  return "external";
}

async function appendBlock(
  args: { notionToken: string; pageId: string; take: Take },
  fetchImpl: typeof fetch,
  image: Record<string, unknown>,
): Promise<void> {
  const caption = `Eden Gen take ${args.take.id}${args.take.simulated ? " (test result)" : ""}`;
  const response = await notionFetch(
    args.notionToken,
    `/blocks/${encodeURIComponent(args.pageId)}/children`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        children: [
          {
            object: "block",
            type: "image",
            image: {
              ...image,
              caption: [{ type: "text", text: { content: caption } }],
            },
          },
        ],
      }),
    },
    fetchImpl,
    "2022-06-28",
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Notion refused the image block (${response.status}). ${detail.slice(0, 240)}`);
  }
}

export async function generateIntoPage(args: {
  notionToken: string;
  edenToken: string;
  page: string;
  prompt: string;
  model?: string;
  aspectRatio?: string;
  confirm: (estimate: Estimate) => boolean | Promise<boolean>;
  fetchImpl?: typeof fetch;
}): Promise<{ take: Take; mode: "file_upload" | "external" }> {
  const fetchImpl = args.fetchImpl ?? fetch;
  const pageId = notionPageId(args.page);
  const client = new EdenGenClient(args.edenToken, fetchImpl);
  const input: RunInput = {
    model: args.model ?? "nano-banana-2.1",
    prompt: args.prompt,
    aspect_ratio: args.aspectRatio ?? "1:1",
  };
  const take = await pricedTake(client, input, { confirm: args.confirm });
  const file = await client.download(take.id);
  const mode = await appendTakeImage({
    notionToken: args.notionToken,
    pageId,
    take,
    bytes: file.bytes,
    mime: file.mime || take.output?.mime_type || "image/png",
    fetchImpl,
  });
  return { take, mode };
}
