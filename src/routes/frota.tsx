import { createFileRoute } from "@tanstack/react-router";
import { PortalLayout } from "@/components/PortalLayout";
import { FleetCard } from "@/components/FleetCard";
import { StatCard } from "@/components/StatCard";
import { featuredVehicle, fleetStats } from "@/data/mockData";

export const Route = createFileRoute("/frota")({
  head: () => ({
    meta: [
      { title: "Frota Astrotur — Portal Corporativo" },
      {
        name: "description",
        content:
          "Indicadores operacionais e veículos em destaque da frota da Astrotur Viagens e Turismo.",
      },
      { property: "og:title", content: "Frota Astrotur — Portal Corporativo" },
      {
        property: "og:description",
        content: "Acompanhe os veículos e indicadores operacionais da Astrotur.",
      },
    ],
  }),
  component: FleetPage,
});

function FleetPage() {
  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Frota Astrotur
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe os veículos e indicadores operacionais da nossa frota.
          </p>
        </header>

        <FleetCard vehicle={featuredVehicle} />

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Indicadores da frota
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fleetStats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}
