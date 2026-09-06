import { getDb } from "@/lib/db";
import { FinishPreset } from "@/domains/intelligence/types";

type Row = Record<string, unknown>;

function mapFilm(r: Row): FinishPreset {
  return {
    id: String(r.id),
    name: String(r.name),
    brand: String(r.brand),
    type: r.type as FinishPreset["type"],
    colorHex: String(r.color_hex),
    textureEffect: r.finish as FinishPreset["textureEffect"],
    costPerMeterCents: Number(r.cost_per_meter_cents),
    warrantyYears: Number(r.warranty_years),
    glossGu: r.gloss_gu === null || r.gloss_gu === undefined ? undefined : Number(r.gloss_gu),
    metallic: r.metallic === null || r.metallic === undefined ? undefined : Number(r.metallic),
    flakeScale: r.flake_scale === null || r.flake_scale === undefined ? undefined : Number(r.flake_scale),
    sku: (r.sku as string) ?? undefined,
  };
}

/** Catálogo de películas da organização (tabela films). Devolve [] se ainda não migrada. */
export async function listFilms(organizationId: string): Promise<FinishPreset[]> {
  try {
    const { rows } = await getDb().query<Row>(
      `SELECT id, name, brand, sku, type, finish, color_hex, gloss_gu, metallic, flake_scale,
              cost_per_meter_cents, warranty_years
       FROM films
       WHERE organization_id = $1 AND active = TRUE
       ORDER BY brand, name`,
      [organizationId]
    );
    return rows.map(mapFilm);
  } catch {
    return [];
  }
}
