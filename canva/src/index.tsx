import { AppUiProvider } from "@canva/app-ui-kit";
import "@canva/app-ui-kit/styles.css";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const root = document.getElementById("root");
if (!root) throw new Error("Eden Gen could not find its panel.");
createRoot(root).render(
  <AppUiProvider>
    <App />
  </AppUiProvider>,
);
