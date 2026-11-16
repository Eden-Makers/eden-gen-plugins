const test = async (z, bundle) => {
  const response = await z.request({ url: "https://edengen.ai/v1/account" });
  return response.data;
};

module.exports = {
  type: "custom",
  test,
  fields: [
    {
      key: "apiToken",
      label: "API token",
      required: true,
      type: "password",
      helpText: "Personal token from https://edengen.ai/app/settings?tab=api. It starts with tkp_. Needs estimate, takes:write, and takes:read. OpenAPI: https://edengen.ai/openapi.json.",
    },
  ],
  connectionLabel: "Eden Gen",
};
