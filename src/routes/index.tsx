import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LifeBuoy, Loader2, ShieldCheck } from "lucide-react";
import { PortalLayout } from "@/components/PortalLayout";
import { SystemCard } from "@/components/SystemCard";
import { QuickAccess } from "@/components/QuickAccess";
import { useEffect, useState } from "react";
import { SYSTEMS } from "@/config/systems";
import type { SystemMetrics } from "@/data/mockData";
import { api, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getToken()) {
      throw redirect({
        to: "/login",
      });
    }
  },

  head: () => ({
    meta: [
      { title: "Portal Astrotur — Portal Corporativo" },
      {
        name: "description",
        content:
          "Acesso central aos sistemas internos da Astrotur: Patrimônio Astrotur e HelpDesk.",
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
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<{
    patrimonio: SystemMetrics[];
    helpdesk: SystemMetrics[];
  }>({ patrimonio: [], helpdesk: [] });

  useEffect(() => {
    if (!isLoading && !user) {
      void navigate({ to: "/login", replace: true });
    }
  }, [isLoading, navigate, user]);

  useEffect(() => {
    if (!user) return;
    api<typeof metrics>("/api/metrics")
      .then(setMetrics)
      .catch(() => setMetrics({ patrimonio: [], helpdesk: [] }));
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="sr-only">Validando sessão...</span>
      </div>
    );
  }

  const patrimonioMetrics = metrics.patrimonio;
  const helpdeskMetrics = metrics.helpdesk;

  return (
    <PortalLayout>
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Olá, {user?.name ?? "Usuário"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bem-vindo ao Portal Corporativo Astrotur. Acesse rapidamente os sistemas e acompanhe
            informações da nossa operação.
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Sistemas internos
          </h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <SystemCard
              name={SYSTEMS.patrimonio.name}
              category={SYSTEMS.patrimonio.category}
              description={SYSTEMS.patrimonio.description}
              icon={ShieldCheck}
              metrics={patrimonioMetrics}
              system={SYSTEMS.patrimonio}
              ctaLabel={SYSTEMS.patrimonio.ctaLabel}
              accent="primary"
            />
            <SystemCard
              name={SYSTEMS.helpdesk.name}
              category={SYSTEMS.helpdesk.category}
              description={SYSTEMS.helpdesk.description}
              icon={LifeBuoy}
              metrics={helpdeskMetrics}
              system={SYSTEMS.helpdesk}
              ctaLabel={SYSTEMS.helpdesk.ctaLabel}
              accent="dark"
            />
          </div>
        </section>

        <QuickAccess />
      </div>
    </PortalLayout>
  );
}
