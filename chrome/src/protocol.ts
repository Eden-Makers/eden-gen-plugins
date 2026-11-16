import type { Account, Estimate, ModelRecord, RunInput, Take, Asset } from "../../shared/edengen-rest";

export type Settings = {
  authMode: "oauth" | "token";
  apiToken: string;
};

export type PendingImage = {
  intent: "reference" | "edit" | "upscale";
  srcUrl: string;
};

export type ApiRequest =
  | { type: "settings-get" }
  | { type: "settings-set"; settings: Settings }
  | { type: "sign-in" }
  | { type: "sign-out" }
  | { type: "models" }
  | { type: "account" }
  | { type: "takes" }
  | { type: "estimate"; input: RunInput }
  | { type: "create"; input: RunInput; confirm: boolean }
  | { type: "upload-url"; url: string }
  | { type: "get-take"; id: string };

export type ApiOk =
  | { ok: true; type: "settings"; settings: Settings; signedIn: boolean }
  | { ok: true; type: "models"; models: ModelRecord[] }
  | { ok: true; type: "account"; account: Account }
  | { ok: true; type: "takes"; takes: Take[] }
  | { ok: true; type: "estimate"; estimate: Estimate }
  | { ok: true; type: "take"; take: Take }
  | { ok: true; type: "asset"; asset: Asset }
  | { ok: true; type: "done" };

export type ApiResponse = ApiOk | { ok: false; error: string };

export const DEFAULT_SETTINGS: Settings = { authMode: "token", apiToken: "" };
