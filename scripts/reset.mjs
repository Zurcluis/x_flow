// Reset: truncate de todas as tabelas públicas (cuidado em produção!)
// Uso: node scripts/reset.mjs && node scripts/seed.mjs
import pg from "pg";
import fs from "node:fs";

const url =
  process.env.DATABASE_URL ||
  fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/DATABASE_URL="(.+)"/)?.[1];

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query(`DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname='public') LOOP
    EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
  END LOOP; END $$;`);
console.log("Todas as tabelas truncadas.");
await client.end();
