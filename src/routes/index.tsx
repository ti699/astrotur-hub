import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { SystemCard } from "@/components/SystemCard";
import { FleetCard } from "@/components/FleetCard";
import { StatCard } from "@/components/StatCard";
import { QuickAccess } from "@/components/QuickAccess";
import { SYSTEMS } from "@/config/systems";
import {
  currentUser,
  featuredVehicle,
  fleetStats,
  helpdeskMetrics,
  patriguardMetrics,
} from "@/data/mockData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portal Astrotur — Portal Corporativo" },
      {
        name: "description",
        content:
          "Acesso central aos sistemas internos da Astrotur: PatriGuard, HelpDesk e informações da frota.",
      },
      { property: "og:title", content: "Portal Astrotur — Portal Corporativo" },
      {
        property: "og:description",
        content:
          "Porta de entrada oficial para os sistemas internos da Astrotur Viagens e Turismo.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Olá, {currentUser.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bem-vindo ao Portal Corporativo Astrotur. Acesse rapidamente os
            sistemas e acompanhe informações da nossa operação.
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sistemas internos
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <SystemCard
              name={SYSTEMS.patriguard.name}
              category={SYSTEMS.patriguard.category}
              description={SYSTEMS.patriguard.description}
              icon={ShieldCheck}
              metrics={patriguardMetrics}
              url={SYSTEMS.patriguard.url}
              ctaLabel={SYSTEMS.patriguard.ctaLabel}
              accent="primary"
            />
            <SystemCard
              name={SYSTEMS.helpdesk.name}
              category={SYSTEMS.helpdesk.category}
              description={SYSTEMS.helpdesk.description}
              icon={LifeBuoy}
              metrics={helpdeskMetrics}
              url={SYSTEMS.helpdesk.url}
              ctaLabel={SYSTEMS.helpdesk.ctaLabel}
              accent="dark"
            />
          </div>
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Frota Astrotur
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acompanhe um dos veículos da nossa operação.
            </p>
          </div>
          <FleetCard vehicle={featuredVehicle} />

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fleetStats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </section>

        <QuickAccess />
      </div>
    </PortalLayout>
  );
}
