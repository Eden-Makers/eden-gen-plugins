import {
  DEFAULT_MODELS,
  EdenGenClient,
  type Estimate,
  type ModelRecord,
  assertPrompt,
  formatUsd,
} from "../shared/edengen-rest";

const tokenInput = document.querySelector<HTMLInputElement>("#token")!;
const promptInput = document.querySelector<HTMLTextAreaElement>("#prompt")!;
const modelSelect = document.querySelector<HTMLSelectElement>("#model")!;
const aspectSelect = document.querySelector<HTMLSelectElement>("#aspect")!;
const resolutionSelect = document.querySelector<HTMLSelectElement>("#resolution")!;
const price = document.querySelector<HTMLElement>("#price")!;
const error = document.querySelector<HTMLElement>("#error")!;
let models: ModelRecord[] = [];
let estimate: Estimate | null = null;

function show(cause: unknown) {
  error.textContent = cause instanceof Error ? cause.message : "Something went wrong.";
}

function client(): EdenGenClient {
  const token = tokenInput.value.trim();
  if (!token) throw new Error("Paste an API token from edengen.ai/app/developers.");
  return new EdenGenClient(token);
}

parent.postMessage({ pluginMessage: { type: "load-token" } }, "*");

window.onmessage = (event: MessageEvent) => {
  const message = event.data.pluginMessage as { type?: string; token?: string } | undefined;
  if (!message) return;
  if (message.type === "token") {
    tokenInput.value = message.token ?? "";
    if (tokenInput.value) void loadModels();
  }
  if (message.type === "saved") price.textContent = "Token saved in this file's plugin data.";
};

function selectedModel(): ModelRecord | undefined {
  return models.find((model) => model.id === modelSelect.value);
}

function fillOptions() {
  const model = selectedModel();
  const ratios = model?.aspect_ratios?.length ? model.aspect_ratios : ["16:9", "9:16", "1:1"];
  const resolutions = model?.resolutions?.length ? model.resolutions : [model?.default_resolution || "1K"];
  aspectSelect.replaceChildren(...options(ratios, aspectSelect.value || "16:9"));
  resolutionSelect.replaceChildren(...options(resolutions.filter(Boolean) as string[], model?.default_resolution || resolutions[0] || ""));
}

function options(values: string[], selected: string): HTMLOptionElement[] {
  return values.map((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    return option;
  });
}

async function loadModels() {
  error.textContent = "";
  const all = await client().listModels();
  models = all.filter((model) => model.kind === "image");
  modelSelect.replaceChildren(
    ...models.map((model) => {
      const option = document.createElement("option");
      option.value = model.id;
      option.textContent = model.name;
      option.selected = model.id === DEFAULT_MODELS.image;
      return option;
    }),
  );
  fillOptions();
}

function runInput() {
  return {
    model: modelSelect.value,
    prompt: assertPrompt(promptInput.value),
    aspect_ratio: aspectSelect.value || "16:9",
    resolution: resolutionSelect.value || undefined,
  };
}

document.querySelector("#save")!.addEventListener("click", () => {
  parent.postMessage({ pluginMessage: { type: "save-token", token: tokenInput.value.trim() } }, "*");
});

document.querySelector("#models")!.addEventListener("click", () => {
  loadModels().catch(show);
});

modelSelect.addEventListener("change", () => {
  estimate = null;
  fillOptions();
});
promptInput.addEventListener("input", () => {
  estimate = null;
});

document.querySelector("#estimate")!.addEventListener("click", async () => {
  error.textContent = "";
  try {
    estimate = await client().estimate(runInput());
    price.textContent = `${formatUsd(estimate.usd_total)} · balance ${formatUsd(estimate.balance_usd)} · ${
      estimate.can_run ? "can run" : `blocked: ${(estimate.blockers ?? []).join(" ")}`
    }${estimate.needs_confirmation ? " · confirm with Generate" : ""}`;
  } catch (cause) {
    show(cause);
  }
});

document.querySelector("#generate")!.addEventListener("click", async () => {
  error.textContent = "";
  try {
    if (!estimate?.can_run) throw new Error("Estimate a run that can start before generating.");
    const api = client();
    const input = { ...runInput(), max_cost_usd: estimate.usd_total };
    const created = await api.createTake(input, crypto.randomUUID(), estimate.needs_confirmation);
    price.textContent = `Take ${created.id} is ${created.status}.`;
    const finished = await api.waitForTake(created.id, { timeoutMs: 4 * 60_000 });
    if (finished.status !== "succeeded" || !finished.output?.url) {
      throw new Error(finished.status === "failed" ? `Failed and refunded: ${finished.error ?? finished.id}` : `Still ${finished.status}. Take ${finished.id}.`);
    }
    const response = await fetch(finished.output.url);
    if (!response.ok) throw new Error(`The file URL returned HTTP ${response.status}. Open it from Eden Gen if the browser blocked it.`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const blobUrl = URL.createObjectURL(new Blob([bytes]));
    const dimensions = await measure(blobUrl);
    URL.revokeObjectURL(blobUrl);
    parent.postMessage(
      {
        pluginMessage: {
          type: "insert",
          bytes: Array.from(bytes),
          width: dimensions.width,
          height: dimensions.height,
          name: finished.output.filename || `Eden Gen ${finished.id}`,
        },
      },
      "*",
    );
    price.textContent = `Placed ${finished.id} · ${formatUsd(finished.cost_usd)}`;
  } catch (cause) {
    show(cause);
  }
});

function measure(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Could not read the image size."));
    image.src = url;
  });
}
