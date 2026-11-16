// Local OAuth callback. Loopback redirects are already trusted by the takes draft
// (localhost, 127.0.0.1, ::1). A public bot host still needs its exact redirect
// added as a known client. See TAKES-CHANGES-NEEDED-WAVE2.md.

import http from "node:http";
import {
  authorizeUrl,
  exchangeAuthorizationCode,
  pkceChallenge,
  randomVerifier,
  registerPublicClient,
  type TokenSet,
} from "./edengen-rest.ts";

export interface LoopbackResult {
  tokens: TokenSet;
  redirectUri: string;
  clientId: string;
}

export async function signInWithLoopback(args: {
  clientName: string;
  open: (url: string) => Promise<void> | void;
  timeoutMs?: number;
  clientId?: string;
  fetchImpl?: typeof fetch;
}): Promise<LoopbackResult> {
  const verifier = randomVerifier();
  const challenge = await pkceChallenge(verifier);
  const state = randomVerifier();
  const server = http.createServer();
  const redirectUri = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("OAuth callback failed to bind."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}/callback`);
    });
  });

  const codePromise = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Sign-in timed out before Eden Gen redirected back."));
    }, args.timeoutMs ?? 180_000);
    server.on("request", (req, res) => {
      const url = new URL(req.url ?? "/", redirectUri);
      if (url.pathname !== "/callback") {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }
      const gotState = url.searchParams.get("state") ?? "";
      const code = url.searchParams.get("code") ?? "";
      const error = url.searchParams.get("error_description") || url.searchParams.get("error");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!doctype html><title>Eden Gen</title><p>You can close this window and return to Eden Gen.</p>");
      clearTimeout(timer);
      if (error) {
        reject(new Error(error));
        return;
      }
      if (gotState !== state || !code) {
        reject(new Error("Sign-in state did not match. Start again."));
        return;
      }
      resolve(code);
    });
  });

  try {
    const clientId = args.clientId ?? (await registerPublicClient(redirectUri, args.clientName, args.fetchImpl));
    const url = authorizeUrl({ clientId, redirectUri, state, codeChallenge: challenge });
    await args.open(url);
    const code = await codePromise;
    const tokens = await exchangeAuthorizationCode(
      { clientId, code, redirectUri, codeVerifier: verifier },
      args.fetchImpl,
    );
    return { tokens, redirectUri, clientId };
  } finally {
    server.close();
  }
}
