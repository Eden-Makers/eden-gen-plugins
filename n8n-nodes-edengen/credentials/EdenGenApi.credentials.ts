import type { ICredentialType, INodeProperties } from "n8n-workflow";

export class EdenGenApi implements ICredentialType {
  name = "edenGenApi";
  displayName = "Eden Gen API";
  documentationUrl = "https://edengen.ai/docs/agents";
  properties: INodeProperties[] = [
    {
      displayName: "API token",
      name: "apiToken",
      type: "string",
      typeOptions: { password: true },
      default: "",
      description: "Workspace token from https://edengen.ai/app/developers. It starts with tk_.",
    },
  ];
  authenticate = {
    type: "generic" as const,
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiToken}}",
      },
    },
  };
  test = {
    request: {
      baseURL: "https://edengen.ai/v1",
      url: "/account",
    },
  };
}
