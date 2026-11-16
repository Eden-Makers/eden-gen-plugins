import { EdenGenClient, describeEstimate, filenameForTake, pricedTake, toArrayBuffer, type Estimate, type RunInput } from "../../edengen-rest/edengen-rest.ts";
import type { AdminClient, GraphqlResult } from "../app/shopify.server.ts";

export interface StagedTarget {
  url: string;
  resourceUrl: string;
  httpMethod?: string;
  parameters: Array<{ name: string; value: string }>;
}

function userErrors(result: GraphqlResult, key: string): string[] {
  const node = result.data?.[key] as { userErrors?: Array<{ message: string }>; mediaUserErrors?: Array<{ message: string }> } | undefined;
  const errors = [...(node?.userErrors ?? []), ...(node?.mediaUserErrors ?? [])];
  if (result.errors?.length) errors.push(...result.errors);
  return errors.map((error) => error.message).filter(Boolean);
}

export async function stageImage(admin: AdminClient, filename: string, mime: string, fileSize: number): Promise<StagedTarget> {
  const response = await admin.graphql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets { url resourceUrl httpMethod parameters { name value } }
        userErrors { field message }
      }
    }`,
    {
      variables: {
        input: [{ filename, mimeType: mime, resource: "IMAGE", fileSize: String(fileSize) }],
      },
    },
  );
  const body = await response.json();
  const errors = userErrors(body, "stagedUploadsCreate");
  if (errors.length) throw new Error(errors.join(" "));
  const target = (body.data?.stagedUploadsCreate as { stagedTargets?: StagedTarget[] } | undefined)?.stagedTargets?.[0];
  if (!target?.url || !target.resourceUrl) throw new Error("Shopify did not return an upload target.");
  return target;
}

export async function uploadStaged(target: StagedTarget, bytes: Uint8Array, mime: string, filename: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const method = (target.httpMethod ?? "POST").toUpperCase();
  let response: Response;
  if (method === "PUT") {
    const headers: Record<string, string> = { "Content-Type": mime };
    for (const parameter of target.parameters) headers[parameter.name] = parameter.value;
    response = await fetchImpl(target.url, { method: "PUT", headers, body: toArrayBuffer(bytes) });
  } else {
    const form = new FormData();
    for (const parameter of target.parameters) form.append(parameter.name, parameter.value);
    form.append("file", new Blob([toArrayBuffer(bytes)], { type: mime }), filename);
    response = await fetchImpl(target.url, { method: "POST", body: form });
  }
  if (!response.ok) throw new Error(`Shopify upload failed (${response.status}).`);
}

export async function addProductImage(admin: AdminClient, productId: string, originalSource: string, alt: string): Promise<void> {
  const response = await admin.graphql(
    `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
      productCreateMedia(productId: $productId, media: $media) {
        media { alt status }
        mediaUserErrors { field message }
      }
    }`,
    {
      variables: {
        productId,
        media: [{ originalSource, mediaContentType: "IMAGE", alt }],
      },
    },
  );
  const body = await response.json();
  const errors = userErrors(body, "productCreateMedia");
  if (errors.length) throw new Error(errors.join(" "));
}

export async function previewProductImage(args: { edenToken: string; prompt: string; model?: string; fetchImpl?: typeof fetch }): Promise<{ preview: string; canRun: boolean; usdTotal: number }> {
  const input: RunInput = { model: args.model ?? "nano-banana-2.1", prompt: args.prompt, aspect_ratio: "1:1" };
  const estimate = await new EdenGenClient(args.edenToken, args.fetchImpl).estimate(input);
  return { preview: describeEstimate(estimate), canRun: estimate.can_run, usdTotal: estimate.usd_total };
}

export async function attachGeneratedImage(args: {
  admin: AdminClient;
  productId: string;
  prompt: string;
  edenToken: string;
  model?: string;
  confirm: (estimate: Estimate) => boolean | Promise<boolean>;
  fetchImpl?: typeof fetch;
}): Promise<{ takeId: string; alt: string }> {
  const fetchImpl = args.fetchImpl ?? fetch;
  const client = new EdenGenClient(args.edenToken, fetchImpl);
  const input: RunInput = {
    model: args.model ?? "nano-banana-2.1",
    prompt: args.prompt,
    aspect_ratio: "1:1",
  };
  const take = await pricedTake(client, input, { confirm: args.confirm });
  const file = await client.download(take.id);
  const filename = filenameForTake(take);
  const mime = file.mime || take.output?.mime_type || "image/png";
  const target = await stageImage(args.admin, filename, mime, file.bytes.byteLength);
  await uploadStaged(target, file.bytes, mime, filename, fetchImpl);
  const alt = args.prompt.slice(0, 140);
  await addProductImage(args.admin, args.productId, target.resourceUrl, alt);
  return { takeId: take.id, alt };
}
