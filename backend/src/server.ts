import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";
import { config, corsOrigins } from "./config.js";
import { pool } from "./db.js";
import { authRoutes } from "./routes/auth.js";
import { userRoutes } from "./routes/users.js";
import { meRoutes } from "./routes/me.js";
import { metricsRoutes } from "./routes/metrics.js";
import type { Role } from "./db.js";

// 1. Amplia a interface do JWT para trafegar sub, role, name e email
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { 
      sub: string; 
      role: Role | string; 
      name?: string; 
      email?: string; 
    };
    user: { 
      sub: string; 
      role: Role | string; 
      name?: string; 
      email?: string; 
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (req: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
    requireGestor: (req: import("fastify").FastifyRequest, reply: import("fastify").FastifyReply) => Promise<void>;
  }
}

const app = Fastify({
  logger: true,
  trustProxy: true, // atrás do Nginx
});

await app.register(helmet);
await app.register(cors, {
  origin: corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
await app.register(jwt, {
  secret: config.JWT_SECRET,
  sign: { expiresIn: config.JWT_EXPIRES_IN },
});

// Middleware de Autenticação Geral
app.decorate("authenticate", async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Não autenticado." });
  }
});

// 2. Middleware Hierárquico: permite acesso para 'gestor' E 'master'
app.decorate("requireGestor", async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    return reply.code(401).send({ error: "Não autenticado." });
  }
  
  const role = req.user.role?.toLowerCase();
  if (role !== "gestor" && role !== "master") {
    return reply.code(403).send({ error: "Acesso restrito a gestores e administradores." });
  }
});

app.get("/api/health", async () => {
  await pool.query("SELECT 1");
  return { status: "ok" };
});

// 3. Registro dos Plugins com seus respectivos prefixos
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(meRoutes, { prefix: "/api/me" });
await app.register(userRoutes, { prefix: "/api/admin/users" });
await app.register(metricsRoutes, { prefix: "/api/metrics" });

app.setErrorHandler((err: Error & { statusCode?: number; validation?: unknown }, req, reply) => {
  if (err.name === "ZodError") {
    return reply.code(400).send({ error: "Dados inválidos.", details: (err as unknown as { issues: unknown }).issues });
  }
  req.log.error(err);
  const status = err.statusCode ?? 500;
  reply.code(status).send({ error: status >= 500 ? "Erro interno." : err.message });
});

const shutdown = async () => {
  await app.close();
  await pool.end();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await app.listen({ port: config.PORT, host: "0.0.0.0" });