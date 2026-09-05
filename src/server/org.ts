import { getDb } from "@/lib/db";

export const PRIMARY_ORG_SLUG = "x-motion";

export async function getPrimaryOrganizationId(): Promise<string> {
  const { rows } = await getDb().query<{ id: string }>(
    "SELECT id FROM organizations WHERE slug = $1 LIMIT 1",
    [PRIMARY_ORG_SLUG]
  );
  if (rows.length === 0) {
    throw new Error(
      "Organização não encontrada na base de dados. Corre o seed (node scripts/seed.mjs)."
    );
  }
  return rows[0].id;
}
