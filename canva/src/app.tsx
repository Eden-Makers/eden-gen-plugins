import { addElementAtPoint } from "@canva/design";
import { upload } from "@canva/asset";
import { Alert, Button, FormField, MultilineInput, Rows, Select, Text, TextInput } from "@canva/app-ui-kit";
import { useEffect, useState } from "react";
import {
  DEFAULT_MODELS,
  EdenGenClient,
  TOKEN_SETTINGS_URL,
  describeEstimate,
  looksLikeToken,
  pricedTake,
  type Estimate,
  type MediaKind,
  type ModelRecord,
} from "../../edengen-rest/edengen-rest.ts";

const TOKEN_KEY = "edengen.token";

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function App() {
  const [token, setToken] = useState(readToken);
  const [kind, setKind] = useState<MediaKind>("image");
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [model, setModel] = useState<string>(DEFAULT_MODELS.image);
  const [prompt, setPrompt] = useState("");
  const [aspect, setAspect] = useState("1:1");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      if (token.trim()) localStorage.setItem(TOKEN_KEY, token.trim());
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Private mode can block storage. The field still works for this session.
    }
  }, [token]);

  useEffect(() => {
    if (!looksLikeToken(token)) {
      setModels([]);
      return;
    }
    const client = new EdenGenClient(token);
    let cancelled = false;
    client
      .listModels()
      .then((all) => {
        if (cancelled) return;
        const next = client.modelsFor(kind, all);
        setModels(next);
        if (!next.some((item) => item.id === model)) setModel(next[0]?.id ?? DEFAULT_MODELS[kind]);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load models.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, kind]);

  function input() {
    return {
      model: model || DEFAULT_MODELS[kind],
      prompt: prompt.trim(),
      aspect_ratio: aspect,
      duration: kind === "video" ? 5 : undefined,
    };
  }

  async function onEstimate() {
    setError("");
    setEstimate(null);
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
      const next = await new EdenGenClient(token).estimate(input());
      setEstimate(next);
      setStatus(describeEstimate(next));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Estimate failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    if (!estimate) return;
    setBusy(true);
    setError("");
    try {
      const client = new EdenGenClient(token);
      const take = await pricedTake(client, input(), {
        confirm: () => true,
        intervalMs: 2000,
        onUpdate: (current) => setStatus(`Take ${current.id} is ${current.status}.`),
      });
      const output = take.output;
      if (!output) throw new Error("The take finished without a file.");
      if (kind === "image") {
        const asset = await upload({
          type: "image",
          mimeType: imageMime(output.mime_type),
          url: output.url,
          thumbnailUrl: output.url,
          aiDisclosure: "app_generated",
        });
        await addElementAtPoint({
          type: "image",
          ref: asset.ref,
          altText: { text: prompt.trim().slice(0, 120) || "Eden Gen image", decorative: false },
        });
      } else {
        const asset = await upload({
          type: "video",
          mimeType: "video/mp4",
          url: output.url,
          thumbnailImageUrl: output.poster_url || posterDataUrl(aspect),
          aiDisclosure: "app_generated",
        });
        await addElementAtPoint({
          type: "video",
          ref: asset.ref,
          altText: { text: prompt.trim().slice(0, 120) || "Eden Gen video", decorative: false },
        });
      }
      const test = take.simulated ? " Marked as a test result." : "";
      setStatus(`Placed take ${take.id}.${test}`);
      setEstimate(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Generate failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Rows spacing="1u">
      <Text>Eden Gen by Edenmakers. The price is shown before any credit is spent. Create a token at {TOKEN_SETTINGS_URL}</Text>
      <FormField
        label="API token"
        control={(props) => (
          <TextInput
            {...props}
            value={token}
            placeholder="tkp_..."
            onChange={(value) => setToken(value)}
          />
        )}
      />
      <FormField
        label="Kind"
        control={(props) => (
          <Select
            {...props}
            options={[
              { value: "image", label: "Image" },
              { value: "video", label: "Video" },
            ]}
            value={kind}
            onChange={(value) => {
              setKind(value as MediaKind);
              setEstimate(null);
            }}
          />
        )}
      />
      <FormField
        label="Model"
        control={(props) => (
          <Select
            {...props}
            options={(models.length ? models : [{ id: model, name: model }]).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
            value={model}
            onChange={(value) => {
              setModel(value);
              setEstimate(null);
            }}
          />
        )}
      />
      <FormField
        label="Aspect"
        control={(props) => (
          <Select
            {...props}
            options={["1:1", "16:9", "9:16", "4:3"].map((value) => ({ value, label: value }))}
            value={aspect}
            onChange={(value) => {
              setAspect(value);
              setEstimate(null);
            }}
          />
        )}
      />
      <FormField
        label="Prompt"
        control={(props) => (
          <MultilineInput {...props} value={prompt} onChange={(value) => setPrompt(value)} minRows={3} />
        )}
      />
      {error ? <Alert tone="critical">{error}</Alert> : null}
      {status ? <Text size="small">{status}</Text> : null}
      <Button variant="primary" stretch disabled={busy} onClick={estimate?.can_run ? onGenerate : onEstimate}>
        {busy ? "Working..." : estimate?.can_run ? "Generate and place" : "Show price"}
      </Button>
    </Rows>
  );
}

function imageMime(mime: string): "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml" | "image/heic" | "image/tiff" {
  if (mime === "image/jpeg" || mime === "image/webp" || mime === "image/svg+xml" || mime === "image/heic" || mime === "image/tiff") return mime;
  return "image/png";
}

function posterDataUrl(aspect: string): string {
  const [width, height] = aspect.split(":").map((part) => Number(part) || 1);
  const canvas = document.createElement("canvas");
  canvas.width = width * 16;
  canvas.height = height * 16;
  const context = canvas.getContext("2d");
  if (!context) return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  context.fillStyle = "#111114";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f7c04a";
  context.fillRect(0, canvas.height - 6, canvas.width, 6);
  return canvas.toDataURL("image/png");
}
