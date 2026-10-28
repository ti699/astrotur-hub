import { API_URL, api, getToken } from "@/lib/api";

/**
 * Configuração central dos sistemas internos da Astrotur.
 * Alterar a URL aqui reflete em todo o portal (cards, sidebar, acesso rápido).
 * Suporta override por variável de ambiente (Vite) para futuros ambientes.
 */

export type SystemKey = "patrimonio" | "helpdesk";

export interface SystemConfig {
  key: SystemKey;
  name: string;
  category: string;
  description: string;
  url: string;
  ctaLabel: string;
  external: true;
}

const env = import.meta.env as Record<string, string | undefined>;

export const SYSTEMS: Record<SystemKey, SystemConfig> = {
  patrimonio: {
    key: "patrimonio",
    name: "Patrimônio Astrotur",
    category: "Gestão de Patrimônio",
    description: "Controle, organização e acompanhamento dos patrimônios da Astrotur.",
    url: env["VITE_PATRIMONIO_URL"] ?? "https://187.127.0.219:8081",
    ctaLabel: "Acessar Patrimônio Astrotur",
    external: true,
  },
  helpdesk: {
    key: "helpdesk",
    name: "HelpDesk",
    category: "Suporte e Chamados de TI",
    description:
      "Abra chamados, acompanhe solicitações e encontre suporte para problemas de tecnologia.",
    url: env["VITE_HELPDESK_URL"] ?? "https://187.127.0.219:8082",
    ctaLabel: "Acessar HelpDesk",
    external: true,
  },
};

interface SsoTicketResponse {
  ticket: string;
  expires_in: number;
}

function isLocalHttpUrl(value: string) {
  const parsed = new URL(value);
  return parsed.protocol === "http:" && ["localhost", "127.0.0.1"].includes(parsed.hostname);
}

/** Cria um ticket SSO e abre o destino sem expor o JWT no navegador de destino. */
export async function openSystem(system: Pick<SystemConfig, "key" | "url">) {
  if (!getToken()) {
    window.location.assign("/login");
    return;
  }

  const apiUrl = new URL(API_URL);
  if (apiUrl.protocol !== "https:" && !isLocalHttpUrl(API_URL)) {
    throw new Error("O acesso SSO exige uma API do Hub configurada com HTTPS.");
  }
  const destinationUrl = new URL("/sso", system.url);
  if (destinationUrl.protocol !== "https:") {
    throw new Error("O sistema de destino SSO precisa estar configurado com HTTPS.");
  }

  const destination = window.open("about:blank", "_blank");
  if (!destination) {
    throw new Error("Permita a abertura de novas abas para acessar o sistema.");
  }
  destination.opener = null;

  try {
    const { ticket } = await api<SsoTicketResponse>("/api/sso/ticket", {
      method: "POST",
      body: JSON.stringify({ target_system: system.key }),
    });
    destinationUrl.searchParams.set("ticket", ticket);
    destination.location.replace(destinationUrl.toString());
  } catch (error) {
    destination.close();
    throw error;
  }
}
