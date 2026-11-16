import { DEFAULT_MODELS, type Estimate, type ModelRecord } from "../../shared/edengen-rest";
import { call, imageRun, modelsOf, priceText, unwrap } from "./page";

const prompt = document.querySelector<HTMLTextAreaElement>("#prompt")!;
const model = document.querySelector<HTMLSelectElement>("#model")!;
const aspect = document.querySelector<HTMLSelectElement>("#aspect")!;
const price = document.querySelector<HTMLElement>("#price")!;
const error = document.querySelector<HTMLElement>("#error")!;
let estimate: Estimate | null = null;
let models: ModelRecord[] = [];

function showError(cause: unknown) {
  error.textContent = cause instanceof Error ? cause.message : "Something went wrong.";
}

function currentInput() {
  return imageRun({ model: model.value, prompt: prompt.value, aspectRatio: aspect.value });
}

call({ type: "models" })
  .then((response) => {
    const listed = unwrap(response, "models");
    models = modelsOf("image", listed.models);
    model.replaceChildren(
      ...models.map((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = item.name;
        option.selected = item.id === DEFAULT_MODELS.image;
        return option;
      }),
    );
    fillAspect();
  })
  .catch(showError);

model.addEventListener("change", () => {
  estimate = null;
  fillAspect();
});
prompt.addEventListener("input", () => {
  estimate = null;
});
aspect.addEventListener("change", () => {
  estimate = null;
});

function fillAspect() {
  const selected = models.find((item) => item.id === model.value);
  const ratios = selected?.aspect_ratios?.length ? selected.aspect_ratios : ["16:9", "9:16", "1:1"];
  aspect.replaceChildren(
    ...ratios.map((ratio) => {
      const option = document.createElement("option");
      option.value = ratio;
      option.textContent = ratio;
      option.selected = ratio === "16:9";
      return option;
    }),
  );
}

document.querySelector("#estimate")!.addEventListener("click", async () => {
  error.textContent = "";
  try {
    const response = unwrap(await call({ type: "estimate", input: currentInput() }), "estimate");
    estimate = response.estimate;
    price.textContent = priceText(response.estimate);
  } catch (cause) {
    showError(cause);
  }
});

document.querySelector("#generate")!.addEventListener("click", async () => {
  error.textContent = "";
  if (!estimate?.can_run) {
    error.textContent = "Estimate a run that can start before generating.";
    return;
  }
  try {
    const created = unwrap(
      await call({
        type: "create",
        input: { ...currentInput(), max_cost_usd: estimate.usd_total },
        confirm: estimate.needs_confirmation,
      }),
      "take",
    );
    price.textContent = `Take ${created.take.id} is ${created.take.status}.`;
    const finished = await poll(created.take.id);
    price.textContent =
      finished.status === "succeeded"
        ? `Ready. Take ${finished.id}.`
        : finished.status === "failed"
          ? `Failed and refunded: ${finished.error ?? finished.id}`
          : `Still ${finished.status}. Take ${finished.id}.`;
    if (finished.output?.url) chrome.tabs.create({ url: finished.output.url });
  } catch (cause) {
    showError(cause);
  }
});

async function poll(id: string) {
  const deadline = Date.now() + 3 * 60_000;
  for (;;) {
    const response = unwrap(await call({ type: "get-take", id }), "take");
    if (response.take.status === "succeeded" || response.take.status === "failed" || Date.now() > deadline) return response.take;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
