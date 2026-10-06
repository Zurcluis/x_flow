// Provisiona o núcleo de tesouraria (categorias, contas, rubricas recorrentes)
// para uma organização existente — espelha ensureDefaultCategories() de
// src/server/treasury.ts. Idempotente: INSERT ... ON CONFLICT DO NOTHING.
// Uso: node scripts/seed-treasury-defaults.mjs [organization_id]
import pg from "pg";
import fs from "node:fs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const client = new pg.Client({ connectionString: url });
await client.connect();

const orgs = await client.query("SELECT id, name FROM organizations ORDER BY created_at");
if (orgs.rows.length === 0) {
  console.error("Nenhuma organização encontrada.");
  process.exit(1);
}
const orgId = process.argv[2] ?? orgs.rows[0].id;
const org = orgs.rows.find((r) => r.id === orgId);
console.log(`ORG: ${org?.name ?? "?"} (${orgId})`);

const CATEGORIES = [
  ["Cobrança de faturas", "other", false],
  ["Receitas avulsas", "other", false],
  ["Renda do pavilhão", "rent", true],
  ["Salários e ordenados", "payroll", true],
  ["Segurança Social", "payroll", true],
  ["Contabilidade", "operational", true],
  ["Seguros", "operational", true],
  ["Luz", "operational", true],
  ["Água", "operational", true],
  ["Limpeza", "operational", true],
  ["Marketing", "marketing", true],
  ["Acordo de transição", "other", true],
  ["Consumíveis e materiais", "supplier", false],
  ["Ferramentas e equipamento", "supplier", false],
  ["Combustível e deslocações", "operational", false],
  ["Serviços subcontratados", "supplier", false],
  ["Impostos — IVA", "tax", true],
  ["Impostos — Segurança Social", "tax", true],
  ["Impostos — IRC", "tax", true],
  ["Outros", "other", false],
];

for (const [name, kind, isRecurring] of CATEGORIES) {
  await client.query(
    `INSERT INTO transaction_categories (organization_id, name, kind, is_recurring)
     VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id, name) DO NOTHING`,
    [orgId, name, kind, isRecurring]
  );
}

await client.query(
  `INSERT INTO bank_accounts (organization_id, name, iban, bic, kind)
   VALUES ($1,'Millennium BCP','PT50.0036.0096.99100129889.26','MPIOPTPL','bank')
   ON CONFLICT (organization_id, name) DO NOTHING`,
  [orgId]
);
await client.query(
  `INSERT INTO bank_accounts (organization_id, name, kind)
   VALUES ($1,'Caixa','cash') ON CONFLICT (organization_id, name) DO NOTHING`,
  [orgId]
);

const { rows: categoryRows } = await client.query(
  "SELECT id, name FROM transaction_categories WHERE organization_id = $1",
  [orgId]
);
const byName = new Map(categoryRows.map((r) => [r.name, r.id]));

const RULES = [
  ["Renda do pavilhão", "Renda do pavilhão", "630.74", 1, null],
  [
    "Acordo de transição — a formalizar",
    "Acordo de transição",
    "833.33",
    5,
    "Acordo verbal ativo, por formalizar (20.000 € em 24 meses).",
  ],
  ["Marketing", "Marketing", "500.00", 5, null],
  ["Contabilidade externa", "Contabilidade", "170.73", 10, null],
  ["Seguro", "Seguros", "80.00", 10, null],
  ["Multirriscos", "Seguros", "33.83", 10, null],
  ["Luz", "Luz", "81.30", 15, null],
  ["Água", "Água", "65.04", 15, null],
  ["Limpeza", "Limpeza", "56.91", 15, null],
];

const { rows: existingRules } = await client.query(
  "SELECT name FROM recurring_rules WHERE organization_id = $1",
  [orgId]
);
const have = new Set(existingRules.map((r) => r.name));
for (const [name, category, amount, dayOfMonth, notes] of RULES) {
  if (have.has(name)) continue;
  await client.query(
    `INSERT INTO recurring_rules (organization_id, name, category_id, type, amount, frequency, day_of_month, notes)
     VALUES ($1,$2,$3,'expense',$4,'monthly',$5,$6)`,
    [orgId, name, byName.get(category) ?? null, amount, dayOfMonth, notes]
  );
}

const { rows: catCount } = await client.query(
  "SELECT count(*)::int AS n FROM transaction_categories WHERE organization_id = $1",
  [orgId]
);
const { rows: accCount } = await client.query(
  "SELECT count(*)::int AS n FROM bank_accounts WHERE organization_id = $1",
  [orgId]
);
const { rows: recCount } = await client.query(
  "SELECT count(*)::int AS n FROM recurring_rules WHERE organization_id = $1",
  [orgId]
);
console.log(`CATEGORIAS: ${catCount[0].n} | CONTAS: ${accCount[0].n} | RECORRENTES: ${recCount[0].n}`);

await client.end();
