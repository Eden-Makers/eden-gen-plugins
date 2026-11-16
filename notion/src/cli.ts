import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { describeEstimate, usd } from "../../edengen-rest/edengen-rest.ts";
import { generateIntoPage } from "./notion.ts";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const page = arg("--page");
  const prompt = arg("--prompt");
  const model = arg("--model");
  const aspect = arg("--aspect");
  const yes = process.argv.includes("--yes");
  const edenToken = process.env.EDEN_TOKEN ?? "";
  const notionToken = process.env.NOTION_TOKEN ?? "";
  if (!page || !prompt) {
    console.error("Usage: npm start -- --page <url or id> --prompt <text> [--model id] [--aspect 1:1] [--yes]");
    console.error("Reads EDEN_TOKEN and NOTION_TOKEN from the environment. They are not printed.");
    process.exitCode = 1;
    return;
  }
  if (!edenToken || !notionToken) {
    console.error("Set EDEN_TOKEN (tkp_ or tk_) and NOTION_TOKEN (an internal integration secret).");
    process.exitCode = 1;
    return;
  }
  const result = await generateIntoPage({
    notionToken,
    edenToken,
    page,
    prompt,
    model,
    aspectRatio: aspect,
    confirm: async (estimate) => {
      console.log(describeEstimate(estimate));
      if (!estimate.can_run) return false;
      if (yes) return true;
      const rl = createInterface({ input, output });
      const answer = (await rl.question(`Spend ${usd(estimate.usd_total)}? Type yes: `)).trim().toLowerCase();
      rl.close();
      return answer === "yes";
    },
  });
  console.log(`Inserted take ${result.take.id} (${result.mode}).`);
  if (result.mode === "external") {
    console.log("Notion stored an external URL. Signed URLs expire. File upload is used when Notion accepts it.");
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Eden Gen failed.");
  process.exitCode = 1;
});
