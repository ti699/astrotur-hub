/**
 * Dados mockados do portal.
 * Substituir futuramente por chamadas de API (PatriGuard, HelpDesk).
 */

export interface SystemMetrics {
  label: string;
  value: string;
}

export const patriguardMetrics: SystemMetrics[] = [
  { label: "Patrimônios cadastrados", value: "1.248" },
  { label: "Última atualização", value: "Hoje" },
];

export const helpdeskMetrics: SystemMetrics[] = [
  { label: "Chamados abertos", value: "12" },
  { label: "Em atendimento", value: "4" },
];

export const currentUser = {
  name: "Administrador",
  role: "Gestor",
  initials: "A",
};
