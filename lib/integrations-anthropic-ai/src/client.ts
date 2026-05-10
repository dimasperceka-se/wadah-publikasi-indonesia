import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function buildClient(): Anthropic {
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Anthropic API key is not configured. Set ANTHROPIC_API_KEY (or AI_INTEGRATIONS_ANTHROPIC_API_KEY) to enable AI review.",
    );
  }

  return new Anthropic({
    apiKey,
    baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL ?? process.env.ANTHROPIC_BASE_URL,
  });
}

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_client) _client = buildClient();
    const value = (_client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(_client) : value;
  },
});
