import { z } from "zod";

// Origens padrão: frontend em produção e ambiente local
const DEFAULT_ORIGINS = [
  "http://187.127.0.219:8080",
  "http://localhost:8080",
  "http://localhost:3000",
];

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().default(3002),
    HOST: z.string().default("0.0.0.0"),
    JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter ao menos 32 caracteres"),
    JWT_EXPIRES_IN: z.string().default("8h"),
    // Origens extras, separadas por vírgula (somadas às padrão)
    CORS_ORIGINS: z.string().default(""),
    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
    ADMIN_EMAIL: z.string().email().default("admin@astrotur.com.br"),
    ADMIN_PASSWORD: z.string().min(8).optional(),
    PATRIMONIO_API_URL: z.string().optional(),
    HELPDESK_API_URL: z.string().optional(),
    PATRIMONIO_SSO_CLIENT_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(32, "PATRIMONIO_SSO_CLIENT_SECRET deve ter ao menos 32 caracteres").optional(),
    ),
    HELPDESK_SSO_CLIENT_SECRET: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(32, "HELPDESK_SSO_CLIENT_SECRET deve ter ao menos 32 caracteres").optional(),
    ),
  })
  .refine(
    ({ PATRIMONIO_SSO_CLIENT_SECRET, HELPDESK_SSO_CLIENT_SECRET }) =>
      !PATRIMONIO_SSO_CLIENT_SECRET ||
      !HELPDESK_SSO_CLIENT_SECRET ||
      PATRIMONIO_SSO_CLIENT_SECRET !== HELPDESK_SSO_CLIENT_SECRET,
    { message: "Os segredos SSO dos sistemas devem ser diferentes." },
  );

export const config = schema.parse(process.env);

export const corsOrigins = [
  ...new Set([
    ...DEFAULT_ORIGINS,
    ...config.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ]),
];
