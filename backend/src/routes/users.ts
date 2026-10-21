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
    role: z.enum(["gestor", "usuario"]),
    active: z.boolean(),
    password: z.string().min(8).max(128),
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

  app.patch("/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    const data = updateSchema.parse(req.body);

    if (id === req.user.sub && (data.role === "usuario" || data.active === false)) {
      return reply.code(400).send({ error: "Você não pode rebaixar ou desativar a si mesmo." });
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    const add = (col: string, val: unknown) => {
      values.push(val);
      sets.push(`${col} = $${values.length}`);
    };
    if (data.name !== undefined) add("name", data.name);
    if (data.role !== undefined) add("role", data.role);
    if (data.active !== undefined) add("active", data.active);
    if (data.password !== undefined) add("password_hash", await bcrypt.hash(data.password, 12));
    if (sets.length === 0) return reply.code(400).send({ error: "Nada para atualizar." });

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${columns}`,
      values,
    );
    if (!rows[0]) return reply.code(404).send({ error: "Usuário não encontrado." });
    return { user: rows[0] };
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = idParam.parse(req.params);
    if (id === req.user.sub) {
      return reply.code(400).send({ error: "Você não pode excluir a si mesmo." });
    }
    const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [id]);
    if (!rowCount) return reply.code(404).send({ error: "Usuário não encontrado." });
    return reply.code(204).send();
  });
};
