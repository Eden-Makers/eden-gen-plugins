import assert from "node:assert/strict";
import test from "node:test";
import { signInWithLoopback } from "./oauth-loopback.ts";

test("loopback sign-in registers, opens the authorize URL, and exchanges the code", async () => {
  let opened = "";
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/oauth/register")) {
      return new Response(JSON.stringify({ client_id: "client-1" }), { status: 201, headers: { "Content-Type": "application/json" } });
    }
    if (url.endsWith("/oauth/token")) {
      const body = String(init?.body);
      assert.match(body, /grant_type=authorization_code/);
      assert.match(body, /code=abc/);
      assert.match(body, /resource=https%3A%2F%2Fedengen\.ai%2Fv1/);
      return new Response(JSON.stringify({ access_token: "access-1", refresh_token: "refresh-1", expires_in: 3600 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("no", { status: 404 });
  };

  const pending = signInWithLoopback({
    clientName: "Eden Gen test",
    fetchImpl,
    timeoutMs: 5_000,
    open: async (url) => {
      opened = url;
      const redirect = new URL(url).searchParams.get("redirect_uri");
      assert.ok(redirect);
      const state = new URL(url).searchParams.get("state");
      await fetch(`${redirect}?code=abc&state=${state}`);
    },
  });
  const result = await pending;
  assert.match(opened, /https:\/\/edengen\.ai\/oauth\/authorize/);
  assert.match(opened, /code_challenge_method=S256/);
  assert.equal(result.tokens.access_token, "access-1");
  assert.match(result.redirectUri, /^http:\/\/127\.0\.0\.1:\d+\/callback$/);
});
