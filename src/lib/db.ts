import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL não está configurado (.env.local).");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
