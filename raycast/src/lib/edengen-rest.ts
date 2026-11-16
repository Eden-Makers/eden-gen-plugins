// Eden Gen REST client for native plugins. No dependencies.
// OAuth access tokens must be requested for resource https://edengen.ai/v1.
// An MCP token (resource https://edengen.ai/mcp) is refused on /v1.
// API tokens from https://edengen.ai/app/developers (prefix tk_) work as Bearer tokens.

export const ORIGIN = "https://edengen.ai";
export const API_BASE = `${ORIGIN}/v1`;
export const REST_RESOURCE = `${ORIGIN}/v1`;
export const OAUTH_SCOPE = "takes";
export const AUTHORIZE_URL = `${ORIGIN}/oauth/authorize`;
export const TOKEN_URL = `${ORIGIN}/oauth/token`;
export const REGISTER_URL = `${ORIGIN}/oauth/register`;
export const REVOKE_URL = `${ORIGIN}/oauth/revoke`;

export const DEFAULT_MODELS = {
  image: "nano-banana-2.1",
  video: "seedance-2.5",
  audio: "gemini-3-8-flash-tts",
} as const;

export const UPSCALE_MODEL = "nano-banana-pro";
export const UPSCALE_PROMPT =
  "Upscale this image. Keep the subject, framing and colours. Add detail without changing the design.";

export type MediaKind = "image" | "video" | "audio";
export type TakeStatus = "queued" | "processing" | "unknown" | "succeeded" | "failed";

export interface ModelRecord {
  id: string;
  name: string;
  maker?: string;
  kind: string;
  description?: string;
  use_for?: string;
  resolutions?: string[];
  default_resolution?: string;
  durations?: number[] | null;
  default_duration?: number | null;
  aspect_ratios?: string[];
  capabilities?: string[];
  references?: { images?: number; videos?: number; audio?: number; first_frame?: boolean; last_frame?: boolean };
  pricing?: { unit?: string; usd?: number };
}

export interface Estimate {
  model: string;
  resolution?: string;
  duration?: number | null;
  aspect_ratio?: string;
  count: number;
  usd_each: number;
  usd_total: number;
  needs_confirmation: boolean;
  confirm_above_usd?: number;
  balance_usd?: number;
  can_run: boolean;
  blockers?: string[];
  aspect_ratio_defaulted?: boolean;
}

export interface TakeOutput {
  url: string;
  mime_type: string;
  filename: string;
}

export interface Take {
  id: string;
  status: TakeStatus;
  model: string;
  prompt?: string;
  cost_usd?: number;
  refunded?: boolean;
  error?: string | null;
  output?: TakeOutput | null;
  simulated?: boolean;
  created_at?: string;
  aspect_ratio?: string;
  resolution?: string;
}

export interface Account {
  workspace: string;
  member?: string;
  balance_usd: number;
  confirm_above_usd: number;
  billing?: string;
}

export interface Asset {
  id: string;
  filename?: string;
  mime_type?: string;
  url?: string;
  kind?: string;
}

export interface RunInput {
  model: string;
  prompt: string;
  resolution?: string;
  duration?: number;
  aspect_ratio?: string;
  project_id?: string;
  references?: Array<{ asset_id?: string; url?: string; role?: "reference" | "first_frame" | "last_frame" }>;
  max_cost_usd?: number;
}

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export class EdenGenError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "error") {
    super(message);
    this.name = "EdenGenError";
    this.status = status;
    this.code = code;
  }
}

type FetchLike = typeof fetch;

function stripUndefined<T extends Record<string, unknown>>(body: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out as T;
}

export function runBody(input: RunInput, confirmCost: boolean): Record<string, unknown> {
  return stripUndefined({
    model: input.model,
    prompt: input.prompt,
    resolution: input.resolution,
    duration: input.duration,
    aspect_ratio: input.aspect_ratio ?? "16:9",
    count: 1,
    project_id: input.project_id,
    references: input.references,
    max_cost_usd: input.max_cost_usd,
    confirm_cost: confirmCost ? true : undefined,
  });
}

