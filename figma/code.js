"use strict";
(() => {
  // code.ts
  figma.showUI(__html__, { width: 380, height: 640, themeColors: false });
  figma.ui.onmessage = async (message) => {
    if (message.type === "load-token") {
      const token = await figma.clientStorage.getAsync("apiToken");
      figma.ui.postMessage({ type: "token", token: typeof token === "string" ? token : "" });
      return;
    }
    if (message.type === "save-token") {
      await figma.clientStorage.setAsync("apiToken", message.token ?? "");
      figma.ui.postMessage({ type: "saved" });
      return;
    }
    if (message.type !== "insert") return;
    const image = figma.createImage(new Uint8Array(message.bytes));
    const width = Math.max(1, message.width || 1024);
    const height = Math.max(1, message.height || 1024);
    const selected = figma.currentPage.selection[0];
    const target = selected && "fills" in selected ? selected : null;
    if (target && "resize" in target) {
      target.resize(width, height);
      target.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
      target.name = message.name || "Eden Gen";
      figma.currentPage.selection = [target];
      figma.viewport.scrollAndZoomIntoView([target]);
      figma.notify("Placed the Eden Gen image in the selection.");
      return;
    }
    const frame = figma.createFrame();
    frame.resize(width, height);
    frame.name = message.name || "Eden Gen";
    frame.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
    const center = figma.viewport.center;
    frame.x = center.x - width / 2;
    frame.y = center.y - height / 2;
    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
    figma.notify("Added an Eden Gen frame.");
  };
})();
