const perform = async (z, bundle) => {
  const response = await z.request({
    url: `https://edengen.ai/v1/takes/${encodeURIComponent(bundle.inputData.take_id)}`,
  });
  return response.data;
};

module.exports = {
  key: "get_take",
  noun: "Take",
  display: {
    label: "Get Take",
    description: "Fetch one Eden Gen take by id.",
  },
  operation: {
    perform,
    inputFields: [{ key: "take_id", label: "Take ID", required: true }],
    sample: {
      id: "k3m9q2xa",
      status: "succeeded",
      model: "nano-banana-2.1",
      cost_usd: 0.04,
      output: { url: "https://media.edengen.ai/example.png", mime_type: "image/png", filename: "k3m9q2xa.png" },
    },
  },
};
