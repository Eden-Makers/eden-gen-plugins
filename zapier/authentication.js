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
      helpText: "Create a token at https://edengen.ai/app/developers. It starts with tk_.",
    },
  ],
  connectionLabel: "Eden Gen",
};
