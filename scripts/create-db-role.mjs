import pg from "pg";
import fs from "node:fs";
import { randomBytes } from "node:crypto";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  (() => {
    try {
      return fs
        .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
        .match(/DATABASE_URL="(.+)"/)?.[1];
    } catch {
      return undefined;
    }
  })();

if (!DATABASE_URL) {
  console.error("ERRO: DATABASE_URL em falta (.env.local ou env var).");
  process.exit(1);
}

const ownerUrl = new URL(DATABASE_URL);
const ownerRole = decodeURIComponent(ownerUrl.username);
const quoteIdent = (name) => `"${name.replace(/"/g, '""')}"`;

const password = process.env.XFLOW_APP_DB_PASSWORD || randomBytes(24).toString("base64url");
const escapedPassword = password.replace(/'/g, "''");

const client = new pg.Client({ connectionString: DATABASE_URL });
await client.connect();

const roleExists = await client.query("SELECT 1 FROM pg_roles WHERE rolname = 'xflow_app'");
if (roleExists.rowCount === 0) {
  await client.query(`CREATE ROLE xflow_app LOGIN PASSWORD '${escapedPassword}'`);
} else {
  await client.query(`ALTER ROLE xflow_app WITH LOGIN PASSWORD '${escapedPassword}'`);
}

await client.query("GRANT USAGE ON SCHEMA public TO xflow_app");
await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO xflow_app");
await client.query("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO xflow_app");
await client.query(
  `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdent(ownerRole)} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO xflow_app`
);
await client.query(
  `ALTER DEFAULT PRIVILEGES FOR ROLE ${quoteIdent(ownerRole)} IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO xflow_app`
);

await client.end();

const directHost = ownerUrl.hostname.replace("-pooler.", ".");
const port = ownerUrl.port ? `:${ownerUrl.port}` : "";
const appUrl = `postgres://xflow_app:${encodeURIComponent(password)}@${directHost}${port}${ownerUrl.pathname}${ownerUrl.search}`;

const envPath = new URL("../.env.local", import.meta.url);
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf8");
} catch {
  envContent = "";
}
const line = `DATABASE_URL_APP="${appUrl}"`;
if (/^DATABASE_URL_APP=.*$/m.test(envContent)) {
  envContent = envContent.replace(/^DATABASE_URL_APP=.*$/m, line);
} else {
  envContent = envContent.replace(/\s*$/, "") + "\n" + line + "\n";
}
fs.writeFileSync(envPath, envContent);

console.log("OK: role xflow_app criada e DATABASE_URL_APP gravado em .env.local (ligação direta, sem pooler).");
