import { Markup, Telegraf } from "telegraf";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CancelledError,
  DEFAULT_MODELS,
  EdenGenClient,
  TOKEN_SETTINGS_URL,
  describeEstimate,
  filenameForTake,
  looksLikeToken,
  pricedTake,
  refreshAccessToken,
  takePageUrl,
  usd,
  type RunInput,
} from "../../edengen-rest/edengen-rest.ts";
import { signInWithLoopback } from "../../edengen-rest/oauth-loopback.ts";
import { dropRun, stageRun, takeRun } from "../../discord/src/pending.ts";
import { LinkStore, type LinkedAccount } from "../../discord/src/store.ts";
import { parseImagine } from "./parse.ts";

const waiting = new Set<string>();

function storePath(): string {
  const root = dirname(fileURLToPath(import.meta.url));
  return process.env.EDEN_LINK_STORE ?? join(root, "..", "data", "links.json");
}

async function accessToken(store: LinkStore, userId: string): Promise<string | undefined> {
  const account = store.get(userId);
  if (!account) return undefined;
  if (account.kind === "oauth" && account.refreshToken && account.clientId && account.expiresAt && account.expiresAt < Date.now() + 60_000) {
    const next = await refreshAccessToken({ clientId: account.clientId, refreshToken: account.refreshToken });
    const updated: LinkedAccount = {
      ...account,
      accessToken: next.access_token,
      refreshToken: next.refresh_token ?? account.refreshToken,
      expiresAt: Date.now() + (next.expires_in ?? 3600) * 1000,
    };
    store.set(userId, updated);
    return updated.accessToken;
  }
  return account.accessToken;
}

