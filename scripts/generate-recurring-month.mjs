// Gera movimentos de rubricas recorrentes para um mês (idempotente por period_key).
// Mesma lógica de generateDueRecurring() em src/server/treasury.ts.
// Uso: node scripts/generate-recurring-month.mjs [YYYY-MM] [organization_id]
import pg from "pg";
import fs from "node:fs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const now = new Date();
const [year, month] = (process.argv[2] ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`)
  .split("-")
  .map(Number);

const client = new pg.Client({ connectionString: url });
await client.connect();

let orgId = process.argv[3];
if (!orgId) {
  const { rows } = await client.query("SELECT id FROM organizations ORDER BY created_at LIMIT 1");
  orgId = rows[0].id;
}

const { rows: rules } = await client.query(
  "SELECT id, day_of_month FROM recurring_rules WHERE organization_id = $1 AND active = TRUE",
  [orgId]
);

let generated = 0;
for (const rule of rules) {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(rule.day_of_month, lastDay);
  const occurredAt = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const periodKey = `${year}-${String(month).padStart(2, "0")}`;
  const res = await client.query(
    `INSERT INTO transactions
      (organization_id, type, occurred_at, amount, category_id, bank_account_id, description,
       payment_method, vat_amount, source_type, source_id, recurring_rule_id, period_key)
     SELECT $1, r.type, $2, r.amount, r.category_id, NULL, r.name, 'bank_transfer', 0,
            'recurring', r.id, r.id, $3::text
     FROM recurring_rules r WHERE r.id = $4
       AND NOT EXISTS (
         SELECT 1 FROM transactions t
         WHERE t.recurring_rule_id = r.id AND t.period_key = $3::text
       )`,
    [orgId, occurredAt, periodKey, rule.id]
  );
  generated += res.rowCount ?? 0;
}

console.log(`GERADOS ${periodKey(orgId)}:`, generated);
await client.end();

function periodKey(id) {
  void id;
  return `${year}-${String(month).padStart(2, "0")}`;
}
