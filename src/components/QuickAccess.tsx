import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Bus, Headset, LifeBuoy, ShieldCheck } from "lucide-react";
import { SYSTEMS, openSystem } from "@/config/systems";

const shortcuts = [
  {
    label: SYSTEMS.patriguard.name,
    hint: "Gestão de Patrimônio",
    icon: ShieldCheck,
    url: SYSTEMS.patriguard.url,
  },
  {
    label: SYSTEMS.helpdesk.name,
    hint: "Chamados e Suporte de TI",
    icon: LifeBuoy,
    url: SYSTEMS.helpdesk.url,
  },
  { label: "Frota", hint: "Veículos e indicadores", icon: Bus, to: "/frota" },
  {
    label: "Contatos de TI",
    hint: "Ramais e suporte interno",
    icon: Headset,
    url: SYSTEMS.helpdesk.url,
  },
] as const;

const itemClass =
  "group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all duration-200 hover:border-neutral-mid hover:shadow-soft";

export function QuickAccess() {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Acesso rápido
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => {
          const content = (
            <>
              <s.icon className="h-4.5 w-4.5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {s.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {s.hint}
                </span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </>
          );

          return "to" in s ? (
            <Link key={s.label} to={s.to} className={itemClass}>
              {content}
            </Link>
          ) : (
            <button
              key={s.label}
              onClick={() => openSystem(s.url)}
              className={itemClass}
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
