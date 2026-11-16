declare module "https://express.adobe.com/static/add-on-sdk/sdk.js" {
  interface AdobeAddOnSdk {
    ready: Promise<void>;
    app: {
      document: {
        addImage: (blob: Blob, attributes?: { title?: string; author?: string }) => Promise<void>;
      };
    };
  }
  const sdk: AdobeAddOnSdk;
  export default sdk;
}