export function takePageUrl(id: string): string {
  return `${ORIGIN}/app/takes/${encodeURIComponent(id)}`;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function randomVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

export function authorizeUrl(args: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", args.clientId);
  url.searchParams.set("redirect_uri", args.redirectUri);
  url.searchParams.set("scope", args.scope ?? OAUTH_SCOPE);
  url.searchParams.set("state", args.state);
  url.searchParams.set("code_challenge", args.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("resource", REST_RESOURCE);
  return url.toString();
}

async function readError(response: Response): Promise<EdenGenError> {
  const body = (await response.json().catch(() => ({}))) as {
    error?: { message?: string; code?: string } | string;
    error_description?: string;
  };
  const nested = body.error;
  const message =
    (typeof nested === "object" && nested?.message) ||
    body.error_description ||
    (typeof nested === "string" ? nested : "") ||
    `HTTP ${response.status}`;
  const code = (typeof nested === "object" && nested?.code) || (typeof nested === "string" ? nested : "error");
  return new EdenGenError(message, response.status, code);
}

export class EdenGenClient {
  private readonly token: string;
  private readonly fetchImpl: FetchLike;

  constructor(token: string, fetchImpl: FetchLike = fetch) {
    this.token = token;
    this.fetchImpl = fetchImpl;
  }

  async request<T>(
    path: string,
    init: {
      method?: "GET" | "POST" | "DELETE";
      body?: unknown;
      headers?: Record<string, string>;
      query?: Record<string, string | number | undefined>;
    } = {},
  ): Promise<T> {
    const url = new URL(API_BASE + path);
    for (const [key, value] of Object.entries(init.query ?? {})) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    const response = await this.fetchImpl(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (!response.ok) throw await readError(response);
    return (await response.json()) as T;
  }

  async listModels(): Promise<ModelRecord[]> {
    const page = await this.request<{ data: ModelRecord[] }>("/models");
    return page.data;
  }

  modelsFor(kind: MediaKind, models: ModelRecord[]): ModelRecord[] {
    return models.filter((model) => model.kind === kind);
  }

  estimate(input: RunInput): Promise<Estimate> {
    return this.request<Estimate>("/estimate", { method: "POST", body: runBody(input, false) });
  }

  async createTake(input: RunInput, idempotencyKey: string, confirmCost: boolean): Promise<Take> {
    const created = await this.request<Take | { data: Take[] }>("/takes", {
      method: "POST",
      body: runBody(input, confirmCost),
      headers: { "Idempotency-Key": idempotencyKey },
    });
    if ("data" in created) {
      const first = created.data[0];
      if (!first) throw new EdenGenError("Create returned no take.", 500, "empty");
      return first;
    }
    return created;
  }

  getTake(id: string): Promise<Take> {
    return this.request<Take>(`/takes/${encodeURIComponent(id)}`);
  }

  listTakes(limit = 20): Promise<{ data: Take[]; has_more?: boolean; next?: string | null }> {
    return this.request("/takes", { query: { limit } });
  }

  account(): Promise<Account> {
    return this.request<Account>("/account");
  }

  async uploadBytes(data: Uint8Array, filename: string): Promise<Asset> {
    const response = await this.fetchImpl(`${API_BASE}/assets`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/octet-stream",
        "X-Filename": encodeURIComponent(filename),
        Accept: "application/json",
      },
      body: data as BodyInit,
    });
    if (!response.ok) throw await readError(response);
    return (await response.json()) as Asset;
  }

  uploadUrl(url: string): Promise<Asset> {
    return this.request<Asset>("/assets", { method: "POST", body: { url } });
  }

  async waitForTake(id: string, opts: { timeoutMs?: number; intervalMs?: number } = {}): Promise<Take> {
    const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60_000);
    const interval = opts.intervalMs ?? 2000;
    for (;;) {
      const take = await this.getTake(id);
      if (take.status === "succeeded" || take.status === "failed") return take;
      if (Date.now() > deadline) return take;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

export async function registerPublicClient(
  redirectUri: string,
  clientName: string,
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const response = await fetchImpl(REGISTER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_name: clientName,
      redirect_uris: [redirectUri],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
      scope: OAUTH_SCOPE,
    }),
  });
  if (!response.ok) throw await readError(response);
  const body = (await response.json()) as { client_id: string };
  if (!body.client_id) throw new EdenGenError("Registration returned no client_id.", response.status, "invalid_client");
  return body.client_id;
}

export async function exchangeAuthorizationCode(
  args: { clientId: string; code: string; redirectUri: string; codeVerifier: string },
  fetchImpl: FetchLike = fetch,
): Promise<TokenSet> {
  return tokenRequest(
    {
      grant_type: "authorization_code",
      client_id: args.clientId,
      code: args.code,
      redirect_uri: args.redirectUri,
      code_verifier: args.codeVerifier,
      resource: REST_RESOURCE,
    },
    fetchImpl,
  );
}

export async function refreshAccessToken(
  args: { clientId: string; refreshToken: string },
  fetchImpl: FetchLike = fetch,
): Promise<TokenSet> {
  return tokenRequest(
    {
      grant_type: "refresh_token",
      client_id: args.clientId,
      refresh_token: args.refreshToken,
      resource: REST_RESOURCE,
    },
    fetchImpl,
  );
}

async function tokenRequest(fields: Record<string, string>, fetchImpl: FetchLike): Promise<TokenSet> {
  const body = new URLSearchParams(fields);
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!response.ok) throw await readError(response);
  const json = (await response.json()) as TokenSet;
  if (!json.access_token)
    throw new EdenGenError("Token response had no access_token.", response.status, "invalid_token");
  return json;
}

export function formatUsd(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "unknown";
  return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
}

export function assertPrompt(prompt: string): string {
  const trimmed = prompt.trim();
  if (trimmed.length < 5 || trimmed.length > 4000) {
    throw new EdenGenError("Prompt must be between 5 and 4000 characters.", 400, "invalid_prompt");
  }
  return trimmed;
}
