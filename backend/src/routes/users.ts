import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db.js";

const idParam = z.object({ id: z.string().uuid() });

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["gestor", "usuario"]).default("usuario"),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email(),
    is_active: z.boolean(),
  })
  .partial();

const columns = "id, name, email, role, active, created_at";

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireGestor);

  app.get("/", async () => {
    const { rows } = await pool.query(`SELECT ${columns} FROM users ORDER BY created_at DESC`);
    return { users: rows };
  });

  app.post("/", async (req, reply) => {
    const { name, email, password, role } = createSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING ${columns}`,
        [name, email, hash, role],
      );
      return reply.code(201).send({ user: rows[0] });
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "E-mail já cadastrado." });
      }
      throw err;
    }
  });

  app.put("/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const data = updateSchema.parse(req.body);

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };
    if (data.name !== undefined) add("name", data.name);
    if (data.email !== undefined) add("email", data.email);
    if (data.is_active !== undefined) add("active", data.is_active);
    if (sets.length === 0) return reply.code(400).send({ error: "Nada para atualizar." });

    values.push(id);
    let rows;
    try {
      ({ rows } = await pool.query(
        `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${columns}`,
        values,
      ));
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "E-mail já cadastrado." });
      }
      throw error;
    }
    if (!rows[0]) return reply.code(404).send({ error: "Usuário não encontrado." });
    return { user: rows[0] };
  });

  app.patch("/:id/role", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const { role } = z.object({ role: z.enum(["gestor", "usuario"]) }).parse(req.body);

    if (id === req.user.sub && role === "usuario") {
      const { rows } = await pool.query<{ total: number }>(
        "SELECT count(*)::int AS total FROM users WHERE role = 'gestor' AND active = true",
      );
      if ((rows[0]?.total ?? 0) <= 1) {
        return reply.code(400).send({ error: "Não é possível rebaixar o único gestor ativo." });
      }
    }

    const { rows } = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING ${columns}`,
      [role, id],
    );
    if (!rows[0]) return reply.code(404).send({ error: "Usuário não encontrado." });
    return { user: rows[0] };
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (id === req.user.sub) return reply.code(400).send({ error: "Você não pode excluir a si mesmo." });
    const { rowCount } = await pool.query("UPDATE users SET active = false WHERE id = $1", [id]);
    if (!rowCount) return reply.code(404).send({ error: "Usuário não encontrado." });
    return reply.code(204).send();
  });
};
