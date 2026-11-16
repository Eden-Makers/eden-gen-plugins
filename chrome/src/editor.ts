import { DEFAULT_MODELS, type Asset, type Estimate, type ModelRecord } from "../../shared/edengen-rest";
import { call, imageRun, modelsOf, priceText, unwrap, UPSCALE_MODEL, UPSCALE_PROMPT } from "./page";
import type { PendingImage } from "./protocol";

const lead = document.querySelector<HTMLElement>("#lead")!;
const preview = document.querySelector<HTMLImageElement>("#preview")!;
const prompt = document.querySelector<HTMLTextAreaElement>("#prompt")!;
const model = document.querySelector<HTMLSelectElement>("#model")!;
const price = document.querySelector<HTMLElement>("#price")!;
const error = document.querySelector<HTMLElement>("#error")!;
let pending: PendingImage | null = null;
let asset: Asset | null = null;

function fail(cause: unknown) {
  error.textContent = cause instanceof Error ? cause.message : "Something went wrong.";
}

async function main() {
  const stored = await chrome.storage.session.get("pending-image");
  pending = (stored["pending-image"] as PendingImage | undefined) ?? null;
  if (!pending?.srcUrl) {
    lead.textContent = "No image was selected.";
    return;
  }
  preview.src = pending.srcUrl;
  if (pending.intent === "upscale") {
    lead.textContent = "Upscale this image. Estimate the price, then generate one take.";
    prompt.value = UPSCALE_PROMPT;
  } else if (pending.intent === "edit") {
    lead.textContent = "Edit this image. The original is uploaded as a reference.";
    prompt.value = "Change one detail and keep the subject.";
  } else {
    lead.textContent = "Save this image as a reference. That upload does not start a paid take.";
  }

  const response = unwrap(await call({ type: "models" }), "models");
  const images = modelsOf("image", response.models);
  const preferred = pending.intent === "upscale" ? UPSCALE_MODEL : DEFAULT_MODELS.image;
  model.replaceChildren(
    ...images.map((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      option.selected = item.id === preferred;
      return option;
    }),
  );
}

main().catch(fail);

async function ensureAsset(): Promise<Asset> {
  if (asset) return asset;
  if (!pending?.srcUrl.startsWith("https://") && !pending?.srcUrl.startsWith("http://")) {
    throw new Error("This image is not an http URL. Open the full image and try again.");
  }
  const response = unwrap(await call({ type: "upload-url", url: pending.srcUrl }), "asset");
  asset = response.asset;
  return asset;
}

document.querySelector("#save")!.addEventListener("click", async () => {
  error.textContent = "";
  try {
    const saved = await ensureAsset();
    price.textContent = `Saved as reference ${saved.id}. No take was created.`;
  } catch (cause) {
    fail(cause);
  }
});

document.querySelector("#run")!.addEventListener("click", async () => {
  error.textContent = "";
  try {
    const saved = await ensureAsset();
    const input = imageRun({
      model: model.value,
      prompt: prompt.value,
      aspectRatio: "16:9",
      assetId: saved.id,
      role: "reference",
    });
    const priced = unwrap(await call({ type: "estimate", input }), "estimate");
    price.textContent = priceText(priced.estimate);
    if (!priced.estimate.can_run) return;
    const created = unwrap(
      await call({
        type: "create",
        input: { ...input, max_cost_usd: priced.estimate.usd_total },
        confirm: priced.estimate.needs_confirmation,
      }),
      "take",
    );
    price.textContent = `Take ${created.take.id} is ${created.take.status}.`;
  } catch (cause) {
    fail(cause);
  }
});
