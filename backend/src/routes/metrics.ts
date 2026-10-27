import type { FastifyPluginAsync } from "fastify";
import { config } from "../config.js";
import { pool } from "../db.js";

interface Metric {
  label: string;
  value: string;
}

// Busca métricas em um sistema externo; retorna null se não configurado ou indisponível.
// Contrato esperado: GET <url>?scope=all|mine&user=<email> -> { metrics: [{label, value}] }
async function fetchExternal(baseUrl: string | undefined, scope: string, email: string): Promise<Metric[] | null> {
  if (!baseUrl) return null;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set("scope", scope);
    url.searchParams.set("user", email);
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { metrics?: Metric[] };
    return Array.isArray(data.metrics) ? data.metrics : null;
  } catch {
    return null;
  }
}

const fallback = {
  patrimonio: {
    gestor: [
      { label: "Patrimônios cadastrados", value: "—" },
      { label: "Última atualização", value: "—" },
    ],
    usuario: [
      { label: "Meus patrimônios", value: "—" },
      { label: "Última atualização", value: "—" },
    ],
  },
  helpdesk: {
    gestor: [
      { label: "Chamados abertos", value: "—" },
      { label: "Em atendimento", value: "—" },
    ],
    usuario: [
      { label: "Meus chamados abertos", value: "—" },
      { label: "Em atendimento", value: "—" },
    ],
  },
};

export const metricsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async (req) => {
    const role: "gestor" | "usuario" = req.user.role === "gestor" ? "gestor" : "usuario";
    const scope = role === "gestor" ? "all" : "mine";
    const { rows } = await pool.query<{ email: string }>("SELECT email FROM users WHERE id = $1", [req.user.sub]);
    const email = rows[0]?.email ?? "";

    const [patrimonio, helpdesk] = await Promise.all([
      fetchExternal(config.PATRIMONIO_API_URL, scope, email),
      fetchExternal(config.HELPDESK_API_URL, scope, email),
    ]);

    return {
      patrimonio: patrimonio ?? fallback.patrimonio[role],
      helpdesk: helpdesk ?? fallback.helpdesk[role],
    };
  });
};
