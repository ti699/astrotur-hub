import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

export async function authRoutes(fastify: FastifyInstance) {

  // 1. Rota de Login (URL final: /api/auth/login)
  fastify.post("/login", async (req: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return reply.status(400).send({ message: "E-mail e senha são obrigatórios." });
    }

    try {
      const { rows } = await pool.query(
        "SELECT id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1) AND active = true",
        [email]
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
      const token = fastify.jwt.sign(
        {
          sub: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      );

      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro interno no servidor ao realizar login." });
    }
  });

  // 2. Rota de Cadastro (URL final: /api/auth/cadastro)
  fastify.post("/cadastro", async (req: FastifyRequest, reply: FastifyReply) => {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

    if (!name || !email || !password) {
      return reply.status(400).send({ message: "Nome, e-mail e senha são obrigatórios." });
    }

    try {
      const { rows: existing } = await pool.query(
        "SELECT id FROM users WHERE LOWER(email) = LOWER($1)",
        [email]
      );

      if (existing.length > 0) {
        return reply.status(400).send({ message: "E-mail já cadastrado no sistema." });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      
      // Regra de atribuição automática do perfil master para o e-mail de TI
      const defaultRole = "usuario";

      const { rows } = await pool.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
        [name, email, passwordHash, defaultRole]
      );

      const newUser = rows[0];

      const token = fastify.jwt.sign(
        {
          sub: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      );

      return reply.status(201).send({
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    } catch (err) {
      req.log.error(err);
      return reply.status(500).send({ message: "Erro ao criar conta." });
    }
  });

  // 3. Rota de Validação de Sessão (URL final: /api/auth/me)
  fastify.get("/me", async (req: FastifyRequest, reply: FastifyReply) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reply.status(401).send({ message: "Não autorizado." });
    }

    try {
      const token = authHeader.split(" ")[1];
      const decoded = fastify.jwt.verify<{ sub: string }>(token);

      const { rows } = await pool.query(
        "SELECT id, name, email, role FROM users WHERE id = $1",
        [decoded.sub]
      );

      if (rows.length === 0) {
        return reply.status(401).send({ message: "Usuário não encontrado." });
      }

      return reply.send({ user: rows[0] });
    } catch (err) {
      return reply.status(401).send({ message: "Sessão expirada ou inválida." });
    }
  });
}