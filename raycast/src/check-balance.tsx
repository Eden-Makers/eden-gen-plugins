import { Action, ActionPanel, Detail } from "@raycast/api";
import { useEffect, useState } from "react";
import { getAccessToken } from "./auth";
import { Account, EdenGenClient, formatUsd } from "./lib/edengen-rest";

export default function Command() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAccessToken()
      .then((token) => new EdenGenClient(token).account())
      .then((value) => {
        if (!cancelled) setAccount(value);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Could not load the account.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const markdown = error
    ? `# Could not load the balance\n\n${error}`
    : account
      ? `# ${formatUsd(account.balance_usd)}\n\nWorkspace **${account.workspace}**.\n\nRuns above ${formatUsd(account.confirm_above_usd)} ask for confirmation before they start.`
      : "Loading the workspace balance.";

  return (
    <Detail
      isLoading={!account && !error}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.OpenInBrowser title="Open Billing" url="https://edengen.ai/app/billing" />
        </ActionPanel>
      }
    />
  );
}
