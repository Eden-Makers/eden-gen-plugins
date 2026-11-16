export type ImagineKind = "image" | "video";

export function parseImagine(text: string): { kind: ImagineKind; prompt: string } | undefined {
  const match = text.trim().match(/^\/(imagine|video)(?:@\S+)?(?:\s+([\s\S]+))?$/i);
  if (!match) return undefined;
  const kind: ImagineKind = match[1].toLowerCase() === "video" ? "video" : "image";
  return { kind, prompt: (match[2] ?? "").trim() };
}
