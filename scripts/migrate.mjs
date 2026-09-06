// Aplica migrações estruturais pendentes (idempotente por deteção de colunas)
// Uso: node scripts/migrate.mjs
import pg from "pg";
import fs from "node:fs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const client = new pg.Client({ connectionString: url });
await client.connect();

const migration13 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000013_employees_absences.sql", import.meta.url),
  "utf8"
);

const migration14 = fs.readFileSync(
  new URL("../supabase/migrations/20260828000014_checkin_photos_damages.sql", import.meta.url),
  "utf8"
);

const hasColumn = async (table, column) => {
  const r = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2`,
    [table, column]
  );
  return r.rows[0].n > 0;
};

const hasTable = async (table) => {
  const r = await client.query(
    `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return r.rows[0].n > 0;
};

// 000013 — employees.email/phone + employee_absences
if (!(await hasColumn("employees", "email")) || !(await hasTable("employee_absences"))) {
  await client.query(migration13);
  console.log("OK: 20260828000013");
} else {
  console.log("20260828000013 já aplicada.");
}

// 000014 — checkin_damages.photo_id + checkins.belongings + CHECK de angles
if (!(await hasColumn("checkin_damages", "photo_id")) || !(await hasColumn("checkins", "belongings"))) {
  await client.query(migration14);
  console.log("OK: 20260828000014");
} else {
  console.log("20260828000014 já aplicada.");
}

await client.end();
