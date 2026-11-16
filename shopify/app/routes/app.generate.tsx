import { useState } from "react";
import { authenticate } from "../shopify.server.ts";
import { attachGeneratedImage, previewProductImage } from "../../src/attach.ts";

/**
 * Drop-in route for the Shopify Remix template (`app/routes/app.generate.tsx`).
 * The template's `shopify.server` export replaces `authenticate` in this repo.
 * The merchant's Eden token is read on the server from EDEN_SHOP_TOKENS, a JSON
 * map of shop domain to token. Do not put that map in the browser bundle.
 */
function tokenForShop(shop: string): string {
  const raw = process.env.EDEN_SHOP_TOKENS ?? "";
  if (!raw) return "";
  const parsed = JSON.parse(raw) as Record<string, string>;
  return parsed[shop] ?? "";
}

export async function loader({ request }: { request: Request }) {
  await authenticate.admin(request);
  return null;
}

export async function action({ request }: { request: Request }) {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const productId = String(form.get("productId") ?? "").trim();
  const prompt = String(form.get("prompt") ?? "").trim();
  const edenToken = tokenForShop(session.shop);
  if (!productId || !prompt) return { error: "Choose a product and write a prompt." };
  if (!edenToken) return { error: "Save this shop's Eden Gen token in EDEN_SHOP_TOKENS on the server." };
  try {
    if (form.get("confirm") !== "yes") {
      const preview = await previewProductImage({ edenToken, prompt });
      return { ...preview, productId, prompt };
    }
    const shown = Number(form.get("usd"));
    const result = await attachGeneratedImage({
      admin,
      productId,
      prompt,
      edenToken,
      confirm: (estimate) => estimate.can_run && (!Number.isFinite(shown) || estimate.usd_total <= shown + 0.000_001),
    });
    return { takeId: result.takeId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Eden Gen failed." };
  }
}

export function PriceStep({
  data,
}: {
  data?: { preview?: string; error?: string; takeId?: string; canRun?: boolean; productId?: string; prompt?: string; usdTotal?: number } | null;
}) {
  if (!data) return null;
  if (data.error) return <p>{data.error}</p>;
  if (data.takeId) return <p>Added take {data.takeId} to the product.</p>;
  if (!data.preview) return null;
  return (
    <form method="post">
      <p>{data.preview}</p>
      <input type="hidden" name="productId" value={data.productId ?? ""} />
      <input type="hidden" name="prompt" value={data.prompt ?? ""} />
      <input type="hidden" name="usd" value={data.usdTotal ?? ""} />
      <input type="hidden" name="confirm" value="yes" />
      <button type="submit" disabled={data.canRun === false}>
        Spend and add to product
      </button>
    </form>
  );
}

export default function Generate() {
  const [note] = useState("Show price sends the prompt to the server. Credit is spent only from the second button.");
  return (
    <section>
      <h1>Eden Gen</h1>
      <p>{note}</p>
      <form method="post">
        <label>
          Product id
          <input name="productId" placeholder="gid://shopify/Product/..." required />
        </label>
        <label>
          Prompt
          <textarea name="prompt" required />
        </label>
        <button type="submit">Show price</button>
      </form>
    </section>
  );
}
