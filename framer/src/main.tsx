import { framer } from "@framer/plugin";
import "@framer/plugin/framer.css";
import { createRoot } from "react-dom/client";
import { App } from "./App";

framer.showUI({ position: "top right", width: 320, height: 520 });

const root = document.getElementById("root");
if (!root) throw new Error("Eden Gen could not find its panel.");
createRoot(root).render(<App />);
