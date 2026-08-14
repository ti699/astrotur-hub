/**
 * Configuração central dos sistemas internos da Astrotur.
 * Alterar a URL aqui reflete em todo o portal (cards, sidebar, acesso rápido).
 * Suporta override por variável de ambiente (Vite) para futuros ambientes.
 */

export type SystemKey = "patriguard" | "helpdesk";

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
  patriguard: {
    key: "patriguard",
    name: "PatriGuard",
    category: "Gestão de Patrimônio",
    description:
      "Controle, organização e acompanhamento dos patrimônios da Astrotur.",
    url: env["VITE_PATRI_GUARD_URL"] ?? "https://patriguard.vercel.app/",
    ctaLabel: "Acessar PatriGuard",
    external: true,
  },
  helpdesk: {
    key: "helpdesk",
    name: "HelpDesk",
    category: "Suporte e Chamados de TI",
    description:
      "Abra chamados, acompanhe solicitações e encontre suporte para problemas de tecnologia.",
    url:
      env["VITE_HELPDESK_URL"] ?? "https://astrotur-helpdesk.vercel.app/dashboard",
    ctaLabel: "Acessar HelpDesk",
    external: true,
  },
};

/** Abertura segura de sistemas externos (sem iframe, sem opener). */
export function openSystem(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
