import type { FastifyBaseLogger } from "fastify";
import { config } from "./config.js";
import { isCorporateEmail } from "./email.js";

interface HubUser {
  name: string;
  email: string;
  role: string;
  setor: string;
}

export function syncUserFromHub(user: HubUser, log: FastifyBaseLogger): void {
  if (!isCorporateEmail(user.email)) {
    log.warn({ email: user.email }, "Sincronização bloqueada para e-mail fora dos domínios corporativos.");
    return;
  }

  const { PATRIMONIO_API_URL, PATRIMONIO_SSO_CLIENT_SECRET } = config;
  if (!PATRIMONIO_API_URL || !PATRIMONIO_SSO_CLIENT_SECRET) return;

  const url = `${PATRIMONIO_API_URL.replace(/\/+$/, "")}/api/users/sync-from-hub`;
  void fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-sso-secret": PATRIMONIO_SSO_CLIENT_SECRET,
    },
    body: JSON.stringify({
      nome: user.name,
      email: user.email,
      role: user.role,
      setor: user.setor,
    }),
    signal: AbortSignal.timeout(5000),
  }).then((response) => {
    if (!response.ok) {
      log.warn({ statusCode: response.status }, "Falha ao sincronizar usuário com Patrimônio.");
    }
  }).catch((error: unknown) => {
    log.warn({ err: error }, "Falha ao sincronizar usuário com Patrimônio.");
  });
}
