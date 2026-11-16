import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "./config.js";
import { pool } from "./db.js";

async function main() {
  await pool.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      password_hash text NOT NULL,
      role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('gestor','usuario')),
      setor text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS setor text;
    UPDATE users SET setor = 'Não informado' WHERE setor IS NULL OR btrim(setor) = '';
    ALTER TABLE users ALTER COLUMN setor SET NOT NULL;
    CREATE TABLE IF NOT EXISTS sso_tickets (
      ticket_hash char(64) PRIMARY KEY,
      target_system text NOT NULL CHECK (target_system IN ('patrimonio', 'helpdesk')),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      is_used boolean NOT NULL DEFAULT false
    );
    CREATE INDEX IF NOT EXISTS sso_tickets_expires_at_idx ON sso_tickets (expires_at);
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      token_hash char(64) PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      used_at timestamptz
    );
    CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx
      ON password_reset_tokens (user_id);
    CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_at_idx
      ON password_reset_tokens (expires_at);
  `);

  const { rows } = await pool.query<{ total: number }>("SELECT count(*)::int AS total FROM users");
  if (rows[0].total === 0) {
    // Sem ADMIN_PASSWORD, gera uma senha aleatória e a exibe uma única vez no log
    const generated = !config.ADMIN_PASSWORD;
    const password = config.ADMIN_PASSWORD ?? randomBytes(12).toString("base64url");
    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, setor)
       VALUES ('Administrador', $1, $2, 'gestor', 'Não informado')`,
      [config.ADMIN_EMAIL.toLowerCase(), hash],
    );
    console.log(`Usuário admin criado: ${config.ADMIN_EMAIL}`);
    if (generated) console.log(`Senha temporária (troque após o primeiro acesso): ${password}`);
  }

  console.log("Migração concluída.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
