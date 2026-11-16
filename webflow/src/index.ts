import {
  CancelledError,
  DEFAULT_MODELS,
  EdenGenClient,
  TOKEN_SETTINGS_URL,
  describeEstimate,
  filenameForTake,
  toArrayBuffer,
  looksLikeToken,
  pricedTake,
  type Estimate,
  type ModelRecord,
} from "../../edengen-rest/edengen-rest.ts";

const TOKEN_KEY = "edengen.token";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

function field(label: string, control: HTMLElement): HTMLElement {
  const wrap = el("label");
  wrap.append(el("span", label), control);
  return wrap;
}

function main() {
  const root = document.querySelector("#app");
  if (!root) return;
  const token = el("input");
  token.type = "password";
  token.autocomplete = "off";
  token.placeholder = "tkp_...";
  token.value = localStorage.getItem(TOKEN_KEY) ?? "";
  const model = el("select");
  const aspect = el("select");
  for (const value of ["1:1", "16:9", "9:16", "4:3"]) {
    const option = el("option", value);
    option.value = value;
    aspect.append(option);
  }
  const prompt = el("textarea");
  const note = el("p");
  const error = el("p");
  error.className = "error";
  const button = el("button", "Show price");
  let estimate: Estimate | null = null;

  root.append(
    el("p", "Eden Gen by Edenmakers. Select an element, then generate. The image is inserted after the selection."),
    field("API token", token),
    field("Model", model),
    field("Aspect", aspect),
    field("Prompt", prompt),
    note,
    error,
    button,
  );
  const help = el("a", "Create a token");
  help.href = TOKEN_SETTINGS_URL;
  help.target = "_blank";
  help.rel = "noreferrer";
  root.append(help);

  token.addEventListener("change", () => {
    const value = token.value.trim();
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
    void loadModels();
  });

  async function loadModels() {
    if (!looksLikeToken(token.value)) return;
    try {
      const client = new EdenGenClient(token.value);
      const images = client.modelsFor("image", await client.listModels());
      fillModels(images);
    } catch (reason) {
      error.textContent = reason instanceof Error ? reason.message : "Could not load models.";
    }
  }

  function fillModels(images: ModelRecord[]) {
    model.replaceChildren();
    const list = images.length ? images : [{ id: DEFAULT_MODELS.image, name: DEFAULT_MODELS.image }];
    for (const item of list) {
      const option = el("option", item.name);
      option.value = item.id;
      model.append(option);
    }
  }

  function runInput() {
    return { model: model.value || DEFAULT_MODELS.image, prompt: prompt.value.trim(), aspect_ratio: aspect.value };
  }

  button.addEventListener("click", async () => {
    error.textContent = "";
    if (!looksLikeToken(token.value)) {
      error.textContent = "Paste a personal token from Settings, API and agents. It starts with tkp_.";
      return;
    }
    if (!prompt.value.trim()) {
      error.textContent = "Write a prompt first.";
      return;
    }
    button.disabled = true;
    try {
      const client = new EdenGenClient(token.value);
      if (!estimate) {
        estimate = await client.estimate(runInput());
        note.textContent = describeEstimate(estimate);
        button.textContent = estimate.can_run ? "Generate and insert" : "Show price";
        if (!estimate.can_run) estimate = null;
        return;
      }
      const approved = estimate;
      const take = await pricedTake(client, runInput(), {
        confirm: (fresh) => {
          if (!fresh.can_run || fresh.usd_total > approved.usd_total + 0.000_001) {
            estimate = fresh.can_run ? fresh : null;
            note.textContent = describeEstimate(fresh);
            button.textContent = fresh.can_run ? "Generate and insert" : "Show price";
            return false;
          }
          return true;
        },
        onUpdate: (current) => {
          note.textContent = `Take ${current.id} is ${current.status}.`;
        },
      });
      const file = await client.download(take.id);
      const blob = new Blob([toArrayBuffer(file.bytes)], { type: file.mime || "image/png" });
      const named = new File([blob], filenameForTake(take), { type: blob.type });
      const asset = await webflow.createAsset(named);
      const alt = prompt.value.trim().slice(0, 140) || "Eden Gen image";
      await asset.setAltText(alt);
      const selected = await webflow.getSelectedElement();
      if (!selected) {
        await webflow.notify({
          type: "Info",
          message: "The image is in Assets. Select an element and use the Assets panel to place it. This button will not generate a second take for that click.",
        });
        note.textContent = `Take ${take.id} is in Assets as ${filenameForTake(take)}. Select an element before the next generate if you want it placed automatically.`;
        estimate = null;
        button.textContent = "Show price";
        return;
      }
      const image = await selected.after(webflow.elementPresets.Image);
      await image.setAsset(asset);
      await image.setAltText(alt);
      await webflow.notify({ type: "Success", message: `Placed take ${take.id}` });
      note.textContent = `Placed take ${take.id}.${take.simulated ? " Marked as a test result." : ""}`;
      estimate = null;
      button.textContent = "Show price";
    } catch (reason) {
      if (reason instanceof CancelledError) return;
      const message = reason instanceof Error ? reason.message : "Generate failed.";
      error.textContent = message;
      await webflow.notify({ type: "Error", message });
      estimate = null;
      button.textContent = "Show price";
    } finally {
      button.disabled = false;
    }
  });

  fillModels([]);
  void loadModels();
}

main();
