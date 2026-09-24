/**
 * Dados mockados do portal.
 * Substituir futuramente por chamadas de API (PatriGuard, HelpDesk).
 */

export interface SystemMetrics {
  label: string;
  value: string;
}

// Métricas visíveis somente para administradores (visão geral)
export const patriguardMetricsAdmin: SystemMetrics[] = [
  { label: "Patrimônios cadastrados", value: "1.248" },
  { label: "Última atualização", value: "Hoje" },
];

export const helpdeskMetricsAdmin: SystemMetrics[] = [
  { label: "Chamados abertos", value: "12" },
  { label: "Em atendimento", value: "4" },
];

// Métricas visíveis para usuários comuns (somente seus dados)
export const patriguardMetricsUser: SystemMetrics[] = [
  { label: "Meus patrimônios", value: "3" },
  { label: "Última atualização", value: "Hoje" },
];

export const helpdeskMetricsUser: SystemMetrics[] = [
  { label: "Meus chamados abertos", value: "2" },
  { label: "Em atendimento", value: "1" },
];

// Mantido por compatibilidade com outros usos
export const patriguardMetrics = patriguardMetricsAdmin;
export const helpdeskMetrics = helpdeskMetricsAdmin;

export const currentUser = {
  name: "Administrador",
  role: "Gestor",
  initials: "A",
};
