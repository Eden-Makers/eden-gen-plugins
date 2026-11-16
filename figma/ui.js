"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // ../shared/edengen-rest.ts
  var ORIGIN = "https://edengen.ai";
  var API_BASE = `${ORIGIN}/v1`;
  var REST_RESOURCE = `${ORIGIN}/v1`;
  var OAUTH_SCOPE = "takes";
  var OPENAPI_URL = `${ORIGIN}/openapi.json`;
  var TOKEN_SETTINGS_URL = `${ORIGIN}/app/settings?tab=api`;
  var HELP_URL = `${ORIGIN}/docs/help`;
  var FIGMA_REDIRECT = "https://www.figma.com/oauth/callback";
  var AUTHORIZE_URL = `${ORIGIN}/oauth/authorize`;
  var TOKEN_URL = `${ORIGIN}/oauth/token`;
  var REGISTER_URL = `${ORIGIN}/oauth/register`;
  var REVOKE_URL = `${ORIGIN}/oauth/revoke`;
  var DEFAULT_MODELS = {
    image: "nano-banana-2.1",
    video: "seedance-2.5",
    audio: "gemini-3-8-flash-tts"
  };
  var EdenGenError = class extends Error {
    constructor(message, status, code = "error") {
      super(message);
      __publicField(this, "status");
      __publicField(this, "code");
      this.name = "EdenGenError";
      this.status = status;
      this.code = code;
    }
  };
  function stripUndefined(body) {
    const out = {};
    for (const [key, value] of Object.entries(body)) {
      if (value !== void 0 && value !== "") out[key] = value;
    }
    return out;
  }
  function runBody(input, confirmCost) {
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
      confirm_cost: confirmCost ? true : void 0
    });
  }
  function bytesToBase64Url(bytes) {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  async function pkceChallenge(verifier) {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return bytesToBase64Url(new Uint8Array(digest));
  }
  function randomVerifier() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytesToBase64Url(bytes);
  }
  function authorizeUrl(args) {
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
  async function readError(response) {
    const body = await response.json().catch(() => ({}));
    const nested = body.error;
    const message = typeof nested === "object" && nested?.message || body.error_description || (typeof nested === "string" ? nested : "") || `HTTP ${response.status}`;
    const code = typeof nested === "object" && nested?.code || (typeof nested === "string" ? nested : "error");
    return new EdenGenError(message, response.status, code);
  }
  var EdenGenClient = class {
    constructor(token, fetchImpl = fetch) {
      __publicField(this, "token");
      __publicField(this, "fetchImpl");
      this.token = token;
      this.fetchImpl = fetchImpl;
    }
    async request(path, init = {}) {
      const url = new URL(API_BASE + path);
      for (const [key, value] of Object.entries(init.query ?? {})) {
        if (value !== void 0 && value !== "") url.searchParams.set(key, String(value));
      }
      const response = await this.fetchImpl(url, {
        method: init.method ?? "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
          ...init.body === void 0 ? {} : { "Content-Type": "application/json" },
          ...init.headers
        },
        body: init.body === void 0 ? void 0 : JSON.stringify(init.body)
      });
      if (!response.ok) throw await readError(response);
      return await response.json();
    }
    async listModels() {
      const page = await this.request("/models");
      return page.data;
    }
    modelsFor(kind, models2) {
      return models2.filter((model) => model.kind === kind);
    }
    estimate(input) {
      return this.request("/estimate", { method: "POST", body: runBody(input, false) });
    }
    async createTake(input, idempotencyKey, confirmCost) {
      const created = await this.request("/takes", {
        method: "POST",
        body: runBody(input, confirmCost),
        headers: { "Idempotency-Key": idempotencyKey }
      });
      if ("data" in created) {
        const first = created.data[0];
        if (!first) throw new EdenGenError("Create returned no take.", 500, "empty");
        return first;
      }
      return created;
    }
    getTake(id) {
      return this.request(`/takes/${encodeURIComponent(id)}`);
    }
    listTakes(limit = 20) {
      return this.request("/takes", { query: { limit } });
    }
    account() {
      return this.request("/account");
    }
    /** One-time upload slot. Personal tokens are allowed: the route scope is uploads:write. */
    async uploadBytes(data, filename) {
      const slot = await this.request("/uploads", {
        method: "POST",
        body: { filename }
      });
      const response = await this.fetchImpl(slot.upload_url, {
        method: slot.method,
        headers: { "Content-Type": "application/octet-stream", Accept: "application/json" },
        body: data
      });
      if (!response.ok) throw await readError(response);
      return await response.json();
    }
    /**
     * Import an https URL. POST /v1/assets does not declare a scope, so a personal token (tkp_) is refused
     * until takes adds uploads:write on that route. A developer key (tk_, no scope list) still works.
     */
    uploadUrl(url) {
      return this.request("/assets", { method: "POST", body: { url } });
    }
    async waitForTake(id, opts = {}) {
      const deadline = Date.now() + (opts.timeoutMs ?? 10 * 6e4);
      const interval = opts.intervalMs ?? 2e3;
      for (; ; ) {
        const take = await this.getTake(id);
        if (take.status === "succeeded" || take.status === "failed") return take;
        if (Date.now() > deadline) return take;
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
  };
  async function registerPublicClient(redirectUri, clientName, fetchImpl = fetch) {
    const response = await fetchImpl(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_name: clientName,
        redirect_uris: [redirectUri],
        grant_types: ["authorization_code", "refresh_token"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
        scope: OAUTH_SCOPE
      })
    });
    if (!response.ok) throw await readError(response);
    const body = await response.json();
    if (!body.client_id) throw new EdenGenError("Registration returned no client_id.", response.status, "invalid_client");
    return body.client_id;
  }
  async function exchangeAuthorizationCode(args, fetchImpl = fetch) {
    return tokenRequest(
      {
        grant_type: "authorization_code",
        client_id: args.clientId,
        code: args.code,
        redirect_uri: args.redirectUri,
        code_verifier: args.codeVerifier,
        resource: REST_RESOURCE
      },
      fetchImpl
    );
  }
  async function tokenRequest(fields, fetchImpl) {
    const body = new URLSearchParams(fields);
    const response = await fetchImpl(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body
    });
    if (!response.ok) throw await readError(response);
    const json = await response.json();
    if (!json.access_token)
      throw new EdenGenError("Token response had no access_token.", response.status, "invalid_token");
    return json;
  }
  function formatUsd(value) {
    if (value === void 0 || Number.isNaN(value)) return "unknown";
    return `$${value.toFixed(value >= 1 ? 2 : 4)}`;
  }
  function assertPrompt(prompt) {
    const trimmed = prompt.trim();
    if (trimmed.length < 5 || trimmed.length > 4e3) {
      throw new EdenGenError("Prompt must be between 5 and 4000 characters.", 400, "invalid_prompt");
    }
    return trimmed;
  }

  // ui.ts
  var pending = null;
  var tokenInput = document.querySelector("#token");
  var promptInput = document.querySelector("#prompt");
  var modelSelect = document.querySelector("#model");
  var aspectSelect = document.querySelector("#aspect");
  var resolutionSelect = document.querySelector("#resolution");
  var price = document.querySelector("#price");
  var error = document.querySelector("#error");
  var models = [];
  var estimate = null;
  function show(cause) {
    error.textContent = cause instanceof Error ? cause.message : "Something went wrong.";
  }
  function client() {
    const token = tokenInput.value.trim();
    if (!token) throw new Error("Paste an API token from edengen.ai/app/developers.");
    return new EdenGenClient(token);
  }
  parent.postMessage({ pluginMessage: { type: "load-token" } }, "*");
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    if (!message) return;
    if (message.type === "token") {
      tokenInput.value = message.token ?? "";
      if (tokenInput.value) void loadModels();
    }
    if (message.type === "saved") price.textContent = "Token saved in this file's plugin data.";
  };
  function selectedModel() {
    return models.find((model) => model.id === modelSelect.value);
  }
  function fillOptions() {
    const model = selectedModel();
    const ratios = model?.aspect_ratios?.length ? model.aspect_ratios : ["16:9", "9:16", "1:1"];
    const resolutions = model?.resolutions?.length ? model.resolutions : [model?.default_resolution || "1K"];
    aspectSelect.replaceChildren(...options(ratios, aspectSelect.value || "16:9"));
    resolutionSelect.replaceChildren(...options(resolutions.filter(Boolean), model?.default_resolution || resolutions[0] || ""));
  }
  function options(values, selected) {
    return values.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = value === selected;
      return option;
    });
  }
  async function loadModels() {
    error.textContent = "";
    const all = await client().listModels();
    models = all.filter((model) => model.kind === "image");
    modelSelect.replaceChildren(
      ...models.map((model) => {
        const option = document.createElement("option");
        option.value = model.id;
        option.textContent = model.name;
        option.selected = model.id === DEFAULT_MODELS.image;
        return option;
      })
    );
    fillOptions();
  }
  function runInput() {
    return {
      model: modelSelect.value,
      prompt: assertPrompt(promptInput.value),
      aspect_ratio: aspectSelect.value || "16:9",
      resolution: resolutionSelect.value || void 0
    };
  }
  document.querySelector("#save").addEventListener("click", () => {
    parent.postMessage({ pluginMessage: { type: "save-token", token: tokenInput.value.trim() } }, "*");
  });
  document.querySelector("#signin").addEventListener("click", async () => {
    error.textContent = "";
    try {
      const verifier = randomVerifier();
      const state = randomVerifier();
      const clientId = await registerPublicClient(FIGMA_REDIRECT, "Eden Gen for Figma");
      pending = { clientId, verifier, state };
      const url = authorizeUrl({
        clientId,
        redirectUri: FIGMA_REDIRECT,
        state,
        codeChallenge: await pkceChallenge(verifier)
      });
      window.open(url, "_blank");
      price.textContent = `Approve in the browser, then paste the callback address. If no window opened, open this address: ${url}`;
    } catch (cause) {
      show(cause);
    }
  });
  document.querySelector("#finish").addEventListener("click", async () => {
    error.textContent = "";
    try {
      if (!pending) throw new Error("Start sign-in first.");
      const pasted = new URL(document.querySelector("#callback").value.trim());
      const got = `${pasted.origin}${pasted.pathname}`.replace(/\/$/, "");
      if (got !== FIGMA_REDIRECT) {
        throw new Error("Paste the address that starts with https://www.figma.com/oauth/callback.");
      }
      if (pasted.searchParams.get("state") !== pending.state) throw new Error("Sign-in state did not match. Start again.");
      const code = pasted.searchParams.get("code");
      if (!code) throw new Error(pasted.searchParams.get("error_description") || "The callback has no code.");
      const tokens = await exchangeAuthorizationCode({
        clientId: pending.clientId,
        code,
        redirectUri: FIGMA_REDIRECT,
        codeVerifier: pending.verifier
      });
      tokenInput.value = tokens.access_token;
      parent.postMessage({ pluginMessage: { type: "save-token", token: tokens.access_token } }, "*");
      price.textContent = "Signed in. The token is an OAuth access token for https://edengen.ai/v1.";
      await loadModels();
    } catch (cause) {
      show(cause);
    }
  });
  document.querySelector("#models").addEventListener("click", () => {
    loadModels().catch(show);
  });
  modelSelect.addEventListener("change", () => {
    estimate = null;
    fillOptions();
  });
  promptInput.addEventListener("input", () => {
    estimate = null;
  });
  document.querySelector("#estimate").addEventListener("click", async () => {
    error.textContent = "";
    try {
      estimate = await client().estimate(runInput());
      price.textContent = `${formatUsd(estimate.usd_total)} \xB7 balance ${formatUsd(estimate.balance_usd)} \xB7 ${estimate.can_run ? "can run" : `blocked: ${(estimate.blockers ?? []).join(" ")}`}${estimate.needs_confirmation ? " \xB7 confirm with Generate" : ""}`;
    } catch (cause) {
      show(cause);
    }
  });
  document.querySelector("#generate").addEventListener("click", async () => {
    error.textContent = "";
    try {
      if (!estimate?.can_run) throw new Error("Estimate a run that can start before generating.");
      const api = client();
      const input = { ...runInput(), max_cost_usd: estimate.usd_total };
      const created = await api.createTake(input, crypto.randomUUID(), estimate.needs_confirmation);
      price.textContent = `Take ${created.id} is ${created.status}.`;
      const finished = await api.waitForTake(created.id, { timeoutMs: 4 * 6e4 });
      if (finished.status !== "succeeded" || !finished.output?.url) {
        throw new Error(finished.status === "failed" ? `Failed and refunded: ${finished.error ?? finished.id}` : `Still ${finished.status}. Take ${finished.id}.`);
      }
      const response = await fetch(finished.output.url);
      if (!response.ok) throw new Error(`The file URL returned HTTP ${response.status}. Open it from Eden Gen if the browser blocked it.`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const blobUrl = URL.createObjectURL(new Blob([bytes]));
      const dimensions = await measure(blobUrl);
      URL.revokeObjectURL(blobUrl);
      parent.postMessage(
        {
          pluginMessage: {
            type: "insert",
            bytes: Array.from(bytes),
            width: dimensions.width,
            height: dimensions.height,
            name: finished.output.filename || `Eden Gen ${finished.id}`
          }
        },
        "*"
      );
      price.textContent = `Placed ${finished.id} \xB7 ${formatUsd(finished.cost_usd)}`;
    } catch (cause) {
      show(cause);
    }
  });
  function measure(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("Could not read the image size."));
      image.src = url;
    });
  }
})();
