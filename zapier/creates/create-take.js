const perform = async (z, bundle) => {
  const input = bundle.inputData;
  const estimate = await z.request({
    method: "POST",
    url: "https://edengen.ai/v1/estimate",
    body: {
      model: input.model,
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || "16:9",
      resolution: input.resolution || undefined,
      duration: input.duration || undefined,
      count: 1,
    },
  });
  const price = estimate.data;
  if (!price.can_run) {
    throw new z.errors.Error(price.blockers?.join(" ") || "Eden Gen refused this estimate.", "CanNotRun", 400);
  }
  if (price.needs_confirmation && !input.confirm_cost) {
    throw new z.errors.Error(
      `This take costs $${price.usd_total}. Turn on confirm cost only after that price is accepted.`,
      "NeedsConfirmation",
      400,
    );
  }
  const created = await z.request({
    method: "POST",
    url: "https://edengen.ai/v1/takes",
    headers: { "Idempotency-Key": input.idempotency_key || z.hash("create-take", JSON.stringify(input)) },
    body: {
      model: input.model,
      prompt: input.prompt,
      aspect_ratio: input.aspect_ratio || "16:9",
      resolution: input.resolution || undefined,
      duration: input.duration || undefined,
      count: 1,
      max_cost_usd: price.usd_total,
      confirm_cost: Boolean(price.needs_confirmation),
    },
  });
  const take = created.data.data ? created.data.data[0] : created.data;
  return { estimate: price, take };
};

module.exports = {
  key: "create_take",
  noun: "Take",
  display: {
    label: "Create Take",
    description: "Estimate an Eden Gen image, video or audio take, then create one if the price can run.",
  },
  operation: {
    perform,
    inputFields: [
      { key: "model", label: "Model", required: true, helpText: "Model id from GET /v1/models, for example nano-banana-2.1." },
      { key: "prompt", label: "Prompt", required: true, type: "text" },
      { key: "aspect_ratio", label: "Format", default: "16:9" },
      { key: "resolution", label: "Resolution", required: false },
      { key: "duration", label: "Duration (seconds)", type: "integer", required: false },
      { key: "confirm_cost", label: "Confirm cost", type: "boolean", default: "false" },
      { key: "idempotency_key", label: "Idempotency key", required: false },
    ],
    sample: {
      estimate: { usd_total: 0.04, can_run: true, needs_confirmation: false },
      take: { id: "k3m9q2xa", status: "queued", model: "nano-banana-2.1" },
    },
  },
};
