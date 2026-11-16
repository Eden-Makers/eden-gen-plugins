import { call, unwrap } from "./page";
import type { Settings } from "./protocol";

const mode = document.querySelector<HTMLSelectElement>("#mode")!;
const token = document.querySelector<HTMLInputElement>("#token")!;
const status = document.querySelector<HTMLElement>("#status")!;
const error = document.querySelector<HTMLElement>("#error")!;

call({ type: "settings-get" })
  .then((response) => {
    const current = unwrap(response, "settings");
    mode.value = current.settings.authMode;
    token.value = current.settings.apiToken;
    status.textContent = current.signedIn ? "A credential is saved on this browser." : "No credential saved yet.";
  })
  .catch((cause: unknown) => {
    error.textContent = cause instanceof Error ? cause.message : "Could not load settings.";
  });

document.querySelector("#save")!.addEventListener("click", async () => {
  error.textContent = "";
  const settings: Settings = { authMode: mode.value === "oauth" ? "oauth" : "token", apiToken: token.value.trim() };
  unwrap(await call({ type: "settings-set", settings }), "done");
  status.textContent = "Saved.";
});

document.querySelector("#oauth")!.addEventListener("click", async () => {
  error.textContent = "";
  status.textContent = "Opening Eden Gen. Approve a project and a monthly cap.";
  try {
    unwrap(await call({ type: "sign-in" }), "done");
    status.textContent = "Signed in. The consent screen capped this connection.";
  } catch (cause) {
    error.textContent = cause instanceof Error ? cause.message : "Sign-in failed.";
  }
});

document.querySelector("#out")!.addEventListener("click", async () => {
  await call({ type: "sign-out" });
  status.textContent = "Signed out on this browser. The workspace connection can also be revoked at edengen.ai/app/developers.";
});
