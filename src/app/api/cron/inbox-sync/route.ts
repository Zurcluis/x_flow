import { isAuthorizedCronRequest } from "@/domains/inbox/cron";
import { enrichUnprocessedInboxThreads } from "@/server/inbox/ai";
import { syncOrganizationInbox } from "@/server/inbox/sync";
import { getPrimaryOrganizationId } from "@/server/org";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

async function handleCronSync(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return json({ ok: false, error: "CRON_SECRET não configurado." }, 503);
  }

  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return json({ ok: false, error: "Não autorizado." }, 401);
  }

  try {
    const organizationId = await getPrimaryOrganizationId();
    const report = await syncOrganizationInbox(organizationId);
    const enrichedCount = await enrichUnprocessedInboxThreads(organizationId, { limit: 5 }).catch(
      () => 0
    );

    return json({ ok: true, report, enrichedCount }, 200);
  } catch (error) {
    console.error(
      "[cron/inbox-sync] falha:",
      error instanceof Error ? error.message : "erro desconhecido"
    );
    return json({ ok: false, error: "Erro interno ao sincronizar inbox." }, 500);
  }
}

export async function GET(request: Request) {
  return handleCronSync(request);
}

export async function POST(request: Request) {
  return handleCronSync(request);
}
