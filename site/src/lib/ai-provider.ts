export type SupportedAIProvider = "openrouter" | "huggingface";

export type AIEnvironment = {
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  HF_TOKEN?: string;
  AI_NANO_MODEL?: string;
  AI_GPT_MODEL?: string;
  AI_HF_PROVIDER?: string;
};

export function resolveProvider(env: AIEnvironment): SupportedAIProvider | null {
  if (env.AI_PROVIDER === "openrouter" || env.AI_PROVIDER === "huggingface") {
    return env.AI_PROVIDER;
  }
  return null;
}

export function resolveApiKey(env: AIEnvironment): string {
  const explicitKey = env.AI_API_KEY?.trim();
  if (explicitKey) return explicitKey;
  if (env.AI_PROVIDER === "huggingface") {
    return env.HF_TOKEN?.trim() || "";
  }
  return "";
}

export function isReady(env: AIEnvironment) {
  return resolveProvider(env) !== null && resolveApiKey(env).length > 0;
}

export class GenerationError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}
