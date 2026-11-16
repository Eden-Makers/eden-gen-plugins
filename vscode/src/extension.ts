import * as vscode from "vscode";
import {
  CancelledError,
  DEFAULT_MODELS,
  EdenGenClient,
  MCP_URL,
  TOKEN_SETTINGS_URL,
  describeEstimate,
  filenameForTake,
  looksLikeToken,
  pricedTake,
  refreshAccessToken,
  takePageUrl,
  type RunInput,
} from "../../edengen-rest/edengen-rest.ts";
import { signInWithLoopback } from "../../edengen-rest/oauth-loopback.ts";

const SESSION = "edengen.session";
const MCP_PROVIDER = "edengen.mcp";

interface Session {
  kind: "personal" | "oauth";
  accessToken: string;
  refreshToken?: string;
  clientId?: string;
  expiresAt?: number;
}

async function readSession(context: vscode.ExtensionContext): Promise<Session | undefined> {
  const raw = await context.secrets.get(SESSION);
  if (!raw) return undefined;
  return JSON.parse(raw) as Session;
}

async function writeSession(context: vscode.ExtensionContext, session: Session): Promise<void> {
  await context.secrets.store(SESSION, JSON.stringify(session));
}

async function accessToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  const session = await readSession(context);
  if (!session) return undefined;
  if (session.kind === "oauth" && session.refreshToken && session.clientId && session.expiresAt && session.expiresAt < Date.now() + 60_000) {
    const next = await refreshAccessToken({ clientId: session.clientId, refreshToken: session.refreshToken });
    const updated: Session = {
      ...session,
      accessToken: next.access_token,
      refreshToken: next.refresh_token ?? session.refreshToken,
      expiresAt: Date.now() + (next.expires_in ?? 3600) * 1000,
    };
    await writeSession(context, updated);
    return updated.accessToken;
  }
  return session.accessToken;
}

function registerMcp(context: vscode.ExtensionContext): void {
  const emitter = new vscode.EventEmitter<void>();
  context.subscriptions.push(emitter);
  const provider = {
    onDidChangeMcpServerDefinitions: emitter.event,
    provideMcpServerDefinitions(): vscode.McpServerDefinition[] {
      return [new vscode.McpHttpServerDefinition("Eden Gen", vscode.Uri.parse(MCP_URL))];
    },
    resolveMcpServerDefinition(server: vscode.McpHttpServerDefinition): vscode.McpHttpServerDefinition {
      // VS Code completes MCP OAuth itself. The redirect host vscode.dev is already a known client.
      // Do not attach the /v1 personal token. That token is refused on the MCP resource.
      return server;
    },
  };
  context.subscriptions.push(vscode.lm.registerMcpServerDefinitionProvider(MCP_PROVIDER, provider));
}

export function activate(context: vscode.ExtensionContext): void {
  registerMcp(context);
  context.subscriptions.push(
    vscode.commands.registerCommand("edengen.setToken", () => setToken(context)),
    vscode.commands.registerCommand("edengen.signIn", () => signIn(context)),
    vscode.commands.registerCommand("edengen.generate", () => generate(context)),
  );
}

export function deactivate(): void {}

async function setToken(context: vscode.ExtensionContext): Promise<void> {
  const value = await vscode.window.showInputBox({
    title: "Eden Gen personal token",
    prompt: `Paste a tkp_ token from ${TOKEN_SETTINGS_URL}`,
    password: true,
    ignoreFocusOut: true,
  });
  if (!value) return;
  if (!looksLikeToken(value)) {
    void vscode.window.showErrorMessage("That is not an Eden Gen token. It should start with tkp_ or tk_.");
    return;
  }
  await writeSession(context, { kind: "personal", accessToken: value.trim() });
  void vscode.window.showInformationMessage("Eden Gen token saved in VS Code secret storage.");
}

async function signIn(context: vscode.ExtensionContext): Promise<void> {
  const result = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: "Eden Gen sign-in" }, () =>
    signInWithLoopback({
      clientName: "Eden Gen for VS Code",
      open: async (url) => {
        await vscode.env.openExternal(vscode.Uri.parse(url));
      },
    }),
  );
  await writeSession(context, {
    kind: "oauth",
    accessToken: result.tokens.access_token,
    refreshToken: result.tokens.refresh_token,
    clientId: result.clientId,
    expiresAt: Date.now() + (result.tokens.expires_in ?? 3600) * 1000,
  });
  void vscode.window.showInformationMessage("Signed in to Eden Gen.");
}

async function generate(context: vscode.ExtensionContext): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    void vscode.window.showErrorMessage("Open a workspace folder first. Eden Gen writes the file there.");
    return;
  }
  let token = await accessToken(context);
  if (!token) {
    await setToken(context);
    token = await accessToken(context);
  }
  if (!token) return;
  const prompt = await vscode.window.showInputBox({ title: "Eden Gen", prompt: "What should this take show?", ignoreFocusOut: true });
  if (!prompt?.trim()) return;
  const picked = await vscode.window.showQuickPick(
    [
      { label: "Image", media: "image" as const },
      { label: "Video", media: "video" as const },
    ],
    { title: "Eden Gen media" },
  );
  if (!picked) return;
  const input: RunInput = {
    model: picked.media === "video" ? DEFAULT_MODELS.video : DEFAULT_MODELS.image,
    prompt: prompt.trim(),
    aspect_ratio: picked.media === "video" ? "16:9" : "1:1",
    duration: picked.media === "video" ? 5 : undefined,
  };
  const client = new EdenGenClient(token);
  try {
    const estimate = await client.estimate(input);
    const choice = await vscode.window.showInformationMessage(describeEstimate(estimate), { modal: true }, estimate.can_run ? "Spend" : "Close");
    if (choice !== "Spend") return;
    const take = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Eden Gen", cancellable: false },
      async (progress) =>
        pricedTake(client, input, {
          confirm: (fresh) => fresh.can_run && fresh.usd_total <= estimate.usd_total + 0.000_001,
          onUpdate: (current) => progress.report({ message: `${current.id} is ${current.status}` }),
        }),
    );
    const file = await client.download(take.id);
    const destination = vscode.Uri.joinPath(folder.uri, "edengen", filenameForTake(take));
    await vscode.workspace.fs.writeFile(destination, file.bytes);
    const test = take.simulated ? " Marked as a test result." : "";
    void vscode.window.showInformationMessage(`Saved ${destination.fsPath}.${test} ${takePageUrl(take.id)}`);
  } catch (error) {
    const message = error instanceof CancelledError ? "The price changed or the run was blocked. Nothing new was created." : error instanceof Error ? error.message : "Eden Gen failed.";
    void vscode.window.showErrorMessage(message);
  }
}
