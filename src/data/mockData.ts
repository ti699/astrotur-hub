/**
 * Dados mockados do portal.
 * Substituir futuramente por chamadas de API (PatriGuard, HelpDesk, Frota).
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

export interface FeaturedVehicle {
  code: string;
  status: string;
  statusTone: "operating" | "garage" | "maintenance";
  model: string;
  capacity: string;
  line: string;
}

export const featuredVehicle: FeaturedVehicle = {
  code: "AST-001",
  status: "Em operação",
  statusTone: "operating",
  model: "Ônibus rodoviário — Black Edition",
  capacity: "46 passageiros",
  line: "Fretamento executivo",
};

export interface FleetStat {
  value: string;
  label: string;
  highlight?: boolean;
}

export const fleetStats: FleetStat[] = [
  { value: "154", label: "Veículos na frota", highlight: true },
  { value: "80", label: "Em operação" },
  { value: "68", label: "Na garagem" },
  { value: "6", label: "Em manutenção" },
];

export const currentUser = {
  name: "Administrador",
  role: "Gestor",
  initials: "A",
};
