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

async function main() {
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
  note.className = "note";
  const error = el("p");
  error.className = "error";
  const button = el("button", "Show price");
  let estimate: Estimate | null = null;
  let models: ModelRecord[] = [];

  root.append(
    el("p", "Eden Gen by Edenmakers. The price is shown before any credit is spent."),
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

  function selectedModel(): string {
    return model.value || DEFAULT_MODELS.image;
  }

  async function loadModels() {
    if (!looksLikeToken(token.value)) return;
    try {
      const client = new EdenGenClient(token.value);
      models = client.modelsFor("image", await client.listModels());
      model.replaceChildren();
      for (const item of models.length ? models : [{ id: DEFAULT_MODELS.image, name: DEFAULT_MODELS.image }]) {
        const option = el("option", item.name);
        option.value = item.id;
        model.append(option);
      }
    } catch (reason) {
      error.textContent = reason instanceof Error ? reason.message : "Could not load models.";
    }
  }

  function runInput() {
    return { model: selectedModel(), prompt: prompt.value.trim(), aspect_ratio: aspect.value };
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
            estimate = fresh;
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
      const blob = new Blob([toArrayBuffer(file.bytes)], { type: file.mime || take.output?.mime_type || "image/png" });
      const sdk = (await import("https://express.adobe.com/static/add-on-sdk/sdk.js")).default;
      await sdk.ready;
      await sdk.app.document.addImage(blob, { title: filenameForTake(take), author: "Eden Gen" });
      note.textContent = `Inserted take ${take.id}.${take.simulated ? " Marked as a test result." : ""}`;
      estimate = null;
      button.textContent = "Show price";
    } catch (reason) {
      if (reason instanceof CancelledError) return;
      error.textContent = reason instanceof Error ? reason.message : "Generate failed.";
      estimate = null;
      button.textContent = "Show price";
    } finally {
      button.disabled = false;
    }
  });

  await loadModels();
}

void main();
