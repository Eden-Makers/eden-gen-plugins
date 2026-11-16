import {
  EdenGenClient,
  REST_RESOURCE,
  assertPrompt,
  authorizeUrl,
  exchangeAuthorizationCode,
  pkceChallenge,
  randomVerifier,
  refreshAccessToken,
  registerPublicClient,
} from "../../shared/edengen-rest";
import { DEFAULT_SETTINGS, type ApiRequest, type ApiResponse, type PendingImage, type Settings } from "./protocol";

const SETTINGS_KEY = "settings";
const OAUTH_KEY = "oauth";
const PENDING_KEY = "pending-image";

type OAuthSession = {
  clientId: string;
  redirectUri: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "edengen-reference",
      title: "Use image as an Eden Gen reference",
      contexts: ["image"],
    });
    chrome.contextMenus.create({
      id: "edengen-edit",
      title: "Edit image with Eden Gen",
      contexts: ["image"],
    });
    chrome.contextMenus.create({
      id: "edengen-upscale",
      title: "Upscale image with Eden Gen",
      contexts: ["image"],
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  const intent =
    info.menuItemId === "edengen-upscale" ? "upscale" : info.menuItemId === "edengen-edit" ? "edit" : "reference";
  const pending: PendingImage = { intent, srcUrl: info.srcUrl ?? "" };
  await chrome.storage.session.set({ [PENDING_KEY]: pending });
  await chrome.tabs.create({ url: chrome.runtime.getURL("editor.html") });
});

chrome.runtime.onMessage.addListener((message: ApiRequest, _sender, sendResponse) => {
  handle(message)
    .then((response) => sendResponse(response))
    .catch((error: unknown) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : "Request failed." } satisfies ApiResponse);
    });
  return true;
});

async function settings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] as Settings | undefined) };
}

async function oauthSession(): Promise<OAuthSession | null> {
  const stored = await chrome.storage.local.get(OAUTH_KEY);
  return (stored[OAUTH_KEY] as OAuthSession | undefined) ?? null;
}

async function accessToken(): Promise<string> {
  const current = await settings();
  if (current.authMode === "token") {
    const token = current.apiToken.trim();
    if (!token) throw new Error("Add an API token in the extension options.");
    return token;
  }
  const session = await oauthSession();
  if (!session) throw new Error("Sign in from the extension options.");
  if (session.expiresAt > Date.now() + 30_000) return session.accessToken;
  if (!session.refreshToken) throw new Error("The Eden Gen session expired. Sign in again.");
  const refreshed = await refreshAccessToken({ clientId: session.clientId, refreshToken: session.refreshToken });
  const next: OAuthSession = {
    ...session,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + (refreshed.expires_in ?? 3600) * 1000,
  };
  await chrome.storage.local.set({ [OAUTH_KEY]: next });
  return next.accessToken;
}

async function client(): Promise<EdenGenClient> {
  return new EdenGenClient(await accessToken());
}

async function signIn(): Promise<void> {
  const redirectUri = chrome.identity.getRedirectURL();
  if (!/^https:\/\/[a-p]{32}\.chromiumapp\.org\/$/.test(redirectUri)) {
    throw new Error("Eden Gen only accepts https://<extension-id>.chromiumapp.org/ and this id does not match.");
  }
  const existing = await oauthSession();
  const clientId =
    existing?.redirectUri === redirectUri ? existing.clientId : await registerPublicClient(redirectUri, "Eden Gen for Chrome");
  const verifier = randomVerifier();
  const state = randomVerifier();
  const url = authorizeUrl({
    clientId,
    redirectUri,
    state,
    codeChallenge: await pkceChallenge(verifier),
  });
  if (!url.includes(encodeURIComponent(REST_RESOURCE)) && !url.includes(REST_RESOURCE)) {
    throw new Error("The sign-in URL is missing the REST resource.");
  }
  const redirected = await chrome.identity.launchWebAuthFlow({ url, interactive: true });
  if (!redirected) throw new Error("Sign-in was cancelled.");
  const returned = new URL(redirected);
  if (returned.searchParams.get("state") !== state) throw new Error("Sign-in state did not match.");
  const oauthError = returned.searchParams.get("error");
  if (oauthError) throw new Error(returned.searchParams.get("error_description") || oauthError);
  const code = returned.searchParams.get("code");
  if (!code) throw new Error("Sign-in did not return a code.");
  const tokens = await exchangeAuthorizationCode({ clientId, code, redirectUri, codeVerifier: verifier });
  const next: OAuthSession = {
    clientId,
    redirectUri,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (tokens.expires_in ?? 3600) * 1000,
  };
  await chrome.storage.local.set({ [OAUTH_KEY]: next, [SETTINGS_KEY]: { ...(await settings()), authMode: "oauth" } });
}

async function handle(message: ApiRequest): Promise<ApiResponse> {
  switch (message.type) {
    case "settings-get": {
      const current = await settings();
      const session = await oauthSession();
      return { ok: true, type: "settings", settings: current, signedIn: Boolean(session?.accessToken) || Boolean(current.apiToken) };
    }
    case "settings-set":
      await chrome.storage.local.set({ [SETTINGS_KEY]: message.settings });
      return { ok: true, type: "done" };
    case "sign-in":
      await signIn();
      return { ok: true, type: "done" };
    case "sign-out":
      await chrome.storage.local.remove(OAUTH_KEY);
      return { ok: true, type: "done" };
    case "models":
      return { ok: true, type: "models", models: await (await client()).listModels() };
    case "account":
      return { ok: true, type: "account", account: await (await client()).account() };
    case "takes":
      return { ok: true, type: "takes", takes: (await (await client()).listTakes(12)).data };
    case "estimate":
      return { ok: true, type: "estimate", estimate: await (await client()).estimate({ ...message.input, prompt: assertPrompt(message.input.prompt) }) };
    case "create": {
      const api = await client();
      const input = { ...message.input, prompt: assertPrompt(message.input.prompt) };
      const created = await api.createTake(input, crypto.randomUUID(), message.confirm);
      return { ok: true, type: "take", take: created };
    }
    case "upload-url":
      return { ok: true, type: "asset", asset: await (await client()).uploadUrl(message.url) };
    case "get-take":
      return { ok: true, type: "take", take: await (await client()).getTake(message.id) };
    default:
      return { ok: false, error: "Unknown request." };
  }
}
