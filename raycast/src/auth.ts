import { LocalStorage, OAuth, getPreferenceValues } from "@raycast/api";
import {
  AUTHORIZE_URL,
  OAUTH_SCOPE,
  RAYCAST_REDIRECT,
  REST_RESOURCE,
  REVOKE_URL,
  exchangeAuthorizationCode,
  refreshAccessToken,
  registerPublicClient,
} from "./lib/edengen-rest";

const CLIENT_KEY = "edengen.oauth.client";

interface StoredClient {
  clientId: string;
  redirectUri: string;
}

interface Preferences {
  authMode: "oauth" | "token";
  apiToken?: string;
}

const client = new OAuth.PKCEClient({
  redirectMethod: OAuth.RedirectMethod.Web,
  providerName: "Eden Gen",
  providerIcon: "icon.png",
  providerId: "edengen",
  description: "Connect your Eden Gen workspace. The consent screen asks for a project and a monthly cap.",
  revocationEndpoint: REVOKE_URL,
});

export function preferences(): Preferences {
  return getPreferenceValues<Preferences>();
}

async function storedClient(redirectUri: string): Promise<string> {
  const raw = await LocalStorage.getItem<string>(CLIENT_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as StoredClient;
    if (parsed.redirectUri === redirectUri && parsed.clientId) return parsed.clientId;
  }
  const clientId = await registerPublicClient(redirectUri, "Eden Gen for Raycast");
  const next: StoredClient = { clientId, redirectUri };
  await LocalStorage.setItem(CLIENT_KEY, JSON.stringify(next));
  return clientId;
}

async function oauthAccessToken(): Promise<string> {
  const existing = await client.getTokens();
  if (existing?.accessToken) {
    if (existing.refreshToken && existing.isExpired()) {
      const raw = await LocalStorage.getItem<string>(CLIENT_KEY);
      if (!raw) {
        await client.removeTokens();
      } else {
        const parsed = JSON.parse(raw) as StoredClient;
        const refreshed = await refreshAccessToken({ clientId: parsed.clientId, refreshToken: existing.refreshToken });
        await client.setTokens(refreshed);
        return refreshed.access_token;
      }
    } else {
      return existing.accessToken;
    }
  }

  const clientId = await storedClient(RAYCAST_REDIRECT);
  let request = await client.authorizationRequest({
    endpoint: AUTHORIZE_URL,
    clientId,
    scope: OAUTH_SCOPE,
    extraParameters: { resource: REST_RESOURCE },
  });
  if (request.redirectURI !== RAYCAST_REDIRECT) {
    const nextId = await storedClient(request.redirectURI);
    request = await client.authorizationRequest({
      endpoint: AUTHORIZE_URL,
      clientId: nextId,
      scope: OAUTH_SCOPE,
      extraParameters: { resource: REST_RESOURCE },
    });
  }
  const url = new URL(request.toURL());
  url.searchParams.set("resource", REST_RESOURCE);
  const { authorizationCode } = await client.authorize({ url: url.toString() });
  const tokens = await exchangeAuthorizationCode({
    clientId: request.clientId,
    code: authorizationCode,
    redirectUri: request.redirectURI,
    codeVerifier: request.codeVerifier,
  });
  await client.setTokens(tokens);
  return tokens.access_token;
}

export async function getAccessToken(): Promise<string> {
  const prefs = preferences();
  if (prefs.authMode === "token") {
    const token = prefs.apiToken?.trim();
    if (!token) throw new Error("Add an API token in extension preferences, or switch Sign-in to Eden Gen account.");
    return token;
  }
  return oauthAccessToken();
}
