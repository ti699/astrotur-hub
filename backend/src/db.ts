import pg from "pg";
import { config } from "./config.js";

export type Role = "gestor" | "usuario";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  active: boolean;
  created_at: Date;
}

export interface Db {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>;
  exec(sql: string): Promise<void>;
  end(): Promise<void>;
}

async function createDb(): Promise<Db> {
  // Desenvolvimento local sem servidor: DATABASE_URL=pglite://./.data
  if (config.DATABASE_URL.startsWith("pglite://")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const db = new PGlite(config.DATABASE_URL.slice("pglite://".length));
    await db.waitReady;
    return {
      async query(text, params) {
        const r = await db.query(text, params);
        return { rows: r.rows as never[], rowCount: r.affectedRows ?? r.rows.length };
      },
      async exec(sql) {
        await db.exec(sql);
      },
      end: () => db.close(),
    };
  }

  const pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  return {
    async query(text, params) {
      const r = await pool.query(text, params as unknown[]);
      return { rows: r.rows, rowCount: r.rowCount };
    },
    async exec(sql) {
      await pool.query(sql);
    },
    end: () => pool.end(),
  };
}

export const pool: Db = await createDb();
