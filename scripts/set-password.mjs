import pg from "pg";
import fs from "node:fs";
import { hashPassword, verifyPassword } from "./auth-crypto.mjs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const email = process.argv[2];
const password = process.env.XFLOW_PASSWORD;
if (!email || !password) {
  console.error("Uso: node scripts/set-password.mjs <email>  (password via env XFLOW_PASSWORD)");
  process.exit(1);
}
if (password.length < 12) {
  console.error("ERRO: a password tem de ter pelo menos 12 caracteres.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const hash = await hashPassword(password);
const { rows } = await client.query(
  `UPDATE profiles
   SET password_hash = $1, must_change_password = FALSE, updated_at = NOW()
   WHERE lower(email) = $2
   RETURNING id, password_hash`,
  [hash, email.toLowerCase()]
);
if (!rows[0]) {
  console.error(`ERRO: perfil ${email} não encontrado.`);
  await client.end();
  process.exit(1);
}
await client.query(
  "UPDATE auth_sessions SET revoked_at = NOW() WHERE profile_id = $1 AND revoked_at IS NULL",
  [rows[0].id]
);
const ok = await verifyPassword(password, rows[0].password_hash);
console.log(
  ok
    ? `OK: password atualizada para ${email}; sessões antigas revogadas.`
    : "ERRO: verificação falhou"
);
await client.end();
process.exit(ok ? 0 : 1);
