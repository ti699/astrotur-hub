import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { pool } from "../db.js";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "A confirmação da nova senha não confere.",
    path: ["confirmPassword"],
  });

const profileColumns = "id, name, email, role, active, created_at";

export const meRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (req, reply) => {
    const { rows } = await pool.query(`SELECT ${profileColumns} FROM users WHERE id = $1`, [
      req.user.sub,
    ]);
    if (!rows[0]) return reply.code(404).send({ error: "Usuário não encontrado." });
    return { user: rows[0] };
  });

  app.put("/profile", async (req, reply) => {
    const data = profileSchema.parse(req.body);
    try {
      const { rows } = await pool.query(
        `UPDATE users SET name = $1, email = $2 WHERE id = $3
         RETURNING ${profileColumns}`,
        [data.name, data.email, req.user.sub],
      );
      if (!rows[0]) return reply.code(404).send({ error: "Usuário não encontrado." });
      return { user: rows[0] };
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        return reply.code(409).send({ error: "E-mail já cadastrado no sistema." });
      }
      throw error;
    }
  });

  app.put("/password", async (req, reply) => {
    const data = passwordSchema.parse(req.body);
    const { rows } = await pool.query<{ password_hash: string }>(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.user.sub],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(data.currentPassword, user.password_hash))) {
      return reply.code(400).send({ error: "A senha atual está incorreta." });
    }

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      await bcrypt.hash(data.newPassword, 12),
      req.user.sub,
    ]);
    return { message: "Senha alterada com sucesso." };
  });
};
