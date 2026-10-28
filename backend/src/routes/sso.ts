import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { pool } from "../db.js";

const ticketRequestSchema = z.object({
  target_system: z.enum(["patrimonio", "helpdesk"]),
});

const validateRequestSchema = z.object({
  ticket: z.string().min(1),
  client_secret: z.string().min(1),
});

type TargetSystem = z.infer<typeof ticketRequestSchema>["target_system"];

function getTargetForSecret(secret: string): TargetSystem | null {
  const configuredSecrets: Array<[TargetSystem, string | undefined]> = [
    ["patrimonio", config.PATRIMONIO_SSO_CLIENT_SECRET],
    ["helpdesk", config.HELPDESK_SSO_CLIENT_SECRET],
  ];

  for (const [target, expected] of configuredSecrets) {
    if (!expected) continue;
    const providedBuffer = Buffer.from(secret);
    const expectedBuffer = Buffer.from(expected);
    if (
      providedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      return target;
    }
  }
  return null;
}

export async function ssoRoutes(fastify: FastifyInstance) {
  fastify.post(
    "/ticket",
    { preHandler: fastify.authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = ticketRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Sistema de destino inválido." });
      }

      const target = parsed.data.target_system;
      const clientSecret =
        target === "patrimonio"
          ? config.PATRIMONIO_SSO_CLIENT_SECRET
          : config.HELPDESK_SSO_CLIENT_SECRET;
      if (!clientSecret) {
        return reply.status(503).send({ message: "SSO não está configurado para esse sistema." });
      }

      await pool.query("DELETE FROM sso_tickets WHERE expires_at <= now() OR is_used = true");
      const ticket = `sso_tkt_${randomBytes(32).toString("base64url")}`;
      const ticketHash = createHash("sha256").update(ticket).digest("hex");
      const result = await pool.query<{ ticket_hash: string }>(
        `INSERT INTO sso_tickets (ticket_hash, target_system, user_id, expires_at)
         SELECT $1, $2, id, now() + interval '60 seconds'
         FROM users
         WHERE id = $3 AND active = true
         RETURNING ticket_hash`,
        [ticketHash, target, request.user.sub],
      );

      if (result.rows.length === 0) {
        return reply.status(401).send({ message: "Sessão inválida ou usuário inativo." });
      }

      return reply.send({ ticket, expires_in: 60 });
    },
  );

  fastify.post("/validate", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = validateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ valid: false, message: "Dados de validação inválidos." });
    }

    const target = getTargetForSecret(parsed.data.client_secret);
    if (!target) {
      return reply.status(401).send({ valid: false, message: "Credenciais inválidas." });
    }

    const ticketHash = createHash("sha256").update(parsed.data.ticket).digest("hex");
    const result = await pool.query<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>(
      `WITH consumed AS (
         UPDATE sso_tickets
         SET is_used = true
         WHERE ticket_hash = $1
           AND target_system = $2
           AND is_used = false
           AND expires_at > now()
         RETURNING user_id
       )
       SELECT users.id, users.name, users.email, users.role
       FROM consumed
       JOIN users ON users.id = consumed.user_id
       WHERE users.active = true`,
      [ticketHash, target],
    );

    const user = result.rows[0];
    if (!user) {
      return reply.status(401).send({ valid: false, message: "Ticket inválido ou expirado." });
    }

    return reply.send({ valid: true, user });
  });
}
