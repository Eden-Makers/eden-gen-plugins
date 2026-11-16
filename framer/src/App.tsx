import { framer } from "@framer/plugin";
import { useEffect, useState } from "react";
import {
  CancelledError,
  DEFAULT_MODELS,
  EdenGenClient,
  TOKEN_SETTINGS_URL,
  describeEstimate,
  filenameForTake,
  looksLikeToken,
  pricedTake,
  type Estimate,
  type ModelRecord,
} from "../../edengen-rest/edengen-rest.ts";

const TOKEN_KEY = "edengen.token";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) ?? "");
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODELS.image);
  const [aspect, setAspect] = useState("16:9");
  const [prompt, setPrompt] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  useEffect(() => {
    if (!looksLikeToken(token)) return;
    const client = new EdenGenClient(token);
    let cancelled = false;
    client
      .listModels()
      .then((all) => {
        if (cancelled) return;
        const images = client.modelsFor("image", all);
        setModels(images);
        if (!images.some((item) => item.id === model)) setModel(images[0]?.id ?? DEFAULT_MODELS.image);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load models.");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function runInput() {
    return { model: model || DEFAULT_MODELS.image, prompt: prompt.trim(), aspect_ratio: aspect };
  }

  async function onClick() {
    setError("");
    if (!looksLikeToken(token)) {
      setError("Paste a personal token from Settings, API and agents. It starts with tkp_.");
      return;
    }
    if (!prompt.trim()) {
      setError("Write a prompt first.");
      return;
    }
    setBusy(true);
    try {
      const client = new EdenGenClient(token);
      if (!estimate) {
        const next = await client.estimate(runInput());
        setEstimate(next.can_run ? next : null);
        setNote(describeEstimate(next));
        return;
      }
      const approved = estimate;
      const take = await pricedTake(client, runInput(), {
        confirm: (fresh) => {
          if (!fresh.can_run || fresh.usd_total > approved.usd_total + 0.000_001) {
            setEstimate(fresh.can_run ? fresh : null);
            setNote(describeEstimate(fresh));
            return false;
          }
          return true;
        },
        onUpdate: (current) => setNote(`Take ${current.id} is ${current.status}.`),
      });
      const output = take.output;
      if (!output) throw new Error("The take finished without a file.");
      await framer.addImage({
        image: output.url,
        name: filenameForTake(take),
        altText: prompt.trim().slice(0, 140) || "Eden Gen image",
      });
      await framer.notify(`Placed take ${take.id}`, { variant: "success" });
      setNote(`Placed take ${take.id}.${take.simulated ? " Marked as a test result." : ""}`);
      setEstimate(null);
    } catch (reason) {
      if (reason instanceof CancelledError) return;
      const message = reason instanceof Error ? reason.message : "Generate failed.";
      setError(message);
      await framer.notify(message, { variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  const choices = models.length ? models : [{ id: model, name: model }];
  return (
    <main>
      <p>
        Eden Gen by Edenmakers. The price is shown before any credit is spent.{" "}
        <a href={TOKEN_SETTINGS_URL} target="_blank" rel="noreferrer">
          Create a token
        </a>
      </p>
      <label>
        API token
        <input type="password" value={token} placeholder="tkp_..." onChange={(event) => setToken(event.target.value)} />
      </label>
      <label>
        Model
        <select value={model} onChange={(event) => { setModel(event.target.value); setEstimate(null); }}>
          {choices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Aspect
        <select value={aspect} onChange={(event) => { setAspect(event.target.value); setEstimate(null); }}>
          {["1:1", "16:9", "9:16", "4:3"].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        Prompt
        <textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setEstimate(null); }} />
      </label>
      {note ? <p>{note}</p> : null}
      {error ? <p>{error}</p> : null}
      <button type="button" disabled={busy} onClick={() => void onClick()}>
        {busy ? "Working..." : estimate ? "Generate and place" : "Show price"}
      </button>
    </main>
  );
}
