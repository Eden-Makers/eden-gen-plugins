interface WebflowAsset {
  setAltText(text: string): Promise<void>;
}

interface WebflowImageElement {
  setAsset(asset: WebflowAsset): Promise<void>;
  setAltText(text: string): Promise<void>;
}

interface WebflowElement {
  after(preset: unknown): Promise<WebflowImageElement>;
}

declare const webflow: {
  notify(args: { type: "Error" | "Success" | "Info"; message: string }): Promise<void>;
  getSelectedElement(): Promise<WebflowElement | null>;
  createAsset(file: File): Promise<WebflowAsset>;
  elementPresets: { Image: unknown };
};
