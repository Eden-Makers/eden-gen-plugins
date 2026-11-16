import { UPSCALE_MODEL, UPSCALE_PROMPT, formatUsd, type MediaKind, type ModelRecord, type RunInput } from "../../shared/edengen-rest";
import type { ApiOk, ApiRequest, ApiResponse } from "./protocol";

export function call(message: ApiRequest): Promise<ApiResponse> {
  return chrome.runtime.sendMessage(message);
}

export function unwrap<T extends ApiOk["type"]>(response: ApiResponse, type: T): Extract<ApiOk, { type: T }> {
  if (!response.ok) throw new Error(response.error);
  if (response.type !== type) throw new Error(`Expected ${type}.`);
  return response as Extract<ApiOk, { type: T }>;
}

export function modelsOf(kind: MediaKind, models: ModelRecord[]): ModelRecord[] {
  return models.filter((model) => model.kind === kind);
}

export function priceText(estimate: { usd_total: number; balance_usd?: number; can_run: boolean; blockers?: string[]; needs_confirmation: boolean }): string {
  const blockers = estimate.blockers?.length ? ` Blocked: ${estimate.blockers.join(" ")}` : "";
  const confirm = estimate.needs_confirmation ? " This price needs confirmation." : "";
  return `${formatUsd(estimate.usd_total)} · balance ${formatUsd(estimate.balance_usd)} · ${estimate.can_run ? "can run" : "cannot run"}.${confirm}${blockers}`;
}

export function imageRun(args: { model: string; prompt: string; aspectRatio: string; resolution?: string; assetId?: string; role?: "reference" | "first_frame" }): RunInput {
  return {
    model: args.model,
    prompt: args.prompt,
    aspect_ratio: args.aspectRatio || "16:9",
    resolution: args.resolution,
    references: args.assetId ? [{ asset_id: args.assetId, role: args.role ?? "reference" }] : undefined,
  };
}

export { UPSCALE_MODEL, UPSCALE_PROMPT, formatUsd };
