import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { z } from "zod";
import { config } from "../config.js";
import { pool } from "../db.js";
import { syncUserFromHub } from "../user-sync.js";

const resetRequestSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(8).max(128),
});

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordResetMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD } = config;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !config.SMTP_FROM || !config.FRONTEND_URL) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

export async function authRoutes(fastify: FastifyInstance) {
  // 1. Rota de Login (URL final: /api/auth/login)
  fastify.post("/login", async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    try {
      const { rows } = await pool.query(
        "SELECT id, name, email, password_hash, role, setor FROM users WHERE LOWER(email) = LOWER($1) AND active = true",
        [email],
      );

      const user = rows[0];
      if (!user) {
        return reply.status(401).send({ message: "Credenciais inválidas." });
      }

      const passwordValid = await bcrypt.compare(password, user.password_hash);
      if (!passwordValid) {
        return reply.status(401).send({ message: "Credenciais inválidas." });
      }

      // Emite o JWT contendo sub, name, email e role
      const token = fastify.jwt.sign({
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          setor: user.setor,
        },
      });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro interno no servidor ao realizar login." });
    }
  });

  // 2. Rota de Cadastro (URL final: /api/auth/cadastro)
  fastify.post("/cadastro", async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, email, password, setor } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      setor?: string;
    };

    if (
      !name ||
      !email ||
      !password ||
      typeof setor !== "string" ||
      !setor.trim() ||
      setor.trim().length > 120
    ) {
      return reply.status(400).send({ message: "Nome, e-mail, senha e setor são obrigatórios." });
    }

    try {
      const { rows: existing } = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [email],
      );

      if (existing.length > 0) {
        return reply.status(400).send({ message: "E-mail já cadastrado no sistema." });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      // Regra de atribuição automática do perfil master para o e-mail de TI
      const defaultRole = "usuario";

      const { rows } = await pool.query(
        "INSERT INTO users (name, email, password_hash, role, setor) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, setor",
        [name, email, passwordHash, defaultRole, setor.trim()],
      );

      const newUser = rows[0];
      syncUserFromHub(newUser, req.log);

      const token = fastify.jwt.sign({
        sub: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });

      return reply.status(201).send({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          setor: newUser.setor,
        },
      });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao criar conta." });
    }
  });

  fastify.post(
    "/password-reset/request",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const parsed = resetRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Informe um e-mail válido." });
      }

      const mailer = passwordResetMailer();
      if (!mailer) {
        req.log.error(
          "Recuperação de senha indisponível: SMTP_HOST, SMTP_USER, SMTP_PASSWORD, SMTP_FROM e FRONTEND_URL são obrigatórios.",
        );
        return reply.status(503).send({ message: "Recuperação de senha indisponível no momento." });
      }

      const { rows } = await pool.query<{ id: string }>(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND active = true",
        [parsed.data.email],
      );

      if (rows[0]) {
        const token = randomBytes(32).toString("hex");
        const tokenHash = hashResetToken(token);
        const resetUrl = new URL("/redefinir-senha", config.FRONTEND_URL);
        resetUrl.searchParams.set("token", token);

        await pool.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [rows[0].id]);
        await pool.query(
          `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
           VALUES ($1, $2, now() + interval '30 minutes')`,
          [tokenHash, rows[0].id],
        );

        try {
          await mailer.sendMail({
            from: config.SMTP_FROM,
            to: parsed.data.email,
            subject: "Redefinição de senha — Portal Astrotur",
            text: `Recebemos uma solicitação para redefinir sua senha. Acesse este link nos próximos 30 minutos: ${resetUrl.toString()}\n\nSe você não solicitou a redefinição, ignore este e-mail.`,
            html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${resetUrl.toString()}">Criar uma nova senha</a></p><p>O link expira em 30 minutos. Se você não solicitou a redefinição, ignore este e-mail.</p>`,
          });
        } catch (error) {
          await pool.query("DELETE FROM password_reset_tokens WHERE token_hash = $1", [tokenHash]);
          req.log.error({ err: error }, "Falha ao enviar e-mail de redefinição de senha.");
          return reply
            .status(503)
            .send({ message: "Não foi possível enviar o e-mail. Tente novamente mais tarde." });
        }
      }

      return reply.send({
        message:
          "Se o e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.",
      });
    },
  );

  fastify.post(
    "/password-reset/confirm",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ message: "Token inválido ou senha fora dos requisitos." });
      }

      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const { rows } = await pool.query<{ id: string }>(
        `WITH valid_token AS (
         UPDATE password_reset_tokens
         SET used_at = now()
         WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
         RETURNING user_id
       )
       UPDATE users
       SET password_hash = $2
       FROM valid_token
       WHERE users.id = valid_token.user_id AND users.active = true
       RETURNING users.id`,
        [hashResetToken(parsed.data.token), passwordHash],
      );

      if (!rows[0]) {
        return reply
          .status(400)
          .send({ message: "Link inválido ou expirado. Solicite uma nova redefinição." });
      }

      return reply.send({ message: "Senha redefinida com sucesso. Faça login com a nova senha." });
    },
  );

  // 3. Rota de Validação de Sessão (URL final: /api/auth/me)
  fastify.get("/me", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ message: "Não autorizado." });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = fastify.jwt.verify<{ sub: string }>(token);

      const { rows } = await pool.query("SELECT id, name, email, role, setor FROM users WHERE id = $1", [
        decoded.sub,
      ]);

      if (rows.length === 0) {
        return reply.status(401).send({ message: "Usuário não encontrado." });
      }

      return reply.send({ user: rows[0] });
    } catch (err) {
      return reply.status(401).send({ message: "Sessão expirada ou inválida." });
    }
  });
}
