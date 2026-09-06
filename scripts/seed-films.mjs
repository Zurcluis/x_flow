// Seed do catálogo de películas (tabela films) — idempotente (ON CONFLICT).
// Valores de cor/brilho são aproximações de datasheets públicos (3M, Avery, XPEL,
// Stek, Inozetek, KPMF) — afinar com leituras reais de amostras (L*a*b*/GU).
// Uso: node scripts/seed-films.mjs
import pg from "pg";
import fs from "node:fs";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (() => {
    try {
      const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
      return env.match(/DATABASE_URL="(.+)"/)?.[1];
    } catch {
      return undefined;
    }
  })();

if (!DATABASE_URL) {
  console.error("DATABASE_URL em falta (.env.local)");
  process.exit(1);
}

// [name, brand, sku, type, finish, colorHex, glossGu, metallic, flakeScale, costCents, warrantyYears]
const FILMS = [
  // 3M Wrap Film Series 2080
  ["2080 Gloss Black", "3M Wrap Film Series 2080", "M12", "chrome_delete", "gloss", "#0e0f10", 85, 0, 0, 1800, 7],
  ["2080 Satin Dark Grey", "3M Wrap Film Series 2080", "M227", "vinyl_wrap", "satin", "#3c4043", 35, 0, 0, 2800, 7],
  ["2080 Matte Black", "3M Wrap Film Series 2080", "M226", "vinyl_wrap", "matte", "#1b1c1e", 10, 0, 0, 2800, 7],
  ["2080 Gloss Blue Fire", "3M Wrap Film Series 2080", "M263", "vinyl_wrap", "gloss", "#173f8f", 85, 0, 0, 2900, 7],
  // Avery Dennison
  ["SW900 Gloss Nardo Grey", "Avery Dennison SW900", "SW900-183", "vinyl_wrap", "gloss", "#74797d", 85, 0, 0, 2950, 7],
  ["SW900 Satin Pearl White", "Avery Dennison SW900", "SW900-101", "vinyl_wrap", "satin", "#e8e8e4", 30, 0, 0, 2950, 7],
  ["SW900 Matte Anthracite", "Avery Dennison SW900", "SW900-127", "vinyl_wrap", "matte", "#2b2e30", 12, 0.15, 0.3, 2950, 7],
  // XPEL (PPF transparente)
  ["Ultimate Plus PPF", "XPEL", "UPSC", "clear_ppf_gloss", "gloss", "#c9cdd1", 92, 0, 0, 5500, 10],
  ["Stealth PPF", "XPEL", "STSC", "clear_ppf_matte", "matte", "#c9cdd1", 12, 0, 0, 6000, 10],
  // Stek
  ["DYNOshield", "Stek Automotive", "DYNS", "clear_ppf_gloss", "gloss", "#c9cdd1", 93, 0, 0, 4200, 10],
  ["DYNOmatte", "Stek Automotive", "DYNM", "clear_ppf_matte", "matte", "#282d30", 11, 0, 0, 4800, 10],
  // Inozetek (color PPF)
  ["Super Gloss Midnight Purple", "Inozetek", "SGP605", "color_ppf", "gloss", "#2f2140", 90, 0.2, 0.4, 5500, 8],
  ["Frozen Black", "Inozetek", "FBK611", "color_ppf", "satin", "#14161a", 25, 0.75, 0.9, 5500, 8],
  ["Super Gloss British Racing Green", "Inozetek", "SGR615", "color_ppf", "gloss", "#0f3d2e", 90, 0, 0, 5500, 8],
  // KPMF
  ["Matte Anthracite", "KPMF Wrap-Over", "M05382", "vinyl_wrap", "matte", "#2e3134", 14, 0.2, 0.3, 2900, 7],
];

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const { rows: orgRows } = await client.query(
  `SELECT id FROM organizations ORDER BY created_at LIMIT 1`
);
if (orgRows.length === 0) {
  console.error("Nenhuma organização encontrada — correr scripts/seed.mjs primeiro.");
  process.exit(1);
}
const orgId = orgRows[0].id;

let inserted = 0;
for (const f of FILMS) {
  const [name, brand, sku, type, finish, colorHex, gu, metallic, flake, cost, warranty] = f;
  const { rowCount } = await client.query(
    `INSERT INTO films
      (organization_id, name, brand, sku, type, finish, color_hex, gloss_gu, metallic, flake_scale,
       cost_per_meter_cents, warranty_years)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (organization_id, brand, name) DO NOTHING`,
    [orgId, name, brand, sku, type, finish, colorHex, gu, metallic, flake, cost, warranty]
  );
  inserted += rowCount ?? 0;
}

console.log(`Films: ${inserted} inseridas, ${FILMS.length - inserted} já existiam.`);
await client.end();
