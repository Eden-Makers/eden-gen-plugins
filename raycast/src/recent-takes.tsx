import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { getAccessToken } from "./auth";
import { EdenGenClient, Take, formatUsd, takePageUrl } from "./lib/edengen-rest";

export default function Command() {
  const [takes, setTakes] = useState<Take[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((token) => new EdenGenClient(token).listTakes(20))
      .then((page) => {
        if (!cancelled) setTakes(page.data);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load takes.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <List isLoading={loading} searchBarPlaceholder="Search recent takes">
      {error ? (
        <List.EmptyView title="Could not load takes" description={error} icon={Icon.ExclamationMark} />
      ) : (
        takes.map((take) => (
          <List.Item
            key={take.id}
            title={take.prompt || take.id}
            subtitle={take.model}
            accessories={[{ text: take.status }, { text: formatUsd(take.cost_usd) }]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser title="Open Take" url={take.output?.url || takePageUrl(take.id)} />
                <Action.CopyToClipboard title="Copy Take ID" content={take.id} />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
