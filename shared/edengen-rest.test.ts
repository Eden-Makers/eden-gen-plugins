import assert from "node:assert/strict";
import { test } from "node:test";
import {
  API_BASE,
  EdenGenClient,
  REST_RESOURCE,
  UPSCALE_MODEL,
  authorizeUrl,
  exchangeAuthorizationCode,
  pkceChallenge,
  registerPublicClient,
  runBody,
  takePageUrl,
} from "./edengen-rest.ts";

test("PKCE S256 matches the RFC 7636 appendix vector", async () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  assert.equal(await pkceChallenge(verifier), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
});

test("authorize URL asks for the REST resource, S256 and the takes scope", () => {
  const url = new URL(
    authorizeUrl({
      clientId: "mcp_test",
      redirectUri: "https://raycast.com/redirect?packageName=Extension",
      state: "state-1",
      codeChallenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    }),
  );
  assert.equal(url.origin + url.pathname, "https://edengen.ai/oauth/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("scope"), "takes");
  assert.equal(url.searchParams.get("resource"), REST_RESOURCE);
  assert.equal(url.searchParams.get("redirect_uri"), "https://raycast.com/redirect?packageName=Extension");
});

test("run body always sets 16:9 when the caller omits the format and caps count at 1", () => {
  const body = runBody({ model: "nano-banana-2.1", prompt: "A red lighthouse at dusk" }, false);
  assert.equal(body.aspect_ratio, "16:9");
  assert.equal(body.count, 1);
  assert.equal("confirm_cost" in body, false);
  const confirmed = runBody(
    { model: "seedance-2.5", prompt: "Slow dolly, no music, no cut", aspect_ratio: "9:16", max_cost_usd: 1.2 },
    true,
  );
  assert.equal(confirmed.aspect_ratio, "9:16");
  assert.equal(confirmed.confirm_cost, true);
  assert.equal(confirmed.max_cost_usd, 1.2);
});

test("create sends one Idempotency-Key and does not retry", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    return new Response(JSON.stringify({ id: "take_1", status: "queued", model: "nano-banana-2.1" }), { status: 200 });
  };
  const client = new EdenGenClient("tk_example", fetchImpl);
  const take = await client.createTake(
    { model: "nano-banana-2.1", prompt: "A red lighthouse at dusk", aspect_ratio: "16:9" },
    "idem-1",
    true,
  );
  assert.equal(take.id, "take_1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${API_BASE}/takes`);
  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get("Idempotency-Key"), "idem-1");
  assert.equal(headers.get("Authorization"), "Bearer tk_example");
  const body = JSON.parse(String(calls[0].init?.body));
  assert.equal(body.confirm_cost, true);
  assert.equal(body.count, 1);
});

test("registration is a public client and the code exchange sends the REST resource", async () => {
  const calls: string[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push(`${init?.method ?? "GET"} ${String(input)} ${String(init?.body)}`);
    if (String(input).endsWith("/oauth/register")) {
      return new Response(JSON.stringify({ client_id: "mcp_public" }), { status: 201 });
    }
    return new Response(JSON.stringify({ access_token: "tko_rest", refresh_token: "tkr_rest", expires_in: 3600 }), {
      status: 200,
    });
  };
  assert.equal(await registerPublicClient("https://example.chromiumapp.org/", "Eden Gen for Chrome", fetchImpl), "mcp_public");
  assert.match(calls[0], /token_endpoint_auth_method":"none"/);
  const tokens = await exchangeAuthorizationCode(
    { clientId: "mcp_public", code: "code", redirectUri: "https://example.chromiumapp.org/", codeVerifier: "verifier" },
    fetchImpl,
  );
  assert.equal(tokens.access_token, "tko_rest");
  assert.match(calls[1], /resource=https%3A%2F%2Fedengen\.ai%2Fv1/);
  assert.match(calls[1], /code_verifier=verifier/);
});

test("take page and upscale model stay on the documented ids", () => {
  assert.equal(takePageUrl("k3m9q2xa"), "https://edengen.ai/app/takes/k3m9q2xa");
  assert.equal(UPSCALE_MODEL, "nano-banana-pro");
});
