import { Pool, type PoolClient } from "pg";

export type Db = Pick<Pool, "query"> & {
  connect: () => Promise<PoolClient>;
};

const BOOTSTRAP_ORG_SLUG = "x-motion";

export async function restoreBootstrapOrg(client: PoolClient): Promise<void> {
  await client.query(
    `SELECT set_config('app.bootstrap_org_slug', '${BOOTSTRAP_ORG_SLUG}', false);
     SELECT set_config('app.current_organization_id', organizations.id::text, false)
     FROM organizations
     WHERE slug = current_setting('app.bootstrap_org_slug');`
  );
}

let pool: Pool | null = null;
const bootstrapReady = new WeakMap<PoolClient, Promise<void>>();

function appConnectionString(): string | undefined {
  return process.env.DATABASE_URL_APP || process.env.DATABASE_URL;
}

/**
 * Espera que o bootstrap da organização (feito no evento "connect" do pool)
 * termine antes de reutilizar o cliente. Evita queries concorrentes no mesmo
 * cliente quando uma operação precisa de abrir uma transação.
 */
export async function waitForBootstrap(client: PoolClient): Promise<void> {
  await bootstrapReady.get(client);
}

export function getDb(): Db {
  if (!pool) {
    const connectionString = appConnectionString();
    if (!connectionString) {
      throw new Error("DATABASE_URL não está configurado (.env.local).");
    }
    if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL_APP) {
      throw new Error(
        "DATABASE_URL_APP em falta em produção — a app tem de ligar como role não-owner (xflow_app) com RLS efetiva. Corre node scripts/create-db-role.mjs."
      );
    }
    pool = new Pool({ connectionString, max: 8 });
    if (process.env.DATABASE_URL_APP) {
      pool.on("connect", (client) => {
        bootstrapReady.set(
          client,
          restoreBootstrapOrg(client).catch(() => undefined)
        );
      });
    }
  }
  return pool;
}