function runInput(prompt: string, kind: "image" | "video"): RunInput {
  return {
    model: kind === "video" ? DEFAULT_MODELS.video : DEFAULT_MODELS.image,
    prompt,
    aspect_ratio: kind === "video" ? "16:9" : "1:1",
    duration: kind === "video" ? 5 : undefined,
  };
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  if (!token) {
    console.error("Set TELEGRAM_BOT_TOKEN. It is not printed.");
    process.exitCode = 1;
    return;
  }
  const store = new LinkStore(storePath());
  const bot = new Telegraf(token);

  bot.start(async (ctx) => {
    await ctx.reply(
      "Eden Gen by Edenmakers. /link in this private chat, then /imagine or /video. A price is shown before any credit is spent. " +
        TOKEN_SETTINGS_URL,
    );
  });

  bot.command("link", async (ctx) => {
    if (ctx.chat.type !== "private") {
      await ctx.reply("Open a private chat and send /link there. Do not paste a token in a group.");
      return;
    }
    waiting.add(String(ctx.from.id));
    await ctx.reply("Send your Eden Gen personal token as the next message. This bot deletes that message.");
  });

  bot.command("login", async (ctx) => {
    if (ctx.chat.type !== "private") {
      await ctx.reply("Send /login in a private chat.");
      return;
    }
    const userId = String(ctx.from.id);
    const result = await signInWithLoopback({
      clientName: "Eden Gen for Telegram",
      open: async (url) => {
        await ctx.reply(`Open this on the machine running the bot and approve Eden Gen:\n${url}`);
      },
    });
    store.set(userId, {
      kind: "oauth",
      accessToken: result.tokens.access_token,
      refreshToken: result.tokens.refresh_token,
      clientId: result.clientId,
      expiresAt: Date.now() + (result.tokens.expires_in ?? 3600) * 1000,
    });
    await ctx.reply("Eden Gen is linked with OAuth.");
  });

  bot.command("balance", async (ctx) => {
    const linked = await accessToken(store, String(ctx.from.id));
    if (!linked) {
      await ctx.reply("Link Eden Gen with /link in a private chat first.");
      return;
    }
    const account = await new EdenGenClient(linked).account();
    await ctx.reply(`${account.workspace}: ${usd(account.balance_usd)} available.`);
  });

  bot.on("text", async (ctx, next) => {
    const parsed = parseImagine(ctx.message.text);
    if (parsed) {
      await handleImagine(ctx, store, parsed.kind, parsed.prompt);
      return;
    }
    const userId = String(ctx.from.id);
    if (!waiting.has(userId) || ctx.chat.type !== "private") return next();
    waiting.delete(userId);
    const value = ctx.message.text.trim();
    try {
      await ctx.deleteMessage();
    } catch {
      // The message can already be gone. Still refuse to treat a bad value as a token.
    }
    if (!looksLikeToken(value)) {
      await ctx.reply(`That is not an Eden Gen token. Create one at ${TOKEN_SETTINGS_URL}`);
      return;
    }
    store.set(userId, { kind: "personal", accessToken: value });
    await ctx.reply("Linked. The token stays on this bot.");
  });

  bot.action(/^eden:(ok|no):(.+)$/, async (ctx) => {
    const action = ctx.match[1];
    const id = ctx.match[2] ?? "";
    const userId = String(ctx.from.id);
    await ctx.answerCbQuery();
    if (action === "no") {
      dropRun(id, userId);
      await ctx.editMessageText("Cancelled. Nothing was created.");
      return;
    }
    const pending = takeRun(id, userId);
    if (!pending) {
      await ctx.reply("That confirmation expired, or it belongs to someone else.");
      return;
    }
    const linked = await accessToken(store, userId);
    if (!linked) {
      await ctx.reply("Link Eden Gen with /link in a private chat first.");
      return;
    }
    const eden = new EdenGenClient(linked);
    const take = await pricedTake(eden, pending.input, {
      idempotencyKey: pending.idempotencyKey,
      confirm: (fresh) => fresh.can_run && fresh.usd_total <= pending.usdTotal + 0.000_001,
    });
    const file = await eden.download(take.id);
    const caption = `Take ${take.id}.${take.simulated ? " Marked as a test result." : ""} ${takePageUrl(take.id)}`;
    const source = Buffer.from(file.bytes);
    const name = filenameForTake(take);
    if ((take.output?.mime_type ?? "").startsWith("video")) await ctx.replyWithVideo({ source, filename: name }, { caption });
    else await ctx.replyWithPhoto({ source, filename: name }, { caption });
    await ctx.editMessageText(caption);
  });

  bot.catch((error: unknown) => {
    const message = error instanceof CancelledError ? "The price changed or the run was blocked. Nothing new was created." : error instanceof Error ? error.message : "Eden Gen failed.";
    console.error(message);
  });

  await bot.launch();
  console.log("Eden Gen Telegram bot is connected. Tokens are not logged.");
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}

async function handleImagine(
  ctx: { from: { id: number }; reply: (text: string, extra?: object) => Promise<unknown> },
  store: LinkStore,
  kind: "image" | "video",
  prompt: string,
) {
  if (!prompt) {
    await ctx.reply(kind === "video" ? "Usage: /video a slow dolly through a library" : "Usage: /imagine a glacier at dusk");
    return;
  }
  const userId = String(ctx.from.id);
  const linked = await accessToken(store, userId);
  if (!linked) {
    await ctx.reply("Link Eden Gen with /link in a private chat first.");
    return;
  }
  const input = runInput(prompt, kind);
  const estimate = await new EdenGenClient(linked).estimate(input);
  if (!estimate.can_run) {
    await ctx.reply(describeEstimate(estimate));
    return;
  }
  const id = stageRun(userId, input, estimate.usd_total);
  await ctx.reply(describeEstimate(estimate), Markup.inlineKeyboard([
    Markup.button.callback(`Spend ${usd(estimate.usd_total)}`, `eden:ok:${id}`),
    Markup.button.callback("Cancel", `eden:no:${id}`),
  ]));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Eden Gen Telegram bot failed.");
  process.exitCode = 1;
});
