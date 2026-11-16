import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  GatewayIntentBits,
  ModalBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
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
import { dropRun, stageRun, takeRun } from "./pending.ts";
import { LinkStore, type LinkedAccount } from "./store.ts";

const commands = [
  new SlashCommandBuilder()
    .setName("imagine")
    .setDescription("Generate an image or video with Eden Gen")
    .addStringOption((option) => option.setName("prompt").setDescription("What to generate").setRequired(true))
    .addStringOption((option) =>
      option
        .setName("kind")
        .setDescription("Image or video")
        .addChoices({ name: "Image", value: "image" }, { name: "Video", value: "video" }),
    )
    .addStringOption((option) =>
      option
        .setName("aspect")
        .setDescription("Aspect ratio")
        .addChoices(
          { name: "1:1", value: "1:1" },
          { name: "16:9", value: "16:9" },
          { name: "9:16", value: "9:16" },
          { name: "4:3", value: "4:3" },
        ),
    ),
  new SlashCommandBuilder().setName("link").setDescription("Save your Eden Gen personal token on this bot"),
  new SlashCommandBuilder()
    .setName("login")
    .setDescription("Sign in with Eden Gen on the machine that runs this bot"),
  new SlashCommandBuilder().setName("balance").setDescription("Show your Eden Gen workspace balance"),
].map((command) => command.toJSON());

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

function runInput(prompt: string, kind: string, aspect: string): RunInput {
  return {
    model: kind === "video" ? DEFAULT_MODELS.video : DEFAULT_MODELS.image,
    prompt,
    aspect_ratio: aspect,
    duration: kind === "video" ? 5 : undefined,
  };
}

async function main() {
  const token = process.env.DISCORD_TOKEN ?? "";
  const applicationId = process.env.DISCORD_APPLICATION_ID ?? "";
  if (!token || !applicationId) {
    console.error("Set DISCORD_TOKEN and DISCORD_APPLICATION_ID. They are not printed.");
    process.exitCode = 1;
    return;
  }
  const store = new LinkStore(storePath());
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(applicationId), { body: commands });

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.on("interactionCreate", async (interaction) => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === "link") {
        const modal = new ModalBuilder().setCustomId("eden-link").setTitle("Link Eden Gen");
        const field = new TextInputBuilder()
          .setCustomId("token")
          .setLabel("Personal token (tkp_)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);
        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(field));
        await interaction.showModal(modal);
        return;
      }
      if (interaction.isModalSubmit() && interaction.customId === "eden-link") {
        const value = interaction.fields.getTextInputValue("token").trim();
        if (!looksLikeToken(value)) {
          await interaction.reply({ ephemeral: true, content: `That is not an Eden Gen token. Create one at ${TOKEN_SETTINGS_URL}` });
          return;
        }
        store.set(interaction.user.id, { kind: "personal", accessToken: value });
        await interaction.reply({ ephemeral: true, content: "Linked. The token stays on this bot. It was not posted in the channel." });
        return;
      }
      if (interaction.isChatInputCommand() && interaction.commandName === "login") {
        await interaction.deferReply({ ephemeral: true });
        const result = await signInWithLoopback({
          clientName: "Eden Gen for Discord",
          open: async (url) => {
            await interaction.editReply(`Open this on the machine running the bot and approve Eden Gen:\n${url}`);
          },
        });
        store.set(interaction.user.id, {
          kind: "oauth",
          accessToken: result.tokens.access_token,
          refreshToken: result.tokens.refresh_token,
          clientId: result.clientId,
          expiresAt: Date.now() + (result.tokens.expires_in ?? 3600) * 1000,
        });
        await interaction.followUp({ ephemeral: true, content: "Eden Gen is linked with OAuth." });
        return;
      }
      if (interaction.isChatInputCommand() && interaction.commandName === "balance") {
        const linked = await accessToken(store, interaction.user.id);
        if (!linked) {
          await interaction.reply({ ephemeral: true, content: "Link Eden Gen with /link first." });
          return;
        }
        const account = await new EdenGenClient(linked).account();
        await interaction.reply({ ephemeral: true, content: `${account.workspace}: ${usd(account.balance_usd)} available.` });
        return;
      }
      if (interaction.isChatInputCommand() && interaction.commandName === "imagine") {
        await interaction.deferReply();
        const linked = await accessToken(store, interaction.user.id);
        if (!linked) {
          await interaction.editReply("Link Eden Gen with /link first. Use a private modal, not a channel message.");
          return;
        }
        const prompt = interaction.options.getString("prompt", true).trim();
        const kind = interaction.options.getString("kind") ?? "image";
        const aspect = interaction.options.getString("aspect") ?? (kind === "video" ? "16:9" : "1:1");
        const input = runInput(prompt, kind, aspect);
        const estimate = await new EdenGenClient(linked).estimate(input);
        if (!estimate.can_run) {
          await interaction.editReply(describeEstimate(estimate));
          return;
        }
        const id = stageRun(interaction.user.id, input, estimate.usd_total);
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`eden:ok:${id}`).setLabel(`Spend ${usd(estimate.usd_total)}`).setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`eden:no:${id}`).setLabel("Cancel").setStyle(ButtonStyle.Secondary),
        );
        await interaction.editReply({ content: describeEstimate(estimate), components: [row] });
        return;
      }
      if (interaction.isButton() && interaction.customId.startsWith("eden:")) {
        const [, action, id] = interaction.customId.split(":");
        if (!id) return;
        if (action === "no") {
          dropRun(id, interaction.user.id);
          await interaction.update({ content: "Cancelled. Nothing was created.", components: [] });
          return;
        }
        const pending = takeRun(id, interaction.user.id);
        if (!pending) {
          await interaction.reply({ ephemeral: true, content: "That confirmation expired, or it belongs to someone else." });
          return;
        }
        const linked = await accessToken(store, interaction.user.id);
        if (!linked) {
          await interaction.reply({ ephemeral: true, content: "Link Eden Gen with /link first." });
          return;
        }
        await interaction.deferUpdate();
        let lastEdit = 0;
        const eden = new EdenGenClient(linked);
        const take = await pricedTake(eden, pending.input, {
          idempotencyKey: pending.idempotencyKey,
          confirm: (fresh) => fresh.can_run && fresh.usd_total <= pending.usdTotal + 0.000_001,
          onUpdate: (current) => {
            if (Date.now() - lastEdit < 8000) return;
            lastEdit = Date.now();
            void interaction.editReply({ content: `Take ${current.id} is ${current.status}.`, components: [] });
          },
        });
        const file = await eden.download(take.id);
        const test = take.simulated ? " Marked as a test result." : "";
        await interaction.editReply({
          content: `Take ${take.id}.${test} ${takePageUrl(take.id)}`,
          files: [{ attachment: Buffer.from(file.bytes), name: filenameForTake(take) }],
          components: [],
        });
      }
    } catch (error) {
      const message = error instanceof CancelledError ? "The price changed or the run was blocked. Nothing new was created." : error instanceof Error ? error.message : "Eden Gen failed.";
      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) await interaction.editReply({ content: message, components: [] });
        else await interaction.reply({ ephemeral: true, content: message });
      }
    }
  });

  await client.login(token);
  console.log("Eden Gen Discord bot is connected. Tokens are not logged.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Eden Gen Discord bot failed.");
  process.exitCode = 1;
});
