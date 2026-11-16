// Eden Gen REST client for wave 2 plugins. No runtime dependencies.
// Personal tokens (tkp_) and developer keys (tk_) are Bearer tokens.
// OAuth access tokens for this client must use resource https://edengen.ai/v1.
// An MCP token (resource https://edengen.ai/mcp) is refused on /v1.

export const ORIGIN = "https://edengen.ai";
export const API_BASE = `${ORIGIN}/v1`;
export const REST_RESOURCE = `${ORIGIN}/v1`;
export const MCP_URL = `${ORIGIN}/mcp`;
export const OAUTH_SCOPE = "takes";
export const OPENAPI_URL = `${ORIGIN}/openapi.json`;
export const TOKEN_SETTINGS_URL = `${ORIGIN}/app/settings?tab=api`;
export const HELP_URL = `${ORIGIN}/docs/help`;
export const PRIVACY_URL = `${ORIGIN}/privacy`;
export const TERMS_URL = `${ORIGIN}/terms`;
export const SUPPORT_EMAIL = "support@edengen.ai";
export const AUTHORIZE_URL = `${ORIGIN}/oauth/authorize`;
export const TOKEN_URL = `${ORIGIN}/oauth/token`;
export const REGISTER_URL = `${ORIGIN}/oauth/register`;

export const DEFAULT_MODELS = {
  image: "nano-banana-2.1",
  video: "seedance-2.5",
  audio: "gemini-3-8-flash-tts",
} as const;

/** Scopes a personal token can hold. Routes outside this list reject tkp_. */
export const PERSONAL_TOKEN_SCOPES = [
  "models:read",
  "takes:read",
  "takes:write",
  "estimate",
  "uploads:write",
  "account:read",
] as const;

/**
 * Browser origins that call /v1 from an iframe. Draft takes PR 67 allows only
 * chrome-extension ids and figma.com. These still need to be added. See
 * TAKES-CHANGES-NEEDED-WAVE2.md. Placeholders are exact once a human creates the app.
 */
export const WAVE2_BROWSER_ORIGINS = {
  canva: "https://app-<lowercase-app-id>.canva-apps.com",
  adobeDev: "https://localhost:5241",
  adobeProd: "https://<addon-id>.wxp.adobe-addons.com",
  framerProd: "https://<plugin-id>.plugins.framercdn.com",
  framerReview: "https://<plugin-id>-<version-id>.plugins.framercdn.com",
  webflow: "https://<extension-id>.webflow-ext.com",
} as const;

export type MediaKind = "image" | "video" | "audio";
export type TakeStatus = "queued" | "processing" | "unknown" | "succeeded" | "failed";

export interface ModelRecord {
  id: string;
  name: string;
  maker?: string;
  kind: string;
  description?: string;
  resolutions?: string[];
  default_resolution?: string;
  durations?: number[] | null;
  default_duration?: number | null;
  aspect_ratios?: string[];
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
}

export interface TakeOutput {
  url: string;
  mime_type: string;
  filename: string;
  poster_url?: string;
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
  count?: 1 | 2 | 4;
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

export class CancelledError extends Error {
  constructor(message = "Cancelled before creating a take.") {
    super(message);
    this.name = "CancelledError";
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
    count: input.count ?? 1,
    project_id: input.project_id,
    references: input.references,
    max_cost_usd: input.max_cost_usd,
    confirm_cost: confirmCost ? true : undefined,
  });
}

export function takePageUrl(id: string): string {
  return `${ORIGIN}/app/takes/${encodeURIComponent(id)}`;
}

export function contentPath(id: string): string {
  return `/takes/${encodeURIComponent(id)}/content`;
}

