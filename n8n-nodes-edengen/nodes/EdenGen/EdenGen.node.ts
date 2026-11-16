import type {
  IDataObject,
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";
import { NodeOperationError } from "n8n-workflow";

const BASE = "https://edengen.ai/v1";

export class EdenGen implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Eden Gen",
    name: "edenGen",
    icon: "file:edengen.svg",
    group: ["output"],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: "Estimate and create images, video and audio, or fetch a take",
    defaults: { name: "Eden Gen" },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [{ name: "edenGenApi", required: true }],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        noDataExpression: true,
        options: [
          { name: "Create Take", value: "create", action: "Create a take" },
          { name: "Get Take", value: "get", action: "Get a take" },
          { name: "Estimate", value: "estimate", action: "Estimate a take" },
        ],
        default: "estimate",
      },
      {
        displayName: "Take ID",
        name: "takeId",
        type: "string",
        default: "",
        required: true,
        displayOptions: { show: { operation: ["get"] } },
      },
      {
        displayName: "Model",
        name: "model",
        type: "string",
        default: "nano-banana-2.1",
        required: true,
        displayOptions: { show: { operation: ["create", "estimate"] } },
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        typeOptions: { rows: 4 },
        default: "",
        required: true,
        displayOptions: { show: { operation: ["create", "estimate"] } },
      },
      {
        displayName: "Format",
        name: "aspectRatio",
        type: "string",
        default: "16:9",
        displayOptions: { show: { operation: ["create", "estimate"] } },
        description: "Sent on every estimate and create. 16:9 is the API default when this is omitted.",
      },
      {
        displayName: "Confirm the estimate",
        name: "confirmCost",
        type: "boolean",
        default: false,
        displayOptions: { show: { operation: ["create"] } },
        description: "Turn this on only after the shown estimate is the price you accept. Creation is not idempotent across different keys, and an accepted take cannot be cancelled.",
      },
      {
        displayName: "Max cost (USD)",
        name: "maxCostUsd",
        type: "number",
        default: 0,
        displayOptions: { show: { operation: ["create"] } },
        description: "Refuse the create when the price is above this amount. 0 omits the cap.",
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const operation = this.getNodeParameter("operation", 0) as string;
    const credentials = await this.getCredentials("edenGenApi");
    const token = String(credentials.apiToken ?? "");
    if (!token) throw new NodeOperationError(this.getNode(), "Add an Eden Gen API token.");
    const results: INodeExecutionData[] = [];

    for (let index = 0; index < items.length; index += 1) {
      if (operation === "get") {
        const id = this.getNodeParameter("takeId", index) as string;
        results.push({ json: await request(this, token, "GET", `/takes/${encodeURIComponent(id)}`) });
        continue;
      }
      const body: IDataObject = {
        model: this.getNodeParameter("model", index) as string,
        prompt: this.getNodeParameter("prompt", index) as string,
        aspect_ratio: this.getNodeParameter("aspectRatio", index) as string,
        count: 1,
      };
      if (operation === "estimate") {
        results.push({ json: await request(this, token, "POST", "/estimate", body) });
        continue;
      }
      const maxCost = this.getNodeParameter("maxCostUsd", index) as number;
      if (maxCost > 0) body.max_cost_usd = maxCost;
      if (this.getNodeParameter("confirmCost", index) as boolean) body.confirm_cost = true;
      const idempotency = crypto.randomUUID();
      results.push({
        json: await request(this, token, "POST", "/takes", body, { "Idempotency-Key": idempotency }),
      });
    }
    return [results];
  }
}

async function request(
  execute: IExecuteFunctions,
  token: string,
  method: "GET" | "POST",
  path: string,
  body?: IDataObject,
  headers: Record<string, string> = {},
): Promise<IDataObject> {
  const response = await execute.helpers.httpRequest({
    method,
    url: `${BASE}${path}`,
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...headers },
    body,
    json: true,
  });
  return response as IDataObject;
}
