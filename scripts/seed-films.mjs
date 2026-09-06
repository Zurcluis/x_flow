// Seed do catálogo de películas (tabela films).
// Fonte: docs/catalogos-peliculas/ (TDS oficiais) + scripts/catalog-data/ (extração automática
// dos PDFs oficiais, ex.: scripts/parse-3m-catalog.mjs sobre public/catalogos/3M.pdf).
// Uso: node scripts/seed-films.mjs  (substitui o catálogo da organização)
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

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

const GU = { gloss: 85, satin: 30, matte: 12, carbon: 20 };
const COST = { gloss: 2500, satin: 2800, matte: 2800, carbon: 3800 };

function filmRow({ name, brand, sku, type, finish, colorHex, glossGu, metallic, flakeScale, costPerMeterCents, warrantyYears }) {
  return [
    name, brand, sku, type, finish, colorHex,
    glossGu ?? GU[finish] ?? 85,
    metallic ?? 0,
    flakeScale ?? 0,
    costPerMeterCents ?? COST[finish] ?? 2500,
    warrantyYears ?? 7,
  ];
}

// — 3M 1080: extração automática do colour card oficial (scripts/catalog-data/3m-1080.json)
const catalogDir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "catalog-data");
const m3 = JSON.parse(fs.readFileSync(path.join(catalogDir, "3m-1080.json"), "utf8"));
const films3m = m3.map((f) =>
  filmRow({
    name: f.name,
    brand: "3M Wrap Film Series 1080",
    sku: f.code,
    type: "vinyl_wrap",
    finish: f.finish,
    colorHex: f.hex,
    metallic: /metallic|sparkle|flip|chrome/i.test(f.name) ? 0.35 : 0,
    flakeScale: /sparkle|flip/i.test(f.name) ? 0.6 : 0,
  })
);

// — Avery Dennison Supreme Wrapping Film: extração automática da colour card 2026
const avery = JSON.parse(fs.readFileSync(path.join(catalogDir, "avery-sw900.json"), "utf8"));
const GU_AVERY = { gloss: 85, satin: 30, matte: 12 };
// brand+name é único na BD: desambigua nomes repetidos com o acabamento e, se necessário, o código
const nameCounts = new Map();
for (const f of avery) nameCounts.set(f.name, (nameCounts.get(f.name) ?? 0) + 1);
const averySeen = new Map();
const filmsAvery = avery.map((f) => {
  let name = f.name;
  if ((nameCounts.get(name) ?? 0) > 1) name = `${f.name} (${f.finishLabel})`;
  averySeen.set(name, (averySeen.get(name) ?? 0) + 1);
  if ((averySeen.get(name) ?? 0) > 1) name = `${name} ${f.code.slice(-4)}`;
  return filmRow({
    name,
    brand: "Avery Dennison Supreme Wrapping Film",
    sku: f.code,
    type: "vinyl_wrap",
    finish: f.finish,
    colorHex: f.hex,
    glossGu: GU_AVERY[f.finish],
    metallic: /metallic|pearl|diamond/i.test(f.finishLabel) ? 0.35 : 0,
    flakeScale: /metallic|pearl|diamond/i.test(f.finishLabel) ? 0.5 : 0,
  });
});

// — Demais marcas: dados verificados nos TDS oficiais (docs/catalogos-peliculas/)
const curated = [
  // XPEL — TDS oficiais (10 anos)
  { name: "Ultimate Plus PPF", brand: "XPEL", sku: "UPSC", type: "clear_ppf_gloss", finish: "gloss", colorHex: "#c9cdd1", glossGu: 92, costPerMeterCents: 5500, warrantyYears: 10 },
  { name: "Stealth PPF", brand: "XPEL", sku: "STSC", type: "clear_ppf_matte", finish: "matte", colorHex: "#c9cdd1", glossGu: 12, costPerMeterCents: 6000, warrantyYears: 10 },
  // Stek — site oficial (DYNOshield 12 anos)
  { name: "DYNOshield", brand: "Stek Automotive", sku: "DYNS", type: "clear_ppf_gloss", finish: "gloss", colorHex: "#c9cdd1", glossGu: 93, costPerMeterCents: 4200, warrantyYears: 12 },
  { name: "DYNOmatte", brand: "Stek Automotive", sku: "DYNM", type: "clear_ppf_matte", finish: "matte", colorHex: "#282d30", glossGu: 11, costPerMeterCents: 4800, warrantyYears: 10 },
  // Inozetek — inozetek.com (wrap 7 anos; INOcolor PPF 10 anos, gloss >85 GU)
  { name: "Super Gloss Metallic Midnight Purple", brand: "Inozetek", sku: "MSG025", type: "vinyl_wrap", finish: "gloss", colorHex: "#2f2140", glossGu: 90, metallic: 0.55, flakeScale: 0.8, costPerMeterCents: 3150, warrantyYears: 7 },
  { name: "Super Gloss Nardo Grey", brand: "Inozetek", sku: "SG004", type: "vinyl_wrap", finish: "gloss", colorHex: "#74797d", glossGu: 90, costPerMeterCents: 3150, warrantyYears: 7 },
  { name: "INOcolor Metallic Midnight Purple PPF", brand: "Inozetek", sku: "DPPF901", type: "color_ppf", finish: "gloss", colorHex: "#2f2140", glossGu: 88, metallic: 0.55, flakeScale: 0.8, costPerMeterCents: 5500, warrantyYears: 10 },
  { name: "INOcolor Frozen Matte Ultimate Grey PPF", brand: "Inozetek", sku: "DPPF809", type: "color_ppf", finish: "matte", colorHex: "#8d9196", glossGu: 12, metallic: 0.15, flakeScale: 0.3, costPerMeterCents: 5500, warrantyYears: 10 },
  // KPMF (ORAFOL) — kpmfvehiclewrap.com
  { name: "Matt Anthracite Cast VWS IV", brand: "KPMF", sku: "K75320", type: "vinyl_wrap", finish: "matte", colorHex: "#2e3134", glossGu: 14, metallic: 0.2, flakeScale: 0.3, costPerMeterCents: 2900, warrantyYears: 7 },
];

const FILMS = [...films3m, ...filmsAvery, ...curated.map(filmRow)];

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
  await client.query(
    `INSERT INTO films
      (organization_id, name, brand, sku, type, finish, color_hex, gloss_gu, metallic, flake_scale,
       cost_per_meter_cents, warranty_years)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [orgId, ...f]
  );
}

console.log(`Films: ${FILMS.length} inseridas (${films3m.length} 3M 1080 + ${filmsAvery.length} Avery SWF + ${curated.length} curadas).`);
await client.end();