export function maskToken(token: string): string {
  const trimmed = token.trim();
  if (trimmed.length < 12) return "(hidden)";
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

export function looksLikeToken(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("tkp_") || trimmed.startsWith("tk_");
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

export function randomIdempotencyKey(): string {
  return crypto.randomUUID();
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

export function usd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function describeEstimate(estimate: Estimate): string {
  const price = usd(estimate.usd_total);
  if (!estimate.can_run) {
    const why = estimate.blockers?.length ? ` ${estimate.blockers.join(" ")}` : "";
    return `This take cannot run (${price}).${why}`;
  }
  return `This take costs ${price}. Confirm to spend workspace credit. A take that has been created is not cancelled by closing this panel.`;
}

export class EdenGenClient {
  private readonly token: string;
  private readonly fetchImpl: FetchLike;

  constructor(token: string, fetchImpl: FetchLike = fetch) {
    this.token = token.trim();
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
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  async listModels(): Promise<ModelRecord[]> {
    const page = await this.request<{ data: ModelRecord[] } | ModelRecord[]>("/models");
    return Array.isArray(page) ? page : page.data;
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
    if ("data" in created && Array.isArray(created.data)) {
      const first = created.data[0];
      if (!first) throw new EdenGenError("Create returned no take.", 500, "empty");
      return first;
    }
    return created as Take;
  }

  getTake(id: string): Promise<Take> {
    return this.request<Take>(`/takes/${encodeURIComponent(id)}`);
  }

  account(): Promise<Account> {
    return this.request<Account>("/account");
  }

  async download(id: string): Promise<{ bytes: Uint8Array; mime: string; filename: string }> {
    const url = new URL(API_BASE + contentPath(id));
    const response = await this.fetchImpl(url, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: "*/*" },
    });
    if (!response.ok) throw await readError(response);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "application/octet-stream";
    const disposition = response.headers.get("content-disposition") ?? "";
    const named = /filename="([^"]+)"/.exec(disposition)?.[1];
    return { bytes, mime, filename: named || `${id}` };
  }

  async waitForTake(
    id: string,
    opts: { timeoutMs?: number; intervalMs?: number; onUpdate?: (take: Take) => void } = {},
  ): Promise<Take> {
    const deadline = Date.now() + (opts.timeoutMs ?? 10 * 60_000);
    const interval = opts.intervalMs ?? 2000;
    for (;;) {
      const take = await this.getTake(id);
      opts.onUpdate?.(take);
      if (take.status === "succeeded" || take.status === "failed") return take;
      if (Date.now() > deadline) return take;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}

export interface PricedTakeOptions {
  confirm: (estimate: Estimate) => Promise<boolean> | boolean;
  onUpdate?: (take: Take) => void;
  idempotencyKey?: string;
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Estimate, stop when the person declines or the run is blocked, create once, poll.
 * confirm_cost is sent only when the estimate says the server still wants approval.
 * The UI confirm callback is always required: the price is shown before any create.
 */
export async function pricedTake(client: EdenGenClient, input: RunInput, options: PricedTakeOptions): Promise<Take> {
  const estimate = await client.estimate(input);
  if (!estimate.can_run) {
    throw new EdenGenError(describeEstimate(estimate), 409, "cannot_run");
  }
  const accepted = await options.confirm(estimate);
  if (!accepted) throw new CancelledError();
  const created = await client.createTake(input, options.idempotencyKey ?? randomIdempotencyKey(), estimate.needs_confirmation);
  const finished = await client.waitForTake(created.id, {
    timeoutMs: options.timeoutMs,
    intervalMs: options.intervalMs,
    onUpdate: options.onUpdate,
  });
  if (finished.status === "failed") {
    throw new EdenGenError(finished.error || "The take failed.", 422, "take_failed");
  }
  if (finished.status !== "succeeded" || !finished.output?.url) {
    throw new EdenGenError(
      `Take ${finished.id} is still ${finished.status}. Check ${takePageUrl(finished.id)} before creating another.`,
      504,
      "still_running",
    );
  }
  return finished;
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
  const response = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(fields),
  });
  if (!response.ok) throw await readError(response);
  const json = (await response.json()) as TokenSet;
  if (!json.access_token) throw new EdenGenError("Token response had no access_token.", response.status, "invalid_token");
  return json;
}

export function extensionForMime(mime: string, fallback = "bin"): string {
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };
  return map[mime] ?? fallback;
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

export function filenameForTake(take: Take): string {
  if (take.output?.filename) return take.output.filename;
  const mime = take.output?.mime_type ?? "application/octet-stream";
  return `eden-${take.id}.${extensionForMime(mime)}`;
}
