import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Bus, ShieldCheck, LifeBuoy, ArrowUpRight, X } from "lucide-react";
import { SYSTEMS, openSystem } from "@/config/systems";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Início", to: "/", icon: Home },
  { label: "Frota", to: "/frota", icon: Bus },
];

const systemItems = [
  { config: SYSTEMS.patriguard, icon: ShieldCheck },
  { config: SYSTEMS.helpdesk, icon: LifeBuoy },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-6 py-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-1.5 rounded-full bg-sidebar-primary" />
            <span className="text-xl font-bold tracking-[0.18em] text-sidebar-accent-foreground">
              ASTROTUR
            </span>
          </div>
          <p className="mt-1.5 pl-3.5 text-xs uppercase tracking-[0.22em] text-sidebar-foreground/60">
            Portal Corporativo
          </p>
        </div>
        {onNavigate && (
          <button
            onClick={onNavigate}
            aria-label="Fechar menu"
            className="rounded-md p-1.5 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <div className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/45">
            Sistemas internos
          </p>
          <div className="space-y-1">
            {systemItems.map(({ config, icon: Icon }) => (
              <button
                key={config.key}
                onClick={() => {
                  openSystem(config.url);
                  onNavigate?.();
                }}
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/75 transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <Icon className="h-4.5 w-4.5 text-sidebar-primary" />
                <span className="flex-1">{config.name}</span>
                <ArrowUpRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-70" />
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-6 py-5">
        <p className="text-xs text-sidebar-foreground/50">
          Astrotur Viagens e Turismo
          <br />
          Desde 1991
        </p>
      </div>
    </div>
  );
}
