import { Action, ActionPanel, Form, Icon, Toast, open, showToast } from "@raycast/api";
import { useEffect, useState } from "react";
import { getAccessToken } from "./auth";
import {
  DEFAULT_MODELS,
  EdenGenClient,
  EdenGenError,
  Estimate,
  MediaKind,
  ModelRecord,
  assertPrompt,
  formatUsd,
  takePageUrl,
} from "./lib/edengen-rest";

export default function GenerateForm({ kind }: { kind: MediaKind }) {
  const [token, setToken] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODELS[kind]);
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("");
  const [duration, setDuration] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((value) => {
        if (!cancelled) setToken(value);
      })
      .catch((error: unknown) => {
        if (!cancelled) setAuthError(error instanceof Error ? error.message : "Could not sign in.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    new EdenGenClient(token)
      .listModels()
      .then((all) => {
        if (cancelled) return;
        const mine = all.filter((model) => model.kind === kind);
        setModels(mine);
        const preferred = mine.find((model) => model.id === DEFAULT_MODELS[kind]) ?? mine[0];
        if (preferred) applyModel(preferred);
      })
      .catch((error: unknown) => {
        if (!cancelled) setAuthError(error instanceof Error ? error.message : "Could not load models.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, kind]);

  const selected = models.find((model) => model.id === modelId);

  function applyModel(model: ModelRecord) {
    setModelId(model.id);
    setAspectRatio(model.aspect_ratios?.includes("16:9") ? "16:9" : (model.aspect_ratios?.[0] ?? "16:9"));
    setResolution(model.default_resolution ?? model.resolutions?.[0] ?? "");
    setDuration(model.default_duration ? String(model.default_duration) : "");
    setEstimate(null);
  }

  function input() {
    return {
      model: modelId,
      prompt: assertPrompt(prompt),
      aspect_ratio: aspectRatio || "16:9",
      resolution: resolution || undefined,
      duration: kind === "video" && duration ? Number(duration) : undefined,
    };
  }

  async function onEstimate() {
    if (!token) return;
    setBusy(true);
    try {
      const priced = await new EdenGenClient(token).estimate(input());
      setEstimate(priced);
      await showToast({
        style: priced.can_run ? Toast.Style.Success : Toast.Style.Failure,
        title: priced.can_run ? `Estimate ${formatUsd(priced.usd_total)}` : "This run is blocked",
        message:
          priced.blockers?.join(" ") || (priced.needs_confirmation ? "Needs your approval before it starts." : ""),
      });
    } catch (error) {
      setEstimate(null);
      await showToast({ style: Toast.Style.Failure, title: "Estimate failed", message: messageOf(error) });
    } finally {
      setBusy(false);
    }
  }

  async function onGenerate() {
    if (!token || !estimate?.can_run) return;
    setBusy(true);
    const toast = await showToast({ style: Toast.Style.Animated, title: "Starting one take" });
    try {
      const api = new EdenGenClient(token);
      const created = await api.createTake(input(), crypto.randomUUID(), estimate.needs_confirmation);
      toast.title = "Rendering";
      toast.message = created.id;
      const finished = await api.waitForTake(created.id);
      if (finished.status === "succeeded" && finished.output?.url) {
        toast.style = Toast.Style.Success;
        toast.title = `Ready ${formatUsd(finished.cost_usd)}`;
        toast.message = finished.id;
        await open(finished.output.url);
      } else if (finished.status === "failed") {
        toast.style = Toast.Style.Failure;
        toast.title = "Take failed and was refunded";
        toast.message = finished.error ?? finished.id;
      } else {
        toast.style = Toast.Style.Success;
        toast.title = "Still rendering";
        toast.message = `${finished.id} is ${finished.status}. Open it in Eden Gen.`;
        await open(takePageUrl(finished.id));
      }
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Could not generate";
      toast.message = messageOf(error);
    } finally {
      setBusy(false);
    }
  }

  if (authError) {
    return (
      <Form
        actions={
          <ActionPanel>
            <Action.OpenInBrowser title="Open Developers" url="https://edengen.ai/app/developers" />
          </ActionPanel>
        }
      >
        <Form.Description title="Sign-in" text={authError} />
      </Form>
    );
  }

  if (!token) {
    return <Form isLoading />;
  }

  return (
    <Form
      isLoading={busy}
      actions={
        <ActionPanel>
          <Action title="Estimate" icon={Icon.Coins} onAction={onEstimate} />
          <Action
            title="Generate"
            icon={Icon.Image}
            onAction={onGenerate}
            shortcut={{ modifiers: ["cmd"], key: "return" }}
          />
          {estimate ? <Action.OpenInBrowser title="Open Eden Gen" url="https://edengen.ai/app" /> : null}
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="prompt"
        title="Prompt"
        placeholder={placeholder(kind)}
        value={prompt}
        onChange={(value) => {
          setPrompt(value);
          setEstimate(null);
        }}
      />
      <Form.Dropdown
        id="model"
        title="Model"
        value={modelId}
        onChange={(value) => {
          const model = models.find((item) => item.id === value);
          if (model) applyModel(model);
        }}
      >
        {models.map((model) => (
          <Form.Dropdown.Item key={model.id} value={model.id} title={model.name} />
        ))}
      </Form.Dropdown>
      <Form.Dropdown
        id="aspect"
        title="Format"
        value={aspectRatio}
        onChange={(value) => {
          setAspectRatio(value);
          setEstimate(null);
        }}
      >
        {(selected?.aspect_ratios?.length ? selected.aspect_ratios : ["16:9", "9:16", "1:1"]).map((ratio) => (
          <Form.Dropdown.Item key={ratio} value={ratio} title={ratio} />
        ))}
      </Form.Dropdown>
      {selected?.resolutions?.length ? (
        <Form.Dropdown
          id="resolution"
          title="Resolution"
          value={resolution}
          onChange={(value) => {
            setResolution(value);
            setEstimate(null);
          }}
        >
          {selected.resolutions.map((item) => (
            <Form.Dropdown.Item key={item} value={item} title={item} />
          ))}
        </Form.Dropdown>
      ) : null}
      {kind === "video" && selected?.durations?.length ? (
        <Form.Dropdown
          id="duration"
          title="Length"
          value={duration}
          onChange={(value) => {
            setDuration(value);
            setEstimate(null);
          }}
        >
          {selected.durations.map((item) => (
            <Form.Dropdown.Item key={item} value={String(item)} title={`${item} seconds`} />
          ))}
        </Form.Dropdown>
      ) : null}
      <Form.Description
        title="Price"
        text={
          estimate
            ? `${formatUsd(estimate.usd_total)} · balance ${formatUsd(estimate.balance_usd)} · ${
                estimate.can_run ? "can run" : `blocked: ${(estimate.blockers ?? []).join(" ")}`
              }${estimate.needs_confirmation ? " · confirm before generating" : ""}`
            : "Estimate before generating. One take is created, and it cannot be cancelled after it is accepted."
        }
      />
    </Form>
  );
}

function placeholder(kind: MediaKind): string {
  if (kind === "video") return "Slow dolly toward a red lighthouse at dusk, no music, no cut";
  if (kind === "audio") return "A calm voice reads: the lighthouse keeps its light through the storm.";
  return "A red lighthouse at dusk, film still, no text";
}

function messageOf(error: unknown): string {
  if (error instanceof EdenGenError || error instanceof Error) return error.message;
  return "Unknown error";
}
