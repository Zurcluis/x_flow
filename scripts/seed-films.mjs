// Seed do catálogo de películas (tabela films) — fonte de verdade: docs/catalogos-peliculas/
// Dados (códigos, acabamentos, garantias) verificados nos catálogos/TDS oficiais a 06/09/2026.
// Cores hex aproximadas de fotografia de produto — afinar com amostras físicas (L*a*b*/GU).
// Uso: node scripts/seed-films.mjs  (substitui o catálogo da organização)
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
  // 3M Wrap Film Series 2080 — Product Bulletin set/2024 (docs/catalogos-peliculas/3m-2080-bulletin.pdf)
  ["2080 Gloss Black", "3M Wrap Film Series 2080", "G12", "chrome_delete", "gloss", "#0e0f10", 85, 0, 0, 1800, 7],
  ["2080 Matte Deep Black", "3M Wrap Film Series 2080", "M22", "vinyl_wrap", "matte", "#1b1c1e", 10, 0, 0, 2800, 7],
  ["2080 Matte Blue Metallic", "3M Wrap Film Series 2080", "M227", "vinyl_wrap", "matte", "#1f3a5f", 12, 0.35, 0.5, 2900, 7],
  // Avery Dennison SW900 — swatch poster oficial (avery-sw900-catalogo-cores.pdf)
  ["SW900 Gloss Black", "Avery Dennison SW900", "SW900-190-O", "vinyl_wrap", "gloss", "#0d0e10", 85, 0, 0, 2950, 7],
  ["SW900 Gloss Dark Grey", "Avery Dennison SW900", "SW900-865-O", "vinyl_wrap", "gloss", "#4a4d50", 85, 0, 0, 2950, 7],
  ["SW900 Matte Black", "Avery Dennison SW900", "SW900-180-O", "vinyl_wrap", "matte", "#161718", 10, 0, 0, 2950, 7],
  ["SW900 Matte Metallic Anthracite", "Avery Dennison SW900", "SW900-858-M", "vinyl_wrap", "matte", "#2e3134", 14, 0.2, 0.3, 3050, 7],
  // XPEL — TDS oficiais xpel.com/product-specifications (10 anos)
  ["Ultimate Plus PPF", "XPEL", "UPSC", "clear_ppf_gloss", "gloss", "#c9cdd1", 92, 0, 0, 5500, 10],
  ["Stealth PPF", "XPEL", "STSC", "clear_ppf_matte", "matte", "#c9cdd1", 12, 0, 0, 6000, 10],
  // Stek — stekautomotive.com: DYNOshield 12 anos, DYNOmatte 10 anos
  ["DYNOshield", "Stek Automotive", "DYNS", "clear_ppf_gloss", "gloss", "#c9cdd1", 93, 0, 0, 4200, 12],
  ["DYNOmatte", "Stek Automotive", "DYNM", "clear_ppf_matte", "matte", "#282d30", 11, 0, 0, 4800, 10],
  // Inozetek — inozetek.com: wrap SuperGloss (MSG025, SG004) + INOcolor PPF DPPF (10 anos, gloss >85 GU)
  ["Super Gloss Metallic Midnight Purple", "Inozetek", "MSG025", "vinyl_wrap", "gloss", "#2f2140", 90, 0.55, 0.8, 3150, 7],
  ["Super Gloss Nardo Grey", "Inozetek", "SG004", "vinyl_wrap", "gloss", "#74797d", 90, 0, 0, 3150, 7],
  ["INOcolor Metallic Midnight Purple PPF", "Inozetek", "DPPF901", "color_ppf", "gloss", "#2f2140", 88, 0.55, 0.8, 5500, 10],
  ["INOcolor Frozen Matte Ultimate Grey PPF", "Inozetek", "DPPF809", "color_ppf", "matte", "#8d9196", 12, 0.15, 0.3, 5500, 10],
  // KPMF (ORAFOL) — kpmfvehiclewrap.com: K75320 Matt Anthracite Cast VWS IV
  ["Matt Anthracite Cast VWS IV", "KPMF", "K75320", "vinyl_wrap", "matte", "#2e3134", 14, 0.2, 0.3, 2900, 7],
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

// O catálogo oficial substitui o anterior (códigos/nomes corrigidos)
await client.query(`DELETE FROM films WHERE organization_id = $1`, [orgId]);

for (const f of FILMS) {
  const [name, brand, sku, type, finish, colorHex, gu, metallic, flake, cost, warranty] = f;
  await client.query(
    `INSERT INTO films
      (organization_id, name, brand, sku, type, finish, color_hex, gloss_gu, metallic, flake_scale,
       cost_per_meter_cents, warranty_years)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [orgId, name, brand, sku, type, finish, colorHex, gu, metallic, flake, cost, warranty]
  );
}

console.log(`Films: ${FILMS.length} inseridas a partir dos catálogos oficiais.`);
await client.end();
