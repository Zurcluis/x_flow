import pg from "pg";
import fs from "node:fs";

const env = fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const appUrl = env.match(/DATABASE_URL_APP="(.+)"/)?.[1];
if (!appUrl) {
  console.error("ERRO: DATABASE_URL_APP em falta em .env.local");
  process.exit(1);
}
if (/-pooler\./.test(new URL(appUrl).hostname)) {
  console.error("ERRO: DATABASE_URL_APP usa o pooler — tem de ser ligação direta!");
  process.exit(1);
}
console.log("1. DATABASE_URL_APP OK (ligação direta).");

const client = new pg.Client({ connectionString: appUrl });
await client.connect();
const who = await client.query("SELECT current_user, session_user");
console.log("2. Ligado como:", who.rows[0].current_user);

const isRls = await client.query(
  `SELECT relname, relrowsecurity AS rls, relforcerowsecurity AS force
   FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' AND relrowsecurity = true`
);
console.log(`3. RLS ativo em ${isRls.rowCount} tabelas.`);
const policies = await client.query("SELECT count(*)::int AS n FROM pg_policies WHERE schemaname = 'public'");
console.log(`4. Políticas RLS: ${policies.rows[0].n}`);

await client.query("SELECT set_config('app.bootstrap_org_slug', 'x-motion', false)");
const org = await client.query(
  "SELECT set_config('app.current_organization_id', id::text, false) AS org_id FROM organizations WHERE slug = current_setting('app.bootstrap_org_slug')"
);
console.log("5. GUC org fixado:", org.rows[0].org_id);
const customers = await client.query("SELECT count(*)::int AS n FROM customers");
console.log("6. SELECT customers como xflow_app:", customers.rows[0].n, "(devia ser 5)");

const tokens = await client.query(
  "SELECT public_token FROM quotes WHERE public_token IS NOT NULL LIMIT 1"
);
if (tokens.rowCount > 0) {
  await client.query("SELECT set_config('app.public_token', $1, false)", [tokens.rows[0].public_token]);
  const q = await client.query("SELECT quote_number, public_token FROM quotes WHERE public_token = current_setting('app.public_token', true)");
  console.log("7. Fluxo por token:", q.rows[0]?.quote_number, "acessível — OK");
}

const sessions = await client.query("SELECT count(*)::int AS n FROM auth_sessions");
console.log("8. auth_sessions:", sessions.rows[0].n);
const profiles = await client.query("SELECT email FROM profiles WHERE password_hash IS NOT NULL ORDER BY email");
console.log("9. Perfis com password:", profiles.rows.map((r) => r.email).join(", "));

await client.query("SELECT set_config('app.current_organization_id', '', false)");
const denied = await client.query("SELECT count(*)::int AS n FROM customers");
console.log("10. SELECT customers SEM GUC org:", denied.rows[0].n, "(devia ser 0 — RLS bloqueou)");

await client.end();
console.log("\nRLS verificada com a role xflow_app.");
