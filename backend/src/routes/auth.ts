import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool, type UserRow } from "../db.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

export function publicUser(u: Pick<UserRow, "id" | "name" | "email" | "role">) {
  return { id: u.id, email: u.email, role: u.role, name: u.name };
}

// Hash fictício para equalizar o tempo de resposta quando o e-mail não existe
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 12);

export const authRoutes: FastifyPluginAsync = async (app) => {
  const strictLimit = { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } };

  app.post("/login", strictLimit, async (req, reply) => {
    const { email, password } = loginSchema.parse(req.body);
    const { rows } = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !ok || !user.active) {
      return reply.code(401).send({ error: "E-mail ou senha inválidos." });
    }
    const token = app.jwt.sign({ sub: user.id, role: user.role });
    return { token, user: publicUser(user) };
  });

  // /cadastro é a rota oficial; /register permanece como alias
  app.post("/cadastro", strictLimit, registerHandler);
  app.post("/register", strictLimit, registerHandler);

  async function registerHandler(req: FastifyRequest, reply: FastifyReply) {
    const { name, email, password } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    try {
      const { rows } = await pool.query<UserRow>(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'usuario') RETURNING *`,
        [name, email, hash],
      );
      const user = rows[0];
      const token = app.jwt.sign({ sub: user.id, role: user.role });
      return reply.code(201).send({ token, user: publicUser(user) });
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "E-mail já cadastrado." });
      }
      throw err;
    }
  }

  app.get("/me", { preHandler: app.authenticate }, async (req, reply) => {
    const { rows } = await pool.query<UserRow>(
      "SELECT * FROM users WHERE id = $1 AND active = true",
      [req.user.sub],
    );
    if (!rows[0]) return reply.code(401).send({ error: "Usuário inválido." });
    return { user: publicUser(rows[0]) };
  });
};
