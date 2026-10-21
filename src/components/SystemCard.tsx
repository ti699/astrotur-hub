import { ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SystemMetrics } from "@/data/mockData";
import { openSystem } from "@/config/systems";

interface SystemCardProps {
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  metrics: SystemMetrics[];
  url: string;
  ctaLabel: string;
  accent?: "primary" | "dark";
}

export function SystemCard({
  name,
  category,
  description,
  icon: Icon,
  metrics,
  url,
  ctaLabel,
  accent = "primary",
}: SystemCardProps) {
  const dark = accent === "dark";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift md:p-8",
        dark
          ? "border-foreground/80 bg-foreground text-background"
          : "border-border bg-card text-foreground",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-1",
          dark ? "bg-primary" : "bg-primary/80",
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105",
            dark ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium",
            dark
              ? "border-background/25 text-background/70"
              : "border-border text-muted-foreground",
          )}
        >
          Sistema externo <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>

      <h3 className="mt-6 text-2xl font-bold tracking-tight">{name}</h3>
      <p
        className={cn(
          "mt-1 text-sm font-medium",
          dark ? "text-primary" : "text-primary",
        )}
      >
        {category}
      </p>
      <p
        className={cn(
          "mt-3 max-w-sm text-sm leading-relaxed",
          dark ? "text-background/70" : "text-muted-foreground",
        )}
      >
        {description}
      </p>

      <dl
        className={cn(
          "mt-6 grid grid-cols-2 gap-4 border-t pt-5",
          dark ? "border-background/15" : "border-border",
        )}
      >
        {metrics.map((m) => (
          <div key={m.label}>
            <dt
              className={cn(
                "text-[11px] uppercase tracking-wider",
                dark ? "text-background/55" : "text-muted-foreground",
              )}
            >
              {m.label}
            </dt>
            <dd className="mt-1 text-xl font-semibold">{m.value}</dd>
          </div>
        ))}
      </dl>

      <button
        onClick={() => openSystem(url)}
        className={cn(
          "mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
          dark
            ? "bg-background text-foreground hover:bg-background/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
        )}
      >
        {ctaLabel}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    </article>
  );
}
