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

const client = new pg.Client({ connectionString: url });
await client.connect();
const hash = await hashPassword(password);
await client.query("UPDATE profiles SET password_hash = $1 WHERE lower(email) = $2", [
  hash,
  email.toLowerCase(),
]);
const { rows } = await client.query("SELECT password_hash FROM profiles WHERE lower(email) = $1", [
  email.toLowerCase(),
]);
const ok = rows[0] && (await verifyPassword(password, rows[0].password_hash));
console.log(ok ? `OK: password atualizada para ${email}` : "ERRO: verificação falhou");
await client.end();
process.exit(ok ? 0 : 1);
