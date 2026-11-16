import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { getAccessToken } from "./auth";
import { EdenGenClient, MediaKind, ModelRecord, formatUsd } from "./lib/edengen-rest";

export default function Command() {
  const [kind, setKind] = useState<MediaKind | "all">("image");
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((token) => new EdenGenClient(token).listModels())
      .then((all) => {
        if (!cancelled) setModels(all);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load models.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = models.filter((model) => kind === "all" || model.kind === kind);

  return (
    <List
      isLoading={loading}
      searchBarPlaceholder="Search models"
      searchBarAccessory={
        <List.Dropdown tooltip="Media" value={kind} onChange={(value) => setKind(value as MediaKind | "all")}>
          <List.Dropdown.Item title="Images" value="image" />
          <List.Dropdown.Item title="Video" value="video" />
          <List.Dropdown.Item title="Audio" value="audio" />
          <List.Dropdown.Item title="All" value="all" />
        </List.Dropdown>
      }
    >
      {error ? (
        <List.EmptyView title="Could not load models" description={error} icon={Icon.ExclamationMark} />
      ) : (
        shown.map((model) => (
          <List.Item
            key={model.id}
            title={model.name}
            subtitle={model.id}
            accessories={[
              { text: model.kind },
              { text: model.pricing?.usd !== undefined ? formatUsd(model.pricing.usd) : "" },
            ]}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy Model ID" content={model.id} />
                <Action.OpenInBrowser title="Open Model Catalog" url="https://edengen.ai/models" />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
