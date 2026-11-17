import { isReady, resolveProvider, type AIEnvironment } from "@/lib/ai-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env: AIEnvironment = {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_API_KEY: process.env.AI_API_KEY,
    HF_TOKEN: process.env.HF_TOKEN,
  };
  return Response.json(
    {
      ready: isReady(env),
      provider: resolveProvider(env),
      accessRequired: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
